import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Camera, ArrowLeft } from 'lucide-react'

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
    <div className="max-w-xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Edit Profile</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        {(error || formError) && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
            {formError || error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                <img
                  src={imagePreview || `https://ui-avatars.com/api/?name=${user?.username}&background=random&color=fff&size=200`}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${user?.username}&background=random&color=fff&size=200`
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="text-center">
                  <Camera className="w-6 h-6 text-white mx-auto" />
                  <span className="text-white text-xs">Change</span>
                </div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 text-sm font-semibold mt-3 hover:text-blue-700"
            >
              Change profile photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself"
                rows={4}
                maxLength={160}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-gray-400">{bio.length}/160</span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" loading={loading} className="flex-1">
              Save Changes
            </Button>
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm p-6 mt-4"
      >
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account Information</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm text-gray-900">{user?.email || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500">Member since</span>
            <span className="text-sm text-gray-900">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
