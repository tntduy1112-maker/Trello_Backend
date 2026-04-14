import React from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppLayout({ children, hideSidebar = false }) {
  return (
    <div className="min-h-screen bg-[#1D2125] flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-12">
        {!hideSidebar && (
          <div className="hidden md:flex flex-col flex-shrink-0 w-64 fixed top-12 bottom-0 left-0 z-30">
            <Sidebar />
          </div>
        )}
        <main className={`flex-1 ${!hideSidebar ? 'md:ml-64' : ''} min-h-[calc(100vh-48px)]`}>
          {children}
        </main>
      </div>
    </div>
  )
}
