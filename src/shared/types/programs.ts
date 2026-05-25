export interface Program {
  id: number
  title?: string
  name?: string
  code?: 'program_a' | 'program_b' | string
  type?: 'grant' | 'live_practice' | string
  is_active?: boolean
  description?: string
}
