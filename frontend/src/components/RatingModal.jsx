import { useState } from 'react'
import { Star, X } from 'lucide-react'

export default function RatingModal({ starName, onClose, onSubmit }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      alert("Iltimos, yulduzchalarni tanlab baho bering!")
      return
    }
    setBusy(true)
    try {
      await onSubmit({ rating, text })
      onClose()
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm card-surface rounded-3xl overflow-hidden shadow-gold-lg animate-fade-up relative border border-white/10" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors bg-ink-800 p-1.5 rounded-full">
          <X size={20} />
        </button>
        
        <div className="p-6 sm:p-8">
          <h3 className="font-display font-bold text-xl text-white text-center mb-1">
            {starName}ni baholang
          </h3>
          <p className="text-xs text-white/40 text-center mb-6">Videodan qoniqdingizmi? Fikringizni qoldiring.</p>
          
          {/* YULDUZCHALAR - XATOLIK TUZATILDI */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  size={42}
                  strokeWidth={1.5}
                  className={`transition-all duration-200 ${
                    (hover || rating) >= star
                      ? 'text-gold-400 fill-gold-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                      : 'text-white/20 fill-transparent hover:text-white/40'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            className="input-dark min-h-[100px] resize-none w-full mb-5"
            placeholder="Fikringizni yozing (ixtiyoriy)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            disabled={busy}
            className="btn-gold w-full flex justify-center items-center py-3 text-sm font-bold uppercase tracking-wider"
          >
            {busy ? (
              <span className="w-5 h-5 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              'Bahoni saqlash'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}