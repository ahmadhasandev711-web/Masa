import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { SessionService } from '../../../../infrastructure/auth/session.service';
import { PermissionCode } from '../../../../domain/staff/enums/permission.enum';
import { ListEventBookingsUseCase } from '../../../../application/bookings/use-cases/list-event-bookings.use-case';
import { prisma } from '../../../../infrastructure/db/prisma';
import { BookingsClient } from './bookings-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'إدارة الحجوزات والفعاليات | لوحة التحكم',
  description: 'متابعة وتأكيد طلبات الحجوزات والفعاليات الخاصة في المطعم والفروع',
};

export default async function AdminBookingsPage() {
  const session = await SessionService.getCurrent();
  if (!session) {
    redirect('/login');
  }

  try {
    await SessionService.requirePermission(PermissionCode.MANAGE_ORDERS);
  } catch {
    redirect('/admin');
  }

  const cookieStore = await cookies();
  const activeBranchId = cookieStore.get('resto_active_branch_id')?.value;

  const [bookings, branches] = await Promise.all([
    new ListEventBookingsUseCase().execute(),
    prisma.branch.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, nameAr: true },
      orderBy: { code: 'asc' },
    }),
  ]);

  return (
    <BookingsClient
      initialBookings={bookings}
      branches={branches}
      defaultBranchId={activeBranchId ?? 'ALL'}
    />
  );
}
