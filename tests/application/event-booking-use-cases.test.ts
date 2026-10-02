import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/infrastructure/db/prisma';
import { CreateEventBookingUseCase } from '../../src/application/bookings/use-cases/create-event-booking.use-case';
import { ListEventBookingsUseCase } from '../../src/application/bookings/use-cases/list-event-bookings.use-case';
import { UpdateBookingStatusUseCase } from '../../src/application/bookings/use-cases/update-booking-status.use-case';
import { BookingStatus } from '../../src/domain/bookings/enums/booking-status.enum';

describe('Event Booking Use Cases', () => {
  let branchId: string;
  const createdBookingIds: string[] = [];

  beforeAll(async () => {
    let branch = await prisma.branch.findFirst({ where: { isActive: true } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          code: 'TEST-BKG',
          nameAr: 'فرع الحجوزات التجريبي',
          nameEn: 'Test Booking Branch',
          phone: '01012345678',
          address: 'Cairo, Egypt',
          isActive: true,
        },
      });
    }
    branchId = branch.id;
  });

  afterAll(async () => {
    if (createdBookingIds.length > 0) {
      await prisma.eventBooking.deleteMany({
        where: { id: { in: createdBookingIds } },
      });
      await prisma.customer.deleteMany({
        where: { phone: { in: ['+201088776655', '+201122334455'] } },
      });
    }
  });

  it('creates an event booking with normalized phone and returns WhatsApp link', async () => {
    const useCase = new CreateEventBookingUseCase();
    const result = await useCase.execute({
      customerName: 'حجز تجريبي آلي',
      customerPhone: '01088776655',
      guestsCount: 25,
      eventDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      branchId,
      notes: 'حفل تخرج عائلي مع طاولة VIP',
    });

    createdBookingIds.push(result.id);

    expect(result.id).toBeDefined();
    expect(result.booking.customerName).toBe('حجز تجريبي آلي');
    expect(result.booking.customerPhone).toBe('+201088776655');
    expect(result.booking.guestsCount).toBe(25);
    expect(result.booking.status).toBe(BookingStatus.PENDING);
    expect(result.whatsappUrl).toContain('https://wa.me/');

    // Verify automatically registered in centralized CRM
    const customerInDb = await prisma.customer.findUnique({
      where: { phone: '+201088776655' },
    });
    expect(customerInDb).not.toBeNull();
    expect(customerInDb?.fullName).toBe('حجز تجريبي آلي');
  });

  it('lists bookings with branch and status filtering', async () => {
    const listUseCase = new ListEventBookingsUseCase();
    const bookings = await listUseCase.execute({ branchId, status: BookingStatus.PENDING });

    expect(bookings.length).toBeGreaterThan(0);
    const item = bookings[0];
    expect(item.branchId).toBe(branchId);
    expect(item.status).toBe(BookingStatus.PENDING);
    expect(item.branch.nameAr).toBeDefined();
  });

  it('updates booking status smoothly', async () => {
    const createUseCase = new CreateEventBookingUseCase();
    const created = await createUseCase.execute({
      customerName: 'حجز تجريبي للتحديث',
      customerPhone: '01122334455',
      guestsCount: 15,
      eventDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      branchId,
    });

    createdBookingIds.push(created.id);

    const updateUseCase = new UpdateBookingStatusUseCase();
    await updateUseCase.execute({
      bookingId: created.id,
      status: BookingStatus.CONFIRMED,
    });

    const check = await prisma.eventBooking.findUnique({ where: { id: created.id } });
    expect(check?.status).toBe(BookingStatus.CONFIRMED);
  });
});
