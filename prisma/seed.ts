import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)

  // 1. Create a default CompanySettings
  const companySettings = await prisma.companySettings.upsert({
    where: { id: 'default' }, // Assuming we want a specific ID or we just create the first one
    update: {},
    create: {
      id: 'default',
      companyName: 'Hackathon Corp',
      costPerKm: 5.0,
      adminEmail: 'admin@hackathoncorp.com',
    },
  })
  console.log(`Created Company Settings with id: ${companySettings.id}`)

  // 2. Create an initial ADMIN user
  // (We use a fixed password 'admin123' for seed data)
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Clean up any existing admin user to prevent unique constraint conflicts on email/phone/username
  await prisma.user.deleteMany({
    where: {
      OR: [
        { email: 'admin@hackathoncorp.com' },
        { username: 'admin' },
        { phone: '1234567890' }
      ]
    }
  });
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hackathoncorp.com' },
    update: {},
    create: {
      email: 'admin@hackathoncorp.com',
      username: 'admin',
      name: 'System Admin',
      phone: '1234567890',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log(`Created Admin user with id: ${admin.id}`)

  console.log(`Seeding finished.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
