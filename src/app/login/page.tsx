"use client";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-black/70 border border-gray-800/50 backdrop-blur-xl shadow-2xl rounded-lg p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your account to continue</p>
          </div>
          
          <form className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-white text-sm font-medium">Email or Username</label>
              <input
                id="email"
                type="text"
                placeholder="Enter your email or username"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-white text-sm font-medium">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-gray-400 mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-300">
              <div><strong>Admin:</strong> Air01 / Omkar@123</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
