import { Queue } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

// Redis'ga ulanish.
// TUZATILDI: TLS endi shartli — faqat REDIS_TLS=true bo'lganda yoqiladi.
// Avval TLS doim majburiy edi, bu esa oddiy mahalliy Redis (TLS'siz) bilan
// ishlashni butunlay imkonsiz qilib, video yetkazish so'rovlarini abadiy osilib qolishga olib kelardi.
const useTls = process.env.REDIS_TLS === 'true';

export const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
});

// Videolarni ishlash uchun maxsus navbat (Queue)
export const videoQueue = new Queue('video-processing', { 
  connection: redisConnection 
});

console.log('📦 BullMQ navbati (Queue) Redis orqali ishga tushdi.');