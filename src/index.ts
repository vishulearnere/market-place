import 'dotenv/config'
import express, { Request, Response, json } from 'express'
import path from 'path'
import user from './routes/v1/user.js'
import product from './routes/v1/products.js'
import shop from './routes/v1/shop.js'
import { prisma } from './lib/prisma.js'
// import {Prisma} from '@prisma/client'
import bodyParser from 'body-parser'


import helmet from 'helmet'
import rateLimiter from 'express-rate-limit'
import cors from 'cors'
import xss from 'xss-clean'


import swaggerUI from 'swagger-ui-express'
import YAML from 'yamljs'

const swaggerPath = path.resolve(process.cwd(), 'swagger.yaml')
const swaggerDocument = YAML.load(swaggerPath)
const app = express()

// app.use(cors(configureCors()))

app.set('trust proxy', 1)
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  }),
)
app.use(json())

app.use(helmet())
app.use(cors())
// app.use(xss())
app.use(
  express.urlencoded({
    extended: true,
  }),
)
app.use(express.json())
app.use(bodyParser.json())
app.use(express.static('public'))


app.get('/', (req, res) => {
  res
    .status(200)
    .send(
      '<h1>Hello Vishal</h1> <h2>MarketPlace API</h2><a href="/api-docs">Documentation</a>',
    )
})

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument))

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

const PORT = process.env.PORT || 9000
async function startService() {
  try {
    await prisma.$connect()
    await prisma.$queryRawUnsafe('SELECT 1')
    console.log('Database connected successfully')
    const server = app.listen(PORT, () => {
      console.log(`All dependencies loaded. Node app running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start service:', error)
    process.exit(1)
  }
}
startService()
