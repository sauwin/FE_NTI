export interface MilestonePayload {
  title: string
  due_date: string
  description?: string
}

export interface MilestoneStatusPayload {
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
}
