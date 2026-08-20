import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Yangi sharh qo'shish (Klient tomonidan)
router.post('/', requireAuth, requireRole('client'), async (req, res) => {
  const { orderId, rating, text } = req.body;

  if (!orderId || !rating) {
    return res.status(400).json({ error: "Buyurtma ID si va baho kiritilishi majburiy!" });
  }
  const ratingNum = parseInt(rating, 10);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: "Baho 1 dan 5 gacha bo'lgan butun son bo'lishi kerak" });
  }

  try {
    // 1. Orderni tekshirish (faqat o'ziniki va status 'delivered' bo'lishi kerak)
    const orderQ = await pool.query('SELECT star_id, client_id, status FROM orders WHERE id = $1', [orderId]);
    const order = orderQ.rows[0];

    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });
    if (order.client_id !== req.user.id) return res.status(403).json({ error: "Siz faqat o'zingizning buyurtmangizni baholay olasiz" });
    if (order.status !== 'delivered') return res.status(400).json({ error: "Video hali to'liq tayyor emas" });

    // 2. DUPLIKATNI TEKSHIRISH (Bitta videoga qat'iy 1 ta baho)
    const checkQ = await pool.query('SELECT id FROM reviews WHERE order_id = $1', [orderId]);
    if (checkQ.rows.length > 0) {
      return res.status(400).json({ error: "Siz bu videoni allaqachon baholagansiz! (Bitta videoga bir marta baho beriladi)" });
    }

    // 3. Bahoni bazaga yozish
    // TUZATILDI: avval star_id va client_id yuborilmagani uchun bazadagi
    // NOT NULL cheklovi tufayli HAR BIR sharh 500 xato bilan tugagan edi.
    await pool.query(
      'INSERT INTO reviews (order_id, star_id, client_id, rating, text) VALUES ($1, $2, $3, $4, $5)',
      [orderId, order.star_id, order.client_id, ratingNum, text || '']
    );

    // 4. YULDUZNING UMUMIY REYTINGINI YANGILASH (O'rtacha hisoblash)
    await pool.query(`
      UPDATE star_profiles 
      SET rating = (
        SELECT COALESCE(ROUND(AVG(r.rating), 1), 0)
        FROM reviews r
        JOIN orders o ON r.order_id = o.id
        WHERE o.star_id = $1
      )
      WHERE user_id = $1
    `, [order.star_id]);

    res.json({ success: true, message: "Bahoyingiz qabul qilindi va reyting yangilandi!" });
  } catch (err) {
    console.error("Baholashda xatolik:", err);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
  }
});

export default router;