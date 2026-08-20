import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Shartlar matni yangilansa, bu versiyani ham oshiring — shunda eski
// foydalanuvchilardan yangi shartlarga qayta rozilik so'rash imkoni bo'ladi.
const TERMS_VERSION = '2026-08-17';

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar_url,
  };
}

router.post('/register', async (req, res) => {
  const { name, email, password, acceptTerms } = req.body;

  // XAVFSIZLIK TUZATILDI: rolni hech qachon so'rov tanasidan (req.body) ishonib olmaymiz.
  // Faqat 'client' yoki 'star' ruxsat etiladi — 'admin' faqat qo'lda/ichki jarayon orqali beriladi.
  const requestedRole = req.body.role;
  const role = requestedRole === 'star' ? 'star' : 'client';

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Ism, email va parolni to'liq kiriting" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Parol kamida 6 belgidan iborat bo'lishi kerak" });
  }
  // Ommaviy Oferta: "Tizimdan ro'yxatdan o'tish... ushbu shartlarga to'liq va so'zsiz
  // rozi bo'lishni anglatadi" — shuning uchun rozilik bosilmasa ro'yxatdan o'tkazmaymiz.
  if (acceptTerms !== true && acceptTerms !== 'true') {
    return res.status(400).json({ error: "Davom etish uchun xizmat shartlarini qabul qilishingiz kerak" });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(password, 10);
    
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email.toLowerCase(), passwordHash, role]
    );
    const user = rows[0];

    if (role === 'star') {
      await client.query(
        `INSERT INTO star_profiles (user_id, category, bio, price) 
         VALUES ($1, $2, $3, $4)`,
        [user.id, 'bloggers', "Salom! Men VIDO platformasida yangi yulduzman.", 100000]
      );
    }

    // Rozilikni vaqt bilan birga qayd etamiz — kelajakda "siz shartlarga rozi
    // bo'lgansiz" degan da'voni isbotlash uchun kerak bo'ladi.
    await client.query(
      `INSERT INTO terms_acceptances (user_id, terms_version, ip_address) VALUES ($1, $2, $3)`,
      [user.id, TERMS_VERSION, req.ip]
    );

    await client.query('COMMIT');
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') { // unique_violation
      return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
    }
    console.error("Ro'yxatdan o'tishda xatolik:", e);
    res.status(500).json({ error: 'Serverda ichki xatolik yuz berdi' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email va parolni kiriting' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: "Email yoki parol noto'g'ri" });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: "Sizning hisobingiz ma'muriyat tomonidan bloklangan." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Email yoki parol noto'g'ri" });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("Login xatosi:", err);
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    res.status(500).json({ error: "Server xatoligi" });
  }
});

router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GOOGLE AUTH MANTIG'I (TO'LIQ VA TOG'RILANDI)
router.post('/google', async (req, res) => {
  const { token, acceptTerms } = req.body;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let userQ = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    let user = userQ.rows[0];

    if (!user) {
      // Yangi hisob yaratilayotgan bo'lsa, shartlarga rozilik ham talab qilinadi
      // (mavjud foydalanuvchi qayta kirayotganda bu shart emas).
      if (acceptTerms !== true && acceptTerms !== 'true') {
        return res.status(400).json({ error: "Davom etish uchun xizmat shartlarini qabul qilishingiz kerak", requiresTerms: true });
      }
      const dummyPasswordHash = await bcrypt.hash(Math.random().toString(), 10);
      const result = await pool.query(
        'INSERT INTO users (name, email, avatar_url, role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, email.toLowerCase(), picture, 'client', dummyPasswordHash]
      );
      user = result.rows[0];
      await pool.query(
        `INSERT INTO terms_acceptances (user_id, terms_version, ip_address) VALUES ($1, $2, $3)`,
        [user.id, TERMS_VERSION, req.ip]
      );
    }

    if (user.is_banned) {
      return res.status(403).json({ error: "Hisobingiz bloklangan." });
    }

    const jwtToken = signToken(user);
    res.json({ token: jwtToken, user: publicUser(user) });
  } catch (err) {
    console.error("Google auth xatoligi:", err);
    res.status(401).json({ error: "Google orqali kirishda xatolik yuz berdi" });
  }
});

export default router;