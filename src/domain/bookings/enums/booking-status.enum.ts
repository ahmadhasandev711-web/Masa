export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { labelAr: string; labelEn: string; color: string }
> = {
  [BookingStatus.PENDING]: {
    labelAr: 'قيد المراجعة والانتظار',
    labelEn: 'Pending Review',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  [BookingStatus.CONFIRMED]: {
    labelAr: 'حجز مؤكد',
    labelEn: 'Confirmed',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  [BookingStatus.COMPLETED]: {
    labelAr: 'تمت المناسبة بنجاح',
    labelEn: 'Completed',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  [BookingStatus.CANCELLED]: {
    labelAr: 'ملغي',
    labelEn: 'Cancelled',
    color: 'bg-zinc-100 text-zinc-600 border-zinc-200',
  },
};
