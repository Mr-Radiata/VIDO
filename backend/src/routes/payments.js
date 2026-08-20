import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Standart platform komissiyasi (buyurtma muvaffaqiyatli yakunlanganda)
const STANDARD_COMMISSION_RATE = 20.00; // %

/**
 * ==========================================================================
 * DEMO REJIM haqida MUHIM ESLATMA
 * ==========================================================================
 * Hozircha MCHJ/YTT ro'chsatnomasi yo'qligi sababli Payme/Click bilan haqiqiy
 * hamkorlik shartnomasi (va ularning merchant ID/kalitlari) mavjud emas.
 * Shuning uchun quyidagi `checkout` marshruti to'lovni HAQIQIY pul harakati
 * SIFATIDA emas, balki ICHKI (internal) eskrov yozuvi sifatida darhol
 * "muvaffaqiyatli" deb belgilaydi — bu butun tizimning (eskrov, komissiya,
 * qaytarish, balans) mantig'ini haqiqiy pul provayderisiz sinash imkonini beradi.
 *
 * Kelajakda haqiqiy Payme/Click ulanganda faqat shu ikki narsa o'zgaradi:
 *   1) `checkout`da darhol "success" qilish o'rniga, `transactions` yozuvi
 *      status='pending' bilan yaratiladi va provayderning to'lov sahifasiga
 *      (checkoutUrl) yo'naltiriladi.
 *   2) `webhook` marshruti (pastda, allaqachon tayyor turibdi) provayderdan
 *      kelgan haqiqiy tasdiqni qabul qilib, o'sha "pending" yozuvni "success"ga
 *      o'tkazadi — undan keyingi mantiq (eskrovga qo'yish) bir xil qoladi.
 * ==========================================================================
 */

// 1. TO'LOVNI BOSHLASH — mijoz "To'lash" tugmasini bosganda chaqiriladi.
//    Muvaffaqiyatli bo'lsa, pul mijozdan "eskrovga" o'tadi (order.payment_status='held').
router.post('/checkout', requireAuth, requireRole('client'), async (req, res) => {
  const { orderId, provider } = req.body; // provider: 'payme' | 'click' | 'internal' (demo)
  const chosenProvider = ['payme', 'click'].includes(provider) ? provider : 'internal';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const orderQ = await client.query(
      `SELECT * FROM orders WHERE id = $1 AND client_id = $2 FOR UPDATE`,
      [orderId, req.user.id]
    );
    const order = orderQ.rows[0];
    if (!order) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Buyurtma topilmadi yoki sizga tegishli emas' });
    }
    if (order.payment_status !== 'unpaid') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Bu buyurtma uchun to'lov allaqachon amalga oshirilgan" });
    }

    // ---- HAQIQIY PAYME/CLICK ULANGANDA SHU YERGA: ----
    // provayderning "invoice yaratish" API'siga so'rov yuborilib, natijada
    // olingan checkoutUrl foydalanuvchiga qaytariladi, va status='pending'
    // bilan tranzaksiya yaratiladi (hali "success" DEMAS). Hozircha demo
    // rejimda darhol muvaffaqiyatli deb hisoblaymiz:
    const txQ = await client.query(
      `INSERT INTO transactions (user_id, order_id, amount, type, status, provider, provider_transaction_id)
       VALUES ($1, $2, $3, 'escrow_hold', 'success', $4, $5) RETURNING *`,
      [req.user.id, order.id, order.price, chosenProvider, `demo_${Date.now()}`]
    );

    const updatedOrderQ = await client.query(
      `UPDATE orders SET payment_status = 'held', commission_rate = $2 WHERE id = $1 RETURNING *`,
      [order.id, STANDARD_COMMISSION_RATE]
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      demoMode: chosenProvider === 'internal',
      transaction: txQ.rows[0],
      order: updatedOrderQ.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("To'lovni amalga oshirishda xatolik:", err);
    res.status(500).json({ error: "To'lovni amalga oshirishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

// 2. WEBHOOK — haqiqiy Payme/Click ulanganda ular shu manzilga callback yuboradi.
//    Hozircha demo rejimda ishlatilmaydi (checkout darhol yakunlanadi), lekin
//    marshrut tayyor turadi, shuning uchun kelajakda faqat provayder tomonini
//    ulash kifoya qiladi.
router.post('/webhook', async (req, res) => {
  // MUHIM: haqiqiy integratsiyada BU YERDA albatta provayderning imzosini
  // (Payme uchun Basic Auth / Click uchun sign_string md5) tekshirish SHART —
  // aks holda istalgan kishi soxta "to'lov muvaffaqiyatli" xabarini yuborib,
  // pulsiz video buyurtma qilishi mumkin bo'lib qoladi.
  const { providerTransactionId, status } = req.body;

  try {
    const txQ = await pool.query(
      `SELECT * FROM transactions WHERE provider_transaction_id = $1`,
      [providerTransactionId]
    );
    const tx = txQ.rows[0];
    if (!tx) return res.status(404).json({ error: 'Tranzaksiya topilmadi' });

    if (status === 'success' && tx.status === 'pending') {
      await pool.query(`UPDATE transactions SET status = 'success' WHERE id = $1`, [tx.id]);
      if (tx.type === 'escrow_hold' && tx.order_id) {
        await pool.query(
          `UPDATE orders SET payment_status = 'held', commission_rate = $2 WHERE id = $1`,
          [tx.order_id, STANDARD_COMMISSION_RATE]
        );
      }
    } else if (status === 'failed') {
      await pool.query(`UPDATE transactions SET status = 'failed' WHERE id = $1`, [tx.id]);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook xatoligi:', err);
    res.status(500).json({ error: 'Webhookni qayta ishlashda xatolik' });
  }
});

// 3. Joriy foydalanuvchining balansi (asosan Yulduzlar uchun kerak)
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT balance, frozen_balance FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json(rows[0] || { balance: 0, frozen_balance: 0 });
  } catch (err) {
    res.status(500).json({ error: 'Balansni yuklashda xatolik' });
  }
});

// 4. Foydalanuvchining tranzaksiyalar tarixi
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [req.user.id]
    );
    res.json({ transactions: rows });
  } catch (err) {
    res.status(500).json({ error: 'Tranzaksiyalarni yuklashda xatolik' });
  }
});

// 5. Yulduz balansidan pul yechib olishni so'raydi.
//    HAQIQIY to'lov provayderi yo'qligi sababli bu avtomatik amalga oshmaydi —
//    so'rov "pending" holatida yaratiladi va admin uni qo'lda ko'rib chiqib,
//    tashqarida (bank/karta orqali) o'tkazib, keyin tasdiqlaydi.
router.post('/withdraw', requireAuth, requireRole('star'), async (req, res) => {
  const { amount } = req.body;
  const amountNum = parseInt(amount, 10);

  if (!Number.isInteger(amountNum) || amountNum <= 0) {
    return res.status(400).json({ error: "Noto'g'ri summa" });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userQ = await client.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [req.user.id]);
    const balance = userQ.rows[0]?.balance || 0;

    if (amountNum > balance) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: "Balansingizda yetarli mablag' yo'q" });
    }

    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amountNum, req.user.id]);
    const txQ = await client.query(
      `INSERT INTO transactions (user_id, amount, type, status, provider)
       VALUES ($1, $2, 'withdrawal', 'pending', 'internal') RETURNING *`,
      [req.user.id, amountNum]
    );

    await client.query('COMMIT');
    res.json({ success: true, transaction: txQ.rows[0], message: "So'rovingiz qabul qilindi, ma'muriyat tez orada ko'rib chiqadi." });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Pul yechib olishda xatolik:', err);
    res.status(500).json({ error: 'Pul yechib olish so\'rovida xatolik yuz berdi' });
  } finally {
    client.release();
  }
});

export default router;
