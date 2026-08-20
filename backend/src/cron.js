import cron from 'node-cron';
import { pool } from './db.js';
import { releaseToStar } from './services/escrow.js';

export function initCronJobs() {
  // ==========================================================
  // ESKROV AVTOMATIK CHIQARISH — har soatda ishlaydi.
  // Video yetkazilgandan (delivered_at) 24 soat o'tgan, hech qanday
  // shikoyat (client_disputed) qilinmagan buyurtmalar uchun pulni
  // yulduz balansiga o'tkazadi (Ommaviy Oferta 4.2-band).
  // ==========================================================
  cron.schedule('0 * * * *', async () => {
    console.log('💸 Eskrov avtomatik chiqarish tekshiruvi ishga tushdi...');
    try {
      const dueQ = await pool.query(`
        SELECT id FROM orders
        WHERE status = 'delivered'
          AND payment_status = 'held'
          AND client_disputed = false
          AND delivered_at <= NOW() - INTERVAL '24 hours'
      `);

      for (const row of dueQ.rows) {
        try {
          await releaseToStar(row.id);
          console.log(`[Eskrov] #${row.id} buyurtma puli yulduzga o'tkazildi.`);
        } catch (err) {
          console.error(`[Eskrov] #${row.id} buyurtma uchun xatolik:`, err.message);
        }
      }
    } catch (err) {
      console.error('Eskrov cron xatoligi:', err);
    }
  });

  // Bu vazifa har kuni soat 00:00 da (Yarim tunda) avtomatik ishga tushadi
  cron.schedule('0 0 * * *', async () => {
    console.log('🤖 Avtomatik nazorat tizimi (Cron) ishga tushdi...');
    
    try {
      // ==========================================
      // 1-QADAM: 7 KUN O'TGANLARGA OGOHLANTIRISH
      // ==========================================
      const warnings = await pool.query(`
        SELECT user_id FROM star_profiles
        WHERE is_active = false 
          AND inactive_since <= NOW() - INTERVAL '7 days'
          AND inactive_since > NOW() - INTERVAL '14 days'
      `);

      for (let row of warnings.rows) {
        // Yulduzga xabar jo'natamiz
        await pool.query(`
          INSERT INTO notifications (user_id, title, message) 
          VALUES ($1, $2, $3)`, 
          [row.user_id, "Tanaffus vaqti tugadi!", "Sizning profilingiz 7 kundan beri nofaol holatda. Iltimos, profilingizni faollashtiring. Agar yana 7 kun davomida hisobingizni ochmasangiz, avtomatik ravishda bloklanasiz."]
        );
        console.log(`[Ogohlantirish] ${row.user_id}-ID dagi yulduz 7 kundan beri tanaffusda.`);
      }

      // ==========================================
      // 2-QADAM: 14 KUN O'TGANLARNI BLOKLASH (7+7)
      // ==========================================
      const bans = await pool.query(`
        SELECT s.user_id 
        FROM star_profiles s
        JOIN users u ON s.user_id = u.id
        WHERE s.is_active = false 
          AND s.inactive_since <= NOW() - INTERVAL '14 days'
          AND u.is_banned = false
      `);

      for (let row of bans.rows) {
        // Yulduzni bloklaymiz
        await pool.query(`UPDATE users SET is_banned = true WHERE id = $1`, [row.user_id]);
        
        // Tizim orqali bildirishnoma jo'natamiz
        await pool.query(`
          INSERT INTO notifications (user_id, title, message) 
          VALUES ($1, $2, $3)`, 
          [row.user_id, "Hisob bloklandi", "Profilingiz 14 kun (2 hafta) davomida nofaol bo'lganligi sababli tizim tomonidan avtomatik bloklandi. Blokdan chiqarish uchun ma'muriyatga murojaat qiling."]
        );
        console.log(`[Bloklandi] ${row.user_id}-ID dagi yulduz uzoq nofaollik uchun bloklandi.`);
      }

    } catch (err) {
      console.error("Cron Job xatoligi:", err);
    }
  });
  
  console.log('✅ Cron (Avtomatik Nazorat) muvaffaqiyatli ishga tushdi.');
}