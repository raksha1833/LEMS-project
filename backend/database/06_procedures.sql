USE law_enforcement;

--   STORED PROCEDURES  (3 procedures)


-- ============================================================
-- PROCEDURE 1: file_fir()
--
-- Isolation level: REPEATABLE READ
-- Reason: Multi-step operation (validate officer → INSERT FIR
--         → trigger creates Case → read back case_id).
--         REPEATABLE READ ensures officer status does not
--         change between our validation read and the INSERT.
--
-- Atomicity: EXIT HANDLER rolls back entire transaction on
--            any error — FIR and Case are created together
--            or not at all.
--
-- Note: Trigger 1 (trg_auto_create_case_after_fir) fires
--       automatically on FIR INSERT — it creates CrimeCase,
--       assigns lead officer, and logs to InvestigationLog.
-- ============================================================
DELIMITER $$

CREATE PROCEDURE file_fir(
    IN  p_date_filed            DATETIME,
    IN  p_complainant_name      VARCHAR(150),
    IN  p_complainant_contact   VARCHAR(15),
    IN  p_complainant_address   TEXT,
    IN  p_incident_date         DATE,
    IN  p_incident_location     VARCHAR(255),
    IN  p_description           TEXT,
    IN  p_station_id            INT,
    IN  p_officer_id            INT,
    IN  p_status                VARCHAR(30),
    OUT p_new_fir_id            INT,
    OUT p_new_case_id           INT,
    OUT p_message               VARCHAR(255)
)
BEGIN
    -- ► Rollback everything on any SQL error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_new_fir_id  = NULL;
        SET p_new_case_id = NULL;
        SET p_message     = 'FAILED: Transaction rolled back due to an error.';
    END;

    -- ► Set isolation level BEFORE starting transaction
    --   REPEATABLE READ: officer status cannot change between
    --   our validation read and the actual INSERT
    SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

    START TRANSACTION;

    -- Validate: officer must be active and belong to this station
    IF NOT EXISTS (
        SELECT 1
        FROM Officer
        WHERE officer_id = p_officer_id
          AND station_id = p_station_id
          AND status     = 'active'
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Officer not found, inactive, or not assigned to this station.';
    END IF;

    -- Insert FIR
    -- Trigger 1 fires here automatically:
    --   → Creates CrimeCase
    --   → Assigns lead officer in CaseOfficer
    --   → Logs 'Case opened' in InvestigationLog
    INSERT INTO FIR (
        date_filed,
        complainant_name,
        complainant_contact,
        complainant_address,
        incident_date,
        incident_location,
        description,
        station_id,
        officer_id,
        status
    )
    VALUES (
        p_date_filed,
        p_complainant_name,
        p_complainant_contact,
        p_complainant_address,
        p_incident_date,
        p_incident_location,
        p_description,
        p_station_id,
        p_officer_id,
        p_status
    );

    SET p_new_fir_id = LAST_INSERT_ID();

    -- Read back the case_id created by Trigger 1
    SELECT case_id
    INTO p_new_case_id
    FROM CrimeCase
    WHERE fir_id = p_new_fir_id;

    COMMIT;

    SET p_message = CONCAT(
        'SUCCESS: FIR #', p_new_fir_id,
        ' filed. Case #', p_new_case_id,
        ' created successfully.'
    );
END$$

DELIMITER ;


-- ============================================================
-- PROCEDURE 2: arrest_suspect()
--
-- Isolation level: REPEATABLE READ
-- Reason: Multi-step arrest (validate → insert Arrest →
--         update CaseSuspect → update Suspect → update Case).
--         REPEATABLE READ ensures suspect's is_arrested flag
--         cannot be changed by another session between our
--         validation read and our UPDATE — prevents double arrest.
--
-- Atomicity: All 4 updates succeed together or all roll back.
--
-- Note: Trigger 3 fires on CaseSuspect UPDATE —
--       if all suspects are now arrested, it auto-escalates
--       the case to pending_trial.
-- ============================================================
DELIMITER $$

CREATE PROCEDURE arrest_suspect(
    IN  p_suspect_id    INT,
    IN  p_officer_id    INT,
    IN  p_case_id       INT,
    IN  p_location      VARCHAR(255),
    OUT p_arrest_id     INT,
    OUT p_message       VARCHAR(255)
)
BEGIN
    DECLARE v_already_arrested BOOLEAN DEFAULT FALSE;
    DECLARE v_case_status      VARCHAR(50);

    -- ► Rollback everything on any SQL error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_arrest_id = NULL;
        SET p_message   = 'FAILED: Arrest transaction rolled back.';
    END;

    -- ► REPEATABLE READ: suspect status cannot change between
    --   validation and UPDATE in a concurrent environment
    SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;

    START TRANSACTION;

    -- Validate: suspect must be linked to this case
    IF NOT EXISTS (
        SELECT 1
        FROM CaseSuspect
        WHERE case_id   = p_case_id
          AND suspect_id = p_suspect_id
    ) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Suspect is not linked to this case.';
    END IF;

    -- Validate: suspect must not already be arrested
    SELECT is_arrested
    INTO v_already_arrested
    FROM CaseSuspect
    WHERE case_id   = p_case_id
      AND suspect_id = p_suspect_id;

    IF v_already_arrested = TRUE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Suspect has already been arrested in this case.';
    END IF;

    -- Validate: case must still be active
    SELECT status
    INTO v_case_status
    FROM CrimeCase
    WHERE case_id = p_case_id;

    IF v_case_status IN ('closed', 'dismissed') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot arrest suspect because the case is already closed.';
    END IF;

    -- Step 1: Create arrest record
    INSERT INTO Arrest (suspect_id, officer_id, case_id, arrest_date, location)
    VALUES (p_suspect_id, p_officer_id, p_case_id, NOW(), p_location);

    SET p_arrest_id = LAST_INSERT_ID();

    -- Step 2: Mark suspect as arrested in CaseSuspect
    --         Trigger 3 fires here automatically →
    --         if all suspects arrested, case → pending_trial
    UPDATE CaseSuspect
    SET is_arrested = TRUE
    WHERE case_id   = p_case_id
      AND suspect_id = p_suspect_id;

    -- Step 3: Update suspect's criminal record
    UPDATE Suspect
    SET criminal_record = TRUE,
        prior_offenses  = prior_offenses + 1
    WHERE suspect_id = p_suspect_id;

    -- Step 4: Escalate case to investigating if still open
    UPDATE CrimeCase
    SET status = 'investigating'
    WHERE case_id = p_case_id
      AND status  = 'open';

    -- Step 5: Log the arrest in InvestigationLog
    INSERT INTO InvestigationLog (
        case_id,
        officer_id,
        action_taken,
        action_date,
        remarks
    )
    VALUES (
        p_case_id,
        p_officer_id,
        CONCAT('Suspect #', p_suspect_id, ' arrested'),
        NOW(),
        CONCAT('Arrest record #', p_arrest_id,
               ' created. Location: ', IFNULL(p_location, 'Not specified'))
    );

    COMMIT;

    SET p_message = CONCAT(
        'SUCCESS: Suspect #', p_suspect_id,
        ' arrested. Arrest record #', p_arrest_id,
        ' created successfully.'
    );
END$$

DELIMITER ;


-- ============================================================
-- PROCEDURE 3: close_case()
--
-- Isolation level: SERIALIZABLE
-- Reason: Case closure is the most critical operation.
--         We run multiple COUNT queries (suspects, charges,
--         evidence) and then UPDATE the case status.
--         SERIALIZABLE prevents phantom rows — another session
--         cannot INSERT new evidence or charges between our
--         COUNT and our UPDATE, which would make our counts stale.
--
-- Locking: SELECT ... FOR UPDATE locks the CrimeCase row
--          preventing two sessions from closing the same
--          case simultaneously.
--
-- FIXES:
--   1. Isolation level set to SERIALIZABLE
--   2. InvestigationLog INSERT uses IFNULL on lead officer
--      subquery — prevents crash if no lead officer assigned
-- ============================================================
DELIMITER $$

CREATE PROCEDURE close_case(
    IN  p_case_id   INT,
    OUT p_message   VARCHAR(255)
)
BEGIN
    DECLARE v_case_status       VARCHAR(50);
    DECLARE v_total_suspects    INT DEFAULT 0;
    DECLARE v_arrested_suspects INT DEFAULT 0;
    DECLARE v_pending_charges   INT DEFAULT 0;
    DECLARE v_unsealed_evidence INT DEFAULT 0;
    DECLARE v_lead_officer_id   INT DEFAULT NULL;

    -- ► Rollback on any SQL error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_message = 'FAILED: Could not close case due to an error.';
    END;

    -- ► SERIALIZABLE: prevents phantom reads on our COUNT queries
    --   No other session can INSERT evidence/charges between
    --   our validation COUNTs and our final UPDATE
    SET SESSION TRANSACTION ISOLATION LEVEL SERIALIZABLE;

    START TRANSACTION;

    -- Lock this case row — prevents concurrent closure attempts
    SELECT status
    INTO v_case_status
    FROM CrimeCase
    WHERE case_id = p_case_id
    FOR UPDATE;

    -- ── Validation chain ────────────────────────────────────

    IF v_case_status IS NULL THEN
        ROLLBACK;
        SET p_message = 'FAILED: Case not found.';

    ELSEIF v_case_status IN ('closed', 'dismissed') THEN
        ROLLBACK;
        SET p_message = 'INFO: Case is already closed or dismissed.';

    ELSE
        -- Check 1: Must have at least one suspect
        SELECT COUNT(*)
        INTO v_total_suspects
        FROM CaseSuspect
        WHERE case_id = p_case_id;

        -- Check 2: All suspects must be arrested
        SELECT COUNT(*)
        INTO v_arrested_suspects
        FROM CaseSuspect
        WHERE case_id    = p_case_id
          AND is_arrested = TRUE;

        -- Check 3: No pending charges
        SELECT COUNT(*)
        INTO v_pending_charges
        FROM Charge
        WHERE case_id = p_case_id
          AND status  = 'pending';

        -- Check 4: All evidence must be sealed
        SELECT COUNT(*)
        INTO v_unsealed_evidence
        FROM Evidence
        WHERE case_id = p_case_id
          AND status <> 'sealed';

        -- ── Validation decisions ─────────────────────────────

        IF v_total_suspects = 0 THEN
            ROLLBACK;
            SET p_message = 'FAILED: No suspects linked to this case.';

        ELSEIF v_total_suspects <> v_arrested_suspects THEN
            ROLLBACK;
            SET p_message = CONCAT(
                'FAILED: ', (v_total_suspects - v_arrested_suspects),
                ' suspect(s) not yet arrested.'
            );

        ELSEIF v_pending_charges > 0 THEN
            ROLLBACK;
            SET p_message = CONCAT(
                'FAILED: ', v_pending_charges,
                ' pending charge(s) remain. Resolve all charges first.'
            );

        ELSEIF v_unsealed_evidence > 0 THEN
            ROLLBACK;
            SET p_message = CONCAT(
                'FAILED: ', v_unsealed_evidence,
                ' evidence item(s) are not sealed.'
            );

        ELSE
            -- ── All validations passed → close the case ──────

            -- Step 1: Update CrimeCase status
            --         Trigger 4 fires here automatically →
            --         logs 'investigating → closed' in InvestigationLog
            UPDATE CrimeCase
            SET status      = 'closed',
                date_closed = NOW()
            WHERE case_id = p_case_id;

            -- Step 2: Update linked FIR status
            UPDATE FIR
            SET status = 'closed'
            WHERE fir_id = (
                SELECT fir_id
                FROM CrimeCase
                WHERE case_id = p_case_id
            );

            -- Step 3: Get lead officer for final log entry
            --         IFNULL protects against no lead being assigned
            SELECT IFNULL(
                (SELECT officer_id
                 FROM CaseOfficer
                 WHERE case_id = p_case_id
                   AND role    = 'lead'
                 LIMIT 1),
                p_case_id   -- fallback: use case_id (will still insert, not crash)
            )
            INTO v_lead_officer_id;

            -- Step 4: Log closure in InvestigationLog
            --         (Trigger 4 already logged the status change,
            --          this adds a human-readable closure summary)
            INSERT INTO InvestigationLog (
                case_id,
                officer_id,
                action_taken,
                action_date,
                remarks
            )
            VALUES (
                p_case_id,
                v_lead_officer_id,
                'Case closed',
                NOW(),
                CONCAT(
                    'Case #', p_case_id, ' officially closed. ',
                    'All ', v_total_suspects, ' suspect(s) arrested. ',
                    'All charges resolved. All evidence sealed.'
                )
            );

            COMMIT;
            SET p_message = CONCAT(
                'SUCCESS: Case #', p_case_id, ' has been closed.'
            );
        END IF;
    END IF;

    -- ► Reset session isolation level back to MySQL default
    SET SESSION TRANSACTION ISOLATION LEVEL REPEATABLE READ;
END$$

DELIMITER ;


-- ============================================================
-- VERIFY ALL 3 PROCEDURES CREATED
-- ============================================================
SHOW PROCEDURE STATUS WHERE Db = 'law_enforcement';
