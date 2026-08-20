import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { subject, message, status } = req.body;
  if (!subject || !message) return res.status(400).json({ error: "Mavzu va xabar kiritilishi shart" });
  try {
    const ticketRes = await pool.query(
      "INSERT INTO support_tickets (user_id, subject, status) VALUES ($1, $2, $3) RETURNING id",
      [req.user.id, subject, status || 'open']
    );
    const ticketId = ticketRes.rows[0].id;
    await pool.query(
      "INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)",
      [ticketId, req.user.id, message]
    );
    res.status(201).json({ success: true, ticketId });
  } catch (err) {
    res.status(500).json({ error: "Murojaat yaratishda xatolik yuz berdi" });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    let query;
    let values = [];
    if (req.user.role === 'admin') {
      query = `
        SELECT t.*, u.name as user_name, u.role as user_role 
        FROM support_tickets t 
        JOIN users u ON t.user_id = u.id 
        ORDER BY CASE WHEN t.status = 'open' THEN 1 ELSE 2 END, t.updated_at DESC
      `;
    } else {
      query = "SELECT * FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC";
      values = [req.user.id];
    }
    const { rows } = await pool.query(query, values);
    res.json({ tickets: rows });
  } catch (err) {
    res.status(500).json({ error: "Murojaatlarni yuklashda xatolik" });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const ticketQ = await pool.query("SELECT * FROM support_tickets WHERE id = $1", [id]);
    const ticket = ticketQ.rows[0];
    
    if (!ticket) return res.status(404).json({ error: "Murojaat topilmadi" });
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: "Ruxsat etilmagan sahifa" });
    }

    const msgQ = await pool.query(`
      SELECT m.*, u.name as sender_name, u.role as sender_role 
      FROM ticket_messages m 
      JOIN users u ON m.sender_id = u.id 
      WHERE m.ticket_id = $1 
      ORDER BY m.created_at ASC
    `, [id]);
    res.json({ ticket, messages: msgQ.rows });
  } catch (err) {
    res.status(500).json({ error: "Xabarlarni o'qishda xatolik" });
  }
});

router.post('/:id/reply', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Xabar matni bo'sh bo'lishi mumkin emas" });
  try {
    const ticketQ = await pool.query("SELECT * FROM support_tickets WHERE id = $1", [id]);
    const ticket = ticketQ.rows[0];
    if (!ticket) return res.status(404).json({ error: "Murojaat topilmadi" });
    if (req.user.role !== 'admin' && ticket.user_id !== req.user.id) {
      return res.status(403).json({ error: "Ruxsat etilmagan" });
    }

    await pool.query("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)", [id, req.user.id, message]);
    
    const newStatus = req.user.role === 'admin' ? 'answered' : 'open';
    await pool.query("UPDATE support_tickets SET status = $1, updated_at = NOW() WHERE id = $2", [newStatus, id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Javob yuborishda xatolik yuz berdi" });
  }
});

router.put('/:id/close', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const ticketQ = await pool.query("SELECT user_id FROM support_tickets WHERE id = $1", [id]);
    if (ticketQ.rows.length === 0) return res.status(404).json({ error: "Topilmadi" });
    if (req.user.role !== 'admin' && ticketQ.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: "Ruxsat etilmagan" });
    }
    await pool.query("UPDATE support_tickets SET status = 'closed', updated_at = NOW() WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Murojaatni yopishda xatolik" });
  }
});

// YANGI: O'qilganini bildirish (Badge o'chishi uchun)
router.put('/:id/read', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    // Faqat javob berilgan xatlarni "o'qildi" (viewed) qilib belgilaymiz
    await pool.query("UPDATE support_tickets SET status = 'viewed' WHERE id = $1 AND status = 'answered'", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Xatoni o'qishda muammo" });
  }
});

export default router;