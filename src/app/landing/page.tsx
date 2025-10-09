'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">upGrad Calling Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/login" 
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Track Learner Interactions
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
              Efficiently & Effectively
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Comprehensive platform for managing CSV uploads, tracking learner progress, 
            adding remarks, and monitoring user activities with real-time analytics.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center"
            >
              Get Started
            </Link>
            <Link 
              href="/signup" 
              className="border border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
              <span className="text-white text-xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">CSV Management</h3>
            <p className="text-gray-300">Upload and process learner data with comprehensive tracking and analytics.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
              <span className="text-white text-xl">💬</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Remarks System</h3>
            <p className="text-gray-300">Add detailed remarks and track learner interactions with full history.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
              <span className="text-white text-xl">📈</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Analytics Dashboard</h3>
            <p className="text-gray-300">Real-time insights with charts, statistics, and activity monitoring.</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
              <span className="text-white text-xl">📧</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Email Integration</h3>
            <p className="text-gray-300">Send automated reports and notifications with SMTP integration.</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-white mb-12">Trusted by Education Teams</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-2">
                1000+
              </div>
              <p className="text-gray-300">Learners Tracked</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                500+
              </div>
              <p className="text-gray-300">CSV Files Processed</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-8">
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-400 mb-2">
                24/7
              </div>
              <p className="text-gray-300">Real-time Monitoring</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-xl border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 upGrad Calling Tracker. Built with Next.js and Supabase.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
