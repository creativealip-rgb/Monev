CREATE TABLE `scheduled_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`locale` text DEFAULT 'id' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`email_sent_at` integer,
	`telegram_sent_at` integer,
	`error_message` text,
	`pdf_data` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_scheduled_reports_user_id` ON `scheduled_reports` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_scheduled_reports_month_year` ON `scheduled_reports` (`month`,`year`);--> statement-breakpoint
CREATE INDEX `idx_scheduled_reports_user_month_year` ON `scheduled_reports` (`user_id`,`month`,`year`);--> statement-breakpoint
CREATE INDEX `idx_scheduled_reports_status` ON `scheduled_reports` (`status`);--> statement-breakpoint
ALTER TABLE `user_settings` ADD `monthly_report_email` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `monthly_report_telegram` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `weekly_insight_telegram` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `report_locale` text DEFAULT 'auto' NOT NULL;