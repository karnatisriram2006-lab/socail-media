import { create } from 'zustand'
import { getSocket } from '../services/socket'
import API from '../services/api'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null })
    try {
      const res = await API.get('/api/notifications')
      const notifs = res.data
      set({
        notifications: notifs,
        unreadCount: notifs.filter((n) => !n.isRead).length,
      })
    } catch (err) {
      set({ error: 'Failed to fetch notifications' })
    } finally {
      set({ loading: false })
    }
  },

  markAllRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }))
    try {
      await API.put('/api/notifications/read')
    } catch (err) {
      set({ error: 'Failed to mark notifications as read' })
    }
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}))
