import api from '@/shared/api/axios'

export function getNotifications() {
  return api.get('/notifications')
}

export function markNotificationRead(id: number | string) {
  return api.patch(`/notifications/${id}/read`)
}

export function markAllNotificationsRead() {
  return api.patch('/notifications/read-all')
}
