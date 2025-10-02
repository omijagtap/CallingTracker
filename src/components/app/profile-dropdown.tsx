"use client";

import { LogOut, User } from "lucide-react";

interface ProfileDropdownProps {
  email: string;
  name: string;
  onLogout: () => void;
}

export function ProfileDropdown({ email, name, onLogout }: ProfileDropdownProps) {
  return (
    <div className="absolute z-50 right-0 w-64 p-4 rounded-xl shadow-lg border border-white/8 bg-gradient-to-br from-[#0b0b0b]/60 to-[#111111]/60 backdrop-blur-md" style={{boxShadow: '0 12px 40px rgba(0,0,0,0.6)'}}>
      <div className="flex items-center justify-start gap-4 p-3 border-b mb-3" style={{borderColor: 'rgba(255,255,255,0.04)'}}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full shadow-md" style={{background: 'linear-gradient(135deg,#ff8a65,#ffb74d)', border: '1px solid rgba(255,255,255,0.06)'}}>
          <User className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col space-y-1 leading-none">
          <p className="font-semibold text-lg text-white">{name}</p>
          <p className="text-sm text-amber-400 flex items-center font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-400 mr-2 flex-shrink-0"></span>
            Active
          </p>
        </div>
      </div>
      
      <div className="px-2 py-1 mb-3">
        <p className="text-xs text-amber-300">Signed in as:</p>
        <p className="text-sm font-medium truncate text-white">{email}</p>
      </div>

      <button 
        onClick={onLogout}
        className="flex w-full items-center gap-2 rounded-lg p-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </div>
  );
}