import type { ProducerKind } from '../api/types'

const LABELS: Record<ProducerKind, string> = {
  human: 'Human',
  ai_agent: 'AI agent',
  bot: 'Bot',
  unknown: 'Unknown',
}

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
  return (
    <span className={`producer producer-${kind}`} title={`Produced by ${identity}`}>
      <span className="producer-kind">{LABELS[kind]}</span>
      <span className="producer-id">
        {identity}
        {model ? ` · ${model}` : ''}
      </span>
    </span>
  )
}
