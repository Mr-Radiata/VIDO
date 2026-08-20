import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, CreditCard, CheckCircle2, ArrowLeft, AlertCircle } from 'lucide-react'
import { occasions } from '../data/mockData'
import { api, normalizeStar, fileUrl } from '../api'
import { useAuth } from '../context/AuthContext'

function formatPrice(n) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

export default function OrderCheckout() {
  const { starId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // 1. BARCHA HOOK'LAR ENG YUQORIDA BO'LISHI SHART
  const [star, setStar] = useState(null)
  const [step, setStep] = useState(0)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ recipientName: '', occasion: occasions[0], instructions: '', isPublicShowcase: false })
  const [provider, setProvider] = useState('payme')
  
  useEffect(() => {
    api.getStar(starId).then((res) => setStar(normalizeStar(res.star))).catch(() => setStar(null))
  }, [starId])
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  
  const handlePhoto = (e) => {
    const file = e.target.files?.[0]
    if (file) { 
      setPhotoFile(file); 
      setPhotoPreview(URL.createObjectURL(file)) 
    }
  }

  const submitOrder = async () => {
    setError('')
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('starId', star.id)
      fd.append('recipientName', form.recipientName)
      fd.append('occasion', form.occasion)
      fd.append('instructions', form.instructions)
      fd.append('recipientPhoto', photoFile) 
      fd.append('isPublicShowcase', form.isPublicShowcase)
      
      const { order } = await api.createOrder(fd)
      // Buyurtma yaratilgach, darhol to'lovni (eskrovga qo'yishni) amalga oshiramiz.
      // Hozircha haqiqiy Payme/Click ulanmagani uchun bu ICHKI (demo) rejimda,
      // lekin `provider` tanlovi tranzaksiya yozuviga saqlanadi — kelajakda
      // haqiqiy provayder ulanganda faqat shu chaqiruv ichki mantig'i o'zgaradi,
      // interfeys o'zgarishsiz qoladi.
      await api.checkout(order.id, provider)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  // 2. ENDI RETURN'LARNI QO'YISH MUMKIN
  if (!star) return <p className="text-center text-white/30 py-24">Yuklanmoqda...</p>

  // 3. YULDUZLARNI QULFLASH (O'ziga yoki boshqaga buyurtma bera olmaydi)
  if (user && user.role === 'star') {
    return (
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-24 text-center">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <p className="text-white/80 font-medium text-lg mb-2">Siz yulduz rolidasiz</p>
        <p className="text-white/50 text-sm mb-6">Yulduzlar video buyurtma qila olmaydi. Buyurtma berish uchun mijoz hisobidan kiring.</p>
        <button onClick={() => navigate(-1)} className="btn-outline">Orqaga qaytish</button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white mb-6">
        <ArrowLeft size={15} /> Orqaga
      </button>
      
      <div className="flex items-center gap-3 mb-8">
        <img src={star.avatar ? fileUrl(star.avatar) : '/placeholder.jpg'} alt={star.name} className="w-12 h-12 rounded-full object-cover border border-gold-500/40 bg-ink-800" />
        <div>
          <p className="font-display font-semibold text-white">{star.name} uchun buyurtma</p>
          <p className="text-sm text-gold-400">{formatPrice(star.price)}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/25 rounded-xl px-3.5 py-2.5 mb-4">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === 0 && (
        <div className="card-surface rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <label className="text-sm text-white/70 mb-1.5 block">Tabrik kimga mo'ljallangan?</label>
            <input className="input-dark" placeholder="Masalan: Madina" value={form.recipientName} onChange={update('recipientName')} />
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1.5 block">Tadbir turi</label>
            <select className="input-dark" value={form.occasion} onChange={update('occasion')}>
              {occasions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1.5 block">Tabrik matni / ko'rsatmalar</label>
            <textarea className="input-dark min-h-[100px] resize-none" placeholder="Yulduz aynan nima deyishi kerakligini yozing..." value={form.instructions} onChange={update('instructions')} />
          </div>
          
          <div>
            <label className="text-sm text-white/70 mb-1.5 flex justify-between">
              Qabul qiluvchining surati <span className="text-gold-400 text-xs mt-0.5">Majburiy</span>
            </label>
            {/* Ogohlantirish xabari */}
            <p className="text-[10px] text-white/40 mb-2">
              Iltimos, yuz qismi aniq ko'rinib turgan, kvadrat shakldagi (1:1) rasmni tanlang. Faqat JPG yoki PNG formatlar qabul qilinadi.
            </p>
            
            <label className={`flex items-center gap-3 border border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${!photoPreview ? 'border-red-500/40 hover:border-red-500/80 bg-red-500/5' : 'border-white/15 hover:border-gold-500/50'}`}>
              {photoPreview
                ? <img src={photoPreview} alt="preview" className="w-10 h-10 rounded-full object-cover" />
                : <span className="w-10 h-10 rounded-full bg-ink-800 flex items-center justify-center"><Upload size={16} className={!photoPreview ? "text-red-400/60" : "text-white/40"} /></span>}
              <span className="text-sm text-white/50">{photoPreview ? 'Surat tanlandi (Almashtirish)' : 'Rasm yuklash uchun bosing'}</span>
              
              {/* Ruxsat etilgan formatlarni qat'iy belgilash */}
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/jpg" 
                className="hidden" 
                onChange={handlePhoto} 
              />
            </label>
          </div>

          <label className="flex items-start gap-3 px-1 cursor-pointer select-none">
            <input
              type="checkbox"
              className="mt-0.5 w-4 h-4 accent-gold-500"
              checked={form.isPublicShowcase}
              onChange={(e) => setForm((f) => ({ ...f, isPublicShowcase: e.target.checked }))}
            />
            <span className="text-xs text-white/50 leading-relaxed">
              Tayyor videoning yulduz profilida <strong className="text-white/70">ommaviy portfolio</strong> sifatida
              (boshqa foydalanuvchilarga ham ko'rinadigan qilib) namoyish etilishiga roziman. Belgilanmasa,
              video faqat sizga ko'rinadi.
            </span>
          </label>
          
          <button
            disabled={!form.recipientName.trim() || !form.instructions.trim() || !photoFile}
            onClick={() => setStep(1)}
            className="btn-gold w-full mt-2 disabled:opacity-30 disabled:hover:scale-100 disabled:shadow-none"
          >
            Davom etish
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card-surface rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-xl bg-ink-800 px-4 py-3 border border-white/5">
            <span className="text-sm text-white/60">{star.name} — shaxsiy video</span>
            <span className="font-display font-semibold text-gold-400">{formatPrice(star.price)}</span>
          </div>

          <div>
            <label className="text-sm text-white/70 mb-2 block">To'lov usulini tanlang</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProvider('payme')}
                className={`rounded-xl border px-4 py-3.5 text-sm font-semibold transition-colors ${provider === 'payme' ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-white/10 text-white/60 hover:border-white/25'}`}
              >
                Payme
              </button>
              <button
                type="button"
                onClick={() => setProvider('click')}
                className={`rounded-xl border px-4 py-3.5 text-sm font-semibold transition-colors ${provider === 'click' ? 'border-gold-500 bg-gold-500/10 text-gold-400' : 'border-white/10 text-white/60 hover:border-white/25'}`}
              >
                Click
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-white/40 bg-white/[0.03] border border-white/5 rounded-xl px-3.5 py-2.5">
            <CreditCard size={14} className="shrink-0 mt-0.5" />
            <span>
              To'lovingiz VIDO'ning xavfsiz eskrov hisobida saqlanadi va video yetkazilgandan
              24 soat o'tib, shikoyat bo'lmasa, yulduzga o'tkaziladi.
            </span>
          </div>

          <button
            disabled={busy}
            onClick={submitOrder}
            className="btn-gold w-full mt-2 disabled:opacity-30 disabled:hover:scale-100"
          >
            {busy ? 'Yuborilmoqda...' : `To'lash — ${formatPrice(star.price)}`}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="card-surface rounded-2xl p-10 flex flex-col items-center text-center gap-3">
          <CheckCircle2 className="text-neon-cyan" size={56} />
          <p className="font-display font-semibold text-lg text-white">Buyurtma qabul qilindi!</p>
          <p className="text-sm text-white/50 max-w-xs">{star.name} sizning buyurtmangizni oldi. Video 48 soat ichida tayyor bo'ladi.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-gold mt-3">Dashboard'ga o'tish</button>
        </div>
      )}
    </div>
  )
}