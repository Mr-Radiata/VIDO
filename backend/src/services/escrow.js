import { pool } from '../db.js';

// Ommaviy Oferta 5.1-band: mijozning matni qoidabuzarlik deb topilib buyurtma
// rad etilganda, qaytarishdan ushlab qolinadigan jarima komissiyasi.
export const CLIENT_FAULT_PENALTY_RATE = 3.00; // %

/**
 * Buyurtma puli yulduzga o'tkaziladi (24 soat tugagach, nizo bo'lmasa —
 * cron orqali, YOKI admin nizoni mijoz noto'g'ri deb topsa).
 * Platforma komissiyasini (order.commission_rate) ushlab qoladi, qolganini
 * yulduzning asosiy balansiga qo'shadi.
 */
export async function releaseToStar(orderId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderQ = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    const order = orderQ.rows[0];
    if (!order) throw new Error('Buyurtma topilmadi');
    if (order.payment_status !== 'held') throw new Error("Bu buyurtma uchun pul eskrovda emas");

    const commissionAmount = Math.round(order.price * order.commission_rate / 100);
    const starAmount = order.price - commissionAmount;

    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [starAmount, order.star_id]);
    await client.query(
      `INSERT INTO transactions (user_id, order_id, amount, type, status, provider) VALUES ($1, $2, $3, 'escrow_release', 'success', 'internal')`,
      [order.star_id, order.id, starAmount]
    );
    await client.query(
      `INSERT INTO transactions (user_id, order_id, amount, type, status, provider) VALUES (NULL, $1, $2, 'commission', 'success', 'internal')`,
      [order.id, commissionAmount]
    );
    const updatedQ = await client.query(
      `UPDATE orders SET payment_status = 'released', status = 'completed' WHERE id = $1 RETURNING *`,
      [order.id]
    );

    await client.query(
      `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
      [order.star_id, "To'lov hisobingizga tushdi", `#${order.id} raqamli buyurtma bo'yicha ${starAmount.toLocaleString('uz-UZ')} so'm balansingizga qo'shildi (platforma komissiyasi: ${commissionAmount.toLocaleString('uz-UZ')} so'm).`]
    );

    await client.query('COMMIT');
    return updatedQ.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Buyurtma puli mijozga qaytariladi.
 * penaltyRate=0    -> 100% qaytarish (yulduz aybi bilan, 5.2-band)
 * penaltyRate=3.00 -> 3% jarima ushlab qolinadi (mijoz aybi bilan, 5.1-band)
 */
export async function refundToClient(orderId, penaltyRate = 0) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const orderQ = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [orderId]);
    const order = orderQ.rows[0];
    if (!order) throw new Error('Buyurtma topilmadi');
    if (order.payment_status !== 'held') throw new Error("Bu buyurtma uchun pul eskrovda emas");

    const commissionAmount = Math.round(order.price * penaltyRate / 100);
    const refundAmount = order.price - commissionAmount;

    await client.query(
      `INSERT INTO transactions (user_id, order_id, amount, type, status, provider) VALUES ($1, $2, $3, 'refund', 'success', 'internal')`,
      [order.client_id, order.id, refundAmount]
    );
    if (commissionAmount > 0) {
      await client.query(
        `INSERT INTO transactions (user_id, order_id, amount, type, status, provider) VALUES (NULL, $1, $2, 'commission', 'success', 'internal')`,
        [order.id, commissionAmount]
      );
    }
    const updatedQ = await client.query(
      `UPDATE orders SET payment_status = 'refunded' WHERE id = $1 RETURNING *`,
      [order.id]
    );

    await client.query('COMMIT');
    return updatedQ.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
