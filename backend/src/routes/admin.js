import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { refundToClient, releaseToStar, CLIENT_FAULT_PENALTY_RATE } from '../services/escrow.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', async (req, res) => {
  try {
    const clientsQ = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'client'");
    const starsQ = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'star'");
    const ordersQ = await pool.query("SELECT COUNT(*) FROM orders WHERE status = 'delivered'");
    const revenueQ = await pool.query("SELECT COALESCE(SUM(price), 0) as total FROM orders WHERE status = 'delivered'");
    
    const chartData = [
      { name: 'Yan', revenue: 0 },
      { name: 'Fev', revenue: 0 },
      { name: 'Mar', revenue: 0 },
      { name: 'Apr', revenue: 0 },
      { name: 'May', revenue: parseInt(revenueQ.rows[0].total) || 0 }
    ];
    
    res.json({
      clients: parseInt(clientsQ.rows[0].count),
      stars: parseInt(starsQ.rows[0].count),
      orders: parseInt(ordersQ.rows[0].count),
      revenue: parseInt(revenueQ.rows[0].total),
      chartData
    });
  } catch (err) {
    console.error("Statistikani olishda xato:", err);
    res.status(500).json({ error: "Statistikani yuklashda xatolik yuz berdi" });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, email, role, is_banned, warning_count, created_at 
      FROM users 
      ORDER BY created_at DESC
    `);
    res.json({ users: rows });
  } catch (err) {
    console.error("Foydalanuvchilarni olishda xato:", err);
    res.status(500).json({ error: "Ma'lumotlarni yuklashda xatolik yuz berdi" });
  }
});

router.put('/users/:id/ban', async (req, res) => {
  const { id } = req.params;
  const { is_banned } = req.body;
  try {
    await pool.query("UPDATE users SET is_banned = $1 WHERE id = $2", [is_banned, id]);
    res.json({ success: true, message: is_banned ? "Bloklandi" : "Bandan yechildi" });
  } catch (err) {
    res.status(500).json({ error: "Bloklashda xatolik yuz berdi" });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        u.id, u.name, u.email, 
        s.verification_video, s.verification_status,
        s.telegram, s.instagram, s.youtube /* <-- SHU 3 TA QATOR QO'SHILDI */
      FROM users u 
      JOIN star_profiles s ON u.id = s.user_id 
      WHERE s.verified = false AND s.verification_status = 'pending'
      ORDER BY u.created_at ASC
    `);
    res.json({ pending: rows });
  } catch (err) {
    console.error("Kutilayotganlarni olishda xato:", err);
    res.status(500).json({ error: "Arizalarni yuklashda xatolik yuz berdi" });
  }
});

router.put('/stars/:id/approve', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE star_profiles 
       SET verified = true, verification_status = 'approved', verification_message = NULL 
       WHERE user_id = $1`, 
      [id]
    );
    await pool.query(
      "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)", 
      [id, "Tabriklaymiz!", "Profilingiz ma'muriyat tomonidan muvaffaqiyatli tasdiqlandi. Endi siz mijozlardan buyurtma qabul qilishingiz mumkin."]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Tasdiqlashda xato:", err);
    res.status(500).json({ error: "Yulduzni tasdiqlashda xatolik yuz berdi" });
  }
});

router.post('/stars/:id/reject-verification', async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  try {
    const { rows } = await pool.query("SELECT verification_video FROM star_profiles WHERE user_id = $1", [id]);
    const videoPath = rows[0]?.verification_video;
    
    if (videoPath) {
      await fs.unlink(path.join(process.cwd(), videoPath)).catch((err) => {
        console.error("Xotiradan videoni o'chirishda xatolik:", err);
      });
    }
    
    await pool.query(
      `UPDATE star_profiles 
       SET verification_status = 'rejected', verification_message = $1, verification_video = NULL 
       WHERE user_id = $2`, 
      [message, id]
    );
    await pool.query(
      "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)", 
      [id, "Tasdiqlash rad etildi", `Siz yuborgan video rad etildi. Sabab: ${message}`]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Videoni rad etishda xato:", err);
    res.status(500).json({ error: "Rad etishda xatolik yuz berdi" });
  }
});

router.get('/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.rating, r.text, r.created_at, 
             u1.name as client_name, u2.name as star_name
      FROM reviews r
      JOIN orders o ON r.order_id = o.id
      JOIN users u1 ON o.client_id = u1.id
      JOIN users u2 ON o.star_id = u2.id
      ORDER BY r.created_at DESC
    `);
    res.json({ reviews: rows });
  } catch (err) {
    res.status(500).json({ error: "Sharhlarni yuklashda xatolik yuz berdi" });
  }
});

router.delete('/reviews/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM reviews WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Sharhni o'chirishda xatolik yuz berdi" });
  }
});

router.post('/notifications', async (req, res) => {
  const { target, title, message } = req.body;
  if (!target || !title || !message) {
    return res.status(400).json({ error: "Barcha maydonlarni to'ldiring" });
  }
  try {
    let userIds = [];
    if (target === 'all') {
      const { rows } = await pool.query("SELECT id FROM users");
      userIds = rows.map(r => r.id);
    } else if (target === 'stars') {
      const { rows } = await pool.query("SELECT id FROM users WHERE role = 'star'");
      userIds = rows.map(r => r.id);
    } else if (target === 'clients') {
      const { rows } = await pool.query("SELECT id FROM users WHERE role = 'client'");
      userIds = rows.map(r => r.id);
    } else {
      userIds = [parseInt(target)];
    }

    for (const uid of userIds) {
      if (uid) {
        await pool.query(
          "INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)", 
          [uid, title, message]
        );
      }
    }
    res.json({ success: true, count: userIds.length });
  } catch (err) {
    console.error("Xabar jo'natishda xato:", err);
    res.status(500).json({ error: "Xabarnoma yuborishda xatolik yuz berdi" });
  }
});

router.get('/notifications/history', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT title, message, COUNT(user_id) as recipients, MAX(created_at) as created_at, 'Guruh' as target_group
      FROM notifications
      GROUP BY title, message
      ORDER BY MAX(created_at) DESC
      LIMIT 50
    `);
    res.json({ history: rows });
  } catch (err) {
    res.status(500).json({ error: "Tarixni yuklashda xatolik yuz berdi" });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, cu.name as client_name, su.name as star_name
      FROM orders o
      JOIN users cu ON o.client_id = cu.id
      JOIN users su ON o.star_id = su.id
      ORDER BY 
        CASE WHEN o.status = 'rejected' AND o.is_resolved = false THEN 1 
             WHEN o.status = 'rejected' AND o.is_resolved = true THEN 2
             WHEN o.status = 'pending' THEN 3 
             ELSE 4 END, 
        o.created_at DESC
    `);
    res.json({ orders: rows });
  } catch (err) {
    console.error("Buyurtmalarni olishda xato:", err);
    res.status(500).json({ error: "Buyurtmalarni yuklashda xatolik yuz berdi" });
  }
});

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const userQ = await pool.query("SELECT id, name, email, role, is_banned, warning_count, avatar_url, created_at FROM users WHERE id = $1", [id]);
    const user = userQ.rows[0];
    if (!user) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });

    let stats = { total_orders: 0, total_spent: 0, total_earned: 0 };
    let orders = [];

    if (user.role === 'star') {
      const oq = await pool.query("SELECT COUNT(*) as count, SUM(price) as earned FROM orders WHERE star_id = $1 AND status = 'delivered'", [id]);
      stats.total_orders = parseInt(oq.rows[0].count) || 0;
      stats.total_earned = parseInt(oq.rows[0].earned) || 0;
      const listQ = await pool.query(`
        SELECT o.id, u.name as client_name, o.occasion, o.price, o.status, o.created_at 
        FROM orders o JOIN users u ON o.client_id = u.id WHERE o.star_id = $1 ORDER BY o.created_at DESC LIMIT 50`, [id]
      );
      orders = listQ.rows;
    } else {
      const oq = await pool.query("SELECT COUNT(*) as count, SUM(price) as spent FROM orders WHERE client_id = $1 AND status != 'rejected'", [id]);
      stats.total_orders = parseInt(oq.rows[0].count) || 0;
      stats.total_spent = parseInt(oq.rows[0].spent) || 0;
      const listQ = await pool.query(`
        SELECT o.id, u.name as star_name, o.occasion, o.price, o.status, o.created_at 
        FROM orders o JOIN users u ON o.star_id = u.id WHERE o.client_id = $1 ORDER BY o.created_at DESC LIMIT 50`, [id]
      );
      orders = listQ.rows;
    }

    res.json({ user, stats, orders });
  } catch (err) {
    res.status(500).json({ error: "Foydalanuvchi ma'lumotlarini yuklashda xatolik yuz berdi" });
  }
});

// 13. NIZONI (RAD ETILGAN BUYURTMANI) HAL QILISH
router.put('/orders/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { guiltyParty } = req.body; 

  try {
    // XATOLIK TUZATILDI: Yulduz ismini olish uchun ulandi
    const orderQ = await pool.query(`
      SELECT o.*, cu.name as client_name, su.name as star_name 
      FROM orders o 
      JOIN users cu ON o.client_id = cu.id 
      JOIN users su ON o.star_id = su.id 
      WHERE o.id = $1
    `, [id]);
    const order = orderQ.rows[0];
    
    if (!order) return res.status(404).json({ error: "Buyurtma topilmadi" });
    if (order.is_resolved) return res.status(400).json({ error: "Bu nizo allaqachon hal qilingan" });
    if (!['client', 'star'].includes(guiltyParty)) {
      return res.status(400).json({ error: "guiltyParty 'client' yoki 'star' bo'lishi kerak" });
    }

    // ==========================================================
    // PUL HARAKATI (Ommaviy Oferta 5.1/5.2-bandlariga muvofiq)
    // ==========================================================
    // Ikki xil nizo turi bor, va ularda "aybdor" so'zining pul oqibati farq qiladi:
    //  A) Yulduz oldindan rad etgan buyurtma (order.status === 'rejected'):
    //     aybdor=client  -> mijozning matni qoidabuzarlik edi -> 3% jarima ushlab, qolgani qaytariladi
    //     aybdor=star    -> yulduz asossiz rad etdi            -> 100% mijozga qaytariladi
    //  B) Mijoz video yetkazilgandan keyin shikoyat qilgan (client_disputed):
    //     aybdor=star    -> video haqiqatan sifatsiz/mos emas   -> 100% mijozga qaytariladi
    //     aybdor=client  -> shikoyat asossiz deb topildi        -> pul ODATDAGIDEK yulduzga o'tkaziladi
    //                        (bu holatda "jarima" tushunchasi tegishli emas — mijoz shunchaki noto'g'ri bo'lib chiqdi)
    if (order.payment_status === 'held') {
      try {
        if (order.client_disputed) {
          if (guiltyParty === 'star') {
            await refundToClient(order.id, 0);
          } else {
            await releaseToStar(order.id);
          }
        } else {
          if (guiltyParty === 'client') {
            await refundToClient(order.id, CLIENT_FAULT_PENALTY_RATE);
          } else {
            await refundToClient(order.id, 0);
          }
        }
      } catch (moneyErr) {
        console.error("Nizoni hal qilishda pul harakati xatoligi:", moneyErr);
        return res.status(500).json({ error: "Pul harakatini amalga oshirishda xatolik yuz berdi" });
      }
    }

    const targetUserId = guiltyParty === 'client' ? order.client_id : order.star_id;
    const isPreDeliveryRejection = !order.client_disputed; // ya'ni order.status === 'rejected' bo'lgan asl holat

    // 1. Aybdorga jarima bali faqat "asl qoidabuzarlik" holatlarida yoziladi
    //    (5.1/5.2-band). Mijozning yetkazilgan videoga shikoyati asossiz chiqishi
    //    (client_disputed=true, guiltyParty='client') qoidabuzarlik emas — bu holatda
    //    jarima bali yozilmaydi, faqat pul odatdagidek yulduzga o'tkaziladi.
    let warnings = 0;
    let userName = '';
    if (isPreDeliveryRejection) {
      await pool.query('UPDATE users SET warning_count = warning_count + 1 WHERE id = $1', [targetUserId]);
      const userQ = await pool.query('SELECT warning_count, name FROM users WHERE id = $1', [targetUserId]);
      warnings = userQ.rows[0].warning_count;
      userName = userQ.rows[0].name;

      if (warnings >= 3) {
         await pool.query('UPDATE users SET is_banned = true WHERE id = $1', [targetUserId]);
         await pool.query(
           "INSERT INTO notifications (user_id, title, message) SELECT id, $1, $2 FROM users WHERE role = 'admin'",
           ["Avtomatik Bloklash", `TIZIM: "${userName}" 3 ta jarima bali olganligi sababli avtomatik tarzda bloklandi!`]
         );
      }
    }

    let clientMsg = "";
    let starMsg = "";

    // 2. Xabar matnlarini moslashtirish — ikkala nizo turi uchun alohida
    if (isPreDeliveryRejection) {
      if (guiltyParty === 'client') {
        clientMsg = `Ma'muriyat #${id} raqamli buyurtma bo'yicha shikoyatingizni to'liq o'rganib chiqdi. Afsuski, yozgan matningiz platforma qoidalariga zid (noo'rin) deb topildi. Sizga 1 ta jarima bali yozildi (${warnings}/3). Agar bu holat takrorlanib, jarimalar 3 taga yetsa, hisobingiz avtomatik bloklanadi. To'lovingizdan 3% komissiya ushlab qolinib, qolgan qismi hisobingizga qaytarildi.`;
        starMsg = `Siz rad etgan #${id} raqamli buyurtma ma'muriyat tomonidan ko'rib chiqildi va qaroringiz to'g'ri deb topildi. Mijozga tegishli chora (jarima) ko'rildi. Tizim qoidalariga rioya qilganingiz uchun tashakkur! Biz adolat tarafdorimiz.`;
      } else {
        clientMsg = `Shikoyatingiz ma'muriyat tomonidan ko'rib chiqildi va siz haqli deb topildingiz! #${id} raqamli buyurtmani ${order.star_name} nohaq rad etganligi tasdiqlandi. To'lovingiz hech qanday ushlanmalarsiz (100%) hisobingizga qaytarildi. Noqulaylik uchun uzr so'raymiz. ${order.star_name}ga nisbatan qat'iy chora ko'rildi.`;
        starMsg = `Sizning #${id} raqamli buyurtmani rad etish sababingiz ma'muriyat tomonidan o'rganildi va asossiz deb topildi. Sizga 1 ta jarima bali yozildi (${warnings}/3). 3 ta jarimadan so'ng profilingiz avtomatik bloklanadi. Iltimos, mijozlarga hurmat bilan munosabatda bo'ling.`;
      }
    } else {
      // Mijoz video yetkazilgandan keyin shikoyat qilgan holat
      if (guiltyParty === 'star') {
        clientMsg = `Shikoyatingiz ma'muriyat tomonidan ko'rib chiqildi va siz haqli deb topildingiz! #${id} raqamli buyurtma bo'yicha to'lovingiz hech qanday ushlanmalarsiz (100%) hisobingizga qaytarildi.`;
        starMsg = `#${id} raqamli buyurtma bo'yicha mijoz shikoyati ma'muriyat tomonidan ko'rib chiqildi va tasdiqlandi — video sifati/mosligi talabga javob bermadi deb topildi. To'lov mijozga qaytarildi.`;
      } else {
        clientMsg = `#${id} raqamli buyurtma bo'yicha shikoyatingiz ma'muriyat tomonidan ko'rib chiqildi. Video buyurtma shartlariga mos deb topildi, shuning uchun to'lov odatdagidek yulduzga o'tkazildi.`;
        starMsg = `#${id} raqamli buyurtma bo'yicha mijoz shikoyati ko'rib chiqildi va asossiz deb topildi. To'lov balansingizga qo'shildi.`;
      }
    }

    // 3. Bildirishnoma (Notification) jo'natish
    await pool.query("INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)", 
      [order.client_id, guiltyParty === 'client' ? "Buyurtma bekor qilindi" : "Siz haqli deb topildingiz", clientMsg]);
    
    await pool.query("INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)", 
      [order.star_id, guiltyParty === 'client' ? "Rad etish tasdiqlandi" : "Nohaq rad etish (Jarima)", starMsg]);

    // 4. CHATGA HAM MA'LUMOT YUBORISH (YANGI XATOLIKLARSIZ)
    const clientTicketQ = await pool.query("SELECT id FROM support_tickets WHERE user_id = $1 AND subject ILIKE $2 LIMIT 1", [order.client_id, `%#${id}%`]);
    let clientTicketId;
    if (clientTicketQ.rows.length > 0) {
        clientTicketId = clientTicketQ.rows[0].id;
        // Ariza holatini "Javob berildi" qilib o'zgartiramizki (Badge chiqishi uchun)
        await pool.query("UPDATE support_tickets SET status = 'answered', updated_at = NOW() WHERE id = $1", [clientTicketId]);
    } else {
        const newCT = await pool.query("INSERT INTO support_tickets (user_id, subject, status) VALUES ($1, $2, 'answered') RETURNING id", [order.client_id, `Nizo xulosasi: #${id}`]);
        clientTicketId = newCT.rows[0].id;
    }
    await pool.query("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)", [clientTicketId, req.user.id, clientMsg]);

    // Yulduz uchun: Yangi ma'lumot chati ochib yuboriladi
    const starTicketQ = await pool.query("INSERT INTO support_tickets (user_id, subject, status) VALUES ($1, $2, 'answered') RETURNING id", [order.star_id, `Nizo xulosasi: #${id}`]);
    const starTicketId = starTicketQ.rows[0].id;
    await pool.query("INSERT INTO ticket_messages (ticket_id, sender_id, message) VALUES ($1, $2, $3)", [starTicketId, req.user.id, starMsg]);

    // 5. Nizoni yopamiz va kim aybdor ekanligini saqlaymiz
    await pool.query("UPDATE orders SET is_resolved = true, guilty_party = $1 WHERE id = $2", [guiltyParty, id]);
    res.json({ success: true, warnings });
  } catch (err) {
    console.error("Nizoni hal qilishda xato:", err);
    res.status(500).json({ error: "Nizoni hal qilishda xatolik yuz berdi" });
  }
});

export default router;