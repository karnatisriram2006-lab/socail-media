import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Camera } from 'lucide-react'

export default function EditProfilePage() {
  const { user, updateProfile, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState(user?.username || '')
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [profileImage, setProfileImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(user?.profileImage || null)
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef(null)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormError('Image must be less than 2MB')
        return
      }
      setProfileImage(file)
      setImagePreview(URL.createObjectURL(file))
      setFormError('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    clearError()
    const formData = new FormData()
    formData.append('username', username)
    formData.append('name', name)
    formData.append('bio', bio)
    if (profileImage) formData.append('profileImage', profileImage)
    try {
      await updateProfile(formData)
      navigate(`/profile/${username}`)
    } catch (err) {
      setFormError(err.message || 'Update failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-6"
      >
        <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

        {(error || formError) && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-lg mb-4">
            {formError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={imagePreview || '/default-avatar.png'}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
              maxLength={150}
              className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">{bio.length}/150</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              Save Changes
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
