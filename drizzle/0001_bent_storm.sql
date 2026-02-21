CREATE TABLE `coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`tier` text NOT NULL,
	`is_used` integer DEFAULT false NOT NULL,
	`used_by` integer,
	`used_at` integer,
	`expires_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`used_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
ALTER TABLE `transactions` ADD `source_type` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `source_id` integer;--> statement-breakpoint
ALTER TABLE `transactions` ADD `fee` real DEFAULT 0;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `notifications_enabled` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `has_completed_onboarding` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tier` text DEFAULT 'miskin' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `tier_expires_at` integer;