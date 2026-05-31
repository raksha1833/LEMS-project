USE law_enforcement;

--   VIEWS  (3 views)

-- VIEW 1: Active Cases Per Station with Lead Officer

CREATE OR REPLACE VIEW vw_active_cases_per_station AS
SELECT
    s.station_id,
    s.name                              AS station_name,
    d.name                              AS district,
    c.case_id,
    c.status                            AS case_status,
    c.priority,
    c.date_opened,
    f.fir_id,
    f.complainant_name,
    f.incident_location,
    o.officer_id                        AS lead_officer_id,
    o.name                              AS lead_officer_name,
    r.title                             AS lead_officer_rank,
    DATEDIFF(NOW(), c.date_opened)      AS days_open
FROM CrimeCase c
JOIN FIR          f   ON c.fir_id      = f.fir_id
JOIN Station      s   ON f.station_id  = s.station_id
JOIN District     d   ON s.district_id = d.district_id
JOIN CaseOfficer  co  ON c.case_id     = co.case_id
                      AND co.role      = 'lead'
JOIN Officer      o   ON co.officer_id = o.officer_id
JOIN OfficerRank  r   ON o.rank_id     = r.rank_id
WHERE c.status NOT IN ('closed', 'dismissed')
ORDER BY c.priority DESC, days_open DESC;


-- VIEW 2: Officer Workload

CREATE OR REPLACE VIEW vw_officer_workload AS
SELECT
    o.officer_id,
    o.name                              AS officer_name,
    r.title                             AS rank_title,
    r.level                             AS rank_level,
    s.name                              AS station_name,
    r.max_cases_allowed,
    COUNT(DISTINCT co.case_id)          AS total_assigned_cases,
    COUNT(DISTINCT CASE
        WHEN cc.status IN ('open', 'investigating', 'pending_trial')
        THEN co.case_id
    END)                                AS active_assigned_cases,
    (r.max_cases_allowed - COUNT(DISTINCT CASE
        WHEN cc.status IN ('open', 'investigating', 'pending_trial')
        THEN co.case_id
    END))                               AS remaining_capacity,
    CASE
        WHEN COUNT(DISTINCT CASE
                WHEN cc.status IN ('open','investigating','pending_trial')
                THEN co.case_id END) > r.max_cases_allowed
            THEN 'Overloaded'
        WHEN COUNT(DISTINCT CASE
                WHEN cc.status IN ('open','investigating','pending_trial')
                THEN co.case_id END) = r.max_cases_allowed
            THEN 'Full Capacity'
        WHEN COUNT(DISTINCT CASE
                WHEN cc.status IN ('open','investigating','pending_trial')
                THEN co.case_id END) >= r.max_cases_allowed - 1
            THEN 'Near Capacity'
        ELSE 'Available'
    END                                 AS workload_status,
    o.status                            AS officer_status
FROM Officer       o
JOIN OfficerRank   r  ON o.rank_id     = r.rank_id
JOIN Station       s  ON o.station_id  = s.station_id
LEFT JOIN CaseOfficer co ON o.officer_id = co.officer_id
LEFT JOIN CrimeCase   cc ON co.case_id   = cc.case_id
WHERE o.status = 'active'
GROUP BY
    o.officer_id, o.name, r.title, r.level,
    s.name, r.max_cases_allowed, o.status;

-- VIEW 3: Full Case Timeline  [NEW]

CREATE OR REPLACE VIEW vw_case_timeline AS
SELECT
    c.case_id,
    c.status                                AS case_status,
    c.priority,
    c.date_opened,
    c.date_closed,
    DATEDIFF(
        IFNULL(c.date_closed, NOW()),
        c.date_opened
    )                                       AS case_duration_days,

    -- FIR details
    f.fir_id,
    f.date_filed,
    f.complainant_name,
    f.incident_date,
    f.incident_location,

    -- Station
    s.name                                  AS station_name,

    -- Lead officer (via CaseOfficer role='lead')
    o.name                                  AS lead_officer_name,
    r.title                                 AS lead_officer_rank,

    COUNT(DISTINCT cs.suspect_id)           AS total_suspects,
    COALESCE(SUM(cs.is_arrested), 0)        AS suspects_arrested,

    COUNT(DISTINCT e.evidence_id)           AS total_evidence_items,
    COALESCE(SUM(e.status = 'sealed'), 0)   AS sealed_evidence_items

FROM CrimeCase      c
JOIN FIR            f   ON c.fir_id      = f.fir_id
JOIN Station        s   ON f.station_id  = s.station_id
JOIN CaseOfficer    co  ON c.case_id     = co.case_id
                        AND co.role      = 'lead'
JOIN Officer        o   ON co.officer_id = o.officer_id
JOIN OfficerRank    r   ON o.rank_id     = r.rank_id
LEFT JOIN CaseSuspect cs ON cs.case_id  = c.case_id
LEFT JOIN Evidence    e  ON e.case_id   = c.case_id
GROUP BY
    c.case_id, c.status, c.priority, c.date_opened, c.date_closed,
    f.fir_id, f.date_filed, f.complainant_name,
    f.incident_date, f.incident_location,
    s.name, o.name, r.title;


SELECT * FROM vw_active_cases_per_station;
SELECT * FROM vw_officer_workload;
SELECT * FROM vw_case_timeline;
