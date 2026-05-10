CREATE TABLE split_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    creator_id INTEGER NOT NULL,
    public_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    total_amount REAL NOT NULL,
    receipt_image_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_instructions TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE INDEX idx_split_bills_creator_id ON split_bills (creator_id);
CREATE UNIQUE INDEX idx_split_bills_public_id_unique ON split_bills (public_id);
CREATE INDEX idx_split_bills_status ON split_bills (status);

CREATE TABLE split_bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    split_bill_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    assigned_participant_id INTEGER,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    FOREIGN KEY (split_bill_id) REFERENCES split_bills(id) ON DELETE CASCADE
);

CREATE INDEX idx_split_bill_items_split_bill_id ON split_bill_items (split_bill_id);

CREATE TABLE split_bill_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    split_bill_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    amount_owed REAL NOT NULL,
    payment_token TEXT NOT NULL,
    paid_at INTEGER,
    payment_proof_url TEXT,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000),
    FOREIGN KEY (split_bill_id) REFERENCES split_bills(id) ON DELETE CASCADE
);

CREATE INDEX idx_split_bill_participants_split_bill_id ON split_bill_participants (split_bill_id);
CREATE UNIQUE INDEX idx_split_bill_participants_payment_token_unique ON split_bill_participants (payment_token);
