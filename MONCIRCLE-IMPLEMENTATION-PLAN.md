# MonCircle - Implementation Plan

> **MonCircle** adalah fitur sosial terintegrasi di dalam Monev yang menggabungkan komunitas keuangan, social accountability, dan full social media experience. User bisa membuat status, like, komentar, follow, share achievement keuangan, dan berinteraksi dalam komunitas -- semua dalam konteks ekosistem Monev.

**Tanggal**: 8 Maret 2026
**Status**: Planning Phase
**Estimasi Development**: 4-6 minggu

---

## Daftar Isi

1. [Konsep & Filosofi](#1-konsep--filosofi)
2. [Fitur Lengkap](#2-fitur-lengkap)
3. [User Experience Flow](#3-user-experience-flow)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Halaman & Komponen](#6-halaman--komponen)
7. [Tahapan Implementasi](#7-tahapan-implementasi)
8. [Keamanan & Moderasi](#8-keamanan--moderasi)
9. [Gamifikasi & Engagement](#9-gamifikasi--engagement)
10. [Pertimbangan Teknis](#10-pertimbangan-teknis)

---

## 1. Konsep & Filosofi

### Apa itu MonCircle?

**MonCircle** (Monev + Circle) adalah ruang sosial di dalam Monev di mana pengguna bisa:

- **Berbagi** -- Post status, cerita keuangan, tips, momen, dan pencapaian
- **Berinteraksi** -- Like, komentar, reply, dan bookmark post orang lain
- **Terhubung** -- Follow user lain, bangun circle pertemanan keuangan
- **Belajar** -- Lihat bagaimana orang lain mengelola keuangan, dapat inspirasi
- **Termotivasi** -- Share goal progress, budget achievement, streak, dan milestone

### Mengapa "Circle"?

Circle mewakili:
- **Lingkaran kepercayaan** -- Tempat aman untuk bicara soal uang (yang biasanya tabu)
- **Lingkaran pertemanan** -- Komunitas yang saling mendukung journey keuangan
- **Lingkaran pengaruh** -- Dikelilingi orang-orang yang punya mindset keuangan sehat
- **Siklus keuangan** -- Uang beredar, dan kita semua ada di dalamnya

### Prinsip Desain

1. **Finance-first, social-second** -- Fitur sosial memperkuat fitur keuangan, bukan sebaliknya
2. **Privacy by choice** -- User sepenuhnya mengontrol apa yang dishare (termasuk angka nominal)
3. **Positive vibes** -- Desain yang mendorong saling support, bukan flexing atau shaming
4. **Contextual** -- Post bisa di-enrich dengan data keuangan real dari Monev (goal progress, streak, dll)
5. **Lightweight** -- Tidak overwhelming, tidak addictive by design, ada opsi quiet mode

---

## 2. Fitur Lengkap

### 2.1 Post / Status

**Deskripsi**: Core feature -- user bisa membuat post teks dengan berbagai enrichment.

**Tipe Post**:

| Tipe | Deskripsi | Contoh |
|---|---|---|
| **Text Post** | Teks bebas, bisa apapun | "Hari ini berhasil masak di rumah, hemat Rp 50.000!" |
| **Achievement Post** | Auto-generated saat capai milestone | "🎯 Baru saja mencapai 50% target tabungan Liburan Bali!" |
| **Goal Progress** | Share progress goal dengan visual | Progress bar + persentase + estimasi tanggal tercapai |
| **Budget Win** | Share ketika budget bulan ini tercapai | "Budget Makanan bulan ini sisa Rp 500.000! 🎉" |
| **Streak Share** | Share daily streak | "🔥 30 hari berturut-turut catat keuangan!" |
| **Tips / Advice** | Share tips keuangan | "Tips: Masak meal prep tiap Minggu, hemat Rp 200k/minggu" |
| **Question** | Tanya ke komunitas | "Ada yang punya rekomendasi reksadana untuk pemula?" |
| **Poll** | Buat polling | "Kalian prioritasin tabungan darurat atau investasi dulu?" |
| **Mood** | Financial mood/vibe check | "Feeling: 😊 Hari gajian!" / "Feeling: 😰 Tagihan numpuk" |

**Fitur Post**:
- Teks hingga 500 karakter
- Attach 1-4 gambar (opsional)
- Attach data keuangan dari Monev (goal, budget, streak) -- opsional, user pilih sendiri
- Tag user lain (`@username`)
- Hashtag (`#TipsHemat`, `#GoalAchieved`, `#MonCircle`)
- Emoji reactions
- Privacy setting per post: publik / circle only / private

---

### 2.2 Feed / Timeline

**Deskripsi**: Halaman utama MonCircle -- scrollable feed berisi post dari user yang di-follow.

**Tab Feed**:

| Tab | Konten |
|---|---|
| **Untukmu** | Algoritma rekomendasi -- trending + personalized berdasarkan interest |
| **Mengikuti** | Chronological feed dari user yang kamu follow |
| **Trending** | Post paling banyak interaksi hari/minggu ini |
| **Terdekat** | Post dari user sekitar (opsional, berdasarkan kota) |

**Fitur Feed**:
- Infinite scroll
- Pull-to-refresh
- Real-time update indicator ("5 post baru")
- Quick compose button (FAB)
- Filter by post type (semua, achievement, tips, question, poll)

---

### 2.3 Interaksi

#### Like / Reactions

Bukan hanya "like" biasa -- gunakan reaction yang relevan dengan konteks keuangan:

| Reaction | Emoji | Makna |
|---|---|---|
| **Keren** | 🔥 | Apresiasi umum |
| **Inspiratif** | 💡 | Post yang menginspirasi |
| **Relate** | 🤝 | "Aku juga ngalamin ini" |
| **Semangat** | 💪 | Dukungan motivasi |
| **Hemat** | 💰 | Apresiasi untuk penghematan |
| **Cuan** | 📈 | Apresiasi untuk investment win |

#### Komentar

- Komentar teks (max 300 karakter)
- Reply to komentar (nested 1 level)
- Like komentar
- Tag user di komentar
- Komentar bisa dihapus oleh pemilik atau poster asli

#### Bookmark

- Simpan post untuk dibaca nanti
- Organisasi bookmark ke folder (opsional): "Tips", "Inspirasi", "Produk Investasi"
- Akses dari profile page

#### Share / Repost

- Repost ke timeline sendiri (dengan/tanpa komentar tambahan)
- Copy link post
- Share ke WhatsApp / Telegram (deep link ke MonCircle)

---

### 2.4 Profil Sosial

**Deskripsi**: Extension dari profil Monev yang sudah ada, ditambah dimensi sosial.

**Elemen Profil Sosial**:

| Elemen | Deskripsi |
|---|---|
| **Bio** | Deskripsi singkat (max 160 karakter) |
| **Financial Badge** | Badge otomatis berdasarkan aktivitas (Saver, Investor, Streak Master, dll) |
| **Follower / Following count** | Jumlah pengikut dan yang diikuti |
| **Post count** | Total post yang dibuat |
| **Streak display** | Current streak (opt-in) |
| **Pinned Post** | 1 post yang di-pin di atas profil |
| **Post Grid / List** | Semua post user (bisa switch view) |
| **Achievement Showcase** | 3-5 badge pilihan yang ditampilkan di profil |
| **Financial Persona** | AI-generated persona (jika ada) |
| **Join date** | "Bergabung sejak Januari 2025" |

**Privacy Controls**:
- Profil bisa public atau private
- Private = hanya follower yang approved bisa lihat post
- Bisa hide streak, badge, dan stats dari profil

---

### 2.5 Follow System

| Fitur | Deskripsi |
|---|---|
| **Follow** | Ikuti user, lihat post mereka di feed |
| **Unfollow** | Berhenti ikuti |
| **Follow Request** | Jika profil private, harus request dulu |
| **Followers list** | Siapa yang mengikuti kamu |
| **Following list** | Siapa yang kamu ikuti |
| **Suggested Users** | Rekomendasi user berdasarkan tier yang sama, interest, atau mutual followers |
| **Mutual Badge** | Indikator jika kalian saling follow |
| **Block** | Blokir user (tidak bisa lihat post, komentar, atau profil kamu) |
| **Mute** | Sembunyikan post user tanpa unfollow |

---

### 2.6 Notifikasi Sosial

| Trigger | Contoh Notifikasi |
|---|---|
| Someone liked your post | "Budi menyukai post kamu" |
| Someone commented | "Siti berkomentar: 'Keren banget!'" |
| Someone followed you | "Andi mulai mengikutimu" |
| Someone mentioned you | "Doni menyebutmu di sebuah post" |
| Your post trending | "Post kamu sedang trending! 50+ reactions" |
| Achievement shared | "Lihat: 10 orang di circle kamu capai target bulan ini" |
| Weekly digest | "Ringkasan MonCircle minggu ini: 3 post populer" |

**Settings**: Setiap tipe notifikasi bisa di-on/off secara individual.

---

### 2.7 Fitur Unik MonCircle (Differentiator)

#### 2.7.1 Financial Card Attachment

User bisa attach "financial card" ke post -- card visual yang menampilkan data keuangan real dari akun Monev mereka.

**Tipe Card**:

| Card | Data yang Ditampilkan |
|---|---|
| **Goal Progress Card** | Nama goal, progress bar, persentase, estimasi tanggal tercapai |
| **Budget Report Card** | Budget bulan ini, spent vs limit, saving rate |
| **Streak Card** | Current streak, longest streak, badge |
| **Monthly Summary Card** | Income vs expense, saving rate, net worth change |
| **Investment Card** | Portfolio value, total ROI %, top performing asset |
| **Achievement Card** | Badge yang baru di-unlock, tanggal unlock |

**Privasi**: User pilih sendiri mau tampilkan nominal atau hanya persentase. Default: persentase saja (nominal di-mask).

**Contoh Post dengan Card**:
```
"Akhirnya goal liburan tercapai setelah 6 bulan nabung konsisten! 🎉"

┌─────────────────────────────────────┐
│ 🎯 Goal: Liburan Bali              │
│ ████████████████████████████ 100%   │
│ Target: Rp ••••••••                 │
│ Tercapai dalam: 6 bulan 3 hari     │
│ ✅ COMPLETED                        │
└─────────────────────────────────────┘

🔥 42 reactions · 💬 12 komentar
```

#### 2.7.2 Challenge / Tantangan Komunitas

**Deskripsi**: Challenge mingguan/bulanan yang bisa diikuti semua user.

**Contoh Challenge**:
- "No Spend Week" -- Tidak belanja non-esensial selama 1 minggu
- "Save Rp 100k/hari" -- Tantangan harian menabung
- "Budget Master" -- Tidak melebihi budget di semua kategori
- "Meal Prep Week" -- Masak sendiri selama seminggu penuh

**Mekanisme**:
- Admin/sistem buat challenge
- User join challenge
- Progress di-track otomatis dari data Monev (jika relevan)
- Leaderboard per challenge
- Badge khusus untuk yang menyelesaikan challenge

#### 2.7.3 Circle Groups

**Deskripsi**: Grup privat untuk komunitas kecil.

**Use Case**:
- Grup keluarga ("Keuangan Keluarga Santoso")
- Grup teman ("Squad Investasi")
- Grup kantor ("Tim Hemat Divisi IT")
- Grup minat ("Investor Crypto Indonesia")

**Fitur Grup**:
- Max 50 anggota per grup (free), 200 (premium)
- Shared goal (goal bersama)
- Group leaderboard
- Group challenge
- Admin bisa invite/kick member
- Group feed terpisah dari main feed

#### 2.7.4 Weekly Wrap

**Deskripsi**: Auto-generated weekly summary card yang bisa di-share.

**Konten Weekly Wrap**:
```
┌─────────────────────────────────────┐
│ 📊 Weekly Wrap - 1-7 Mar 2026      │
│                                     │
│ Income:    ████████░░ Rp ••••       │
│ Expense:   ██████░░░░ Rp ••••      │
│ Saved:     ██░░░░░░░░ ••%          │
│                                     │
│ 🔥 Streak: 45 hari                  │
│ 📈 Goal Progress: +12%              │
│ 🏆 Achievement: "Budget Master"     │
│                                     │
│ #MonCircle #WeeklyWrap              │
└─────────────────────────────────────┘
```

User bisa customize apa yang mau ditampilkan (opt-in setiap data point).

---

## 3. User Experience Flow

### 3.1 Entry Point

MonCircle diakses melalui:
1. **BottomNav** -- Tab baru "Circle" (icon: Users atau Globe) di antara Dashboard dan Profile
2. **Dashboard widget** -- "Lihat aktivitas terbaru di MonCircle" card
3. **Achievement popup** -- "Share achievement ini ke MonCircle?"
4. **Goal completion** -- "Bagikan pencapaian ke circle kamu?"

### 3.2 First-Time Experience

```
User buka MonCircle pertama kali
    │
    ▼
┌──────────────────────────┐
│ "Selamat datang di        │
│  MonCircle!"              │
│                           │
│ Lengkapi profil sosialmu: │
│ • Bio (opsional)          │
│ • Pilih interest/topik    │
│ • Follow 5+ user          │
│                           │
│ [Mulai Sekarang]          │
└──────────────────────────┘
    │
    ▼
Suggested Users berdasarkan:
- Tier yang sama
- Interest yang dipilih
- Popular users
    │
    ▼
Feed terisi dengan konten dari
suggested users + trending posts
```

### 3.3 Core Loop (Daily Usage)

```
1. Buka MonCircle
   │
   ├── Scroll feed (lihat post terbaru)
   │   ├── Like / React post
   │   ├── Komentar
   │   ├── Bookmark
   │   └── Share / Repost
   │
   ├── Buat post baru
   │   ├── Tulis teks
   │   ├── (Opsional) Attach gambar
   │   ├── (Opsional) Attach financial card
   │   ├── (Opsional) Buat poll
   │   └── Publish
   │
   ├── Check notifikasi
   │   ├── Lihat likes, komentar, follow baru
   │   └── Respond
   │
   ├── Explore / Discover
   │   ├── Trending posts
   │   ├── Suggested users
   │   ├── Active challenges
   │   └── Hashtag browse
   │
   └── Profile
       ├── Lihat stats (post, followers, following)
       ├── Edit bio
       ├── Manage bookmarks
       └── Manage privacy settings
```

### 3.4 Achievement Auto-Share Flow

```
User capai milestone (contoh: goal 50%)
    │
    ▼
Bottom sheet popup:
"🎯 Selamat! Goal 'Liburan Bali' sudah 50%!"
    │
    ├── [Bagikan ke MonCircle]
    │       │
    │       ▼
    │   Pre-filled post dengan
    │   achievement card attached.
    │   User bisa edit teks.
    │   Privacy: pilih publik/circle only
    │       │
    │       ▼
    │   Post dipublish ke feed
    │
    └── [Nanti saja]
            │
            ▼
        Dismiss, tidak di-share
```

---

## 4. Database Schema

### 4.1 Tabel Baru

#### `mc_posts` -- Post/Status

```sql
CREATE TABLE mc_posts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    content       TEXT NOT NULL,              -- Teks post (max 500 chars)
    post_type     TEXT NOT NULL DEFAULT 'text', -- text, achievement, goal, budget, streak, tip, question, poll, mood
    privacy       TEXT NOT NULL DEFAULT 'public', -- public, circle_only, private
    images        TEXT,                        -- JSON array of image URLs
    financial_card TEXT,                       -- JSON: { type, data } untuk financial card attachment
    poll_data     TEXT,                        -- JSON: { options: [{text, votes}], expires_at }
    mood          TEXT,                        -- Emoji mood (jika post_type = mood)
    hashtags      TEXT,                        -- JSON array of hashtags
    mentions      TEXT,                        -- JSON array of mentioned user_ids
    repost_of     INTEGER REFERENCES mc_posts(id), -- Jika ini adalah repost
    is_pinned     INTEGER NOT NULL DEFAULT 0, -- Pinned di profil
    like_count    INTEGER NOT NULL DEFAULT 0, -- Denormalized count
    comment_count INTEGER NOT NULL DEFAULT 0, -- Denormalized count
    repost_count  INTEGER NOT NULL DEFAULT 0, -- Denormalized count
    bookmark_count INTEGER NOT NULL DEFAULT 0, -- Denormalized count
    is_deleted    INTEGER NOT NULL DEFAULT 0, -- Soft delete
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Indexes
CREATE INDEX idx_mc_posts_user_id ON mc_posts(user_id);
CREATE INDEX idx_mc_posts_created_at ON mc_posts(created_at DESC);
CREATE INDEX idx_mc_posts_post_type ON mc_posts(post_type);
CREATE INDEX idx_mc_posts_privacy ON mc_posts(privacy);
```

#### `mc_reactions` -- Like / Reactions

```sql
CREATE TABLE mc_reactions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    post_id    INTEGER NOT NULL REFERENCES mc_posts(id),
    type       TEXT NOT NULL DEFAULT 'fire', -- fire, idea, relate, power, save, profit
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, post_id) -- 1 reaction per user per post
);

CREATE INDEX idx_mc_reactions_post_id ON mc_reactions(post_id);
CREATE INDEX idx_mc_reactions_user_id ON mc_reactions(user_id);
```

#### `mc_comments` -- Komentar

```sql
CREATE TABLE mc_comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    post_id    INTEGER NOT NULL REFERENCES mc_posts(id),
    parent_id  INTEGER REFERENCES mc_comments(id), -- Untuk reply (nested 1 level)
    content    TEXT NOT NULL,                       -- Max 300 chars
    mentions   TEXT,                                -- JSON array of mentioned user_ids
    like_count INTEGER NOT NULL DEFAULT 0,
    is_deleted INTEGER NOT NULL DEFAULT 0,          -- Soft delete
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_mc_comments_post_id ON mc_comments(post_id);
CREATE INDEX idx_mc_comments_parent_id ON mc_comments(parent_id);
CREATE INDEX idx_mc_comments_user_id ON mc_comments(user_id);
```

#### `mc_comment_likes` -- Like pada Komentar

```sql
CREATE TABLE mc_comment_likes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    comment_id INTEGER NOT NULL REFERENCES mc_comments(id),
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, comment_id)
);

CREATE INDEX idx_mc_comment_likes_comment_id ON mc_comment_likes(comment_id);
```

#### `mc_follows` -- Follow System

```sql
CREATE TABLE mc_follows (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id  INTEGER NOT NULL REFERENCES users(id), -- Yang follow
    following_id INTEGER NOT NULL REFERENCES users(id), -- Yang difollow
    status       TEXT NOT NULL DEFAULT 'active',         -- active, pending (untuk private profile)
    created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(follower_id, following_id)
);

CREATE INDEX idx_mc_follows_follower ON mc_follows(follower_id);
CREATE INDEX idx_mc_follows_following ON mc_follows(following_id);
CREATE INDEX idx_mc_follows_status ON mc_follows(status);
```

#### `mc_bookmarks` -- Bookmark

```sql
CREATE TABLE mc_bookmarks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    post_id    INTEGER NOT NULL REFERENCES mc_posts(id),
    folder     TEXT,                                     -- Nama folder (opsional)
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_mc_bookmarks_user_id ON mc_bookmarks(user_id);
```

#### `mc_blocks` -- Block & Mute

```sql
CREATE TABLE mc_blocks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),   -- Yang melakukan block/mute
    target_id  INTEGER NOT NULL REFERENCES users(id),   -- Yang diblock/mute
    type       TEXT NOT NULL DEFAULT 'block',            -- block, mute
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, target_id, type)
);

CREATE INDEX idx_mc_blocks_user ON mc_blocks(user_id);
CREATE INDEX idx_mc_blocks_target ON mc_blocks(target_id);
```

#### `mc_notifications` -- Notifikasi Sosial

```sql
CREATE TABLE mc_notifications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),   -- Penerima notifikasi
    actor_id    INTEGER NOT NULL REFERENCES users(id),   -- Yang melakukan aksi
    type        TEXT NOT NULL,                            -- like, comment, follow, mention, repost, trending
    post_id     INTEGER REFERENCES mc_posts(id),
    comment_id  INTEGER REFERENCES mc_comments(id),
    is_read     INTEGER NOT NULL DEFAULT 0,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_mc_notifications_user ON mc_notifications(user_id, is_read);
CREATE INDEX idx_mc_notifications_created ON mc_notifications(created_at DESC);
```

#### `mc_hashtags` -- Tracking Hashtag

```sql
CREATE TABLE mc_hashtags (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,                     -- Nama hashtag (lowercase, tanpa #)
    post_count INTEGER NOT NULL DEFAULT 0,               -- Denormalized count
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_mc_hashtags_name ON mc_hashtags(name);
CREATE INDEX idx_mc_hashtags_count ON mc_hashtags(post_count DESC);
```

#### `mc_challenges` -- Community Challenges

```sql
CREATE TABLE mc_challenges (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'saving',          -- saving, budget, streak, custom
    target      TEXT,                                     -- JSON: { metric, value, period }
    icon        TEXT NOT NULL DEFAULT 'Trophy',
    color       TEXT NOT NULL DEFAULT '#f59e0b',
    starts_at   INTEGER NOT NULL,
    ends_at     INTEGER NOT NULL,
    created_by  INTEGER REFERENCES users(id),            -- NULL = system
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE mc_challenge_participants (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL REFERENCES mc_challenges(id),
    user_id      INTEGER NOT NULL REFERENCES users(id),
    progress     REAL NOT NULL DEFAULT 0,                -- 0-100 persentase
    completed    INTEGER NOT NULL DEFAULT 0,
    joined_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER,
    UNIQUE(challenge_id, user_id)
);
```

#### `mc_groups` -- Circle Groups

```sql
CREATE TABLE mc_groups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    avatar      TEXT,
    owner_id    INTEGER NOT NULL REFERENCES users(id),
    privacy     TEXT NOT NULL DEFAULT 'private',         -- public, private
    max_members INTEGER NOT NULL DEFAULT 50,
    member_count INTEGER NOT NULL DEFAULT 1,
    created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE mc_group_members (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id  INTEGER NOT NULL REFERENCES mc_groups(id),
    user_id   INTEGER NOT NULL REFERENCES users(id),
    role      TEXT NOT NULL DEFAULT 'member',            -- owner, admin, member
    joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(group_id, user_id)
);
```

### 4.2 Perubahan pada Tabel Existing

#### `users` -- Tambah kolom sosial

```sql
ALTER TABLE users ADD COLUMN bio TEXT;                    -- Bio max 160 chars
ALTER TABLE users ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;  -- Private profile
ALTER TABLE users ADD COLUMN follower_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN following_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN post_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN mc_onboarded INTEGER NOT NULL DEFAULT 0; -- Sudah setup MonCircle
```

---

## 5. API Endpoints

### 5.1 Posts

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/moncircle/feed` | Feed utama (following + trending) | Required |
| GET | `/api/moncircle/feed/trending` | Trending posts | Required |
| GET | `/api/moncircle/feed/following` | Posts dari followed users | Required |
| POST | `/api/moncircle/posts` | Buat post baru | Required |
| GET | `/api/moncircle/posts/[id]` | Detail post + komentar | Required |
| PUT | `/api/moncircle/posts/[id]` | Edit post (hanya teks, 15 menit pertama) | Required |
| DELETE | `/api/moncircle/posts/[id]` | Hapus post (soft delete) | Required |
| POST | `/api/moncircle/posts/[id]/repost` | Repost ke timeline sendiri | Required |

### 5.2 Reactions & Comments

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/moncircle/posts/[id]/react` | Like/react pada post | Required |
| DELETE | `/api/moncircle/posts/[id]/react` | Remove reaction | Required |
| GET | `/api/moncircle/posts/[id]/comments` | List komentar (paginated) | Required |
| POST | `/api/moncircle/posts/[id]/comments` | Tambah komentar | Required |
| DELETE | `/api/moncircle/comments/[id]` | Hapus komentar | Required |
| POST | `/api/moncircle/comments/[id]/like` | Like komentar | Required |

### 5.3 Follow System

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/moncircle/follow/[userId]` | Follow user | Required |
| DELETE | `/api/moncircle/follow/[userId]` | Unfollow user | Required |
| GET | `/api/moncircle/followers` | List followers kamu | Required |
| GET | `/api/moncircle/following` | List yang kamu follow | Required |
| PUT | `/api/moncircle/follow-request/[id]` | Accept/reject follow request | Required |
| GET | `/api/moncircle/suggested` | Suggested users to follow | Required |

### 5.4 Bookmarks

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/moncircle/bookmarks` | Bookmark post | Required |
| DELETE | `/api/moncircle/bookmarks/[postId]` | Remove bookmark | Required |
| GET | `/api/moncircle/bookmarks` | List bookmarks | Required |

### 5.5 Notifications

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/moncircle/notifications` | List notifikasi (paginated) | Required |
| PUT | `/api/moncircle/notifications/read` | Mark all as read | Required |
| GET | `/api/moncircle/notifications/unread-count` | Count unread | Required |

### 5.6 Profile

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/moncircle/profile/[username]` | Profil user + posts | Required |
| PUT | `/api/moncircle/profile` | Update bio, privacy settings | Required |
| POST | `/api/moncircle/block/[userId]` | Block user | Required |
| POST | `/api/moncircle/mute/[userId]` | Mute user | Required |

### 5.7 Challenges

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/moncircle/challenges` | List active challenges | Required |
| POST | `/api/moncircle/challenges/[id]/join` | Join challenge | Required |
| GET | `/api/moncircle/challenges/[id]/leaderboard` | Leaderboard challenge | Required |

### 5.8 Groups

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/moncircle/groups` | Buat group | Required |
| GET | `/api/moncircle/groups` | List groups user | Required |
| GET | `/api/moncircle/groups/[id]` | Detail group + feed | Required |
| POST | `/api/moncircle/groups/[id]/join` | Join group | Required |
| DELETE | `/api/moncircle/groups/[id]/leave` | Leave group | Required |
| POST | `/api/moncircle/groups/[id]/posts` | Post di group | Required |

### 5.9 Search & Discover

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/moncircle/search?q=...&type=posts\|users\|hashtags` | Global search | Required |
| GET | `/api/moncircle/hashtags/trending` | Trending hashtags | Required |
| GET | `/api/moncircle/hashtags/[name]` | Posts with hashtag | Required |

---

## 6. Halaman & Komponen

### 6.1 Halaman Baru

| Route | File | Deskripsi |
|---|---|---|
| `/circle` | `(protected)/circle/page.tsx` | Feed utama MonCircle |
| `/circle/post/[id]` | `(protected)/circle/post/[id]/page.tsx` | Detail post + komentar |
| `/circle/profile/[username]` | `(protected)/circle/profile/[username]/page.tsx` | Profil user |
| `/circle/explore` | `(protected)/circle/explore/page.tsx` | Explore: trending, hashtags, discover |
| `/circle/notifications` | `(protected)/circle/notifications/page.tsx` | Notifikasi sosial |
| `/circle/bookmarks` | `(protected)/circle/bookmarks/page.tsx` | Bookmarked posts |
| `/circle/challenges` | `(protected)/circle/challenges/page.tsx` | Active challenges |
| `/circle/groups` | `(protected)/circle/groups/page.tsx` | My groups |
| `/circle/groups/[id]` | `(protected)/circle/groups/[id]/page.tsx` | Group detail + feed |
| `/circle/compose` | `(protected)/circle/compose/page.tsx` | Full-screen compose (opsional) |

### 6.2 Komponen Baru

#### Core Components

| Komponen | File | Deskripsi |
|---|---|---|
| `PostCard` | `circle/components/PostCard.tsx` | Card untuk satu post (content, reactions, actions) |
| `PostComposer` | `circle/components/PostComposer.tsx` | Form membuat post baru (bottom sheet atau full page) |
| `CommentSection` | `circle/components/CommentSection.tsx` | List komentar + input komentar baru |
| `CommentItem` | `circle/components/CommentItem.tsx` | Satu komentar (avatar, text, like, reply) |
| `ReactionBar` | `circle/components/ReactionBar.tsx` | Bar reactions (🔥💡🤝💪💰📈) |
| `ReactionPicker` | `circle/components/ReactionPicker.tsx` | Popup picker untuk pilih reaction |
| `FinancialCard` | `circle/components/FinancialCard.tsx` | Visual card untuk data keuangan yang di-attach |
| `PollCard` | `circle/components/PollCard.tsx` | Visual card untuk poll |
| `MoodBadge` | `circle/components/MoodBadge.tsx` | Badge emoji mood |

#### User & Social Components

| Komponen | File | Deskripsi |
|---|---|---|
| `UserAvatar` | `circle/components/UserAvatar.tsx` | Avatar dengan online indicator dan tier badge |
| `UserCard` | `circle/components/UserCard.tsx` | Mini profile card (untuk suggested users, followers list) |
| `FollowButton` | `circle/components/FollowButton.tsx` | Tombol follow/unfollow/pending |
| `SocialProfile` | `circle/components/SocialProfile.tsx` | Header profil sosial (bio, stats, badges) |
| `ProfileTabs` | `circle/components/ProfileTabs.tsx` | Tab: Posts / Reactions / Media |

#### Feed Components

| Komponen | File | Deskripsi |
|---|---|---|
| `FeedTabs` | `circle/components/FeedTabs.tsx` | Tab: Untukmu / Mengikuti / Trending |
| `FeedList` | `circle/components/FeedList.tsx` | Infinite scroll feed dengan skeleton loading |
| `NewPostsIndicator` | `circle/components/NewPostsIndicator.tsx` | "5 post baru" floating indicator |
| `TrendingHashtags` | `circle/components/TrendingHashtags.tsx` | Sidebar/horizontal scroll trending hashtags |
| `SuggestedUsers` | `circle/components/SuggestedUsers.tsx` | Horizontal scroll suggested users |

#### Challenge & Group Components

| Komponen | File | Deskripsi |
|---|---|---|
| `ChallengeCard` | `circle/components/ChallengeCard.tsx` | Card challenge dengan progress |
| `ChallengeLeaderboard` | `circle/components/ChallengeLeaderboard.tsx` | Leaderboard challenge |
| `GroupCard` | `circle/components/GroupCard.tsx` | Card group |
| `GroupHeader` | `circle/components/GroupHeader.tsx` | Header group (nama, desc, member count) |

#### Notification Components

| Komponen | File | Deskripsi |
|---|---|---|
| `NotificationItem` | `circle/components/NotificationItem.tsx` | Satu item notifikasi |
| `NotificationBadge` | `circle/components/NotificationBadge.tsx` | Badge count unread di BottomNav |

### 6.3 Perubahan pada Komponen Existing

| Komponen | Perubahan |
|---|---|
| `BottomNav.tsx` | Tambah tab "Circle" (icon: `Users` atau `Globe`) |
| `Dashboard` | Tambah widget "MonCircle Highlights" (top 3 trending post) |
| Goal completion flow | Tambah opsi "Share ke MonCircle" |
| Achievement unlock | Tambah opsi "Share ke MonCircle" |
| Streak milestone | Auto-suggest share ke MonCircle |

### 6.4 Custom Hooks Baru

| Hook | File | Deskripsi |
|---|---|---|
| `useCircleFeed` | `hooks/useCircleFeed.ts` | Fetch feed dengan infinite scroll, tab switching |
| `useCirclePost` | `hooks/useCirclePost.ts` | CRUD operations pada post |
| `useCircleComments` | `hooks/useCircleComments.ts` | Fetch dan manage komentar |
| `useCircleNotifications` | `hooks/useCircleNotifications.ts` | Fetch notifikasi + unread count |
| `useCircleProfile` | `hooks/useCircleProfile.ts` | Fetch profil user + follow status |
| `useCircleFollow` | `hooks/useCircleFollow.ts` | Follow/unfollow operations |
| `useCircleReaction` | `hooks/useCircleReaction.ts` | React/unreact pada post |

---

## 7. Tahapan Implementasi

### Phase 1: Foundation (Minggu 1-2)

**Goal**: Core social infrastructure -- post, feed, dan basic interactions.

#### Week 1: Database & API Core

| # | Task | Estimasi | Priority |
|---|---|---|---|
| 1.1 | Setup database schema (semua tabel `mc_*`) | 4 jam | Critical |
| 1.2 | Migrasi schema + update Drizzle config | 2 jam | Critical |
| 1.3 | Buat DB operations untuk posts (CRUD) | 4 jam | Critical |
| 1.4 | Buat DB operations untuk reactions | 2 jam | Critical |
| 1.5 | Buat DB operations untuk comments | 3 jam | Critical |
| 1.6 | Buat DB operations untuk follows | 3 jam | Critical |
| 1.7 | API routes: `/api/moncircle/posts` (GET, POST) | 3 jam | Critical |
| 1.8 | API routes: `/api/moncircle/posts/[id]` (GET, PUT, DELETE) | 3 jam | Critical |
| 1.9 | API routes: `/api/moncircle/posts/[id]/react` | 2 jam | Critical |
| 1.10 | API routes: `/api/moncircle/posts/[id]/comments` | 3 jam | Critical |
| 1.11 | API routes: `/api/moncircle/feed` (with pagination) | 4 jam | Critical |
| 1.12 | API routes: `/api/moncircle/follow/[userId]` | 2 jam | Critical |

**Deliverable**: Semua API endpoint inti berfungsi, bisa ditest via curl/Postman.

#### Week 2: Core UI

| # | Task | Estimasi | Priority |
|---|---|---|---|
| 2.1 | Buat komponen `PostCard` | 4 jam | Critical |
| 2.2 | Buat komponen `PostComposer` (bottom sheet) | 4 jam | Critical |
| 2.3 | Buat komponen `ReactionBar` + `ReactionPicker` | 3 jam | Critical |
| 2.4 | Buat komponen `CommentSection` + `CommentItem` | 4 jam | Critical |
| 2.5 | Buat komponen `UserAvatar` + `FollowButton` | 2 jam | Critical |
| 2.6 | Buat halaman `/circle` (feed utama) dengan `FeedTabs` | 4 jam | Critical |
| 2.7 | Buat halaman `/circle/post/[id]` (detail post) | 3 jam | Critical |
| 2.8 | Buat hooks: `useCircleFeed`, `useCirclePost`, `useCircleReaction` | 3 jam | Critical |
| 2.9 | Update `BottomNav` -- tambah tab Circle | 1 jam | Critical |
| 2.10 | Buat `FeedList` dengan infinite scroll | 3 jam | Critical |

**Deliverable**: User bisa buat post, lihat feed, like, dan komentar. Basic usable social feature.

---

### Phase 2: Social Graph (Minggu 3)

**Goal**: Follow system, profil sosial, notifikasi.

| # | Task | Estimasi | Priority |
|---|---|---|---|
| 3.1 | Buat halaman `/circle/profile/[username]` | 4 jam | High |
| 3.2 | Buat komponen `SocialProfile` (header, bio, stats, badge showcase) | 4 jam | High |
| 3.3 | Buat komponen `ProfileTabs` (Posts / Reactions / Media) | 3 jam | High |
| 3.4 | Buat komponen `UserCard` + `SuggestedUsers` | 3 jam | High |
| 3.5 | API routes: profile, followers, following, suggested | 3 jam | High |
| 3.6 | API routes: block, mute | 2 jam | High |
| 3.7 | Buat halaman `/circle/notifications` | 3 jam | High |
| 3.8 | API routes: notifications (list, mark read, unread count) | 3 jam | High |
| 3.9 | Buat komponen `NotificationItem` + `NotificationBadge` | 3 jam | High |
| 3.10 | Hook: `useCircleNotifications`, `useCircleProfile`, `useCircleFollow` | 3 jam | High |
| 3.11 | Notifikasi badge di BottomNav (unread count) | 1 jam | High |
| 3.12 | Privacy system (private profile, follow request accept/reject) | 3 jam | High |
| 3.13 | Alter `users` table -- tambah kolom bio, is_private, follower/following/post counts | 2 jam | High |
| 3.14 | Update profil page existing -- link ke MonCircle profile | 1 jam | Medium |

**Deliverable**: Full social graph -- follow, profil sosial, notifikasi, privacy controls.

---

### Phase 3: Rich Content (Minggu 4)

**Goal**: Financial cards, polls, bookmarks, hashtags, search.

| # | Task | Estimasi | Priority |
|---|---|---|---|
| 4.1 | Buat komponen `FinancialCard` (6 tipe card) | 6 jam | High |
| 4.2 | Buat card attachment picker di `PostComposer` | 3 jam | High |
| 4.3 | API: generate financial card data dari user's real data | 4 jam | High |
| 4.4 | Buat komponen `PollCard` + voting API | 3 jam | Medium |
| 4.5 | Buat komponen `MoodBadge` + mood selector di composer | 2 jam | Medium |
| 4.6 | API routes: bookmarks (add, remove, list) | 2 jam | Medium |
| 4.7 | Buat halaman `/circle/bookmarks` | 2 jam | Medium |
| 4.8 | API routes: search (posts, users, hashtags) | 4 jam | Medium |
| 4.9 | API routes: trending hashtags | 2 jam | Medium |
| 4.10 | Buat halaman `/circle/explore` (trending, hashtags, discover) | 4 jam | Medium |
| 4.11 | Buat komponen `TrendingHashtags` | 2 jam | Medium |
| 4.12 | Image upload support untuk posts (max 4 gambar) | 3 jam | Medium |
| 4.13 | Repost functionality (UI + API) | 2 jam | Medium |
| 4.14 | Hashtag parsing dari post content + clickable hashtag links | 2 jam | Medium |
| 4.15 | Mention (@username) parsing + autocomplete di composer | 3 jam | Medium |

**Deliverable**: Rich post content -- financial cards, polls, images, hashtags, mentions, bookmarks, search.

---

### Phase 4: Engagement (Minggu 5)

**Goal**: Challenges, auto-share, weekly wrap, dashboard integration.

| # | Task | Estimasi | Priority |
|---|---|---|---|
| 5.1 | API routes: challenges (list, join, leaderboard) | 4 jam | Medium |
| 5.2 | Buat halaman `/circle/challenges` | 4 jam | Medium |
| 5.3 | Buat komponen `ChallengeCard` + `ChallengeLeaderboard` | 4 jam | Medium |
| 5.4 | Auto-share flow: goal completion → MonCircle prompt | 3 jam | Medium |
| 5.5 | Auto-share flow: achievement unlock → MonCircle prompt | 2 jam | Medium |
| 5.6 | Auto-share flow: streak milestone → MonCircle prompt | 2 jam | Medium |
| 5.7 | Weekly Wrap auto-generation + share card | 4 jam | Medium |
| 5.8 | Dashboard widget: "MonCircle Highlights" | 3 jam | Low |
| 5.9 | MonCircle onboarding flow (first-time setup) | 3 jam | Medium |
| 5.10 | Seed data: initial challenges, system posts | 2 jam | Low |

**Deliverable**: Engagement features -- challenges, auto-share prompts, weekly wrap, dashboard integration.

---

### Phase 5: Groups & Polish (Minggu 6)

**Goal**: Circle Groups, performance optimization, polish.

| # | Task | Estimasi | Priority |
|---|---|---|---|
| 6.1 | API routes: groups (CRUD, join, leave, feed) | 4 jam | Low |
| 6.2 | Buat halaman `/circle/groups` + `/circle/groups/[id]` | 4 jam | Low |
| 6.3 | Buat komponen `GroupCard` + `GroupHeader` | 3 jam | Low |
| 6.4 | Group feed + group-specific post composer | 3 jam | Low |
| 6.5 | Performance: feed pagination optimization | 3 jam | High |
| 6.6 | Performance: denormalized counts consistency | 2 jam | High |
| 6.7 | Performance: image lazy loading + compression | 2 jam | Medium |
| 6.8 | Tier gating: limit post/day for free tier | 2 jam | Medium |
| 6.9 | Report/flag post (abuse handling) | 3 jam | Medium |
| 6.10 | Admin moderation panel (review flagged posts) | 4 jam | Medium |
| 6.11 | End-to-end testing | 4 jam | High |
| 6.12 | UI polish, animations, empty states, error states | 4 jam | High |

**Deliverable**: Groups, moderation tools, performance optimized, production ready.

---

### Timeline Summary

```
Week 1: Database + API Core             ████████░░ 80%
Week 2: Core UI (Feed, Post, Comment)   ████████░░ 80%
Week 3: Social Graph (Follow, Profile)  ████████░░ 80%
Week 4: Rich Content (Cards, Search)    ██████░░░░ 60%
Week 5: Engagement (Challenges, Auto)   ██████░░░░ 60%
Week 6: Groups + Polish                 ████████░░ 80%

Total Estimasi: 6 minggu (~200 jam development)
```

---

## 8. Keamanan & Moderasi

### 8.1 Content Moderation

| Layer | Mekanisme |
|---|---|
| **Rate Limiting** | Max post per hari: miskin=5, kaya=20, sultan=unlimited |
| **Spam Detection** | Deteksi post duplikat, link spam, excessive hashtags |
| **Report System** | User bisa flag post/komentar (spam, harassment, inappropriate) |
| **Admin Review** | Flagged content masuk antrian moderasi admin |
| **Auto-Hide** | Post dengan 3+ flag otomatis disembunyikan pending review |
| **Word Filter** | Daftar kata terlarang (offensive, scam-related) |
| **AI Moderation** | (Opsional future) AI review konten sebelum publish |

### 8.2 Privacy & Safety

| Fitur | Deskripsi |
|---|---|
| **Private Profile** | Hanya approved followers bisa lihat post |
| **Block** | Blokir user sepenuhnya (tidak bisa lihat, komentar, follow) |
| **Mute** | Sembunyikan post user tanpa unfollow |
| **Financial Card Privacy** | Default: nominal di-mask. User harus opt-in untuk show nominal |
| **Post Privacy** | Per-post setting: public, circle only, private |
| **Data Separation** | MonCircle data terpisah dari financial data -- delete MonCircle tidak hapus data keuangan |
| **Right to Delete** | User bisa hapus semua post + komentar sekaligus |

### 8.3 Abuse Prevention

| Threat | Mitigation |
|---|---|
| Spam bot | Rate limit + CAPTCHA pada registration |
| Harassment | Block + report + auto-hide flagged |
| Fake financial data | Financial cards pulled from real data, tidak bisa dimanipulasi |
| Doxxing | Tidak ada fitur share lokasi detail, hanya kota (opsional) |
| Scam promotion | Link detection + word filter + admin review |
| Data harvesting | API rate limits + tidak ada public endpoint tanpa auth |

---

## 9. Gamifikasi & Engagement

### 9.1 Social Badges (Unlock di MonCircle)

| Badge | Kondisi Unlock |
|---|---|
| **First Post** | Buat post pertama |
| **Social Butterfly** | Follow 10 user |
| **Popular** | Dapat 50 reactions total |
| **Viral** | 1 post dapat 20+ reactions |
| **Helpful** | 10 komentar di post orang lain |
| **Challenger** | Selesaikan 1 challenge |
| **Group Leader** | Buat 1 group |
| **Bookworm** | Bookmark 20 post |
| **Consistent** | Post 7 hari berturut-turut |
| **Influencer** | 100 followers |
| **Money Mentor** | 50 post bertipe "tips" |
| **Weekly Wrapper** | Share 4 Weekly Wraps berturut-turut |

### 9.2 Tier Benefits untuk MonCircle

| Fitur | Miskin (Free) | Kaya (Pro) | Sultan (Premium) |
|---|---|---|---|
| Post per hari | 5 | 20 | Unlimited |
| Gambar per post | 1 | 4 | 4 |
| Financial card types | 2 (goal, streak) | Semua 6 | Semua 6 |
| Create groups | 0 | 2 | Unlimited |
| Group max members | - | 50 | 200 |
| Weekly Wrap | Tidak | Ya | Ya + custom |
| Join challenges | 1 aktif | 3 aktif | Unlimited |
| Verified badge | Tidak | Tidak | Ya ✓ |
| Priority di trending | Tidak | Tidak | Ya |
| Custom reactions | Tidak | Tidak | Ya |

---

## 10. Pertimbangan Teknis

### 10.1 Performance

| Concern | Solution |
|---|---|
| Feed query performance | Denormalized counts (like_count, comment_count) untuk avoid COUNT queries |
| Infinite scroll | Cursor-based pagination (bukan offset) menggunakan `created_at` + `id` |
| Image storage | Compress + resize sebelum simpan. Max 2MB per gambar. Store di `/public/uploads/circle/` atau S3 |
| Real-time updates | Polling setiap 30 detik untuk feed baru (atau WebSocket di future) |
| Cache | React Query dengan stale time 30 detik untuk feed, 5 menit untuk profile |
| Bundle size | Lazy load halaman MonCircle (`dynamic import`) agar tidak inflate initial bundle |

### 10.2 Database

| Concern | Solution |
|---|---|
| SQLite concurrency | WAL mode sudah aktif. MonCircle write operations harus di-queue jika high traffic |
| Migration | Semua tabel baru, tidak ada breaking change pada existing tables (hanya ALTER ADD COLUMN) |
| Backup | MonCircle data included dalam daily backup existing |
| Data isolation | Hapus MonCircle data tidak mempengaruhi financial data (terpisah sepenuhnya) |

### 10.3 File Structure

```
src/
├── app/(protected)/circle/
│   ├── page.tsx                        # Feed utama
│   ├── layout.tsx                      # Circle layout (jika perlu)
│   ├── post/[id]/page.tsx              # Detail post
│   ├── profile/[username]/page.tsx     # Profil user
│   ├── explore/page.tsx                # Explore / discover
│   ├── notifications/page.tsx          # Notifikasi sosial
│   ├── bookmarks/page.tsx              # Bookmarks
│   ├── challenges/page.tsx             # Challenges
│   ├── groups/page.tsx                 # Groups list
│   ├── groups/[id]/page.tsx            # Group detail
│   └── components/                     # Semua komponen MonCircle
│       ├── PostCard.tsx
│       ├── PostComposer.tsx
│       ├── CommentSection.tsx
│       ├── CommentItem.tsx
│       ├── ReactionBar.tsx
│       ├── ReactionPicker.tsx
│       ├── FinancialCard.tsx
│       ├── PollCard.tsx
│       ├── MoodBadge.tsx
│       ├── UserAvatar.tsx
│       ├── UserCard.tsx
│       ├── FollowButton.tsx
│       ├── SocialProfile.tsx
│       ├── ProfileTabs.tsx
│       ├── FeedTabs.tsx
│       ├── FeedList.tsx
│       ├── NewPostsIndicator.tsx
│       ├── TrendingHashtags.tsx
│       ├── SuggestedUsers.tsx
│       ├── ChallengeCard.tsx
│       ├── ChallengeLeaderboard.tsx
│       ├── GroupCard.tsx
│       ├── GroupHeader.tsx
│       ├── NotificationItem.tsx
│       └── NotificationBadge.tsx
│
├── app/api/moncircle/
│   ├── feed/route.ts                   # GET feed (following + trending)
│   ├── feed/trending/route.ts          # GET trending feed
│   ├── feed/following/route.ts         # GET following feed
│   ├── posts/route.ts                  # GET list, POST create
│   ├── posts/[id]/route.ts             # GET detail, PUT edit, DELETE
│   ├── posts/[id]/react/route.ts       # POST react, DELETE unreact
│   ├── posts/[id]/comments/route.ts    # GET list, POST create
│   ├── posts/[id]/repost/route.ts      # POST repost
│   ├── comments/[id]/route.ts          # DELETE comment
│   ├── comments/[id]/like/route.ts     # POST like comment
│   ├── follow/[userId]/route.ts        # POST follow, DELETE unfollow
│   ├── follow-request/[id]/route.ts    # PUT accept/reject
│   ├── followers/route.ts              # GET followers
│   ├── following/route.ts              # GET following
│   ├── suggested/route.ts              # GET suggested users
│   ├── profile/route.ts                # PUT update profile
│   ├── profile/[username]/route.ts     # GET user profile
│   ├── block/[userId]/route.ts         # POST block
│   ├── mute/[userId]/route.ts          # POST mute
│   ├── bookmarks/route.ts              # GET list, POST add
│   ├── bookmarks/[postId]/route.ts     # DELETE remove
│   ├── notifications/route.ts          # GET list
│   ├── notifications/read/route.ts     # PUT mark all read
│   ├── notifications/unread-count/route.ts # GET unread count
│   ├── search/route.ts                 # GET search
│   ├── hashtags/trending/route.ts      # GET trending hashtags
│   ├── hashtags/[name]/route.ts        # GET posts by hashtag
│   ├── challenges/route.ts             # GET list
│   ├── challenges/[id]/join/route.ts   # POST join
│   ├── challenges/[id]/leaderboard/route.ts # GET leaderboard
│   ├── groups/route.ts                 # GET list, POST create
│   ├── groups/[id]/route.ts            # GET detail
│   ├── groups/[id]/join/route.ts       # POST join
│   ├── groups/[id]/leave/route.ts      # DELETE leave
│   └── groups/[id]/posts/route.ts      # GET feed, POST create
│
├── backend/db/
│   ├── schema.ts                       # + 10 tabel baru (mc_*)
│   └── circle-operations.ts            # Semua DB operations untuk MonCircle
│
├── frontend/hooks/
│   ├── useCircleFeed.ts
│   ├── useCirclePost.ts
│   ├── useCircleComments.ts
│   ├── useCircleNotifications.ts
│   ├── useCircleProfile.ts
│   ├── useCircleFollow.ts
│   └── useCircleReaction.ts
│
└── lib/
    ├── circle-moderation.ts            # Content moderation utilities
    └── circle-tier-gate.ts             # Tier limits untuk MonCircle
```

### 10.4 Dependency Baru

Tidak ada dependency baru yang diperlukan. Semua bisa dibangun dengan stack existing:

| Kebutuhan | Solusi (Existing) |
|---|---|
| UI Components | Tailwind CSS + Framer Motion (sudah ada) |
| State Management | React Query / TanStack Query (sudah ada) |
| Icons | Lucide React (sudah ada) |
| Image Processing | Sharp (sudah ada) |
| Date Formatting | date-fns (sudah ada) |
| Validation | Zod / Drizzle-Zod (sudah ada) |
| Database | SQLite + Drizzle ORM (sudah ada) |
| Auth | next-auth (sudah ada) |

---

## Summary

### MonCircle dalam Angka

| Metrik | Jumlah |
|---|---|
| Tabel database baru | 10 |
| Kolom ditambah ke tabel existing | 6 |
| API endpoints baru | ~40 |
| Halaman baru | 10 |
| Komponen baru | ~25 |
| Custom hooks baru | 7 |
| Estimasi total development | 6 minggu (~200 jam) |
| Estimasi baris kode baru | ~8,000-12,000 |

### Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Feature bloat (terlalu banyak fitur) | Phase-based rollout. Phase 1-2 sudah usable. Phase 3-5 bisa ditunda. |
| Performance degradation | Cursor pagination, denormalized counts, lazy loading |
| Abuse / toxicity | Rate limiting, report system, admin moderation, word filter |
| User adoption rendah | Auto-share prompts, dashboard integration, gamification badges |
| Privacy concerns | Per-post privacy, financial card masking, private profiles |
| SQLite write contention | WAL mode + queue writes. Jika traffic tinggi, migrate ke PostgreSQL. |

### Apa yang Membuat MonCircle Unik?

1. **Financial Card Attachment** -- Satu-satunya social feature yang bisa attach data keuangan real
2. **Challenge System** -- Gamified financial challenges bersama komunitas
3. **Weekly Wrap** -- Auto-generated financial summary card yang bisa di-share
4. **Context-Aware** -- Social features yang memperkuat financial tracking, bukan terpisah
5. **Privacy-First Design** -- Nominal di-mask by default, full user control

MonCircle bukan sekadar "Twitter di dalam app keuangan" -- ini adalah **social layer yang membuat financial tracking lebih engaging, accountable, dan komunal**.
