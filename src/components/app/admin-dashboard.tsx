'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart3, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Upload, 
  Users2,
  Activity,
  TrendingUp,
  Database,
  Settings,
  Search
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from '../ui/button';
import { AdminSearch } from './admin-search';
import { AnimatedCounter } from '../ui/animated-counter';

interface TrackingData {
  csvUploads: Array<{
    id: string;
    userId: string;
    userName: string;
    filename: string;
    uploadDate: string;
    cohorts: string[];
    totalRows: number;
    submittedCount: number;
    notSubmittedCount: number;
  }>;
  remarks: Array<{
    id: string;
    userId: string;
    userName: string;
    learnerEmail: string;
    learnerCohort: string;
    remark: string;
    remarkDate: string;
    csvFilename: string;
  }>;
  learnerDetails: Array<{
    email: string;
    cohort: string;
    submissionStatus: string;
    learnerType: string;
    lastRemark?: {
      remark: string;
      date: string;
      by: string;
    };
    history: Array<{
      date: string;
      action: string;
      details: string;
      by: string;
    }>;
  }>;
}

interface Activity {
  id: string;
  userId: string;
  activity: string;
  details: any;
  timestamp: string;
  date: string;
  time: string;
}

export function AdminDashboard() {
  const [trackingData, setTrackingData] = useState<TrackingData>({
    csvUploads: [],
    remarks: [],
    learnerDetails: []
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userMap, setUserMap] = useState<{[key: string]: string}>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalUploads: 0,
    totalRemarks: 0,
    totalLearners: 0,
    activeToday: 0,
    emailsSent: 0
  });
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userSpecificData, setUserSpecificData] = useState<any>(null);

  // Function to handle user selection from search
  const handleUserSelect = async (user: any) => {
    console.log('🔍 Loading data for user:', user);
    setSelectedUser(user);
    
    // Load user-specific data with better error handling
    try {
      // Get user's activities with detailed logging
      console.log('📊 Fetching activities for user ID:', user.id);
      const activitiesRes = await fetch('/api/activity');
      if (activitiesRes.ok) {
        const allActivities = await activitiesRes.json();
        console.log('📋 Total activities found:', allActivities.length);
        
        // Filter activities for this user (try multiple ID formats)
        const userActivities = allActivities.filter((activity: any) => 
          activity.userId === user.id || 
          activity.userId === user.email ||
          activity.details?.email === user.email
        ).sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        console.log('👤 User activities found:', userActivities.length);
        
        // Get user's CSV uploads with enhanced tracking
        console.log('📁 Fetching tracking data for user:', user.id);
        
        // Fetch admin data to get all uploads and remarks
        const trackingRes = await fetch('/api/tracking?admin=true');
        let userUploads: any[] = [];
        let userRemarks = 0;
        let sortedUserRemarks: any[] = [];
        
        if (trackingRes.ok) {
          const trackingData = await trackingRes.json();
          console.log('📊 API Response structure:', Object.keys(trackingData));
          
          // The API returns data in timeline.uploads and timeline.remarks for admin
          const allUploads = trackingData.timeline?.uploads || [];
          const allRemarks = trackingData.timeline?.remarks || [];
          
          console.log('📁 Total uploads in system:', allUploads.length);
          console.log('💬 Total remarks in system:', allRemarks.length);
          
          // Filter uploads for this specific user (exact ID match)
          userUploads = allUploads.filter((upload: any) => {
            const matches = upload.userId === user.id;
            if (matches) {
              console.log('✅ Found matching upload for user', user.id, ':', {
                id: upload.id,
                filename: upload.filename,
                userId: upload.userId,
                userName: upload.userName
              });
            }
            return matches;
          });
          
          // Filter remarks for this specific user (exact ID match)
          const userRemarksArray = allRemarks.filter((remark: any) => {
            const matches = remark.userId === user.id;
            if (matches) {
              console.log('✅ Found matching remark for user', user.id, ':', {
                id: remark.id,
                remark: remark.remark,
                userId: remark.userId,
                userName: remark.userName,
                learnerEmail: remark.learnerEmail
              });
            }
            return matches;
          });
          
          userRemarks = userRemarksArray.length;
          
          // Sort remarks by most recent first
          sortedUserRemarks = userRemarksArray.sort((a: any, b: any) => 
            new Date(b.remarkDate).getTime() - new Date(a.remarkDate).getTime()
          );
          
          console.log('📁 User uploads found:', userUploads.length);
          console.log('💬 User remarks found:', userRemarks);
          console.log('🔍 User ID being searched:', user.id);
          console.log('🔍 Sample upload userIds:', allUploads.slice(0, 3).map((u: any) => u.userId));
        } else {
          console.error('❌ Failed to fetch tracking data:', trackingRes.status);
          // Set empty arrays as fallback
          userUploads = [];
          userRemarks = 0;
          sortedUserRemarks = [];
        }
        
        // Count user's emails from activities
        const userEmails = userActivities.filter((activity: any) => 
          activity.activity.toLowerCase().includes('email') || 
          activity.activity.toLowerCase().includes('mail') ||
          activity.activity.toLowerCase().includes('sent')
        ).length;
        
        console.log('📧 User emails found:', userEmails);
        
        const userData = {
          activities: userActivities,
          uploads: userUploads,
          remarks: userRemarks,
          remarksArray: sortedUserRemarks || [], // Add actual remarks array with fallback
          emails: userEmails,
          totalActivities: userActivities.length
        };
        
        console.log('✅ Final user data summary:', {
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          uploadsCount: userUploads.length,
          remarksCount: userRemarks,
          emailsCount: userEmails,
          activitiesCount: userActivities.length
        });
        setUserSpecificData(userData);
      } else {
        console.error('❌ Failed to fetch activities:', activitiesRes.status);
      }
    } catch (error) {
      console.error('❌ Error loading user-specific data:', error);
      // Set empty data to prevent crashes
      setUserSpecificData({
        activities: [],
        uploads: [],
        remarks: 0,
        remarksArray: [],
        emails: 0,
        totalActivities: 0
      });
    }
  };

  // Function to clear user selection
  const clearUserSelection = () => {
    setSelectedUser(null);
    setUserSpecificData(null);
  };
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load enhanced tracking data for admin
      const trackingRes = await fetch('/api/tracking?admin=true');
      if (trackingRes.ok) {
        const trackingJson = await trackingRes.json();
        
        // Sort uploads and remarks by date (most recent first)
        const sortedUploads = (trackingJson.timeline?.uploads || []).sort((a: any, b: any) => 
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
        
        const sortedRemarks = (trackingJson.timeline?.remarks || []).sort((a: any, b: any) => 
          new Date(b.remarkDate).getTime() - new Date(a.remarkDate).getTime()
        );
        
        setTrackingData({
          csvUploads: sortedUploads,
          remarks: sortedRemarks,
          learnerDetails: []
        });
        
        console.log('📁 Loaded uploads:', sortedUploads.length);
        console.log('💬 Loaded remarks:', sortedRemarks.length);
        
        // Update stats with global data
        if (trackingJson.globalStats) {
          setStats(prev => ({
            ...prev,
            totalUsers: trackingJson.globalStats.activeUsers,
            totalUploads: trackingJson.globalStats.totalUploads,
            totalRemarks: trackingJson.globalStats.totalRemarks,
            totalLearners: trackingJson.globalStats.totalLearners
          }));
        }
      }

      // Load ALL activities for admin (not just admin activities)
      const activitiesRes = await fetch('/api/activity');
      if (activitiesRes.ok) {
        const activitiesJson = await activitiesRes.json();
        const allActivities = Array.isArray(activitiesJson) ? activitiesJson : [];
        // Show ALL user activities for admin, sorted by most recent first
        const sortedActivities = allActivities.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setActivities(sortedActivities);
        
        // Count today's activities
        const today = new Date().toDateString();
        const todayActivities = allActivities.filter(activity => 
          new Date(activity.timestamp).toDateString() === today
        );
        
        // Count emails sent (from activities)
        const emailActivities = allActivities.filter(activity => 
          activity.activity.toLowerCase().includes('email') || 
          activity.activity.toLowerCase().includes('mail')
        );
        
        setStats(prev => ({
          ...prev,
          activeToday: todayActivities.length,
          emailsSent: emailActivities.length
        }));
      }

      // Load users (exclude admin from count)
      const usersRes = await fetch('/api/users');
      if (usersRes.ok) {
        const usersJson = await usersRes.json();
        const allUsers = Array.isArray(usersJson) ? usersJson : [];
        // Filter out admin accounts for user count
        const regularUsers = allUsers.filter(user => user.id !== 'admin' && user.email !== 'admin@system');
        setUsers(allUsers);
        
        // Create user ID to name mapping for activities
        const userMapping: {[key: string]: string} = {};
        allUsers.forEach(user => {
          userMapping[user.id] = user.name;
          userMapping[user.email] = user.name; // Also map by email
        });
        userMapping['admin'] = 'Admin'; // Add admin mapping
        setUserMap(userMapping);
        
        console.log('👥 User mapping created:', userMapping);
        
        // Update user count (excluding admin)
        setStats(prev => ({
          ...prev,
          totalUsers: regularUsers.length
        }));
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLoading(false);
    }
  };

  // Update active today count
  useEffect(() => {
    const activeToday = activities.filter(a => 
      new Date(a.timestamp).toDateString() === new Date().toDateString()
    ).length;
    setStats(prev => ({ ...prev, activeToday }));
  }, [activities]);

  // Cohort distribution data
  const cohortData = trackingData.remarks.reduce((acc: Record<string, number>, remark) => {
    const cohort = remark.learnerCohort || 'Unknown';
    acc[cohort] = (acc[cohort] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(cohortData).map(([name, value]) => ({
    name,
    value
  }));

  // Activity timeline data (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toDateString();
  }).reverse();

  const activityByDay = last7Days.map(day => ({
    day: day.split(' ').slice(1, 3).join(' '),
    activities: activities.filter(a => new Date(a.timestamp).toDateString() === day).length
  }));

  const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#FF5722', '#607D8B'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render user-specific dashboard if user is selected
  if (selectedUser && userSpecificData) {
    return (
      <div className="space-y-6">
        {/* User Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">👤 User Dashboard: {selectedUser.name}</h1>
            <p className="text-gray-400 mt-1">{selectedUser.email} - Complete user analytics and activity</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowSearch(true)} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search Other Users
            </Button>
            <Button onClick={clearUserSelection} variant="outline">
              ← Back to Admin Dashboard
            </Button>
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-blue-500/20 border-blue-500/30 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-300">CSV Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter value={userSpecificData.uploads.length} duration={2000} />
              </div>
              <p className="text-xs text-blue-200">Files processed</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/20 border-green-500/30 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-300">Total Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter value={userSpecificData.remarks} duration={2200} />
              </div>
              <p className="text-xs text-green-200">Comments added</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-500/20 border-purple-500/30 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-300">Emails Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter value={userSpecificData.emails} duration={2400} />
              </div>
              <p className="text-xs text-purple-200">Total emails sent</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-500/20 border-orange-500/30 backdrop-blur-xl shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-300">Total Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                <AnimatedCounter value={userSpecificData.totalActivities} duration={2600} />
              </div>
              <p className="text-xs text-orange-200">All activities</p>
            </CardContent>
          </Card>
        </div>

        {/* User-Specific Recent Uploads & Remarks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* User's Recent Uploads */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-400" />
                📁 {selectedUser.name}'s Recent Uploads
              </CardTitle>
              <CardDescription>CSV files uploaded by {selectedUser.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {userSpecificData.uploads.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No uploads found</p>
                      <p className="text-sm">This user hasn't uploaded any CSV files yet</p>
                    </div>
                  ) : (
                    userSpecificData.uploads.map((upload: any, index: number) => (
                      <div 
                        key={upload.id} 
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                          index < 2 
                            ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 shadow-lg' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          index < 2 ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={index < 2 ? "default" : "outline"} className={`text-xs ${
                              index < 2 ? 'bg-green-500/20 text-green-300 border-green-500/30' : ''
                            }`}>
                              📄 {upload.filename}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(upload.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">
                              📈 {upload.totalRows} rows
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(upload.uploadDate).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-green-400">
                              ✅ {upload.submittedCount} submitted
                            </span>
                            <span className="text-xs text-orange-400">
                              ⏳ {upload.notSubmittedCount} pending
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* User's Recent Remarks */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                💬 {selectedUser.name}'s Recent Remarks
              </CardTitle>
              <CardDescription>Comments added by {selectedUser.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                <div className="space-y-3">
                  {(!userSpecificData.remarksArray || userSpecificData.remarksArray.length === 0) ? (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No remarks found</p>
                      <p className="text-sm">This user hasn't added any remarks yet</p>
                    </div>
                  ) : (
                    userSpecificData.remarksArray.slice(0, 5).map((remark: any, index: number) => (
                      <div 
                        key={remark.id} 
                        className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                          index < 2 
                            ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-lg' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                          index < 2 ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-gray-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant={index < 2 ? "default" : "outline"} className={`text-xs ${
                              index < 2 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : ''
                            }`}>
                              🎯 {remark.learnerCohort}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {new Date(remark.remarkDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-300">
                              📧 {remark.learnerEmail}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(remark.remarkDate).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            index < 2 ? 'text-gray-200' : 'text-gray-400'
                          } mt-1 truncate`}>
                            💭 "{remark.remark}"
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* User Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Activities */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                📍 Recent Activities (User Specific)
              </CardTitle>
              <CardDescription>Most recent activities for {selectedUser.name} - Recent at TOP</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {userSpecificData.activities.slice(0, 30).map((activity: any, index: number) => (
                    <div 
                      key={activity.id} 
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 ${
                        index < 5 
                          ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-lg' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                        index < 5 ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={index < 5 ? "default" : "outline"} className={`text-xs ${
                            index < 5 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : ''
                          }`}>
                            {activity.activity}
                          </Badge>
                          <span className="text-xs text-gray-400">{activity.date}</span>
                        </div>
                        <p className="text-sm text-gray-300">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* User Activity Trends */}
          <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                📊 Activity Trends (Last 7 Days)
              </CardTitle>
              <CardDescription>Activity patterns for {selectedUser.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p className="text-gray-400">User-specific activity trends</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {userSpecificData.totalActivities} total activities tracked
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-500/20 p-3 rounded">
                      <div className="text-blue-300 font-bold">{userSpecificData.uploads.length}</div>
                      <div className="text-blue-200">CSV Uploads</div>
                    </div>
                    <div className="bg-green-500/20 p-3 rounded">
                      <div className="text-green-300 font-bold">{userSpecificData.emails}</div>
                      <div className="text-green-200">Emails Sent</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Modal */}
        {showSearch && (
          <AdminSearch 
            onClose={() => setShowSearch(false)} 
            onUserSelect={handleUserSelect}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowSearch(true)} variant="outline">
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
          <Button onClick={loadData} variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl hover:bg-white/15 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.totalUsers} duration={2000} />
            </div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CSV Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.totalUploads} duration={2200} />
            </div>
            <p className="text-xs text-muted-foreground">Files processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Remarks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.totalRemarks} duration={2400} />
            </div>
            <p className="text-xs text-muted-foreground">Comments added</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.activeToday} duration={1800} />
            </div>
            <p className="text-xs text-muted-foreground">Activities today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={stats.emailsSent} duration={2600} />
            </div>
            <p className="text-xs text-muted-foreground">Total emails tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads & Remarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Uploads */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-green-400" />
              📁 Recent Uploads
            </CardTitle>
            <CardDescription>Latest CSV uploads by users</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {trackingData.csvUploads.slice(0, 10).map((upload: any, index: number) => (
                  <div 
                    key={upload.id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                      index < 3 
                        ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 shadow-lg' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                      index < 3 ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={index < 3 ? "default" : "outline"} className={`text-xs ${
                            index < 3 ? 'bg-green-500/20 text-green-300 border-green-500/30' : ''
                          }`}>
                            📄 {upload.filename}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(upload.uploadDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          index < 3 ? 'text-white' : 'text-gray-300'
                        }`}>
                          👤 {userMap[upload.userId] || upload.userName || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {upload.totalRows} rows
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(upload.uploadDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Remarks */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-400" />
              💬 Recent Remarks
            </CardTitle>
            <CardDescription>Latest remarks added by users</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {trackingData.remarks.slice(0, 10).map((remark: any, index: number) => (
                  <div 
                    key={remark.id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                      index < 3 
                        ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-lg' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                      index < 3 ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={index < 3 ? "default" : "outline"} className={`text-xs ${
                            index < 3 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : ''
                          }`}>
                            🎯 {remark.learnerCohort}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(remark.remarkDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${
                          index < 3 ? 'text-white' : 'text-gray-300'
                        }`}>
                          👤 {userMap[remark.userId] || remark.userName || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          📧 {remark.learnerEmail}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        index < 3 ? 'text-gray-200' : 'text-gray-400'
                      } mt-1 truncate`}>
                        💭 "{remark.remark}"
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(remark.remarkDate).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Activity Timeline */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Recent System Activities
            </CardTitle>
            <CardDescription>📍 Most recent activities at TOP - Real-time updates (scroll after 9 items)</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <div className="space-y-3">
                {activities.slice(0, 50).map((activity, index) => {
                  const isRecent = index < 9;
                  const isLoginLogout = activity.activity.toLowerCase().includes('login') || activity.activity.toLowerCase().includes('logout');
                  
                  return (
                    <div 
                      key={activity.id} 
                      className={`flex items-start space-x-3 p-4 rounded-lg border transition-all duration-200 ${
                        isRecent 
                          ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20 shadow-lg' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                        isLoginLogout 
                          ? 'bg-green-400 shadow-lg shadow-green-400/50' 
                          : isRecent 
                          ? 'bg-blue-400 shadow-lg shadow-blue-400/50' 
                          : 'bg-gray-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {isLoginLogout && <span className="text-green-400">🔐</span>}
                            <Badge variant={isRecent ? "default" : "outline"} className={`text-xs ${
                              isRecent ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : ''
                            }`}>
                              {activity.activity}
                            </Badge>
                            <span className={`text-sm font-medium ${
                              isRecent ? 'text-white' : 'text-gray-300'
                            }`}>
                              {userMap[activity.userId] || userMap[activity.details?.email] || activity.userId || 'Unknown User'}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-xs ${
                              isRecent ? 'text-blue-300' : 'text-gray-400'
                            }`}>
                              {new Date(activity.timestamp).toLocaleTimeString()}
                            </span>
                            {isRecent && (
                              <span className="text-xs text-green-400 font-medium">Recent</span>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm mt-1 ${
                          isRecent ? 'text-gray-300' : 'text-gray-400'
                        }`}>
                          {activity.details?.filename && `📁 ${activity.details.filename}`}
                          {activity.details?.learnerEmail && `👤 ${activity.details.learnerEmail}`}
                          {!activity.details?.filename && !activity.details?.learnerEmail && 'System activity'}
                        </p>
                        {activity.details?.remark && (
                          <p className="text-xs text-gray-400 mt-1 italic bg-black/20 p-2 rounded">
                            💬 "{activity.details.remark}"
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </p>
                          {activity.details?.sessionDuration && (
                            <p className="text-xs text-blue-400">
                              ⏱️ {activity.details.sessionDuration}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activities.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No activities recorded yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Cohort Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Cohort Distribution
            </CardTitle>
            <CardDescription>Remarks distribution by cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No cohort data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trends (Last 7 Days)</CardTitle>
          <CardDescription>Daily activity volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activities" fill="#4CAF50" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Admin Management Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Management
          </CardTitle>
          <CardDescription>System administration and user management</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">
                <Users2 className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="uploads">
                <FileText className="w-4 h-4 mr-2" />
                Recent Uploads
              </TabsTrigger>
              <TabsTrigger value="remarks">
                <MessageSquare className="w-4 h-4 mr-2" />
                Recent Remarks
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete user ${user.name}?`)) {
                              fetch(`/api/users?id=${user.id}`, { method: 'DELETE' })
                                .then(() => loadData());
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="uploads" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Cohorts</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingData.csvUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>{upload.filename}</TableCell>
                      <TableCell>{upload.userName}</TableCell>
                      <TableCell>{upload.cohorts.join(', ')}</TableCell>
                      <TableCell>{upload.totalRows}</TableCell>
                      <TableCell>{new Date(upload.uploadDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            
            <TabsContent value="remarks" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trackingData.remarks.map((remark) => (
                    <TableRow key={remark.id}>
                      <TableCell>{remark.learnerEmail}</TableCell>
                      <TableCell>{remark.learnerCohort}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{remark.remark}</TableCell>
                      <TableCell>{remark.userName}</TableCell>
                      <TableCell>{new Date(remark.remarkDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this remark?')) {
                              fetch(`/api/tracking?remarkId=${remark.id}`, { method: 'DELETE' })
                                .then(() => loadData());
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Search Modal */}
      {showSearch && (
        <AdminSearch 
          onClose={() => setShowSearch(false)} 
          onUserSelect={handleUserSelect}
        />
      )}
      
    </div>
  );
}
