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
import { BarChart, Calendar, Clock, FileText, MessageSquare, Upload, Users2, Activity, Award, Trophy, Mail } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { UserBadges } from './user-badges';
import { BadgeModal } from './badge-modal';

interface Activity {
  id: string;
  userId: string;
  activity: string;
  details: {
    filename?: string;
    rowCount?: number;
    fileSize?: number;
    uploadTime?: string;
    learnerEmail?: string;
    learnerName?: string;
    remark?: string;
    learnerCohort?: string;
  };
  timestamp: string;
  date: string;
  time: string;
}

interface UploadInfo {
  userId: string;
  filename: string;
  rowCount: number;
  uploadedAt: string;
  fileSize: number;
  uploadTime: string;
}

interface Remark {
  userId: string;
  learnerEmail: string;
  learnerName: string;
  learnerCohort: string;
  remark: string;
  createdAt: string;
  timestamp: string;
}

interface DashboardStats {
  totalUploads: number;
  totalRemarks: number;
  totalLearners: number;
  activityByDate: Record<string, number>;
  uploadsByDate: Record<string, number>;
  remarksByType: Record<string, number>;
}
export function UserDashboard({ userEmail }: { userEmail: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uploads, setUploads] = useState<UploadInfo[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [emailActivities, setEmailActivities] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    totalUploads: 0,
    totalRemarks: 0,
    totalLearners: 0,
    activityByDate: {},
    uploadsByDate: {},
    remarksByType: {}
  });
  const [loading, setLoading] = useState(true);
  const [remarkSearchQuery, setRemarkSearchQuery] = useState('');
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showMonthlyBadges, setShowMonthlyBadges] = useState(false);

  useEffect(() => {
    // Load data from Supabase
    const loadData = async () => {
      setLoading(true);
      try {
        // Try Supabase APIs first, fallback to localStorage
        let storedActivities = [];
        let userUploads = [];
        let userRemarks = [];
        
        try {
          console.log('🔄 Loading dashboard data for user:', userEmail);
          const [activitiesRes, trackingRes, emailActivitiesRes] = await Promise.all([
            fetch('/api/activity'),
            fetch(`/api/tracking${userEmail ? `?userId=${encodeURIComponent(userEmail)}` : ''}`),
            fetch(`/api/email-activities${userEmail ? `?userId=${encodeURIComponent(userEmail)}` : ''}`)
          ]);
          
          storedActivities = activitiesRes.ok ? await activitiesRes.json() : [];
          console.log('📊 Activities loaded:', storedActivities.length);
          
          const trackingData = trackingRes.ok ? await trackingRes.json() : {};
          console.log('📈 Tracking data structure:', Object.keys(trackingData));
          
          userUploads = trackingData.recent?.uploads || [];
          userRemarks = trackingData.recent?.remarks || [];
          
          const userEmailActivities = emailActivitiesRes.ok ? await emailActivitiesRes.json() : [];
          setEmailActivities(userEmailActivities);
          console.log('📧 Email activities loaded from API:', userEmailActivities.length);
          
          console.log('📁 User uploads:', userUploads.length);
          console.log('💬 User remarks:', userRemarks.length);
          console.log('📧 User email activities:', userEmailActivities.length);
        } catch (apiError) {
          console.log('API failed, using localStorage fallback');
          // Fallback to localStorage
          storedActivities = JSON.parse(localStorage.getItem('user_activity') || '[]');
          userUploads = JSON.parse(localStorage.getItem('csv_uploads') || '[]');
          userRemarks = JSON.parse(localStorage.getItem('user_remarks') || '[]');
          
          // Load email activities from localStorage
          const localEmailActivities = JSON.parse(localStorage.getItem('email_activities') || '[]');
          const userEmailActivities = userEmail ? 
            localEmailActivities.filter((e: any) => e.user_id === userEmail) : 
            localEmailActivities;
          setEmailActivities(userEmailActivities);
          console.log('📧 Email activities loaded from localStorage:', userEmailActivities.length);
        }
        
        // Filter data for current user if email is provided
        const userActivities = userEmail ? storedActivities.filter((a: any) => (a.userId || a.user_id) === userEmail) : storedActivities;
        const filteredUploads = userEmail ? userUploads.filter((u: any) => (u.userId || u.user_id) === userEmail) : userUploads;
        const filteredRemarks = userEmail ? userRemarks.filter((r: any) => (r.userId || r.user_id) === userEmail) : userRemarks;

        setActivities(userActivities);
        setUploads(filteredUploads);
        setRemarks(filteredRemarks);

        // Calculate stats
        const activityByDate = userActivities.reduce((acc: Record<string, number>, activity: Activity) => {
          const date = activity.date || new Date(activity.timestamp).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const uploadsByDate = filteredUploads.reduce((acc: Record<string, number>, upload: any) => {
          const date = new Date(upload.upload_date || upload.uploadedAt || upload.uploadDate || Date.now()).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const remarksByType = filteredRemarks.reduce((acc: Record<string, number>, remark: any) => {
          const type = remark.learner_cohort || remark.learnerCohort || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});
        
        // Calculate unique learners from remarks
        const uniqueLearners = new Set(filteredRemarks.map((r: any) => r.learnerEmail || r.learner_email)).size;
        
        console.log('📊 Dashboard stats calculated:', {
          uploads: filteredUploads.length,
          remarks: filteredRemarks.length,
          uniqueLearners,
          remarksByType
        });
        
        setStats({
          totalUploads: filteredUploads.length,
          totalRemarks: filteredRemarks.length,
          totalLearners: uniqueLearners,
          activityByDate,
          uploadsByDate,
          remarksByType
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    
    // Refresh data every 10 seconds for real-time updates (especially for email count)
    const interval = setInterval(loadData, 10000);
    
    // Listen for email sent events to refresh immediately
    const handleEmailSent = () => {
      console.log('📧 Email sent event received, refreshing dashboard...');
      loadData();
    };
    
    window.addEventListener('emailSent', handleEmailSent);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('emailSent', handleEmailSent);
    };
  }, [userEmail]);

  const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0'];

  const pieData = Object.entries(stats.remarksByType).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-6">
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files Processed</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUploads}</div>
            <p className="text-xs text-muted-foreground">CSV files uploaded and analyzed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Remarks Added</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRemarks}</div>
            <p className="text-xs text-muted-foreground">Comments on learner progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learners Tracked</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLearners}</div>
            <p className="text-xs text-muted-foreground">Unique learners with remarks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Mail className={`h-4 w-4 ${loading ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emailActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              Total emails sent by you {loading ? '(updating...)' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 text-sm">
                    <div className="min-w-[100px] text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                    <div>
                      <Badge variant="outline">{activity.activity}</Badge>
                      <p className="mt-1">{activity.details.filename || activity.details.learnerEmail}</p>
                      {activity.details.remark && (
                        <p className="text-muted-foreground mt-1 text-xs">{activity.details.remark}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cohort Distribution</CardTitle>
            <CardDescription>Remarks by cohort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
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
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Details</CardTitle>
          <CardDescription>Comprehensive view of all your activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="uploads">
            <TabsList>
              <TabsTrigger value="uploads">
                <FileText className="w-4 h-4 mr-2" />
                Uploads
              </TabsTrigger>
              <TabsTrigger value="remarks">
                <MessageSquare className="w-4 h-4 mr-2" />
                Remarks
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Calendar className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
            </TabsList>
            <TabsContent value="uploads" className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Upload Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        No uploads found. Upload your first CSV file to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    uploads.map((upload, index) => (
                      <TableRow key={index}>
                        <TableCell>{upload.filename}</TableCell>
                        <TableCell>{upload.rowCount || (upload as any).total_rows || 'N/A'}</TableCell>
                        <TableCell>{upload.uploadTime || (upload as any).upload_date || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="remarks" className="mt-4">
              <div className="mb-4">
                <Input
                  placeholder="Search remarks by learner email or remark content..."
                  value={remarkSearchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemarkSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Cohort</TableHead>
                    <TableHead>Remark</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remarks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No remarks found. Add remarks to learners to track your interactions.
                      </TableCell>
                    </TableRow>
                  ) : (
                    remarks
                      .filter((remark) => {
                        if (!remarkSearchQuery) return true;
                        const searchLower = remarkSearchQuery.toLowerCase();
                        const learnerEmail = (remark.learnerEmail || (remark as any).learner_email || '').toLowerCase();
                        const remarkText = (remark.remark || '').toLowerCase();
                        const cohort = (remark.learnerCohort || (remark as any).learner_cohort || '').toLowerCase();
                        return learnerEmail.includes(searchLower) || 
                               remarkText.includes(searchLower) || 
                               cohort.includes(searchLower);
                      })
                      .map((remark, index) => (
                        <TableRow key={index}>
                          <TableCell>{remark.learnerEmail || (remark as any).learner_email}</TableCell>
                          <TableCell>{remark.learnerCohort || (remark as any).learner_cohort}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{remark.remark}</TableCell>
                          <TableCell>{remark.timestamp || (remark as any).remark_date}</TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="timeline" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No activities found</p>
                      <p className="text-sm">Start using the application to see your activity timeline</p>
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 border-l-2 border-border pl-4 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{activity.activity}</Badge>
                            <span className="text-sm text-muted-foreground">
                              <Clock className="w-4 h-4 inline mr-1" />
                              {activity.time}
                            </span>
                          </div>
                          <p className="text-sm">
                            {activity.details?.filename || activity.details?.learnerEmail || 'Activity'}
                          </p>
                          {activity.details?.remark && (
                            <p className="text-sm text-muted-foreground">{activity.details.remark}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Badge Modal */}
      <BadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        userId={userEmail}
        showMonthlyView={showMonthlyBadges}
      />
    </div>
  );
}