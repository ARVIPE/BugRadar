import Navbar from "@/components/navbar";
import { RotateCw } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="bg-gray-800 min-h-screen w-full text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col flex-row items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#F4F4F6]">
            Dashboard Overview
          </h1>
          <button
            className="flex items-center justify-center gap-2 px-4 py-2 h-10 w-[138.9375px] text-sm font-medium text-[#8C8D8B] border border-[#393D47] rounded-md hover:bg-[#24364f] hover:text-[#8C8D8B] active:bg-black disabled:opacity-40"
          >
            <RotateCw size={16} className="text-[#8C8D8B]" />
            Refresh data
          </button>
        </div>
      </div>
    </div>
  );
}
