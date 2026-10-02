import { prisma } from '../../../infrastructure/db/prisma';
import { UpdateBookingStatusInput, UpdateBookingStatusSchema } from '../dto/event-booking.dto';
import { NotFoundError } from '../../../domain/shared/errors/domain-error';

export class UpdateBookingStatusUseCase {
  async execute(rawInput: UpdateBookingStatusInput) {
    const input = UpdateBookingStatusSchema.parse(rawInput);

    const booking = await prisma.eventBooking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking) {
      throw new NotFoundError('EventBooking', input.bookingId);
    }

    const updated = await prisma.eventBooking.update({
      where: { id: input.bookingId },
      data: { status: input.status },
      include: {
        branch: {
          select: {
            id: true,
            code: true,
            nameAr: true,
          },
        },
      },
    });

    return updated;
  }
}
