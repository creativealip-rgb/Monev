CREATE TABLE `mayar_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transaction_id` text NOT NULL,
	`user_id` integer,
	`customer_email` text,
	`customer_name` text,
	`product_id` text,
	`product_name` text,
	`amount` real,
	`status` text DEFAULT 'received' NOT NULL,
	`tier` text,
	`is_benefector` integer DEFAULT false NOT NULL,
	`raw_payload` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mayar_payments_transaction_id_unique` ON `mayar_payments` (`transaction_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `is_benefector` integer DEFAULT false NOT NULL;