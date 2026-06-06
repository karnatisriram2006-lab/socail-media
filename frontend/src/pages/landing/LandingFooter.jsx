import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Globe, MessageCircle, Code2, Mail, ArrowRight } from 'lucide-react'

const footerLinks = {
  platform: ['Explore', 'Trending', 'Community', 'Creators'],
  company: ['About', 'Blog', 'Careers', 'Press'],
  support: ['Help Center', 'Privacy', 'Terms', 'Contact'],
}

export default function LandingFooter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  return (
    <footer className="bg-black/50 border-t border-white/5 py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-lg mb-4">
              <Sparkles className="w-6 h-6 text-warm-400" />
              VibeSnaps
            </Link>
            <p className="text-sm text-warm-500 mb-6 max-w-xs">
              The creative platform where authenticity meets community.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-warm-500 transition-all" aria-label="Twitter">
                <Globe className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-warm-500 transition-all" aria-label="Instagram">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white text-warm-500 transition-all" aria-label="GitHub">
                <Code2 className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="text-sm font-semibold text-white mb-4">Updates</h4>
            <p className="text-xs text-warm-500 mb-3">Get the latest news and updates.</p>
            <form onSubmit={handleSubscribe} className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-warm-500 focus:outline-none focus:border-warm-500/50 transition-colors"
                aria-label="Email for newsletter"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-warm-500 flex items-center justify-center hover:bg-warm-400 transition-colors"
                aria-label="Subscribe"
              >
                {subscribed ? (
                  <span className="text-white text-xs">✓</span>
                ) : (
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                )}
              </button>
            </form>
            {subscribed && (
              <p className="text-xs text-warm-400 mt-2">Thanks for subscribing!</p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link}>
                  <Link to={`/${link.toLowerCase()}`} className="text-sm text-warm-500 hover:text-white transition-colors">
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
                  <Link to={`/${link.toLowerCase()}`} className="text-sm text-warm-500 hover:text-white transition-colors">
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
                  <Link to={`/${link.toLowerCase().replace(' ', '-')}`} className="text-sm text-warm-500 hover:text-white transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-warm-600">
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