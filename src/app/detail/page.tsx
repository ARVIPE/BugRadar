"use client";

import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { date: "Jul 20", value: 6 },
  { date: "Jul 21", value: 8 },
  { date: "Jul 22", value: 12 },
  { date: "Jul 23", value: 15 },
  { date: "Jul 24", value: 11 },
  { date: "Jul 25", value: 18 },
  { date: "Jul 26", value: 24 },
];

export default function DetailPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/dashboard");
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-800 min-h-screen text-white py-10 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Unhandled Promise Rejection: Cannot read properties of undefined (reading 'config')
            </h1>
            <p className="text-sm text-gray-400">2024-07-26 10:30:15 UTC</p>
            <Button
              onClick={handleBack}
              className="mt-4 bg-gray-700 hover:bg-gray-600 text-sm flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </Button>
          </div>

          {/* Grid layout */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Left column */}
            <div className="md:col-span-2 space-y-6 flex flex-col">
              {/* Error Details */}
              <div className="bg-[#223145] rounded-lg border border-[#393D47] p-5">
                <h2 className="text-lg font-semibold mb-2">Error Details</h2>
                <p className="text-sm text-gray-300 mb-4">
                  An asynchronous operation failed to retrieve necessary configuration, leading to
                  an attempt to access properties of an undefined object.
                </p>
                <Button className="bg-gray-700 hover:bg-gray-600 text-sm">
                  <Code size={16} className="mr-2" /> View Stack Trace
                </Button>
              </div>

              {/* Recurrence History */}
              <div className="bg-[#223145] rounded-lg border border-[#393D47] p-5 flex-1 flex flex-col">
                <h2 className="text-lg font-semibold mb-1">Recurrence History</h2>
                <p className="text-sm text-gray-400 mb-4">Occurrences over the last 7 days</p>
                <div className="flex-grow min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <XAxis dataKey="date" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#facc15"
                        strokeWidth={2}
                        dot={{ r: 4, stroke: '#1f1f25', strokeWidth: 2, fill: '#facc15' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6 flex flex-col">
              {/* Actions */}
              <div className="bg-[#223145] rounded-lg border border-[#393D47] p-5">
                <h2 className="text-lg font-semibold mb-4">Actions</h2>
                <Button className="bg-yellow-400 text-black w-full mb-2">Mark as Resolved</Button>
                <Button className="bg-black w-full mb-2">Ignore Error</Button>
                <Button className="bg-[#2f2f35] hover:bg-[#40404b] w-full">
                  <Share2 size={16} className="mr-2" /> Share Error
                </Button>
              </div>

              {/* Tags */}
              <div className="bg-[#223145] rounded-lg border border-[#393D47] p-5">
                <h2 className="text-lg font-semibold mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-gray-700 px-2 py-1 rounded">AuthService</span>
                  <span className="bg-gray-700 px-2 py-1 rounded">production</span>
                  <span className="bg-gray-700 px-2 py-1 rounded">TypeError</span>
                  <span className="bg-red-600 px-2 py-1 rounded">High</span>
                </div>
              </div>

              {/* Related Logs */}
              <div className="bg-[#223145] rounded-lg border border-[#393D47] p-5 flex-1">
                <h2 className="text-lg font-semibold mb-1">Related Logs</h2>
                <p className="text-sm text-gray-400 mb-4">
                  Other events around this time or service
                </p>
                <div className="space-y-4">
                  {[
                    {
                      type: "High",
                      time: "10:29:50",
                      msg: "API call to /auth/login failed with status 500.",
                      service: "AuthService",
                    },
                    {
                      type: "Warning",
                      time: "10:29:45",
                      msg: "User 'john.doe' attempted login with invalid credentials.",
                      service: "AuthService",
                    },
                    {
                      type: "High",
                      time: "10:30:05",
                      msg: "Unhandled promise rejection detected.",
                      service: "AuthService",
                    },
                  ].map((log, i) => (
                    <div
                      key={i}
                      className="bg-[#1f3047] p-3 rounded text-sm flex flex-col gap-1"
                    >
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.type === "High" ? "bg-red-600" : "bg-yellow-600"
                          }`}
                        >
                          {log.type}
                        </span>
                        <span className="text-xs text-gray-400">{log.time}</span>
                      </div>
                      <p className="text-gray-100">{log.msg}</p>
                      <p className="text-xs text-gray-400">Service: {log.service}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
