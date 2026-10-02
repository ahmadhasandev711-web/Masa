'use client';

import { useActionState, useState } from 'react';
import { KeyRound, Sparkles, Shield, Store, ChefHat, Calculator } from 'lucide-react';
import { loginAction } from '../actions/auth.actions';

const DEMO_ACCOUNTS = [
  { label: 'المدير العام', role: 'admin', desc: 'وصول شامل للنظام', icon: Shield },
  { label: 'مدير الفرع', role: 'manager', desc: 'تشغيل الفرع والورديات', icon: Store },
  { label: 'كاشير الصالة', role: 'cashier', desc: 'نقطة البيع POS', icon: KeyRound },
  { label: 'شيف المطبخ', role: 'kitchen', desc: 'شاشة تحضير KDS', icon: ChefHat },
  { label: 'المحاسب المالي', role: 'accountant', desc: 'المصروفات والأرباح', icon: Calculator },
];

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: undefined });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const fillDemo = (user: string) => {
    setUsername(user);
    setPassword('123456');
  };

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        <label className="block space-y-1.5 text-sm font-medium text-zinc-700">
          اسم المستخدم
          <input
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            placeholder="مثال: admin"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-mono"
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium text-zinc-700">
          كلمة المرور
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-base outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-mono"
          />
        </label>

        {state.error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <button
          disabled={pending}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60 transition"
        >
          <KeyRound size={17} />
          {pending ? 'جارٍ التحقق...' : 'تسجيل الدخول'}
        </button>
      </form>

      {/* Quick Demo Credentials Helper */}
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-900">
          <Sparkles size={14} className="text-amber-600" />
          <span>حسابات تجريبية سريعة للفحص والاختبار (كلمة المرور: 123456)</span>
        </div>
        <p className="text-3xs text-zinc-500">
          انقر على أي دور لتعبئة الحساب تلقائياً وتجربة صلاحياته فوراً:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const Icon = acc.icon;
            const isSelected = username === acc.role;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => fillDemo(acc.role)}
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-right transition ${
                  isSelected
                    ? 'border-zinc-900 bg-white shadow-2xs text-zinc-950 font-bold'
                    : 'border-zinc-200/80 bg-white/60 hover:bg-white hover:border-zinc-300 text-zinc-700'
                }`}
              >
                <div className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  <Icon size={14} />
                </div>
                <div className="min-w-0 text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold leading-none">{acc.label}</span>
                    <span className="text-3xs font-mono text-zinc-400">({acc.role})</span>
                  </div>
                  <span className="text-3xs text-zinc-400 block mt-0.5 truncate">{acc.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
