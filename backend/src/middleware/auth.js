import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const requireAuth = async (req, res, next) => {
  // 1. Tokenni headerdan YOKI manzil qatoridan (query) qidiramiz
  let token;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token; // <video src="...?token=..."> uchun maxsus
  }

  if (!token) {
    return res.status(401).json({ error: "Avtorizatsiyadan o'tilmagan" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    const { rows } = await pool.query('SELECT id, role FROM users WHERE id = $1', [payload.id]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: "Akkaunt topilmadi" });
    }
    
    req.user = rows[0];
    next();
  } catch (err) {
    console.error("Token xatoligi:", err.message);
    return res.status(401).json({ error: "Yaroqsiz yoki muddati o'tgan token" });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: "Ruxsat etilmagan amal" });
    }
    next();
  };
};