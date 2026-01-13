import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create sales persons
  const hashedPassword = await bcrypt.hash('password123', 10)

  const manager = await prisma.salesPerson.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      name: '山田太郎',
      email: 'manager@example.com',
      password: hashedPassword,
      department: '営業部',
      isManager: true,
    },
  })

  const salesPerson1 = await prisma.salesPerson.upsert({
    where: { email: 'tanaka@example.com' },
    update: {},
    create: {
      name: '田中一郎',
      email: 'tanaka@example.com',
      password: hashedPassword,
      department: '営業部',
      isManager: false,
    },
  })

  const salesPerson2 = await prisma.salesPerson.upsert({
    where: { email: 'suzuki@example.com' },
    update: {},
    create: {
      name: '鈴木花子',
      email: 'suzuki@example.com',
      password: hashedPassword,
      department: '営業部',
      isManager: false,
    },
  })

  console.log('Created sales persons:', { manager, salesPerson1, salesPerson2 })

  // Create customers
  const customer1 = await prisma.customer.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      companyName: '株式会社ABC',
      companyPerson: '佐藤部長',
      email: 'sato@abc.co.jp',
      address: '東京都千代田区1-1-1',
      phone: '03-1234-5678',
    },
  })

  const customer2 = await prisma.customer.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      companyName: '有限会社XYZ',
      companyPerson: '高橋課長',
      email: 'takahashi@xyz.co.jp',
      address: '大阪府大阪市2-2-2',
      phone: '06-9876-5432',
    },
  })

  const customer3 = await prisma.customer.upsert({
    where: { id: BigInt(3) },
    update: {},
    create: {
      companyName: '合同会社DEF',
      companyPerson: '伊藤主任',
      email: 'ito@def.co.jp',
      address: '福岡県福岡市3-3-3',
      phone: '092-1111-2222',
    },
  })

  console.log('Created customers:', { customer1, customer2, customer3 })

  // Create a daily report with visit records
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dailyReport = await prisma.dailyReport.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      reportDate: today,
      problem: '顧客ABCの予算承認が遅れている。来週までに対応策を検討する必要あり。',
      plan: '午前中にXYZ社訪問、午後はDEF社への提案書作成。',
      salesPerson: { connect: { id: salesPerson1.id } },
    },
  })

  // Create visit records
  await prisma.visitRecord.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      dailyReport: { connect: { id: dailyReport.id } },
      customer: { connect: { id: customer1.id } },
      visitTime: new Date('1970-01-01T10:00:00Z'),
      visitContent: '新製品の提案を行った。先方は興味を示しており、来週に詳細な見積もりを持参する予定。',
    },
  })

  await prisma.visitRecord.upsert({
    where: { id: BigInt(2) },
    update: {},
    create: {
      dailyReport: { connect: { id: dailyReport.id } },
      customer: { connect: { id: customer2.id } },
      visitTime: new Date('1970-01-01T14:30:00Z'),
      visitContent: '定期訪問。既存契約の更新について確認。問題なく継続予定。',
    },
  })

  // Create a manager comment
  await prisma.managerComment.upsert({
    where: { id: BigInt(1) },
    update: {},
    create: {
      dailyReport: { connect: { id: dailyReport.id } },
      manager: { connect: { id: manager.id } },
      coment: 'ABC社の件、私も同席しましょうか？必要であれば声をかけてください。',
    },
  })

  console.log('Created daily report with visit records and comment')

  console.log('Seeding completed!')
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
