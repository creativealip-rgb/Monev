CREATE TABLE `accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'bank' NOT NULL,
	`balance` real DEFAULT 0 NOT NULL,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`icon` text DEFAULT 'Wallet' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_accounts_user_id` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `achievements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`icon` text,
	`unlocked_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `admin_activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_id` integer NOT NULL,
	`action` text NOT NULL,
	`target_type` text,
	`target_id` integer,
	`details` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ai_insights_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`insights` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_ai_insights_user_id` ON `ai_insights_cache` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_ai_insights_month_year` ON `ai_insights_cache` (`month`,`year`);--> statement-breakpoint
CREATE TABLE `bill_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`bill_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`amount` real NOT NULL,
	`paid_at` integer NOT NULL,
	`transaction_id` integer,
	`notes` text,
	FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bill_payments_bill_id` ON `bill_payments` (`bill_id`);--> statement-breakpoint
CREATE INDEX `idx_bill_payments_user_id` ON `bill_payments` (`user_id`);--> statement-breakpoint
CREATE TABLE `bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`category_id` integer,
	`due_date` integer DEFAULT 1 NOT NULL,
	`frequency` text DEFAULT 'monthly' NOT NULL,
	`is_paid` integer DEFAULT false NOT NULL,
	`last_paid_at` integer,
	`icon` text DEFAULT 'Receipt' NOT NULL,
	`color` text DEFAULT '#6366f1' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_subscription` integer DEFAULT false NOT NULL,
	`last_detected_date` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_bills_user_id` ON `bills` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_bills_is_active` ON `bills` (`is_active`);--> statement-breakpoint
CREATE TABLE `budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`amount` real NOT NULL,
	`spent` real DEFAULT 0 NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`enable_rollover` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_budgets_user_id` ON `budgets` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_budgets_month_year` ON `budgets` (`month`,`year`);--> statement-breakpoint
CREATE INDEX `idx_budgets_user_month_year` ON `budgets` (`user_id`,`month`,`year`);--> statement-breakpoint
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`icon` text DEFAULT 'Wallet' NOT NULL,
	`type` text DEFAULT 'expense' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `chat_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_chat_history_user_id` ON `chat_history` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_chat_history_created_at` ON `chat_history` (`created_at`);--> statement-breakpoint
CREATE TABLE `coupon_claims` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`coupon_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`claimed_at` integer NOT NULL,
	FOREIGN KEY (`coupon_id`) REFERENCES `coupons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`tier` text NOT NULL,
	`quota` integer DEFAULT 1 NOT NULL,
	`claimed_count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`);--> statement-breakpoint
CREATE TABLE `debts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`debtor_name` text NOT NULL,
	`amount` real NOT NULL,
	`description` text,
	`due_date` integer,
	`status` text DEFAULT 'unpaid' NOT NULL,
	`split_group_id` text,
	`transaction_id` integer,
	`is_split_bill` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`target_amount` real NOT NULL,
	`current_amount` real DEFAULT 0 NOT NULL,
	`deadline` integer,
	`icon` text DEFAULT 'Target' NOT NULL,
	`color` text DEFAULT '#3b82f6' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_goals_user_id` ON `goals` (`user_id`);--> statement-breakpoint
CREATE TABLE `investments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`quantity` real NOT NULL,
	`avg_buy_price` real NOT NULL,
	`current_price` real NOT NULL,
	`platform` text,
	`icon` text DEFAULT 'TrendingUp' NOT NULL,
	`color` text DEFAULT '#10b981' NOT NULL,
	`notes` text,
	`total_dividends` real DEFAULT 0,
	`realized_profit` real DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_investments_user_id` ON `investments` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_investments_type` ON `investments` (`type`);--> statement-breakpoint
CREATE TABLE `merchant_mappings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`merchant_name` text NOT NULL,
	`category_id` integer NOT NULL,
	`confidence` real DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `password_reset_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `recurring_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`amount` real NOT NULL,
	`description` text NOT NULL,
	`category_id` integer,
	`type` text DEFAULT 'expense' NOT NULL,
	`frequency` text DEFAULT 'monthly' NOT NULL,
	`next_run_at` integer NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `scheduled_messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`message` text NOT NULL,
	`scheduled_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`type` text DEFAULT 'other',
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`device_info` text,
	`ip_address` text,
	`last_active_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `split_bill_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`split_group_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`whatsapp_number` text,
	`share_amount` real NOT NULL,
	`paid_amount` real DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`invited_at` integer NOT NULL,
	`paid_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_split_bill_members_group` ON `split_bill_members` (`split_group_id`);--> statement-breakpoint
CREATE INDEX `idx_split_bill_members_user` ON `split_bill_members` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_split_bill_members_status` ON `split_bill_members` (`status`);--> statement-breakpoint
CREATE TABLE `streaks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`current_streak` integer DEFAULT 0 NOT NULL,
	`longest_streak` integer DEFAULT 0 NOT NULL,
	`last_transaction_date` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streaks_user_id_unique` ON `streaks` (`user_id`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`amount` real NOT NULL,
	`description` text NOT NULL,
	`merchant_name` text,
	`category_id` integer,
	`type` text DEFAULT 'expense' NOT NULL,
	`payment_method` text DEFAULT 'cash',
	`destination_type` text,
	`destination_id` integer,
	`source_type` text,
	`source_id` integer,
	`fee` real DEFAULT 0,
	`account_id` integer,
	`target_account_id` integer,
	`date` integer NOT NULL,
	`is_verified` integer DEFAULT false NOT NULL,
	`is_recurring` integer DEFAULT false NOT NULL,
	`split_group_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_transactions_user_id` ON `transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_date` ON `transactions` (`date`);--> statement-breakpoint
CREATE INDEX `idx_transactions_type` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_transactions_category_id` ON `transactions` (`category_id`);--> statement-breakpoint
CREATE INDEX `idx_transactions_user_date` ON `transactions` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `usage_tracking` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`transactions_count` integer NOT NULL,
	`ai_chats_count` integer NOT NULL,
	`ocr_scans_count` integer NOT NULL,
	`telegram_messages_count` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_usage_tracking_user_month_year` ON `usage_tracking` (`user_id`,`month`,`year`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`hourly_rate` real DEFAULT 50000 NOT NULL,
	`primary_goal_id` integer,
	`security_pin` text,
	`decoy_pin` text,
	`is_app_lock_enabled` integer DEFAULT false NOT NULL,
	`is_biometric_enabled` integer DEFAULT false NOT NULL,
	`hide_balance` integer DEFAULT false NOT NULL,
	`notifications_enabled` integer DEFAULT true NOT NULL,
	`has_completed_onboarding` integer DEFAULT false NOT NULL,
	`financial_persona` text,
	`persona_updated_at` integer,
	`daily_report` integer DEFAULT true NOT NULL,
	`budget_alert` integer DEFAULT true NOT NULL,
	`transaction_update` integer DEFAULT true NOT NULL,
	`bill_reminder` integer DEFAULT true NOT NULL,
	`goal_progress` integer DEFAULT true NOT NULL,
	`promo_news` integer DEFAULT false NOT NULL,
	`push_enabled` integer DEFAULT true NOT NULL,
	`email_enabled` integer DEFAULT true NOT NULL,
	`telegram_enabled` integer DEFAULT false NOT NULL,
	`quiet_hours_enabled` integer DEFAULT false NOT NULL,
	`quiet_hours_start` text DEFAULT '22:00' NOT NULL,
	`quiet_hours_end` text DEFAULT '08:00' NOT NULL,
	`auto_lock_timeout` integer DEFAULT 300000 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`primary_goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_id` integer,
	`email` text,
	`email_verified` integer,
	`password` text,
	`name` text,
	`image` text,
	`username` text,
	`first_name` text,
	`last_name` text,
	`whatsapp_id` text,
	`tier` text DEFAULT 'starter' NOT NULL,
	`tier_expires_at` integer,
	`is_admin` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`deletion_requested_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_telegram_id_unique` ON `users` (`telegram_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verification_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`identifier` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_tokens_token_unique` ON `verification_tokens` (`token`);