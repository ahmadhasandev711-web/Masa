'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Calendar, Users, Phone, User, MessageSquare, ExternalLink, Loader2 } from 'lucide-react';
import { useCart } from '../cart-context';
import { createEventBookingAction } from '../../actions/booking.actions';

interface BranchOption {
  id: string;
  nameAr: string;
  nameEn: string;
}

export function ContactForm({ branches }: { branches: BranchOption[] }) {
  const { locale } = useCart();
  const isAr = locale === 'ar';

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState(10);
  const [eventDate, setEventDate] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{ id: string; whatsappUrl: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await createEventBookingAction({
        customerName,
        customerPhone,
        guestsCount: Number(guestsCount),
        eventDate,
        branchId,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setError(res.error || (isAr ? 'حدث خطأ أثناء حفظ الحجز' : 'Failed to save booking'));
        return;
      }

      setSubmittedData(res.data);
      // Automatically open WhatsApp in a new tab
      if (res.data.whatsappUrl) {
        window.open(res.data.whatsappUrl, '_blank');
      }
    } catch {
      setError(isAr ? 'حدث خطأ غير متوقع، يرجى المحاولة ثانية' : 'Unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmittedData(null);
    setCustomerName('');
    setCustomerPhone('');
    setGuestsCount(10);
    setEventDate('');
    setNotes('');
  };

  if (submittedData) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-950/30 p-8 text-center text-emerald-300 space-y-4">
        <CheckCircle2 size={44} className="mx-auto text-emerald-400" />
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            {isAr ? 'تم تسجيل طلب الحجز بنجاح!' : 'Booking Inquiry Registered Successfully!'}
          </h3>
          <p className="text-xs font-mono text-amber-400">
            {isAr ? 'رقم الحجز المسجل بالمنظومة: ' : 'System Booking ID: '}
            <span className="font-bold underline">{submittedData.id.slice(0, 8).toUpperCase()}</span>
          </p>
        </div>
        <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
          {isAr
            ? 'تم حفظ بياناتك بنجاح في قاعدة بيانات المطعم، وجارٍ فتح محادثة واتساب الرسمية للتنسيق الفوري مع مدير الحفلات.'
            : 'Your inquiry has been stored in our system and WhatsApp has been initiated for direct coordination with our catering manager.'}
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <a
            href={submittedData.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <MessageSquare size={14} />
            <span>{isAr ? 'فتح محادثة واتساب مجدداً' : 'Open WhatsApp Chat'}</span>
            <ExternalLink size={12} />
          </a>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition"
          >
            {isAr ? 'إرسال حجز آخر' : 'Submit Another Request'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
          <span className="flex items-center gap-1.5">
            <User size={13} className="text-amber-500" />
            {isAr ? 'الاسم الكامل' : 'Full Name'}
          </span>
          <input
            type="text"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={isAr ? 'مثال: أحمد محمود' : 'e.g. John Smith'}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 placeholder:text-zinc-600"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Phone size={13} className="text-amber-500" />
            {isAr ? 'رقم الهاتف للتواصل' : 'Contact Phone Number'}
          </span>
          <input
            type="tel"
            required
            dir="ltr"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder={isAr ? '01012345678' : '+201012345678'}
            className={`w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 placeholder:text-zinc-600 font-mono ${
              isAr ? 'text-right' : 'text-left'
            }`}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Users size={13} className="text-amber-500" />
            {isAr ? 'عدد الضيوف' : 'Expected Guests'}
          </span>
          <input
            type="number"
            min="2"
            max="1000"
            required
            value={guestsCount}
            onChange={(e) => setGuestsCount(Math.max(2, parseInt(e.target.value) || 2))}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} className="text-amber-500" />
            {isAr ? 'تاريخ الفعالية' : 'Event Date'}
          </span>
          <input
            type="date"
            required
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 font-mono"
          />
        </label>

        <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
          <span>{isAr ? 'الفرع المفضل' : 'Preferred Branch'}</span>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-zinc-950 text-white">
                {isAr ? b.nameAr : b.nameEn}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1.5 text-xs font-medium text-zinc-300">
        <span className="flex items-center gap-1.5">
          <MessageSquare size={13} className="text-amber-500" />
          {isAr ? 'تفاصيل المناسبة أو رغبات خاصة' : 'Event Details & Custom Requests'}
        </span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            isAr
              ? 'أخبرنا عن نوع المناسبة (حفل عمل، عيد ميلاد، عزومة عائلية...) أو أطباق معينة تفضلها'
              : 'Tell us about the event type (corporate banquet, birthday, family dinner) or specific menu requests'
          }
          className="w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500 placeholder:text-zinc-600"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 py-3 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50 transition"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>{isAr ? 'جارٍ تسجيل الحجز...' : 'Registering Booking...'}</span>
          </>
        ) : (
          <>
            <Send size={14} />
            <span>
              {isAr
                ? 'إرسال طلب الحجز وفتح واتساب المباشر'
                : 'Submit Booking & Open WhatsApp Chat'}
            </span>
          </>
        )}
      </button>
    </form>
  );
}
