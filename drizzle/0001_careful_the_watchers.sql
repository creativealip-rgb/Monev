CREATE TABLE `chat_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `transactions` ADD `destination_type` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `destination_id` integer;--> statement-breakpoint
ALTER TABLE `user_settings` ADD `hide_balance` integer DEFAULT false NOT NULL;