import api from '@/shared/api/axios'
import type { MentorProfile } from '@/features/mentor/types/profile'

export function getMentorProfile() {
  return api.get<MentorProfile>('/mentor-profile')
}

export function updateMentorProfile(payload: MentorProfile) {
  return api.put('/mentor-profile', payload)
}
