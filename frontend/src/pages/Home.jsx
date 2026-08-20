import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Mic2, Clapperboard, Smartphone, ArrowRight, Sparkles, 
  PlaySquare, MonitorPlay, Activity, Gamepad2, Smile, Tv, 
  Mic, Music, Briefcase, Dumbbell, PartyPopper, ServerCrash, RefreshCcw, Share2
} from 'lucide-react'
import VideoCard from '../components/VideoCard'
import { api, normalizeStar, fileUrl } from '../api'
import { categories } from '../data/mockData'
import { useAuth } from '../context/AuthContext'

const CATEGORY_ICONS = {
  'mic-2': Mic2,
  'clapperboard': Clapperboard,
  'smartphone': Smartphone,
  'play-square': PlaySquare,
  'monitor-play': MonitorPlay,
  'activity': Activity,
  'gamepad': Gamepad2,
  'smile': Smile,
  'tv': Tv,
  'mic': Mic,
  'music': Music,
  'briefcase': Briefcase,
  'dumbbell': Dumbbell,
  'party-popper': PartyPopper,
}

// QO'SHIMCHA HIMOYA: stars = [] qilib qo'yildi
function Hero({ stars = [] }) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalStars = stars.length;
  
  const topStars = stars
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 10);

  useEffect(() => {
    if (topStars.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % topStars.length);
    }, 3500); 
    return () => clearInterval(interval);
  }, [topStars]);

  const heroStar = topStars[currentIndex];

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-14 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 rounded-full px-3 py-1 mb-5 transition-all">
            <Sparkles size={12} /> {totalStars > 0 ? `${totalStars} ta tasdiqlangan yulduz` : 'Yulduzlar yuklanmoqda...'}
          </span>
          <h1 className="text-4xl sm:text-5xl font-display font-extrabold leading-[1.08] mb-5">
            <span className="bg-clip-text text-transparent bg-gold-purple">Yulduzlarni</span>
            <br />
            muxlislarga yaqinlashtiruvchi platforma
          </h1>
          <p className="text-white/55 text-lg mb-8 max-w-md">
            Sevimli qahramoningizdan shaxsiy va unutilmas video tabriklar buyurtma qiling — 30-60 soniyada.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/browse/all" className="btn-gold">
              Yulduzni tanlash <ArrowRight size={16} />
            </Link>
            
            {/* Faqatgina tizimga umuman KIRMASHGAN mehmonlargagina ko'rinadi */}
            {!user && (
              <Link to="/auth?mode=register&role=star" className="btn-outline">
                Yulduz sifatida qo'shilish
              </Link>
            )}
          </div>
        </div>

        <div className="relative flex justify-center animate-fade-up" style={{ animationDelay: '0.15s' }}>
          {heroStar && (
            <div 
              key={heroStar.id} 
              className="relative w-64 rotate-3 rounded-[2.5rem] border-4 border-ink-700 shadow-gold-lg overflow-hidden animate-fade-in transition-all duration-500">
              <img 
                src={fileUrl(heroStar.cover || heroStar.avatar, 'cover')} 
                alt={heroStar.name} 
                className="w-full aspect-[9/16] object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 card-surface rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-ink-950 text-xs font-bold">
                  <PlaySquare size={14} className="ml-0.5" fill="currentColor"/>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{heroStar.name}</p>
                  <p className="text-[10px] text-white/40 font-medium text-gold-400">★ {heroStar.rating.toFixed(1)}</p>
                </div>
              </div>
            </div>
          )}
          <div className="absolute -z-10 w-72 h-72 rounded-full bg-neon-purple/20 blur-3xl top-0 right-0" />
          <div className="absolute -z-10 w-64 h-64 rounded-full bg-gold-500/15 blur-3xl bottom-0 left-0" />
        </div>
      </div>
    </section>
  )
}

function HotTrends({ stars }) {
  const trending = stars.filter((s) => s.trending)
  if (trending.length === 0) return null
  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-display font-bold">Issiq trendlar</h2>
        <Link to="/browse/all" className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1">
          Barchasi <ArrowRight size={14} />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-5 px-5 sm:mx-0 sm:px-0">
        {trending.map((star) => <VideoCard key={star.id} star={star} />)}
      </div>
    </section>
  )
}

function Categories({ stars }) {
  const displayCategories = categories.filter((c) => c.id !== 'all')

  // ULASHISH MANTIG'I
  const handleInvite = async () => {
    const shareData = {
      title: 'VIDO - Yulduzlar platformasi',
      text: "Salom! Sizni VIDO platformasida ko'rishni xohlaymiz. Muxlislaringiz sizdan shaxsiy video tabriklar buyurtma qilishlari uchun ushbu havolaga kiring va yulduz sifatida ro'yxatdan o'ting: ",
      url: window.location.origin + '/auth?mode=register&role=star'
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Ulashish bekor qilindi");
      }
    } else {
      // Agar brauzer Share API ni qo'llab-quvvatlamasa, nusxalab oladi
      navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`);
      alert("Taklif matni nusxalandi! Endi uni o'zingiz yoqtirgan yulduzga jo'natishingiz mumkin.");
    }
  }

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      <h2 className="text-2xl font-display font-bold mb-5">Kategoriyalar</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon]
          const count = stars.filter((s) => s.category === cat.id).length
          return (
            <Link key={cat.id} to={`/browse/${cat.id}`} className="card-surface rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 hover-card text-center sm:text-left">
              <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500/20 to-neon-purple/20 flex items-center justify-center text-gold-400 shrink-0">
                {Icon && <Icon size={22} />}
              </span>
              <div>
                <p className="font-display font-semibold text-white leading-tight">{cat.label}</p>
                <p className="text-xs text-white/40 mt-1">{count} ta yulduz</p>
              </div>
            </Link>
          )
        })}

        {/* YANGI TUGMA: Yulduzni taklif qilish */}
        <button
          onClick={handleInvite}
          className="card-surface rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4 hover-card border-dashed border-gold-500/30 text-center sm:text-left group cursor-pointer"
        >
          <span className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-400 shrink-0 group-hover:scale-110 transition-transform">
            <Share2 size={22} />
          </span>
          <div>
            <p className="font-display font-semibold text-white leading-tight">Yulduzni taklif qilish</p>
            <p className="text-[10px] sm:text-xs text-white/40 mt-1">Sevimli yulduzingiz yo'qmi? Havola yuboring</p>
          </div>
        </button>

      </div>
    </section>
  )
}

export default function Home() {
  const [stars, setStars] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    api.listStars()
      .then((res) => {
        setStars(res.stars.map(normalizeStar))
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'error') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="bg-ink-800/50 border border-white/5 rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center max-w-md shadow-2xl backdrop-blur-sm">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <ServerCrash size={40} className="text-red-400" />
          </div>
          <h2 className="font-display font-bold text-2xl text-white mb-2">
            Server bilan aloqa uzildi
          </h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Tizimda vaqtinchalik uzilish yuz berdi yoki internetingizda muammo bor. Iltimos, birozdan so'ng qayta urinib ko'ring.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-full font-medium transition-colors"
          >
            <RefreshCcw size={18} /> Sahifani yangilash
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* XATOLIK TO'G'RILANDI: stars={stars} sifatida yuborildi */}
      <Hero stars={stars} />
      
      {status === 'loading' ? (
        <p className="text-center text-white/30 py-10">Yuklanmoqda...</p>
      ) : (
        <>
          <HotTrends stars={stars} />
          <Categories stars={stars} />
        </>
      )}
    </div>
  )
}