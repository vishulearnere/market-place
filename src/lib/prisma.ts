import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
// Note: Depending on your Prisma 7 generator config, the import path might be '@/generated/prisma/client'
import { PrismaClient } from '../generated/prisma/client.js'

const connectionString = process.env.DATABASE_URL

// 1. Configure the Connection Pool
const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of concurrent database connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds to save memory
  connectionTimeoutMillis: 5000, // Throw an error if a query waits >5 seconds for a connection
  ssl: {
    rejectUnauthorized: false, // Forces SSL encryption but accepts the AWS certificate
  },
})

// 2. Attach the pool to Prisma's Driver Adapter
const adapter = new PrismaPg(pool)

// 3. Export the Prisma singleton
export const prisma = new PrismaClient({ adapter })
