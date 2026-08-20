# VIDO — To'liq ishlaydigan platforma (Frontend + Backend)

Cameo uslubidagi platforma: mashhurlar muxlislar uchun shaxsiylashtirilgan video
tabriklar yaratadi. Bu versiya **haqiqiy backend** bilan ishlaydi — ma'lumotlar
PostgreSQL'da saqlanadi, login haqiqiy, video yuklanganda ffmpeg orqali QR/watermark
haqiqatan qo'yiladi.

```
vido-fullstack/
  frontend/   → React + Vite + Tailwind (UI)
  backend/    → Express + PostgreSQL (API, auth, video processing)
```

## Tezkor ishga tushirish

**0) Talab qilinadigan xizmatlar** — PostgreSQL va **Redis** ikkalasi ham ishga tushirilgan bo'lishi kerak
(Redis — BullMQ navbat tizimi uchun majburiy; usiz video yetkazish so'rovlari abadiy osilib qoladi):
```bash
# Masalan Ubuntu/Debian'da:
sudo apt install postgresql redis-server
sudo service postgresql start
sudo service redis-server start
```

**1) Backend** (batafsil: `backend/README.md`)
```bash
cd backend
cp .env.example .env        # kerak bo'lsa DATABASE_URL/REDIS_URL'ni moslang
npm install
# DIQQAT: "npm run migrate" to'g'ridan-to'g'ri `psql`ni chaqiradi va .env faylini
# o'zi o'qimaydi — shuning uchun DATABASE_URL'ni avval shell'ga eksport qiling:
export DATABASE_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)
npm run migrate             # jadvallarni yaratadi
npm run seed                # 3 ta demo star qo'shadi (ixtiyoriy)
npm run dev                 # http://localhost:4000
```

**2) Frontend** (yangi terminalda)
```bash
cd frontend
cp .env.example .env        # VITE_API_URL backendga mos bo'lishi kerak
npm install
npm run dev                 # http://localhost:5173
```

Brauzerda `http://localhost:5173` oching. Demo star sifatida kirish:
`sevara@vido.uz` / `demo1234`, yoki o'zingiz "Klient" yoki "Star" sifatida
ro'yxatdan o'ting.

## Nima uchun bu safar haqiqiy ishlaydi

Oldingi (faqat frontend) versiyada login/buyurtma/video hammasi brauzer xotirasida
soxta edi. Bu versiyada:

| Funksiya | Holat |
|---|---|
| Ro'yxatdan o'tish / kirish | ✅ Haqiqiy — parol bcrypt bilan xeshlanadi, JWT beriladi |
| Sessiya | ✅ Sahifani yangilasangiz ham saqlanadi (JWT + `/api/auth/me`) |
| Buyurtmalar | ✅ PostgreSQL'da saqlanadi, serverni qayta ishga tushirsangiz ham yo'qolmaydi |
| Video yuklash | ✅ Haqiqiy fayl serverga yuklanadi |
| QR kod + watermark | ✅ **ffmpeg** orqali videoga haqiqatan "kuydiriladi" (mock emas) |
| Sharhlar / reyting | ✅ Bazada saqlanadi, profil sahifasida real vaqtda ko'rinadi |
| To'lov | ❌ Hali ham mock (haqiqiy pul o'tkazilmaydi) — Payme/Click/Stripe ulanishi kerak |

Men buni shaxsan end-to-end sinovdan o'tkazdim: ro'yxatdan o'tish → buyurtma →
star video yuklaydi (ffmpeg watermark) → klient videoni ko'radi va yuklab oladi →
QR skanerlash sahifasi ishlaydi → sharh qoldiriladi va profilda ko'rinadi →
**PostgreSQL serverini to'liq o'chirib-yoqib**, ma'lumotlar hali ham turganini tasdiqladim.

## Talablar

- Node.js 18+
- PostgreSQL 14+
- **Redis** (BullMQ video navbati uchun majburiy — mahalliyda `REDIS_TLS=false`, bulutli xizmatda `REDIS_TLS=true`)
- ffmpeg (video watermark uchun)

## Domen

Production domeni: **getvido.uz**. `backend/.env`da `APP_PUBLIC_URL=https://getvido.uz` va
`CLIENT_ORIGIN=https://getvido.uz` ko'rsating — bular QR kod manzili va CORS ruxsati uchun ishlatiladi.
