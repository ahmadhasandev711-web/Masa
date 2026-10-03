'use client';

import { useActionState, useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { loginAction } from '../actions/auth.actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: undefined });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
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
        <div className="relative">
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••"
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 pe-12 text-base outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-mono"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1.5 rounded-lg transition"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
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
  );
}
