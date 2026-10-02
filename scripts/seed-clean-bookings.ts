import { prisma } from '../src/infrastructure/db/prisma';

async function main() {
  await prisma.eventBooking.deleteMany();
  
  const mainBranch = await prisma.branch.findUnique({ where: { code: 'MAIN-01' } });
  const tagBranch = await prisma.branch.findUnique({ where: { code: 'TAG-02' } });
  const nasrBranch = await prisma.branch.findUnique({ where: { code: 'NASR-03' } });

  // 1. Dr. Tarek El-Awady
  const cust1 = await prisma.customer.upsert({
    where: { phone: '+201011223344' },
    update: { fullName: 'د. طارق العوضي' },
    create: {
      phone: '+201011223344',
      fullName: 'د. طارق العوضي',
      notes: 'عميل VIP - فعاليات ومناسبات',
    },
  });

  if (mainBranch) {
    await prisma.eventBooking.create({
      data: {
        customerId: cust1.id,
        customerName: 'د. طارق العوضي',
        customerPhone: '+201011223344',
        guestsCount: 20,
        eventDate: new Date('2026-10-12'),
        branchId: mainBranch.id,
        status: 'PENDING',
        notes: 'عشاء عمل واستقبال وفد طبي في التراس الخارجي',
      },
    });
  }

  // 2. Eng. Yasmine El-Sherif
  const cust2 = await prisma.customer.upsert({
    where: { phone: '+201099887711' },
    update: { fullName: 'م. ياسمين الشريف' },
    create: {
      phone: '+201099887711',
      fullName: 'م. ياسمين الشريف',
      notes: 'مسؤولة فعاليات شركات وبوفيهات مفتوحة',
    },
  });

  if (tagBranch) {
    await prisma.eventBooking.create({
      data: {
        customerId: cust2.id,
        customerName: 'م. ياسمين الشريف',
        customerPhone: '+201099887711',
        guestsCount: 35,
        eventDate: new Date('2026-10-18'),
        branchId: tagBranch.id,
        status: 'CONFIRMED',
        notes: 'احتفال سنوي للشركة مع بوفيه شواء ومحطة طهي مباشر',
      },
    });
  }

  // 3. Mr. Karim El-Menshawy
  const cust3 = await prisma.customer.upsert({
    where: { phone: '+201155443322' },
    update: { fullName: 'أ. كريم المنشاوي' },
    create: {
      phone: '+201155443322',
      fullName: 'أ. كريم المنشاوي',
      notes: 'حفلات تخرج ومناسبات عائلية',
    },
  });

  if (nasrBranch) {
    await prisma.eventBooking.create({
      data: {
        customerId: cust3.id,
        customerName: 'أ. كريم المنشاوي',
        customerPhone: '+201155443322',
        guestsCount: 15,
        eventDate: new Date('2026-10-25'),
        branchId: nasrBranch.id,
        status: 'PENDING',
        notes: 'حفل تخرج عائلي مع كعكة احتفالية وطاولة VIP',
      },
    });
  }

  console.log('Bookings and centralized CRM customers synced successfully.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
