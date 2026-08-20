import { useEffect, useState, useRef } from 'react'
import { Navigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import StarLayout from '../layouts/StarLayout'
import QRGenerator from '../components/QRGenerator'
import RatingModal from '../components/RatingModal'
import { useAuth } from '../context/AuthContext'
import { api, fileUrl, normalizeStar } from '../api'
import { categories } from '../data/mockData'
import { 
  UploadCloud, Clock, CheckCircle2, Download, Star as StarIcon, 
  Wallet, Inbox as InboxIcon, Film, AlertCircle, Plus, X, 
  Image as ImageIcon, Camera, Check, Play, ShieldAlert, Ban, Headset, Info, Timer,
  MessageCircle, Send, ArrowLeft, Ticket, Bot, FileWarning, AtSign, Tv, ArrowUpRight
} from 'lucide-react'

function formatPrice(n) {
  return new Intl.NumberFormat('uz-UZ').format(n) + " so'm"
}

/* ---------------- UMUMIY: YORDAM VA CHAT TAB ---------------- */
function SupportTab({ orders = [], tickets = [], onTicketRead }) {
  const { user } = useAuth()
  const [activeTicket, setActiveTicket] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false) // Tickets yuqoridan keladi
  const [view, setView] = useState('list') 
  
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const [replyText, setReplyText] = useState('')
  const messagesEndRef = useRef(null)

  const openTicket = async (ticket) => {
    setActiveTicket(ticket)
    setView('chat')
    try {
      const res = await api.getTicketDetails(ticket.id)
      setMessages(res.messages)
      
      // Xabarni o'qiganida avtomatik Badge ni tozalash (O'qildi qilish)
      if (ticket.status === 'answered') {
         await api.markTicketAsRead(ticket.id);
         if (onTicketRead) onTicketRead(ticket.id);
      }
    } catch (err) {
      alert("Xabarlarni yuklashda xatolik")
    }
  }
  // Ekranning pastga sakrab ketmasligi uchun Silliq va Izolyatsiya qilingan Scroll
  useEffect(() => {
    if (view === 'chat' && messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
         container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, view])

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    try {
      const res = await api.createTicket({ subject, message })
      if (onTicketRead) onTicketRead(null, true); // Reload tickets
      setView('list')
      setSubject('')
      setMessage('')
      openTicket({ id: res.ticketId, subject, status: 'open' })
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    const tempText = replyText
    setReplyText('')
    try {
      await api.replyTicket(activeTicket.id, { message: tempText })
      const res = await api.getTicketDetails(activeTicket.id)
      setMessages(res.messages)
      if (onTicketRead) onTicketRead(null, true);
    } catch (err) {
      alert(err.message)
      setReplyText(tempText)
    }
  }

  const handleCloseTicket = async () => {
    if (!window.confirm("Rostdan ham bu murojaatni yopmoqchimisiz?")) return
    try {
      await api.closeTicket(activeTicket.id)
      setActiveTicket({ ...activeTicket, status: 'closed' })
      if (onTicketRead) onTicketRead(null, true);
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="bg-ink-800 border border-white/5 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[600px] animate-fade-in">
      {view === 'list' && (
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-ink-900/50">
            <div>
              <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Headset className="text-gold-500" /> Ma'muriyat bilan aloqa
              </h2>
              <p className="text-xs text-white/40 mt-1">Savol va muammolar bo'yicha yozing</p>
            </div>
            <button onClick={() => setView('create')} className="btn-gold !py-2 !px-4 text-sm flex items-center gap-2">
              <Plus size={16} /> Yangi murojaat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {tickets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-white/30">
                <Ticket size={48} className="mb-4 opacity-20" />
                <p>Sizda hozircha murojaatlar yo'q</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => openTicket(t)}
                    className="p-4 rounded-xl border border-white/5 bg-ink-900/40 hover:bg-white/5 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-gold-400 transition-colors">{t.subject}</h4>
                      <p className="text-xs text-white/40 mt-1">Murojaat ochildi: {new Date(t.created_at).toLocaleDateString('uz-UZ')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {t.status === 'open' ? (
                        <span className="px-2 py-1 rounded bg-gold-500/10 text-gold-400 text-[10px] font-bold uppercase">Kutilmoqda</span>
                      ) : t.status === 'answered' ? (
                        <span className="px-2 py-1 rounded bg-neon-cyan/10 text-neon-cyan text-[10px] font-bold uppercase">Javob berildi</span>
                      ) : t.status === 'viewed' ? (
                        <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">O'qilgan</span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-white/5 text-white/40 text-[10px] font-bold uppercase">Yopilgan</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'create' && (
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex items-center gap-3 bg-ink-900/50">
            <button onClick={() => setView('list')} className="text-white/40 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-display font-bold text-white">Yangi murojaat yozish</h2>
          </div>
          
          <form onSubmit={handleCreateTicket} className="p-6 flex-1 flex flex-col gap-4">
            <div>
              <label className="text-sm text-white/70 mb-1.5 block">Muammo mavzusi</label>
              <input 
                type="text" 
                required 
                placeholder="Masalan: To'lov tizimi haqida"
                className="input-dark"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm text-white/70 mb-1.5 block">Batafsil tushuntiring</label>
              <textarea 
                required 
                placeholder="Muammo yoki savolingizni iloji boricha aniq yozing..."
                className="input-dark flex-1 resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-gold w-full mt-2 disabled:opacity-50">
              {submitting ? 'Yuborilmoqda...' : 'Murojaatni yuborish'}
            </button>
          </form>
        </div>
      )}

      {view === 'chat' && activeTicket && (
        <div className="flex flex-col h-full">
          <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-ink-900/50 shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('list')} className="text-white/40 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="font-display font-bold text-white truncate max-w-[200px] sm:max-w-md">{activeTicket.subject}</h2>
                <p className="text-xs text-white/40 mt-0.5 flex items-center gap-2">
                  ID: #{activeTicket.id}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${activeTicket.status === 'closed' ? 'bg-white/10 text-white/50' : 'bg-neon-cyan/10 text-neon-cyan'}`}>
                    {activeTicket.status}
                  </span>
                </p>
              </div>
            </div>
            {activeTicket.status !== 'closed' && (
              <button onClick={handleCloseTicket} className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 bg-red-500/10 rounded-lg transition-colors">
                Muammo hal bo'ldi
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-ink-900/20 relative">
            
            {(() => {
               const match = activeTicket?.subject.match(/#(\d+)/);
               const relatedOrder = match ? orders.find(o => o.id == match[1]) : null;
               if (!relatedOrder) return null;

               return (
                  <div className="bg-ink-950 p-4 mb-6 rounded-2xl border border-white/5 shadow-inner flex flex-col gap-3 shrink-0">
                     <h4 className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Buyurtma ma'lumotlari:</h4>
                     <div className="flex gap-4 items-start">
                        {relatedOrder.recipient_photo_url ? (
                           <img src={fileUrl(relatedOrder.recipient_photo_url)} className="w-16 h-16 rounded-xl object-cover border border-white/10" alt="Mijoz rasmi" />
                        ) : (
                           <div className="w-16 h-16 rounded-xl bg-ink-900 border border-white/10 flex items-center justify-center text-white/20"><ImageIcon size={20}/></div>
                        )}
                        <div>
                           <p className="text-white text-sm font-bold">{relatedOrder.recipient_name} uchun ({relatedOrder.occasion})</p>
                           <p className="text-white/60 text-xs mt-1 italic leading-relaxed">"{relatedOrder.instructions}"</p>
                        </div>
                     </div>
                  </div>
               );
            })()}

            {messages.map(msg => {
              const isAdmin = msg.sender_role === 'admin'
              return (
                <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                  <span className="text-[10px] text-white/30 mb-1 ml-1 pr-1">
                    {isAdmin ? 'Ma\'muriyat' : 'Siz'} • {new Date(msg.created_at).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  <div className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-sm ${isAdmin ? 'bg-ink-700 text-white/90 rounded-tl-sm' : 'bg-gold-500 text-ink-950 font-medium rounded-tr-sm'}`}>
                    {msg.message}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {activeTicket.status === 'closed' ? (
            <div className="p-4 bg-ink-900/80 text-center border-t border-white/5">
              <p className="text-sm text-white/40">Bu murojaat yopilgan. Yangi savol uchun yangi murojaat oching.</p>
            </div>
          ) : (
            <form onSubmit={handleReply} className="p-4 border-t border-white/5 bg-ink-900/50 flex gap-3 items-end">
              <textarea 
                className="input-dark !py-3 flex-1 resize-none min-h-[50px] max-h-[120px]" 
                placeholder="Javob yozing..." 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e); } }}
              />
              <button type="submit" disabled={!replyText.trim()} className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center text-ink-950 hover:bg-gold-400 transition-colors disabled:opacity-50 shrink-0">
                <Send size={20} className="ml-1" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------------- STAR: SOZLAMALAR BO'LIMI ---------------- */
function StarSettingsTab({ profile }) {
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ 
    price: '', 
    bio: '', 
    category: 'actors',
    weekly_limit: 5,
    is_active: true,
    unavailable_reason: "Dam olishdaman",
    telegram: '',
    instagram: '',
    youtube: ''
  })
  const [avatar, setAvatar] = useState(null)
  const [cover, setCover] = useState(null)

  useEffect(() => {
    if (profile) {
      setForm({
        price: profile.price ?? '',
        bio: profile.bio || '',
        category: profile.category || 'actors',
        weekly_limit: profile.weekly_limit ?? 5,
        is_active: profile.is_active ?? true,
        unavailable_reason: profile.unavailable_reason || "Dam olishdaman",
        telegram: profile.telegram || '',
        instagram: profile.instagram || '',
        youtube: profile.youtube || ''
      })
    }
  }, [profile])

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  
  const handleFile = (setter) => (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setter(Object.assign(file, { preview: URL.createObjectURL(file) }))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    
    if (parseInt(form.weekly_limit) < 5) {
      return alert("Haftalik buyurtma limiti eng kamida 5 ta bo'lishi shart!");
    }

    if (parseInt(form.price) < 100000 || parseInt(form.price) > 5000000) {
      return alert("Video tabrik narxi eng kamida 100 000 so'm va ko'pi bilan 5 000 000 so'm bo'lishi kerak!");
    }

    setBusy(true)
    try {
      const fd = new FormData();
      fd.append('price', form.price);
      fd.append('bio', form.bio);
      fd.append('category', form.category);
      fd.append('weekly_limit', form.weekly_limit);
      fd.append('is_active', form.is_active ? 'true' : 'false');
      fd.append('unavailable_reason', form.is_active ? '' : form.unavailable_reason);
      
      if (avatar) fd.append('avatar', avatar);
      if (cover) fd.append('cover', cover);
             
      await api.updateProfile(fd);
      setBusy(false)
      window.location.reload()
    } catch (err) {
      alert(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="bg-ink-800 border border-white/5 rounded-2xl p-6 shadow-xl animate-fade-in">
      <h2 className="text-xl font-display font-bold text-white mb-6">Profil Sozlamalari</h2>
      <form onSubmit={submit} className="flex flex-col gap-6">
        
        <div className="bg-ink-900/60 p-5 rounded-xl border border-white/5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-medium text-white">Profil faolligi (Status)</p>
              <p className="text-xs text-white/40 mt-1">Ishni vaqtinchalik to'xtatish uchun o'chiring</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.is_active} 
                onChange={(e) => setForm({...form, is_active: e.target.checked})} 
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ink-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
            </label>
          </div>

          {!form.is_active && (
            <div className="animate-fade-in border-t border-white/5 pt-4">
              <label className="text-xs text-white/60 mb-2 block">Tanaffus sababini tanlang:</label>
              <select 
                className="input-dark text-sm" 
                value={form.unavailable_reason} 
                onChange={update('unavailable_reason')}
              >
                <option value="Dam olishdaman">Dam olishdaman (Ta'til)</option>
                <option value="Kasal bo'lib qoldim">Sog'ligim yomonlashdi</option>
                <option value="Ishlarim ko'payib ketdi">Boshqa ishlarim ko'payib ketdi</option>
                <option value="Boshqa sabab">Boshqa sabab</option>
              </select>
              <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                <Info size={12}/> Agar profil uzoq vaqt nofaol bo'lsa (14 kun), tizim uni avtomatik bloklashi mumkin.
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm text-white/70 mb-1.5 block">Haftalik buyurtmalar limiti (Eng kamida 5 ta)</label>
          <input 
            type="number" 
            min="5" 
            className="input-dark font-medium" 
            value={form.weekly_limit} 
            onChange={update('weekly_limit')} 
            required
          />
          <p className="text-[10px] text-white/40 mt-1">Belgilangan limit to'lgach, mijozlar keyingi haftagacha buyurtma bera olmaydi.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 pt-4 border-t border-white/5">
          <div className="flex-1">
            <label className="text-sm text-white/70 mb-1.5 block">Orqa fon (Cover)</label>
            <label className="relative flex items-center justify-center h-28 rounded-xl border border-dashed border-white/20 bg-ink-900 cursor-pointer hover:border-gold-500/50 transition-colors overflow-hidden group">
              {(cover?.preview || profile?.cover) ? (
                <img src={cover?.preview || fileUrl(profile.cover)} alt="Cover" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
              ) : (
                <ImageIcon size={24} className="text-white/30" />
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile(setCover)} />
            </label>
          </div>
          <div className="shrink-0 flex sm:block gap-4">
            <div className="flex-1 sm:flex-none">
              <label className="text-sm text-white/70 mb-1.5 block">Avatar</label>
              <label className="relative flex items-center justify-center w-28 h-28 rounded-full border border-dashed border-white/20 bg-ink-900 cursor-pointer hover:border-gold-500/50 transition-colors overflow-hidden group">
                {(avatar?.preview || profile?.avatar) ? (
                  <img src={avatar?.preview || fileUrl(profile.avatar)} alt="Avatar" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                ) : (
                  <Camera size={24} className="text-white/30" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile(setAvatar)} />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-white/5">
          <div>
            <label className="text-sm text-white/70 mb-1.5 block">Video tabrik narxi (so'm)</label>
            <input 
              type="number" 
              className="input-dark" 
              value={form.price} 
              onChange={update('price')} 
              min="100000"
              max="5000000"
              required 
            />
          </div>
          <div>
            <label className="text-sm text-white/70 mb-1.5 block">Kategoriya</label>
            <select className="input-dark" value={form.category} onChange={update('category')}>
              {categories.filter(c => c.id !== 'all').map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm text-white/70 mb-1.5 block">O'zingiz haqingizda (Bio)</label>
          <textarea 
            className="input-dark min-h-[100px] resize-none" 
            value={form.bio} 
            onChange={update('bio')} 
            required 
          />
        </div>

        <div className="border-t border-white/5 pt-4">
          <p className="text-sm font-medium text-white mb-2">Ijtimoiy tarmoq havolalari</p>
          <div className="space-y-3">
             <p className="text-xs text-gold-400 bg-gold-500/10 p-3 rounded-xl border border-gold-500/20">
               Profiligiz qoidalarga binoan himoyalangan. Tarmoqlarni o'zgartira olmaysiz.
             </p>
             <input type="text" className="input-dark text-sm opacity-50 cursor-not-allowed" disabled value={profile?.telegram || ''} placeholder="Telegram kiritilmagan" />
             <input type="text" className="input-dark text-sm opacity-50 cursor-not-allowed" disabled value={profile?.instagram || ''} placeholder="Instagram kiritilmagan" />
             <input type="text" className="input-dark text-sm opacity-50 cursor-not-allowed" disabled value={profile?.youtube || ''} placeholder="YouTube kiritilmagan" />
          </div>
        </div>
                   
        <button type="submit" disabled={busy} className="btn-gold w-full mt-4 !py-3.5 disabled:opacity-50">
          {busy ? 'Saqlanmoqda...' : 'O\'zgarishlarni saqlash'}
        </button>
      </form>
    </div>
  )
}

/* ---------------- STAR: BUYURTMANI BEKOR QILISH MODALI ---------------- */
function RejectModal({ order, onClose, onRejected }) {
  const [reason, setReason] = useState("Matn juda noo'rin / so'kishlar bor")
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)

  const handleReject = async (e) => {
    e.preventDefault()
    
    if (reason === 'Boshqa sabab' && comment.trim().length < 5) {
       return alert("Iltimos, nima uchun murojaatni rad qilganingizni izohda to'liq va aniq tushuntiring!");
    }
    
    setBusy(true)
    try {
      const res = await api.rejectOrder(order.id, { reason, comment })
      onRejected(res.order)
      onClose()
    } catch (err) { 
      alert(err.message); 
      setBusy(false) 
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md card-surface rounded-2xl p-6 shadow-2xl border border-white/10 animate-fade-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-red-400 flex items-center gap-2">
            <ShieldAlert size={20} /> Buyurtmani rad etish
          </h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleReject} className="space-y-4">
          <select 
            className="input-dark text-sm" 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="Matn juda noo'rin / so'kishlar bor">Tabrik matnida noo'rin so'zlar bor</option>
            <option value="Talab bajarib bo'lmaydigan darajada">Talabni bajarib bo'lmaydi</option>
            <option value="Boshqa sabab">Boshqa sabab (Quyida yozing)</option>
          </select>
          <div className="relative">
            <textarea 
              className={`input-dark text-sm min-h-[80px] ${reason === 'Boshqa sabab' ? 'border-red-500/50' : ''}`} 
              placeholder="Sababni tushuntirib yozing..." 
              value={comment} 
              onChange={(e) => setComment(e.target.value)} 
            />
            {reason === 'Boshqa sabab' && (
              <p className="text-red-400 text-[10px] mt-1">Rad etish sababini aniq keltirishingiz majburiy!</p>
            )}
          </div>
          <button type="submit" disabled={busy} className="w-full bg-red-500 hover:bg-red-400 text-ink-950 font-bold py-3 rounded-xl text-sm transition-colors">
            {busy ? 'Yuborilmoqda...' : 'Rad etishni tasdiqlash'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ---------------- STAR: BUYURTMA KARTASI ---------------- */
function StarOrderCard({ order, onDelivered, onRejected }) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState('idle')
  const [rejectOpen, setRejectOpen] = useState(false)

  const handleFile = (e) => {
    const selected = e.target.files?.[0]
    if (selected) { 
      setFile(selected); 
      setPreviewUrl(URL.createObjectURL(selected)); 
    }
  }

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      // Videoni backend'ga yuborish
      await api.deliverOrder(order.id, formData);
      
      setStatus('success');
      setFile(null);
      setPreviewUrl(null);
      
      // Yulduzga tushunarli xabar beramiz
      alert("Video muvaffaqiyatli qabul qilindi! Va qayta ishlash jarayonida . Bu biroz vaqt olishi mumkin. Iltimos kutib turing !");
      
      // Xabarni o'qigach, sahifani 1 soniyadan keyin yangilaymiz
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error(error);
      setStatus('error');
      alert("Videoni yuborishda xatolik yuz berdi. Qaytadan urinib ko'ring.");
    }
  };

  return (
    <div className="bg-ink-800/60 rounded-2xl p-4 sm:p-5 border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {order.recipient_photo_url ? (
            <img 
              src={fileUrl(order.recipient_photo_url)} 
              className="w-12 h-12 rounded-full object-cover shrink-0" 
              alt="Recipient"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-ink-700 flex items-center justify-center text-white/50 text-lg shrink-0">
              {order.recipient_name?.[0]}
            </div>
          )}
          <div>
            <p className="font-display font-semibold text-white">
              {order.recipient_name} uchun
            </p>
            <p className="text-[11px] sm:text-xs text-white/40 mt-0.5">
              {order.occasion} • {formatPrice(order.price)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-gold-500/10 text-gold-400 px-2 py-1 rounded">
            Kutilmoqda
          </span>
          <button 
            onClick={() => setRejectOpen(true)} 
            className="text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded transition-colors"
          >
            Rad etish
          </button>
        </div>
      </div>
      
      <div className="bg-ink-900/50 p-3 sm:p-4 rounded-xl border border-white/5 mb-4 text-sm text-white/80">
        <p>{order.instructions}</p>
      </div>

      {!file ? (
        <label className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full py-5 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-gold-500/40 text-center transition-colors">
          <UploadCloud size={24} className="text-gold-400" />
          <div>
            <span className="text-sm font-medium text-white/80 block">Tayyor videoni tanlash</span>
            <span className="text-[11px] text-white/40 block mt-0.5">MP4, MOV, WEBM, MKV (Maks 50MB)</span>
          </div>
          <input type="file" accept="video/*" className="hidden" onChange={handleFile} />
        </label>
      ) : (
        <div className="bg-ink-900 p-3 sm:p-4 rounded-xl border border-gold-500/30">
          <div className="mb-3 w-full aspect-[9/16] sm:aspect-video max-h-[300px] bg-black rounded-lg relative overflow-hidden">
            <video 
              src={previewUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain" 
            />
            <button 
              onClick={() => {setFile(null); setPreviewUrl(null)}} 
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500/80 rounded-md text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <button 
            onClick={handleUpload} 
            disabled={status === 'uploading'} 
            className="btn-gold w-full !py-2.5 text-sm"
          >
            {status === 'uploading' ? 'Yuklanmoqda...' : 'Videoni yuborish'}
          </button>
        </div>
      )}

      {rejectOpen && (
        <RejectModal 
          order={order} 
          onClose={() => setRejectOpen(false)} 
          onRejected={onRejected} 
        />
      )}
    </div>
  )
}

/* ---------------- STAR DASHBOARD ---------------- */
function StarDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [reviews, setReviews] = useState([])
  
  const [tickets, setTickets] = useState([])
  const [supportCount, setSupportCount] = useState(0)

  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showAiModal, setShowAiModal] = useState(false)
  
  const [verifFile, setVerifFile] = useState(null)
  const [verifUploading, setVerifUploading] = useState(false)
  const [socials, setSocials] = useState({ telegram: '', instagram: '', youtube: '' })
  const [balance, setBalance] = useState({ balance: 0, frozen_balance: 0 })
  const [transactions, setTransactions] = useState([])
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawBusy, setWithdrawBusy] = useState(false)

  const loadData = () => {
    api.myOrders().then((res) => setOrders(res.orders)).catch(() => {})
    api.getTickets().then(res => {
      setTickets(res.tickets)
      setSupportCount(res.tickets.filter(t => t.status === 'answered').length)
    }).catch(() => {})
    api.getBalance().then(setBalance).catch(() => {})
    api.getTransactions().then((res) => setTransactions(res.transactions)).catch(() => {})
    
    api.getStar(user.id)
      .then((res) => { 
        if(res.star) {
          setProfile(normalizeStar(res.star))
          setSocials({
            telegram: res.star.telegram || '',
            instagram: res.star.instagram || '',
            youtube: res.star.youtube || ''
          })
        }
        if(res.reviews) setReviews(res.reviews) 
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData();
  }, [user.id])

  useEffect(() => {
    if (profile && profile.verification_status === 'idle') {
      setShowTermsModal(true);
    }
  }, [profile?.verification_status]);

  const handleUploadVerification = async () => {
    if (!socials.telegram.trim() && !socials.instagram.trim() && !socials.youtube.trim()) {
      return alert("Iltimos, kamida bitta ijtimoiy tarmoq havolasini kiriting (Firibgarlikni oldini olish uchun)!");
    }
    if (!verifFile) return alert("Iltimos, tasdiqlash videosini tanlang!");
    
    setVerifUploading(true);
    
    try {
      const videoFd = new FormData();
      videoFd.append('video', verifFile);
      videoFd.append('telegram', socials.telegram);
      videoFd.append('instagram', socials.instagram);
      videoFd.append('youtube', socials.youtube);
      
      await api.uploadVerification(videoFd);
      window.location.reload(); 
    } catch(e) { 
      alert(e.message); 
      setVerifUploading(false); 
    }
  };

  const handleWithdraw = async () => {
    const amountNum = parseInt(withdrawAmount, 10);
    if (!amountNum || amountNum <= 0) return alert("Iltimos, to'g'ri summa kiriting");
    if (amountNum > balance.balance) return alert("Balansingizda yetarli mablag' yo'q");

    setWithdrawBusy(true);
    try {
      await api.requestWithdrawal(amountNum);
      alert("So'rovingiz qabul qilindi, ma'muriyat tez orada ko'rib chiqadi.");
      setWithdrawAmount('');
      loadData();
    } catch (e) {
      alert(e.message);
    } finally {
      setWithdrawBusy(false);
    }
  };

  if (user?.is_banned) {
    return (
      <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center px-5 text-center">
        <div className="bg-red-500/10 p-8 rounded-full mb-6 border border-red-500/20">
          <Ban size={64} className="text-red-500 shadow-xl" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-3">Hisobingiz bloklangan</h1>
        <p className="text-white/60 max-w-md mx-auto mb-8 leading-relaxed">
          Platforma qoidalari buzilganligi yoki uzoq vaqt nofaol bo'lganingiz sababli hisobingiz vaqtinchalik cheklab qo'yildi.
        </p>
        <a href="https://t.me/vido_admin" target="_blank" rel="noreferrer" className="btn-outline flex items-center gap-2">
          <Headset size={18} /> Ma'muriyat bilan bog'lanish
        </a>
      </div>
    )
  }

  const delivered = orders.filter((o) => o.status === 'delivered')
  const pending = orders.filter((o) => o.status === 'pending')

  let daysLeft = null;
  let isDanger = false;
  if (profile?.is_active === false && profile?.inactive_since) {
    const inactiveDate = new Date(profile.inactive_since);
    const banDeadline = new Date(inactiveDate.getTime() + 14 * 24 * 60 * 60 * 1000); 
    const diff = banDeadline - new Date();
    daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    isDanger = daysLeft <= 7;
  }

  return (
    <>
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] bg-ink-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-ink-800 border border-gold-500/30 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-up">
            <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center text-gold-500 mb-6 mx-auto">
              <FileWarning size={32} />
            </div>
            <h2 className="text-2xl font-display font-bold text-white text-center mb-4">Platforma Qoidalari</h2>
            <p className="text-sm text-white/70 mb-4 text-center">
              VIDO platformasida firibgarliklarga (boshqa inson nomidan akkaunt ochish) mutlaqo yo'l qo'yilmaydi.
            </p>
            <div className="bg-ink-900/50 p-4 rounded-xl border border-white/5 space-y-3 mb-6">
              <p className="text-sm text-white/80 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> 
                Profilingizni faollashtirish uchun o'zingizni shaxsan videoga olib jo'natishingiz majburiy.
              </p>
              <p className="text-sm text-white/80 flex items-start gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" /> 
                Ijtimoiy tarmoq havolalaringizni kiritishinizni so'raymiz . Tasdiqlashdan so'ng ular qulflanadi , Ularni o'zgartira olmaysiz!
              </p>
            </div>
            <button onClick={() => setShowTermsModal(false)} className="btn-gold w-full !py-3.5">
              Tushundim va Qabul Qilaman
            </button>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in">
           <button onClick={() => setShowAiModal(false)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white/60 hover:text-white">
              <X size={24} />
           </button>
           <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Bot className="text-gold-500"/> Namuna video</h4>
           <div className="aspect-[9/16] w-full max-w-[280px] bg-ink-900 rounded-2xl relative overflow-hidden flex items-center justify-center text-center px-6 border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-purple-900/20"></div>
              <Play size={56} className="text-white/20 absolute" />
              <p className="text-white/90 text-sm font-medium relative z-10 leading-relaxed drop-shadow-lg">
                "Men Alisher, taxallusim @alisher_off. Men VIDO platformasiga qo'shilmoqchiman."
              </p>
           </div>
        </div>
      )}

      <StarLayout active={tab} onSelect={setTab} supportCount={supportCount}>
        
        {profile && !profile.verified && (
          <div className="mb-6 sm:mb-8 animate-fade-in">
            {profile.verification_status === 'pending' ? (
              <div className="bg-ink-800 rounded-3xl p-8 border border-gold-500/20 shadow-lg text-center">
                <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-white mb-2">Ma'muriyat tekshirmoqda...</h3>
                <p className="text-white/60 text-sm max-w-sm mx-auto">Sizning so'rovingiz yuborilgan. Tez orada ma'muriyat uni ko'rib chiqib ruxsat beradi. Iltimos kuting.</p>
              </div>
            ) : (
              <div className="bg-ink-800 sm:rounded-3xl rounded-2xl border border-gold-500/20 shadow-xl overflow-hidden relative">
                
                <div className="bg-gradient-to-r from-gold-500/10 to-neon-purple/10 px-5 sm:px-8 py-6 border-b border-white/5">
                  <h3 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2">
                    {profile.verification_status === 'rejected' ? <><AlertCircle className="text-red-400" /> <span className="text-red-400">Tasdiqlash rad etildi</span></> : "Profilingizni tasdiqlang"}
                  </h3>
                  <p className="text-sm text-white/60 mt-2 max-w-2xl">Platformada to'laqonli ishlash va buyurtmalar qabul qilish uchun quyidagi 2 ta bosqichni bajaring.</p>
                </div>

                <div className="p-4 sm:p-8">
                  {profile.verification_status === 'rejected' && (
                    <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 mb-6">
                      <p className="text-sm font-bold text-red-400 mb-1">Ma'muriyat izohi:</p>
                      <p className="text-sm text-red-200">{profile.verification_message}</p>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                    <div className="flex-1 space-y-6">

                      <div className="relative p-5 sm:p-6 bg-ink-900 rounded-2xl border border-white/5 shadow-inner">
                        <span className="absolute -top-3 left-4 bg-ink-950 border border-gold-500/30 text-gold-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">1-Qadam</span>
                        <h4 className="text-white font-medium mb-2 mt-2 text-sm flex items-center justify-between">
                          Ijtimoiy tarmoqlar
                          <span className="bg-red-500/20 text-red-400 text-[9px] px-2 py-0.5 rounded uppercase">Majburiy</span>
                        </h4>
                        <p className="text-xs text-white/50 mb-4 leading-relaxed">
                          Sizni tezroq tasdiqlashimiz va firibgarlikning oldini olish uchun shaxsiy sahifalaringizni kiriting. <b className="text-white/80">Keyin ularni o'zgartirib bo'lmaydi!</b>
                        </p>
                        <div className="space-y-3">
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><Send size={16}/></div>
                            <input type="text" className="w-full bg-ink-950 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-gold-500/50 transition-colors" placeholder="Telegram (@username)" value={socials.telegram} onChange={(e) => setSocials({...socials, telegram: e.target.value})} />
                          </div>
                          <div className="relative">
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><AtSign size={16}/></div>
                             <input type="text" className="w-full bg-ink-950 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-gold-500/50 transition-colors" placeholder="Instagram (profil havolasi)" value={socials.instagram} onChange={(e) => setSocials({...socials, instagram: e.target.value})} />
                          </div>
                          <div className="relative">
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"><Tv size={16}/></div>
                             <input type="text" className="w-full bg-ink-950 border border-white/5 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-gold-500/50 transition-colors" placeholder="YouTube (kanal havolasi)" value={socials.youtube} onChange={(e) => setSocials({...socials, youtube: e.target.value})} />
                          </div>
                        </div>
                      </div>

                      <div className="relative p-5 sm:p-6 bg-ink-900 rounded-2xl border border-white/5 shadow-inner">
                        <span className="absolute -top-3 left-4 bg-ink-950 border border-gold-500/30 text-gold-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">2-Qadam</span>
                        <h4 className="text-white font-medium mb-2 mt-2 text-sm flex items-center justify-between">
                          Tasdiqlash videosi
                          <span className="bg-red-500/20 text-red-400 text-[9px] px-2 py-0.5 rounded uppercase">Majburiy</span>
                        </h4>
                        <p className="text-xs text-white/50 mb-3 leading-relaxed">
                          Kameraga yuzingizni to'g'ri qilib, quyidagi matnni aniq o'qib bering:
                        </p>
                        
                        <div className="bg-ink-950 p-4 rounded-xl border-l-4 border-gold-500 mb-4 shadow-md relative overflow-hidden">
                          <p className="font-medium text-gold-400 text-sm sm:text-base italic leading-relaxed">
                            "Men {user?.name}, ijtimoiy tarmoqlardagi taxallusim {socials.telegram || socials.instagram || "@taxallus"}. Men VIDO platformasiga qo'shilmoqchiman."
                          </p>
                        </div>

                        <button onClick={() => setShowAiModal(true)} className="lg:hidden w-full flex items-center justify-center gap-2 bg-ink-950 border border-white/5 text-white/70 hover:text-white px-4 py-3 rounded-xl text-sm mb-4 transition-colors">
                          <Bot size={16} className="text-gold-500" /> Namunani ko'rish (Sun'iy Intellekt)
                        </button>
                        
                        <label className={`flex flex-col items-center justify-center gap-3 bg-ink-950 hover:bg-ink-900 border ${verifFile ? 'border-emerald-500/50' : 'border-dashed border-white/10 hover:border-gold-500/50'} rounded-xl px-4 py-8 cursor-pointer transition-all text-center w-full shadow-inner`}>
                          {verifFile ? (
                            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-1">
                              <CheckCircle2 size={24} />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-white/5 text-white/30 rounded-full flex items-center justify-center mb-1">
                              <Camera size={24} />
                            </div>
                          )}
                          <span className={`text-sm font-bold truncate block px-2 ${verifFile ? "text-emerald-400" : "text-white/80"}`}>
                            {verifFile ? verifFile.name : "Kameraga olingan videoni tanlash"}
                          </span>
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">{verifFile ? "Almashtirish uchun bosing" : "Faqat MP4, MOV formatlar"}</span>
                          <input type="file" accept="video/*" className="hidden" onChange={(e) => setVerifFile(e.target.files[0])} />
                        </label>
                      </div>

                    </div>

                    <div className="hidden lg:block w-72 shrink-0 bg-ink-900 rounded-2xl border border-white/5 p-4 shadow-inner">
                       <div className="flex items-center gap-2 mb-3">
                         <Bot size={18} className="text-gold-500" />
                         <h4 className="text-sm font-bold text-white uppercase tracking-wider">Namuna video</h4>
                       </div>
                       <p className="text-[10px] text-white/40 mb-4">Sun'iy intellekt orqali yaratilgan namuna.</p>
                       <div className="aspect-[9/16] bg-black rounded-xl relative overflow-hidden flex items-center justify-center text-center px-4 border border-white/5 group">
                          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-purple-900/20"></div>
                          <Play size={48} className="text-white/20 absolute group-hover:text-gold-500/50 transition-colors" />
                          <p className="text-white/80 text-xs font-medium relative z-10 leading-relaxed drop-shadow-md">
                            "Men Alisher, taxallusim @alisher_off. Men VIDO platformasiga qo'shilmoqchiman."
                          </p>
                       </div>
                    </div>

                  </div>

                  <div className="mt-8 sticky bottom-4 z-30 lg:static">
                    <button 
                      onClick={handleUploadVerification} 
                      disabled={verifUploading} 
                      className="btn-gold w-full !py-4 text-base font-bold shadow-[0_10px_30px_rgba(251,191,36,0.2)] disabled:opacity-50 disabled:shadow-none uppercase tracking-wide"
                    >
                      {verifUploading ? "Yuborilmoqda..." : "So'rovni Yuborish"}
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        <div className="w-full h-32 sm:h-48 rounded-2xl overflow-hidden relative mb-8 border border-white/10 shadow-lg bg-ink-800">
          {profile?.cover ? (
            <img 
              src={fileUrl(profile.cover)} 
              alt="Banner" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-ink-800 to-ink-900 flex items-center justify-center">
               <ImageIcon className="text-white/10" size={64} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-6 flex items-center gap-3 sm:gap-4">
            {profile?.avatar || user?.avatar ? (
              <img 
                src={fileUrl(profile?.avatar || user?.avatar)} 
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 sm:border-4 border-ink-900 object-cover bg-ink-800" 
                alt="Avatar"
              />
            ) : (
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-ink-800 border-2 sm:border-4 border-ink-900 text-white text-2xl font-bold flex items-center justify-center">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-3xl font-display font-bold text-white drop-shadow-md">
                  {user?.name}
                </h1>
                
                {profile?.is_active === false && (
                  <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${isDanger ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gold-500/20 text-gold-400 border-gold-500/30'}`}>
                    <Timer size={12} /> Tanaffusda {daysLeft !== null && `(Bloklanishga: ${daysLeft} kun)`}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-sm text-white/50 mt-0.5 font-medium">
                Limit: {profile?.this_week_orders || 0} / {profile?.weekly_limit || 5} (Shu hafta)
              </p>
            </div>
          </div>
        </div>

        {tab === 'settings' ? (
          <StarSettingsTab profile={profile} />
        ) : tab === 'support' ? (
          <SupportTab orders={orders} tickets={tickets} onTicketRead={loadData} /> 
        ) : tab === 'reviews' ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h2 className="font-display font-semibold text-white/80 flex items-center gap-2 mb-2 text-base">
              <StarIcon size={18} className="text-gold-400" /> Mijozlar sharhlari
            </h2>
            {reviews.length === 0 ? (
              <p className="text-white/40 text-sm bg-ink-800 py-10 text-center rounded-2xl border border-white/5">
                Sizga hali sharh yozilmagan.
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-ink-800/60 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} size={14} className={i < r.rating ? "fill-gold-400 text-gold-400" : "text-white/10"} />
                        ))}
                      </div>
                      <span className="text-[10px] text-white/30">{new Date(r.created_at).toLocaleDateString('uz-UZ')}</span>
                    </div>
                    <p className="text-sm text-white/80 italic leading-relaxed">"{r.text}"</p>
                    <p className="text-xs font-medium text-neon-cyan mt-4">{r.client_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'earnings' ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h2 className="font-display font-semibold text-white/80 flex items-center gap-2 mb-2 text-base">
              <Wallet size={18} className="text-gold-400" /> Balans va daromadlar
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-ink-800 p-5 sm:p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
                <p className="text-white/50 text-xs mb-2 relative z-10">Yechib olish mumkin</p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-neon-cyan relative z-10 drop-shadow-md">
                  {formatPrice(balance.balance || 0)}
                </h3>
              </div>
              <div className="bg-ink-800 p-5 sm:p-6 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden">
                <p className="text-white/50 text-xs mb-2 relative z-10 flex items-center gap-1">
                  <Clock size={11} /> Eskrovda (muzlatilgan)
                </p>
                <h3 className="text-2xl sm:text-3xl font-display font-bold text-gold-400 relative z-10 drop-shadow-md">
                  {formatPrice(orders.filter(o => o.payment_status === 'held').reduce((s, o) => s + parseFloat(o.price || 0), 0))}
                </h3>
              </div>
            </div>

            <p className="text-[11px] text-white/40 -mt-1 px-1">
              Eskrovdagi mablag' — video yetkazilgandan 24 soat o'tib, mijozdan shikoyat kelmasa, avtomatik ravishda "Yechib olish mumkin" balansiga qo'shiladi (platforma komissiyasi ushlab qolinadi).
            </p>

            <div className="bg-ink-800 p-5 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <input
                type="number"
                min="1"
                className="input-dark flex-1"
                placeholder="Yechib olish summasi (so'm)"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <button
                disabled={withdrawBusy || !withdrawAmount}
                onClick={handleWithdraw}
                className="btn-gold shrink-0 disabled:opacity-30"
              >
                {withdrawBusy ? 'Yuborilmoqda...' : "Yechib olish"}
              </button>
            </div>
            <p className="text-[10px] text-white/30 px-1">
              Hozircha to'lov provayderi ulanmagani sababli, so'rovingiz ma'muriyat tomonidan qo'lda ko'rib chiqiladi va tashqi hisobingizga o'tkaziladi.
            </p>

            <h3 className="font-display font-semibold text-white/80 text-sm mt-3">Tranzaksiyalar tarixi</h3>
            {transactions.length === 0 ? (
               <p className="text-white/40 text-sm bg-ink-800 py-10 text-center rounded-2xl border border-white/5">Hali tranzaksiya mavjud emas.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map(t => (
                  <div key={t.id} className="bg-ink-900/50 p-4 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'withdrawal' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {t.type === 'withdrawal' ? <ArrowUpRight size={18} /> : <CheckCircle2 size={18} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {t.type === 'escrow_release' ? "Buyurtma to'lovi" : t.type === 'withdrawal' ? "Pul yechib olish" : t.type}
                        </p>
                        <p className="text-[11px] text-white/40 mt-0.5">
                          {new Date(t.created_at).toLocaleDateString('uz-UZ')} · {t.status === 'pending' ? 'Kutilmoqda' : t.status === 'success' ? 'Yakunlandi' : 'Bekor qilindi'}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${t.type === 'withdrawal' ? 'text-red-400' : 'text-neon-cyan'}`}>
                      {t.type === 'withdrawal' ? '-' : '+'}{formatPrice(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2 sm:gap-6 mb-8">
              <div className="card-surface p-3 sm:p-5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                <p className="text-xl sm:text-3xl font-display font-bold text-white">{delivered.length}</p>
                <p className="text-[10px] sm:text-sm text-white/40 mt-1">Bajarilgan</p>
              </div>
              <div className="card-surface p-3 sm:p-5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                <p className="text-xl sm:text-3xl font-display font-bold text-gold-400">{pending.length}</p>
                <p className="text-[10px] sm:text-sm text-white/40 mt-1">Kutilmoqda</p>
              </div>
              <div className="card-surface p-3 sm:p-5 rounded-xl border border-white/5 flex flex-col items-center text-center">
                <p className="text-sm sm:text-xl font-display font-bold text-neon-cyan truncate max-w-full">
                  {formatPrice(balance.balance || 0)}
                </p>
                <p className="text-[10px] sm:text-sm text-white/40 mt-1">Balans</p>
              </div>
            </div>

            {loading ? (
              <p className="text-white/30 text-center py-10">Yuklanmoqda...</p>
            ) : tab === 'uploads' ? (
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                 {delivered.map(v => (
                   <div key={v.id} className="aspect-[9/16] bg-ink-800 rounded-xl relative overflow-hidden">
                     <img src={fileUrl(v.recipient_photo_url)} className="w-full h-full object-cover" alt="Recipient" />
                   </div>
                 ))}
                 {delivered.length === 0 && (
                   <p className="col-span-full text-center text-white/40 py-10">
                     Hali videolar mavjud emas.
                   </p>
                 )}
               </div>
            ) : (
              <div className="flex flex-col gap-4">
                <h2 className="font-display font-semibold text-white/80 flex items-center gap-2 mb-2 text-base">
                  <InboxIcon size={18} className="text-gold-400" /> Yangi buyurtmalar
                </h2>
                {pending.length === 0 && (
                  <p className="text-white/40 text-sm bg-ink-800 py-10 text-center rounded-2xl border border-white/5">
                    Hozircha yangi buyurtma yo'q.
                  </p>
                )}
                <div className="grid lg:grid-cols-2 gap-4">
                  {pending.map((o) => (
                    <StarOrderCard 
                      key={o.id} 
                      order={o} 
                      onDelivered={() => loadData()} 
                      onRejected={() => loadData()} 
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </StarLayout>
    </>
  )
}

/* ---------------- CLIENT DASHBOARD ---------------- */
function ClientOrderCard({ order, onPlay, onAppeal, tickets = [] }) {
  const [rateOpen, setRateOpen] = useState(false)
  // TUZATILDI: avval bu doim `false`dan boshlanardi, shuning uchun mijoz
  // sharh qoldirgandan keyin sahifani yangilasa "Baholash" tugmasi qayta
  // chiqardi. Endi backend'dan kelgan `order.reviewed` bilan boshlanadi.
  const [reviewed, setReviewed] = useState(!!order.reviewed)
  const [appealed, setAppealed] = useState(false) 
  const [disputed, setDisputed] = useState(!!order.client_disputed)
  const [disputing, setDisputing] = useState(false)

  const isDelivered = order.status === 'delivered'
  const isRejected = order.status === 'rejected'

  // Video yetkazilgandan 24 soat o'tmagan bo'lsa, shikoyat qilish tugmasi ko'rinadi
  const hoursSinceDelivery = order.delivered_at ? (Date.now() - new Date(order.delivered_at).getTime()) / 3_600_000 : Infinity
  const canDispute = isDelivered && !disputed && order.payment_status === 'held' && hoursSinceDelivery <= 24

  const handleDispute = async () => {
    const comment = prompt("Videoning nimasi noto'g'ri ekanini qisqacha yozing:");
    if (comment === null) return; // bekor qilindi
    setDisputing(true);
    try {
      await api.disputeOrder(order.id, { comment });
      setDisputed(true);
      alert("Shikoyatingiz qabul qilindi. Ma'muriyat 24 soat ichida ko'rib chiqadi.");
    } catch (err) {
      alert(err.message);
    } finally {
      setDisputing(false);
    }
  };

  // Ariza avvalroq jo'natilganligini aniqlaymiz
  const hasAppealed = tickets.some(t => t.subject.includes(`#${order.id}`));

  return (
    <div className="flex flex-col gap-2 sm:gap-3 group">
      <div className="aspect-[9/16] rounded-xl sm:rounded-2xl overflow-hidden bg-ink-800 border border-white/5 relative flex items-center justify-center shadow-lg group-hover:border-white/20 transition-colors">
        {isDelivered && order.video_url ? (
          <>
            <video 
              src={fileUrl(order.video_url)} // <-- SHU YERI TO'G'RILANDI
              className="w-full h-full object-cover" 
              preload="metadata"
            />
            <div 
              className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20" 
              onClick={onPlay}
            >
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:scale-110 transition-transform">
                <Play size={24} fill="currentColor" className="ml-1" />
              </div>
            </div>
          </>
        ) : isRejected ? (
          <div className="p-4 text-center">
            <Ban size={32} className="mx-auto text-red-400 mb-2" />
            <p className="text-xs font-bold text-red-400 mt-2">Rad etildi</p>
          </div>
        ) : order.recipient_photo_url ? (
          <img 
            src={fileUrl(order.recipient_photo_url)} 
            alt="Recipient" 
            className="w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all" 
          />
        ) : (
          <Film size={28} className="text-white/10" />
        )}
                 
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
          {isDelivered ? (
            <span className="flex items-center gap-1 bg-neon-cyan/90 backdrop-blur text-ink-950 text-[9px] sm:text-xs font-bold px-1.5 py-1 rounded shadow-sm">
              <CheckCircle2 size={10} /> Tayyor
            </span>
          ) : isRejected ? (
            <span className="flex items-center gap-1 bg-red-500/90 backdrop-blur text-white text-[9px] sm:text-xs font-bold px-1.5 py-1 rounded shadow-sm">
              <Ban size={10} /> Bekor qilingan
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-gold-500/90 backdrop-blur text-ink-950 text-[9px] sm:text-xs font-bold px-1.5 py-1 rounded shadow-sm">
              <Clock size={10} /> Kutilmoqda
            </span>
          )}
        </div>

        {isDelivered && order.qr_value && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 scale-[0.6] sm:scale-75 origin-top-right opacity-80 hover:opacity-100 transition-opacity drop-shadow-md">
            <QRGenerator value={order.qr_value} size={48} label={false} />
          </div>
        )}
      </div>

      <div className="flex flex-col px-1">
        <h3 className="font-display font-semibold text-white text-xs sm:text-sm leading-snug line-clamp-2">
          <span className="text-white/60 font-normal">Yulduz </span>
          {order.star_name} 
          <span className="text-white/60 font-normal"> dan </span> 
          {order.recipient_name}
        </h3>
        
        {isRejected ? (
          <p className="text-[9px] sm:text-[11px] text-red-400 mt-1 line-clamp-1">
            Sabab: {order.rejection_reason}
          </p>
        ) : (
          <p className="text-[9px] sm:text-[11px] text-white/50 mt-1">
            {order.occasion} • {new Date(order.created_at).toLocaleDateString('uz-UZ')}
          </p>
        )}
                 
        {isDelivered && (
          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3">
            <button 
              onClick={async (e) => {
                e.preventDefault();
                try {
                  const btn = e.currentTarget;
                  const originalText = btn.innerHTML;
                  btn.innerHTML = '<span class="animate-pulse">Kuting...</span>';
                  btn.disabled = true;

                  // Orqa fonda qonuniy so'rov orqali videoni yuklab olamiz
                  const response = await fetch(fileUrl(order.video_url));
                  if (!response.ok) throw new Error("Yuklashda xatolik");
                  
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  
                  // Avtomatik saqlash mexanizmi
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = `VIDO_tabrik_${order.id}.mp4`;
                  document.body.appendChild(a);
                  a.click();
                  
                  // Xotirani tozalash
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  
                  btn.innerHTML = originalText;
                  btn.disabled = false;
                } catch (err) {
                  alert("Videoni yuklab olishda xatolik yuz berdi!");
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] sm:text-xs font-medium py-1.5 sm:py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={12} /> Yuklash
            </button>
            {!reviewed ? (
              <button 
                onClick={() => setRateOpen(true)} 
                className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 text-[10px] sm:text-xs font-medium py-1.5 sm:py-2 rounded-lg transition-colors"
              >
                <StarIcon size={12} /> Baholash
              </button>
            ) : (
              <span className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-neon-cyan py-1.5 sm:py-2 bg-neon-cyan/5 rounded-lg border border-neon-cyan/10">
                <CheckCircle2 size={12} /> Baholandi
              </span>
            )}
          </div>
        )}

        {(canDispute || disputed) && (
          <button
            disabled={disputing || disputed}
            onClick={handleDispute}
            className={`flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-medium py-1.5 sm:py-2 rounded-lg transition-colors mt-2 ${
              disputed ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
            }`}
          >
            {disputed ? (
              <><CheckCircle2 size={12} /> Shikoyat yuborilgan — ko'rib chiqilmoqda</>
            ) : (
              <><ShieldAlert size={12} /> Video sifatidan shikoyat qilish</>
            )}
          </button>
        )}

        {/* ARIZA FAQAT BIR MARTA YUBORILISHI UCHUN */}
        {isRejected && !reviewed && (
          <button 
            disabled={appealed || hasAppealed}
            onClick={() => {
               onAppeal(order, () => setAppealed(true))
            }} 
            className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] sm:text-xs font-medium py-1.5 sm:py-2 rounded-lg transition-colors mt-2 ${
               appealed || hasAppealed ? 'bg-white/5 text-white/40 cursor-not-allowed' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
            }`}
          >
            {appealed || hasAppealed ? (
               <><CheckCircle2 size={12} /> Ariza yuborilgan</>
            ) : (
               <><ShieldAlert size={12} /> Nohaq rad etildi</>
            )}
          </button>
        )}
      </div>

      {rateOpen && (
        <RatingModal 
          starName={order.star_name} 
          onClose={() => setRateOpen(false)} 
          onSubmit={async ({ rating, text }) => { 
            try { 
              await api.submitReview({ orderId: order.id, rating, text }); 
              setReviewed(true);
              setRateOpen(false); // <-- SHU QATOR QO'SHILDI (oynani yopadi)
            } catch (err) { 
              alert(err.message);
            } 
          }} 
        />
      )}
    </div>
  )
}

function ClientDashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [showSupport, setShowSupport] = useState(false) 

  // MIJOZ YORDAM BO'LIMI UCHUN
  const [tickets, setTickets] = useState([]);
  const [supportCount, setSupportCount] = useState(0);

  const loadData = () => {
    api.myOrders().then(res => setOrders(res.orders)).finally(() => setLoading(false));
    api.getTickets().then(res => {
      setTickets(res.tickets);
      setSupportCount(res.tickets.filter(t => t.status === 'answered').length);
    }).catch(() => {})
  };

  useEffect(() => { 
     loadData();
  }, [])

  const handleAppeal = async (order, onSuccess) => {
    if (!window.confirm("Rad etish sababidan norozimisiz? Ma'muriyatga shikoyat yuboramizmi?")) return;
    try {
      await api.createTicket({
        subject: `Nohaq rad etilgan buyurtma: #${order.id}`,
        message: `Mening ${order.star_name} ga bergan buyurtmam nohaq rad etildi. Sabab: ${order.rejection_reason}. Iltimos, ko'rib chiqing.`
      });
      alert("Shikoyatingiz ma'muriyatga yuborildi. Yordam bo'limidan kuzatishingiz mumkin.");
      if (onSuccess) onSuccess(); 
      loadData();
      setShowSupport(true);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 pb-[80px] md:pb-0">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        
        {showSupport ? (
          <div className="animate-fade-in">
            <button onClick={() => setShowSupport(false)} className="flex items-center gap-2 text-white/50 hover:text-white mb-4 transition-colors">
              <ArrowLeft size={16} /> Dashboard'ga qaytish
            </button>
            <SupportTab orders={orders} tickets={tickets} onTicketRead={loadData} />
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 mb-6 sm:mb-8 bg-ink-800 border border-white/5 p-4 sm:p-5 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-3 sm:gap-4">
                {user?.avatar ? (
                  <img 
                    src={fileUrl(user.avatar)} 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-ink-900 border border-gold-500/30 shrink-0" 
                    alt="Avatar"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-gold-500 to-neon-purple flex items-center justify-center text-ink-950 font-display font-bold text-lg sm:text-xl shrink-0">
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-lg sm:text-xl font-display font-bold text-white leading-tight">
                    Salom, {user?.name}
                  </h1>
                  <p className="text-white/40 text-[10px] sm:text-xs mt-0.5">
                    Shaxsiy videolaringiz arxivi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSupport(true)} 
                  className="relative bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm flex items-center gap-2 transition-colors"
                >
                  <Headset size={16} /> Yordam
                  {supportCount > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-md">
                       {supportCount}
                     </span>
                  )}
                </button>
                <Link 
                  to="/browse/all" 
                  className="btn-gold !py-2 !px-4 sm:!py-2.5 sm:!px-5 text-xs sm:text-sm whitespace-nowrap shadow-gold flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Yangi buyurtma
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <span className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 sm:py-16 text-center bg-ink-800/30 rounded-2xl border border-white/5 border-dashed px-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-ink-800 flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <Film size={24} className="text-white/20" />
                </div>
                <p className="text-white/80 font-medium text-base sm:text-lg">Sizda hali buyurtmalar yo'q</p>
                <p className="text-white/40 text-xs sm:text-sm mt-1 max-w-xs mx-auto">
                  Sevimli yulduzingizdan o'zingiz yoki yaqinlaringiz uchun tabrik buyurtma qiling.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                {orders.map((o) => (
                  <ClientOrderCard key={o.id} order={o} onPlay={() => setSelectedVideo(o)} onAppeal={handleAppeal} tickets={tickets} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MOBIL PASTKI NAVIGATSIYA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-ink-950/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center px-4 py-3">
          <button
            onClick={() => { setShowSupport(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="relative p-1 flex flex-col items-center justify-center gap-1"
          >
            <div className={`transition-all duration-300 ${!showSupport ? 'scale-110 text-white' : 'text-white/40'}`}>
              <InboxIcon size={24} strokeWidth={!showSupport ? 2.5 : 2} fill={!showSupport ? 'currentColor' : 'none'} />
            </div>
            <span className={`w-1 h-1 rounded-full transition-all duration-300 ${!showSupport ? 'bg-gold-500' : 'bg-transparent'}`}></span>
          </button>
          <Link
            to="/browse/all"
            className="relative p-1 flex flex-col items-center justify-center gap-1"
          >
            <div className="text-white/40 transition-all duration-300">
              <StarIcon size={24} strokeWidth={2} />
            </div>
          </Link>
          <Link
            to="/browse/all"
            className="relative p-1 flex flex-col items-center justify-center gap-1"
          >
            <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center text-ink-950 shadow-gold">
              <Plus size={22} strokeWidth={2.5} />
            </div>
          </Link>
          <button
            onClick={() => { setShowSupport(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="relative p-1 flex flex-col items-center justify-center gap-1"
          >
            <div className={`transition-all duration-300 ${showSupport ? 'scale-110 text-white' : 'text-white/40'}`}>
              <Headset size={24} strokeWidth={showSupport ? 2.5 : 2} />
            </div>
            {supportCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 border border-ink-950 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-md">
                {supportCount}
              </span>
            )}
            <span className={`w-1 h-1 rounded-full transition-all duration-300 ${showSupport ? 'bg-gold-500' : 'bg-transparent'}`}></span>
          </button>
        </div>
      </div>

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
              autoPlay 
              className="w-full h-full object-contain" 
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pointer-events-none">
               <p className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">
                 {selectedVideo.occasion}
               </p>
               <h3 className="text-white font-display font-bold text-xl">
                 {selectedVideo.star_name}dan {selectedVideo.recipient_name} uchun
               </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- ROOT ---------------- */
export default function Dashboard() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <p className="text-center text-white/30 py-24">Yuklanmoqda...</p>
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  return user.role === 'star' ? <StarDashboard /> : <ClientDashboard />
}