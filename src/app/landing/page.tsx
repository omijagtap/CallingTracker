'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import Link from 'next/link';
import { 
  Upload, 
  MessageSquare, 
  BarChart3, 
  Mail, 
  Users, 
  CheckCircle,
  ArrowRight,
  Star,
  Shield,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header - Same as Admin/User */}
      <header className="border-b border-gray-800/50 bg-black/90 backdrop-blur-xl sticky top-0 z-50 shadow-lg shadow-black/50">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">
                upGrad
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-white hover:bg-white/10 border-white/20" onClick={() => console.log('Header Login clicked')}>
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 bg-white/10 text-gray-300 border-gray-500/30 px-6 py-3 backdrop-blur-sm">
            ✨ upGrad Education Platform
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 cursor-pointer">
            <span className="bg-gradient-to-r from-gray-300 via-gray-100 to-white bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.9)] transition-all duration-300 hover:scale-[1.02]">
              Smart Calling Tracker
            </span>
          </h1>
          
          <div className="text-2xl text-gray-200 mb-10 max-w-4xl mx-auto leading-relaxed font-light">
            Transform your learner management with AI-powered tracking, smart feedback systems, and professional reporting. The ultimate solution for educational excellence.
          </div>
          
          <div className="text-lg text-gray-300 mb-12 max-w-2xl mx-auto font-medium">
            🚀 Upload • 📊 Track • 💬 Feedback • 📧 Report • ✨ Success
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-xl px-12 py-8 shadow-2xl shadow-orange-500/25 transform hover:scale-105 transition-all duration-300">
                🚀 Start Your Journey
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800 text-xl px-12 py-8 backdrop-blur-sm" onClick={() => console.log('Hero Login clicked')}>
                👋 Welcome Back
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">
              Why Choose upGrad Calling Tracker?
            </h2>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of learner management with our intelligent platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="bg-black/60 border-gray-800/50 backdrop-blur-md hover:bg-gray-900/60 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-6 h-6 text-orange-400" />
                </div>
                <CardTitle className="text-white text-lg mb-3">Smart CSV Processing</CardTitle>
                <CardDescription className="text-gray-400 text-sm leading-relaxed">
                  Drag, drop, and watch the magic happen! Our AI-powered system instantly processes learner data with zero errors.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="bg-black/60 border-gray-800/50 backdrop-blur-md hover:bg-gray-900/60 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                <CardTitle className="text-white text-lg mb-3">Intelligent Feedback</CardTitle>
                <CardDescription className="text-gray-400 text-sm leading-relaxed">
                  Create personalized, impactful feedback that motivates learners and drives results.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="bg-black/60 border-gray-800/50 backdrop-blur-md hover:bg-gray-900/60 transition-all duration-300 group">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <CardTitle className="text-white text-lg mb-3">Advanced Analytics</CardTitle>
                <CardDescription className="text-gray-400 text-sm leading-relaxed">
                  Beautiful dashboards and insights that turn data into actionable strategies for success.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">Email Integration</CardTitle>
                <CardDescription className="text-gray-300">
                  Send professional email reports directly to managers and stakeholders with one click.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage multiple users with role-based access control and activity tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-green-500 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-white">Secure & Reliable</CardTitle>
                <CardDescription className="text-gray-300">
                  Enterprise-grade security with data encryption and reliable backup systems.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Simple steps to get started with learner management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Sign Up</h3>
              <p className="text-gray-300">Create your account and get instant access to the platform</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Upload Data</h3>
              <p className="text-gray-300">Upload your CSV files with learner information and submission data</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Add Feedback</h3>
              <p className="text-gray-300">Review submissions and add personalized feedback for learners</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">4</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Generate Reports</h3>
              <p className="text-gray-300">Create and send professional reports to stakeholders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 bg-black/20">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Why Choose Calling Tracker?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Time-Saving Automation</h3>
                    <p className="text-gray-300">Automate repetitive tasks and focus on what matters most - helping learners succeed.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Professional Reports</h3>
                    <p className="text-gray-300">Generate beautiful, comprehensive reports that impress stakeholders and managers.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Easy Integration</h3>
                    <p className="text-gray-300">Works with your existing CSV files and email systems - no complex setup required.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Real-time Insights</h3>
                    <p className="text-gray-300">Get instant visibility into learner progress and submission patterns.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-black/80 rounded-2xl p-8 backdrop-blur-sm border border-gray-800/50">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-4xl font-bold text-orange-400">
                      <AnimatedCounter value={99} duration={2000} />%
                    </div>
                    <div className="text-gray-300 text-sm mt-1">Time Saved</div>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-4xl font-bold text-green-400">
                      <AnimatedCounter value={500} duration={2200} />+
                    </div>
                    <div className="text-gray-300 text-sm mt-1">Happy Users</div>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-400">
                      <AnimatedCounter value={24} duration={1800} />/7
                    </div>
                    <div className="text-gray-300 text-sm mt-1">Support</div>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-lg">
                    <div className="text-4xl font-bold text-red-400">
                      <AnimatedCounter value={100} duration={2400} />%
                    </div>
                    <div className="text-gray-300 text-sm mt-1">Secure</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learner Management?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join hundreds of educators and administrators who trust Calling Tracker for their learner management needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-lg px-8 py-6">
                Start Free Trial
                <Zap className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 bg-black/50 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl font-bold bg-gradient-to-r from-gray-500 via-gray-300 to-white bg-clip-text text-transparent drop-shadow-lg hover:scale-105 transition-transform duration-300">
              upGrad
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2024 UpGrad Education Private Limited. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
