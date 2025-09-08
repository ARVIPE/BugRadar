"use client";

import { useState } from "react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState("arvipe@hotmail.com");
  const [newEmail, setNewEmail] = useState("");

  // Account info
  const [username, setUsername] = useState("arvipe");
  const [password, setPassword] = useState("12345678");
  const [showPassword, setShowPassword] = useState(false);

  const handleUpdateEmail = () => {
    if (newEmail.trim()) {
      setNotificationEmail(newEmail.trim());
      setNewEmail("");
    }
  };

  const handleUpdateAccount = () => {
    console.log("Updated account:", { username, password });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-10 px-4 md:px-10 bg-skin-bg text-skin-title">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* General Preferences */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">General Preferences</h2>
            <p className="text-sm text-skin-subtitle">
              Configure your application’s basic settings and display options.
            </p>

            <div className="flex justify-between items-center">
              <span className="text-skin-title">Dark Mode</span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-skin-title">Language</span>
              <select
                className="rounded px-2 py-1
                           bg-[var(--color-input)] text-skin-title
                           border border-border
                           focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
              >
                <option>English</option>
                <option>Spanish</option>
              </select>
            </div>
          </section>

          {/* Notification Preferences */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">Notification Preferences</h2>
            <p className="text-sm text-skin-subtitle">
              Manage how and where you receive notifications for different BugRadar events.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 font-medium text-skin-title">Current Email</span>
                <input
                  value={notificationEmail}
                  disabled
                  className="bg-[var(--color-input)] text-skin-subtitle
                             border border-border px-3 py-2 rounded
                             w-full sm:w-64"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 text-skin-title">Change Email</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="bg-[var(--color-input)] text-skin-title
                               placeholder:text-skin-subtitle
                               border border-border px-3 py-2 rounded
                               w-full sm:w-64
                               focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
                  />
                  <Button onClick={handleUpdateEmail} className="min-w-[130px]">
                    Update Email
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Account Information */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">Account Information</h2>
            <p className="text-sm text-skin-subtitle">
              Manage your personal information and password.
            </p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-medium text-skin-title">Username</span>
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
                <span className="font-medium text-skin-title">Password</span>
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
                Save Changes
              </Button>
            </div>
          </section>

          {/* Data Retention */}
          <section className="bg-skin-panel border border-border rounded-lg p-6 space-y-4 shadow-elev-1">
            <h2 className="text-lg font-semibold text-skin-title">Data Retention Policy</h2>
            <p className="text-sm text-skin-subtitle">
              Configure how long BugRadar retains your log and error data.
            </p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-skin-title">Retention Period</span>
              <select
                className="rounded px-2 py-1
                           bg-[var(--color-input)] text-skin-title
                           border border-border
                           focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-[var(--ring)]"
              >
                <option>30 Days</option>
                <option>60 Days</option>
                <option>90 Days</option>
              </select>
            </div>
            <p className="text-xs mt-2">
              ⚠️ Changes to data retention policies may take up to 24 hours to take effect.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
