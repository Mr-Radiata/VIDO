import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShieldCheck, Play } from 'lucide-react'
import { api, fileUrl } from '../api'

export default function Verify() {
  const { orderId } = useParams()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    api.verify(orderId)
      .then((res) => { setData(res.verification); setStatus('ready') })
      .catch(() => setStatus('error'))
  }, [orderId])

  if (status === 'loading') return <p className="text-center text-white/30 py-24">Tekshirilmoqda...</p>

  if (status === 'error' || !data) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center">
        <p className="text-white/50">Bu QR kod VIDO tizimida topilmadi.</p>
        <Link to="/" className="text-gold-400 hover:underline mt-3 inline-block">Bosh sahifaga qaytish</Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16 text-center">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20 rounded-full px-3 py-1 mb-6">
        <ShieldCheck size={12} /> Original VIDO videosi
      </span>

      <div className="relative aspect-[9/16] max-w-xs mx-auto rounded-2xl overflow-hidden border border-gold-500/30 shadow-gold-lg bg-ink-800">
        {data.video_url ? (
          <video 
            src={fileUrl(data.video_url)} 
            className="w-full h-full object-cover" 
            controls 
            controlsList="nodownload" // <-- SHU QO'SHILDI
            onContextMenu={(e) => e.preventDefault()} // <-- SHU QO'SHILDI
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20">
            <Play size={40} />
          </div>
        )}
      </div>

      <p className="text-white/70 mt-6 leading-relaxed">
        Bu video maxsus <span className="text-gold-400 font-semibold">{data.star_name}</span> tomonidan{' '}
        <span className="text-neon-cyan font-semibold">{data.recipient_name}</span> uchun VIDO platformasida yaratilgan.
      </p>
      <p className="text-xs text-white/30 mt-3">{data.occasion} · {new Date(data.created_at).toLocaleDateString('uz-UZ')}</p>

      <Link to={`/profile/${data.star_id}`} className="btn-gold mt-8 inline-flex">{data.star_name} profiliga o'tish</Link>
    </div>
  )
}
