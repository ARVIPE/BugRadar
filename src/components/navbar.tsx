"use client";
import Image from "next/image";
import { Bell, Cog, Menu, Search, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 p-4 shadow-sm border-b border-gray-700">
      <div className=" mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center space-x-2">
          <a href="/dashboard" className="flex items-center space-x-2">
          <Image src="/navbarIcon.svg" alt="BugRadar Logo" width={28} height={28} />
          <span className="text-white font-semibold text-lg">BugRadar</span>
          </a>
          <ul className="hidden md:flex ml-5 items-center space-x-6 text-sm font-medium">
            <li>
              <a
                href="/dashboard"
                className="text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                Dashboard
              </a>
            </li>
             <li>
              <a
                href="/stats"
                className="text-white hover:text-gray-300 transition-colors"
              >
                Stats
              </a>
            </li>
              <li>
              <a
                href="/insight"
                className="text-white hover:text-gray-300 transition-colors"
              >
                Insight
              </a>
            </li>
            <li>
              <a
                href="/settings"
                className="text-white hover:text-gray-300 transition-colors"
              >
                Settings
              </a>
            </li>
          </ul>
        </div>

        {/* Middle: Search bar (always visible) */}
        <div className="flex-1 px-4">
          <div className="relative max-w-md mx-auto">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-transparent border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
            />
          </div>
        </div>

        {/* Right: Icons, avatar, hamburger */}
        <div className="flex items-center space-x-4">
        

          {/* Icons */}
          <button className="text-gray-400 hover:text-yellow-400">
            <Bell size={20} />
          </button>
          <button className="text-gray-400 hover:text-yellow-400">
            <Cog size={20} />
          </button>

          {/* Avatar */}
          <Image
            src="/A1.jpg"
            alt="User"
            width={32}
            height={32}
            className="rounded-full border border-gray-600"
          />

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden mt-3 space-y-3 px-2">
          <a
            href="/dashboard"
            className="block text-yellow-400 font-medium hover:text-yellow-300"
          >
            Dashboard
          </a>
          <a
            href="/stats"
            className="block text-white hover:text-gray-300"
          >
            Stats
          </a>
          <a
            href="/insight"
            className="block text-white hover:text-gray-300"
          >
            Insight
          </a>
          <a
            href="/settings"
            className="block text-white hover:text-gray-300"
          >
            Settings
          </a>
        </div>
      )}
    </nav>
  );
}
