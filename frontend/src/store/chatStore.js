import { create } from 'zustand'
import { initSocket, onSocketEvent, getSocket } from '../services/socket'
import API from '../services/api'
import { useAuthStore } from './authStore'

let socketCleanupFns = []

const formatUnreadTotal = (conversations, userId) =>
  conversations.reduce((sum, convo) => {
    const unread = convo.unreadCount?.[userId] ?? 0
    return sum + unread
  }, 0)

export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  typingUsers: {},
  activeUsers: {},
  searchResults: [],
  loading: false,
  error: null,
  unreadTotal: 0,

  clearError: () => set({ error: null }),

  setCurrentConversation: (conversationId) => set({ currentConversationId: conversationId }),

  fetchConversations: async () => {
    set({ loading: true, error: null })
    try {
      const res = await API.get('/api/chat/conversations')
      const currentUserId = useAuthStore.getState().user?._id
      set({
        conversations: res.data,
        unreadTotal: formatUnreadTotal(res.data, currentUserId),
      })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Unable to load conversations' })
    } finally {
      set({ loading: false })
    }
  },

  createConversation: async (participantId) => {
    set({ loading: true, error: null })
    try {
      const res = await API.post('/api/chat/conversations', { participantId })
      set((state) => ({
        conversations: [res.data, ...state.conversations.filter((conv) => conv._id !== res.data._id)],
      }))
      return res.data
    } catch (err) {
      set({ error: err.response?.data?.message || 'Unable to open conversation' })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  fetchMessages: async (conversationId) => {
    set({ loading: true, error: null })
    try {
      const res = await API.get(`/api/chat/conversations/${conversationId}/messages`)
      set({ messages: res.data, currentConversationId: conversationId })
    } catch (err) {
      set({ error: err.response?.data?.message || 'Unable to load messages' })
    } finally {
      set({ loading: false })
    }
  },

  searchUsers: async (query) => {
    if (!query) return set({ searchResults: [] })
    try {
      const res = await API.get(`/api/users/search?q=${encodeURIComponent(query)}`)
      set({ searchResults: res.data })
    } catch {
      set({ searchResults: [] })
    }
  },

  sendMessage: async (conversationId, payload) => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) {
      throw new Error('Authentication required')
    }

    const messageId = `temp-${Date.now()}`
    const optimisticMessage = {
      _id: messageId,
      conversationId,
      sender: { _id: currentUser._id, username: currentUser.username || 'You' },
      receiver: null,
      messageType: payload.messageType || 'text',
      content: payload.content || '',
      imageUrl: payload.imageUrl,
      isSeen: false,
      createdAt: new Date().toISOString(),
      pending: true,
    }

    set((state) => ({ messages: [...state.messages, optimisticMessage] }))

    try {
      const res = await API.post(`/api/chat/conversations/${conversationId}/messages`, payload)
      set((state) => ({
        messages: state.messages.map((message) =>
          message._id === messageId ? res.data.message : message
        ),
        conversations: state.conversations.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, ...res.data.conversation }
            : conversation
        ),
      }))
    } catch (err) {
      set((state) => ({
        messages: state.messages.filter((message) => message._id !== messageId),
        error: err.response?.data?.message || 'Failed to send message',
      }))
      throw err
    }
  },

  markSeen: async (conversationId) => {
    try {
      await API.post(`/api/chat/conversations/${conversationId}/seen`)
      const currentUserId = useAuthStore.getState().user?._id
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation._id === conversationId
            ? { ...conversation, unreadCount: { ...conversation.unreadCount, [currentUserId]: 0 } }
            : conversation
        ),
        messages: state.messages.map((message) =>
          (message.receiver === currentUserId || message.receiver?._id === currentUserId)
            ? { ...message, isSeen: true, seenAt: new Date().toISOString() }
            : message
        ),
      }))
    } catch (err) {
      console.error('markSeen error', err)
    }
  },

  initSocketListeners: () => {
    socketCleanupFns.forEach((fn) => fn())
    socketCleanupFns = []

    initSocket()

    socketCleanupFns.push(
      onSocketEvent('message_received', (payload) => {
        const currentUserId = useAuthStore.getState().user?._id
        const conversationId = payload.conversationId
        set((state) => {
          const updatedConversations = state.conversations.map((conversation) =>
            conversation._id === conversationId
              ? {
                  ...conversation,
                  lastMessage: payload.conversation.lastMessage,
                  lastMessageType: payload.conversation.lastMessageType,
                  lastMessageAt: payload.conversation.lastMessageAt,
                  unreadCount: payload.conversation.unreadCount,
                }
              : conversation
          )

          const newMessages =
            state.currentConversationId === conversationId
              ? [...state.messages, payload.message]
              : state.messages

          return {
            conversations: updatedConversations,
            messages: newMessages,
            unreadTotal: formatUnreadTotal(updatedConversations, currentUserId),
          }
        })
      })
    )

    socketCleanupFns.push(
      onSocketEvent('conversationUpdated', (conversation) => {
        const currentUserId = useAuthStore.getState().user?._id
        set((state) => ({
          conversations: state.conversations.map((item) =>
            item._id === conversation._id ? { ...item, ...conversation } : item
          ),
          unreadTotal: formatUnreadTotal(
            state.conversations.map((item) =>
              item._id === conversation._id ? { ...item, ...conversation } : item
            ),
            currentUserId
          ),
        }))
      })
    )

    socketCleanupFns.push(
      onSocketEvent('message_seen', ({ conversationId, userId }) => {
        const currentUserId = useAuthStore.getState().user?._id
        set((state) => ({
          messages: state.messages.map((message) =>
            message.conversationId === conversationId && message.sender?._id === currentUserId
              ? { ...message, isSeen: true, seenAt: new Date().toISOString() }
              : message
          ),
          conversations: state.conversations.map((conversation) =>
            conversation._id === conversationId
              ? {
                  ...conversation,
                  unreadCount: {
                    ...conversation.unreadCount,
                    [currentUserId]: userId === currentUserId ? 0 : conversation.unreadCount?.[currentUserId] ?? 0,
                  },
                }
              : conversation
          ),
          unreadTotal: formatUnreadTotal(state.conversations, currentUserId),
        }))
      })
    )

    socketCleanupFns.push(
      onSocketEvent('typingStart', ({ conversationId, userId }) => {
        const currentUserId = useAuthStore.getState().user?._id
        if (userId === currentUserId) return
        set((state) => ({
          typingUsers: { ...state.typingUsers, [conversationId]: true },
        }))
      })
    )

    socketCleanupFns.push(
      onSocketEvent('typingStop', ({ conversationId, userId }) => {
        const currentUserId = useAuthStore.getState().user?._id
        if (userId === currentUserId) return
        set((state) => ({
          typingUsers: { ...state.typingUsers, [conversationId]: false },
        }))
      })
    )

    socketCleanupFns.push(
      onSocketEvent('userStatusChange', ({ userId, isOnline }) => {
        set((state) => ({
          activeUsers: {
            ...state.activeUsers,
            [userId]: isOnline,
          },
        }))
      })
    )
  },

  cleanupSocketListeners: () => {
    socketCleanupFns.forEach((fn) => fn())
    socketCleanupFns = []
  },

  emitTyping: (conversationId, action) => {
    const socket = getSocket()
    if (!socket || !conversationId) return
    socket.emit(action === 'start' ? 'typingStart' : 'typingStop', { conversationId })
  },

  joinConversation: (conversationId) => {
    const socket = getSocket()
    if (!socket || !conversationId) return
    socket.emit('joinConversation', { conversationId })
  },

  leaveConversation: (conversationId) => {
    const socket = getSocket()
    if (!socket || !conversationId) return
    socket.emit('leaveConversation', { conversationId })
  },
}))
