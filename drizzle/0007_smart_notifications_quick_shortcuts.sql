CREATE TABLE `smart_notification_rules` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `user_id` integer NOT NULL,
    `type` text NOT NULL,
    `title` text NOT NULL,
    `body` text NOT NULL,
    `severity` text DEFAULT 'info' NOT NULL,
    `status` text DEFAULT 'pending' NOT NULL,
    `metadata` text,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `idx_smart_notification_rules_user_id` ON `smart_notification_rules` (`user_id`);
CREATE INDEX `idx_smart_notification_rules_status` ON `smart_notification_rules` (`status`);
CREATE INDEX `idx_smart_notification_rules_type` ON `smart_notification_rules` (`type`);

CREATE TABLE `quick_add_shortcuts` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `user_id` integer NOT NULL,
    `label` text NOT NULL,
    `amount` real NOT NULL,
    `type` text DEFAULT 'expense' NOT NULL,
    `category_id` integer,
    `account_id` integer,
    `merchant_name` text,
    `payment_method` text DEFAULT 'cash',
    `icon` text DEFAULT 'Zap' NOT NULL,
    `color` text DEFAULT '#0ea5e9' NOT NULL,
    `sort_order` integer DEFAULT 0 NOT NULL,
    `usage_count` integer DEFAULT 0 NOT NULL,
    `last_used_at` integer,
    `is_active` integer DEFAULT true NOT NULL,
    `created_at` integer NOT NULL,
    `updated_at` integer NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
CREATE INDEX `idx_quick_add_shortcuts_user_id` ON `quick_add_shortcuts` (`user_id`);
CREATE INDEX `idx_quick_add_shortcuts_active` ON `quick_add_shortcuts` (`is_active`);
