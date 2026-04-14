import React from 'react'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
          <Zap size={22} className="text-blue-600" />
        </div>
        <span className="text-3xl font-bold text-white tracking-tight">TaskFlow</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          {children}
        </div>
      </div>

      <p className="mt-6 text-blue-200 text-sm">
        © 2025 TaskFlow. All rights reserved.
      </p>
    </div>
  )
}
