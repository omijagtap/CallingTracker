'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { AnimatedCounter } from '../ui/animated-counter';
import { 
  Download, 
  Mail,
  CheckCircle2,
  BarChart3,
  Users,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context-supabase';

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
}

export function AdminCallingTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trackingData, setTrackingData] = useState<TrackingData>({
    csvUploads: [],
    remarks: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedUpload, setSelectedUpload] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/tracking?admin=true');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Admin Calling Tracker data:', data);
        
        const uploads = data.timeline?.uploads || [];
        const remarks = data.timeline?.remarks || [];
        
        console.log('📁 Uploads loaded:', uploads.length, uploads.slice(0, 2));
        console.log('💬 Remarks loaded:', remarks.length, remarks.slice(0, 2));
        
        setTrackingData({
          csvUploads: uploads,
          remarks: remarks
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const generateReport = (uploadId: string) => {
    const upload = trackingData.csvUploads.find(u => u.id === uploadId);
    if (!upload) return;

    // Get remarks for this upload's cohorts
    const relatedRemarks = trackingData.remarks.filter(remark => 
      upload.cohorts.includes(remark.learnerCohort)
    );

    const reportData = relatedRemarks.map(remark => ({
      'Email': remark.learnerEmail,
      'Cohort': remark.learnerCohort,
      'Remark': remark.remark,
      'Added By': remark.userName,
      'Date': remark.remarkDate ? new Date(remark.remarkDate).toLocaleDateString() : 'Unknown Date',
      'CSV File': upload.filename
    }));

    // Download CSV
    const csvContent = [
      ['Email', 'Cohort', 'Remark', 'Added By', 'Date', 'CSV File'],
      ...reportData.map(row => [
        row.Email,
        row.Cohort,
        row.Remark,
        row['Added By'],
        row.Date,
        row['CSV File']
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calling-report-${upload.filename}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report Downloaded",
      description: `Generated report for ${upload.filename}`,
    });
  };

  const sendEmailReport = async (uploadId: string) => {
    const upload = trackingData.csvUploads.find(u => u.id === uploadId);
    if (!upload || !user) return;

    // Try to get user's reporting manager email first
    let recipient = '';
    try {
      const profileRes = await fetch(`/api/profile?userId=${user.id}`);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile.reportingManagerEmail) {
          const useManagerEmail = confirm(`Send report to your reporting manager (${profile.reportingManager}: ${profile.reportingManagerEmail})?`);
          if (useManagerEmail) {
            recipient = profile.reportingManagerEmail;
          }
        }
      }
    } catch (error) {
      console.log('Could not fetch user profile');
    }

    // If no manager email or user declined, ask for manual input
    if (!recipient) {
      recipient = prompt('Enter recipient email address:') || '';
      if (!recipient) return;
    }

    try {
      // Get remarks for this upload's cohorts
      const relatedRemarks = trackingData.remarks.filter(remark => 
        upload.cohorts.includes(remark.learnerCohort)
      );

      const reportData = relatedRemarks.map(remark => ({
        'Email': remark.learnerEmail,
        'Cohort': remark.learnerCohort,
        'Remark': remark.remark,
        'Added By': remark.userName,
        'Date': remark.remarkDate ? new Date(remark.remarkDate).toLocaleDateString() : 'Unknown Date'
      }));

      const emailReport = {
        cohorts: upload.cohorts,
        learnerCount: relatedRemarks.length,
        reportType: 'calling-report' as const,
        data: reportData
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: recipient,
          report: emailReport,
          userInfo: {
            userId: user.id,
            userName: user.name
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Email Sent Successfully",
          description: `Calling report sent to ${recipient}`,
        });
      } else {
        throw new Error(result.error || 'Failed to send email');
      }
    } catch (error: any) {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to send email report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Calling Tracker</h2>
        <p className="text-muted-foreground">Generate calling reports from existing user data</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={trackingData.csvUploads.length} duration={2000} />
            </div>
            <p className="text-xs text-muted-foreground">CSV files processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Remarks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={trackingData.remarks.length} duration={2200} />
            </div>
            <p className="text-xs text-muted-foreground">Calling remarks added</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={new Set(trackingData.csvUploads.map(u => u.userId)).size} duration={1800} />
            </div>
            <p className="text-xs text-muted-foreground">Users with uploads</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cohorts Tracked</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedCounter value={new Set(trackingData.remarks.map(r => r.learnerCohort)).size} duration={2400} />
            </div>
            <p className="text-xs text-muted-foreground">Unique cohorts</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Available CSV Data
          </CardTitle>
          <CardDescription>
            Generate calling reports from existing user uploads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trackingData.csvUploads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No CSV uploads found</p>
              <p className="text-sm">Users need to upload CSV files first</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                {trackingData.csvUploads.map((upload) => {
                const relatedRemarks = trackingData.remarks.filter(remark => 
                  upload.cohorts.includes(remark.learnerCohort)
                );

                return (
                  <div key={upload.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{upload.filename}</h3>
                        <p className="text-sm text-muted-foreground">
                          Uploaded by {upload.userName || 'Unknown User'} on {upload.uploadDate ? new Date(upload.uploadDate).toLocaleDateString() : 'Unknown Date'}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {upload.cohorts.map((cohort, index) => (
                            <Badge key={index} variant="outline">
                              {cohort}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {upload.totalRows} total rows
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {relatedRemarks.length} remarks available
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={() => generateReport(upload.id)}
                        className="flex items-center gap-2"
                        disabled={relatedRemarks.length === 0}
                      >
                        <Download className="w-4 h-4" />
                        Download Report
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => sendEmailReport(upload.id)}
                        className="flex items-center gap-2"
                        disabled={relatedRemarks.length === 0}
                      >
                        <Mail className="w-4 h-4" />
                        Email Report
                      </Button>
                    </div>

                    {relatedRemarks.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        No remarks available for this upload's cohorts
                      </p>
                    )}
                  </div>
                );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Admin Calling Tracker:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Uses existing CSV data uploaded by users</li>
              <li>Combines upload data with collected remarks</li>
              <li>Generates comprehensive calling reports</li>
              <li>Sends professional email reports to managers</li>
              <li>Tracks all report generation activities</li>
            </ul>
            <p className="mt-4"><strong>Note:</strong> Reports include all remarks for learners in the selected CSV's cohorts.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
