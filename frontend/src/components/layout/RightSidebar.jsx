import { Link } from 'react-router-dom'
import { Eye } from 'lucide-react'

const activity = [
  {
    type: 'follow',
    name: 'Deraa',
    sub: 'Started following you.',
    time: '5m',
    avatar: 'https://i.pravatar.cc/150?u=deraa',
  },
  {
    type: 'view',
    name: 'Ediva',
    sub: 'liked your photo.',
    time: '30m',
    avatar: 'https://i.pravatar.cc/150?u=ediva',
  },
]

const yesterdayActivity = [
  {
    type: 'like',
    name: 'Fraha_',
    sub: 'liked your photo.',
    time: '1D',
    avatar: 'https://i.pravatar.cc/150?u=fraha1',
  },
  {
    type: 'like',
    name: 'Fraha_',
    sub: 'liked your photo.',
    time: '1D',
    avatar: 'https://i.pravatar.cc/150?u=fraha2',
  },
]

const suggested = [
  { name: 'Najid', sub: 'Followed by Dims', avatar: 'https://i.pravatar.cc/150?u=najid', status: 'Followed' },
  { name: 'Sheila Dare', sub: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?u=sheila', status: 'Follow' },
  { name: 'Divyaurey', sub: 'Suggested for you', avatar: 'https://i.pravatar.cc/150?u=divya', status: 'Follow' },
  { name: 'Jhonsan', sub: 'Followed by Andrea', avatar: 'https://i.pravatar.cc/150?u=jhonsan', status: 'Follow' },
]

export default function RightSidebar() {
  return (
    <aside
      className="hidden xl:flex flex-col fixed right-0 top-[70px] bottom-0 w-[300px] px-3 py-4 overflow-y-auto"
      style={{ background: '#F5F5F7' }}
    >
      {/* Activity Card */}
      <div className="bg-white rounded-[18px] shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-900">Activity</h3>
          <button className="text-xs text-gray-500 hover:text-gray-700">See all</button>
        </div>

        <div className="px-2 pb-2">
          {activity.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img src={a.avatar} alt={a.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 leading-snug">
                  <span className="font-semibold text-gray-900">{a.name}</span>{' '}
                  <span className="text-gray-600">{a.sub}</span>
                </p>
                <p className="text-[11px] text-gray-400">{a.time}</p>
              </div>
              {a.type === 'follow' ? (
                <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0">
                  Follow
                </button>
              ) : (
                <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-4 pt-2 pb-1">
          <h4 className="text-xs font-semibold text-gray-700">Yesterday</h4>
        </div>
        <div className="px-2 pb-3">
          {yesterdayActivity.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <img src={a.avatar} alt={a.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-800 leading-snug">
                  <span className="font-semibold text-gray-900">{a.name}</span>{' '}
                  <span className="text-gray-600">{a.sub}</span>
                </p>
                <p className="text-[11px] text-gray-400">{a.time}</p>
              </div>
              <button className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested For You */}
      <div className="bg-white rounded-[18px] mt-4 shadow-sm">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-900">Suggested For you</h3>
          <button className="text-xs text-gray-500 hover:text-gray-700">See all</button>
        </div>
        <div className="px-2 pb-3">
          {suggested.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Link to={`/profile/${s.name}`}>
                <img src={s.avatar} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/profile/${s.name}`}
                  className="text-sm font-semibold text-gray-900 hover:underline truncate block"
                >
                  {s.name}
                </Link>
                <p className="text-[11px] text-gray-500 truncate">{s.sub}</p>
              </div>
              <button
                className={`text-xs font-semibold shrink-0 ${
                  s.status === 'Followed'
                    ? 'text-gray-500 hover:text-gray-700'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                {s.status}
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
