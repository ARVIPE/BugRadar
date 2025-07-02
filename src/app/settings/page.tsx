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
    // Aquí iría lógica real de actualización
    console.log("Updated account:", { username, password });
  };

  return (
    <>
      <Navbar />
      <div className="text-white min-h-screen py-10 px-4 md:px-10">
        <div className="max-w-5xl mx-auto space-y-8">

          {/* General Preferences */}
          <section className="border border-[#393D47] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">General Preferences</h2>
            <p className="text-sm text-gray-400">
              Configure your application’s basic settings and display options.
            </p>
            <div className="flex justify-between items-center">
              <span>Dark Mode</span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex justify-between items-center">
              <span>Language</span>
              <select className="border border-[#393D47] rounded px-2 py-1">
                <option>English</option>
                <option>Spanish</option>
              </select>
            </div>
          </section>

          {/* Notification Preferences */}
          <section className="border border-[#393D47] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="text-sm text-gray-400">
              Manage how and where you receive notifications for different BugRadar events.
            </p>

            <div className="space-y-4 text-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0 font-medium">Current Email</span>
                <input
                  value={notificationEmail}
                  disabled
                  className="bg-gray-800 text-gray-300 border border-[#393D47] px-3 py-1 rounded w-full sm:w-64"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="mb-1 sm:mb-0">Change Email</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Enter new email"
                    className="border border-[#393D47] px-3 py-1 rounded w-full sm:w-64"
                  />
                  <Button
                    onClick={handleUpdateEmail}
                    className="bg-yellow-400 text-black hover:bg-yellow-500"
                    variant="secondary"
                  >
                    Update Email
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Account Information */}
          <section className="border border-[#393D47] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Account Information</h2>
            <p className="text-sm text-gray-400">Manage your personal information and password.</p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-medium">Username</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border border-[#393D47] px-3 py-1 rounded w-full sm:w-64"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="font-medium">Password</span>
                <div className="relative w-full sm:w-64">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-[#393D47] px-3 py-1 rounded w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleUpdateAccount}
                className="bg-yellow-400 text-black hover:bg-yellow-500"
              >
                Save Changes
              </Button>
            </div>
          </section>

          {/* Data Retention */}
          <section className="border border-[#393D47] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Data Retention Policy</h2>
            <p className="text-sm text-gray-400">
              Configure how long BugRadar retains your log and error data.
            </p>
            <div className="flex justify-between items-center text-sm">
              <span>Retention Period</span>
              <select className="bg-[#1f1f25] border border-[#393D47] rounded px-2 py-1">
                <option>30 Days</option>
              </select>
            </div>
            <p className="text-xs text-yellow-500 mt-2">
              ⚠️ Changes to data retention policies may take up to 24 hours to take effect.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
