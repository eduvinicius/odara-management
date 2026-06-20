import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../lib/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await signIn(email, password)
    setLoading(false)
    if (authError) {
      setError('E-mail ou senha incorretos.')
      return
    }
    navigate('/')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--cream-200)' }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-xl"
        style={{ background: 'var(--surface-raised)', boxShadow: 'var(--shadow-md)' }}
      >
        <h1
          className="text-2xl mb-6"
          style={{ fontFamily: 'var(--font-cormorant)', color: 'var(--ink-900)' }}
        >
          Odara Management
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm mb-1"
              style={{ color: 'var(--ink-700)' }}
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2"
              style={{
                borderColor: 'var(--border-soft)',
                color: 'var(--ink-900)',
                background: 'var(--surface-raised)',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm mb-1"
              style={{ color: 'var(--ink-700)' }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none"
              style={{
                borderColor: 'var(--border-soft)',
                color: 'var(--ink-900)',
                background: 'var(--surface-raised)',
              }}
            />
          </div>

          {error !== null && (
            <p className="text-sm" style={{ color: 'var(--rose-400)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-full text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ background: 'var(--gold-400)', color: 'var(--text-on-gold)' }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
