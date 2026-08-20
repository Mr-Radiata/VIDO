import { useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { ShieldCheck } from 'lucide-react'
import logo from '../assets/logo.png'

/**
 * Har bir video uchun noyob, VIDO brendiga mos QR kod hosil qiladi
 * (zangori→tilla gradient nuqtalar, dumaloq burchaklar, markazda logotip) —
 * backend videoning o'ziga "kuydiradigan" QR bilan bir xil uslubda.
 * Skanerlash orqali foydalanuvchi /verify/:orderId sahifasiga yo'naltiriladi —
 * u yerda videoning kim tomonidan, kim uchun yaratilganligi ko'rsatiladi.
 * Bu videoning o'g'irlanishi yoki boshqa joyda noqonuniy ishlatilishining oldini oladi.
 */
export default function QRGenerator({ value, size = 96, label = true }) {
  const ref = useRef(null)
  const qrInstance = useRef(null)

  useEffect(() => {
    if (!value) return

    if (!qrInstance.current) {
      qrInstance.current = new QRCodeStyling({
        width: size,
        height: size,
        data: value,
        image: logo,
        dotsOptions: {
          type: 'dots',
          gradient: {
            type: 'linear',
            colorStops: [
              { offset: 0, color: '#06b6d4' }, // Zangori (Cyan)
              { offset: 1, color: '#facc15' }, // Tilla (Gold)
            ],
          },
        },
        cornersSquareOptions: { type: 'extra-rounded', color: '#1a1a24' },
        cornersDotOptions: { type: 'dot', color: '#facc15' },
        backgroundOptions: { color: 'rgba(255,255,255,0.95)' },
        imageOptions: {
          crossOrigin: 'anonymous',
          margin: 4,
          imageSize: 0.45,
          hideBackgroundDots: true,
        },
      })
      if (ref.current) qrInstance.current.append(ref.current)
    } else {
      qrInstance.current.update({ data: value, width: size, height: size })
    }
  }, [value, size])

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="p-2 bg-white rounded-lg shadow-gold" ref={ref} />
      {label && (
        <span className="flex items-center gap-1 text-[11px] text-white/50">
          <ShieldCheck size={12} className="text-neon-cyan" />
          VIDO tomonidan tasdiqlangan
        </span>
      )}
    </div>
  )
}
