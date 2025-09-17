// src/app/settings/page.tsx
"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import AvatarUpload from "@/components/avatar-upload";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [darkMode, setDarkMode] = useState(true);

  // Usamos el email de la sesión como valor inicial
  const [notificationEmail, setNotificationEmail] = useState(session?.user?.email || "");
  const [newEmail, setNewEmail] = useState("");

  // Usamos el nombre de usuario de la sesión (si existe)
  const [username, setUsername] = useState(session?.user?.name || "arvipe");
  const [password, setPassword] = useState("••••••••"); // Mantenemos esto como placeholder
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdateEmail = () => {
    if (newEmail.trim()) {
      setNotificationEmail(newEmail.trim());
      setNewEmail("");
      // Aquí iría la lógica para actualizar el email en el backend
      alert("Email actualizado (simulación)");
    }
  };

  const handleUpdateAccount = () => {
    // Aquí iría la lógica para actualizar el nombre de usuario y la contraseña
    console.log("Updated account:", { username, password });
    alert("Información de la cuenta guardada (simulación)");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* General Preferences */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">Preferencias Generales</h2>
            <p className="text-sm text-skin-subtitle">
              Configura los ajustes básicos y las opciones de visualización de tu aplicación.
            </p>

            <div className="flex justify-between items-center">
              <span className="text-skin-title">Modo Oscuro</span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-skin-title">Idioma</span>
              <select
                className="rounded px-2 py-1
                           bg-[var(--color-input)] text-skin-title
                           border border-border
                           focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
              >
                <option>Español</option>
                <option>English</option>
              </select>
            </div>
          </section>

          {/* Notification Preferences */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">Preferencias de Notificación</h2>
            <p className="text-sm text-skin-subtitle">
              Gestiona cómo y dónde recibes las notificaciones de los eventos de BugRadar.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 font-medium text-skin-title">Email Actual</span>
                <input
                  value={notificationEmail}
                  disabled
                  className="bg-[var(--color-input)] text-skin-subtitle
                             border border-border px-3 py-2 rounded
                             w-full sm:w-64"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 text-skin-title">Cambiar Email</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Introduce el nuevo email"
                    className="bg-[var(--color-input)] text-skin-title
                               placeholder:text-skin-subtitle
                               border border-border px-3 py-2 rounded
                               w-full sm:w-64
                               focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                  />
                  <Button onClick={handleUpdateEmail} className="min-w-[130px]">
                    Actualizar Email
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Account Information */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">Información de la Cuenta</h2>
            <p className="text-sm text-skin-subtitle">
              Gestiona tu información personal y tu contraseña.
            </p>

            <div className="space-y-6">
              <AvatarUpload />
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-medium text-skin-title">Nombre de usuario</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-[var(--color-input)] text-skin-title
                             border border-border px-3 py-2 rounded
                             w-full sm:w-64
                             focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-medium text-skin-title">Contraseña</span>
                <div className="relative w-full sm:w-64">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[var(--color-input)] text-skin-title
                               border border-border px-3 py-2 rounded w-full pr-10
                               focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-skin-subtitle hover:text-skin-title"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button onClick={handleUpdateAccount} className="min-w-[140px]">
                Guardar Cambios
              </Button>
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">Política de Retención de Datos</h2>
            <p className="text-sm text-skin-subtitle">
              Configura durante cuánto tiempo BugRadar conserva tus logs y datos de errores.
            </p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-skin-title">Periodo de Retención</span>
              <select
                className="rounded px-2 py-1
                           bg-[var(--color-input)] text-skin-title
                           border border-border
                           focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
              >
                <option>30 Días</option>
                <option>60 Días</option>
                <option>90 Días</option>
              </select>
            </div>
            <p className="text-xs mt-2 text-skin-subtitle">
              ⚠️ Los cambios en las políticas de retención de datos pueden tardar hasta 24 horas en aplicarse.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}