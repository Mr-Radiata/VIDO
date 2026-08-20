import { Worker } from 'bullmq';
import path from 'path';
import fs from 'fs/promises';

// SUN'IY BROWSER VA RASM CHIZUVCHI
import { JSDOM } from 'jsdom';
import canvasPkg from 'canvas';

const dom = new JSDOM('');
global.window = dom.window;
global.document = dom.window.document;
global.self = dom.window;
global.window.fetch = fetch;
global.Image = canvasPkg.Image; 

import { pool } from './db.js';
import { redisConnection } from './queue.js';
import { watermarkVideo } from './videoProcessor.js';
import { dirs } from './upload.js';
import { io } from './index.js';

console.log('👷 BullMQ Worker (Ishchi) ishga tushdi va vazifalarni kutmoqda...');

const worker = new Worker('video-processing', async (job) => {
  
  const { default: QRCode } = await import('qr-code-styling-node');

  const { orderId, inputPath, photoPath, qrValue } = job.data;
  
  const outputFilename = `${orderId}-watermarked.mp4`;
  const outputPath = path.join(dirs.processed, outputFilename).replace(/\\/g, '/');
  
  const qrPath = path.join(dirs.photo, `qr-${orderId}.png`).replace(/\\/g, '/'); 
  const logoPath = path.resolve('assets/logo.png');

  console.log(`[Worker] Buyurtma #${orderId} - Videoni qayta ishlash boshlandi...`);

  try {
    const qrCode = new QRCode({
      width: 400,
      height: 400,
      data: qrValue,
      image: logoPath, // Dumaloq va shaffof (transparent) PNG logo qo'ying
      dotsOptions: {
        type: "dots",
        // Katakchalar VIDO ranglarida jilolanadi (Tilla va Zangori gradient)
        gradient: {
          type: "linear",
          colorStops: [
            { offset: 0, color: "#06b6d4" }, // Zangori (Cyan)
            { offset: 1, color: "#facc15" }  // Tilla (Gold)
          ]
        }
      },
      cornersSquareOptions: {
        type: "extra-rounded",
        color: "#1a1a24" // Burchak ramkalariga to'q rang
      },
      cornersDotOptions: {
        type: "dot",
        color: "#facc15" // Burchak nuqtalariga tilla rang
      },
      backgroundOptions: { 
        color: "rgba(255, 255, 255, 0.95)" // Orqa fon deyarli to'liq oq (tiniq)
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 6,               // Logo atrofida biroz havo qoldiramiz
        imageSize: 0.45,         // LOGONI KATTALASHTIRISH (QR kodning 45% qismini egallaydi)
        hideBackgroundDots: true // Logotip orqasidagi nuqtalarni yashirish (toza turishi uchun)
      }
    });

    // MANA SHU YER O'ZGARDI 👇 (Blob -> Buffer aylantirish)
    const blobData = await qrCode.getRawData("png");
    const arrayBuffer = await blobData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(qrPath, buffer);

    // Qolgan joylar o'zgarishsiz
    await watermarkVideo({ inputPath, outputPath, photoPath, qrPath });

    const videoUrl = `/uploads/processed/${outputFilename}`;
    const { rows } = await pool.query(
      `UPDATE orders SET status = 'delivered', video_url = $1, qr_value = $2, delivered_at = now() WHERE id = $3 RETURNING *`,
      [videoUrl, qrValue, orderId]
    );
    
    const updatedOrder = rows[0];

    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(qrPath).catch(() => {});

    console.log(`[Worker] Buyurtma #${orderId} - Video muvaffaqiyatli tayyor bo'ldi!`);

    if (updatedOrder) {
      io.to(updatedOrder.client_id.toString()).emit('order_delivered', { orderId: updatedOrder.id });
      io.to(updatedOrder.star_id.toString()).emit('order_delivered', { orderId: updatedOrder.id });
    }

    return outputFilename;
  } catch (err) {
     await fs.unlink(inputPath).catch(() => {});
     await fs.unlink(qrPath).catch(() => {});

     // TUZATILDI: avval bu yerda faqat throw qilinardi, buyurtma "processing"
     // holatida ABADIY qotib qolardi (original video ham allaqachon o'chirilgan bo'lardi,
     // qayta urinish imkonsiz edi). Endi buyurtma 'pending'ga qaytariladi, shunda
     // star uni qayta ko'radi va videoni qayta yuklay oladi.
     try {
       const { rows } = await pool.query(
         `UPDATE orders SET status = 'pending' WHERE id = $1 AND status = 'processing' RETURNING star_id, client_id`,
         [orderId]
       );
       const order = rows[0];
       if (order) {
         await pool.query(
           `INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)`,
           [
             order.star_id,
             'Video qayta ishlashda xatolik',
             `Buyurtma #${orderId} uchun yuklagan videongizni qayta ishlashda xatolik yuz berdi. Iltimos, videoni qayta yuklab ko'ring.`,
           ]
         );
         io.to(order.star_id.toString()).emit('order_processing_failed', { orderId });
       }
     } catch (recoveryErr) {
       console.error(`[Worker] Buyurtma #${orderId} holatini tiklashda qo'shimcha xatolik:`, recoveryErr);
     }

     throw err; 
  }
}, { connection: redisConnection });

worker.on('failed', (job, err) => {
  console.error(`[Worker] Buyurtma #${job?.data?.orderId} da xatolik yuz berdi:`, err.message);
});