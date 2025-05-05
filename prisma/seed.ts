import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: 'admin@packyourbags.com'
    }
  })

  if (!existingAdmin) {
    // const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminpassword = process.env.ADMIN_PASSWORD || "defaultPassword";

    
    const hashedPassword = await bcrypt.hash(adminpassword, 10)

    
    
    await prisma.user.create({
      data: {
        email: 'admin@packyourbags.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: true,
        phone: '+96399596071'
      }
    })
    
    console.log('Admin user created successfully')
  } else {
    console.log('Admin user already exists')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })