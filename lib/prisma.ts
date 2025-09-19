import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Connection pooling optimization
  // __internal: {
  //   engine: {
  //     connectTimeout: 10000,
  //     poolTimeout: 20000,
  //     maxConnections: 20
  //   }
  // }
})

// Optimize for production
if (process.env.NODE_ENV === 'production') {
  // Enable connection pooling
  prisma.$connect()
}

export default prisma
