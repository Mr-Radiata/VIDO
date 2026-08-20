import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, BadgeCheck, X, Star } from 'lucide-react'
import { fileUrl } from '../api'

function formatPrice(n) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

export default function VideoCard({ variant = 'star', star, video }) {
  const [playing, setPlaying] = useState(false)

  if (variant === 'video') {
    return (
      <>
        <button
          onClick={() => setPlaying(true)}
          className="group relative aspect-square w-full overflow-hidden rounded-lg bg-ink-800 border border-white/5 hover-card"
        >
          <img src={video.thumbnail ? fileUrl(video.thumbnail) : '/placeholder.jpg'} alt={video.occasion} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="w-11 h-11 rounded-full bg-gold-500/90 flex items-center justify-center text-ink-950">
              <Play size={18} fill="currentColor" />
            </span>
          </div>
          <span className="absolute bottom-2 left-2 text-[11px] font-medium bg-black/60 px-2 py-0.5 rounded-full text-white/90">
            {video.occasion}
          </span>
        </button>
        {playing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setPlaying(false)}>
            <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setPlaying(false)} className="absolute -top-10 right-0 text-white/70 hover:text-white">
                <X size={26} />
              </button>
              <div className="aspect-[9/16] rounded-2xl overflow-hidden border border-gold-500/30 shadow-gold-lg bg-ink-800">
                <img src={video.thumbnail ? fileUrl(video.thumbnail) : '/placeholder.jpg'} alt={video.occasion} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-16 h-16 rounded-full bg-gold-500/90 flex items-center justify-center text-ink-950">
                    <Play size={26} fill="currentColor" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <Link
      to={`/profile/${star.id}`}
      className="group relative w-full rounded-2xl overflow-hidden card-surface hover-card border border-white/5"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-ink-800">
        <img src={star.avatar ? fileUrl(star.avatar) : '/placeholder.jpg'} alt={star.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
        {star.trending && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wide bg-gold-500 text-ink-950 px-2 py-1 rounded-full">
            Trend
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1">
          <p className="font-display font-semibold text-white truncate">{star.name}</p>
          {star.verified && <BadgeCheck size={15} className="text-neon-cyan shrink-0" />}
        </div>
        <div className="flex items-center justify-between mt-2">
          
          {/* REYTING QISMI TO'G'RILANDI */}
          <div className="flex items-center gap-1 text-gold-400 font-bold text-xs">
            <Star size={13} fill="currentColor" />
            <span>{Number(star.rating || 0).toFixed(1)}</span>
          </div>

          <span className="text-gold-400 text-sm font-semibold">{formatPrice(star.price)}</span>
        </div>
      </div>
    </Link>
  )
}