'use client';

import { useState } from 'react';
import { Save, CheckCircle2, Coins, Percent, Building } from 'lucide-react';
import { updateSettingsAction } from '../../../actions/settings.actions';

interface SettingData {
  id: string;
  nameAr: string;
  nameEn: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  taxRatePercent: number;
  deliveryFee: number;
  phone?: string | null;
  address?: string | null;
}

export function SettingsClient({ initialSettings }: { initialSettings: SettingData }) {
  const [formData, setFormData] = useState({
    nameAr: initialSettings.nameAr,
    nameEn: initialSettings.nameEn,
    currency: initialSettings.currency,
    currencySymbol: initialSettings.currencySymbol,
    locale: initialSettings.locale,
    taxRatePercent: Number(initialSettings.taxRatePercent),
    deliveryFee: initialSettings.deliveryFee,
    phone: initialSettings.phone ?? '',
    address: initialSettings.address ?? '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await updateSettingsAction({
        ...formData,
        currency: formData.currency.toUpperCase(),
        taxRatePercent: Number(formData.taxRatePercent),
        deliveryFee: Number(formData.deliveryFee),
      });
      if (!res.success) {
        setMessage({ type: 'error', text: res.error });
        return;
      }
      setMessage({ type: 'success', text: 'تم حفظ وتحديث إعدادات المطعم والعملة بنجاح!' });
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء حفظ الإعدادات',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900">إعدادات المنظومة وهوية المطعم</h2>
        <p className="text-xs text-zinc-500 mt-1">
          تخصيص هوية المطعم، العملة الأساسية، الضرائب، ورسوم التوصيل مباشرة وفق رغبة العميل
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Restaurant Identity Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Building className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
            <h3 className="font-semibold text-sm text-zinc-900">هوية وبيانات المطعم</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">الاسم التجاري (بالعربية)</label>
              <input
                type="text"
                required
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">الاسم التجاري (بالإنجليزية)</label>
              <input
                type="text"
                required
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">رقم الهاتف الرسمي</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">عنوان الإدارة الرئيسي</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
              />
            </div>
          </div>
        </div>

        {/* Currency & Financial Configuration Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Coins className="w-4 h-4 text-zinc-700" strokeWidth={1.75} />
            <h3 className="font-semibold text-sm text-zinc-900">إعدادات العملة والضرائب</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                العملة الأساسية (ISO Code)
              </label>
              <input
                type="text"
                required
                maxLength={3}
                placeholder="EGP"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono uppercase focus:outline-none focus:border-zinc-900"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">مثال: EGP, SAR, USD, AED</span>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">رمز العملة للعرض</label>
              <input
                type="text"
                required
                placeholder="ج.م"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:outline-none focus:border-zinc-900"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">يظهر في الفواتير وقائمة الطعام</span>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">لغة وتنسيق الأرقام (Locale)</label>
              <input
                type="text"
                required
                placeholder="ar-EG"
                value={formData.locale}
                onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono focus:outline-none focus:border-zinc-900"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">مثال: ar-EG, ar-SA, en-US</span>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                نسبة ضريبة القيمة المضافة (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={formData.taxRatePercent}
                  onChange={(e) =>
                    setFormData({ ...formData, taxRatePercent: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono focus:outline-none focus:border-zinc-900"
                />
                <Percent className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1">
                رسوم التوصيل الأساسية (بالقروش/سنت)
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.deliveryFee}
                onChange={(e) =>
                  setFormData({ ...formData, deliveryFee: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg font-mono focus:outline-none focus:border-zinc-900"
              />
              <span className="text-[10px] text-zinc-400 mt-1 block">
                القيمة بالوحدات الصغرى (1500 = 15.00 {formData.currencySymbol})
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
