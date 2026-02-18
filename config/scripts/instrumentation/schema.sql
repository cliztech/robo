PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS playout_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    decision_ts TEXT NOT NULL,
    slot_start_ts TEXT,
    daypart TEXT,
    decision_inputs_json TEXT NOT NULL,
    selected_rule_path TEXT NOT NULL,
    selected_item_id TEXT,
    ai_confidence REAL,
    fallback_used INTEGER NOT NULL DEFAULT 0,
    decision_latency_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS system_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_ts TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info',
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transition_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scored_ts TEXT NOT NULL,
    from_item_id TEXT,
    to_item_id TEXT,
    daypart TEXT,
    quality_score REAL NOT NULL,
    scorer TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS script_outcomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    outcome_ts TEXT NOT NULL,
    script_id TEXT,
    prompt_type TEXT,
    status TEXT NOT NULL,
    rejection_reason TEXT,
    latency_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ad_delivery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delivery_ts TEXT NOT NULL,
    ad_break_id TEXT,
    ad_id TEXT,
    scheduled_count INTEGER,
    delivered_count INTEGER,
    completion_rate REAL GENERATED ALWAYS AS (
        CASE
            WHEN scheduled_count IS NULL OR scheduled_count = 0 THEN NULL
            ELSE CAST(delivered_count AS REAL) / CAST(scheduled_count AS REAL)
        END
    ) VIRTUAL,
    status TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_playout_decisions_decision_ts ON playout_decisions(decision_ts);
CREATE INDEX IF NOT EXISTS idx_playout_decisions_daypart ON playout_decisions(daypart);
CREATE INDEX IF NOT EXISTS idx_system_events_event_ts ON system_events(event_ts);
CREATE INDEX IF NOT EXISTS idx_system_events_event_type ON system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_transition_scores_scored_ts ON transition_scores(scored_ts);
CREATE INDEX IF NOT EXISTS idx_script_outcomes_outcome_ts ON script_outcomes(outcome_ts);
CREATE INDEX IF NOT EXISTS idx_ad_delivery_delivery_ts ON ad_delivery(delivery_ts);

CREATE VIEW IF NOT EXISTS metrics_daily AS
SELECT
    date(pd.decision_ts) AS day,
    pd.daypart AS daypart,
    COUNT(*) AS decisions,
    SUM(pd.fallback_used) AS fallback_count,
    CASE WHEN COUNT(*) = 0 THEN 0.0 ELSE CAST(SUM(pd.fallback_used) AS REAL) / COUNT(*) END AS fallback_rate,
    AVG(pd.ai_confidence) AS avg_ai_confidence,
    AVG(pd.decision_latency_ms) AS avg_decision_latency_ms
FROM playout_decisions pd
GROUP BY date(pd.decision_ts), pd.daypart;

CREATE VIEW IF NOT EXISTS dead_air_daily AS
SELECT
    date(event_ts) AS day,
    COUNT(*) AS dead_air_incidents
FROM system_events
WHERE event_type = 'dead_air'
GROUP BY date(event_ts);

CREATE VIEW IF NOT EXISTS script_rejection_daily AS
SELECT
    date(outcome_ts) AS day,
    COUNT(*) AS total_scripts,
    SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_scripts,
    CASE
        WHEN COUNT(*) = 0 THEN 0.0
        ELSE CAST(SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS REAL) / COUNT(*)
    END AS script_rejection_rate
FROM script_outcomes
GROUP BY date(outcome_ts);

CREATE VIEW IF NOT EXISTS transition_quality_daily AS
SELECT
    date(scored_ts) AS day,
    daypart,
    AVG(quality_score) AS avg_transition_quality_score
FROM transition_scores
GROUP BY date(scored_ts), daypart;

CREATE VIEW IF NOT EXISTS repetition_score_daily AS
WITH item_counts AS (
    SELECT
        date(decision_ts) AS day,
        daypart,
        selected_item_id,
        COUNT(*) AS item_plays
    FROM playout_decisions
    WHERE selected_item_id IS NOT NULL
    GROUP BY date(decision_ts), daypart, selected_item_id
),
summary AS (
    SELECT
        day,
        daypart,
        SUM(item_plays) AS total_plays,
        COUNT(*) AS distinct_items,
        MAX(item_plays) AS max_item_plays
    FROM item_counts
    GROUP BY day, daypart
)
SELECT
    day,
    daypart,
    total_plays,
    distinct_items,
    max_item_plays,
    CASE
        WHEN total_plays IS NULL OR total_plays = 0 THEN 0.0
        ELSE CAST(max_item_plays AS REAL) / CAST(total_plays AS REAL)
    END AS repetition_score
FROM summary;

CREATE VIEW IF NOT EXISTS live_queue_health AS
SELECT
    datetime('now') AS snapshot_ts,
    COUNT(*) AS upcoming_slots,
    SUM(CASE WHEN fallback_used = 1 THEN 1 ELSE 0 END) AS fallbacks_in_window,
    AVG(decision_latency_ms) AS avg_decision_latency_ms,
    AVG(ai_confidence) AS avg_ai_confidence
FROM playout_decisions
WHERE decision_ts >= datetime('now', '-60 minutes');

CREATE VIEW IF NOT EXISTS ai_confidence_trend AS
SELECT
    strftime('%Y-%m-%d %H:%M:00', decision_ts) AS minute_bucket,
    AVG(ai_confidence) AS avg_ai_confidence,
    COUNT(*) AS decisions
FROM playout_decisions
GROUP BY strftime('%Y-%m-%d %H:%M:00', decision_ts)
ORDER BY minute_bucket DESC;

CREATE VIEW IF NOT EXISTS persona_activity AS
SELECT
    date(decision_ts) AS day,
    json_extract(decision_inputs_json, '$.persona') AS persona,
    COUNT(*) AS decisions,
    AVG(ai_confidence) AS avg_ai_confidence
FROM playout_decisions
GROUP BY date(decision_ts), json_extract(decision_inputs_json, '$.persona');

CREATE VIEW IF NOT EXISTS ad_delivery_completion AS
SELECT
    date(delivery_ts) AS day,
    COUNT(*) AS ad_breaks,
    AVG(completion_rate) AS avg_completion_rate,
    SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS complete_breaks
FROM ad_delivery
GROUP BY date(delivery_ts);
