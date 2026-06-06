import { create } from 'zustand'
import { initSocket, onSocketEvent, removeAllSocketListeners } from '../services/socket'
import API from '../services/api'

// Socket event handlers storage for cleanup
let socketCleanupFns = []

export const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,

  // Initialize socket listeners for real-time notifications
  initSocketListeners: () => {
    // Clear any existing listeners
    socketCleanupFns.forEach(fn => fn())
    socketCleanupFns = []

    // Initialize socket connection
    initSocket()

    // New notification received
    socketCleanupFns.push(
      onSocketEvent('newNotification', (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: state.unreadCount + 1,
        }))
      })
    )

    // Notifications marked as read
    socketCleanupFns.push(
      onSocketEvent('notificationsRead', () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }))
      })
    )
  },

  // Cleanup socket listeners
  cleanupSocketListeners: () => {
    socketCleanupFns.forEach(fn => fn())
    socketCleanupFns = []
    removeAllSocketListeners()
  },

  fetchNotifications: async () => {
    set({ loading: true, error: null })
    try {
      const res = await API.get('/api/notifications')
      const notifs = res.data
      set({
        notifications: notifs,
        unreadCount: notifs.filter((n) => !n.isRead).length,
      })
    } catch (_err) {
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
    } catch {
      set({ error: 'Failed to mark notifications as read' })
    }
  },

  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}))
