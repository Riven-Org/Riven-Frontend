// Response types generated from the backend's OpenAPI (`npm run api:types`).
import type { components } from './schema'

type Schemas = components['schemas']

export type Me = Schemas['MeOut']
export type Org = Schemas['OrgOut']
export type Member = Schemas['MemberOut']
export type Invitation = Schemas['InvitationOut']
export type Permission = Schemas['Permission']
export type Role = Schemas['Role']

export const ROLES: Role[] = ['owner', 'admin', 'maintainer', 'reviewer', 'viewer']
