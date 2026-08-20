import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../upload.js';
// YENGI: Navbat tizimi ulangan
import { videoQueue } from '../queue.js';

const router = Router();

// 1. Buyurtma yaratish (Mijozlar tomonidan)
router.post('/', requireAuth, requireRole('client'), upload.single('recipientPhoto'), async (req, res) => {
  const { starId, recipientName, occasion, instructions, isPublicShowcase } = req.body;
  // MAXFIYLIK: mijoz aniq ravishda "ha" desagina (checkbox), video star profilida
  // ommaviy portfolio sifatida chiqadi. Aks holda faqat mijozning o'ziga ko'rinadi.
  const publicShowcase = isPublicShowcase === 'true' || isPublicShowcase === true;

  if (!starId || !recipientName || !instructions || !req.file) {
    return res.status(400).json({ error: "Barcha majburiy maydonlarni to'ldiring va rasmni yuklang" });
  }

  try {
    const starQ = await pool.query(`
      SELECT sp.price, sp.is_active, sp.weekly_limit, 
             (SELECT COUNT(*) FROM orders WHERE star_id = $1 AND created_at >= date_trunc('week', CURRENT_DATE)) as current_orders
      FROM star_profiles sp 
      WHERE sp.user_id = $1
    `, [starId]);
    
    const starProfile = starQ.rows[0];
    if (!starProfile) return res.status(404).json({ error: 'Yulduz topilmadi' });

    if (!starProfile.is_active) return res.status(403).json({ error: "Yulduz hozirda vaqtinchalik tanaffusda." });

    if (starProfile.weekly_limit !== null && starProfile.current_orders >= starProfile.weekly_limit) {
      return res.status(403).json({ error: "Ushbu yulduz joriy hafta uchun limitni to'ldirgan." });
    }

    const photoUrl = `/uploads/photos/${req.file.filename}`;

    const { rows } = await pool.query(
      `INSERT INTO orders (client_id, star_id, recipient_name, occasion, instructions, recipient_photo_url, price, is_public_showcase) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, starId, recipientName, occasion, instructions, photoUrl, starProfile.price, publicShowcase]
    );

    res.status(201).json({ order: rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server ichki xatoligi" });
  }
});

// 2. O'z buyurtmalarini olish (Yulduz yoki Mijoz uchun)
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const column = req.user.role === 'star' ? 'star_id' : 'client_id';
    // TUZATILDI: 'reviewed' maydoni qo'shildi — avval frontend buni faqat
    // local useState(false) bilan kuzatardi, sahifa yangilanganda har doim
    // qayta "false" bo'lib qolardi (mijoz allaqachon baholagan bo'lsa ham).
    const { rows } = await pool.query(
      `SELECT o.*, cu.name AS client_name, su.name AS star_name,
              EXISTS(SELECT 1 FROM reviews r WHERE r.order_id = o.id) AS reviewed
       FROM orders o JOIN users cu ON cu.id = o.client_id JOIN users su ON su.id = o.star_id 
       WHERE o.${column} = $1 ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ orders: rows });
  } catch (err) {
    res.status(500).json({ error: "Ma'lumotlarni yuklashda xatolik" });
  }
});

// 3. Videoni yuklash va ishlashga (BullMQ navbatiga) berish
router.post('/:id/deliver', requireAuth, requireRole('star'), upload.single('video'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) return res.status(400).json({ error: 'Video yuklanmadi' });

  try {
    // XATO #6 TUZATILDI: Faqat buyurtma egasi (shu yulduz) video yuklashi mumkin
    const orderQ = await pool.query('SELECT * FROM orders WHERE id = $1 AND star_id = $2', [id, req.user.id]);
    const order = orderQ.rows[0];

    if (!order) {
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(404).json({ error: 'Buyurtma topilmadi yoki sizga tegishli emas' });
    }

    const rawPhotoUrl = order.recipient_photo_url || '';
    const relativePhotoUrl = rawPhotoUrl.startsWith('/') ? rawPhotoUrl.slice(1) : rawPhotoUrl;
    
    let photoPath = null;
    if (relativePhotoUrl) {
       photoPath = path.join(process.cwd(), relativePhotoUrl).replace(/\\/g, '/');
    }

    const inputPath = req.file.path.replace(/\\/g, '/');
    // TUZATILDI: qattiq kodlangan domen o'rniga APP_PUBLIC_URL ishlatiladi,
    // shunda QR kod har qanday muhitda (local/staging/production) to'g'ri manzilga ishora qiladi.
    const publicUrl = (process.env.APP_PUBLIC_URL || 'https://getvido.uz').replace(/\/$/, '');
    const qrValue = `${publicUrl}/verify/${id}`;

    // SHU QATOR QO'SHILDI: Bazada holatni darhol "processing" ga o'tkazamiz
    await pool.query("UPDATE orders SET status = 'processing' WHERE id = $1", [order.id]);

    // ===============================================
    // YENGI MANTIQ: To'g'ridan-to'g'ri ishlash o'rniga navbatga qo'shamiz
    // ===============================================
    await videoQueue.add('process-video', { 
       orderId: order.id, 
       inputPath, 
       photoPath, 
       qrValue 
    });

    // Frontend darhol javob oladi, sahifa qotib turmaydi
    res.json({ order: { ...order, status: 'processing' } });

  } catch (err) {
    console.error('\n==== VIDEO NAVBATGA QO\'SHISHDA XATOLIK ====\n', err);
    
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(console.error);
    }
    res.status(500).json({ error: "Videoni navbatga qo'shishda xatolik", detail: err.message });
  }
});

// 4. Buyurtmani rad etish (Yulduzlar tomonidan)
router.put('/:id/reject', requireAuth, requireRole('star'), async (req, res) => {
  const { id } = req.params;
  const { reason, comment } = req.body;

  try {
    const check = await pool.query("SELECT id, client_id FROM orders WHERE id = $1 AND star_id = $2", [id, req.user.id]);
    if (check.rows.length === 0) return res.status(403).json({ error: "Bunday buyurtma sizda mavjud emas" });

    const clientId = check.rows[0].client_id;

    const { rows } = await pool.query(
      `UPDATE orders SET status = 'rejected', is_resolved = false, rejection_reason = $1, rejection_comment = $2 WHERE id = $3 RETURNING *`,
      [reason, comment, id]
    );

    // Admin va mijozga xabar berish
    await pool.query(
      `INSERT INTO notifications (user_id, title, message) SELECT id, $1, $2 FROM users WHERE role = 'admin'`,
      ["Yangi Rad Etilgan Buyurtma (Nizo)", `Diqqat: ${req.user.name} (Yulduz) buyurtmani rad etdi. Uni ko'rib chiqib kim haq ekanligini hal qiling.`]
    );

    await pool.query("INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)", 
       [clientId, "Buyurtma rad etildi", `Sizning buyurtmangiz yulduz tomonidan rad etildi. Hozirda bu holat ma'muriyat tomonidan ko'rib chiqilmoqda. Natijasi bo'yicha sizga xabar beramiz.`]
    );
    
    res.json({ success: true, order: rows[0] });

  } catch (err) {
    res.status(500).json({ error: "Buyurtmani bekor qilishda xato" });
  }
});

// 5. Mijoz tomonidan shikoyat (Ommaviy Oferta 5.3-band: video yetkazilgandan
//    keyin 24 soat ichida). Bu pulning avtomatik yulduzga o'tkazilishini
//    (cron orqali) to'xtatib turadi va nizoni admin ko'rib chiqishini kutadi.
router.put('/:id/dispute', requireAuth, requireRole('client'), async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  try {
    const orderQ = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND client_id = $2`,
      [id, req.user.id]
    );
    const order = orderQ.rows[0];
    if (!order) return res.status(404).json({ error: 'Buyurtma topilmadi yoki sizga tegishli emas' });

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: "Faqat yetkazilgan (delivered) buyurtmalar uchun shikoyat qoldirish mumkin" });
    }
    if (order.payment_status !== 'held') {
      return res.status(400).json({ error: "Bu buyurtma uchun pul allaqachon chiqarilgan yoki qaytarilgan" });
    }
    const hoursSinceDelivery = (Date.now() - new Date(order.delivered_at).getTime()) / 3_600_000;
    if (hoursSinceDelivery > 24) {
      return res.status(400).json({ error: "Shikoyat qoldirish muddati (video yetkazilgandan 24 soat) tugagan" });
    }
    if (order.client_disputed) {
      return res.status(400).json({ error: 'Bu buyurtma uchun shikoyat allaqachon qoldirilgan' });
    }

    const { rows } = await pool.query(
      `UPDATE orders SET client_disputed = true, is_resolved = false WHERE id = $1 RETURNING *`,
      [id]
    );

    await pool.query(
      `INSERT INTO notifications (user_id, title, message) SELECT id, $1, $2 FROM users WHERE role = 'admin'`,
      ["Yangi shikoyat (yetkazilgan video)", `Mijoz #${id} raqamli buyurtma bo'yicha shikoyat qoldirdi: "${comment || 'izohsiz'}". Pul chiqarilishi to'xtatildi, ko'rib chiqing.`]
    );

    res.json({ success: true, order: rows[0] });
  } catch (err) {
    console.error('Shikoyat yuborishda xatolik:', err);
    res.status(500).json({ error: 'Shikoyatni yuborishda xatolik yuz berdi' });
  }
});

export default router;