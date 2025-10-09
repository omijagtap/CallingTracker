"use client";

import { LogOut, User, Settings, Shield } from "lucide-react";

interface ProfileDropdownProps {
  email: string;
  name: string;
  onLogout: () => void;
  onProfile?: () => void;
}

export function ProfileDropdown({ email, name, onLogout, onProfile }: ProfileDropdownProps) {
  return (
    <div className="absolute z-50 right-0 mt-2 w-72 rounded-2xl shadow-2xl border border-white/10 bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl" style={{boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'}}>
      {/* Header Section */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 flex items-center justify-center rounded-full shadow-lg" 
                 style={{
                   background: 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)',
                   border: '2px solid rgba(255,255,255,0.15)',
                   boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                 }}>
              <User className="h-7 w-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-gray-900 shadow-sm"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-white truncate">{name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm text-green-400 font-medium">Online</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-2 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-gray-400 mb-1">Signed in as:</p>
          <p className="text-sm font-medium text-white truncate">{email}</p>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        {onProfile && (
          <button 
            onClick={onProfile}
            className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-white hover:bg-white/10 transition-all duration-200 group"
          >
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <span className="flex-1 text-left">My Profile</span>
            <Settings className="h-4 w-4 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        )}
        
        <button 
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-white hover:bg-red-500/10 transition-all duration-200 group mt-1"
        >
          <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
            <LogOut className="h-4 w-4 text-red-400" />
          </div>
          <span className="flex-1 text-left">Sign Out</span>
        </button>
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <p className="text-xs text-gray-500 text-center">upGrad Calling Tracker</p>
      </div>
    </div>
  );
}