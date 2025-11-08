"use client"

import { Twitter, Github, Linkedin, Globe } from "lucide-react"
import { useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function Footer() {
  const locale = useLocale()
  const pathname = usePathname()
  const [isChanging, setIsChanging] = useState(false)

  const nextLocale = locale === "en" ? "es" : "en"

  const handleChangeLocale = () => {
    const segments = pathname.split("/")
    segments[1] = nextLocale
    const newPath = segments.join("/") || "/"
    setIsChanging(true)
    window.location.href = newPath 
  }

  return (
    <footer className="bg-skin-panel py-6 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-skin-subtitle text-sm">
        <div>
          <button
            onClick={handleChangeLocale}
            className="flex items-center gap-2 px-3 py-1.5 bg-skin-bg text-skin-title rounded-md text-xs font-medium border border-border hover:bg-skin-panel/60 transition-colors"
          >
            <Globe size={14} />
            {isChanging ? "..." : locale === "en" ? "English" : "Español"}
          </button>
        </div>

        {/* Copyright */}
        <div className="text-center">
          © 2025 <span className="text-skin-title font-medium">BugRadar</span>.
        </div>

        {/* Socials */}
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-skin-title transition-colors" aria-label="Twitter">
            <Twitter size={16} />
          </a>
          <a href="#" className="hover:text-skin-title transition-colors" aria-label="GitHub">
            <Github size={16} />
          </a>
          <a href="#" className="hover:text-skin-title transition-colors" aria-label="LinkedIn">
            <Linkedin size={16} />
          </a>
        </div>
      </div>
    </footer>
  )
}
