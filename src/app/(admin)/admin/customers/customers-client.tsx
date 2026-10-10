'use client';

import { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  MapPin,
  Edit2,
  Trash2,
  X,
  Star,
  ShoppingBag,
  ChevronRight,
  FileText,
  Mail,
  AlertCircle,
} from 'lucide-react';
import {
  createCustomerAction,
  updateCustomerAction,
  saveCustomerAddressAction,
  deleteCustomerAddressAction,
} from '../../../actions/customer.actions';

interface CustomerAddressItem {
  id: string;
  customerId: string;
  title: string;
  city: string;
  area: string;
  street: string;
  building?: string | null;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  deliveryNotes?: string | null;
  isDefault: boolean;
  createdAt: Date | string;
}

interface CustomerItem {
  id: string;
  phone: string;
  fullName: string;
  email?: string | null;
  notes?: string | null;
  totalOrders: number;
  totalSpent: number; // in minor units
  lastOrderAt?: Date | string | null;
  isActive: boolean;
  createdAt: Date | string;
  addresses?: CustomerAddressItem[];
  _count?: { addresses: number };
}

interface CustomersClientProps {
  initialCustomers: CustomerItem[];
  initialTotal: number;
  currencySymbol: string;
}

export function CustomersClient({
  initialCustomers,
  initialTotal,
  currencySymbol,
}: CustomersClientProps) {
  const [customers, setCustomers] = useState<CustomerItem[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Loading & error state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Edit Customer Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Add Address Form State
  const [addrTitle, setAddrTitle] = useState('المنزل');
  const [addrCity, setAddrCity] = useState('القاهرة');
  const [addrArea, setAddrArea] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrBuilding, setAddrBuilding] = useState('');
  const [addrFloor, setAddrFloor] = useState('');
  const [addrApartment, setAddrApartment] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrNotes, setAddrNotes] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      c.fullName.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term))
    );
  });

  const totalFiltered = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedCustomers = filteredCustomers.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  // Calculate totals
  const totalOrdersSum = customers.reduce((acc, c) => acc + c.totalOrders, 0);
  const totalSpentSum = customers.reduce((acc, c) => acc + c.totalSpent, 0);

  const formatMoney = (minor: number) => {
    return (minor / 100).toFixed(2);
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('+20') && phone.length === 13) {
      const local = `0${phone.slice(3)}`;
      return `${local.slice(0, 3)} ${local.slice(3, 7)} ${local.slice(7)}`;
    }
    return phone;
  };

  // 1. Handle Create Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createCustomerAction({
        fullName: newName,
        phone: newPhone,
        email: newEmail || undefined,
        notes: newNotes || undefined,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      const createdItem: CustomerItem = {
        id: res.data.id,
        fullName: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || null,
        notes: newNotes.trim() || null,
        totalOrders: 0,
        totalSpent: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        addresses: [],
        _count: { addresses: 0 },
      };

      setCustomers((prev) => [createdItem, ...prev]);
      setIsCreateModalOpen(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewNotes('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Open Details Drawer
  const handleOpenDetails = (customer: CustomerItem) => {
    setSelectedCustomer(customer);
    setEditName(customer.fullName);
    setEditPhone(customer.phone);
    setEditEmail(customer.email || '');
    setEditNotes(customer.notes || '');
    setIsAddingAddress(false);
    setIsEditingProfile(false);
    setError(null);
    setIsDetailDrawerOpen(true);
  };

  // 3. Handle Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateCustomerAction({
        id: selectedCustomer.id,
        fullName: editName,
        phone: editPhone,
        email: editEmail || null,
        notes: editNotes || null,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      const updated = {
        ...selectedCustomer,
        fullName: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        notes: editNotes.trim() || null,
      };

      setSelectedCustomer(updated);
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setIsEditingProfile(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تعديل بيانات العميل');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Handle Add Address
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await saveCustomerAddressAction({
        customerId: selectedCustomer.id,
        title: addrTitle,
        city: addrCity,
        area: addrArea,
        street: addrStreet,
        building: addrBuilding || undefined,
        floor: addrFloor || undefined,
        apartment: addrApartment || undefined,
        landmark: addrLandmark || undefined,
        deliveryNotes: addrNotes || undefined,
        isDefault: addrIsDefault,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      const currentAddresses = selectedCustomer.addresses || [];
      const updatedExisting = addrIsDefault
        ? currentAddresses.map((a) => ({ ...a, isDefault: false }))
        : currentAddresses;

      const newAddr: CustomerAddressItem = {
        id: res.data.id,
        customerId: selectedCustomer.id,
        title: addrTitle,
        city: addrCity,
        area: addrArea,
        street: addrStreet,
        building: addrBuilding || null,
        floor: addrFloor || null,
        apartment: addrApartment || null,
        landmark: addrLandmark || null,
        deliveryNotes: addrNotes || null,
        isDefault: addrIsDefault || currentAddresses.length === 0,
        createdAt: new Date().toISOString(),
      };

      const newAddressList = [newAddr, ...updatedExisting];
      const updatedCust = {
        ...selectedCustomer,
        addresses: newAddressList,
        _count: { addresses: newAddressList.length },
      };

      setSelectedCustomer(updatedCust);
      setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
      setIsAddingAddress(false);
      setAddrTitle('المنزل');
      setAddrArea('');
      setAddrStreet('');
      setAddrBuilding('');
      setAddrFloor('');
      setAddrApartment('');
      setAddrLandmark('');
      setAddrNotes('');
      setAddrIsDefault(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة العنوان');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    if (!selectedCustomer) return;
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا العنوان؟')) return;
    setIsSubmitting(true);

    try {
      const res = await deleteCustomerAddressAction(addressId, selectedCustomer.id);
      if (!res.success) {
        setError(res.error);
        return;
      }

      const updatedAddrs = (selectedCustomer.addresses || []).filter((a) => a.id !== addressId);
      const updatedCust = {
        ...selectedCustomer,
        addresses: updatedAddrs,
        _count: { addresses: updatedAddrs.length },
      };

      setSelectedCustomer(updatedCust);
      setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء حذف العنوان');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Handle Set Default Address
  const handleSetDefaultAddress = async (address: CustomerAddressItem) => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);

    try {
      const res = await saveCustomerAddressAction({
        id: address.id,
        customerId: address.customerId,
        title: address.title,
        city: address.city,
        area: address.area,
        street: address.street,
        building: address.building || undefined,
        floor: address.floor || undefined,
        apartment: address.apartment || undefined,
        landmark: address.landmark || undefined,
        deliveryNotes: address.deliveryNotes || undefined,
        isDefault: true,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      const updatedAddrs = (selectedCustomer.addresses || []).map((a) => ({
        ...a,
        isDefault: a.id === address.id,
      }));

      const updatedCust = { ...selectedCustomer, addresses: updatedAddrs };
      setSelectedCustomer(updatedCust);
      setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تعديل العنوان الافتراضي');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">
            إدارة الزبائن وسجل العناوين (CRM)
          </h1>
          <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
            سجل موحد لزبائن المطعم على مستوى كافة الفروع وتفاصيل عناوين التوصيل
          </p>
        </div>
        <button
          onClick={() => {
            setError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-zinc-800"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">إجمالي الزبائن المسجلين</span>
            <Users className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900">
            {Math.max(initialTotal, customers.length)}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">إجمالي الطلبات المنجزة</span>
            <ShoppingBag className="h-4 w-4 text-zinc-400" strokeWidth={1.75} />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900">{totalOrdersSum}</div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">إجمالي مشتريات العملاء</span>
            <span className="text-xs font-bold text-emerald-600">{currencySymbol}</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900">
            {formatMoney(totalSpentSum)}{' '}
            <span className="text-xs font-normal text-zinc-500">{currencySymbol}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs">
        <Search className="h-4 w-4 text-zinc-400 shrink-0" strokeWidth={1.75} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="البحث بالاسم، برقم الهاتف، أو البريد الإلكتروني..."
          className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setCurrentPage(1);
            }}
            className="text-xs text-zinc-400 hover:text-zinc-600"
          >
            مسح
          </button>
        )}
      </div>

      {/* Customers Table / Card List */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-zinc-300" strokeWidth={1.5} />
            <p className="mt-3 text-sm font-medium text-zinc-900">لا يوجد عملاء مطابقين</p>
            <p className="mt-1 text-xs text-zinc-500">
              {searchTerm ? 'جرب البحث بكلمة أو رقم هاتف آخر' : 'ابدأ بإضافة أول عميل في النظام'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/75 text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">العميل</th>
                  <th className="px-4 py-3 font-medium">رقم الهاتف</th>
                  <th className="px-4 py-3 font-medium">العناوين</th>
                  <th className="px-4 py-3 font-medium">الطلبات</th>
                  <th className="px-4 py-3 font-medium">إجمالي المشتريات</th>
                  <th className="px-4 py-3 font-medium">تاريخ التسجيل</th>
                  <th className="px-4 py-3 text-left font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedCustomers.map((cust) => {
                  const addressCount = cust.addresses?.length ?? cust._count?.addresses ?? 0;
                  const defaultAddress = cust.addresses?.find((a) => a.isDefault) ?? cust.addresses?.[0];

                  return (
                    <tr
                      key={cust.id}
                      className="group transition-colors hover:bg-zinc-50/70"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-900">{cust.fullName}</div>
                        {cust.email && (
                          <div className="text-xs text-zinc-400 font-mono">{cust.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-zinc-700 font-semibold" dir="ltr">
                          {formatPhone(cust.phone)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" strokeWidth={1.75} />
                          <span className="text-xs text-zinc-600">
                            {addressCount > 0 ? (
                              defaultAddress ? (
                                `${defaultAddress.area} - ${defaultAddress.street}`
                              ) : (
                                `${addressCount} عنوان`
                              )
                            ) : (
                              <span className="text-zinc-400 italic">بدون عنوان</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                          {cust.totalOrders} طلب
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-zinc-900 font-mono text-xs">
                          {formatMoney(cust.totalSpent)} {currencySymbol}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-zinc-500 font-mono">
                        {new Date(cust.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-4 py-3.5 text-left">
                        <button
                          onClick={() => handleOpenDetails(cust)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50"
                        >
                          <span>العناوين والتفاصيل</span>
                          <ChevronRight className="h-3.5 w-3.5 rotate-180 text-zinc-400" strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalFiltered > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <span>
                عرض {Math.min((validCurrentPage - 1) * pageSize + 1, totalFiltered)} إلى{' '}
                {Math.min(validCurrentPage * pageSize, totalFiltered)} من أصل {totalFiltered} عميل
              </span>
              <span className="text-zinc-300">|</span>
              <label className="flex items-center gap-1.5 text-zinc-500">
                <span>لكل صفحة:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-800"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage <= 1}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium hover:bg-zinc-100 disabled:opacity-40 transition"
              >
                السابق
              </button>
              <span className="px-2 font-medium">
                صفحة {validCurrentPage} من {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage >= totalPages}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 font-medium hover:bg-zinc-100 disabled:opacity-40 transition"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create Customer */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h2 className="text-base font-bold text-zinc-900">إضافة عميل جديد</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">رقم الهاتف *</label>
                <input
                  type="tel"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="01012345678 أو +201012345678"
                  dir="ltr"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono text-zinc-900 focus:border-zinc-900 focus:outline-hidden"
                />
                <p className="mt-1 text-2xs text-zinc-400">
                  يتم توحيد الرقم تلقائياً طبقاً للمعيار الدولي E.164
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ahmed@example.com"
                  dir="ltr"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono text-zinc-900 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700">ملاحظات عن العميل</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="مثال: يفضل الاتصال قبل التوصيل"
                  className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ العميل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer / Modal: Customer Details & Addresses */}
      {isDetailDrawerOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{selectedCustomer.fullName}</h2>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-xs text-zinc-500 font-semibold" dir="ltr">
                    {formatPhone(selectedCustomer.phone)}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs text-zinc-500">
                    {selectedCustomer.totalOrders} طلب
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs font-bold text-emerald-600 font-mono">
                    {formatMoney(selectedCustomer.totalSpent)} {currencySymbol}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Edit Section */}
            <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700">البيانات الشخصية</span>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 hover:text-zinc-900"
                >
                  <Edit2 className="h-3 w-3" strokeWidth={1.75} />
                  <span>{isEditingProfile ? 'إلغاء التعديل' : 'تعديل'}</span>
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="mt-3 space-y-3">
                  <div>
                    <label className="block text-2xs text-zinc-500 font-medium">الاسم</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-zinc-500 font-medium">الهاتف</label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      dir="ltr"
                      className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-zinc-500 font-medium">البريد</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      dir="ltr"
                      className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-mono text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-zinc-500 font-medium">ملاحظات</label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديل'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-2 space-y-1 text-xs text-zinc-600">
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.75} />
                      <span className="font-mono">{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.notes && (
                    <div className="flex items-start gap-1.5 text-zinc-500">
                      <FileText className="h-3.5 w-3.5 text-zinc-400 shrink-0 mt-0.5" strokeWidth={1.75} />
                      <span>{selectedCustomer.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Addresses Header */}
            <div className="mt-6 flex items-center justify-between border-b border-zinc-100 pb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-zinc-700" strokeWidth={1.75} />
                <h3 className="text-sm font-bold text-zinc-900">
                  سجل العناوين ({selectedCustomer.addresses?.length ?? 0})
                </h3>
              </div>
              <button
                onClick={() => setIsAddingAddress(!isAddingAddress)}
                className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-200"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                <span>{isAddingAddress ? 'إلغاء' : 'إضافة عنوان'}</span>
              </button>
            </div>

            {/* Add Address Form */}
            {isAddingAddress && (
              <form onSubmit={handleAddAddress} className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs space-y-3">
                <h4 className="text-xs font-bold text-zinc-900">إضافة عنوان توصيل جديد</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs text-zinc-600 font-medium">تسمية العنوان *</label>
                    <input
                      type="text"
                      required
                      value={addrTitle}
                      onChange={(e) => setAddrTitle(e.target.value)}
                      placeholder="مثال: المنزل، المكتب"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-zinc-600 font-medium">المدينة *</label>
                    <input
                      type="text"
                      required
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-2xs text-zinc-600 font-medium">المنطقة أو الحي *</label>
                    <input
                      type="text"
                      required
                      value={addrArea}
                      onChange={(e) => setAddrArea(e.target.value)}
                      placeholder="مثال: المعادي، مدينة نصر"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-zinc-600 font-medium">اسم الشارع *</label>
                    <input
                      type="text"
                      required
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="مثال: شارع النصر"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-2xs text-zinc-600 font-medium">العمارة</label>
                    <input
                      type="text"
                      value={addrBuilding}
                      onChange={(e) => setAddrBuilding(e.target.value)}
                      placeholder="12"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-zinc-600 font-medium">الطابق</label>
                    <input
                      type="text"
                      value={addrFloor}
                      onChange={(e) => setAddrFloor(e.target.value)}
                      placeholder="3"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-2xs text-zinc-600 font-medium">الشقة</label>
                    <input
                      type="text"
                      value={addrApartment}
                      onChange={(e) => setAddrApartment(e.target.value)}
                      placeholder="6"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-2xs text-zinc-600 font-medium">علامة مميزة</label>
                  <input
                    type="text"
                    value={addrLandmark}
                    onChange={(e) => setAddrLandmark(e.target.value)}
                    placeholder="بجوار صيدلية..."
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-2xs text-zinc-600 font-medium">ملاحظات التوصيل</label>
                  <input
                    type="text"
                    value={addrNotes}
                    onChange={(e) => setAddrNotes(e.target.value)}
                    placeholder="مثال: يرجى عدم رن الجرس"
                    className="mt-1 w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-900 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="addrDefault"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <label htmlFor="addrDefault" className="text-xs text-zinc-700">
                    تعيين كعنوان افتراضي للزبون
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(false)}
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ العنوان'}
                  </button>
                </div>
              </form>
            )}

            {/* Addresses List */}
            <div className="mt-4 space-y-3">
              {(!selectedCustomer.addresses || selectedCustomer.addresses.length === 0) ? (
                <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400">
                  لا توجد عناوين مسجلة لهذا العميل حتى الآن
                </div>
              ) : (
                selectedCustomer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="relative rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs transition-shadow hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{address.title}</span>
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-2xs font-medium text-emerald-700 border border-emerald-200">
                            <Star className="h-3 w-3 fill-emerald-600 text-emerald-600" />
                            <span>العنوان الافتراضي</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!address.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(address)}
                            className="text-2xs text-zinc-500 hover:text-zinc-900 hover:underline"
                          >
                            تعيين كافتراضي
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(address.id)}
                          className="rounded-md p-1 text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
                          title="حذف العنوان"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-zinc-600 leading-relaxed">
                      <div>
                        {address.city}، {address.area}، {address.street}
                        {address.building && `، عمارة ${address.building}`}
                        {address.floor && `، طابق ${address.floor}`}
                        {address.apartment && `، شقة ${address.apartment}`}
                      </div>
                      {address.landmark && (
                        <div className="mt-1 text-zinc-500 text-2xs">
                          علامة مميزة: {address.landmark}
                        </div>
                      )}
                      {address.deliveryNotes && (
                        <div className="mt-1 rounded-md bg-amber-50/70 p-1.5 text-2xs text-amber-800 border border-amber-200/60">
                          ملاحظة التوصيل: {address.deliveryNotes}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
