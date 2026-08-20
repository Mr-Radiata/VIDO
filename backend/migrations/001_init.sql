-- VIDO — asosiy sxema (TO'LIQ YANGILANGAN)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('client', 'star', 'admin')),
  avatar_url    TEXT,
  is_banned     BOOLEAN NOT NULL DEFAULT false,
  warning_count INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Faqat role='star' foydalanuvchilar uchun qo'shimcha profil ma'lumotlari
CREATE TABLE IF NOT EXISTS star_profiles (
  user_id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  category             TEXT NOT NULL DEFAULT 'bloggers' CHECK (category IN ('actors', 'singers', 'bloggers')),
  bio                  TEXT NOT NULL DEFAULT '',
  price                INTEGER NOT NULL DEFAULT 100000,
  cover_url            TEXT,
  verified             BOOLEAN NOT NULL DEFAULT false,
  trending             BOOLEAN NOT NULL DEFAULT false,
  weekly_limit         INTEGER DEFAULT NULL,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  unavailable_reason   TEXT DEFAULT '',
  inactive_since       TIMESTAMPTZ,
  verification_status  TEXT DEFAULT 'idle',
  verification_video   TEXT,
  verification_message TEXT,
  telegram             TEXT DEFAULT '',
  instagram            TEXT DEFAULT '',
  youtube              TEXT DEFAULT '',
  rating               NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  star_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name      TEXT NOT NULL,
  occasion            TEXT NOT NULL,
  instructions        TEXT NOT NULL,
  recipient_photo_url TEXT,
  price               INTEGER NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'rejected')),
  video_url           TEXT,
  qr_value            TEXT,
  rejection_reason    TEXT,
  rejection_comment   TEXT,
  is_resolved         BOOLEAN DEFAULT false,
  guilty_party        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  star_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_id)
);

CREATE TABLE IF NOT EXISTS portfolio_videos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  thumbnail_url TEXT,
  occasion      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bildirishnomalar jadvali
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Yordam tizimlari (Support Tickets)
CREATE TABLE IF NOT EXISTS support_tickets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject    TEXT NOT NULL,
  status     TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_orders_star ON orders(star_id);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_star ON reviews(star_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON support_tickets(user_id);
