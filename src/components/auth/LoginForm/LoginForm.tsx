import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from '@tanstack/react-form'
import { signIn } from '../../../lib/auth'
import { Spinner } from '../../ui/Spinner'

function validateEmail(value: string): string | undefined {
  if (!value) return 'Informe um e-mail válido.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Informe um e-mail válido.'
}

function validatePassword(value: string): string | undefined {
  if (!value) return 'A senha é obrigatória.'
  if (value.length < 8) return 'A senha deve ter pelo menos 8 caracteres.'
}

const AUTH_ERROR_MESSAGE = 'E-mail ou senha incorretos.'
const NETWORK_ERROR_MESSAGE = 'Ocorreu um erro. Tente novamente.'

export function LoginForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setServerError(null)
      try {
        const { error } = await signIn(value.email, value.password)
        if (error) {
          setServerError(AUTH_ERROR_MESSAGE)
          return
        }
        navigate('/dashboard')
      } catch {
        setServerError(NETWORK_ERROR_MESSAGE)
      }
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    form.handleSubmit()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <form.Field
        name="email"
        validators={{
          onBlur: ({ value }) => validateEmail(value),
          onSubmit: ({ value }) => validateEmail(value),
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={field.name}
              className="block text-sm"
              style={{ color: 'var(--ink-700)' }}
            >
              E-mail
            </label>
            <input
              id={field.name}
              name={field.name}
              type="email"
              autoComplete="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-describedby={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
                  ? `${field.name}-error`
                  : undefined
              }
              aria-invalid={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
                  ? true
                  : undefined
              }
              className="w-full border rounded-sm px-3 text-sm"
              style={{
                borderColor:
                  field.state.meta.isTouched && field.state.meta.errors.length > 0
                    ? 'var(--rose-400)'
                    : 'var(--border-soft)',
                color: 'var(--ink-900)',
                background: 'var(--surface-raised)',
                height: 'var(--control-h-md)',
              }}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <p
                id={`${field.name}-error`}
                role="alert"
                className="text-xs"
                style={{ color: 'var(--rose-400)' }}
              >
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onBlur: ({ value }) => validatePassword(value),
          onSubmit: ({ value }) => validatePassword(value),
        }}
      >
        {(field) => (
          <div className="flex flex-col gap-1">
            <label
              htmlFor={field.name}
              className="block text-sm"
              style={{ color: 'var(--ink-700)' }}
            >
              Senha
            </label>
            <input
              id={field.name}
              name={field.name}
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-describedby={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
                  ? `${field.name}-error`
                  : undefined
              }
              aria-invalid={
                field.state.meta.isTouched && field.state.meta.errors.length > 0
                  ? true
                  : undefined
              }
              className="w-full border rounded-sm px-3 text-sm"
              style={{
                borderColor:
                  field.state.meta.isTouched && field.state.meta.errors.length > 0
                    ? 'var(--rose-400)'
                    : 'var(--border-soft)',
                color: 'var(--ink-900)',
                background: 'var(--surface-raised)',
                height: 'var(--control-h-md)',
              }}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <p
                id={`${field.name}-error`}
                role="alert"
                className="text-xs"
                style={{ color: 'var(--rose-400)' }}
              >
                {field.state.meta.errors[0]}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <button
        type="submit"
        disabled={form.state.isSubmitting}
        aria-label={form.state.isSubmitting ? 'Entrando…' : undefined}
        className="w-full px-4 rounded-pill text-sm font-medium disabled:opacity-60 cursor-pointer flex items-center justify-center"
        style={{
          background: 'var(--gold-400)',
          color: 'var(--text-on-gold)',
          height: 'var(--control-h-md)',
          transition: 'opacity var(--dur-fast) var(--ease-out)',
        }}
      >
        {form.state.isSubmitting ? <Spinner /> : 'Entrar'}
      </button>

      {serverError !== null && (
        <p
          role="alert"
          className="text-sm text-center"
          style={{ color: 'var(--rose-400)' }}
        >
          {serverError}
        </p>
      )}
    </form>
  )
}
