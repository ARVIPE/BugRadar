// src/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import AvatarUpload from "@/components/avatar-upload";
import { useSession } from "next-auth/react";
import { createClient } from "@supabase/supabase-js";
import { getNotifyEmailFor, setNotifyEmailFor } from "./actions";

// Public client Supabase instance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export default function SettingsPage() {
  const { data: session } = useSession();
  const sessionEmail = session?.user?.email ?? "";

  // Principal status of notifications
  const [notificationEmail, setNotificationEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(true);


  // Load current notify_email from user_metadata (Admin API vía server action)
  useEffect(() => {
    (async () => {
      try {
        if (!sessionEmail) return;
        const notify = await getNotifyEmailFor(sessionEmail);
        setNotificationEmail(notify);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionEmail]);

  // Save new notify_email to user_metadata (Admin API vía server action)
  const handleUpdateNotifyEmail = async () => {
    const next = newEmail.trim();
    if (!next) return;
    if (!sessionEmail) return alert("No hay sesión activa.");

    try {
      await setNotifyEmailFor(sessionEmail, next);
      setNotificationEmail(next);
      setNewEmail("");
      alert("Email de notificaciones guardado.");
    } catch (e: any) {
      alert("No se pudo guardar: " + (e?.message ?? "Error desconocido"));
    }
  };

  // Reset password through Supabase Auth email flow
  const handleSendResetLink = async () => {
    const target = notificationEmail || sessionEmail;
    if (!target) return alert("No hay email disponible.");

    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: "http://localhost:3000/reset-password",
    });
    if (error) return alert("No se pudo enviar el enlace: " + error.message);
    alert("Te hemos enviado un email para restablecer la contraseña.");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-5xl mx-auto space-y-8">
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">
              Preferencias de Notificación
            </h2>
            <p className="text-sm text-skin-subtitle">
              Email donde recibirás notificaciones de BugRadar.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 font-medium text-skin-title">Email actual</span>
                <input
                  value={loading ? "Cargando..." : notificationEmail}
                  disabled
                  className="bg-[var(--color-input)] text-skin-subtitle border border-border px-3 py-2 rounded w-full sm:w-64"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 text-skin-title">Cambiar email de notificaciones</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Introduce el nuevo email"
                    className="bg-[var(--color-input)] text-skin-title placeholder:text-skin-subtitle border border-border px-3 py-2 rounded w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                  />
                  <Button onClick={handleUpdateNotifyEmail} className="min-w-[130px]">
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
          </section>


          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">Seguridad y perfil</h2>
            <p className="text-sm text-skin-subtitle">
              Cambia tu foto y restablece tu contraseña cuando lo necesites.
            </p>

            <div className="space-y-6">
              <AvatarUpload />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleSendResetLink}>
                  Enviar enlace de restablecimiento de contraseña
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
