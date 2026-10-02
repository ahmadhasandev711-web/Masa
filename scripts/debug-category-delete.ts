import { prisma } from '../src/infrastructure/db/prisma';

async function main() {
  const cat = await prisma.category.findUnique({
    where: { id: '004d14e5-c8c5-4d91-9ee7-f8fa765c723d' },
    include: { products: true },
  });
  console.log('Category products:', cat?.products);

  if (cat?.products) {
    for (const p of cat.products) {
      console.log('Deleting product:', p.id);
      await prisma.recipeItem.deleteMany({ where: { productId: p.id } });
      await prisma.productSize.deleteMany({ where: { productId: p.id } });
      await prisma.product.delete({ where: { id: p.id } });
    }
  }

  await prisma.category.delete({ where: { id: '004d14e5-c8c5-4d91-9ee7-f8fa765c723d' } });
  console.log('Category deleted successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error during deletion:', err);
    process.exit(1);
  });
