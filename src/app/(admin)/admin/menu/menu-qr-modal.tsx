'use client';

import { useMemo, useState } from 'react';
import { QrCode, Printer, Download, Copy, Check, X, Sparkles, Utensils, Phone, Globe } from 'lucide-react';
import { encodeQrSvg } from '../../../../infrastructure/qr/qr-code';

interface MenuQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantNameAr: string;
  restaurantNameEn: string;
  branches: { id: string; nameAr: string; phone: string }[];
}

type TemplateType = 'stand' | 'card';

export function MenuQrModal({
  isOpen,
  onClose,
  restaurantNameAr,
  restaurantNameEn,
  branches,
}: MenuQrModalProps) {
  const [selectedBranchId] = useState(branches[0]?.id ?? '');
  const [template, setTemplate] = useState<TemplateType>('stand');
  const [copied, setCopied] = useState(false);

  // Compute live full URL on client
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qahwetcairo.com';
  const menuUrl = useMemo(() => {
    return `${origin}/menu`;
  }, [origin]);

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const qrSvg = useMemo(() => {
    return encodeQrSvg(menuUrl, 320);
  }, [menuUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QahwetCairo_Menu_QR_${activeBranch?.nameAr || 'General'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header (Hidden in Print) */}
        <header className="flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-xs">
              <QrCode size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">رمز QR للمنيو الرقمي والدعاية</h2>
              <p className="text-xs text-zinc-500">طباعة ستاندات الطاولات وكروت الدعاية للمطعم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="grid size-9 place-items-center rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
          >
            <X size={18} />
          </button>
        </header>

        {/* Controls Toolbar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-xs print:hidden">
          {/* Template Switch */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-1">
            <button
              onClick={() => setTemplate('stand')}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                template === 'stand'
                  ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              حامل طاولة أكريليك
            </button>
            <button
              onClick={() => setTemplate('card')}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                template === 'card'
                  ? 'bg-zinc-900 text-white font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              كارت دعاية وترويج
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              title="نسخ الرابط"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
            <button
              onClick={handleDownloadSvg}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              title="تحميل SVG عالي الدقة"
            >
              <Download size={14} />
              <span>تحميل SVG</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800"
            >
              <Printer size={14} />
              <span>طباعة فورية</span>
            </button>
          </div>
        </div>

        {/* Live Printable Preview Area */}
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center bg-zinc-100/60 print:bg-white print:p-0">
          {/* Printable Container */}
          <div id="printable-qr-area" className="w-full flex justify-center">
            {template === 'stand' ? (
              /* Stand Display (Vertical Acrylic Table Tent Layout) */
              <div className="w-[320px] rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg text-center flex flex-col items-center print:shadow-none print:border-2 print:border-black print:w-[360px]">
                {/* Brand */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 text-white shadow-xs">
                    <Utensils size={15} strokeWidth={2.2} />
                  </div>
                  <span className="text-lg font-black tracking-wide text-zinc-950">
                    {restaurantNameAr}
                  </span>
                </div>
                <p className="text-3xs font-bold tracking-widest text-zinc-400 uppercase font-mono mb-4">
                  {restaurantNameEn} · FINE DINING & GRILL
                </p>

                {/* Subtitle */}
                <div className="mb-4 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-2xs font-semibold text-amber-900 flex items-center gap-1">
                  <Sparkles size={11} className="text-amber-600" />
                  <span>تصفح المنيو الرقمي واطلب وجبتك</span>
                </div>

                {/* QR Code Container */}
                <div className="p-3.5 rounded-2xl border-2 border-zinc-900 bg-white shadow-xs mb-4 text-zinc-950 flex items-center justify-center">
                  <div
                    className="w-48 h-48 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                </div>

                {/* Scan Instruction */}
                <p className="text-xs font-bold text-zinc-900 mb-1">
                  وجّه كاميرا هاتفك لمسح الرمز
                </p>
                <p className="text-3xs text-zinc-500 mb-4 max-w-[240px]">
                  بدون أي تطبيقات إضافية · متاح الدفع الإلكتروني والاستلام الفوري
                </p>

                {/* Footer details */}
                <div className="w-full border-t border-zinc-100 pt-3 flex items-center justify-between text-3xs text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Globe size={11} />
                    <span>{menuUrl.replace(/^https?:\/\//, '')}</span>
                  </span>
                  {activeBranch?.phone && (
                    <span className="flex items-center gap-1" dir="ltr">
                      <Phone size={11} />
                      <span>{activeBranch.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              /* Marketing Card (Pocket / Delivery Box Flyer Layout) */
              <div className="w-[360px] sm:w-[420px] rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg flex items-center gap-5 text-right print:shadow-none print:border-2 print:border-black">
                {/* QR Box */}
                <div className="shrink-0 p-2.5 rounded-xl border border-zinc-900 bg-white text-zinc-950">
                  <div
                    className="w-28 h-28 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                </div>

                {/* Text details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-extrabold text-zinc-950">{restaurantNameAr}</span>
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-3xs text-zinc-500 font-mono">
                      DELIVERY
                    </span>
                  </div>
                  <p className="text-xs font-bold text-zinc-800 mb-1">
                    اطلب وجبتك المفضلة أونلاين
                  </p>
                  <p className="text-3xs text-zinc-500 leading-relaxed mb-3">
                    امسح الرمز بكاميرا الجوال للوصول السريع إلى قائمة طعامنا وتتبع طلبك مباشرة.
                  </p>
                  <div className="flex items-center justify-between text-3xs text-zinc-600 font-mono border-t border-zinc-100 pt-2">
                    <span dir="ltr">{activeBranch?.phone || '01012345678'}</span>
                    <span>{menuUrl.replace(/^https?:\/\//, '')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info note */}
        <footer className="border-t border-zinc-100 bg-white px-5 py-3 text-center text-3xs text-zinc-400 print:hidden">
          يمكنك طباعة هذا التصميم مباشرة على ورق A4 أو كرتون مقوى واستخدامه فورياً على الطاولات أو في كروت الترويج
        </footer>
      </div>
    </div>
  );
}
