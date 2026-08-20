import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../upload.js';

const router = Router();

// 1. BARCHA YULDUZLARNI OLISH (Faqat tasdiqlangan va faol bo'lgan yulduzlar)
// XAVFSIZLIK: Oddiy mijozlarga faqat vizual ko'rinadigan ustunlar yuboriladi
router.get('/', async (req, res) => {
  const { category, q } = req.query;

  try {
    let query = `
      SELECT 
        s.user_id as id, 
        u.name, 
        COALESCE(u.avatar_url, '') as avatar,
        s.category,
        s.price,
        s.is_active,
        s.trending,
        COALESCE((
            SELECT ROUND(AVG(r.rating), 1) 
            FROM reviews r 
            JOIN orders o ON r.order_id = o.id 
            WHERE o.star_id = s.user_id
        ), 0) as rating
      FROM star_profiles s
      JOIN users u ON s.user_id = u.id
      WHERE s.verified = true AND u.is_banned = false
    `;
    const values = [];
    let valueIndex = 1;

    if (category) {
      query += ` AND s.category = $${valueIndex}`;
      values.push(category);
      valueIndex++;
    }

    if (q) {
      query += ` AND u.name ILIKE $${valueIndex}`;
      values.push(`%${q}%`);
      valueIndex++;
    }

    const { rows } = await pool.query(query, values);
    res.json({ stars: rows });
  } catch (err) {
    console.error("Yulduzlarni olishda xatolik:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

// 2. YULDUZ PROFILINI TAHRIRLASH (Faqat yulduzning o'zi uchun)
router.put('/profile', requireAuth, requireRole('star'), upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'cover', maxCount: 1 }
]), async (req, res) => {
  const { price, bio, category, weekly_limit, is_active, unavailable_reason, telegram, instagram, youtube } = req.body;

  try {
    const oldProfileQ = await pool.query('SELECT cover_url, verified, telegram, instagram, youtube, is_active, inactive_since FROM star_profiles WHERE user_id = $1', [req.user.id]);
    const oldUserQ = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);

    const oldProfile = oldProfileQ.rows[0];
    const oldAvatarPath = oldUserQ.rows[0]?.avatar_url;
    const oldCoverPath = oldProfile?.cover_url;

    const newAvatar = req.files?.['avatar'] ? `/uploads/photos/${req.files['avatar'][0].filename}` : oldAvatarPath;
    const newCover = req.files?.['cover'] ? `/uploads/photos/${req.files['cover'][0].filename}` : oldCoverPath;

    // Tasdiqlangan yulduzlar ijtimoiy tarmoqlarini o'zboshimchalik bilan o'zgartira olmaydi
    const finalTelegram = oldProfile?.verified ? oldProfile.telegram : (telegram || '');
    const finalInstagram = oldProfile?.verified ? oldProfile.instagram : (instagram || '');
    const finalYoutube = oldProfile?.verified ? oldProfile.youtube : (youtube || '');
    const limitVal = (weekly_limit === '' || weekly_limit === 'null') ? null : parseInt(weekly_limit);
    const isActiveBool = (is_active === 'true' || is_active === true);

    // XAVFSIZLIK TUZATILDI: bu cheklovlar avval faqat frontendda tekshirilardi,
    // shuning uchun to'g'ridan-to'g'ri API so'rovi orqali osongina chetlab o'tilardi
    // (masalan, narxni 1 so'mga yoki haftalik limitni manfiy songa o'rnatish mumkin edi).
    const priceNum = parseFloat(price);
    if (Number.isNaN(priceNum) || priceNum < 100000 || priceNum > 5000000) {
      return res.status(400).json({ error: "Narx 100 000 va 5 000 000 so'm oralig'ida bo'lishi kerak" });
    }
    if (limitVal !== null && (Number.isNaN(limitVal) || limitVal < 5)) {
      return res.status(400).json({ error: "Haftalik buyurtma limiti kamida 5 ta bo'lishi kerak" });
    }
    const ALLOWED_CATEGORIES = ['actors','singers','bloggers','youtubers','vtubers','sportsmen','esports','comedians','tv-hosts','voice-actors','musicians','mentors','fitness','kids'];
    if (category && !ALLOWED_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: "Noto'g'ri kategoriya tanlandi" });
    }
    
    let newInactiveSince = oldProfile?.inactive_since;
    if (!isActiveBool && oldProfile?.is_active) {
      newInactiveSince = new Date();
    } else if (isActiveBool) {
      newInactiveSince = null;
    }

    await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [newAvatar, req.user.id]);

    const { rows } = await pool.query(
      `UPDATE star_profiles 
       SET price = $1, bio = $2, category = $3, cover_url = $4, 
           weekly_limit = $5, is_active = $6, unavailable_reason = $7, 
           telegram = $8, instagram = $9, youtube = $10, inactive_since = $11 
       WHERE user_id = $12 RETURNING *`,
      [
        priceNum, bio || '', category || 'actors', newCover, 
        limitVal, isActiveBool, unavailable_reason || '', 
        finalTelegram, finalInstagram, finalYoutube, newInactiveSince, req.user.id
      ]
    );

    // Eski rasmlarni diskdan o'chirish (Xotirani tozalash)
    if (req.files?.['avatar'] && oldAvatarPath && oldAvatarPath.startsWith('/uploads')) {
      await fs.unlink(path.join(process.cwd(), oldAvatarPath)).catch(() => {});
    }
    if (req.files?.['cover'] && oldCoverPath && oldCoverPath.startsWith('/uploads')) {
      await fs.unlink(path.join(process.cwd(), oldCoverPath)).catch(() => {});
    }

    res.json({ success: true, profile: rows[0] });
  } catch (err) {
    console.error("Profilni yangilashda xatolik:", err);
    res.status(500).json({ error: "Profilni saqlashda xatolik yuz berdi" });
  }
});

// 3. YULDUZ TASDIQLASH VIDEOSI VA IJTIMOIY TARMOQLARNI YUKLASHI
router.post('/verify', requireAuth, requireRole('star'), upload.single('video'), async (req, res) => {
  const { telegram, instagram, youtube } = req.body;
  if (!req.file) return res.status(400).json({ error: "Video fayli yuklanmadi" });

  try {
    const oldQ = await pool.query('SELECT verification_video FROM star_profiles WHERE user_id = $1', [req.user.id]);
    if (oldQ.rows[0]?.verification_video) {
      await fs.unlink(path.join(process.cwd(), oldQ.rows[0].verification_video)).catch(() => {});
    }

    const videoPath = `/uploads/videos/${req.file.filename}`;

    await pool.query(
      `UPDATE star_profiles 
       SET verification_status = 'pending', 
           verification_video = $1, 
           telegram = $2, 
           instagram = $3, 
           youtube = $4 
       WHERE user_id = $5`,
      [videoPath, telegram || '', instagram || '', youtube || '', req.user.id]
    );

    res.json({ success: true, status: 'pending' });
  } catch (err) {
    console.error("Tasdiqlash so'rovida xatolik:", err);
    res.status(500).json({ error: "Ma'lumotlarni saqlashda xatolik" });
  }
});

// 4. BITTA YULDUZNING TO'LIQ MA'LUMOTLARINI OLISH (Mijozlar uchun xavfsizlantirilgan)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!id || id === 'undefined') return res.status(400).json({ error: 'Yaroqsiz ID' });

  try {
    const starQ = await pool.query(
      `SELECT 
           s.user_id as id, 
           u.name, 
           COALESCE(u.avatar_url, '') as avatar,
           s.cover_url as cover,
           s.category,
           s.bio,
           s.price,
           s.is_active,
           s.trending,
           s.unavailable_reason,
           s.verified,
           u.is_banned,
           
           s.verification_status,
           s.verification_message,

           s.telegram,
           s.instagram,
           s.youtube,
           
           COALESCE((SELECT ROUND(AVG(r.rating), 1) FROM reviews r JOIN orders o ON r.order_id = o.id WHERE o.star_id = s.user_id), 0) as rating,
           (SELECT COUNT(*) FROM orders WHERE star_id = s.user_id AND created_at >= date_trunc('week', CURRENT_DATE)) as this_week_orders
       FROM star_profiles s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.user_id = $1`,
      [id]
    );

    if (starQ.rows.length === 0) return res.status(404).json({ error: 'Yulduz topilmadi' });

    // MAXFIYLIK TUZATILDI: avval BARCHA yetkazilgan buyurtmalar (shaxsiy sovg'a videolari,
    // qabul qiluvchining haqiqiy ismi bilan) mijoz roziligisiz ommaviy ko'rsatilardi.
    // Endi faqat mijoz buyurtma berishda "ommaviy ko'rsatishga roziman" deb belgilagan
    // videolar (is_public_showcase = true) portfolioda chiqadi.
    const videosQ = await pool.query(
      `SELECT id, recipient_name, occasion, video_url, recipient_photo_url, created_at 
       FROM orders 
       WHERE star_id = $1 AND status = 'delivered' AND is_public_showcase = true
       ORDER BY created_at DESC`, 
       [id]
    );

    const reviewsQ = await pool.query(
      `SELECT r.id, r.rating, r.text, r.created_at, u.name as client_name 
       FROM reviews r 
       JOIN orders o ON r.order_id = o.id 
       JOIN users u ON o.client_id = u.id 
       WHERE o.star_id = $1 
       ORDER BY r.created_at DESC`, 
       [id]
    );

    res.json({ star: starQ.rows[0], videos: videosQ.rows, reviews: reviewsQ.rows });
  } catch (err) {
    console.error("Yulduz profilini olishda xato:", err);
    res.status(500).json({ error: 'Server xatoligi yuz berdi' });
  }
});

export default router;