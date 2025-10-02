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
import { BarChart, Calendar, Clock, FileText, MessageSquare, Upload, Users2 } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

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

export function UserDashboard({ userEmail }: { userEmail: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [uploads, setUploads] = useState<UploadInfo[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalRemarks: 0,
    totalLearners: 0,
    activityByDate: {} as Record<string, number>,
    uploadsByDate: {} as Record<string, number>,
    remarksByType: {} as Record<string, number>
  });

  useEffect(() => {
    // Load data from localStorage
    const loadData = () => {
      try {
        const storedActivities = JSON.parse(localStorage.getItem('user_activity') || '[]');
        const storedUploads = JSON.parse(localStorage.getItem('csv_uploads') || '[]');
        const storedRemarks = JSON.parse(localStorage.getItem('user_remarks') || '[]');
        
        // Filter data for current user if email is provided
        const userActivities = userEmail ? storedActivities.filter((a: Activity) => a.userId === userEmail) : storedActivities;
        const userUploads = userEmail ? storedUploads.filter((u: UploadInfo) => u.userId === userEmail) : storedUploads;
        const userRemarks = userEmail ? storedRemarks.filter((r: Remark) => r.userId === userEmail) : storedRemarks;

        setActivities(userActivities);
        setUploads(userUploads);
        setRemarks(userRemarks);

        // Calculate statistics
        const activityByDate = userActivities.reduce((acc: Record<string, number>, curr: Activity) => {
          const date = new Date(curr.timestamp).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const uploadsByDate = userUploads.reduce((acc: Record<string, number>, curr: UploadInfo) => {
          const date = new Date(curr.uploadedAt).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const remarksByType = userRemarks.reduce((acc: Record<string, number>, curr: Remark) => {
          const type = curr.learnerCohort || 'Unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        setStats({
          totalUploads: userUploads.length,
          totalRemarks: userRemarks.length,
          totalLearners: new Set(userRemarks.map((r: Remark) => r.learnerEmail)).size,
          activityByDate,
          uploadsByDate,
          remarksByType
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
    window.addEventListener('storageUpdated', loadData);
    return () => window.removeEventListener('storageUpdated', loadData);
  }, [userEmail]);

  const COLORS = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0'];

  const pieData = Object.entries(stats.remarksByType).map(([name, value]) => ({
    name,
    value
  }));

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {uploads.map((upload, index) => (
                    <TableRow key={index}>
                      <TableCell>{upload.filename}</TableCell>
                      <TableCell>{upload.rowCount}</TableCell>
                      <TableCell>{upload.uploadTime}</TableCell>
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
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {remarks.map((remark, index) => (
                    <TableRow key={index}>
                      <TableCell>{remark.learnerEmail}</TableCell>
                      <TableCell>{remark.learnerCohort}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{remark.remark}</TableCell>
                      <TableCell>{remark.timestamp}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="timeline" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {activities.map((activity) => (
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
                          {activity.details.filename || activity.details.learnerEmail}
                        </p>
                        {activity.details.remark && (
                          <p className="text-sm text-muted-foreground">{activity.details.remark}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}