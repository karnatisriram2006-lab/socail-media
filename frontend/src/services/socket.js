import { io } from 'socket.io-client'
import { auth } from '../config/firebase'

let socket = null

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

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
