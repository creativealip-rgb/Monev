CREATE TABLE `admin_scheduled_notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text DEFAULT 'Reminder' NOT NULL,
	`title` text DEFAULT 'Monev' NOT NULL,
	`message` text NOT NULL,
	`target` text DEFAULT 'all' NOT NULL,
	`tier` text,
	`hour` integer NOT NULL,
	`minute` integer DEFAULT 0 NOT NULL,
	`timezone` text DEFAULT 'Asia/Jakarta' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_run_at` integer,
	`last_run_key` text,
	`created_by` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `idx_admin_scheduled_notifications_active` ON `admin_scheduled_notifications` (`is_active`);
CREATE INDEX `idx_admin_scheduled_notifications_run_key` ON `admin_scheduled_notifications` (`last_run_key`);
