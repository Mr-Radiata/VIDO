import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// QR kod orqali videoni tekshirish (Ommaviy — autentifikatsiya talab etilmaydi)
// XATO #7 TUZATILDI: Bu endpoint avval umuman mavjud emas edi
router.get('/:orderId', async (req, res) => {
  const { orderId } = req.params;

  if (!orderId || orderId === 'undefined') {
    return res.status(400).json({ error: 'Yaroqsiz buyurtma ID si' });
  }

  try {
    const { rows } = await pool.query(`
      SELECT 
        o.id,
        o.recipient_name,
        o.occasion,
        o.video_url,
        o.recipient_photo_url,
        o.created_at,
        o.star_id,
        su.name as star_name,
        cu.name as client_name
      FROM orders o 
      JOIN users su ON o.star_id = su.id 
      JOIN users cu ON o.client_id = cu.id 
      WHERE o.id = $1 AND o.status = 'delivered'
    `, [orderId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bu buyurtma topilmadi yoki video hali tayyor emas' });
    }

    res.json({ verification: rows[0] });
  } catch (err) {
    console.error("QR tekshirishda xatolik:", err);
    res.status(500).json({ error: "Tekshirishda xatolik yuz berdi" });
  }
});

export default router;
