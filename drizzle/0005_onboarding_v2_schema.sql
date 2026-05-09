-- Onboarding V2: Add new fields to users table
ALTER TABLE users ADD COLUMN onboarding_version TEXT DEFAULT 'v1';
ALTER TABLE users ADD COLUMN onboarding_path TEXT;
ALTER TABLE users ADD COLUMN demo_data_loaded INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN demo_data_scope TEXT;

-- Onboarding V2: Create demo_data_templates table
CREATE TABLE `demo_data_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scope` text NOT NULL,
	`duration_days` integer NOT NULL,
	`transaction_count` integer NOT NULL,
	`template_data` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

-- Onboarding V2: Rename old achievements table to user_achievements and create new achievements table
ALTER TABLE achievements RENAME TO user_achievements_old;

-- Onboarding V2: Create new achievements table (global definitions)
CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL UNIQUE,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`icon` text NOT NULL,
	`tier` text NOT NULL,
	`points` integer NOT NULL,
	`category` text NOT NULL,
	`created_at` integer NOT NULL
);

-- Onboarding V2: Create new user_achievements table (unlocked)
CREATE TABLE `user_achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`achievement_id` integer NOT NULL,
	`unlocked_at` integer NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`achievement_id`) REFERENCES `achievements`(`id`) ON UPDATE no action ON DELETE no action
);

-- Onboarding V2: Create indexes for user_achievements
CREATE INDEX `idx_user_achievements_user_id` ON `user_achievements` (`user_id`);
CREATE INDEX `idx_user_achievements_achievement_id` ON `user_achievements` (`achievement_id`);

-- Onboarding V2: Drop old achievements table (no data to migrate, table was unused)
DROP TABLE user_achievements_old;
