import { Link } from 'react-router-dom'
import { Sparkles, Github, Twitter, Instagram } from 'lucide-react'

const footerLinks = {
  platform: ['Explore', 'Trending', 'Community', 'Creators'],
  company: ['About', 'Blog', 'Careers', 'Press'],
  support: ['Help Center', 'Privacy', 'Terms', 'Contact'],
}

export default function LandingFooter() {
  return (
    <footer className="bg-gray-950/50 border-t border-white/5 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg mb-4">
              <Sparkles className="w-6 h-6 text-blue-400" />
              VibeSnaps
            </Link>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              The creative platform where authenticity meets community.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-gray-500 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-gray-500 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-gray-500 transition-all">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase()}`} className="text-sm text-gray-500 hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase()}`} className="text-sm text-gray-500 hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-500 hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
          <p>© 2026 VibeSnaps. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>English (US)</span>
            <span className="text-white/10">|</span>
            <span>United States</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
