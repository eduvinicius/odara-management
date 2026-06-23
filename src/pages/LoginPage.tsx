import { LoginForm } from '../components/auth/LoginForm'

export function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--cream-200)' }}
    >
      <div
        className="w-full max-w-sm p-6 sm:p-8 rounded-md"
        style={{ background: 'var(--surface-raised)', boxShadow: 'var(--shadow-md)' }}
      >
        <h1
          className="text-2xl mb-6"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--ink-900)' }}
        >
          Odara - Gerenciamento
        </h1>

        <LoginForm />
      </div>
    </div>
  )
}
