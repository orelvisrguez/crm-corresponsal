import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.corresponsal.count()
    console.log('SUCCESS: Database connection is working. Corresponsales count:', count)
  } catch (error) {
    console.error('ERROR CONNECTING TO DATABASE:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
