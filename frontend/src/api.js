// Vite'da .env faylidan o'zgaruvchilarni olish (agar mavjud bo'lmasa, api.getvido.uz ni ishlatadi)
const BASE_URL = import.meta.env.VITE_API_URL || 'https://getvido.uz';

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = { ...options.headers };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    if (options.body) {
      options.body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  
  // Matnli xatoliklarni to'g'ri ushlab olish uchun JSON tahlil
  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error("Serverdan noto'g'ri formatdagi javob keldi");
  }
  
  if (!res.ok) {
    throw new Error(data.error || 'Server xatoligi');
  }
  
  return data;
};

// frontend/src/api.js ichidagi fileUrl funksiyasi
export const fileUrl = (path, type = 'avatar') => {
  if (!path) {
    return type === 'cover' ? '/placeholder-banner.jpg' : '/placeholder.jpg';
  }
  if (path.startsWith('http') || path.startsWith('/placeholder')) return path;
  
  let cleanPath = path.replace(/\\/g, '/');
  if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;
  
  const baseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  return `${baseUrl}${cleanPath}`;
};

export const normalizeStar = (star) => {
  if (!star) return null;
  return {
    ...star, 
    id: star.user_id || star.id,
    name: star.name,
    // Ikkala ehtimoliy nomni ham kiritib ketamiz:
    avatar: star.avatar_url || star.avatar,
    cover: star.cover_url || star.cover,
    bio: star.bio || '',
    price: parseFloat(star.price) || 0,
    category: star.category || 'actors',
    rating: parseFloat(star.rating) || 0,
    verified: star.verified || false,
    is_active: star.is_active === false || star.is_active === 'false' ? false : true,
    weekly_limit: parseInt(star.weekly_limit) || 5,
    unavailable_reason: star.unavailable_reason || 'Dam olishdaman',
    inactive_since: star.inactive_since || null,
    verification_status: star.verification_status || 'idle',
    verification_message: star.verification_message || '',
    verification_video: star.verification_video || null
  };
};

export const api = {
  login: (payload) => request('/api/auth/login', { method: 'POST', body: payload }),
  googleLogin: (token, acceptTerms) => request('/api/auth/google', { method: 'POST', body: { token, acceptTerms } }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me'),
  getNotifications: () => request('/api/auth/notifications'),
  markAsRead: (id) => request(`/api/auth/notifications/${id}/read`, { method: 'PUT' }),
  
  listStars: (category = '', q = '') => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (q) params.append('q', q);
    return request(`/api/stars?${params.toString()}`);
  },
  getStars: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/api/stars?${q}`);
  },
  getStar: (id) => request(`/api/stars/${id}`),
  updateProfile: (payload) => request('/api/stars/profile', { method: 'PUT', body: payload }),
  uploadVerification: (payload) => request('/api/stars/verify', { method: 'POST', body: payload }),

  createOrder: (payload) => request('/api/orders', { method: 'POST', body: payload }),
  myOrders: () => request('/api/orders/mine'), 
  
  // MANA SHU YERDA PUT -> POST QILIB O'ZGARTIRILDI (Fayl jo'natish POST orqali bo'lishi kerak)
  deliverOrder: (id, payload) => request(`/api/orders/${id}/deliver`, { method: 'POST', body: payload }),
  
  rejectOrder: (id, payload) => request(`/api/orders/${id}/reject`, { method: 'PUT', body: payload }),
  disputeOrder: (id, payload) => request(`/api/orders/${id}/dispute`, { method: 'PUT', body: payload }),
  verify: (orderId) => request(`/api/verify/${orderId}`),

  checkout: (orderId, provider = 'internal') => request('/api/payments/checkout', { method: 'POST', body: { orderId, provider } }),
  getBalance: () => request('/api/payments/balance'),
  getTransactions: () => request('/api/payments/transactions'),
  requestWithdrawal: (amount) => request('/api/payments/withdraw', { method: 'POST', body: { amount } }),
  
  submitReview: (payload) => request('/api/reviews', { method: 'POST', body: payload }),
  
  getAdminStats: () => request('/api/admin/stats'),
  getAdminUsers: () => request('/api/admin/users'),
  getAdminUserDetails: (id) => request(`/api/admin/users/${id}`),
  getPendingVerifications: () => request('/api/admin/pending'),
  banUser: (id, status) => request(`/api/admin/users/${id}/ban`, { method: 'PUT', body: { is_banned: status } }),
  approveStar: (id) => request(`/api/admin/stars/${id}/approve`, { method: 'PUT' }),
  rejectVerification: (id, payload) => request(`/api/admin/stars/${id}/reject-verification`, { method: 'POST', body: payload }),
  getAdminReviews: () => request('/api/admin/reviews'),
  getAdminOrders: () => request('/api/admin/orders'),
  resolveDispute: (id, payload) => request(`/api/admin/orders/${id}/resolve`, { method: 'PUT', body: payload }),
  deleteReview: (id) => request(`/api/admin/reviews/${id}`, { method: 'DELETE' }),
  sendNotification: (payload) => request('/api/admin/notifications', { method: 'POST', body: payload }),
  getNotificationHistory: () => request('/api/admin/notifications/history'),

  getTickets: () => request('/api/support'),
  getTicketDetails: (id) => request(`/api/support/${id}`),
  createTicket: (payload) => request('/api/support', { method: 'POST', body: payload }),
  replyTicket: (id, payload) => request(`/api/support/${id}/reply`, { method: 'POST', body: payload }),
  closeTicket: (id) => request(`/api/support/${id}/close`, { method: 'PUT' }),
  markTicketAsRead: (id) => request(`/api/support/${id}/read`, { method: 'PUT' })
};