-- ==========================================================
-- TO'LOV TIZIMI (ESCROW) VA SHARTLARNI QABUL QILISH
-- ==========================================================

-- 1) Yulduzlar uchun balans ustunlari
--    balance         — yechib olish mumkin bo'lgan asosiy balans (so'mda, butun son)
--    frozen_balance  — hozircha "muzlatilgan" (kutilayotgan, hali chiqarilmagan) summa —
--                      faqat ma'lumot ko'rsatish uchun; haqiqiy manba har doim
--                      transactions jadvali va orders.payment_status hisoblanadi
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance BIGINT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS frozen_balance BIGINT NOT NULL DEFAULT 0;

-- 2) Har bir pul harakatini alohida yozib boradigan umumiy "bank kitobi" (ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- user_id NULL bo'lishi mumkin: platformaning o'z komissiya yozuvlari
  -- (type='commission') hech qaysi foydalanuvchiga emas, platformaning o'ziga tegishli
  user_id                  UUID REFERENCES users(id) ON DELETE SET NULL,
  order_id                 UUID REFERENCES orders(id) ON DELETE SET NULL,
  amount                   INTEGER NOT NULL,
  type                     TEXT NOT NULL CHECK (type IN ('topup', 'escrow_hold', 'escrow_release', 'refund', 'commission', 'withdrawal')),
  status                   TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  provider                 TEXT NOT NULL DEFAULT 'internal' CHECK (provider IN ('payme', 'click', 'internal')),
  provider_transaction_id  TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_provider_tx ON transactions(provider_transaction_id);

-- 3) Buyurtmaga to'lov holati (order.status'dan mustaqil — video holati bilan
--    pul holati bir xil narsa emas)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
  CHECK (payment_status IN ('unpaid', 'held', 'released', 'refunded'));

-- Har bir buyurtmada shu paytdagi komissiya foizi "muzlatib" saqlanadi —
-- kelajakda komissiya foizi o'zgarsa ham, eski buyurtmalar hisob-kitobi buzilmasin
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) NOT NULL DEFAULT 20.00;

-- Mijoz video yetkazilgandan keyin 24 soat ichida shikoyat (dispute) qilgan bo'lsa,
-- avtomatik pul chiqarish (cron) to'xtatiladi va nizo admin tomonidan hal qilinishini kutadi
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_disputed BOOLEAN NOT NULL DEFAULT false;

-- Buyurtma holatiga 'completed' qo'shamiz — bu "pul yulduzga o'tkazib bo'lingan,
-- butunlay yakunlangan" degan ma'noni bildiradi ('delivered' esa faqat "video tayyor,
-- lekin pul hali eskrovda" degani)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'delivered', 'rejected', 'completed'));

-- 4) Foydalanuvchi shartlarni (Ommaviy Oferta) qabul qilganligini saqlash
CREATE TABLE IF NOT EXISTS terms_acceptances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  terms_version  TEXT NOT NULL,
  accepted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address     TEXT
);
CREATE INDEX IF NOT EXISTS idx_terms_user ON terms_acceptances(user_id);
