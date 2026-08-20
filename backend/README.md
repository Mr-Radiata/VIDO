# VIDO Backend — REST API (Express + PostgreSQL)

Haqiqiy ma'lumotlar bazasi, JWT autentifikatsiya va ffmpeg orqali video watermark/QR
qo'shish ishlaydigan backend. Frontend (`../frontend`) shu API bilan ishlaydi.

## 1. PostgreSQL o'rnatish va sozlash

```bash
# Ubuntu/Debian
sudo apt install postgresql

sudo -u postgres psql -c "CREATE USER vido WITH PASSWORD 'vido_dev_pw';"
sudo -u postgres psql -c "CREATE DATABASE vido_db OWNER vido;"
```

(Docker bilan ham bo'ladi: `docker run -d -e POSTGRES_USER=vido -e POSTGRES_PASSWORD=vido_dev_pw -e POSTGRES_DB=vido_db -p 5432:5432 postgres:16`)

## 2. Muhit o'zgaruvchilari

```bash
cp .env.example .env
```

`.env` faylini oching va kerak bo'lsa `DATABASE_URL`, `JWT_SECRET`ni moslang.

## 3. O'rnatish, migratsiya, seed

```bash
npm install

# Jadvallarni yaratish
npm run migrate
# yoki to'g'ridan-to'g'ri: psql "$DATABASE_URL" -f migrations/001_init.sql

# (Ixtiyoriy) 3 ta namunaviy "star" hisobini qo'shadi
npm run seed
```

Seed ishga tushgach quyidagi demo star hisoblari bilan kirish mumkin bo'ladi:
`sevara@vido.uz`, `alisher@vido.uz`, `jahongir@vido.uz` — parol: `demo1234`

## 4. Ishga tushirish

```bash
npm run dev      # nodemon bilan (development)
# yoki
npm start        # oddiy node
```

Server: `http://localhost:4000` — health check: `GET /api/health`

## Talab qilinadigan tizim vositasi

Video watermarking uchun **ffmpeg** kompyuteringizda o'rnatilgan bo'lishi kerak:
```bash
sudo apt install ffmpeg   # yoki brew install ffmpeg (macOS)
```

## API xaritasi

| Method | Endpoint | Tavsif | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Ro'yxatdan o'tish (`role: client\|star`) | – |
| POST | `/api/auth/login` | Kirish | – |
| GET | `/api/auth/me` | Joriy foydalanuvchi | ✓ |
| GET | `/api/stars?category=` | Yulduzlar ro'yxati | – |
| GET | `/api/stars/:id` | Profil + portfolio + sharhlar | – |
| POST | `/api/orders` | Buyurtma yaratish (multipart: `recipientPhoto`) | ✓ client |
| GET | `/api/orders/mine` | Mening buyurtmalarim (rolga qarab) | ✓ |
| POST | `/api/orders/:id/deliver` | Video yuklash → **haqiqiy ffmpeg watermark** (multipart: `video`) | ✓ star |
| POST | `/api/reviews` | Sharh qoldirish (`orderId, rating, text`) | ✓ client |
| GET | `/api/verify/:orderId` | QR skanerlanganda ochiladigan ommaviy sahifa ma'lumoti | – |

Barcha himoyalangan endpointlar `Authorization: Bearer <token>` headerini talab qiladi.

## Qanday ishlaydi (soxta emas)

- Parollar **bcrypt** bilan xeshlanadi, hech qachon ochiq saqlanmaydi
- Sessiya **JWT** orqali (7 kun amal qiladi), frontendda `localStorage`da saqlanadi
- Video yuklanganda **ffmpeg** haqiqatan videoning pastki burchagiga QR kod (`qrcode` kutubxonasi bilan generatsiya qilingan) va "VIDO" suv belgisini "kuydiradi" — natija `uploads/processed/`ga saqlanadi
- Barcha ma'lumotlar PostgreSQL'da — serverni qayta ishga tushirsangiz ham yo'qolmaydi

## Hali qo'shilmagan narsalar

- To'lov — haqiqiy provayder (Payme/Click/Stripe) ulanmagan
- Email tasdiqlash, parolni tiklash
- Fayllar hozir local diskda (`uploads/`); production uchun S3/Cloud Storage tavsiya etiladi
- Rate limiting, va boshqa production-darajadagi xavfsizlik choralari (helmet, CSRF va h.k.)
