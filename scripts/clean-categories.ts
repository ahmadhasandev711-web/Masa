import { prisma } from '../src/infrastructure/db/prisma';

async function main() {
  const result = await prisma.category.deleteMany({
    where: {
      products: { none: {} },
    },
  });

  console.log(`Deleted ${result.count} empty test categories.`);

  const remaining = await prisma.category.findMany({
    select: { id: true, nameAr: true, nameEn: true, _count: { select: { products: true } } },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Remaining categories count:', remaining.length);
  console.log(remaining);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
