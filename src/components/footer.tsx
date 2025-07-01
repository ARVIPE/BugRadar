
import { Twitter, Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 py-6 border-t border-gray-700">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-400 text-sm">
        {/* Left: Language selector */}
        <div>
          <button className="px-3 py-1.5 bg-[#2D2D33] text-white rounded-md text-xs font-medium">
            English
          </button>
        </div>

        {/* Center: Copyright */}
        <div className="text-center">© 2025 BugRadar.</div>

        {/* Right: Social icons */}
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-white" aria-label="Twitter">
            <Twitter size={16} />
          </a>
          <a href="#" className="hover:text-white" aria-label="GitHub">
            <Github size={16} />
          </a>
          <a href="#" className="hover:text-white" aria-label="LinkedIn">
            <Linkedin size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}
