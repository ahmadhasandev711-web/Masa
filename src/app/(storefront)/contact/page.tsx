import { prisma } from '../../../infrastructure/db/prisma';
import { ContactClient } from './contact-client';

export const metadata = {
  title: 'تواصل معنا | فروعنا وأرقام الخدمة',
  description: 'تواصل معنا مباشرة، تعرف على فروعنا وأرقام الخدمة ومواعيد العمل.',
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
      restaurantNameAr={setting?.nameAr ?? 'المطعم'}
      restaurantNameEn={setting?.nameEn ?? 'Restaurant'}
      phone={setting?.phone}
      address={setting?.address}
    />
  );
}
