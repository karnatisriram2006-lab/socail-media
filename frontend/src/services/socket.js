import { io } from 'socket.io-client'
import { auth } from '../config/firebase'

let socket = null
const eventListeners = new Map()

export const getSocket = () => socket

export const initSocket = async () => {
  if (socket?.connected) return socket

  const currentUser = auth.currentUser
  if (!currentUser) return null

  const token = await currentUser.getIdToken()

  socket = io('http://localhost:5000', {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => console.log('Socket connected'))
  socket.on('disconnect', () => console.log('Socket disconnected'))
  socket.on('connect_error', (err) => console.error('Socket error:', err.message))

  // Re-attach any registered event listeners
  eventListeners.forEach((handlers, event) => {
    handlers.forEach(handler => socket.on(event, handler))
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

// Event listener management
export const onSocketEvent = (event, handler) => {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set())
  }
  eventListeners.get(event).add(handler)
  
  // If socket is already connected, attach immediately
  if (socket?.connected) {
    socket.on(event, handler)
  }
  
  // Return cleanup function
  return () => offSocketEvent(event, handler)
}

export const offSocketEvent = (event, handler) => {
  if (eventListeners.has(event)) {
    eventListeners.get(event).delete(handler)
    if (socket?.connected) {
      socket.off(event, handler)
    }
  }
}

export const removeAllSocketListeners = (event) => {
  if (event) {
    if (eventListeners.has(event)) {
      eventListeners.get(event).forEach(handler => {
        if (socket?.connected) socket.off(event, handler)
      })
      eventListeners.delete(event)
    }
  } else {
    eventListeners.forEach((handlers, eventName) => {
      handlers.forEach(handler => {
        if (socket?.connected) socket.off(eventName, handler)
      })
    })
    eventListeners.clear()
  }
}
