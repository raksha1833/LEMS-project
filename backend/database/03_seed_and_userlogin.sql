-- ============================================================
--  03_seed_and_userlogin.sql
--  Run AFTER 02_tables.sql, 05_triggers.sql, 06_procedures.sql, 04_views.sql
--  Creates UserLogin table + inserts all seed data
-- ============================================================

USE law_enforcement;

-- ── UserLogin table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS UserLogin (
    user_id       INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          ENUM('admin','officer','viewer') NOT NULL DEFAULT 'viewer',
    officer_id    INT DEFAULT NULL,
    station_id    INT DEFAULT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    TIMESTAMP NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (officer_id) REFERENCES Officer(officer_id) ON DELETE SET NULL,
    FOREIGN KEY (station_id) REFERENCES Station(station_id) ON DELETE SET NULL
);

-- ── Districts ─────────────────────────────────────────────────
INSERT INTO District (name, state, population, area_sq_km) VALUES
('Mysuru',    'Karnataka', 3001127, 6854.00),
('Bengaluru', 'Karnataka', 9621551, 2190.00);

-- ── Stations ──────────────────────────────────────────────────
INSERT INTO Station (name, address, district_id, contact, established_date, status) VALUES
('Mysuru Central',   'Sayyaji Rao Road, Mysuru',  1, '0821-2441399', '1950-01-01', 'active'),
('Nazarbad Station', 'Nazarbad, Mysuru',           1, '0821-2441400', '1975-06-15', 'active'),
('Lalbagh Station',  'Lalbagh, Bengaluru',         2, '080-22212358', '1960-03-01', 'active');

-- ── OfficerRank ───────────────────────────────────────────────
INSERT INTO OfficerRank (title, level, max_cases_allowed, description) VALUES
('Constable',               1, 3,  'Entry level officer'),
('Head Constable',          2, 4,  'Senior constable'),
('Assistant Sub-Inspector', 3, 5,  'ASI level'),
('Sub-Inspector',           4, 6,  'SI level'),
('Inspector',               5, 8,  'In-charge of station investigations'),
('Deputy Superintendent',   6, 10, 'DSP level');

-- ── Officers ──────────────────────────────────────────────────
INSERT INTO Officer (name, dob, gender, rank_id, station_id, date_joined, status, contact) VALUES
('Rajesh Kumar',   '1980-05-10', 'Male',   5, 1, '2005-08-01', 'active', '9876543210'),
('Priya Nair',     '1985-07-22', 'Female', 4, 1, '2010-03-15', 'active', '9876543211'),
('Mohammed Irfan', '1990-11-30', 'Male',   3, 1, '2015-06-01', 'active', '9876543212'),
('Sunita Patil',   '1988-02-14', 'Female', 3, 2, '2012-09-01', 'active', '9876543213');

-- ── LegalSection ──────────────────────────────────────────────
INSERT INTO LegalSection (ipc_section, title, description, min_sentence, max_sentence, is_bailable) VALUES
('302',  'Murder',             'Punishment for murder',                    120, NULL, FALSE),
('307',  'Attempt to Murder',  'Attempt to commit murder',                 60,  120,  FALSE),
('376',  'Rape',               'Punishment for rape',                      84,  NULL, FALSE),
('395',  'Dacoity',            'Punishment for dacoity',                   84,  NULL, FALSE),
('379',  'Theft',              'Punishment for theft',                     1,   36,   TRUE),
('420',  'Cheating',           'Cheating and dishonest delivery',          6,   84,   TRUE),
('498A', 'Cruelty by Husband', 'Husband subjecting woman to cruelty',      36,  36,   FALSE);

-- ── Demo FIR and Case (Trigger 1 fires on FIR insert) ─────────
-- This creates a sample FIR + case automatically via Trigger 1
INSERT INTO FIR (
    date_filed, complainant_name, complainant_contact,
    complainant_address, incident_date, incident_location,
    description, station_id, officer_id, status
) VALUES (
    '2024-03-14 23:30:00',
    'Ramesh Gowda', '9900112233',
    '45 Devaraja Market, Mysuru',
    '2024-03-14',
    'Devaraja Market, Mysuru',
    'Two masked men robbed jewellery shop at knifepoint. Gold worth Rs 4.2L stolen. Fled on motorcycle heading north.',
    1, 2, 'open'
);
-- case_id=1 is auto-created by Trigger 1

-- ── Demo Suspects ─────────────────────────────────────────────
INSERT INTO Suspect (name, dob, gender, address, national_id, criminal_record, prior_offenses) VALUES
('Ramu Naik',   '1995-03-12', 'Male', 'Nazarbad, Mysuru',        'KA1234567', TRUE,  2),
('Shiva Kumar', '1998-07-19', 'Male', 'T Narasipura, Mysuru',    'KA7654321', FALSE, 0);

-- Link suspects to case
INSERT INTO CaseSuspect (case_id, suspect_id, involvement_level, is_arrested) VALUES
(1, 1, 'primary',   FALSE),
(1, 2, 'secondary', FALSE);

-- Demo Victim
INSERT INTO Victim (name, dob, gender, contact, address, case_id) VALUES
('Ramesh Gowda', '1972-08-10', 'Male', '9900112233', '45 Devaraja Market, Mysuru', 1);

-- Demo Witness
INSERT INTO Witness (name, contact, case_id, statement, is_protected) VALUES
('Ganesh Pai', '9911223344', 1,
 'Saw KA-09 partial plate motorcycle fleeing north at 10:35 PM', FALSE);

-- Demo Evidence
INSERT INTO Evidence (case_id, type, description, collected_by, date_collected, storage_location, status) VALUES
(1, 'digital',   'CCTV footage from shop camera 10:25-10:45 PM',        3, '2024-03-15 09:00:00', 'Digital Locker, Central Station', 'active'),
(1, 'physical',  'Knife found behind the counter at crime scene',        3, '2024-03-15 09:30:00', 'Evidence Room A, Shelf 2',        'active'),
(1, 'documentary','Medical report of victim Ramesh Gowda from KR Hospital', 2, '2024-03-15 11:00:00', 'Evidence Room A, Shelf 2',    'active');

-- ── UserLogin seed ────────────────────────────────────────────
-- Password for ALL users: password
-- Hash: bcrypt of 'password' with 10 salt rounds
INSERT INTO UserLogin (username, password_hash, role, officer_id, station_id) VALUES
('admin',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
 'admin', NULL, NULL),
('rajesh',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
 'officer', 1, 1),
('priya',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
 'officer', 2, 1),
('irfan',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
 'officer', 3, 1),
('viewer1',
 '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y',
 'viewer', NULL, NULL);

-- ── Verify everything loaded ───────────────────────────────────
SELECT 'Districts'  AS table_name, COUNT(*) AS `rows` FROM District
UNION ALL SELECT 'Stations',    COUNT(*) FROM Station
UNION ALL SELECT 'OfficerRank', COUNT(*) FROM OfficerRank
UNION ALL SELECT 'Officers',    COUNT(*) FROM Officer
UNION ALL SELECT 'FIR',         COUNT(*) FROM FIR
UNION ALL SELECT 'CrimeCase',   COUNT(*) FROM CrimeCase
UNION ALL SELECT 'CaseOfficer', COUNT(*) FROM CaseOfficer
UNION ALL SELECT 'Suspect',     COUNT(*) FROM Suspect
UNION ALL SELECT 'CaseSuspect', COUNT(*) FROM CaseSuspect
UNION ALL SELECT 'Evidence',    COUNT(*) FROM Evidence
UNION ALL SELECT 'LegalSection',COUNT(*) FROM LegalSection
UNION ALL SELECT 'UserLogin',   COUNT(*) FROM UserLogin
UNION ALL SELECT 'InvestigationLog', COUNT(*) FROM InvestigationLog;
