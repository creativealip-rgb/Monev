CREATE TABLE `ai_anomalies_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`anomalies` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ai_anomalies_user_id` ON `ai_anomalies_cache` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_anomalies_month_year` ON `ai_anomalies_cache` (`month`,`year`);