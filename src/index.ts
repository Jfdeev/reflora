import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import auth from './middlewares/auth'
import privateRoutes from './routes/private'
import publicRoutes from './routes/public'
const app = express()
app.use(cors());
app.use(express.json())
app.use('/api', publicRoutes)
app.use('/api', auth, privateRoutes)
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`✅ API rodando em http://localhost:${PORT}/api`)
})
