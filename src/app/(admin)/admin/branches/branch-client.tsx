'use client';

import { useState } from 'react';
import {
  Building2,
  Plus,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Pencil,
  Power,
  Search,
  X,
  Check,
} from 'lucide-react';
import {
  createBranchAction,
  updateBranchAction,
  toggleBranchStatusAction,
} from '../../../actions/branch.actions';

interface BranchItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  address: string;
  isActive: boolean;
  _count?: { userBranches: number };
}

export function BranchClient({ initialBranches }: { initialBranches: BranchItem[] }) {
  const [branches, setBranches] = useState<BranchItem[]>(initialBranches);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);

  // Loading & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add Branch Form State
  const [code, setCode] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Edit Branch Form State
  const [editNameAr, setEditNameAr] = useState('');
  const [editNameEn, setEditNameEn] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  // Filter branches by search query
  const filteredBranches = branches.filter((branch) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      branch.code.toLowerCase().includes(q) ||
      branch.nameAr.toLowerCase().includes(q) ||
      branch.nameEn.toLowerCase().includes(q) ||
      branch.phone.includes(q) ||
      branch.address.toLowerCase().includes(q)
    );
  });

  // Handle Add Branch
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createBranchAction({ code, nameAr, nameEn, phone, address });
      if (!res.success) {
        setError(res.error);
        return;
      }
      setBranches((prev) => [...prev, { ...res.data, _count: { userBranches: 0 } }]);
      setIsAddModalOpen(false);
      setCode('');
      setNameAr('');
      setNameEn('');
      setPhone('');
      setAddress('');
      setSuccessMessage('تم إنشاء الفرع الجديد بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إنشاء الفرع');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (branch: BranchItem) => {
    setEditingBranch(branch);
    setEditNameAr(branch.nameAr);
    setEditNameEn(branch.nameEn);
    setEditPhone(branch.phone);
    setEditAddress(branch.address);
    setError(null);
  };

  // Handle Update Branch
  const handleUpdateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateBranchAction(editingBranch.id, {
        nameAr: editNameAr,
        nameEn: editNameEn,
        phone: editPhone,
        address: editAddress,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      setBranches((prev) =>
        prev.map((b) =>
          b.id === editingBranch.id
            ? {
                ...b,
                nameAr: editNameAr,
                nameEn: editNameEn,
                phone: editPhone,
                address: editAddress,
              }
            : b
        )
      );

      setEditingBranch(null);
      setSuccessMessage('تم تحديث بيانات الفرع بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث بيانات الفرع');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Branch Active Status
  const handleToggle = async (branchId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setBranches((prev) =>
      prev.map((b) => (b.id === branchId ? { ...b, isActive: nextStatus } : b))
    );

    try {
      const res = await toggleBranchStatusAction(branchId, nextStatus);
      if (!res.success) {
        // Revert on error
        setBranches((prev) =>
          prev.map((b) => (b.id === branchId ? { ...b, isActive: currentStatus } : b))
        );
        alert(res.error || 'تعذر تعديل حالة الفرع');
      }
    } catch {
      // Revert on error
      setBranches((prev) =>
        prev.map((b) => (b.id === branchId ? { ...b, isActive: currentStatus } : b))
      );
      alert('حدث خطأ في الاتصال بالخادم');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            فروع المطعم
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            إدارة كافة الفروع والمواقع الميدانية وتخصيص بيانات ونطاق تشغيل كل فرع
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition shadow-2xs cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>إضافة فرع جديد</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="size-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="relative">
        <Search className="size-4 absolute right-3.5 top-3 text-zinc-400" />
        <input
          type="text"
          placeholder="بحث بكود الفرع، الاسم بالعربية أو الإنجليزية، الهاتف، أو العنوان..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-10 pl-8 py-2.5 text-xs border border-zinc-200 rounded-xl focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium placeholder:text-zinc-400 bg-white"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-3 text-zinc-400 hover:text-zinc-600"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Dual Responsive Engine: Mobile Cards View (block md:hidden) */}
      <div className="block md:hidden space-y-3">
        {filteredBranches.length === 0 ? (
          <div className="bg-white p-8 text-center text-xs text-zinc-400 rounded-2xl border border-zinc-200">
            لا توجد فروع تطابق معايير البحث.
          </div>
        ) : (
          filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-zinc-900 text-white font-mono font-bold text-xs grid place-items-center">
                    {branch.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900">{branch.nameAr}</h3>
                    <span className="font-mono text-xs text-zinc-400 block">{branch.nameEn}</span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    branch.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                  }`}
                >
                  {branch.isActive ? (
                    <>
                      <CheckCircle className="size-3" />
                      <span>يعمل</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="size-3" />
                      <span>متوقف</span>
                    </>
                  )}
                </span>
              </div>

              {/* Card Body */}
              <div className="space-y-1.5 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <Phone className="size-3.5 text-zinc-400 shrink-0" />
                  <a href={`tel:${branch.phone}`} className="font-mono font-medium hover:underline">
                    {branch.phone}
                  </a>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-zinc-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{branch.address}</span>
                </div>
              </div>

              {/* Mobile Actions Toolbar */}
              <div className="pt-2 border-t border-zinc-100 grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => openEditModal(branch)}
                  className="py-1.5 px-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-lg font-bold flex items-center justify-center gap-1.5 border border-zinc-200"
                >
                  <Pencil className="size-3 text-zinc-500" />
                  <span>تعديل البيانات</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggle(branch.id, branch.isActive)}
                  className={`py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 border ${
                    branch.isActive
                      ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Power className="size-3" />
                  <span>{branch.isActive ? 'إيقاف مؤقت' : 'تفعيل الفرع'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (hidden md:block) */}
      <div className="hidden md:block bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-right text-xs">
          <thead className="bg-zinc-50/80 border-b border-zinc-200 text-zinc-500 font-bold">
            <tr>
              <th className="p-4">كود الفرع</th>
              <th className="p-4">اسم الفرع</th>
              <th className="p-4">الهاتف</th>
              <th className="p-4">العنوان</th>
              <th className="p-4">الحالة</th>
              <th className="p-4 text-left">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filteredBranches.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-400">
                  لا توجد فروع تطابق معايير البحث.
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-zinc-50/50 transition">
                  <td className="p-4 font-mono font-bold text-zinc-900">
                    <span className="px-2 py-1 bg-zinc-100 rounded-lg">
                      {branch.code}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-zinc-900">{branch.nameAr}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{branch.nameEn}</div>
                  </td>
                  <td className="p-4 text-zinc-600">
                    <div className="flex items-center gap-1.5 font-mono">
                      <Phone className="size-3.5 text-zinc-400" />
                      <span>{branch.phone}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-xs">{branch.address}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {branch.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="size-3" />
                        <span>يعمل</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                        <XCircle className="size-3" />
                        <span>متوقف</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-left">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(branch)}
                        className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition"
                        title="تعديل بيانات الفرع"
                      >
                        <Pencil className="size-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggle(branch.id, branch.isActive)}
                        className={`p-1.5 rounded-lg font-bold transition ${
                          branch.isActive
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                        title={branch.isActive ? 'إيقاف مؤقت' : 'تفعيل'}
                      >
                        <Power className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="size-5 text-zinc-800" strokeWidth={1.8} />
                <h3 className="font-bold text-sm text-zinc-900">إضافة فرع جديد للمطعم</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">كود الفرع (فريد - مثال: CAIRO-01)</label>
                <input
                  type="text"
                  required
                  placeholder="CAIRO-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم الفرع (بالعربية)</label>
                <input
                  type="text"
                  required
                  placeholder="فرع المعادي"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم الفرع (بالإنجليزية)</label>
                <input
                  type="text"
                  required
                  placeholder="Maadi Branch"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">رقم الهاتف للتواصل</label>
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">العنوان التفصيلي</label>
                <textarea
                  required
                  rows={3}
                  placeholder="الشارع، المنطقة، المدينة..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'إنشاء الفرع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Branch Modal */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="size-4 text-zinc-800" />
                <h3 className="font-bold text-sm text-zinc-900">تعديل بيانات الفرع ({editingBranch.code})</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateBranch} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم الفرع (بالعربية)</label>
                <input
                  type="text"
                  required
                  value={editNameAr}
                  onChange={(e) => setEditNameAr(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم الفرع (بالإنجليزية)</label>
                <input
                  type="text"
                  required
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">رقم الهاتف للتواصل</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">العنوان التفصيلي</label>
                <textarea
                  required
                  rows={3}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
