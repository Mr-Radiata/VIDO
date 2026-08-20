import React from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React tizimidagi xatolik:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-ink-900 flex flex-col items-center justify-center px-4 text-center">
          <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20 shadow-xl">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-white mb-3">Kutilmagan xatolik yuz berdi</h1>
          <p className="text-white/50 text-sm max-w-md mx-auto mb-8 leading-relaxed">
            Tizimda qandaydir nosozlik yuzaga keldi. Iltimos, sahifani yangilang yoki birozdan so'ng qayta urinib ko'ring.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="flex items-center justify-center gap-2 bg-gold-500 text-ink-950 px-8 py-3.5 rounded-full font-bold transition-transform hover:scale-105 shadow-gold"
          >
            <RefreshCcw size={18} /> Sahifani yangilash
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}