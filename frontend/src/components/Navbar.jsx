import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Menu, X, LogOut, LayoutDashboard, Bell } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { api, fileUrl } from '../api'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 shrink-0 group">
      <span className="font-display font-extrabold text-2xl tracking-tight bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent glow-text-gold">
        V I D
      </span>
      <span className="relative flex items-center justify-center w-6 h-6 rounded-full border-2 border-neon-cyan text-neon-cyan glow-text-cyan transition-transform duration-300 group-hover:scale-110" style={{ boxShadow: '0 0 14px rgba(63,224,224,0.55)' }}>
        <span className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[8px] border-l-neon-cyan ml-0.5" />
      </span>
    </Link>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [notifications, setNotifications] = useState([])
  const [showNotif, setShowNotif] = useState(false)
  
  // YANGI: Menyuni tashqariga bosilganda yopish uchun Ref'lar
  const notifRefDesktop = useRef(null)
  const notifRefMobile = useRef(null)

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(res => setNotifications(res.notifications || []))
        .catch(err => console.log("Xabarlarni yuklashda xatolik", err))
    }
  }, [user])

  // YANGI MANTIQ: Tashqariga bosilganda ochiq menyuni yopish
  useEffect(() => {
    function handleClickOutside(event) {
      if (showNotif) {
        const outsideDesktop = notifRefDesktop.current ? !notifRefDesktop.current.contains(event.target) : true;
        const outsideMobile = notifRefMobile.current ? !notifRefMobile.current.contains(event.target) : true;
        
        // Qaysi div bo'lmasin, ularning tashqarisiga bosilgan bo'lsa yopiladi
        if (outsideDesktop && outsideMobile) {
          setShowNotif(false);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotif]);

  const unreadCount = notifications.filter(n => !n.is_read).length

  const handleMarkAsRead = async (id) => {
    try {
      await api.markAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch (err) {
      console.log(err)
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/browse/all?q=${encodeURIComponent(searchQuery.trim())}`)
      setOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-ink-900/85 backdrop-blur-md border-b border-white/5 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 py-3 flex items-center justify-between gap-3">
        <Logo />
                 
        <div className="hidden md:flex items-center gap-1 flex-1 max-w-md mx-6">
          <div className="w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Yulduzni qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full bg-ink-800 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-white placeholder-white/35 outline-none focus:border-gold-500/60 transition-colors"
            />
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/70">
          <Link to="/" className="text-white hover:text-gold-500 transition-colors">Bosh sahifa</Link>
          <Link to="/browse/all" className="text-white hover:text-gold-500 transition-colors">Yulduzlar</Link>
          {user && user.role === 'admin' && (
            <Link to="/admin" className="text-gold-500 font-bold hover:text-gold-400 flex items-center gap-1 transition-colors">
                Boshqaruv
            </Link>
          )}
        </nav>

        {/* DESKTOP UCHUN TUGMALAR */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {user.role !== 'admin' && (
                <div className="relative" ref={notifRefDesktop}>
                  <button 
                    onClick={() => setShowNotif(!showNotif)}
                    className="relative p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-ink-900 animate-pulse"></span>
                    )}
                  </button>

                  {showNotif && (
                    <div className="absolute right-0 mt-2 w-80 bg-ink-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-up">
                      <div className="px-4 py-3 border-b border-white/5 bg-ink-900/50 flex justify-between items-center">
                        <span className="font-semibold text-white">Xabarnomalar</span>
                        {unreadCount > 0 && <span className="text-xs bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full">{unreadCount} ta yangi</span>}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-center text-white/40 text-sm py-8">Hozircha xabarlar yo'q</p>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} onClick={() => handleMarkAsRead(n.id)} className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${n.is_read ? 'opacity-60' : 'bg-gold-500/5'}`}>
                              <h4 className={`text-sm font-medium ${n.is_read ? 'text-white/70' : 'text-white flex items-center gap-2'}`}>
                                {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0"></span>}
                                {n.title}
                              </h4>
                              <p className="text-xs text-white/50 mt-1 leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-gold-400 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>

              {user.avatar ? (
                <img src={fileUrl(user.avatar)} alt={user.name} className="w-9 h-9 rounded-full border border-gold-500/50 object-cover bg-ink-800" />
              ) : (
                <div className="w-9 h-9 rounded-full border border-gold-500/50 bg-ink-800 flex items-center justify-center text-white text-sm font-bold">
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
                           
              <button onClick={() => { logout(); navigate('/') }} className="text-white/50 hover:text-white transition-colors" title="Chiqish">
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium text-white/80 hover:text-gold-400 transition-colors px-3 py-2">
                Kirish
              </Link>
              <Link to="/auth?mode=register" className="btn-gold text-sm !px-5 !py-2.5">
                Ro'yxatdan o'tish
              </Link>
            </>
          )}
        </div>

        {/* MOBIL UCHUN TUGMALAR */}
        <div className="flex md:hidden items-center gap-1">
          {user && user.role !== 'admin' && (
            <div className="relative" ref={notifRefMobile}>
              <button 
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 text-white/70 hover:text-white rounded-full transition-colors"
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-ink-900 animate-pulse"></span>
                )}
              </button>

              {showNotif && (
                <div className="absolute right-0 mt-2 w-72 bg-ink-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-up">
                  <div className="px-4 py-3 border-b border-white/5 bg-ink-900/50 flex justify-between items-center">
                    <span className="font-semibold text-white text-sm">Xabarnomalar</span>
                    {unreadCount > 0 && <span className="text-[10px] bg-gold-500/20 text-gold-400 px-2 py-0.5 rounded-full">{unreadCount} ta yangi</span>}
                  </div>
                  <div className="max-h-[250px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-white/40 text-xs py-6">Hozircha xabarlar yo'q</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} onClick={() => handleMarkAsRead(n.id)} className={`p-3 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 ${n.is_read ? 'opacity-60' : 'bg-gold-500/5'}`}>
                          <h4 className={`text-xs font-medium ${n.is_read ? 'text-white/70' : 'text-white flex items-center gap-1.5'}`}>
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shrink-0"></span>}
                            {n.title}
                          </h4>
                          <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button className="text-white p-2" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* MOBIL MENYU */}
      {open && (
        <div className="md:hidden border-t border-white/5 px-5 py-4 flex flex-col gap-3 bg-ink-900 absolute top-full left-0 w-full z-50 shadow-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Yulduzni qidiring..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="input-dark pl-9 !py-2 text-sm"
            />
          </div>
          <Link to="/" onClick={() => setOpen(false)} className="text-white/80 py-1 hover:text-gold-500">Bosh sahifa</Link>
          <Link to="/browse/all" onClick={() => setOpen(false)} className="text-white/80 py-1 hover:text-gold-500">Yulduzlar</Link>
                     
          {user ? (
            <>
              {user.role === 'admin' && ( 
                 <Link to="/admin" onClick={() => setOpen(false)} className="text-gold-500 font-bold py-1">Boshqaruv Paneli</Link>
              )}
              <Link to="/dashboard" onClick={() => setOpen(false)} className="text-white/80 py-1 hover:text-gold-500">Dashboard</Link>
              <button onClick={() => { logout(); setOpen(false); navigate('/') }} className="text-left text-white/60 py-1 mt-2 border-t border-white/10 pt-3">Chiqish</button>
            </>
          ) : (
            <>
              <Link to="/auth" onClick={() => setOpen(false)} className="text-white/80 py-1 mt-2 border-t border-white/10 pt-3">Kirish</Link>
              <Link to="/auth?mode=register" onClick={() => setOpen(false)} className="btn-gold text-sm w-fit mt-2">Ro'yxatdan o'tish</Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}