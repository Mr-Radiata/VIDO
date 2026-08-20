import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google'; // 🟢 GOOGLE KUTUBXONASI QO'SHILDI
import { api, setToken } from '../api'; // 🟢 API VA TOKEN FUNKSIYASI QO'SHILDI

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { login, register } = useAuth(); 

  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'register');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
    acceptTerms: false,
  });

  useEffect(() => {
    if (searchParams.get('mode') === 'register') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
    setError('');
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        navigate('/dashboard');
      } else {
        await register(formData);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  // 🟢 GOOGLE ORQALI KIRISH FUNKSIYASI
  const handleGoogleSuccess = async (credentialResponse) => {
    // Ro'yxatdan o'tish rejimida (yangi hisob) shartlarga rozilik bo'lmasa, davom etmaymiz —
    // aks holda Google orqali "orqa eshikdan" shartlarsiz ro'yxatdan o'tib bo'lardi.
    if (!isLogin && !formData.acceptTerms) {
      setError("Google orqali ro'yxatdan o'tishdan oldin xizmat shartlarini qabul qiling");
      return;
    }
    try {
      setError('');
      setLoading(true);
      
      // 1. Backenddan javobni olamiz
      const data = await api.googleLogin(credentialResponse.credential, formData.acceptTerms);
      
      // Axios yoki Fetch ishlatilganiga qarab tokenni aniq ajratib olamiz
      const exactToken = data.token || data.data?.token;
      
      // 2. Tokenni to'g'ridan-to'g'ri xotiraga yozamiz
      if (exactToken) {
        localStorage.setItem('token', exactToken);
      }

      // 3. Eng asosiy yechim: React navigate o'rniga oynani to'liq yangilab, Dashboard'ga otamiz.
      // Bu siz qo'lda qilgan "refresh" ni avtomatik bajaradi va xatolik umuman chiqmaydi.
      window.location.href = '/dashboard';
      
    } catch (err) {
      setError("Tizimga kirishda xatolik: " + (err.message || "Server ulanmadi"));
      setLoading(false);
    }
  };

  const toggleMode = () => {
    if (isLogin) {
      navigate('/auth?mode=register');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-ink-900 p-10 rounded-3xl border border-white/5 shadow-2xl relative">
        
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            Xush kelibsiz
          </h2>
          <p className="text-white/50 text-sm">
            VIDO'ga {isLogin ? 'kirish' : "qo'shilish"} uchun ma'lumotlaringizni kiriting
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full bg-ink-950 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors"
                  placeholder="Ismingiz"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}
            
            <div>
              <input
                name="email"
                type="email"
                required
                className="w-full bg-ink-950 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="Email manzil"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <input
                name="password"
                type="password"
                required
                minLength="6"
                className="w-full bg-ink-950 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="Parol (kamida 6 belgi)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {!isLogin && (
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="role"
                  className="accent-gold-500 w-4 h-4 cursor-pointer"
                  checked={formData.role === 'star'}
                  onChange={(e) => setFormData({...formData, role: e.target.checked ? 'star' : 'client'})}
                />
                <label htmlFor="role" className="text-sm text-white/70 cursor-pointer select-none">
                  Yulduz sifatida ro'yxatdan o'tish
                </label>
              </div>
            )}

            {!isLogin && (
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  required
                  className="accent-gold-500 w-4 h-4 cursor-pointer mt-0.5"
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                />
                <label htmlFor="acceptTerms" className="text-xs text-white/60 cursor-pointer select-none leading-relaxed">
                  Men VIDO{' '}
                  <Link to="/terms" target="_blank" className="text-gold-400 hover:underline">
                    Foydalanish shartlari (Ommaviy Oferta)
                  </Link>
                  ni o'qib chiqdim va unga to'liq roziman
                </label>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (!isLogin && !formData.acceptTerms)}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm font-bold text-ink-950 bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Kuting...' : isLogin ? 'Kirish' : "Ro'yxatdan o'tish"}
          </button>
        </form>

        {/* 🟢 GOOGLE TUGMASI QISMI */}
        <div className="relative mt-6 flex items-center justify-center">
          <div className="absolute inset-x-0 h-px bg-white/10"></div>
          <span className="relative bg-ink-900 px-4 text-sm text-white/30">yoki</span>
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLogin 
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google orqali kirish bekor qilindi")}
            theme="filled_black" // Qora temaga moslashadi
            shape="pill"
            text={isLogin ? "signin_with" : "signup_with"}
          />
        </div>
        {/* 🟢 GOOGLE TUGMASI QISMI TUGADI */}

        <div className="text-center mt-6">
          <button 
            onClick={toggleMode}
            className="text-white/50 text-sm hover:text-white transition-colors"
          >
            {isLogin ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : "Hisobingiz bormi? Kirish"}
          </button>
        </div>

        {isLogin && (
          <p className="text-center text-xs text-white/20 mt-4">
            Demo star hisobi: sevara@vido.uz / demo1234
          </p>
        )}

        <div className="text-center mt-6">
          <Link to="/" className="text-white/40 text-sm hover:text-gold-500 transition-colors flex items-center justify-center gap-2">
            &larr; Bosh sahifaga qaytish
          </Link>
        </div>
      </div>
    </div>
  );
}