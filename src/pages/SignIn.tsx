import { useAuth } from '../auth/context'
import { Button } from '../ui/Button'
import {
  Fingerprint,
  GitHubIcon,
  GoogleIcon,
  ICON_STROKE,
  Lock,
  Mail,
  ShieldCheck,
  Workflow,
} from '../ui/icons'
import { Logo } from '../ui/Logo'

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Independent verification',
    text: 'Each change runs in an isolated sandbox and is judged by a verifier that never produced it.',
  },
  {
    icon: Fingerprint,
    title: 'Institutional memory',
    text: 'Confirmed bugs are remembered, and every fix becomes a regression lock.',
  },
  {
    icon: Workflow,
    title: 'A causal record',
    text: 'Requirements, changes, bugs, fixes and tests stay linked, so you can see why code exists.',
  },
]

export function SignIn() {
  const { signIn } = useAuth()

  return (
    <div className="auth">
      <main className="auth__main">
        <span className="brand">
          <Logo size={24} />
          Riven
        </span>
        <div className="auth__form">
          <div className="auth__heading">
            <h1 className="t-display">Sign in to Riven</h1>
            <p>Verification and memory for software built with AI.</p>
          </div>
          <div className="auth__providers">
            <Button block icon={GitHubIconAdapter} onClick={() => signIn({ provider: 'github' })}>
              Continue with GitHub
            </Button>
            <Button block icon={GoogleIconAdapter} onClick={() => signIn({ provider: 'google' })}>
              Continue with Google
            </Button>
          </div>
          <div className="auth__divider">or</div>
          <div className="auth__providers">
            <Button variant="primary" block icon={Mail} onClick={() => signIn()}>
              Continue with email
            </Button>
            <p className="t-sm t-muted" style={{ textAlign: 'center' }}>
              New to Riven?{' '}
              <button
                className="btn btn--ghost btn--sm"
                style={{ color: 'var(--accent-text)', padding: '0 4px' }}
                onClick={() => signIn({ register: true })}
              >
                Create an account
              </button>
            </p>
          </div>
        </div>
        <div className="auth__foot">
          <span className="row" style={{ gap: 6 }}>
            <Lock size={12} strokeWidth={ICON_STROKE} /> PKCE sign-in · verified email · optional
            2FA
          </span>
          <span>© Riven</span>
        </div>
      </main>
      <aside className="auth__aside" aria-label="About Riven">
        <blockquote>Riven never approves its own work.</blockquote>
        <ul className="principles">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="principles__icon">
                <Icon size={16} strokeWidth={ICON_STROKE} />
              </span>
              <span>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="pipeline" aria-label="Pipeline">
          {['Capture', 'Sandbox', 'Verify', 'Remember', 'Lock'].map((s, i) => (
            <span key={s} style={{ display: 'contents' }}>
              {i > 0 && <span style={{ border: 0, background: 'none', padding: 0 }}>→</span>}
              <span>{s}</span>
            </span>
          ))}
        </div>
      </aside>
    </div>
  )
}

function GitHubIconAdapter({ size }: { size?: number }) {
  return <GitHubIcon size={size} />
}

function GoogleIconAdapter({ size }: { size?: number }) {
  return <GoogleIcon size={size} />
}
