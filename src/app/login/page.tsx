import { Store } from 'lucide-react';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4" dir="rtl">
      <section className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-9">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-zinc-900 text-white"><Store size={22} /></span>
          <div><p className="text-xs text-zinc-500">MASA Platform</p><h1 className="text-xl font-bold text-zinc-950">دخول لوحة الإدارة</h1></div>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
