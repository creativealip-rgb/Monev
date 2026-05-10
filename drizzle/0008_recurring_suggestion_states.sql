CREATE TABLE IF NOT EXISTS recurring_suggestion_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pattern_key TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_suggestion_states_user_pattern
    ON recurring_suggestion_states(user_id, pattern_key);
