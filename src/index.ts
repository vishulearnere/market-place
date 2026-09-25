import 'dotenv/config'
import express, { Request, Response } from 'express'
import user from './routes/v1/user.js'
import product from './routes/v1/products.js'
import shop from './routes/v1/shop.js'
import { prisma } from './lib/prisma.js'
// import {Prisma} from '@prisma/client'
import bodyParser from 'body-parser'
const app = express()

// app.use(cors(configureCors()))
app.use(
  express.urlencoded({
    extended: true,
  }),
)
app.use(express.json())
app.use(bodyParser.json())
app.use(express.static('public'))
app.use('/v1/user', user)
app.use('/v1/shop', shop)
app.use('/v1/product', product)
// app.use('/v1/order', order)

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'App is live and running!',
    uptime: process.uptime(),
  })
})

async function startService() {
  try {
    await prisma.$connect()
    await prisma.$queryRawUnsafe('SELECT 1')
    console.log('Database connected successfully')
    const server = app.listen(9000, () => {
      console.log('All dependencies loaded. Node app running on port 9000')
    })
  } catch (error) {
    console.error('Failed to start service:', error)
    process.exit(1)
  }
}
startService()
