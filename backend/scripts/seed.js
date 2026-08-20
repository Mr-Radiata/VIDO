import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { pool } from '../src/db.js'

dotenv.config()

const demoPassword = await bcrypt.hash('demo1234', 10)

const stars = [
  { name: 'Sevara N.', email: 'sevara@vido.uz', category: 'singers', price: 250000, bio: "O'zbekistonning sevimli qo'shiqchisi. Muxlislarim uchun tug'ilgan kun, to'y va bayram tabriklarini ishtiyoq bilan tayyorlayman!", verified: true, trending: true, img: 47 },
  { name: 'Alisher U.', email: 'alisher@vido.uz', category: 'actors', price: 300000, bio: 'Teatr va kino aktyori. Har bir videoda kichik bir sahna o‘yini bilan kutilmagan tabrik sovg‘a qilaman.', verified: true, trending: true, img: 13 },
  { name: 'Jahongir O.', email: 'jahongir@vido.uz', category: 'bloggers', price: 220000, bio: 'Kundalik hayot va motivatsion kontent bloggeri.', verified: true, trending: true, img: 33 },
]

const occasions = ["Tug'ilgan kun", 'Nikoh to‘yi', 'Uzr so‘rash', 'Motivatsiya']

async function main() {
  for (const s of stars) {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [s.email])
    let userId = existing.rows[0]?.id

    if (!userId) {
      const avatar = `https://i.pravatar.cc/300?img=${s.img}`
      const userRes = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES ($1,$2,$3,'star',$4) RETURNING id`,
        [s.name, s.email, demoPassword, avatar]
      )
      userId = userRes.rows[0].id
      await pool.query(
        `INSERT INTO star_profiles (user_id, category, bio, price, cover_url, verified, trending)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userId, s.category, s.bio, s.price, `https://i.pravatar.cc/900?img=${s.img}`, s.verified, s.trending]
      )
      for (let i = 0; i < 6; i++) {
        await pool.query(
          `INSERT INTO portfolio_videos (star_id, thumbnail_url, occasion) VALUES ($1,$2,$3)`,
          [userId, `https://i.pravatar.cc/400?img=${s.img + (i % 5)}`, occasions[i % occasions.length]]
        )
      }
      console.log(`✓ ${s.name} qo'shildi (email: ${s.email}, parol: demo1234)`)
    } else {
      console.log(`– ${s.name} allaqachon mavjud`)
    }
  }

  await pool.end()
  console.log('Seed tugadi.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
