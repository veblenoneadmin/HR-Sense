/**
 * Seed script — run with: npm run db:seed
 * Creates initial departments and HR settings from EverSense org data.
 */
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding HR-Sense database...')

  const orgId = process.env.EVERSENSE_ORG_ID
  if (!orgId) throw new Error('EVERSENSE_ORG_ID env var required')

  // HR Settings
  await prisma.hrSettings.upsert({
    where: { orgId },
    update: {},
    create: {
      orgId,
      eversenseApiUrl: process.env.EVERSENSE_API_URL ?? '',
      overtimeThreshold: 40,
      workingHoursPerDay: 8,
      currency: 'USD',
      fiscalYearStart: 1,
    },
  })
  console.log('✓ HR settings')

  // Departments
  const departments = [
    { name: 'Engineering' },
    { name: 'Product' },
    { name: 'Operations' },
    { name: 'Marketing' },
    { name: 'Sales' },
    { name: 'HR' },
    { name: 'Finance' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: { ...dept, orgId },
    })
  }
  console.log('✓ Departments')

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
