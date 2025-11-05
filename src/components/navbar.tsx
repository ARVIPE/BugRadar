// src/components/navbar.tsx
"use client"
import Image from "next/image"
import { Bell, Cog, Menu, Search, X, Moon, Sun, User, LogOut } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react" // NUEVO: Importamos useSession

export default function Navbar() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [theme, setTheme] = useState("theme-dark")
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  // ... (toda la lógica de los hooks se mantiene igual)
  const applyTheme = (t: string) => {
    document.documentElement.className = t
  }

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null
   // const initial = stored === "theme-light" || stored === "theme-dark" ? stored : theme
    const initial = "theme-dark"
    setTheme(initial)
    applyTheme(initial)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme)
    }
    applyTheme(theme)
  }, [theme])

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);


  const toggleTheme = () => {
    const newTheme = theme === "theme-dark" ? "theme-light" : "theme-dark"
    setTheme(newTheme)
  }
  
  const linkClass = (href: string) =>
    pathname && pathname.startsWith(href)
      ? "text-[var(--yellow)]"
      : "text-skin-title hover:text-skin-subtitle transition-colors"

  return (
    <nav className="bg-skin-panel p-4 shadow-sm border-b border-border">
      <div className=" mx-auto flex items-center justify-between">
        {/* ... (logo y navegación principal se mantienen igual) ... */}
         <div className="flex items-center space-x-2">
          <a href="/dashboard" className="flex items-center space-x-2">
            <Image src="/bugradar-logo.png" alt="BugRadar Logo" width={28} height={28} />
            <span className="text-skin-title font-semibold text-lg">BugRadar</span>
          </a>
          <ul className="hidden md:flex ml-5 items-center space-x-6 text-sm font-medium">
            <li><a href="/dashboard" className={linkClass("/dashboard")}>Dashboard</a></li>
            <li><a href="/stats" className={linkClass("/stats")}>Stats</a></li>
            <li><a href="/insight" className={linkClass("/insight")}>Insight</a></li>
            <li><a href="/settings" className={linkClass("/settings")}>Settings</a></li>
          </ul>
        </div>

        {/* Derecha: Iconos y menú de perfil */}
        <div className="flex items-center space-x-4">
          {/*<button className="text-skin-subtitle hover:text-[var(--primary)]"><Bell size={20} /></button>*/}
          <a href="/settings" className="text-skin-subtitle hover:text-[var(--primary)]"><Cog size={20} /></a>
           {/*
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-skin-subtitle hover:text-[var(--primary)] hover:bg-[var(--color-input)] transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "theme-dark" ? <Sun size={20} className="text-[var(--yellow)]" /> : <Moon size={20} className="text-skin-title" />}
          </button>*/}

          {/* Contenedor del menú de perfil */}
          <div className="relative" ref={profileMenuRef}>
            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
              <Image
                // NUEVO: Usamos la imagen de la sesión, con un fallback a la imagen por defecto.
                src={session?.user?.image || "/A1.jpg"} 
                alt="User Avatar"
                width={32}
                height={32}
                className="rounded-full border border-border cursor-pointer bg-gray-500" // Añadimos un fondo por si la imagen tarda en cargar
              />
            </button>
            
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-skin-panel border border-border rounded-md shadow-lg z-10">
                <ul className="py-1">
                  <li>
                    <a href="/settings" className="flex items-center px-4 py-2 text-sm text-skin-title hover:bg-skin-bg">
                      <User size={14} className="mr-2" />
                      Cambiar foto
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-skin-title hover:bg-skin-bg"
                    >
                      <LogOut size={14} className="mr-2" />
                      Cerrar Sesión
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Menú móvil */}
          <button className="md:hidden text-skin-subtitle hover:text-skin-title" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* ... (el desplegable del menú móvil se mantiene igual) ... */}
       {isOpen && (
        <div className="md:hidden mt-3 space-y-3 px-2">
          <a href="/dashboard" className={`block font-medium ${linkClass("/dashboard")}`}>Dashboard</a>
          <a href="/stats" className={`block ${linkClass("/stats")}`}>Stats</a>
          <a href="/insight" className={`block ${linkClass("/insight")}`}>Insight</a>
          <a href="/settings" className={`block ${linkClass("/settings")}`}>Settings</a>
        </div>
      )}
    </nav>
  )
}