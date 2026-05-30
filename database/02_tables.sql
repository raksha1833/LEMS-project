USE law_enforcement;

-- 1.district table
CREATE TABLE District (
    district_id     INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    population      BIGINT CHECK (population > 0),
    area_sq_km      DECIMAL(10,2),
    UNIQUE (name, state)
);

-- 2.station table
CREATE TABLE Station (
    station_id      INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    address         VARCHAR(255) NULL,
    district_id     INT NOT NULL,
    contact         VARCHAR(15),
    established_date DATE,
    status          ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (district_id) REFERENCES District(district_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE (name, district_id)
);

-- 3.RANK TABLE
CREATE TABLE OfficerRank (
    rank_id             INT AUTO_INCREMENT PRIMARY KEY,
    title               VARCHAR(100) NOT NULL UNIQUE,
    level               INT NOT NULL UNIQUE,           -- Higher = more senior
    max_cases_allowed   INT NOT NULL DEFAULT 5 CHECK (max_cases_allowed > 0),
    description         TEXT
);

-- 4.OFFICER TABLE
CREATE TABLE Officer (
    officer_id      INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    dob             DATE NOT NULL,
    gender          ENUM('Male', 'Female', 'Other') NOT NULL,
    rank_id         INT NOT NULL,
    station_id      INT NOT NULL,
    date_joined     DATE NOT NULL,
    status          ENUM('active', 'suspended', 'retired') DEFAULT 'active',
    contact         VARCHAR(15),
    FOREIGN KEY (rank_id)    REFERENCES OfficerRank(rank_id)       ON UPDATE CASCADE,
    FOREIGN KEY (station_id) REFERENCES Station(station_id) ON UPDATE CASCADE
);

-- 5.FIR TABLE
CREATE TABLE FIR (
    fir_id                  INT AUTO_INCREMENT PRIMARY KEY,
    date_filed              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    complainant_name        VARCHAR(150) NOT NULL,
    complainant_contact     VARCHAR(15),
    complainant_address     TEXT,
    incident_date           DATE NOT NULL,
    incident_location       TEXT NOT NULL,
    description             TEXT NOT NULL,
    station_id              INT NOT NULL,
    officer_id              INT NOT NULL,               -- Officer who registered the FIR
    status                  ENUM('open', 'under_investigation', 'closed', 'false_report') DEFAULT 'open',
    last_updated            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES Station(station_id) ON UPDATE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES Officer(officer_id) ON UPDATE CASCADE
);

-- 6.Case table
CREATE TABLE CrimeCase (
    case_id             INT AUTO_INCREMENT PRIMARY KEY,
    fir_id              INT NOT NULL UNIQUE,            -- One case per FIR
    date_opened         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_closed         DATETIME,
    status              ENUM('open', 'investigating', 'pending_trial', 'closed', 'dismissed') DEFAULT 'open',
    priority            ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    summary             TEXT,
    last_updated        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fir_id) REFERENCES FIR(fir_id) ON DELETE RESTRICT
);

-- 7.CaseOfficer table(M:M)
CREATE TABLE CaseOfficer (
    case_id     INT NOT NULL,
    officer_id  INT NOT NULL,
    role        ENUM('lead', 'supporting', 'investigator','forensics') NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (case_id, officer_id),
    FOREIGN KEY (case_id)   REFERENCES CrimeCase (case_id)     ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES Officer(officer_id) ON DELETE RESTRICT
);

-- 8.Suspect table
CREATE TABLE Suspect (
    suspect_id          INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(150) NOT NULL,
    dob                 DATE,
    gender              ENUM('Male', 'Female', 'Other'),
    address             TEXT,
    contact             VARCHAR(15),
    national_id         VARCHAR(50),                    -- Aadhar/passport etc.
    criminal_record     BOOLEAN DEFAULT FALSE,
    prior_offenses      INT DEFAULT 0 CHECK (prior_offenses >= 0),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9.Case suspect table(M:M)
CREATE TABLE CaseSuspect (
    case_id             INT NOT NULL,
    suspect_id          INT NOT NULL,
    involvement_level   ENUM('primary', 'secondary', 'accomplice', 'person_of_interest') NOT NULL,
    is_arrested         BOOLEAN DEFAULT FALSE,
    added_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (case_id, suspect_id),
    FOREIGN KEY (case_id)    REFERENCES CrimeCase(case_id)   ON DELETE CASCADE,
    FOREIGN KEY (suspect_id) REFERENCES Suspect(suspect_id) ON DELETE RESTRICT
);

-- 10.VICTIM TABLE
CREATE TABLE Victim (
    victim_id   INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    dob         DATE,
    gender      ENUM('Male', 'Female', 'Other'),
    contact     VARCHAR(15),
    address     TEXT,
    case_id     INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES CrimeCase(case_id) ON DELETE CASCADE
);

-- 11.evidence table
CREATE TABLE Evidence (
    evidence_id         INT AUTO_INCREMENT PRIMARY KEY,
    case_id             INT NOT NULL,
    type                ENUM('physical', 'digital', 'documentary', 'forensic', 'testimony') NOT NULL,
    description         TEXT NOT NULL,
    collected_by        INT NOT NULL,                   -- Officer who collected
    date_collected      DATETIME NOT NULL,
    storage_location    VARCHAR(200),
    status              ENUM('active', 'sealed', 'destroyed','under_analysis') DEFAULT 'active',
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id)     REFERENCES CrimeCase(case_id)    ON DELETE RESTRICT,
    FOREIGN KEY (collected_by) REFERENCES Officer(officer_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 12.witness table
CREATE TABLE Witness (
    witness_id      INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    contact         VARCHAR(15),
    address         TEXT,
    case_id         INT NOT NULL,
    statement       TEXT,
    is_protected    BOOLEAN DEFAULT FALSE,              -- Witness protection program
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES CrimeCase(case_id) ON DELETE CASCADE
);

-- 13.investigation log table
CREATE TABLE InvestigationLog (
    log_id           INT AUTO_INCREMENT PRIMARY KEY,
    case_id          INT NOT NULL,
    officer_id       INT NOT NULL,
    action_taken     VARCHAR(255) NOT NULL,
    action_date      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remarks          TEXT,
    FOREIGN KEY (case_id) REFERENCES CrimeCase(case_id) ON DELETE CASCADE,
    FOREIGN KEY (officer_id) REFERENCES Officer(officer_id) ON DELETE RESTRICT
);

-- 14.arrest table
CREATE TABLE Arrest (
    arrest_id       INT AUTO_INCREMENT PRIMARY KEY,
    suspect_id      INT NOT NULL,
    officer_id      INT NOT NULL,
    case_id         INT NOT NULL,
    arrest_date     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location        TEXT,
    notes           TEXT,
    FOREIGN KEY (suspect_id) REFERENCES Suspect(suspect_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (officer_id) REFERENCES Officer(officer_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (case_id)    REFERENCES CrimeCase(case_id)    ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 15.legal section table
CREATE TABLE LegalSection (
    section_id      INT AUTO_INCREMENT PRIMARY KEY,
    ipc_section     VARCHAR(20) NOT NULL UNIQUE,        -- e.g. '302', '376', '420'
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    min_sentence    INT CHECK(min_sentence >= 0),                                -- In months
    max_sentence    INT CHECK(max_sentence >= 0),                                -- In months
    is_bailable     BOOLEAN DEFAULT FALSE,
    CHECK (max_sentence IS NULL OR min_sentence IS NULL OR min_sentence <= max_sentence)
);

-- 16.charge table
CREATE TABLE Charge (
    charge_id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    suspect_id INT NOT NULL,
    section_id INT NOT NULL,
    date_charged DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'convicted', 'acquitted', 'dropped') DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (case_id) REFERENCES CrimeCase(case_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (suspect_id) REFERENCES Suspect(suspect_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    FOREIGN KEY (section_id) REFERENCES LegalSection(section_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    UNIQUE (case_id, suspect_id, section_id)
);


