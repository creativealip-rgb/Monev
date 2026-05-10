INSERT INTO achievements (code, name, description, icon, tier, points, category, created_at)
VALUES
    ('first_tx', 'First Transaction', 'Transaksi pertama kamu tercatat.', 'Receipt', 'bronze', 10, 'transaction', strftime('%s','now') * 1000),
    ('tx_10', '10 Transactions', 'Sudah mencatat 10 transaksi.', 'ListChecks', 'bronze', 25, 'transaction', strftime('%s','now') * 1000),
    ('tx_100', '100 Transactions', '100 transaksi tercatat. Konsisten banget!', 'Trophy', 'gold', 100, 'transaction', strftime('%s','now') * 1000),
    ('streak_3', '3 Day Streak', '3 hari berturut-turut catat transaksi.', 'Flame', 'bronze', 30, 'streak', strftime('%s','now') * 1000),
    ('streak_7', '7 Day Streak', 'Seminggu konsisten catat transaksi.', 'Zap', 'silver', 70, 'streak', strftime('%s','now') * 1000),
    ('streak_30', '30 Day Streak', 'Sebulan penuh menjaga kebiasaan baik.', 'Gem', 'platinum', 300, 'streak', strftime('%s','now') * 1000)
ON CONFLICT(code) DO UPDATE SET
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    tier = excluded.tier,
    points = excluded.points,
    category = excluded.category;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_achievements_user_achievement_unique
ON user_achievements (user_id, achievement_id);
