import { prisma } from '../../../infrastructure/db/prisma';
import { ContactClient } from './contact-client';

export const metadata = {
  title: 'تواصل معنا وحجز المناسبات | MASA Restaurant',
  description: 'تواصل مع إدارة مطعم ماسا أو احجز مناسبتك الخاصة وبوفيهات الكيترينج الفاخرة.',
};

export default async function ContactPage() {
  const [branches, setting] = await Promise.all([
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, nameAr: true, nameEn: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.restaurantSetting.findFirst(),
  ]);

  return (
    <ContactClient
      branches={branches}
      restaurantNameAr={setting?.nameAr ?? 'ماسا'}
      restaurantNameEn={setting?.nameEn ?? 'MASA'}
      phone={setting?.phone}
      address={setting?.address}
    />
  );
}
