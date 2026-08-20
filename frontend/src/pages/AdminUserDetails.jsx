import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, Activity, Calendar } from 'lucide-react';
import { api, fileUrl } from '../api';
import { useAuth } from '../context/AuthContext';

function formatPrice(n) {
  return new Intl.NumberFormat('uz-UZ').format(n || 0) + " so'm";
}

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: adminUser, loading: authLoading } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return; // /api/auth/me hali javob bermagan — hukm chiqarishga shoshilmaymiz
    if (!adminUser || adminUser.role !== 'admin') {
      navigate('/');
      return;
    }
    
    api.getAdminUserDetails(id)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        alert(err.message);
        navigate('/admin');
      });
  }, [id, adminUser, authLoading, navigate]);

  if (authLoading || loading) return <div className="text-center text-white/50 py-20">Yuklanmoqda...</div>;
  if (!data) return null;

  const { user, stats, orders } = data;
  const isStar = user.role === 'star';

  const statusTarjimasi = {
    pending: "Kutilmoqda",
    processing: "Jarayonda",
    delivered: "Tayyor",
    rejected: "Rad etildi"
  };

  return (
    <div className="max-w-6xl mx-auto px-5 py-10 text-white animate-fade-in">
      <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> Orqaga qaytish
      </button>

      {/* PROFIL CARD */}
      <div className="bg-ink-800 border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row items-center gap-6 mb-8 shadow-xl">
        {user.avatar_url ? (
          <img src={fileUrl(user.avatar_url)} className="w-24 h-24 rounded-full object-cover border-2 border-gold-500/50" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-ink-900 border-2 border-gold-500/50 flex items-center justify-center">
             <User size={40} className="text-white/20" />
          </div>
        )}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-3xl font-display font-bold">{user.name}</h1>
          <p className="text-white/50 mb-2">{user.email}</p>
          <div className="flex items-center justify-center md:justify-start gap-3">
             <span className={`px-3 py-1 text-xs rounded-md ${isStar ? 'bg-gold-500/20 text-gold-400' : 'bg-neon-cyan/20 text-neon-cyan'}`}>
               Rol: {user.role.toUpperCase()}
             </span>
             <span className={`px-3 py-1 text-xs rounded-md ${user.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
               Holat: {user.is_banned ? 'Bloklangan' : 'Faol'}
             </span>
             <span className="px-3 py-1 text-xs rounded-md bg-white/5 text-white/60 flex items-center gap-1">
               <Calendar size={12} /> A'zo bo'ldi: {new Date(user.created_at).toLocaleDateString('uz-UZ')}
             </span>
          </div>
        </div>
      </div>

      {/* STATISTIKALAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-ink-800 p-6 rounded-2xl border border-white/5 flex items-center gap-5">
          <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl"><Activity size={24}/></div>
          <div>
            <p className="text-white/50 text-sm">Umumiy buyurtmalar</p>
            <p className="text-2xl font-bold">{stats.total_orders}</p>
          </div>
        </div>
        <div className="bg-ink-800 p-6 rounded-2xl border border-white/5 flex items-center gap-5">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl"><DollarSign size={24}/></div>
          <div>
            <p className="text-white/50 text-sm">{isStar ? "Ishlagan puli" : "Sarflagan puli"}</p>
            <p className="text-2xl font-bold text-emerald-400">{formatPrice(stats.total_earned || stats.total_spent)}</p>
          </div>
        </div>
      </div>

      {/* BUYURTMALAR JADVALI */}
      <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
         Buyurtmalar tarixi <span className="text-sm font-normal text-white/40">({orders.length} ta)</span>
      </h2>
      <div className="bg-ink-800 rounded-2xl overflow-hidden border border-white/5 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-ink-950/50 text-white/50">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">{isStar ? "Mijoz" : "Yulduz"}</th>
              <th className="p-4">Tadbir turi</th>
              <th className="p-4">Narx</th>
              <th className="p-4">Holat</th>
              <th className="p-4">Sana</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-10 text-white/40">Buyurtmalar topilmadi</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 text-white/60">#{o.id}</td>
                <td className="p-4 font-medium">{isStar ? o.client_name : o.star_name}</td>
                <td className="p-4 text-white/80">{o.occasion}</td>
                <td className="p-4 text-gold-400 font-medium">{formatPrice(o.price)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[11px] ${o.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'}`}>
                    {statusTarjimasi[o.status] || o.status}
                  </span>
                </td>
                <td className="p-4 text-white/50">{new Date(o.created_at).toLocaleDateString('uz-UZ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}