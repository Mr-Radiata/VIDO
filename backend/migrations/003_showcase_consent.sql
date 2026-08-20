-- Avval HAR BIR yetkazilgan (delivered) buyurtma mijozning roziligisiz avtomatik
-- ravishda star profilida OMMAVIY portfolio sifatida ko'rsatilardi (qabul qiluvchining
-- haqiqiy ismi bilan birga). Endi bu ixtiyoriy: mijoz buyurtma berayotganda tanlaydi.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_public_showcase BOOLEAN NOT NULL DEFAULT false;
