import type { ComponentType } from 'react'

import type { Permission } from './api/types'
import { GitCommitHorizontal, KeyRound, LayoutDashboard, ShieldCheck, Users } from './ui/icons'

export type NavItem = {
  to: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  needs?: Permission
  hint: string
}

export const NAV: NavItem[] = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, hint: 'Dashboard and activity' },
  {
    to: '/changes',
    label: 'Changes',
    icon: GitCommitHorizontal,
    needs: 'changes.read',
    hint: 'Captured changes and producers',
  },
  {
    to: '/members',
    label: 'Members',
    icon: Users,
    needs: 'members.read',
    hint: 'People, roles and invitations',
  },
  {
    to: '/api-keys',
    label: 'API keys',
    icon: KeyRound,
    needs: 'api_keys.read',
    hint: 'Agents, CI and bots',
  },
  { to: '/security', label: 'Security', icon: ShieldCheck, hint: 'Two-factor and sessions' },
]
