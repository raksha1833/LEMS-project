USE law_enforcement;

--   TRIGGERS  (4 triggers)

-- TRIGGER 1: Auto-create CrimeCase when FIR is filed

DELIMITER $$

CREATE TRIGGER trg_auto_create_case_after_fir
AFTER INSERT ON FIR
FOR EACH ROW
BEGIN
    DECLARE new_case_id INT;

    -- Create the CrimeCase linked to this FIR
    INSERT INTO CrimeCase (
        fir_id,
        date_opened,
        status,
        priority,
        summary
    )
    VALUES (
        NEW.fir_id,
        NOW(),
        'open',
        'medium',
        CONCAT(
            'Case auto-created from FIR #', NEW.fir_id,
            '. Complainant: ', NEW.complainant_name,
            '. Incident at: ', NEW.incident_location
        )
    );

    SET new_case_id = LAST_INSERT_ID();

    -- Assign the registering officer as lead
    INSERT INTO CaseOfficer (case_id, officer_id, role)
    VALUES (new_case_id, NEW.officer_id, 'lead');

    -- Log the case creation in InvestigationLog
    INSERT INTO InvestigationLog (
        case_id,
        officer_id,
        action_taken,
        action_date,
        remarks
    )
    VALUES (
        new_case_id,
        NEW.officer_id,
        'Case opened',
        NOW(),
        CONCAT('Case auto-created from FIR #', NEW.fir_id,
               '. Status set to open.')
    );
END$$

DELIMITER ;


-- -------------------------------------------------------
-- TRIGGER 2: Block evidence deletion if case is active

DELIMITER $$

CREATE TRIGGER trg_block_evidence_delete_on_active_case
BEFORE DELETE ON Evidence
FOR EACH ROW
BEGIN
    DECLARE current_status VARCHAR(30);

    SELECT status
    INTO current_status
    FROM CrimeCase
    WHERE case_id = OLD.case_id;

    IF current_status IN ('open', 'investigating', 'pending_trial') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'ERROR: Cannot delete evidence for an active case.';
    END IF;
END$$

DELIMITER ;


-- -------------------------------------------------------
-- TRIGGER 3: Update case status when all suspects arrested

DELIMITER $$

CREATE TRIGGER trg_update_case_status_when_all_suspects_arrested
AFTER UPDATE ON CaseSuspect
FOR EACH ROW
BEGIN
    DECLARE total_suspects    INT;
    DECLARE arrested_suspects INT;

    -- Only act when is_arrested flips from FALSE to TRUE
    IF NEW.is_arrested = TRUE AND OLD.is_arrested = FALSE THEN

        SELECT COUNT(*)
        INTO total_suspects
        FROM CaseSuspect
        WHERE case_id = NEW.case_id;

        SELECT COUNT(*)
        INTO arrested_suspects
        FROM CaseSuspect
        WHERE case_id   = NEW.case_id
          AND is_arrested = TRUE;

        -- If every suspect is now arrested, escalate case
        IF total_suspects > 0 AND total_suspects = arrested_suspects THEN
            UPDATE CrimeCase
            SET status = 'pending_trial'
            WHERE case_id = NEW.case_id
              AND status IN ('open', 'investigating');
        END IF;

    END IF;
END$$

DELIMITER ;


-- -------------------------------------------------------
-- TRIGGER 4: Auto-log case status changes to
--            InvestigationLog  [NEW]
--
-- Purpose: Every time a case's status changes,
--          automatically record it in InvestigationLog.
--          This gives InvestigationLog a meaningful role
--          throughout the entire case lifecycle — not just
--          at closure.
--
-- Fires: AFTER UPDATE on CrimeCase
--        Only when status column actually changes.
-- -------------------------------------------------------
DELIMITER $$

CREATE TRIGGER trg_log_case_status_change
AFTER UPDATE ON CrimeCase
FOR EACH ROW
BEGIN
    DECLARE v_lead_officer_id INT DEFAULT NULL;

    -- Only fire when status actually changes
    IF OLD.status <> NEW.status THEN

        -- Get the current lead officer for this case
        SELECT officer_id
        INTO v_lead_officer_id
        FROM CaseOfficer
        WHERE case_id = NEW.case_id
          AND role    = 'lead'
        LIMIT 1;

        -- Only insert if we have a valid lead officer
        -- (guard against edge case of no lead assigned)
        IF v_lead_officer_id IS NOT NULL THEN
            INSERT INTO InvestigationLog (
                case_id,
                officer_id,
                action_taken,
                action_date,
                remarks
            )
            VALUES (
                NEW.case_id,
                v_lead_officer_id,
                CONCAT(
                    'Status changed: ',
                    OLD.status, ' → ', NEW.status
                ),
                NOW(),
                'Auto-logged by system trigger trg_log_case_status_change'
            );
        END IF;

    END IF;
END$$

DELIMITER ;


-- ============================================================
-- VERIFY ALL 4 TRIGGERS CREATED
-- ============================================================
SHOW TRIGGERS FROM law_enforcement;
