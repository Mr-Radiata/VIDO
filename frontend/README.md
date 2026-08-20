# VIDO — Frontend (React + Vite + Tailwind)

Bu papka faqat UI. To'liq ishlashi uchun `../backend` ishga tushirilgan bo'lishi kerak
(qarang: repo tuzilmasi uchun asosiy `README.md`).

## Ishga tushirish

```bash
cp .env.example .env    # VITE_API_URL backend manzilini ko'rsatishi kerak (default: http://localhost:4000)
npm install
npm run dev
```

`http://localhost:5173` ni oching.

## Loyiha tuzilishi

```
src/
  api.js        → backend bilan gaplashadigan fetch wrapper (auth, stars, orders, reviews)
  components/   → Navbar, VideoCard, QRGenerator, ReviewStars, OrderModal, RatingModal
  pages/        → Home, Browse, Profile, Auth, OrderCheckout, Dashboard, Verify
  layouts/      → ClientLayout (navbar+footer), StarLayout (sidebar bilan Star kabineti)
  context/      → AuthContext — JWT sessiyasini boshqaradi (localStorage + /api/auth/me)
  data/         → mockData.js — faqat statik ma'lumotnoma (kategoriyalar, tadbir turlari)
```

Barcha dinamik ma'lumotlar (yulduzlar, buyurtmalar, sharhlar) endi `src/api.js`
orqali haqiqiy backenddan olinadi — `data/mockData.js`da mock stars/orders qolmagan.

Dizayn: qorong'i fon (`#0F1014`/`#1A1C23`), oltin (`#FFD700`) + neon binafsha/moviy
aksentlar, Sora (sarlavha) + Inter (matn) — taqdimotdagi (V2.pptx) uslubga mos.

## Production build

```bash
npm run build
npm run preview
```
