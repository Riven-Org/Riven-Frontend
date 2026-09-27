import type { ProducerKind } from '../api/types'
import { Bot, Cpu, User } from './icons'

const LABELS: Record<ProducerKind, string> = {
  human: 'Human',
  ai_agent: 'AI agent',
  bot: 'Bot',
  unknown: 'Unknown',
}

const ICONS = { human: User, ai_agent: Cpu, bot: Bot, unknown: User }

/** Who produced a change. Shown wherever a change appears (Riven never approves its own work). */
export function Producer({
  kind,
  identity,
  model,
}: {
  kind: ProducerKind
  identity: string
  model?: string | null
}) {
  const Icon = ICONS[kind]
  return (
    <span className={`producer producer-${kind}`} title={`Produced by ${identity}`}>
      <span className="producer-kind">
        <Icon size={12} strokeWidth={2.6} />
        {LABELS[kind]}
      </span>
      <span className="producer-id">
        {identity}
        {model ? ` · ${model}` : ''}
      </span>
    </span>
  )
}
