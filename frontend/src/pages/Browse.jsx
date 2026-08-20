import { useState, useMemo, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, Share2 } from 'lucide-react'
import VideoCard from '../components/VideoCard'
import { api, normalizeStar } from '../api'
import { categories } from '../data/mockData'

const SORTS = {
  rating: (a, b) => b.rating - a.rating,
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
}

export default function Browse() {
  const { category } = useParams()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || '' 
  const [sort, setSort] = useState('rating')
  const [stars, setStars] = useState([])
  const [loading, setLoading] = useState(true)

  const active = categories.find((c) => c.id === category) || categories[0]

  useEffect(() => {
    setLoading(true)
    const queryCategory = category === 'all' ? '' : category;
    api.listStars(queryCategory, q)
      .then((res) => setStars(res.stars.map(normalizeStar)))
      .finally(() => setLoading(false))
  }, [category, q])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category]); // Kategoriya o'zgarganda ishlaydi

  const list = useMemo(() => [...stars].sort(SORTS[sort]), [stars, sort])

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
      navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`);
      alert("Taklif matni nusxalandi! Endi uni o'zingiz yoqtirgan yulduzga jo'natishingiz mumkin.");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
      
      {/* KATEGORIYALAR VA TAKLIF TUGMASI */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {categories.map((c) => (
          <Link
            key={c.id}
            to={`/browse/${c.id}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              c.id === category ? 'bg-gold-500 text-ink-950' : 'bg-ink-800 text-white/60 hover:text-white'
            }`}
          >
            {c.label}
          </Link>
        ))}
        
        {/* DOIMIY KO'RINIB TURADIGAN TAKLIF TUGMASI */}
        <button
          onClick={handleInvite}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border border-dashed border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500 sm:ml-2"
        >
          <Share2 size={14} /> Yulduzni taklif qilish
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">
          {q ? `"${q}" bo'yicha natijalar` : active?.label || 'Yulduzlar'}
        </h1>
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-ink-800 border border-white/10 rounded-full pl-4 pr-9 py-2 text-sm text-white/70 outline-none focus:border-gold-500/60"
          >
            <option value="rating">Reyting bo'yicha</option>
            <option value="price_asc">Arzon narx</option>
            <option value="price_desc">Qimmat narx</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <p className="text-white/30 text-center py-16">Yuklanmoqda...</p>
      ) : list.length === 0 ? (
        
        <div className="flex flex-col items-center justify-center py-20 text-center bg-ink-800/30 rounded-2xl border border-white/5 border-dashed px-4 mt-6">
          <p className="text-white/80 font-medium text-lg mb-2">
            {q ? "Qidiruvingiz bo'yicha yulduz topilmadi." : "Bu kategoriyada hozircha yulduzlar yo'q."}
          </p>
          <p className="text-sm text-white/40 mb-8 max-w-sm">
            Sevimli yulduzingizni topa olmadingizmi? Ularni platformaga taklif qiling va birinchilardan bo'lib buyurtma bering!
          </p>
          <button onClick={handleInvite} className="btn-gold !px-6 !py-3 flex items-center gap-2">
            <Share2 size={18} /> Yulduzni taklif qilish
          </button>
        </div>

      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {list.map((star, index) => <VideoCard key={star.id || star.user_id || index} star={star} />)}
        </div>
      )}
    </div>
  )
}