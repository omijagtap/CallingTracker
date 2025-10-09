"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, MessageSquare, LogIn, LogOut, UserPlus, Upload, TrendingUp } from "lucide-react";

interface CallingActivity {
  id: string;
  userId: string;
  activity: string;
  details: any;
  timestamp: string;
  date: string;
  time: string;
}

interface DashboardProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function Dashboard({ userId, isOpen, onClose }: DashboardProps) {
  const [activities, setActivities] = useState<CallingActivity[]>([]);
  const [stats, setStats] = useState({
    remarksAdded: 0,
    learnersWithRemarks: 0
  });
  const [globalStats, setGlobalStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalRemarks: 0
  });

  useEffect(() => {
    if (isOpen && userId) {
      loadCallingActivities();
      calculateStats();
      loadGlobalStats();
      // Also try to load server-persisted activities and users
      (async () => {
        try {
          const res = await fetch('/api/activity');
          if (res.ok) {
            const allActivities = await res.json();
            const userActivities = allActivities
              .filter((a: any) => a.userId === userId)
              .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .slice(0, 20);
            setActivities(userActivities);
          }
        } catch (e) {
          console.warn('Failed to load server activities', e);
        }

        try {
          const resUsers = await fetch('/api/users');
          if (resUsers.ok) {
            const users = await resUsers.json();
            // Optionally, we could show total users across platform somewhere
          }
        } catch (e) {
          console.warn('Failed to load server users', e);
        }
      })();
    }
  }, [isOpen, userId]);

  const loadGlobalStats = async () => {
    try {
      // Fetch from Supabase APIs
      const [usersRes, activitiesRes, trackingRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/activity'),
        fetch('/api/tracking?admin=true')
      ]);
      
      const users = usersRes.ok ? await usersRes.json() : [];
      const activities = activitiesRes.ok ? await activitiesRes.json() : [];
      const trackingData = trackingRes.ok ? await trackingRes.json() : {};
      const remarks = trackingData.recent?.remarks || [];

      let totalUsers = Array.isArray(users) ? users.length : 0;
      let totalActivities = Array.isArray(activities) ? activities.length : 0;
      let totalRemarks = Array.isArray(remarks) ? remarks.length : 0;

      // Try server fallback
      try {
        const resAct = await fetch('/api/activity');
        if (resAct.ok) {
          const serverActs = await resAct.json();
          totalActivities = serverActs.length;
        }
      } catch (e) {
        // ignore
      }

      try {
        const resUsers = await fetch('/api/users');
        if (resUsers.ok) {
          const serverUsers = await resUsers.json();
          totalUsers = serverUsers.length;
        }
      } catch (e) {
        // ignore
      }

      setGlobalStats({ totalUsers, totalActivities, totalRemarks });
    } catch (e) {
      console.error('Failed to load global stats', e);
    }
  };

  // Load a simple list of users and counts for display in the Dashboard
  const [usersList, setUsersList] = useState<Array<{id: string, email: string, name?: string, activityCount: number, remarkCount: number}>>([]);
  const loadUsersOverview = async () => {
    try {
      const [usersRes, activitiesRes, trackingRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/activity'),
        fetch('/api/tracking?admin=true')
      ]);
      
      const localUsers = usersRes.ok ? await usersRes.json() : [];
      const activities = activitiesRes.ok ? await activitiesRes.json() : [];
      const trackingData = trackingRes.ok ? await trackingRes.json() : {};
      const remarks = trackingData.recent?.remarks || [];

      // Build a map from user id to counts
      const map: Record<string, {id: string, email: string, name?: string, activityCount: number, remarkCount: number}> = {};
      (Array.isArray(localUsers) ? localUsers : []).forEach((u: any) => {
        map[u.id] = { id: u.id, email: u.email, name: u.name, activityCount: 0, remarkCount: 0 };
      });

      (Array.isArray(activities) ? activities : []).forEach((a: any) => {
        if (!map[a.userId]) {
          map[a.userId] = { id: a.userId, email: a.userId, activityCount: 0, remarkCount: 0 };
        }
        map[a.userId].activityCount = (map[a.userId].activityCount || 0) + 1;
      });

      (Array.isArray(remarks) ? remarks : []).forEach((r: any) => {
        if (!map[r.userId]) {
          map[r.userId] = { id: r.userId, email: r.userId, activityCount: 0, remarkCount: 0 };
        }
        map[r.userId].remarkCount = (map[r.userId].remarkCount || 0) + 1;
      });

      let list = Object.values(map);

      // Try server fallback to enrich users if possible
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const serverUsers = await res.json();
          serverUsers.forEach((su: any) => {
            if (!map[su.id]) {
              map[su.id] = { id: su.id, email: su.email, name: su.name, activityCount: 0, remarkCount: 0 };
            } else {
              map[su.id].name = map[su.id].name || su.name;
              map[su.id].email = map[su.id].email || su.email;
            }
          });
          list = Object.values(map);
        }
      } catch (e) {
        // ignore
      }

      setUsersList(list.sort((a,b) => (b.activityCount + b.remarkCount) - (a.activityCount + a.remarkCount)));
    } catch (e) {
      console.error('Failed to load users overview', e);
    }
  };

  const loadCallingActivities = async () => {
    try {
      const activitiesRes = await fetch('/api/activity');
      const allActivities = activitiesRes.ok ? await activitiesRes.json() : [];
      
      const userActivities = allActivities
        .filter((activity: any) => (activity.userId || activity.user_id) === userId)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20); // Show last 20 activities

      setActivities(userActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      setActivities([]);
    }
  };

  const calculateStats = async () => {
    try {
      const trackingRes = await fetch(`/api/tracking?userId=${encodeURIComponent(userId)}`);
      const trackingData = trackingRes.ok ? await trackingRes.json() : {};
      const remarks = trackingData.recent?.remarks || [];
      
      // Get unique learners who have remarks
      const uniqueLearnersWithRemarks = new Set();
      remarks.forEach((remark: any) => {
        uniqueLearnersWithRemarks.add(remark.learnerEmail);
      });

      setStats({
        remarksAdded: remarks.length,
        learnersWithRemarks: uniqueLearnersWithRemarks.size
      });
    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'Account Created':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'User Login':
        return <LogIn className="h-4 w-4 text-blue-500" />;
      case 'User Logout':
        return <LogOut className="h-4 w-4 text-gray-500" />;
      case 'Remark Added':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'CSV Upload':
        return <Upload className="h-4 w-4 text-purple-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'Account Created':
        return 'bg-green-100 text-green-800';
      case 'User Login':
        return 'bg-blue-100 text-blue-800';
      case 'User Logout':
        return 'bg-gray-100 text-gray-800';
      case 'Remark Added':
        return 'bg-blue-100 text-blue-800';
      case 'CSV Upload':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getActivityDescription = (activity: CallingActivity) => {
    switch (activity.activity) {
      case 'Remark Added':
        return `Added remark for ${activity.details.learnerEmail}`;
      case 'CSV Upload':
        return `Uploaded "${activity.details.filename}" with ${activity.details.rowCount} rows`;
      case 'Account Created':
        return `Account created for ${activity.details.email}`;
      case 'User Login':
        return `Logged in from ${activity.details.platform}`;
      case 'User Logout':
        return `Logged out at ${activity.details.logoutTime}`;
      default:
        return `Activity: ${activity.activity}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Learner Management Dashboard
              </CardTitle>
              <CardDescription>Track your learner interactions and remarks</CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[70vh]">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <MessageSquare className="h-12 w-12 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-700">{stats.remarksAdded}</div>
                <div className="text-sm text-blue-600 font-medium">Total Remarks Added</div>
                <div className="text-xs text-blue-500 mt-1">Comments and notes for learners</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <User className="h-12 w-12 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-700">{stats.learnersWithRemarks}</div>
                <div className="text-sm text-purple-600 font-medium">Learners with Remarks</div>
                <div className="text-xs text-purple-500 mt-1">Unique learners you've added notes for</div>
              </CardContent>
            </Card>
          </div>

          {/* Global Stats Cards (show totals from localStorage / server) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <User className="h-12 w-12 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700">{globalStats.totalUsers}</div>
                <div className="text-sm text-green-600 font-medium">Total Users</div>
                <div className="text-xs text-green-500 mt-1">Users registered in the system</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <Upload className="h-12 w-12 text-indigo-600" />
                </div>
                <div className="text-3xl font-bold text-indigo-700">{globalStats.totalActivities}</div>
                <div className="text-sm text-indigo-600 font-medium">Total Activities</div>
                <div className="text-xs text-indigo-500 mt-1">All recorded actions across the app</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-3">
                  <MessageSquare className="h-12 w-12 text-rose-600" />
                </div>
                <div className="text-3xl font-bold text-rose-700">{globalStats.totalRemarks}</div>
                <div className="text-sm text-rose-600 font-medium">Total Remarks</div>
                <div className="text-xs text-rose-500 mt-1">All remarks added by users</div>
              </CardContent>
            </Card>
          </div>

          {/* Accounts / Users overview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Accounts</h3>
            {usersList.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-sm text-muted-foreground">No users found in local storage.</CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {usersList.map(u => (
                  <Card key={u.id}>
                    <CardContent className="p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{u.name || u.email}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">Activities: <strong>{u.activityCount}</strong></div>
                        <div className="text-sm">Remarks: <strong>{u.remarkCount}</strong></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          {/* Recent Activities */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Learner Interactions
            </h3>
            {activities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No learner interactions yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start adding remarks to learners to see your activity here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <Card key={activity.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.activity)}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.activity)}`}>
                              {activity.activity}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {activity.date} at {activity.time}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {activity.activity === 'Remark Added' && (
                              <div>
                                <p className="font-medium text-foreground">
                                  Added remark for {activity.details.learnerName || activity.details.learnerEmail}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  "{activity.details.remark}"
                                </p>
                              </div>
                            )}
                            {activity.activity === 'CSV Upload' && (
                              <p>Uploaded "{activity.details.filename}" with {activity.details.rowCount} rows</p>
                            )}
                            {activity.activity === 'Account Created' && (
                              <p>Account created for {activity.details.email}</p>
                            )}
                            {activity.activity === 'User Login' && (
                              <p>Logged in from {activity.details.platform}</p>
                            )}
                            {activity.activity === 'User Logout' && (
                              <p>Logged out at {activity.details.logoutTime}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
