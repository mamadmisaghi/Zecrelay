CREATE TABLE IF NOT EXISTS launches (
 id text PRIMARY KEY, owner_wallet text NOT NULL, name text NOT NULL, symbol text NOT NULL,
 description text NOT NULL DEFAULT '', mint text NOT NULL UNIQUE, mint_secret text NOT NULL,
 creator text NOT NULL, creator_secret text,
 image_type text NOT NULL, image_bytes bytea NOT NULL,
 reward_mode text NOT NULL CHECK(reward_mode IN ('holder','creator')),
 zec_address text, creator_fee_bps integer,
 initial_buy_raw numeric(30,0) NOT NULL DEFAULT 0,
 website text, twitter text, telegram text, quote_mint text NOT NULL,
 status text NOT NULL DEFAULT 'preparing' CHECK(status IN ('preparing','prepared','submitted','confirmed','failed','expired')),
 message_base64 text, transaction_base64 text, signature text, last_valid_height bigint,
 error text, created_at timestamptz NOT NULL DEFAULT now(), confirmed_at timestamptz,
 CHECK((reward_mode='holder' AND zec_address IS NULL) OR (reward_mode='creator' AND zec_address IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS launches_public_idx ON launches(status,confirmed_at DESC);
CREATE INDEX IF NOT EXISTS launches_owner_idx ON launches(owner_wallet,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS creator_unique_for_fee_route ON launches(creator) WHERE reward_mode='creator';
CREATE TABLE IF NOT EXISTS fee_collections (
 id text PRIMARY KEY, launch_id text NOT NULL REFERENCES launches(id), signature text UNIQUE NOT NULL,
 amount_raw numeric(30,0) NOT NULL CHECK(amount_raw>0),
 status text NOT NULL DEFAULT 'preparing' CHECK(status IN ('preparing','submitted','confirmed','failed')),
 wire_base64 text, last_valid_height bigint, error text,
 created_at timestamptz NOT NULL DEFAULT now(), confirmed_at timestamptz
);
CREATE TABLE IF NOT EXISTS native_payouts (
 id text PRIMARY KEY, launch_id text NOT NULL REFERENCES launches(id), amount_raw numeric(30,0) NOT NULL CHECK(amount_raw>0),
 destination text NOT NULL, deposit_address text UNIQUE, quote_json jsonb,
 solana_signature text UNIQUE, solana_wire text, solana_last_valid_height bigint,
 zec_txid text, native_amount_raw numeric(30,0),
 status text NOT NULL DEFAULT 'reserved' CHECK(status IN ('reserved','quoted','submitted','processing','confirmed','refunded','failed','needs_review')),
 error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payout_launch_idx ON native_payouts(launch_id,created_at DESC);
CREATE TABLE IF NOT EXISTS fee_sweeps (
 id text PRIMARY KEY, launch_id text NOT NULL REFERENCES launches(id), amount_raw numeric(30,0) NOT NULL CHECK(amount_raw>0),
 signature text UNIQUE, wire_base64 text, last_valid_height bigint,
 status text NOT NULL CHECK(status IN ('reserved','submitted','confirmed','failed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
