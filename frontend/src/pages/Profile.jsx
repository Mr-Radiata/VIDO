import { useEffect, useState, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Star, Play, X, BadgeCheck, MessageSquare, Send, AtSign, Tv } from 'lucide-react'
import { api, fileUrl, normalizeStar } from '../api'
import { useAuth } from '../context/AuthContext'

function formatPrice(n) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

/* ---------------- GRID VIDEO KARTASI (HOVER PLAY BILAN) ---------------- */
function ProfileVideoCard({ video, onClick }) {
  const videoRef = useRef(null)

  return (
    <div
      className="aspect-[3/4] relative rounded-2xl overflow-hidden cursor-pointer bg-ink-800 border border-white/5 hover:border-gold-500/30 transition-all group shadow-lg"
      onClick={() => onClick(video)}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => { 
         if(videoRef.current) {
          videoRef.current.pause(); 
          videoRef.current.currentTime = 0; 
         }
      }}
    >
      <video
        ref={videoRef}
        src={fileUrl(video.video_url)}
        muted
        loop
        playsInline
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent opacity-90" />
      
      <div className="absolute bottom-3 left-3 right-3 flex flex-col">
        <span className="text-[10px] text-white/90 font-medium bg-white/10 backdrop-blur border border-white/10 px-2 py-1 rounded w-fit mb-1.5">
          {video.occasion}
        </span>
        <span className="text-sm font-semibold text-white truncate">
          {video.recipient_name}
        </span>
      </div>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 scale-90 group-hover:scale-100 transition-transform">
           <Play size={24} className="ml-1" fill="currentColor" />
         </div>
      </div>
    </div>
  )
}

/* ---------------- ASOSIY PROFIL ---------------- */
export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [star, setStar] = useState(null)
  const [videos, setVideos] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('videos')
  const [selectedVideo, setSelectedVideo] = useState(null)

  useEffect(() => {
    if (!id || id === 'undefined') {
      setLoading(false);
      return;
    }
    api.getStar(id).then(res => {
      if(res.star) setStar(normalizeStar(res.star))
      setVideos(res.videos || [])
      setReviews(res.reviews || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-ink-900 pt-24 text-center text-white/40">Yuklanmoqda...</div>
  if (!star) return <div className="min-h-screen bg-ink-900 pt-24 text-center text-white/40">Yulduz topilmadi</div>

  return (
    <div className="min-h-screen bg-ink-900">
      
      {/* BANNER QISMI */}
      <div className="relative w-full h-48 sm:h-64 lg:h-72 bg-ink-800 overflow-hidden border-b border-white/5">
        <img src={fileUrl(star.cover, 'cover')} className="w-full h-full object-cover opacity-60" alt="Banner" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/60 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative -mt-20 sm:-mt-24 pb-20">
        
        {/* AVATAR VA MA'LUMOTLAR */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
          <div className="flex items-end gap-5">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-ink-900 overflow-hidden bg-ink-800 shadow-xl shrink-0">
              <img src={star.avatar ? fileUrl(star.avatar) : '/placeholder.jpg'} className="w-full h-full object-cover" />
            </div>
            <div className="pb-2">
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-white flex items-center gap-2">
                {star.name}
                {star.verified && <BadgeCheck size={28} className="text-neon-cyan" />}
              </h1>
              <div className="flex items-center gap-3 text-sm text-white/50 mt-2">
                <span className="capitalize">{star.category}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-gold-400">
                  <Star size={14} fill="currentColor" /> {star.rating}
                </span>
                <span>•</span>
                <span>{videos.length} ta video</span>
              </div>
            </div>
          </div>

          {/* TUGMA QISMI (XAVFSIZLIK QO'SHILDI) */}
          {star.is_banned ? (
              <div className="bg-ink-800 border border-white/10 px-8 py-3 rounded-full text-white/60 text-sm font-medium w-full sm:w-auto text-center cursor-not-allowed flex flex-col justify-center">
                <span className="text-white/80">Vaqtinchalik tanaffusda</span>
                <span className="text-[10px] text-white/40 mt-0.5">Yangi buyurtmalar qabul qilinmayapti</span>
              </div>
            ) : !star.verified ? (
              <div className="bg-ink-800 border border-white/10 px-8 py-3 rounded-full text-white/60 text-sm font-medium w-full sm:w-auto text-center cursor-not-allowed flex flex-col justify-center">
                <span className="text-white/80">Hali tasdiqlanmagan</span>
                <span className="text-[10px] text-white/40 mt-0.5">Ma'muriyat ruxsati kutilmoqda</span>
              </div>
            ) : star.this_week_orders >= 5 ? (
              /* MANA BU YERGA HAFTALIK LIMIT QO'SHILDI 👇 */
              <div className="bg-ink-800 border border-white/10 px-8 py-3.5 rounded-full text-white/50 text-sm font-medium w-full sm:w-auto text-center cursor-not-allowed flex flex-col justify-center">
                <span className="text-white/80">Haftalik buyurtmalari to'lgan!</span>
                
              </div>
            ) : (!user || user.role === 'client') ? (
              <Link to={`/checkout/${star.id}`} className="btn-gold !py-3.5 !px-8 text-base shadow-gold w-full sm:w-auto text-center">
                Buyurtma — {formatPrice(star.price)}
              </Link>
            ) : user.id === star.id ? (
              <div className="bg-white/5 border border-white/10 px-8 py-3.5 rounded-full text-white/50 text-sm font-medium w-full sm:w-auto text-center cursor-not-allowed">
                Bu sizning profilingiz
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 px-8 py-3.5 rounded-full text-white/50 text-sm font-medium w-full sm:w-auto text-center cursor-not-allowed">
                Faqat mijozlar uchun
              </div>
            )}
        </div>

        <p className="text-white/80 max-w-2xl leading-relaxed mb-6 text-sm sm:text-base">
          {star.bio || "Ushbu yulduz hali o'zi haqida ma'lumot qoldirmagan."}
        </p>

        {/* IJTIMOIY TARMOQLAR UCHUN QISM */}
        {(star.telegram || star.instagram || star.youtube) && (
          <div className="flex flex-wrap items-center gap-4 mb-10">
            {star.instagram && (
              <a href={star.instagram.startsWith('http') ? star.instagram : `https://instagram.com/${star.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-neon-cyan/10 border border-white/10 hover:border-neon-cyan/30 text-white/70 hover:text-neon-cyan rounded-full transition-colors text-sm">
                <AtSign size={16} /> Instagram
              </a>
            )}
            {star.telegram && (
              <a href={star.telegram.startsWith('http') ? star.telegram : `https://t.me/${star.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-neon-cyan/10 border border-white/10 hover:border-neon-cyan/30 text-white/70 hover:text-neon-cyan rounded-full transition-colors text-sm">
                <Send size={16} /> Telegram
              </a>
            )}
            {star.youtube && (
              <a href={star.youtube.startsWith('http') ? star.youtube : `https://youtube.com/${star.youtube}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-neon-cyan/10 border border-white/10 hover:border-neon-cyan/30 text-white/70 hover:text-neon-cyan rounded-full transition-colors text-sm">
                <Tv size={16} /> YouTube
              </a>
            )}
          </div>
        )}

        {/* TABLAR */}
        <div className="flex gap-6 border-b border-white/10 mb-8 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('videos')}
            className={`pb-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${activeTab === 'videos' ? 'text-white border-gold-500' : 'text-white/40 border-transparent hover:text-white/70'}`}
          >
            Asosiy videolar
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'reviews' ? 'text-white border-gold-500' : 'text-white/40 border-transparent hover:text-white/70'}`}
          >
            Sharhlar <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{reviews.length}</span>
          </button>
        </div>

        {/* TAB KONTENTI */}
        {activeTab === 'videos' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {videos.length > 0 ? (
              videos.map((v) => <ProfileVideoCard key={v.id} video={v} onClick={setSelectedVideo} />)
            ) : (
              <p className="col-span-full text-white/40 py-10 text-center">Hali videolar yo'q.</p>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reviews.length > 0 ? (
              reviews.map((r) => (
                <div key={r.id} className="card-surface p-5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-1 mb-2 text-gold-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < r.rating ? "fill-gold-400" : "text-white/10"} />
                    ))}
                  </div>
                  <p className="text-white/80 text-sm italic mb-4">"{r.text}"</p>
                  <p className="text-xs text-white/40 font-medium">— {r.client_name || 'Mijoz'}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-16 bg-ink-800/30 rounded-2xl border border-white/5 border-dashed">
                 <MessageSquare size={32} className="text-white/20 mb-3" />
                 <p className="text-white/60 font-medium">Hozircha sharhlar yo'q</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* YOUTUBE SHORTS USLUBIDAGI PLEYER MODALI */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-md" onClick={() => setSelectedVideo(null)}>
          <button className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 sm:p-3 rounded-full transition-all backdrop-blur">
            <X size={24} />
          </button>
          
          <div 
            className="w-full h-full sm:w-[400px] sm:h-[80vh] sm:rounded-3xl overflow-hidden relative bg-ink-950 flex flex-col justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <video 
              src={fileUrl(selectedVideo.video_url)} 
              controls 
              controlsList="nodownload" // <-- SHU QO'SHILDI
              onContextMenu={(e) => e.preventDefault()}
              autoPlay 
              className="w-full h-full object-contain" 
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pointer-events-none">
               <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">{selectedVideo.occasion}</p>
               <h3 className="text-white font-display font-bold text-xl">{selectedVideo.recipient_name} uchun</h3>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}