import type { ProducerKind } from '../api/types'
import { Badge, type Tone } from './Badge'
import { Bot, Cpu, User } from './icons'

const KIND: Record<ProducerKind, { label: string; tone: Tone; icon: typeof User }> = {
  human: { label: 'Human', tone: 'success', icon: User },
  ai_agent: { label: 'AI agent', tone: 'accent', icon: Cpu },
  bot: { label: 'Bot', tone: 'info', icon: Bot },
  unknown: { label: 'Unknown', tone: 'neutral', icon: User },
}

/** Who produced a change — always visible where a change appears. */
export function ProducerKindBadge({ kind }: { kind: ProducerKind }) {
  const k = KIND[kind]
  return (
    <Badge tone={k.tone} icon={k.icon}>
      {k.label}
    </Badge>
  )
}

export function Producer({
  kind,
  identity,
  model,
}: {
  kind: ProducerKind
  identity: string
  model?: string | null
}) {
  return (
    <span className="cell-stack" title={`Produced by ${identity}`}>
      <span className="row" style={{ gap: 6 }}>
        <ProducerKindBadge kind={kind} />
      </span>
      <span className="truncate">
        {identity}
        {model ? ` · ${model}` : ''}
      </span>
    </span>
  )
}
