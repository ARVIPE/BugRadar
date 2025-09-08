"use client"
import Image from "next/image"
import { Bell, Cog, Menu, Search, X, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState("theme-dark")
  const pathname = usePathname()

  const applyTheme = (t: string) => {
    document.documentElement.className = t
  }

  // Cargar tema guardado y aplicarlo
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
    const initial = stored === "theme-light" || stored === "theme-dark" ? stored : theme
    setTheme(initial)
    applyTheme(initial)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guardar y aplicar al cambiar
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme)
    }
    applyTheme(theme)
  }, [theme])

  // Sincronizar con otras pestañas
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && (e.newValue === "theme-light" || e.newValue === "theme-dark")) {
        setTheme(e.newValue)
        applyTheme(e.newValue)
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "theme-dark" ? "theme-light" : "theme-dark"
    setTheme(newTheme)
  }

  // Clase de link activo (usa tu color amarillo existente)
  const linkClass = (href: string) =>
    pathname && pathname.startsWith(href)
      ? "text-[var(--yellow)]"
      : "text-skin-title hover:text-skin-subtitle transition-colors"

  return (
    <nav className="bg-skin-panel p-4 shadow-sm border-b border-border">
      <div className=" mx-auto flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center space-x-2">
          <a href="/dashboard" className="flex items-center space-x-2">
            <Image src="/navbarIcon.svg" alt="BugRadar Logo" width={28} height={28} />
            <span className="text-skin-title font-semibold text-lg">BugRadar</span>
          </a>
          <ul className="hidden md:flex ml-5 items-center space-x-6 text-sm font-medium">
            <li>
              <a href="/dashboard" className={linkClass("/dashboard")}>
                Dashboard
              </a>
            </li>
            <li>
              <a href="/stats" className={linkClass("/stats")}>
                Stats
              </a>
            </li>
            <li>
              <a href="/insight" className={linkClass("/insight")}>
                Insight
              </a>
            </li>
            <li>
              <a href="/settings" className={linkClass("/settings")}>
                Settings
              </a>
            </li>
          </ul>
        </div>

        {/* Middle: Search bar (always visible) */}
        <div className="flex-1 px-4">
          <div className="relative max-w-md mx-auto">
            <span className="absolute left-3 top-2.5 text-skin-subtitle">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search logs..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-md
                         bg-[var(--color-input)] text-skin-title
                         border border-border
                         placeholder:text-skin-subtitle
                         focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
            />
          </div>
        </div>

        {/* Right: Icons, avatar, hamburger */}
        <div className="flex items-center space-x-4">
          {/* Icons */}
          <button className="text-skin-subtitle hover:text-[var(--primary)]">
            <Bell size={20} />
          </button>
          <button className="text-skin-subtitle hover:text-[var(--primary)]">
            <Cog size={20} />
          </button>

          {/* Theme toggle button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-skin-subtitle hover:text-[var(--primary)] hover:bg-[var(--color-input)] transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "theme-dark" ? (
              <Sun size={20} className="text-[var(--yellow)]" />
            ) : (
              <Moon size={20} className="text-skin-title" />
            )}
          </button>

          {/* Avatar */}
          <Image
            src="/A1.jpg"
            alt="User"
            width={32}
            height={32}
            className="rounded-full border border-border"
          />

          {/* Mobile menu toggle */}
          <button className="md:hidden text-skin-subtitle hover:text-skin-title" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden mt-3 space-y-3 px-2">
          <a href="/dashboard" className={`block font-medium ${linkClass("/dashboard")}`}>
            Dashboard
          </a>
          <a href="/stats" className={`block ${linkClass("/stats")}`}>
            Stats
          </a>
          <a href="/insight" className={`block ${linkClass("/insight")}`}>
            Insight
          </a>
          <a href="/settings" className={`block ${linkClass("/settings")}`}>
            Settings
          </a>
        </div>
      )}
    </nav>
  )
}
