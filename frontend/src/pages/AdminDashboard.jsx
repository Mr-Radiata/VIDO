import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, Star, DollarSign, Activity, Ban, CheckCircle, 
  Send, MessageSquare, Eye, History, Search, Trash2, 
  MessageCircle, Headset, Ticket, ArrowLeft, X, Play, 
  FileText, AlertTriangle, Image as ImageIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, fileUrl } from '../api';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(localStorage.getItem('adminTab') || 'stats');
  
  const [stats, setStats] = useState({ clients: 0, stars: 0, orders: 0, revenue: 0, chartData: [] });
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [notifHistory, setNotifHistory] = useState([]);
  const [notifyForm, setNotifyForm] = useState({ target: 'all', customId: '', title: '', message: '' });
  const [notifyBusy, setNotifyBusy] = useState(false);
  
  const [tickets, setTickets] = useState([]);
  const [supportView, setSupportView] = useState('list');
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectText, setRejectText] = useState('');
  
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [returnPath, setReturnPath] = useState(null);
  
  useEffect(() => {
     localStorage.setItem('adminTab', activeTab);
   }, [activeTab]);

  useEffect(() => {
     if (authLoading) return; // /api/auth/me hali javob bermagan — hukm chiqarishga shoshilmaymiz
     if (!user || user.role !== 'admin') {
       navigate('/');
       return;
     }
     loadData();
   }, [user, authLoading, navigate]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center text-white/40">Yuklanmoqda...</div>;
  }

  const loadData = async () => {
    try {
      const statsRes = await api.getAdminStats();
      setStats(statsRes);
      
      const usersRes = await api.getAdminUsers();
      setUsers(usersRes.users);
      
      const pendingRes = await api.getPendingVerifications();
      setPending(pendingRes.pending);
      
      const historyRes = await api.getNotificationHistory();
      setNotifHistory(historyRes.history);
      
      const reviewsRes = await api.getAdminReviews();
      setReviews(reviewsRes.reviews);
      
      const ordersRes = await api.getAdminOrders();
      setAllOrders(ordersRes.orders);

      const ticketsRes = await api.getTickets();
      setTickets(ticketsRes.tickets);

    } catch (err) {
       console.error("Xato", err);
     }
  };

  const loadTickets = async () => {
     try {
      const res = await api.getTickets();
      setTickets(res.tickets);
     } catch (err) {
      console.error(err);
    }
  };

  const handleBan = async (id, currentStatus) => {
    if(window.confirm(currentStatus ? "Foydalanuvchi bandan yechilsinmi?" : "Foydalanuvchi bloklansinmi?")) {
      try {
        await api.banUser(id, !currentStatus);
         loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleApprove = async (id) => {
    if(window.confirm("Yulduz profilini tasdiqlaysizmi? U endi platformada ishlash huquqiga ega bo'ladi.")) {
      try {
        await api.approveStar(id);
         loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleRejectVerif = async (id) => {
    if(!rejectText.trim()) return alert("Iltimos, rad etish sababini batafsil yozing!");
    try {
      await api.rejectVerification(id, { message: rejectText });
      setRejectingId(null);
       setRejectText('');
       loadData();
    } catch(err) {
       alert(err.message);
     }
  };

  const handleDeleteReview = async (id) => {
    if(window.confirm("Ushbu sharhni rostdan ham o'chirmoqchimisiz?")) {
      try {
        await api.deleteReview(id);
         loadData();
       } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifyForm.title.trim() || !notifyForm.message.trim()) return;
    const finalTarget = notifyForm.target === 'custom' ? notifyForm.customId : notifyForm.target;
    
    setNotifyBusy(true);
    try {
      await api.sendNotification({ target: finalTarget, title: notifyForm.title, message: notifyForm.message });
      alert("Xabarnoma muvaffaqiyatli yuborildi!");
      setNotifyForm({ target: 'all', customId: '', title: '', message: '' });
       loadData();
    } catch (err) {
       alert(err.message);
     } finally {
       setNotifyBusy(false);
     }
  };

  const openTicket = async (ticket) => {
    setActiveTicket(ticket);
     setSupportView('chat');
    try {
      const res = await api.getTicketDetails(ticket.id);
      setMessages(res.messages);
    } catch (err) {
      alert("Xabarlarni yuklashda xato");
    }
  };

  useEffect(() => {
     if (supportView === 'chat' && messagesEndRef.current) {
       const container = messagesEndRef.current.parentElement;
       if (container) {
          container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
       }
     }
  }, [messages, supportView]);

  const handleReplyTicket = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    const tempText = replyText;
     setReplyText('');
    try {
      await api.replyTicket(activeTicket.id, { message: tempText });
      const res = await api.getTicketDetails(activeTicket.id);
      setMessages(res.messages);
       loadTickets();
    } catch (err) {
       alert(err.message);
      setReplyText(tempText);
     }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm("Rostdan ham bu murojaatni yopmoqchimisiz?")) return;
    try {
      await api.closeTicket(activeTicket.id);
      setActiveTicket({ ...activeTicket, status: 'closed' });
       loadTickets();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
     u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
     u.id.toString() === userSearch
  );

  const filteredReviews = reviews.filter(r => 
     r.star_name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
     r.client_name.toLowerCase().includes(reviewSearch.toLowerCase())
  );

  // PLATFORMA FOYDASINI HISOBLASH (3%)
  const platformaFoydasi = (stats.revenue || 0) * 0.03;

  return (
    <div className="max-w-7xl mx-auto px-5 py-10 text-white">
      <h1 className="text-3xl font-display font-bold mb-8 text-gold-500">Boshqaruv Paneli</h1>
      
      <div className="flex flex-wrap gap-3 mb-8 border-b border-white/10 pb-4">
        {['stats', 'users', 'verifications', 'orders', 'notifications', 'reviews', 'support'].map(tab => (
          <button 
             key={tab}
             onClick={() => {
                setActiveTab(tab);
                setReturnPath(null);
             }}
             className={`px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base flex items-center gap-2 ${
              activeTab === tab 
                 ? 'bg-gold-500 text-ink-950 shadow-gold'
                 : 'bg-ink-800 text-white/60 hover:bg-ink-700 hover:text-white'
            }`}
          >
            {tab === 'stats' && <Activity size={16} />}
            {tab === 'users' && <Users size={16} />}
            {tab === 'verifications' && <CheckCircle size={16} />}
            {tab === 'orders' && <FileText size={16} />}
            {tab === 'notifications' && <MessageSquare size={16} />}
            {tab === 'reviews' && <Star size={16} />}
            {tab === 'support' && <Headset size={16} />}
            
            {tab === 'stats' ? 'Statistika' : 
             tab === 'users' ? 'Foydalanuvchilar' : 
             tab === 'verifications' ? 'Verifikatsiya' : 
             tab === 'orders' ? 'Buyurtmalar' :
             tab === 'notifications' ? 'Xabarnomalar' : 
             tab === 'reviews' ? 'Sharhlar' : 'Murojaatlar'}
            
            {tab === 'support' && tickets.filter(t => t.status === 'open').length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'support' ? 'bg-ink-950 text-gold-500' : 'bg-gold-500 text-ink-950'}`}>
                {tickets.filter(t => t.status === 'open').length}
              </span>
            )}
            {tab === 'verifications' && pending.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'verifications' ? 'bg-ink-950 text-gold-500' : 'bg-gold-500 text-ink-950'}`}>
                {pending.length}
              </span>
            )}
            {tab === 'orders' && allOrders.filter(o => o.status === 'rejected' && !o.is_resolved).length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'orders' ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400'}`}>
                {allOrders.filter(o => o.status === 'rejected' && !o.is_resolved).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={<Users />} title="Mijozlar" value={stats.clients} />
            <StatCard icon={<Star />} title="Yulduzlar" value={stats.stars} />
            <StatCard icon={<Activity />} title="Buyurtmalar" value={stats.orders} />
            <StatCard icon={<DollarSign />} title="Jami aylanma" value={stats.revenue?.toLocaleString()} subtext="UZS" />
            
            {/* 5-KARTA: Platformaning sof foydasi */}
            <StatCard 
              icon={<DollarSign />} 
              title="Sof foyda (3%)" 
              value={platformaFoydasi.toLocaleString()} 
              subtext="UZS"
              iconColor="text-emerald-500"
              iconBg="bg-emerald-500/10 border-emerald-500/20"
              hoverBorder="hover:border-emerald-500/30"
            />
          </div>
          
          <div className="bg-ink-800 p-6 rounded-2xl border border-white/5 h-[400px]">
            <h3 className="text-lg font-medium mb-6 text-white/80">Oylik buyurtmalar daromadi</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickMargin={10} />
                <YAxis stroke="#ffffff50" fontSize={12} tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value} />
                <Tooltip contentStyle={{ backgroundColor: '#15171E', borderColor: '#ffffff10', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#FBBF24' }} />
                <Line type="monotone" dataKey="revenue" name="Daromad (UZS)" stroke="#eab308" strokeWidth={3} dot={{ r: 5, fill: '#eab308', strokeWidth: 0 }} activeDot={{ r: 7, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-ink-800 rounded-2xl overflow-hidden border border-white/5 animate-fade-in shadow-xl">
          <div className="bg-ink-900/50 p-4 border-b border-white/5 flex items-center gap-3">
            <Search size={18} className="text-white/40" />
            <input 
               type="text" 
               placeholder="Ism, Email yoki ID orqali qidiring..." 
               className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-white/30"
               value={userSearch}
               onChange={(e) => setUserSearch(e.target.value)}
             />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-ink-950/50 text-white/50">
                <tr>
                  <th className="p-4">ID / Ism</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rol</th>
                  <th className="p-4">Holat</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-white/40">Foydalanuvchi topilmadi</td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white/90">{u.id}. {u.name}</td>
                    <td className="p-4 text-white/60">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : u.role === 'star' ? 'bg-gold-500/10 text-gold-400' : 'bg-neon-cyan/10 text-neon-cyan'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {u.is_banned ? (
                        <span className="text-red-400 text-xs font-medium flex items-center gap-1.5"><Ban size={14}/> Bloklangan</span>
                      ) : (
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5"><CheckCircle size={14}/> Faol</span>
                      )}
                    </td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <Link to={`/admin/users/${u.id}`} className="text-xs font-medium px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5">
                        <Eye size={14}/> Ko'rish
                      </Link>
                      {u.role !== 'admin' && (
                        <button 
                           onClick={() => handleBan(u.id, u.is_banned)}
                           className={`text-xs font-medium px-4 py-2 rounded-lg transition-colors ${u.is_banned ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                        >
                          {u.is_banned ? 'Bandan yechish' : 'Bloklash'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'verifications' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {pending.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-ink-800/30 rounded-2xl border border-white/5 border-dashed">
              <CheckCircle size={40} className="mx-auto text-emerald-500/20 mb-4" />
              <p className="text-white/50 text-lg">Kutilayotgan arizalar yo'q. Hamma tekshirilgan!</p>
            </div>
          ) : pending.map(star => (
            <div key={star.id} className="bg-ink-800 p-6 rounded-2xl border border-white/5 flex flex-col gap-4 hover:border-gold-500/30 transition-colors shadow-lg">
              <div>
                <h3 className="font-display font-bold text-xl text-white">{star.name}</h3>
                <p className="text-xs text-white/50 mt-1 mb-3">{star.email}</p>
                
                {/* Ijtimoiy tarmoqlar qismi */}
                <div className="flex flex-col gap-2 pt-3 border-t border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Ijtimoiy tarmoqlari:</p>
                  <div className="flex flex-wrap gap-2">
                    {star.instagram && (
                      <a href={star.instagram.startsWith('http') ? star.instagram : `https://instagram.com/${star.instagram}`} target="_blank" rel="noreferrer" className="text-xs bg-neon-cyan/10 text-neon-cyan hover:bg-neon-cyan/20 px-2.5 py-1.5 rounded-lg transition-colors">
                        Instagram
                      </a>
                    )}
                    {star.telegram && (
                      <a href={star.telegram.startsWith('http') ? star.telegram : `https://t.me/${star.telegram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                        Telegram
                      </a>
                    )}
                    {star.youtube && (
                      <a href={star.youtube.startsWith('http') ? star.youtube : `https://youtube.com/${star.youtube}`} target="_blank" rel="noreferrer" className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1.5 rounded-lg transition-colors">
                        YouTube
                      </a>
                    )}
                    {(!star.instagram && !star.telegram && !star.youtube) && (
                      <span className="text-xs text-white/30 italic">Kiritilmagan</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Video va token himoyasi qismi */}
              <div className="bg-ink-900 rounded-xl overflow-hidden aspect-[9/16] relative flex items-center justify-center border border-white/10">
                {star.verification_video ? (
                  <video 
                    src={`${fileUrl(star.verification_video)}?token=${localStorage.getItem('token')}`} 
                    controls 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <span className="text-white/30 text-sm">Video yuklanmagan</span>
                )}
              </div>

              {/* Rad etish va Tasdiqlash mantiqlari */}
              {rejectingId === star.id ? (
                <div className="animate-fade-in flex flex-col gap-2">
                  <textarea 
                    className="bg-ink-950 border border-white/10 rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-red-500/50 min-h-[80px]" 
                    placeholder="Nima uchun rad etilmoqda? Yulduzga aniq tushuntirish yozing..."
                    value={rejectText}
                    onChange={(e) => setRejectText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleRejectVerif(star.id)} 
                      className="flex-1 bg-red-500 hover:bg-red-400 text-ink-950 font-bold py-2.5 rounded-lg text-sm transition-colors"
                    >
                      Jo'natish
                    </button>
                    <button 
                      onClick={() => { setRejectingId(null); setRejectText(''); }} 
                      className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
                    >
                      Bekor qilish
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button 
                    onClick={() => handleApprove(star.id)} 
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Tasdiqlash
                  </button>
                  <button 
                    onClick={() => setRejectingId(star.id)} 
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={16} /> Rad etish
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-ink-800 rounded-2xl overflow-hidden border border-white/5 animate-fade-in shadow-xl">
          {selectedOrder ? (
             <div className="animate-fade-in flex flex-col h-full bg-ink-900/30">
               <div className="p-6 border-b border-white/5 bg-ink-900/80 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <button onClick={() => setSelectedOrder(null)} className="text-white/40 hover:text-white transition-colors bg-white/5 p-2 rounded-full">
                     <ArrowLeft size={18} />
                   </button>
                   <div>
                     <h2 className="text-xl font-display font-bold text-white">Nizo tahlili: #{selectedOrder.id}</h2>
                     <p className="text-xs text-white/50 mt-0.5">Admin bu yerda barcha faktlarni o'rganib adolatli hukm chiqaradi.</p>
                   </div>
                 </div>
                 {selectedOrder.is_resolved && (
                   <span className="bg-emerald-500/10 text-emerald-400 font-bold px-4 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                     <CheckCircle size={16}/> Nizo hal qilingan
                   </span>
                 )}
               </div>

               {(() => {
                 const relatedTicket = tickets.find(t => t.subject.includes(`#${selectedOrder.id}`));
                 if (!relatedTicket) return null;
                 return (
                    <div className="mx-6 mt-6 bg-gold-500/10 border border-gold-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-gold-500/20 rounded-full text-gold-400 shrink-0">
                             <MessageSquare size={20} />
                          </div>
                          <div>
                             <p className="text-gold-400 font-bold text-sm">Mijoz ariza yo'llagan!</p>
                             <p className="text-white/60 text-xs mt-0.5">Ushbu buyurtma yuzasidan mijoz shikoyat yozgan. Hukm chiqarishdan oldin mijoz bilan gaplashishingiz mumkin.</p>
                          </div>
                       </div>
                       <button 
                          onClick={() => {
                             setReturnPath('orders');
                             setActiveTab('support');
                             openTicket(relatedTicket);
                          }} 
                          className="bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap shadow-gold"
                       >
                          Chatga o'tish
                       </button>
                    </div>
                 );
               })()}

               <div className="p-6 grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <div className="bg-ink-950 p-5 rounded-2xl border border-white/5 shadow-inner">
                        <div className="flex justify-between mb-4">
                           <div>
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Mijoz (Buyurtmachi)</p>
                              <p className="text-neon-cyan font-bold text-lg">{selectedOrder.client_name}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">Yulduz (Rad etgan)</p>
                              <p className="text-gold-400 font-bold text-lg">{selectedOrder.star_name}</p>
                           </div>
                        </div>
                        <div className="border-t border-white/5 pt-4">
                           <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Buyurtma matni:</p>
                           <p className="text-white text-sm leading-relaxed bg-ink-900 p-4 rounded-xl italic">"{selectedOrder.instructions}"</p>
                        </div>
                     </div>

                     <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                        <p className="text-red-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><AlertTriangle size={14}/> Yulduzning rad etish sababi:</p>
                        <p className="text-red-200 text-sm font-medium">{selectedOrder.rejection_reason}</p>
                        {selectedOrder.rejection_comment && <p className="text-red-200/60 text-xs mt-3 bg-black/20 p-3 rounded-lg">Izoh: {selectedOrder.rejection_comment}</p>}
                     </div>
                  </div>

                  <div className="space-y-6">
                     <div className="bg-ink-950 p-5 rounded-2xl border border-white/5 flex flex-col items-center shadow-inner">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-3 w-full text-left">Yuklangan rasm:</p>
                        {selectedOrder.recipient_photo_url ? (
                           <img src={fileUrl(selectedOrder.recipient_photo_url)} className="w-full max-h-64 rounded-xl object-contain bg-black/40 border border-white/5" alt="Mijoz rasmi" />
                        ) : (
                           <div className="w-full py-12 flex flex-col items-center justify-center text-white/30 border border-dashed border-white/10 rounded-xl">
                              <ImageIcon size={40} className="mb-2 opacity-50" />
                              <span className="text-sm">Rasm yuklanmagan</span>
                           </div>
                        )}
                     </div>

                     {!selectedOrder.is_resolved && selectedOrder.status === 'rejected' && (
                        <div className="bg-ink-900 p-6 rounded-2xl border border-gold-500/30">
                           <h4 className="text-white font-bold text-center mb-4 uppercase tracking-wider text-sm">Nizoni hal qilish (Hukm chiqarish)</h4>
                           <p className="text-xs text-white/50 text-center mb-6">Aybdor deb topilgan tarafga 1 ta jarima yoziladi (3 ta jarima = avtomatik blok).</p>
                           
                           <div className="flex gap-4">
                              <button 
                                onClick={async () => {
                                   if(window.confirm("Mijozni aybdor deb topib, unga jarima berasizmi? Yulduz oqlanadi.")) {
                                      await api.resolveDispute(selectedOrder.id, { guiltyParty: 'client' });
                                      loadData();
                                      setSelectedOrder(null);
                                   }
                                }} 
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-4 rounded-xl transition-colors font-bold text-sm flex flex-col items-center gap-2"
                              >
                                 <Ban size={20}/> Mijoz Aybdor
                              </button>
                              <button 
                                onClick={async () => {
                                   if(window.confirm("Yulduz nohaq rad etdi deb topib, unga jarima berasizmi? Mijoz oqlanadi.")) {
                                      await api.resolveDispute(selectedOrder.id, { guiltyParty: 'star' });
                                      loadData();
                                      setSelectedOrder(null);
                                   }
                                }} 
                                className="flex-1 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 border border-gold-500/30 p-4 rounded-xl transition-colors font-bold text-sm flex flex-col items-center gap-2"
                              >
                                 <Ban size={20}/> Yulduz Aybdor
                              </button>
                           </div>
                        </div>
                     )}
                  </div>
               </div>
             </div>
          ) : (
            <>
              <div className="bg-ink-900/50 p-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-white">Barcha buyurtmalar va Nizolar</h2>
                  <p className="text-xs text-white/50 mt-1">Bu yerdan shikoyat qilingan (rad etilgan) buyurtmalarning matnini va rasmini tekshirib chora ko'rishingiz mumkin.</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-ink-950/50 text-white/50">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Yulduz</th>
                      <th className="p-4">Mijoz</th>
                      <th className="p-4">Holat</th>
                      <th className="p-4">Nizo (Admin)</th>
                      <th className="p-4 text-right">Batafsil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allOrders.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-10 text-white/40">Buyurtmalar topilmadi</td></tr>
                    ) : allOrders.map(o => (
                      <tr key={o.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white/60">#{o.id}</td>
                        <td className="p-4 font-medium text-gold-400">{o.star_name}</td>
                        <td className="p-4 font-medium text-neon-cyan">{o.client_name}</td>
                        <td className="p-4">
                          {o.status === 'rejected' ? <span className="text-red-400 bg-red-500/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">Rad etilgan</span> :
                           o.status === 'delivered' ? <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">Tayyor</span> :
                           <span className="text-gold-400 bg-gold-500/10 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase">Kutilmoqda</span>}
                        </td>
                        <td className="p-4">
                          {o.status === 'rejected' ? (
                             o.is_resolved 
                                ? (
                                  <div className="flex flex-col gap-1">
                                    <span className="text-emerald-400 font-medium text-xs flex items-center gap-1"><CheckCircle size={12}/> Hal qilingan</span>
                                    <span className="text-white/40 text-[9px] uppercase tracking-wider">Aybdor: <b className="text-white/70">{o.guilty_party === 'client' ? 'Mijoz' : 'Yulduz'}</b></span>
                                  </div>
                               )
                               : <span className="text-red-400 font-bold text-xs flex items-center gap-1 animate-pulse"><AlertTriangle size={12}/> Kutilmoqda</span>
                          ) : (
                             <span className="text-white/20 text-xs">-</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => setSelectedOrder(o)} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ml-auto">
                            <Eye size={14}/> Ko'rish
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="bg-ink-800 p-6 rounded-2xl border border-white/5 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <MessageCircle size={22} className="text-gold-500" /> Mijozlar sharhlari
            </h2>
            <div className="flex items-center gap-3 bg-ink-900/50 px-4 py-2.5 border border-white/5 rounded-xl w-full sm:w-80">
              <Search size={18} className="text-white/40" />
              <input 
                 type="text" 
                 placeholder="Yulduz yoki Mijoz ismini yozing..." 
                 className="bg-transparent border-none outline-none text-white text-sm w-full placeholder-white/30"
                 value={reviewSearch}
                 onChange={(e) => setReviewSearch(e.target.value)}
               />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReviews.length === 0 ? (
              <div className="col-span-full py-16 text-center text-white/40 border border-white/5 border-dashed rounded-2xl bg-ink-900/30">
                Sharhlar topilmadi.
              </div>
            ) : filteredReviews.map(r => (
              <div key={r.id} className="bg-ink-900/50 p-5 rounded-2xl border border-white/5 relative group hover:border-red-500/30 transition-all flex flex-col justify-between">
                <div>
                  <button 
                     onClick={() => handleDeleteReview(r.id)} 
                     className="absolute top-4 right-4 text-white/20 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                     title="Sharhni o'chirish"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className={i < r.rating ? "fill-gold-400" : "text-white/10"} />
                    ))}
                  </div>
                  <p className="text-white/80 text-sm mb-5 italic leading-relaxed">"{r.text}"</p>
                </div>
                <div className="flex flex-col gap-2 pt-4 border-t border-white/5 text-xs text-white/50">
                  <div className="flex justify-between items-center">
                    <span>Kimdan: <span className="font-medium text-neon-cyan">{r.client_name}</span></span>
                    <span>{new Date(r.created_at).toLocaleDateString('uz-UZ')}</span>
                  </div>
                  <div>Kimga: <span className="font-medium text-gold-400">{r.star_name}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-ink-800 p-6 sm:p-8 rounded-2xl border border-white/5 h-fit shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center text-gold-500">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white">Yangi xabar</h2>
                <p className="text-xs text-white/50">Foydalanuvchilarga bildirishnoma</p>
              </div>
            </div>
            
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="text-sm text-white/70 mb-2 block font-medium">Kimga yuborilmoqda?</label>
                <select 
                   className="w-full bg-ink-950 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-gold-500/60"
                   value={notifyForm.target}
                   onChange={(e) => setNotifyForm({...notifyForm, target: e.target.value})}
                >
                  <option value="all">Barchaga</option>
                  <option value="stars">Faqat yulduzlarga</option>
                  <option value="clients">Faqat mijozlarga</option>
                  <option value="custom">Bitta shaxsiy foydalanuvchiga (ID)</option>
                </select>
              </div>
              
              {notifyForm.target === 'custom' && (
                <div className="animate-fade-in">
                  <label className="text-sm text-white/70 mb-2 block font-medium">Foydalanuvchi ID raqami</label>
                  <input 
                     type="number" 
                     required
                     placeholder="Masalan: 3"
                     className="w-full bg-ink-950 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 outline-none focus:border-gold-500/60"
                     value={notifyForm.customId}
                     onChange={(e) => setNotifyForm({...notifyForm, customId: e.target.value})}
                   />
                </div>
              )}
              
              <div>
                <label className="text-sm text-white/70 mb-2 block font-medium">Sarlavha</label>
                <input 
                   type="text" 
                   required
                   placeholder="Sarlavha yozing..."
                   className="w-full bg-ink-950 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 outline-none focus:border-gold-500/60"
                   value={notifyForm.title}
                   onChange={(e) => setNotifyForm({...notifyForm, title: e.target.value})}
                 />
              </div>
              
              <div>
                <label className="text-sm text-white/70 mb-2 block font-medium">Matn</label>
                <textarea 
                   required
                   placeholder="Xabaringizni yozing..."
                   className="w-full bg-ink-950 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 outline-none focus:border-gold-500/60 min-h-[100px] resize-y"
                   value={notifyForm.message}
                   onChange={(e) => setNotifyForm({...notifyForm, message: e.target.value})}
                 />
              </div>
              
              <button 
                 type="submit" 
                 disabled={notifyBusy}
                 className="btn-gold w-full flex items-center justify-center gap-2 !py-3.5 mt-2 disabled:opacity-50"
              >
                {notifyBusy ? 'Yuborilmoqda...' : <><Send size={18} /> Jo'natish</>}
              </button>
            </form>
          </div>

          <div className="bg-ink-800 p-6 sm:p-8 rounded-2xl border border-white/5 shadow-xl flex flex-col h-[600px]">
            <div className="flex items-center gap-2 mb-6">
              <History size={20} className="text-gold-500" />
              <h2 className="text-xl font-display font-bold text-white">Yuborilganlar tarixi</h2>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {notifHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/30">
                  <MessageSquare size={40} className="mb-4 opacity-50" />
                  <p>Hozircha xabarlar yuborilmagan</p>
                </div>
              ) : (
                notifHistory.map((h, i) => (
                  <div key={i} className="p-4 border border-white/10 rounded-xl bg-ink-900/50 hover:border-white/20 transition-colors">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <h4 className="font-bold text-white text-sm leading-tight">{h.title}</h4>
                      <span className="text-[10px] text-white/40 shrink-0 bg-white/5 px-2 py-1 rounded">
                        {new Date(h.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 mb-3">{h.message}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[10px] text-gold-400 font-medium bg-gold-500/10 w-fit px-2 py-1 rounded">
                        <Users size={12} /> {h.recipients} kishiga
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-neon-cyan font-medium bg-neon-cyan/10 w-fit px-2 py-1 rounded">
                        Kimga: {h.target_group === 'all' ? 'Barchaga' : h.target_group === 'stars' ? 'Yulduzlarga' : h.target_group === 'clients' ? 'Mijozlarga' : h.target_group ? `ID: ${h.target_group}` : "Noma'lum"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'support' && (
        <div className="bg-ink-800 border border-white/5 rounded-2xl shadow-xl overflow-hidden flex flex-col h-[700px] animate-fade-in">
          
          {supportView === 'list' && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-white/5 bg-ink-900/50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <Headset className="text-gold-500" /> Mijozlar va Yulduzlar Murojaatlari
                  </h2>
                  <p className="text-xs text-white/40 mt-1">Bu yerda foydalanuvchilar yo'llagan savol va shikoyatlar saqlanadi</p>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {tickets.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-white/30">
                    <Ticket size={48} className="mb-4 opacity-20" />
                    <p>Hozircha murojaatlar yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map(t => (
                      <div 
                         key={t.id} 
                         onClick={() => openTicket(t)}
                        className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                          t.status === 'open' 
                             ? 'bg-gold-500/5 border-gold-500/30 hover:bg-gold-500/10' 
                             : 'bg-ink-900/40 border-white/5 hover:bg-white/5'
                        }`}
                      >
                        <div>
                          <h4 className={`font-semibold transition-colors ${t.status === 'open' ? 'text-gold-400' : 'text-white group-hover:text-gold-400'}`}>
                            {t.subject}
                          </h4>
                          <p className="text-xs text-white/50 mt-1.5 flex items-center gap-2">
                            Murojaatchi: <span className="font-medium text-neon-cyan">{t.user_name}</span> 
                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] uppercase">{t.user_role}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-[11px] text-white/40">{new Date(t.created_at).toLocaleDateString('uz-UZ')}</span>
                          {t.status === 'open' ? (
                            <span className="px-3 py-1 rounded bg-gold-500/20 text-gold-400 text-[10px] font-bold uppercase">Kutilmoqda</span>
                          ) : t.status === 'answered' ? (
                            <span className="px-3 py-1 rounded bg-neon-cyan/20 text-neon-cyan text-[10px] font-bold uppercase">Javob berildi</span>
                          ) : t.status === 'viewed' ? (
                            <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">O'qilgan</span>
                          ) : (
                            <span className="px-3 py-1 rounded bg-white/10 text-white/50 text-[10px] font-bold uppercase">Yopilgan</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {supportView === 'chat' && activeTicket && (
            <div className="flex flex-col h-full">
              <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between bg-ink-900/50 shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                     onClick={() => {
                       if (returnPath === 'orders') {
                         setActiveTab('orders');
                         setReturnPath(null);
                         setSupportView('list');
                       } else {
                         setSupportView('list');
                       }
                     }} 
                     className="text-white/40 hover:text-white transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="font-display font-bold text-white truncate max-w-[200px] sm:max-w-md">{activeTicket.subject}</h2>
                    <p className="text-xs text-white/40 mt-0.5 flex items-center gap-2">
                      Murojaatchi: <span className="text-white">{activeTicket.user_name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${activeTicket.status === 'closed' ? 'bg-white/10 text-white/50' : activeTicket.status === 'open' ? 'bg-gold-500/20 text-gold-400' : 'bg-neon-cyan/10 text-neon-cyan'}`}>
                        {activeTicket.status}
                      </span>
                    </p>
                  </div>
                </div>
                {activeTicket.status !== 'closed' && (
                  <button onClick={handleCloseTicket} className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 bg-red-500/10 rounded-lg transition-colors">
                    Murojaatni yopish
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar bg-ink-900/20 relative">
                {(() => {
                   const match = activeTicket?.subject.match(/#(\d+)/);
                   const relatedOrder = match ? allOrders.find(o => o.id == match[1]) : null;
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
                  const isAdmin = msg.sender_role === 'admin';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-white/30 mb-1 px-1">
                        {isAdmin ? 'Siz (Admin)' : msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString('uz-UZ', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <div className={`max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-sm ${isAdmin ? 'bg-gold-500 text-ink-950 font-medium rounded-tr-sm' : 'bg-ink-700 text-white/90 rounded-tl-sm'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {activeTicket.status === 'closed' ? (
                <div className="p-4 bg-ink-900/80 text-center border-t border-white/5">
                  <p className="text-sm text-white/40">Bu murojaat yopilgan. Unga ortiq javob yoza olmaysiz.</p>
                </div>
              ) : (
                <form onSubmit={handleReplyTicket} className="p-4 border-t border-white/5 bg-ink-900/50 flex gap-3 items-end">
                  <textarea 
                    className="input-dark !py-3 flex-1 resize-none min-h-[50px] max-h-[120px]" 
                    placeholder="Foydalanuvchiga javob yozing..." 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReplyTicket(e); } }}
                  />
                  <button type="submit" disabled={!replyText.trim()} className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center text-ink-950 hover:bg-gold-400 transition-colors disabled:opacity-50 shrink-0">
                    <Send size={20} className="ml-1" />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

function StatCard({ icon, title, value, subtext, iconBg, iconColor, hoverBorder }) {
  return (
    <div className={`bg-ink-800 p-4 rounded-2xl border border-white/5 flex items-center gap-3 transition-colors shadow-lg overflow-hidden ${hoverBorder || 'hover:border-white/10'}`}>
      <div className={`p-3 rounded-2xl border shrink-0 flex items-center justify-center ${iconBg || 'bg-gold-500/10 border-gold-500/20'} ${iconColor || 'text-gold-500'}`}>
        {icon}
      </div>
      
      <div className="min-w-0 flex-1">
        <p className="text-white/50 text-xs font-medium mb-0.5 truncate" title={title}>{title}</p>
        <p className="text-lg font-bold text-white truncate" title={`${value} ${subtext || ''}`}>
          {value} {subtext && <span className="text-xs font-normal text-white/50 ml-1">{subtext}</span>}
        </p>
      </div>
    </div>
  );
}