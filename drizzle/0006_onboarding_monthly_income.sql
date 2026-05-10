-- Persist monthly income captured during onboarding.
ALTER TABLE user_settings ADD COLUMN monthly_income REAL NOT NULL DEFAULT 0;
