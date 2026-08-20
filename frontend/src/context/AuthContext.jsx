import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client' 
import { api, setToken } from '../api'

const AuthContext = createContext(null)

// Socket.io ulanish manzili (Vite muhitidan olinadi)
const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://getvido.uz'
export const socket = io(SOCKET_URL, { autoConnect: false }) 

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) 

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  // JONLI ALOQA (SOCKET.IO) MANTIG'I
  useEffect(() => {
    if (user && user.id) {
      // 1. Foydalanuvchi tizimga kirganda socket'ni yoqamiz
      socket.connect()
      
      // 2. Uni o'zining shaxsiy xonasiga kiritamiz
      socket.emit('join_room', user.id.toString())

      // 3. Backenddan "order_delivered" signalini kutamiz va alert chiqaramiz
      socket.on('order_delivered', (data) => {
        alert(`Ajoyib xabar! #${data.orderId} buyurtmangiz bo'yicha video tayyor bo'ldi!`);
      })

      // Video qayta ishlashda xatolik bo'lsa (masalan, ffmpeg xatosi), starga xabar beramiz
      socket.on('order_processing_failed', (data) => {
        alert(`Diqqat: #${data.orderId} buyurtmangiz uchun videoni qayta ishlashda xatolik yuz berdi. Iltimos, videoni qaytadan yuklab ko'ring.`);
      })

      // Komponent o'chganda (yoki user chiqqanda) quloq solishni to'xtatamiz
      return () => {
        socket.off('order_delivered')
        socket.off('order_processing_failed')
        socket.disconnect()
      }
    }
  }, [user])

  const register = async ({ name, email, password, role, acceptTerms }) => {
    const { token, user } = await api.register({ name, email, password, role, acceptTerms })
    setToken(token)
    setUser(user)
    return user
  }

  const login = async ({ email, password }) => {
    const { token, user } = await api.login({ email, password })
    setToken(token)
    setUser(user)
    return user
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    // Tizimdan chiqqanda jonli aloqani ham uzamiz
    socket.disconnect()
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}