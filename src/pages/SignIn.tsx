import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { useAuth } from '../auth/context'
import { Fingerprint, GitHubIcon, GoogleIcon, Lock, Mail, ShieldCheck, Sparkles } from '../ui/icons'
import { Logo } from '../ui/Logo'
import { ease, fadeUp, stagger } from '../ui/variants'

const WORDS = ['every change.', 'every AI agent.', 'every bug fixed.', 'every release.']

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Verify',
    text: 'Every change runs in an isolated sandbox and is judged by an independent verifier.',
  },
  {
    icon: Fingerprint,
    title: 'Remember',
    text: 'Confirmed bugs become memory, and every fix becomes a regression lock.',
  },
  {
    icon: Sparkles,
    title: 'Learn',
    text: 'A causal graph links requirement → change → bug → fix → test.',
  },
]

function RotatingWord() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2600)
    return () => window.clearInterval(id)
  }, [])
  return (
    <span style={{ display: 'inline-block', position: 'relative' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={WORDS[index]}
          className="hero-word"
          initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
          transition={{ duration: 0.5, ease }}
        >
          {WORDS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

export function SignIn() {
  const { signIn } = useAuth()

  return (
    <div className="signin">
      <section className="signin-hero">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <motion.div className="signin-hero-copy" variants={stagger} initial="hidden" animate="show">
          <motion.span className="eyebrow" variants={fadeUp}>
            <Sparkles size={14} /> Independent verification for AI-built software
          </motion.span>
          <motion.h1 className="hero-title" variants={fadeUp}>
            Verify. Remember.
            <br />
            Learn from <RotatingWord />
          </motion.h1>
          <ul className="pillars">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <motion.li key={title} variants={fadeUp} whileHover={{ x: 6 }}>
                <span className="pillar-icon">
                  <Icon size={18} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </section>

      <main className="signin-panel">
        <motion.div
          className="signin-card"
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
        >
          <div className="signin-brand">
            <Logo size={30} />
            <span>Riven</span>
          </div>
          <div>
            <h2>Welcome back</h2>
            <p className="muted" style={{ marginTop: 6 }}>
              Sign in to your verification workspace.
            </p>
          </div>

          <div className="stack">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-social"
              onClick={() => signIn({ provider: 'github' })}
            >
              <GitHubIcon /> Continue with GitHub
            </motion.button>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-social"
              onClick={() => signIn({ provider: 'google' })}
            >
              <GoogleIcon /> Continue with Google
            </motion.button>
            <div className="divider">
              <span>or</span>
            </div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary"
              onClick={() => signIn()}
            >
              <Mail size={17} /> Continue with email
            </motion.button>
          </div>

          <p className="fine">
            New to Riven?{' '}
            <button className="link" onClick={() => signIn({ register: true })}>
              Create an account
            </button>
          </p>
          <div className="signin-foot">
            <Lock size={13} /> Secured with PKCE, verified email and optional 2FA
          </div>
        </motion.div>
      </main>
    </div>
  )
}
