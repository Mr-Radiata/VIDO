import { useEffect, useState } from 'react'
import { Inbox, UploadCloud, Star, Wallet, Settings, Headset } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { api, fileUrl } from '../api'

const NAV = [
  { key: 'orders', label: 'Buyurtmalar', icon: Inbox },
  { key: 'uploads', label: 'Videolar', icon: UploadCloud },
  { key: 'reviews', label: 'Sharhlar', icon: Star },
  { key: 'earnings', label: 'Daromad', icon: Wallet },
  { key: 'settings', label: 'Sozlamalar', icon: Settings },
  { key: 'support', label: 'Yordam', icon: Headset },
]

export default function StarLayout({ active, onSelect, children, supportCount }) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-ink-900 pb-[80px] md:pb-0 relative">
      <Navbar />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 md:py-8 flex gap-8 flex-1">
        
        <aside className="hidden md:flex flex-col w-56 shrink-0 gap-1">
          <div className="card-surface rounded-2xl p-4 mb-4 flex items-center gap-3">
            {user?.avatar ? (
               <img src={fileUrl(user.avatar)} alt={user?.name} className="w-11 h-11 rounded-full object-cover border border-gold-500/40 bg-ink-800" />
                ) : (
                 <div className="w-11 h-11 rounded-full border border-gold-500/40 bg-ink-800 flex items-center justify-center text-white text-lg font-bold">
                  {user?.name?.[0]?.toUpperCase()}
               </div>
              )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'Yulduz'}</p>
              <p className="text-xs text-neon-cyan">Star profil</p>
            </div>
          </div>
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onSelect?.(key)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                active === key
                  ? 'bg-gold-500/10 text-gold-400 shadow-gold border border-gold-500/20'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={18} className={active === key ? "text-gold-400" : ""} />
              {label}
              
              {key === 'support' && supportCount > 0 && (
                 <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-md">
                   {supportCount}
                 </span>
              )}
            </button>
          ))}
        </aside>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-ink-950/95 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-center px-6 py-4">
          {NAV.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => {
                  onSelect?.(key);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="relative p-1 flex flex-col items-center justify-center gap-1 transition-all duration-300"
                title={label}
              >
                <div className={`transition-all duration-300 ${isActive ? 'scale-110 text-white' : 'text-white/40 hover:text-white/70'}`}>
                   <Icon size={26} strokeWidth={isActive ? 2.5 : 2} fill={isActive && key !== 'settings' && key !== 'support' ? 'currentColor' : 'none'} />
                </div>
                {key === 'support' && supportCount > 0 && (
                   <span className="absolute -top-1 -right-1 bg-red-500 border border-ink-950 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-pulse shadow-md">
                     {supportCount}
                   </span>
                )}
                <span className={`w-1 h-1 rounded-full transition-all duration-300 absolute -bottom-2 ${isActive ? 'bg-gold-500 scale-100' : 'bg-transparent scale-0'}`}></span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  )
}