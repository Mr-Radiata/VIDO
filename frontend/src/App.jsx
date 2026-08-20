import { Routes, Route } from 'react-router-dom'
import ClientLayout from './layouts/ClientLayout'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Profile from './pages/Profile'
import Auth from './pages/Auth'
import OrderCheckout from './pages/OrderCheckout'
import Dashboard from './pages/Dashboard'
import Verify from './pages/Verify'
import AdminDashboard from './pages/AdminDashboard'
import AdminUserDetails from './pages/AdminUserDetails'
import Terms from './pages/Terms'

export default function App() {
  return (
    <Routes>
      <Route element={<ClientLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse/:category" element={<Browse />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/verify/:orderId" element={<Verify />} />
        <Route path="/checkout/:starId" element={<OrderCheckout />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users/:id" element={<AdminUserDetails />} />
        <Route path="/terms" element={<Terms />} />
      </Route>
      {/* Dashboard manages its own layout since it differs by role (Client vs Star) */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}
