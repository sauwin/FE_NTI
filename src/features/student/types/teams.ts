export interface PivotData {
  status: 'pending' | 'accepted' | 'rejected'
  joined_at?: string | null
}

export interface TeamMember {
  id: number
  name: string
  email: string
  pivot?: PivotData
}

export interface Team {
  id: number
  name: string
  description: string | null
  leader_id: number
  status: 'forming' | 'ready' | string
  members_count?: number
  members?: TeamMember[]
}

export interface Invitation {
  id: number
  team_id?: number
  name?: string
  status: 'forming' | 'ready' | string
  team?: { name: string }
  leader?: {
    name: string
    email: string
  }
  created_at?: string
}
