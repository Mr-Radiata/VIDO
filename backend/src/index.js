import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';

// YENGI KUTUBXONALAR (Socket.io uchun)
import { createServer } from 'http';
import { Server } from 'socket.io';

// XAVFSIZLIK UCHUN QO'SHILDI
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

import authRoutes from './routes/auth.js';
import starsRoutes from './routes/stars.js';
import ordersRoutes from './routes/orders.js';
import reviewsRoutes from './routes/reviews.js';
import adminRoutes from './routes/admin.js';
import supportRoutes from './routes/support.js';
import verifyRoutes from './routes/verify.js';
import paymentsRoutes from './routes/payments.js';
import { initCronJobs } from './cron.js';
import { requireAuth, requireRole } from './middleware/auth.js';

// BullMQ navbati va ishchisi (Worker)
import './queue.js';
import './worker.js';

dotenv.config();


const app = express();

// SOCKET.IO UCHUN SERVERNI MOSLASHTIRISH
const httpServer = createServer(app);

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// JONLI ALOQA (WebSocket) SOZLAMALARI
export const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// XATO #2 TUZATILDI: Socket.io ulanishda JWT autentifikatsiya
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Avtorizatsiyadan o\'tilmagan'));
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    socket.userRole = payload.role;
    next();
  } catch (err) {
    return next(new Error('Yaroqsiz token'));
  }
});

io.on('connection', (socket) => {
  console.log('⚡ Yangi foydalanuvchi onlayn bo\'ldi:', socket.id, '| User:', socket.userId);
  
  // Foydalanuvchi faqat O'Z xonasiga qo'shiladi (boshqaning xonasiga kira olmaydi)
  socket.join(socket.userId.toString());
  console.log(`Foydalanuvchi ${socket.userId} o'z xonasiga qo'shildi.`);
  
  socket.on('disconnect', () => {
    console.log('🔴 Foydalanuvchi oflayn bo\'ldi:', socket.id);
  });
});

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('CORS: ruxsat etilmagan manba'));
  },
}));

app.use(morgan('dev'));
app.use(express.json());

// ==========================================
// FAYLLARNI UZATISH VA XAVFSIZLIK (YANGILANGAN)
// ==========================================
// Rasmlar va vaqtinchalik fayllar ochiq qoladi
app.use('/uploads/photos', express.static(path.resolve('uploads/photos')));
app.use('/uploads/temp', express.static(path.resolve('uploads/temp')));

// MANA QAT'IY HIMOYA QILINGAN PAPKA: Faqat tizimga kirgan va roli 'admin' bo'lganlargagina videoni beradi!
app.use('/uploads/videos', requireAuth, requireRole('admin'), express.static(path.resolve('uploads/videos')));
// TAYYOR VIDEOLAR UCHUN QAT'IY HIMOYA
// TAYYOR VIDEOLAR UCHUN ANTI-HOTLINK HIMOYA
app.use('/uploads/processed', (req, res, next) => {
  // So'rov qayerdan kelayotganini tekshiramiz
  const referer = req.get('Referer');
  const allowedHost = process.env.CLIENT_ORIGIN || 'localhost:5173';

  // Agar so'rov to'g'ridan-to'g'ri brauzer qidiruviga yozilgan bo'lsa yoki boshqa saytdan kelsa - BLOKLAYMIZ
  if (!referer || !referer.includes(allowedHost.replace(/https?:\/\//, ''))) {
    return res.status(403).send("Xavfsizlik tizimi: Videoni faqat VIDO platformasi ichida ko'rish mumkin.");
  }
  
  // Agar o'zimizning saytdan kelgan bo'lsa, videoni ko'rsatamiz
  next();
}, express.static(path.resolve('uploads/processed')));
// ==========================================

// API HIMOYA QALQONI (RATE LIMITING)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 150, 
  message: { error: "Juda ko'p so'rov yuborildi. Iltimos, bir daqiqadan so'ng qayta urinib ko'ring." },
  standardHeaders: true, 
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'vido-backend' }));

// BARCHA YO'LAKLAR (API ROUTES)
app.use('/api/auth', authRoutes);
app.use('/api/stars', starsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes); 
// TUZATILDI: bu qator avval yo'q edi — shu sabab QR kod orqali /verify/:orderId
// sahifasiga o'tishga urinilganda doim 404 xatosi chiqardi.
app.use('/api/verify', verifyRoutes);
app.use('/api/payments', paymentsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server xatoligi', detail: err.message });
});

initCronJobs();

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 VIDO backend va Socket.io http://localhost:${PORT} da ishga tushdi`);
});