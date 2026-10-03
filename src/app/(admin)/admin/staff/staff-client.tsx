'use client';

import { useState } from 'react';
import {
  Users,
  Plus,
  Shield,
  Building2,
  Phone,
  CheckCircle,
  XCircle,
  Pencil,
  KeyRound,
  Power,
  Search,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';
import {
  createStaffAction,
  updateStaffAction,
  resetStaffPasswordAction,
  toggleStaffStatusAction,
} from '../../../actions/staff.actions';

interface StaffUser {
  id: string;
  username: string;
  fullName: string;
  phone: string;
  isActive: boolean;
  role: { id: string; name: string; description: string | null };
  userBranches: { isDefault: boolean; branch: { id: string; nameAr: string; code: string } }[];
}

interface RoleOption {
  id: string;
  name: string;
  description: string | null;
  permissions?: {
    permission: {
      id: string;
      code: string;
      name: string;
      description: string | null;
      category: string;
    };
  }[];
}

interface BranchOption {
  id: string;
  code: string;
  nameAr: string;
}

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

export function StaffClient({
  initialStaff,
  roles,
  branches,
  permissions,
  currentUserId,
}: {
  initialStaff: StaffUser[];
  roles: RoleOption[];
  branches: BranchOption[];
  permissions: PermissionItem[];
  currentUserId: string;
}) {
  const [activeTab, setActiveTab] = useState<'STAFF' | 'ROLES'>('STAFF');
  const [staffList, setStaffList] = useState<StaffUser[]>(initialStaff);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [resettingPasswordStaff, setResettingPasswordStaff] = useState<StaffUser | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add staff form
  const [addUsername, setAddUsername] = useState('');
  const [addFullName, setAddFullName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRoleId, setAddRoleId] = useState(roles[0]?.id ?? '');
  const [addBranches, setAddBranches] = useState<string[]>(
    branches[0]?.id ? [branches[0].id] : []
  );

  // Edit staff form
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRoleId, setEditRoleId] = useState('');
  const [editBranches, setEditBranches] = useState<string[]>([]);

  // Reset password form
  const [newPassword, setNewPassword] = useState('');

  // Filter staff list
  const filteredStaff = staffList.filter((user) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      user.fullName.toLowerCase().includes(q) ||
      user.username.toLowerCase().includes(q) ||
      user.phone.includes(q) ||
      user.role.name.toLowerCase().includes(q)
    );
  });

  // Handle Add Staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createStaffAction({
        username: addUsername,
        fullName: addFullName,
        phone: addPhone,
        password: addPassword,
        roleId: addRoleId,
        branchIds: addBranches,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      const selectedRole = roles.find((r) => r.id === addRoleId);
      const assigned = branches
        .filter((b) => addBranches.includes(b.id))
        .map((b, i) => ({ isDefault: i === 0, branch: b }));

      setStaffList((prev) => [
        {
          id: res.data.id,
          username: addUsername,
          fullName: addFullName,
          phone: addPhone,
          isActive: true,
          role: selectedRole ?? { id: addRoleId, name: 'STAFF', description: null },
          userBranches: assigned,
        },
        ...prev,
      ]);

      setIsAddModalOpen(false);
      setAddUsername('');
      setAddFullName('');
      setAddPhone('');
      setAddPassword('');
      setSuccessMessage('تمت إضافة الموظف الجديد بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إضافة الموظف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (staff: StaffUser) => {
    setEditingStaff(staff);
    setEditFullName(staff.fullName);
    setEditPhone(staff.phone);
    setEditRoleId(staff.role.id);
    setEditBranches(staff.userBranches.map((ub) => ub.branch.id));
    setError(null);
  };

  // Handle Update Staff
  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await updateStaffAction({
        userId: editingStaff.id,
        fullName: editFullName,
        phone: editPhone,
        roleId: editRoleId,
        branchIds: editBranches,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      const selectedRole = roles.find((r) => r.id === editRoleId);
      const assigned = branches
        .filter((b) => editBranches.includes(b.id))
        .map((b, i) => ({ isDefault: i === 0, branch: b }));

      setStaffList((prev) =>
        prev.map((u) =>
          u.id === editingStaff.id
            ? {
                ...u,
                fullName: editFullName,
                phone: editPhone,
                role: selectedRole ?? u.role,
                userBranches: assigned,
              }
            : u
        )
      );

      setEditingStaff(null);
      setSuccessMessage('تم تحديث بيانات الموظف بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الموظف');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingPasswordStaff) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await resetStaffPasswordAction({
        userId: resettingPasswordStaff.id,
        newPassword,
      });

      if (!res.success) {
        setError(res.error);
        return;
      }

      setResettingPasswordStaff(null);
      setNewPassword('');
      setSuccessMessage(`تم تغيير كلمة المرور للموظف (${resettingPasswordStaff.fullName}) بنجاح`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Active Status
  const handleToggleStatus = async (user: StaffUser) => {
    if (user.id === currentUserId) {
      alert('لا يمكنك إيقاف حسابك الشخصي المسجل به حالياً.');
      return;
    }

    const nextStatus = !user.isActive;
    const confirmMsg = nextStatus
      ? `هل تريد تفعيل حساب الموظف "${user.fullName}"؟`
      : `هل أنت متأكد من إيقاف حساب الموظف "${user.fullName}"؟ لن يتمكن من تسجيل الدخول للنظام.`;

    if (!window.confirm(confirmMsg)) return;

    // Optimistic update
    setStaffList((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, isActive: nextStatus } : u))
    );

    try {
      const res = await toggleStaffStatusAction(user.id, nextStatus);
      if (!res.success) {
        // Revert on failure
        setStaffList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u))
        );
        alert(res.error || 'تعذر تغيير حالة الحساب');
      }
    } catch {
      // Revert on failure
      setStaffList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: user.isActive } : u))
      );
      alert('حدث خطأ في الاتصال بالخادم');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner and Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            الموظفين والصلاحيات
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 font-medium">
            إدارة طاقم العمل، تعديل الصلاحيات، وإعادة تعيين كلمات المرور، ونطاق الفروع
          </p>
        </div>

        {activeTab === 'STAFF' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="size-4" />
            <span>إضافة موظف جديد</span>
          </button>
        )}
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="size-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-zinc-100/80 p-1 rounded-xl w-fit text-xs font-bold border border-zinc-200/50">
        <button
          type="button"
          onClick={() => setActiveTab('STAFF')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
            activeTab === 'STAFF'
              ? 'bg-white text-zinc-900 shadow-2xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Users className="size-4" />
          <span>طاقم العمل ({staffList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ROLES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-pointer ${
            activeTab === 'ROLES'
              ? 'bg-white text-zinc-900 shadow-2xs'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Shield className="size-4" />
          <span>مصفوفة الصلاحيات والأدوار</span>
        </button>
      </div>

      {/* Tab 1: Staff List View */}
      {activeTab === 'STAFF' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="size-4 absolute right-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="بحث بالاسم، اسم المستخدم، رقم الهاتف، أو الدور الوظيفي..."
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
            {filteredStaff.length === 0 ? (
              <div className="bg-white p-8 text-center text-xs text-zinc-400 rounded-2xl border border-zinc-200">
                لا يوجد موظفين يطابقون معايير البحث.
              </div>
            ) : (
              filteredStaff.map((user) => (
                <div
                  key={user.id}
                  className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900">{user.fullName}</h3>
                      <span className="font-mono text-xs text-zinc-400 mt-0.5 block">
                        @{user.username}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <CheckCircle className="size-3" />
                          <span>مفعل</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3" />
                          <span>معطل</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-zinc-400 block">الدور الوظيفي:</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 text-[11px] font-bold">
                        <Shield className="size-3 text-zinc-500" />
                        <span>{user.role.name}</span>
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-zinc-400 block">رقم الهاتف:</span>
                      <a
                        href={`tel:${user.phone}`}
                        className="inline-flex items-center gap-1 font-mono text-zinc-700 font-medium hover:underline text-[11px]"
                      >
                        <Phone className="size-3 text-zinc-400" />
                        <span>{user.phone}</span>
                      </a>
                    </div>
                  </div>

                  {/* Assigned Branches */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-400 block">نطاق الفروع:</span>
                    <div className="flex flex-wrap gap-1">
                      {user.userBranches.length > 0 ? (
                        user.userBranches.map((ub) => (
                          <span
                            key={ub.branch.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-zinc-50 text-zinc-700 border border-zinc-200 font-medium"
                          >
                            <Building2 className="size-2.5 text-zinc-400" />
                            <span>{ub.branch.nameAr}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-zinc-400 text-[11px]">كافة الفروع</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Actions Toolbar */}
                  <div className="pt-2 border-t border-zinc-100 grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="py-1.5 px-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-lg font-bold flex items-center justify-center gap-1 border border-zinc-200"
                    >
                      <Pencil className="size-3 text-zinc-500" />
                      <span>تعديل</span>
                    </button>

                    {/* Temporarily hidden for demo security to prevent test accounts lockout */}
                    {false && (
                      <button
                        type="button"
                        onClick={() => {
                          setResettingPasswordStaff(user);
                          setNewPassword('');
                          setError(null);
                        }}
                        className="py-1.5 px-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 rounded-lg font-bold flex items-center justify-center gap-1 border border-zinc-200"
                      >
                        <KeyRound className="size-3 text-zinc-500" />
                        <span>كلمة السر</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={user.id === currentUserId}
                      onClick={() => handleToggleStatus(user)}
                      className={`py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 border ${
                        user.id === currentUserId
                          ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                          : user.isActive
                          ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Power className="size-3" />
                      <span>{user.isActive ? 'إيقاف' : 'تفعيل'}</span>
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
                  <th className="p-4">اسم المستخدم</th>
                  <th className="p-4">الاسم الكامل</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">الدور الوظيفي</th>
                  <th className="p-4">الفروع المعينة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-400">
                      لا يوجد موظفين يطابقون معايير البحث.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50/50 transition">
                      <td className="p-4 font-mono font-bold text-zinc-800">
                        {user.username}
                      </td>
                      <td className="p-4 font-bold text-zinc-900">{user.fullName}</td>
                      <td className="p-4 text-zinc-600">
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="size-3 text-zinc-400" />
                          <span>{user.phone}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                          <Shield className="size-3 text-zinc-500" />
                          <span>{user.role.name}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {user.userBranches.length > 0 ? (
                            user.userBranches.map((ub) => (
                              <span
                                key={ub.branch.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-zinc-50 text-zinc-700 border border-zinc-200 font-medium"
                              >
                                <Building2 className="size-2.5 text-zinc-400" />
                                <span>{ub.branch.nameAr}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-400 text-[11px]">كافة الفروع</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="size-3" />
                            <span>مفعل</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                            <XCircle className="size-3" />
                            <span>معطل</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition"
                            title="تعديل بيانات الموظف"
                          >
                            <Pencil className="size-3.5" />
                          </button>

                          {/* Temporarily hidden for demo security to prevent test accounts lockout */}
                          {false && (
                            <button
                              type="button"
                              onClick={() => {
                                setResettingPasswordStaff(user);
                                setNewPassword('');
                                setError(null);
                              }}
                              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold transition"
                              title="تغيير كلمة المرور"
                            >
                              <KeyRound className="size-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={user.id === currentUserId}
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded-lg font-bold transition ${
                              user.id === currentUserId
                                ? 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
                                : user.isActive
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                            title={user.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
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
        </div>
      )}

      {/* Tab 2: Roles and Permissions Matrix */}
      {activeTab === 'ROLES' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-zinc-800" />
              <h2 className="text-base font-bold text-zinc-900">مصفوفة الصلاحيات والأدوار المعتمدة</h2>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              يوضح الجدول التالي الصلاحيات والقدرات الفنية الممنوحة لكل دور وظيفي في المنظومة. الصلاحيات محددة بدقة لضمان أمان العمليات المالية والميدانية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const rolePermCodes = (role.permissions || []).map((rp) => rp.permission.code);
              return (
                <div
                  key={role.id}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black bg-zinc-900 text-white px-2.5 py-1 rounded-lg">
                        {role.name}
                      </span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {rolePermCodes.length} صلاحيات
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                      {role.description || 'دور مخصص في المنظومة'}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wider">
                      القدرات التشغيلية الممنوحة:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {rolePermCodes.map((code) => {
                        const permDef = permissions.find((p) => p.code === code);
                        return (
                          <span
                            key={code}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-zinc-50 text-zinc-700 border border-zinc-200 font-medium"
                            title={permDef?.description || code}
                          >
                            <Check className="size-2.5 text-emerald-600" />
                            <span>{permDef?.name || code}</span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal 1: Add Staff Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-zinc-800" strokeWidth={1.8} />
                <h3 className="font-bold text-sm text-zinc-900">إضافة موظف جديد</h3>
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

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">اسم المستخدم (لتسجيل الدخول)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: cashier_alex"
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد عبد الله"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  placeholder="010xxxxxxxx"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">كلمة المرور الابتدائية</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="6 خانات على الأقل"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">الدور الوظيفي (الصلاحيات)</label>
                <select
                  value={addRoleId}
                  onChange={(e) => setAddRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.description ? `— ${r.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">الفروع المعين لها الموظف</label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2.5 border border-zinc-200 rounded-xl bg-zinc-50">
                  {branches.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={addBranches.includes(b.id)}
                        onChange={() => {
                          setAddBranches((prev) =>
                            prev.includes(b.id)
                              ? prev.filter((id) => id !== b.id)
                              : [...prev, b.id]
                          );
                        }}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-800"
                      />
                      <span>{b.nameAr} ({b.code})</span>
                    </label>
                  ))}
                </div>
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
                  {isSubmitting ? 'جارٍ الحفظ...' : 'إضافة الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-zinc-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Pencil className="size-4 text-zinc-800" />
                <h3 className="font-bold text-sm text-zinc-900">تعديل بيانات الموظف</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-bold">اسم المستخدم:</span>
              <span className="font-mono font-black text-zinc-900">@{editingStaff.username}</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleUpdateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 font-mono text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">الدور الوظيفي (الصلاحيات)</label>
                <select
                  value={editRoleId}
                  onChange={(e) => setEditRoleId(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.description ? `— ${r.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">الفروع المخصصة</label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2.5 border border-zinc-200 rounded-xl bg-zinc-50">
                  {branches.map((b) => (
                    <label
                      key={b.id}
                      className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-800"
                    >
                      <input
                        type="checkbox"
                        checked={editBranches.includes(b.id)}
                        onChange={() => {
                          setEditBranches((prev) =>
                            prev.includes(b.id)
                              ? prev.filter((id) => id !== b.id)
                              : [...prev, b.id]
                          );
                        }}
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-800"
                      />
                      <span>{b.nameAr} ({b.code})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
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

      {/* Modal 3: Reset Password Modal */}
      {resettingPasswordStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-zinc-200">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 text-zinc-800" />
                <h3 className="font-bold text-sm text-zinc-900">إعادة تعيين كلمة المرور</h3>
              </div>
              <button
                type="button"
                onClick={() => setResettingPasswordStaff(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <span className="text-zinc-500">الموظف:</span>
              <p className="font-bold text-zinc-900 text-sm">{resettingPasswordStaff.fullName}</p>
              <span className="font-mono text-zinc-400 block">@{resettingPasswordStaff.username}</span>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="أدخل كلمة مرور جديدة (6 خانات على الأقل)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-xl bg-zinc-50 text-xs focus:bg-white focus:ring-1 focus:ring-zinc-800 outline-hidden font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setResettingPasswordStaff(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || newPassword.length < 6}
                  className="px-5 py-2 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'جارٍ التغيير...' : 'تأكيد التغيير'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
