'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Upload, 
  FileText, 
  Download, 
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { Alert, AlertDescription } from '../ui/alert';

const formSchema = z.object({
  csvFile: (typeof window !== 'undefined' && window.FileList) 
    ? z.instanceof(FileList).refine((files) => files?.length === 1, "CSV file is required.")
    : z.any()
});

type FormValues = z.infer<typeof formSchema>;

interface ProcessedData {
  filename: string;
  totalRows: number;
  cohorts: string[];
  submittedCount: number;
  notSubmittedCount: number;
  data: any[];
}

export function CallingTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadState, setUploadState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [error, setError] = useState<string>('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setUploadState('processing');
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      // Parse CSV data (simplified parsing)
      const data = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        return {
          rowIndex: index + 2,
          cohort: values[1] || '', // Column B
          email: values[8] || '', // Column I
          submissionStatus: values[37] || '', // Column AM (0-based index)
          learnerType: values[38] || '', // Column AN
          submissionName: values[39] || '' // Column AO
        };
      });

      // Calculate statistics
      const cohorts = [...new Set(data.map(row => row.cohort).filter(Boolean))];
      const submittedCount = data.filter(row => 
        row.submissionStatus.toLowerCase().includes('submitted') && 
        !row.submissionStatus.toLowerCase().includes('not')
      ).length;
      const notSubmittedCount = data.filter(row => 
        row.submissionStatus.toLowerCase().includes('not submitted')
      ).length;

      const processed: ProcessedData = {
        filename: file.name,
        totalRows: data.length,
        cohorts,
        submittedCount,
        notSubmittedCount,
        data
      };

      setProcessedData(processed);
      setUploadState('success');

      // Track the upload
      if (user) {
        try {
          await fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'upload',
              data: {
                userId: user.id,
                userName: user.name,
                filename: file.name,
                cohorts,
                totalRows: data.length,
                submittedCount,
                notSubmittedCount
              }
            })
          });
        } catch (e) {
          console.warn('Failed to track upload:', e);
        }
      }

      toast({
        title: "CSV Processed Successfully",
        description: `Processed ${data.length} rows from ${cohorts.length} cohorts`,
      });

    } catch (error: any) {
      setError(error.message || 'Failed to process CSV file');
      setUploadState('error');
      toast({
        title: "Processing Failed",
        description: error.message || 'Failed to process CSV file',
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: FormValues) => {
    if (data.csvFile && data.csvFile.length > 0) {
      handleFileUpload(data.csvFile);
    }
  };

  const downloadReport = () => {
    if (!processedData) return;

    const notSubmittedData = processedData.data.filter(row => 
      row.submissionStatus.toLowerCase().includes('not submitted')
    );

    const csvContent = [
      ['Email', 'Cohort', 'Learner Type', 'Submission Name', 'Status'],
      ...notSubmittedData.map(row => [
        row.email,
        row.cohort,
        row.learnerType,
        row.submissionName,
        row.submissionStatus
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `not-submitted-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendEmailReport = async () => {
    if (!processedData || !user) return;

    const recipient = prompt('Enter recipient email address:');
    if (!recipient) return;

    try {
      // Prepare report data
      const notSubmittedData = processedData.data.filter(row => 
        row.submissionStatus.toLowerCase().includes('not submitted')
      );

      const reportData = notSubmittedData.map(row => ({
        'Email': row.email,
        'Cohort': row.cohort,
        'Learner Type': row.learnerType,
        'Submission Name': row.submissionName,
        'Status': row.submissionStatus
      }));

      const emailReport = {
        cohorts: processedData.cohorts,
        learnerCount: notSubmittedData.length,
        reportType: 'no-submission-report' as const,
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
          description: `Report sent to ${recipient}`,
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

  const resetUpload = () => {
    setUploadState('idle');
    setProcessedData(null);
    setError('');
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calling Tracker</h2>
        <p className="text-muted-foreground">Upload CSV files and generate calling reports</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            CSV Upload
          </CardTitle>
          <CardDescription>
            Upload your learner CSV file to generate calling reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="csvFile">Select CSV File</Label>
              <Input
                id="csvFile"
                type="file"
                accept=".csv"
                {...form.register('csvFile')}
                disabled={uploadState === 'processing'}
                className="mt-1"
                ref={fileInputRef}
              />
              {form.formState.errors.csvFile && (
                <p className="text-sm text-destructive mt-1">
                  {String(form.formState.errors.csvFile.message)}
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={uploadState === 'processing'}
                className="flex items-center gap-2"
              >
                {uploadState === 'processing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploadState === 'processing' ? 'Processing...' : 'Upload & Process'}
              </Button>

              {uploadState === 'success' && (
                <Button variant="outline" onClick={resetUpload}>
                  Upload New File
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results Section */}
      {uploadState === 'success' && processedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Processing Complete
            </CardTitle>
            <CardDescription>
              File: {processedData.filename}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">{processedData.totalRows}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="text-2xl font-bold">{processedData.cohorts.length}</div>
                <div className="text-sm text-muted-foreground">Cohorts</div>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{processedData.submittedCount}</div>
                <div className="text-sm text-green-600">Submitted</div>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-700">{processedData.notSubmittedCount}</div>
                <div className="text-sm text-red-600">Not Submitted</div>
              </div>
            </div>

            {/* Cohorts List */}
            <div>
              <h4 className="font-semibold mb-2">Cohorts Found:</h4>
              <div className="flex flex-wrap gap-2">
                {processedData.cohorts.map((cohort, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                  >
                    {cohort}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button onClick={downloadReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download Report
              </Button>
              <Button variant="outline" onClick={sendEmailReport} className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            CSV Format Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Required Columns:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Column B: Cohort ID</li>
              <li>Column I: Learner Email</li>
              <li>Column AM: Submission Status</li>
              <li>Column AN: Learner Type (International/Domestic)</li>
              <li>Column AO: Submission Name</li>
            </ul>
            <p className="mt-4"><strong>Note:</strong> The system will automatically identify learners with "Not Submitted" status and generate calling reports.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
