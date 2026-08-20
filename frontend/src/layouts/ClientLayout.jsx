import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Send, AtSign, Tv, Code } from 'lucide-react'

export default function ClientLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-ink-900">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* YANGILANGAN FOOTER QISMI */}
      <footer className="border-t border-white/5 pt-14 pb-8 mt-16 bg-ink-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 mb-12 items-center">
            
            {/* 1-USTUN: VIDO haqida */}
            <div>
              <h3 className="font-display font-extrabold text-3xl tracking-tight bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent mb-4">VIDO</h3>
              <p className="text-white/40 text-sm leading-relaxed max-w-sm">
                Yulduzlarni muxlislarga yaqinlashtiruvchi platforma. O'zingiz yoki yaqinlaringiz uchun unutilmas video tabriklar buyurtma qiling.
              </p>
            </div>

            {/* 2-USTUN: Bizni kuzatib boring (Tarmoqlar) */}
            <div className="md:px-8 flex flex-col md:items-center">
              <div className="w-fit">
                <h4 className="font-display font-semibold text-white mb-5 text-lg">Bizni kuzatib boring</h4>
                <div className="flex flex-col gap-4 text-sm text-white/50">
                <a href="https://www.instagram.com/getvido?igsh=b2lweTJsaWIwNTN2" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-gold-400 transition-colors group w-fit">
                    {/* overflow-hidden qo'shildi - bu rasmni tashqariga chiqarmay, qirqib dumaloq qiladi */}
                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden group-hover:bg-gold-500/20 transition-colors">
                      {/* Rasm qutiga to'liq va tekis moslashishi uchun w-full h-full va object-cover berildi */}
                      <img src="/assets/Instagram_icon.png" alt="Instagram" className="w-full h-full object-cover" />
                    </span>
                    VIDO Instagram
                  </a>
                  <a href="https://t.me/getVIDO" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-gold-400 transition-colors group w-fit">
                    {/* overflow-hidden qo'shildi - bu rasmni tashqariga chiqarmay, qirqib dumaloq qiladi */}
                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden group-hover:bg-gold-500/20 transition-colors">
                      {/* Rasm qutiga to'liq va tekis moslashishi uchun w-full h-full va object-cover berildi */}
                      <img src="/assets/telegram.png" alt="Telegram" className="w-full h-full object-cover" />
                    </span>
                    VIDO Telegram
                  </a>
                  <a href="https://youtube.com/@getvido?si=GJaRc1dWzaEEHt0z" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-gold-400 transition-colors group w-fit">
                    {/* overflow-hidden qo'shildi - bu rasmni tashqariga chiqarmay, qirqib dumaloq qiladi */}
                    <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center overflow-hidden group-hover:bg-gold-500/20 transition-colors">
                      {/* Rasm qutiga to'liq va tekis moslashishi uchun w-full h-full va object-cover berildi */}
                      <img src="/assets/youtube.jpg" alt="YouTube" className="w-full h-full object-cover" />
                    </span>
                    VIDO YouTube
                  </a>
                </div>
              </div>
            </div>

            {/* 3-USTUN: Yumaloq logotip va Yaratuvchi bilan bog'lanish tugmasi ustma-ust (To'liq markazlashtirildi) */}
            <div className="flex flex-col items-center justify-center gap-6">
              
              {/* Yumaloq logotip o'rni */}
              <div className="w-32 h-32 bg-ink-900 border border-white/5 rounded-full flex flex-col items-center justify-center overflow-hidden relative group shadow-lg hover:border-gold-500/30 transition-colors">
                {/* Kelajakda rasmni shu yerga qo'shasiz */}
                <img src="/assets/logotip.png" alt="Logotip" className="w-full h-full object-cover  group-hover:opacity-40 transition-opacity" />
                {/* <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest text-center px-3 border border-white/10 py-1.5 rounded-full bg-ink-950/60">
                     Logotip
                   </span>
                </div> */}
              </div>

              {/* Yaratuvchi bilan bog'lanish tugmasi */}
              <a 
                href="https://t.me/DEVELOPER2007" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-2 text-xs font-bold text-ink-950 bg-gold-500 hover:bg-gold-400 px-5 py-3 rounded-full transition-transform hover:scale-105 shadow-gold whitespace-nowrap"
              >
                <Code size={16} /> Yaratuvchi bilan bog'lanish
              </a>
              
            </div>

          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/30 font-medium tracking-wide">
            <p>© {new Date().getFullYear()} VIDO PLATFORMASI. Barcha huquqlar himoyalangan.</p>
          </div>
          
        </div>
      </footer>
    </div>
  )
}