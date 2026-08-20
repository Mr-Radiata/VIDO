import { ScrollText } from 'lucide-react'

/**
 * Ommaviy Oferta (Foydalanish Shartlari) sahifasi.
 * Ro'yxatdan o'tish formasidagi checkbox shu sahifaga havola beradi.
 */
export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <div className="flex items-center gap-3 mb-6">
        <ScrollText className="text-gold-400" size={28} />
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Foydalanish shartlari (Ommaviy Oferta)
        </h1>
      </div>

      <div className="card-surface rounded-2xl p-6 sm:p-8 space-y-6 text-sm sm:text-[15px] leading-relaxed text-white/70">
        <p>
          Ushbu Ommaviy Oferta (keyingi o'rinlarda "Shartnoma") VIDO platformasi (keyingi o'rinlarda "Platforma" yoki
          "Ma'muriyat") va undan foydalanuvchi jismoniy yoki yuridik shaxslar (keyingi o'rinlarda "Mijoz" va "Yulduz")
          o'rtasidagi rasmiy kelishuv hisoblanadi. Tizimdan ro'yxatdan o'tish va undan foydalanish ushbu shartlarga
          to'liq va so'zsiz rozi bo'lishni anglatadi.
        </p>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-2">1. Umumiy qoidalar</h2>
          <p><strong className="text-white/90">1.1.</strong> Tizimning vazifasi: VIDO — bu Mijozlarga o'z sevimli san'atkorlari, blogerlari va taniqli shaxslaridan (Yulduzlardan) shaxsiy video-tabriklar yoki maxsus video-xabarlarga buyurtma berish imkonini yaratuvchi vositachi onlayn platformadir.</p>
          <p className="mt-2"><strong className="text-white/90">1.2.</strong> Yosh chegarasi: Platformada mustaqil ravishda buyurtma berish va to'lovlarni amalga oshirish uchun foydalanuvchi 18 yoshga to'lgan bo'lishi shart. Voyaga yetmagan shaxslar xizmatdan faqat ota-onalari yoki qonuniy vakillarining ruxsati va ularning bank kartalari orqali foydalanishlari mumkin.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-2">2. Mijozlar uchun shartlar</h2>
          <p><strong className="text-white/90">2.1.</strong> Buyurtma berish: Mijoz buyurtma formasi orqali o'z matni, bayram turi va qabul qiluvchi haqidagi ma'lumotlarni taqdim etadi.</p>
          <p className="mt-2"><strong className="text-white/90">2.2.</strong> Tijorat maqsadida foydalanish taqiqlanadi: Mijoz tayyor videodan faqat shaxsiy maqsadlarda (masalan, do'stiga sovg'a qilish, oilaviy arxivda saqlash, ijtimoiy tarmoqlardagi shaxsiy sahifasida bo'lishish) foydalanish huquqiga ega. Videodan ruxsatsiz tijorat reklamasi, mahsulot yoki biznesni targ'ib qilish maqsadida foydalanish qat'iyan man etiladi.</p>
          <p className="mt-2"><strong className="text-white/90">2.3.</strong> Taqiqlangan kontent: Mijozning buyurtma matni tarkibida haqoratli, kamsituvchi, qonunga zid, uchinchi shaxslar obro'siga putur yetkazuvchi, siyosiy yoki nojo'ya mazmundagi so'zlar bo'lishi qat'iyan taqiqlanadi.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-2">3. Yulduzlar uchun shartlar va majburiyatlar</h2>
          <p><strong className="text-white/90">3.1.</strong> Mustaqil ijrochi maqomi: Yulduzlar VIDO platformasining xodimlari hisoblanmaydi. Ular platformadan o'z xizmatlarini taqdim etish vositasi sifatida mustaqil ijrochi (hamkor) sifatida foydalanadilar.</p>
          <p className="mt-2"><strong className="text-white/90">3.2.</strong> Bajarish muddati va sifati: Yulduz qabul qilingan buyurtmani o'z vaqtida, yorug' joyda, sifatli ovoz va aniq yuz ko'rinishi bilan yozib berishi shart.</p>
          <p className="mt-2"><strong className="text-white/90">3.3.</strong> Soliq javobgarligi: VIDO platformasi Yulduzlar uchun soliq agenti hisoblanmaydi. Yulduzlar platforma orqali topgan daromadlari bo'yicha O'zbekiston Respublikasi qonunchiligiga muvofiq mustaqil ravishda soliq to'lashlari va javobgarlikni o'z zimmalariga olishlari shart.</p>
          <p className="mt-2"><strong className="text-white/90">3.4.</strong> Kontent uchun javobgarlik: Yulduzlar tomonidan videoda aytilgan gaplar, shaxsiy fikrlar va harakatlar uchun to'liq yuridik javobgarlik bevosita videoni yaratgan Yulduz zimmasida bo'ladi.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-2">4. To'lov, "Escrow" (Kafil) tizimi va komissiyalar</h2>
          <p><strong className="text-white/90">4.1.</strong> To'lovni xavfsiz ushlab turish: Mijoz buyurtma berganda mablag' uning hisobidan yechiladi va VIDO platformasining tranzit hisobida xavfsiz saqlanadi (muzlatiladi).</p>
          <p className="mt-2"><strong className="text-white/90">4.2.</strong> Mablag'ni o'tkazish (24 soat qoidasi): Video tayyor bo'lib Mijozga yuborilgandan so'ng, mablag' 24 soat davomida muzlatilgan holatda qoladi. Agar ushbu vaqt ichida Mijozdan asosli e'tiroz (shikoyat) tushmasa, tizim o'z vositachilik komissiyasini chegirib qolib, qolgan mablag'ni Yulduzning asosiy balansiga avtomatik o'tkazadi.</p>
          <p className="mt-2"><strong className="text-white/90">4.3.</strong> Platforma komissiyasi: VIDO har bir muvaffaqiyatli yakunlangan buyurtmadan o'zining belgilangan foizdagi (20%) komissiya haqini ushlab qoladi.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-2">5. Jarimalar va nizolarni hal qilish (pul qaytarish)</h2>
          <p><strong className="text-white/90">5.1.</strong> Qoidabuzarlik uchun jarima (Mijoz aybi bilan): Agar mijozning buyurtma matni ushbu Shartnomaning 2.3-bandiga zid deb topilsa, Yulduz yoki Ma'muriyat buyurtmani bir tomonlama rad etishga haqli. Bunday holatda mijozga to'lov qaytariladi, biroq qoidalarni buzgani hamda tranzaksiya xarajatlari uchun platformaning xizmat ko'rsatish komissiyasi (3%) jarima sifatida ushlab qolinadi.</p>
          <p className="mt-2"><strong className="text-white/90">5.2.</strong> Fors-major va kechikishlar (Yulduz aybi bilan): Agar Yulduz kutilmagan sabablarga ko'ra videoni belgilangan vaqt ichida yozib bera olmasa yoki buyurtmani o'z xohishiga ko'ra rad etsa, buyurtma bekor qilinadi va Mijozning puli 100% (hech qanday komissiyasiz) qaytarib beriladi.</p>
          <p className="mt-2"><strong className="text-white/90">5.3.</strong> Shikoyat arizasi (Dispute): Agar tayyorlangan video Mijozning dastlabki ko'rsatmalariga mutlaqo mos kelmasa yoki texnik yaroqsiz bo'lsa, Mijoz video yetkazilgan vaqtdan boshlab 24 soat ichida ariza qoldirish huquqiga ega. Nizo Ma'muriyat tomonidan ko'rib chiqiladi va adolatli qaror qabul qilinadi.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-white text-lg mb-2">6. Intellektual mulk va qat'iy taqiqlar</h2>
          <p><strong className="text-white/90">6.1.</strong> VIDO logotipi va QR kod daxlsizligi: Platforma tomonidan har bir videoga maxsus tasdiqlovchi QR kod va VIDO logotipi joylashtiriladi. Mijoz ushbu belgilarni qirqib tashlash, xiralashtirish, ustiga boshqa grafik elementlar yopishtirish yoki uchinchi dasturlar orqali o'chirib tashlash huquqiga ega emas.</p>
          <p className="mt-2"><strong className="text-white/90">6.2.</strong> Axborot xavfsizligi: Platforma foydalanuvchilarning shaxsiy ma'lumotlari, buyurtma tarixlari va barcha tranzaksiyalarni maxfiylik siyosati asosida o'z bazasida xavfsiz saqlashni kafolatlaydi.</p>
        </section>
      </div>
    </div>
  )
}
