import multer from 'multer'
import path from 'path'
import fs from 'fs'

const dirs = {
  video: path.resolve('uploads/videos'),
  photo: path.resolve('uploads/photos'),
  processed: path.resolve('uploads/processed'),
}
Object.values(dirs).forEach((d) => fs.mkdirSync(d, { recursive: true }))

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const kind = file.fieldname === 'video' ? 'video' : 'photo'
    cb(null, dirs[kind])
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.fieldname === 'video' ? '.mp4' : '.jpg')
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`)
  },
})

// XAVFSIZLIK: avval fayl turi umuman tekshirilmasdi — istalgan kishi "rasm" yoki
// "video" sifatida .html/.svg kabi fayl yuklab, /uploads/photos orqali (bu papka
// autentifikatsiyasiz ochiq) stored XSS hujumi qilishi mumkin edi.
//
// MUHIM: faqat brauzer yuborgan Content-Type sarlavhasiga tayanib bo'lmaydi — bu
// klient tomonidan har doim to'g'ri/aniq kelavermaydi (ko'p real holatlarda oddiy
// "application/octet-stream" sifatida keladi, hatto haqiqiy video/rasm fayli uchun
// ham), shuning uchun faqat shunga tayanish haqiqiy fayllarni asossiz rad etadi.
// Shu sabab, birinchi navbatda fayl KENGAYTMASI tekshiriladi (bu — xavfsizlik
// nuqtai nazaridan asosiy narsa: server .html/.svg faylni qanday Content-Type
// bilan xizmat qilishini aynan kengaytma hal qiladi). Agar brauzer aniq va mos
// keladigan MIME turini yuborgan bo'lsa, bu qo'shimcha tekshiruv sifatida ham
// hisobga olinadi, lekin umumiy/octet-stream tur rad etish uchun sabab bo'lmaydi.
const ALLOWED_PHOTO_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_VIDEO_EXT = ['.mp4', '.mov', '.webm', '.mkv'];
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska'];
const GENERIC_MIME_TYPES = ['application/octet-stream', ''];

function fileFilter(req, file, cb) {
  const isVideoField = file.fieldname === 'video';
  const allowedExt = isVideoField ? ALLOWED_VIDEO_EXT : ALLOWED_PHOTO_EXT;
  const allowedTypes = isVideoField ? ALLOWED_VIDEO_TYPES : ALLOWED_PHOTO_TYPES;
  const errorMsg = isVideoField
    ? "Faqat MP4/MOV/WEBM formatidagi video ruxsat etiladi"
    : "Faqat JPG/PNG/WEBP formatidagi rasm ruxsat etiladi";

  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExt.includes(ext)) {
    return cb(new Error(errorMsg));
  }
  // Agar brauzer aniq (umumiy bo'lmagan) MIME tur yuborgan bo'lsa va u ruxsat
  // etilganlar ro'yxatida bo'lmasa — bu shubhali (masalan .mp4 deb nomlangan,
  // lekin aslida text/html bo'lgan fayl) va rad etiladi.
  if (!GENERIC_MIME_TYPES.includes(file.mimetype) && !allowedTypes.includes(file.mimetype)) {
    return cb(new Error(errorMsg));
  }
  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
})

export { dirs }
