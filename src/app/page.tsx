"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useHomeState } from "@/hooks/use-home-state";
// Removed LearnerHistory import for admin-only redesign
import { UserDashboard } from "@/components/app/user-dashboard";
import { BadgeModal } from '@/components/app/badge-modal';
import { AppHeader } from "@/components/app/header";
import { AdminDashboard } from "@/components/app/admin-dashboard";
import { CallingTracker } from "@/components/app/calling-tracker";
import { AdminCallingTracker } from "@/components/app/admin-calling-tracker";
import { UserRankings } from "@/components/app/user-rankings";
import { UserProfile } from "@/components/app/user-profile";
import { UserBadges } from "@/components/app/user-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Pie, PieChart, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts";
import {
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  Pencil,
  XCircle,
  RotateCcw,
  Users,
  Globe,
  Info,
  CheckCircle,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context-supabase";
import Link from "next/link";
import { useRouter } from 'next/navigation';

import { LearnerData, Remark } from "@/lib/types";
import { sendEmailReport } from "@/lib/actions";
import { EditRemarkDialog } from "@/components/app/edit-remark-dialog";
import { EmailReportDialog } from "@/components/app/email-report-dialog";

import { IconUpload } from "@/components/icons";
import { Stepper } from "@/components/app/stepper";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  csvFile: (typeof window !== 'undefined' && window.FileList) 
    ? z.instanceof(FileList).refine((files) => files?.length === 1, "CSV file is required.")
    : z.any()
});

type FormValues = z.infer<typeof formSchema>;

export type UploadState = "idle" | "validating" | "error" | "success";
type SubmissionSummary = { name: string; value: number };

const INITIAL_COL_INDICES = {
    COHORT: 1, // B
    EMAIL: 8, // I
    SUBMISSION_STATUS: 38, // AM
    LEARNER_TYPE: 39, // AN
    SUBMISSION_NAME: 40, // AO
};

const indexToColumn = (index: number): string => {
    let temp, letter = '';
    while (index >= 0) {
        temp = index % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        index = Math.floor(index / 26) - 1;
    }
    return letter;
};

const columnToIndex = (col: string): number => {
    let index = 0;
    const upperCol = col.toUpperCase();
    for (let i = 0; i < upperCol.length; i++) {
        index = index * 26 + upperCol.charCodeAt(i) - 'A'.charCodeAt(0) + 1;
    }
    return index - 1;
}

const robustParseCsv = (csvText: string): string[][] => {
    const rows = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotedField = false;

    // Normalize line endings to LF
    const normalizedCsvText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < normalizedCsvText.length; i++) {
        const char = normalizedCsvText[i];

        if (inQuotedField) {
            if (char === '"') {
                // Check for escaped double quote
                if (i + 1 < normalizedCsvText.length && normalizedCsvText[i + 1] === '"') {
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    inQuotedField = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === ',') {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\n') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else if (char === '"' && currentField === '') {
                inQuotedField = true;
            } else {
                currentField += char;
            }
        }
    }

    // Add the last field if it exists
    if (currentField !== '' || currentRow.length > 0) {
        currentRow.push(currentField);
        rows.push(currentRow);
    }
    
    // In case the last line is empty
    if(rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === '') {
        rows.pop();
    }

    return rows;
};


const parseCsvContent = (content: string, colIndices: typeof INITIAL_COL_INDICES): { data: LearnerData[], error?: string } => {
    const allRows = robustParseCsv(content);
    const dataRows = allRows.slice(1);

    if (dataRows.length === 0) {
        return { data: [], error: "CSV file contains no data rows." };
    }

    try {
        const data = dataRows.map((values) => {
            const row: LearnerData = {
                "Cohort": values[colIndices.COHORT]?.trim() || "N/A",
                "Email": values[colIndices.EMAIL]?.trim(),
                "Submission Status": values[colIndices.SUBMISSION_STATUS]?.trim(),
                "Learner Type": values[colIndices.LEARNER_TYPE]?.trim(),
                "Submission Name": values[colIndices.SUBMISSION_NAME]?.trim(),
            };
            return row;
        }).filter(row => row.Email && row.Email.includes('@')); // Basic email validation

        if (data.length === 0) {
            return { data: [], error: "Could not find any valid learner data in the file. Please check if the file format and columns are correct." };
        }
        return { data };
    } catch (e: any) {
        console.error("Error parsing CSV:", e);
        return { data: [], error: e.message || "An unexpected error occurred while parsing the CSV data." };
    }
}

const STEPS = [
  { number: 1, title: 'Upload CSV', description: 'Upload your learner data file' },
  { number: 2, title: 'Select Cohorts', description: 'Choose cohorts to process' },
  { number: 3, title: 'Review Summary', description: 'View submission summary' },
  { number: 4, title: 'Collect Remarks', description: 'Add remarks for non-submitted learners' },
  { number: 5, title: 'Generate Report', description: 'Create and send your report' },
];

const generateRemarkKey = (learner: LearnerData): string => {
  return `${learner.Email}|${learner.Cohort}|${learner['Submission Name']}`;
}

export default function Home() {
  const state = useHomeState();

  const { toast } = useToast();
  const { user, loading, logout, isAdmin } = useAuth();
  const router = useRouter();

  // ALL HOOKS MUST BE AT THE TOP - NEVER AFTER CONDITIONAL RETURNS
  const [tracking, setTracking] = useState<{ totals?: { uploads: number; remarks: number; learnersTracked: number }, recent?: any } | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminActivities, setAdminActivities] = useState<any[]>([]);
  const [adminTotals, setAdminTotals] = useState<{ uploads: number; remarks: number; learnersTracked: number } | null>(null);
  const [adminCohortDist, setAdminCohortDist] = useState<Record<string, number>>({});
  const [currentView, setCurrentView] = useState<'home' | 'dashboard' | 'calling-tracker' | 'rankings' | 'profile'>('home');
  const [learnerSearchQuery, setLearnerSearchQuery] = useState<string>("");
  const [adminFilter, setAdminFilter] = useState<string>("");
  const [adminStartDate, setAdminStartDate] = useState<string>("");
  const [adminEndDate, setAdminEndDate] = useState<string>("");
  const [adminSelectedUserId, setAdminSelectedUserId] = useState<string>("");
  const [adminRecentRemarks, setAdminRecentRemarks] = useState<any[]>([]);
  const [timelinePage, setTimelinePage] = useState<number>(1);
  const TIMELINE_PAGE_SIZE = 9;
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  
  // Form hook
  const { register, handleSubmit, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // ALL CALLBACKS MUST BE AT THE TOP TOO
  const processCsvData = useCallback((content: string, indices: typeof INITIAL_COL_INDICES) => {
    const { data, error } = parseCsvContent(content, indices);

    if (error) {
        state.setUploadState("error");
        state.setErrorMessage(error);
        state.setLearnerData([]);
        state.setUniqueCohorts([]);
        state.setSelectedCohorts([]);
        state.setRemarks([]);
        return;
    }
    
    const cohorts = [...new Set(data.map((row) => row.Cohort || "N/A"))].filter(Boolean) as string[];
    const uniqueLearners = data.length;

    state.setUploadState("success");
    state.setLearnerData(data);
    state.setUniqueCohorts(cohorts);
    state.setSelectedCohorts(cohorts);
    state.setRemarks([]);

    console.log(`📊 Processed ${uniqueLearners} learners across ${cohorts.length} cohorts`);
  }, [state]);

  // ALL USEEFFECT HOOKS MUST BE AT THE TOP
  // Redirect logic: if not logged in, go to landing page
  useEffect(() => {
    if (!loading && !user) {
      router.push('/landing');
    }
  }, [user, loading, router]);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('appState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        state.setUploadState(parsedState.uploadState || "idle");
        state.setFileName(parsedState.fileName || "");
        state.setCsvContent(parsedState.csvContent || "");
        state.setLearnerData(parsedState.learnerData || []);
        state.setUniqueCohorts(parsedState.uniqueCohorts || []);
        state.setSelectedCohorts(parsedState.selectedCohorts || []);
        state.setRemarks(parsedState.remarks || []);
        state.setColIndices(parsedState.colIndices || INITIAL_COL_INDICES);
        state.setReportGenerated(parsedState.reportGenerated || false);
        // Don't reprocess CSV data if it's already loaded
        // The data is already in parsedState.learnerData
      }
    } catch (error) {
      console.error('Error loading saved state:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const appState = {
      uploadState: state.uploadState,
      fileName: state.fileName,
      csvContent: state.csvContent,
      learnerData: state.learnerData,
      uniqueCohorts: state.uniqueCohorts,
      selectedCohorts: state.selectedCohorts,
      remarks: state.remarks,
      colIndices: state.colIndices,
      reportGenerated: state.isReportGenerated,
    };
    localStorage.setItem('appState', JSON.stringify(appState));
  }, [state.uploadState, state.fileName, state.csvContent, state.learnerData, state.uniqueCohorts, state.selectedCohorts, state.remarks, state.colIndices, state.isReportGenerated]);

  // Header event listeners
  useEffect(() => {
    const handler = document.createElement('a');
    handler.id = 'summary-link-handler';
    handler.style.display = 'none';
    document.body.appendChild(handler);
    return () => {
      if (document.getElementById('summary-link-handler')) {
        document.body.removeChild(handler);
      }
    };
  }, [state.setSummaryView]);

  useEffect(() => {
    const handleSummaryEvent = () => {
      state.setSummaryView(true);
      state.setShowDashboard(false);
    };
    const handleDashboardEvent = () => {
      state.setShowDashboard(true);
      state.setSummaryView(false);
    };
    const handleHomeEvent = () => {
      state.setSummaryView(false);
      state.setShowDashboard(false);
      setCurrentView('home');
    };
    const handleCallingTrackerEvent = () => {
      state.setSummaryView(false);
      state.setShowDashboard(false);
      setCurrentView('calling-tracker');
    };
    const handleRankingsEvent = () => {
      state.setSummaryView(false);
      state.setShowDashboard(false);
      setCurrentView('rankings');
    };
    const handleProfileEvent = () => {
      state.setSummaryView(false);
      state.setShowDashboard(false);
      setCurrentView('profile');
    };
    window.addEventListener('showSummary', handleSummaryEvent);
    window.addEventListener('showDashboard', handleDashboardEvent);
    window.addEventListener('showHome', handleHomeEvent);
    window.addEventListener('showCallingTracker', handleCallingTrackerEvent);
    window.addEventListener('showRankings', handleRankingsEvent);
    window.addEventListener('showProfile', handleProfileEvent);
    return () => {
      window.removeEventListener('showSummary', handleSummaryEvent);
      window.removeEventListener('showDashboard', handleDashboardEvent);
      window.removeEventListener('showHome', handleHomeEvent);
      window.removeEventListener('showCallingTracker', handleCallingTrackerEvent);
      window.removeEventListener('showRankings', handleRankingsEvent);
      window.removeEventListener('showProfile', handleProfileEvent);
    };
  }, [state.setSummaryView, state.setShowDashboard]);

  // Fetch tracking totals when Dashboard is shown
  useEffect(() => {
    const fetchTracking = async () => {
      try {
        if (user && state.showDashboard) {
          const response = await fetch(`/api/tracking?userId=${encodeURIComponent(user.id)}`);
          if (response.ok) {
            const data = await response.json();
            setTracking(data);
          }
        }
      } catch (error) {
        console.error('Error fetching tracking data:', error);
      }
    };
    fetchTracking();
  }, [state.showDashboard, user]);

  // Admin: fetch all users, activities, and tracking totals
  useEffect(() => {
    let interval: any;
    const fetchAdmin = async () => {
      try {
        if (isAdmin && state.showDashboard) {
          const [usersRes, activitiesRes, trackingRes] = await Promise.all([
            fetch('/api/users'),
            fetch('/api/activity'),
            fetch('/api/tracking?admin=true')
          ]);
          if (usersRes.ok) setAdminUsers(await usersRes.json());
          if (activitiesRes.ok) setAdminActivities(await activitiesRes.json());
          if (trackingRes.ok) {
            const trackingData = await trackingRes.json();
            setAdminTotals(trackingData.totals || { uploads: 0, remarks: 0, learnersTracked: 0 });
            setAdminRecentRemarks(trackingData.recent?.remarks || []);
          }
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      }
    };
    if (isAdmin && state.showDashboard) {
      fetchAdmin();
      interval = setInterval(fetchAdmin, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAdmin, state.showDashboard]);

  // Keep authentication state in sync
  useEffect(() => {
    if (user) {
      state.setIsAuthenticated(true);
    } else {
      state.setIsAuthenticated(false);
    }
  }, [user, state.setIsAuthenticated]);

  // ALL USEMEMO HOOKS MUST BE AT THE TOP TOO
  const filteredData = useMemo(() => state.learnerData.filter((row) =>
    state.selectedCohorts.includes(row.Cohort || "N/A")
  ), [state.learnerData, state.selectedCohorts]);

  const submissionSummary: SubmissionSummary[] = useMemo(() => {
    const totalSubmitted = filteredData.filter(row => row["Submission Status"] === "Submitted").length;
    const totalNotSubmitted = filteredData.length - totalSubmitted;
    return [
      { name: "Submitted", value: totalSubmitted },
      { name: "Not Submitted", value: totalNotSubmitted }
    ];
  }, [filteredData]);

  const notSubmittedData = useMemo(() => filteredData.filter(
    (row) => row["Submission Status"] === "Not Submitted"
  ), [filteredData]);
  
  const learnerTypeSummary = useMemo(() => {
    return notSubmittedData.reduce((acc, learner) => {
      const type = learner["Learner Type"]?.trim();
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [notSubmittedData]);

  const currentStep = useMemo(() => {
    if (state.uploadState !== 'success') return 1;
    if (state.selectedCohorts.length === 0) return 2;
    if (state.isSummaryView) return 3;
    return 1;
  }, [state.uploadState, state.selectedCohorts.length, state.isSummaryView]);

  
  const { setUploadState, setErrorMessage, setLearnerData, setUniqueCohorts, setSelectedCohorts, setRemarks } = state;
  
  const processFile = async (file: File) => {
    state.setUploadState("validating");
    state.setFileName(file.name);
    state.setReportGenerated(false);
    
    const content = await file.text();
    state.setCsvContent(content);
    processCsvData(content, state.colIndices);

    // Track CSV upload locally
    try {
      const parsed = parseCsvContent(content, state.colIndices);
      const rowCount = parsed.data?.length || 0;
      if (user && rowCount > 0) {
        console.log(`✅ CSV uploaded: ${file.name} with ${rowCount} rows by ${user.name || user.email}`);

        // Try to track upload in Supabase, fallback to localStorage
        try {
          await fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'upload',
              data: {
                userId: user.id,
                filename: file.name,
                rowCount,
                fileSize: file.size,
                uploadTime: new Date().toLocaleString()
              }
            })
          });

          await fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: Date.now().toString(),
              user_id: user.id,
              activity: 'CSV Upload',
              details: {
                filename: file.name,
                rowCount,
                fileSize: file.size,
                uploadTime: new Date().toLocaleString()
              },
              timestamp: new Date().toISOString(),
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString()
            })
          });
        } catch (apiError) {
          console.log('API tracking failed, using localStorage fallback');
          // Fallback to localStorage
          const uploads = JSON.parse(localStorage.getItem('csv_uploads') || '[]');
          uploads.push({
            userId: user.id,
            filename: file.name,
            rowCount,
            uploadedAt: new Date().toISOString(),
            fileSize: file.size,
            uploadTime: new Date().toLocaleString()
          });
          localStorage.setItem('csv_uploads', JSON.stringify(uploads));

          const activities = JSON.parse(localStorage.getItem('user_activity') || '[]');
          activities.push({
            id: Date.now().toString(),
            userId: user.id,
            activity: 'CSV Upload',
            details: {
              filename: file.name,
              rowCount,
              fileSize: file.size,
              uploadTime: new Date().toLocaleString()
            },
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
          });
          localStorage.setItem('user_activity', JSON.stringify(activities));
        }

        // Also persist to tracking.json via API and server activity
        try {
          const submitted = parsed.data.filter((r: any) => r['Submission Status'] === 'Submitted').length;
          const notSubmitted = rowCount - submitted;
          const cohorts = [...new Set(parsed.data.map((r: any) => r.Cohort || ''))].filter(Boolean);
          await fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'upload',
              data: {
                userId: user.id,
                userName: user.name || user.email,
                filename: file.name,
                cohorts,
                totalRows: rowCount,
                submittedCount: submitted,
                notSubmittedCount: notSubmitted,
              }
            })
          });
          // Server activities feed for Admin timeline
          try {
            await fetch('/api/activity', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: Date.now().toString(),
                userId: user.id,
                activity: 'CSV Upload',
                details: { filename: file.name, rowCount, uploadTime: new Date().toLocaleString() },
                timestamp: new Date().toISOString(),
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString()
              })
            });
          } catch {}
        } catch (e) {
          console.warn('Failed to POST tracking upload', e);
        }
      }
    } catch (e) {
      console.error("❌ Failed to track CSV upload:", e);
    }
  };

  const handleColIndexChange = (key: keyof typeof INITIAL_COL_INDICES, value: string) => {
    const newIndex = columnToIndex(value);
    if (newIndex >= 0) {
        const newIndices = {...state.colIndices, [key]: newIndex };
        state.setColIndices(newIndices);
        if (state.csvContent) {
            processCsvData(state.csvContent, newIndices);
        }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    state.setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
       const validFiles = Array.from(files).filter(f => f.type === 'text/csv' || f.name.endsWith('.csv'));
      if (validFiles.length > 0) {
        processFile(validFiles[0]);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a .csv file.",
        });
      }
    }
  };
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); state.setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); state.setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleCohortSelection = (cohort: string) => {
    const newSelectedCohorts = state.selectedCohorts.includes(cohort)
        ? state.selectedCohorts.filter((c) => c !== cohort)
        : [...state.selectedCohorts, cohort];

    state.setSelectedCohorts(newSelectedCohorts);
    
    // Clean up remarks for deselected cohorts
    const learnersInSelectedCohorts = new Set(
      state.learnerData
        .filter(learner => newSelectedCohorts.includes(learner.Cohort || 'N/A'))
        .map(learner => generateRemarkKey(learner))
    );
    state.setRemarks(prevRemarks => prevRemarks.filter(remark => learnersInSelectedCohorts.has(remark.key)));
  };
  
  const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"];

  const summaryViewContent = (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Submission Summary</CardTitle>
            <CardDescription>Overview of submission statuses for all learners in selected cohorts.</CardDescription>
          </div>
          <Button variant="outline" onClick={() => state.setSummaryView(false)}>Back to Main</Button>
        </div>
      </CardHeader>
      <CardContent>
      {state.selectedCohorts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={submissionSummary} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label>
                {submissionSummary.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(50, 50, 50, 0.7)',
                  backdropFilter: 'blur(5px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-center md:text-left">Detailed Breakdown</h3>
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Learners Selected</span>
                <span className="font-bold text-xl">{filteredData.length}</span>
              </div>
              <hr className="border-border/50" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500" />
                  <span>Submitted</span>
                </div>
                <span className="font-semibold">{submissionSummary.find(s => s.name === 'Submitted')?.value || 0} ({filteredData.length > 0 ? ((submissionSummary.find(s => s.name === 'Submitted')?.value || 0) / filteredData.length * 100).toFixed(1) : 0}%)</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-500" />
                  <span>Not Submitted</span>
                </div>
                <span className="font-semibold">{submissionSummary.find(s => s.name === 'Not Submitted')?.value || 0} ({filteredData.length > 0 ? ((submissionSummary.find(s => s.name === 'Not Submitted')?.value || 0) / filteredData.length * 100).toFixed(1) : 0}%)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">Please select at least one cohort to see the summary.</div>
      )}
      </CardContent>
    </Card>
  );

  const handleEditRemark = (learner: LearnerData) => {
    state.setCurrentLearner(learner);
    state.setRemarkDialogOpen(true);
  };

  const handleSaveRemark = async (learner: LearnerData, remarkText: string) => {
    const key = generateRemarkKey(learner);
    state.setRemarks((prev) => {
      const existing = prev.find((r) => r.key === key);
      if (existing) {
        return prev.map((r) =>
          r.key === key ? { ...r, remark: remarkText } : r
        );
      }
      return [...prev, { key: key, remark: remarkText }];
    });
    toast({
      title: "Remark Saved",
      description: `Remark for ${learner.Email} has been updated.`,
    });

    // Persist remark locally if user is logged in
    try {
      if (user) {
        console.log(`💬 Remark saved for ${learner.Email}: ${remarkText}`);

        // Try to store remark in Supabase, fallback to localStorage
        try {
          await fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'remark',
              data: {
                userId: user.id,
                learnerEmail: learner.Email,
                learnerName: learner.Name || '',
                remark: remarkText,
                learnerCohort: learner.Cohort || '',
                createdAt: new Date().toISOString(),
                timestamp: new Date().toLocaleString()
              }
            })
          });

          await fetch('/api/activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: Date.now().toString(),
              user_id: user.id,
              activity: 'Remark Added',
              details: {
                learnerEmail: learner.Email,
                learnerName: learner.Name || '',
                remark: remarkText.substring(0, 100) + (remarkText.length > 100 ? '...' : ''),
                learnerCohort: learner.Cohort || ''
              },
              timestamp: new Date().toISOString(),
              date: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString()
            })
          });
        } catch (apiError) {
          console.log('API tracking failed, using localStorage fallback');
          // Fallback to localStorage
          const remarks = JSON.parse(localStorage.getItem('user_remarks') || '[]');
          remarks.push({
            userId: user.id,
            learnerEmail: learner.Email,
            learnerName: learner.Name || '',
            remark: remarkText,
            learnerCohort: learner.Cohort || '',
            createdAt: new Date().toISOString(),
            timestamp: new Date().toLocaleString()
          });
          localStorage.setItem('user_remarks', JSON.stringify(remarks));

          const activities = JSON.parse(localStorage.getItem('user_activity') || '[]');
          activities.push({
            id: Date.now().toString(),
            userId: user.id,
            activity: 'Remark Added',
            details: {
              learnerEmail: learner.Email,
              learnerName: learner.Name || '',
              remark: remarkText.substring(0, 100) + (remarkText.length > 100 ? '...' : ''),
              learnerCohort: learner.Cohort || ''
            },
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString()
          });
          localStorage.setItem('user_activity', JSON.stringify(activities));
        }

        // Also persist to tracking.json via API and server activity
        try {
          await fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'remark',
              data: {
                userId: user.id,
                userName: user.name || user.email,
                learnerEmail: learner.Email,
                learnerCohort: learner.Cohort || '',
                remark: remarkText,
                csvFilename: state.fileName || ''
              }
            })
          });
        } catch (e) {
          console.warn('Failed to POST tracking remark', e);
        }

        console.log(`✅ Remark and activity tracked for ${learner.Email}`);
      }
    } catch (e) {
      console.error("❌ Failed to persist remark:", e);
    }
  };

  const getRemarkForLearner = (learner: LearnerData) => {
    const key = generateRemarkKey(learner);
    return state.remarks.find((r) => r.key === key)?.remark || "";
  };

  const handleDownload = () => {
    const reportData = notSubmittedData.map((learner) => ({
      ...learner,
      Remarks: getRemarkForLearner(learner),
    }));
    
    if (reportData.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to download",
        description: "There are no learners with 'Not Submitted' status in the selected cohorts.",
      });
      return;
    }

    const headers = [...Object.keys(reportData[0])];
    const csvContent = [
      headers.join(","),
      ...reportData.map((row) =>
        headers.map(header => {
            let value = row[header as keyof typeof row];
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cohort_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Download Started",
      description: "Your report is being downloaded.",
    });
    state.setReportGenerated(true);
  };

  const handleEmail = async (recipientEmail: string) => {
    state.setIsSendingEmail(true);
    const reportData = notSubmittedData.map((learner) => ({
      ...learner,
      remarks: getRemarkForLearner(learner),
    }));

     if (reportData.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to email",
        description: "There are no learners with 'Not Submitted' status to include in the email.",
      });
      state.setIsSendingEmail(false);
      return;
    }
    
    const hasRemarks = reportData.some(learner => learner.remarks);

    try {
      const result = await sendEmailReport({
        recipientEmail,
        cohortDetails: state.selectedCohorts.join(", "),
        reportType: hasRemarks ? "Calling Report with Remarks" : "No Submission Report",
        reportData,
        hasRemarks,
      });
      toast({
        title: result.success ? "Email Sent" : "Email Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        state.setReportGenerated(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send the email report.",
      });
    } finally {
      state.setIsSendingEmail(false);
      state.setEmailDialogOpen(false);
      state.setUploadState("idle");
      state.setFileName("");
      state.setCsvContent("");
      state.setLearnerData([]);
      state.setUniqueCohorts([]);
    }
  };

  const handleClear = () => {
    state.setUploadState("idle");
    state.setFileName("");
    state.setCsvContent("");
    state.setLearnerData([]);
    state.setUniqueCohorts([]);
    state.setSelectedCohorts([]);
    state.setRemarks([]);
    state.setColIndices(INITIAL_COL_INDICES);
    state.setReportGenerated(false);
    reset();

    localStorage.removeItem('appState');

    toast({
      title: "Data Cleared",
      description: "You can now upload a new CSV file.",
    });
  };


  const renderUploadState = () => {
    switch (state.uploadState) {
      case "idle":
        return null;
      case "validating":
        return <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating...</div>;
      case "error":
        return <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertTitle>Validation Failed</AlertTitle><AlertDescription>{state.errorMessage}</AlertDescription></Alert>;
      case "success":
        return (
          <div className="flex justify-between items-center">
            <Alert className="flex-grow"><CheckCircle2 className="h-4 w-4 text-green-500" /><AlertTitle>Upload Successful</AlertTitle><AlertDescription>{state.fileName}</AlertDescription></Alert>
            <Button variant="outline" onClick={handleClear} className="ml-4">
              <RotateCcw className="mr-2 h-4 w-4" /> Upload New File
            </Button>
          </div>
        );
      default:
    }
  };
  
  const showProcessingUI = state.uploadState === 'success' && state.learnerData.length > 0;
  

const mainContent = (
    <>
      {user && state.showDashboard && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Dashboard</CardTitle>
              <CardDescription>Track your activities, uploads, and interactions with learners</CardDescription>
            </CardHeader>
            <CardContent>
              <UserDashboard userEmail={user.id} />
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Selected Account</CardTitle>
              <CardDescription>Per-account insights and controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded border">
                  <div className="text-sm text-muted-foreground">Activity Count</div>
                  <div className="text-2xl font-bold">{adminActivities.filter((a: any) => !adminSelectedUserId || a.userId === adminSelectedUserId).length}</div>
                </div>
                <div className="p-4 rounded border">
                  <div className="text-sm text-muted-foreground">Remarks Count</div>
                  <div className="text-2xl font-bold">{adminRecentRemarks.filter((r: any) => !adminSelectedUserId || r.userId === adminSelectedUserId).length}</div>
                </div>
                <div className="p-4 rounded border">
                  <div className="text-sm text-muted-foreground">Last Login</div>
                  <div className="text-sm">
                    {(() => {
                      const last = [...adminActivities]
                        .filter((a: any) => (!adminSelectedUserId || a.userId === adminSelectedUserId) && a.activity === 'User Login')
                        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                      return last ? `${last.date} ${last.time}` : '—';
                    })()}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Recent Remarks</h4>
                <div className="space-y-2">
                  {adminRecentRemarks
                    .filter((r: any) => !adminSelectedUserId || r.userId === adminSelectedUserId)
                    .slice(0, 10)
                    .map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between border rounded p-2">
                        <div className="text-sm">
                          <div className="font-medium">{r.learnerEmail} • {r.learnerCohort || '—'}</div>
                          <div className="text-muted-foreground text-xs">{new Date(r.remarkDate).toLocaleString()}</div>
                          <div className="text-xs mt-1">{r.remark}</div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              await fetch(`/api/tracking?remarkId=${encodeURIComponent(r.id)}`, { method: 'DELETE' });
                              // Refresh admin data
                              const res = await fetch('/api/tracking');
                              if (res.ok) {
                                const t = await res.json();
                                setAdminRecentRemarks((t?.recent && t.recent.remarks) ? t.recent.remarks : []);
                                setAdminCohortDist(t?.remarksByCohort || {});
                                setAdminTotals(t?.totals || null);
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Clear local/session data or server JSON records for this account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    try {
                      const uid = user.id;
                      const acts = JSON.parse(localStorage.getItem('user_activity') || '[]').filter((a: any) => a.userId !== uid);
                      localStorage.setItem('user_activity', JSON.stringify(acts));
                      const ups = JSON.parse(localStorage.getItem('csv_uploads') || '[]').filter((u: any) => u.userId !== uid);
                      localStorage.setItem('csv_uploads', JSON.stringify(ups));
                      const rems = JSON.parse(localStorage.getItem('user_remarks') || '[]').filter((r: any) => r.userId !== uid);
                      localStorage.setItem('user_remarks', JSON.stringify(rems));
                      window.dispatchEvent(new CustomEvent('storageUpdated'));
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  Clear Local Data
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const uid = user.id;
                      await fetch(`/api/activity?userId=${encodeURIComponent(uid)}`, { method: 'DELETE' });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  Clear Server Activity (JSON)
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      const uid = user.id;
                      await fetch(`/api/users?id=${encodeURIComponent(uid)}`, { method: 'DELETE' });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  Remove User from users.json
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learner History removed for regular users as requested */}
        </>
      )}

      {!showProcessingUI && (() => {
        // Check for existing user data (client-only)
        let uploads: any[] = [];
        let activities: any[] = [];
        if (typeof window !== 'undefined') {
          try { uploads = JSON.parse(localStorage.getItem('csv_uploads') || '[]'); } catch {}
          try { activities = JSON.parse(localStorage.getItem('user_activity') || '[]'); } catch {}
        }
        const hasExistingData = uploads.length > 0 || activities.length > 0;
        
        if (!hasExistingData) {
          return (
            <Card className="max-w-3xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome to the Calling Tracker</CardTitle>
                <CardDescription className="mt-2">
                  You have not uploaded any CSV files yet. Get started by uploading your first learner data file.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label htmlFor="csvFile" className="cursor-pointer">
                    <div
                      onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                      className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors ${state.isDragging ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'}`}
                    >
                      <div className="text-center">
                        <IconUpload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">CSV file up to 10MB</p>
                      </div>
                      <Input id="csvFile" type="file" accept=".csv" onChange={onFileChange} className="sr-only" />
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>
          );
        }
        
        return (
          <>
            <Card className="max-w-3xl mx-auto">
              <CardHeader className="text-center">
                <CardTitle>Upload New Data</CardTitle>
                <CardDescription>Upload another CSV file with learner information or view existing data.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <label htmlFor="csvFile" className="cursor-pointer">
                    <div
                      onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                      className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors ${state.isDragging ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'}`}
                    >
                      <div className="text-center">
                        <IconUpload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          <span className="font-semibold text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">CSV file up to 10MB</p>
                      </div>
                      <Input id="csvFile" type="file" accept=".csv" onChange={onFileChange} className="sr-only" />
                    </div>
                  </label>
                  <p className="text-sm text-muted-foreground">The app will automatically read data from the uploaded CSV file.</p>
                </div>
              </CardContent>
            </Card>
            <div className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => state.setShowDashboard(true)}
                className="mx-auto block"
              >
                View Previous Uploads & Activity
              </Button>
            </div>
          </>
        );
      })()}

      <div className="space-y-4">
        {renderUploadState()}
      </div>
      
      {showProcessingUI && (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Info size={20} /> Column Mapping
                    </CardTitle>
                    <CardDescription>
                        This is how the app interprets your CSV columns. Change the letters to match your file.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {(Object.keys(state.colIndices) as Array<keyof typeof INITIAL_COL_INDICES>).map((key) => (
                            <div key={key} className="flex flex-col gap-2">
                                <Label htmlFor={`col-${key}`} className="text-sm font-medium capitalize text-muted-foreground">
                                    {key.replace('_', ' ').toLowerCase()}
                                </Label>
                                <Input
                                    id={`col-${key}`}
                                    defaultValue={indexToColumn(state.colIndices[key])}
                                    onBlur={(e) => handleColIndexChange(key, e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleColIndexChange(key, e.currentTarget.value) }}
                                    className="w-24 font-mono"
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

           <Card className="max-w-3xl mx-auto">
            <CardHeader><CardTitle>Select Cohorts</CardTitle><CardDescription>Choose one or more cohorts to generate a report for.</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {state.uniqueCohorts.map((cohort) => (
                  <div key={cohort} className="flex items-center space-x-2 p-3 rounded-md border">
                    <Checkbox id={cohort} checked={state.selectedCohorts.includes(cohort)} onCheckedChange={() => handleCohortSelection(cohort)} />
                    <label htmlFor={cohort} className="text-sm font-medium leading-none">{cohort}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {state.selectedCohorts.length > 0 && (
            <>
              <div className="grid md:grid-cols-3 gap-8">
                <Card className="md:col-span-1">
                   <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users /> Learner Types
                    </CardTitle>
                    <CardDescription>
                        Counts for non-submitted learners.
                    </CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Globe className="text-blue-400" />
                            <span className="font-medium">International</span>
                          </div>
                          <span className="font-bold text-lg">{learnerTypeSummary['International'] || 0}</span>
                      </div>
                       <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                             <Users className="text-green-400" />
                             <span className="font-medium">Domestic</span>
                          </div>
                          <span className="font-bold text-lg">{learnerTypeSummary['Domestic'] || 0}</span>
                      </div>
                   </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Remarks for Non-Submissions</CardTitle><CardDescription>Add remarks for learners who have not submitted. These will be included in the report.</CardDescription></CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <Input
                          placeholder="🔍 Search learners by email, cohort, or submission name..."
                          value={learnerSearchQuery}
                          onChange={(e) => setLearnerSearchQuery(e.target.value)}
                          className="max-w-md"
                        />
                      </div>
                      <Table>
                        <TableHeader><TableRow><TableHead>Learner Email</TableHead><TableHead>Cohort</TableHead><TableHead>Submission Name</TableHead><TableHead>Remarks</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {notSubmittedData.length > 0 ? (
                            notSubmittedData
                              .filter((learner) => {
                                if (!learnerSearchQuery) return true;
                                const searchLower = learnerSearchQuery.toLowerCase();
                                const email = (learner.Email || '').toLowerCase();
                                const cohort = (learner.Cohort || '').toLowerCase();
                                const submissionName = (learner["Submission Name"] || '').toLowerCase();
                                const remark = (getRemarkForLearner(learner) || '').toLowerCase();
                                return email.includes(searchLower) || 
                                       cohort.includes(searchLower) || 
                                       submissionName.includes(searchLower) ||
                                       remark.includes(searchLower);
                              })
                              .map((learner) => (
                                <TableRow key={generateRemarkKey(learner)}>
                                  <TableCell>{learner.Email}</TableCell>
                                  <TableCell>{learner.Cohort}</TableCell>
                                  <TableCell>{learner["Submission Name"]}</TableCell>
                                  <TableCell className="max-w-xs truncate">{getRemarkForLearner(learner) || <span className="text-muted-foreground">No remarks yet</span>}</TableCell>
                                  <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => handleEditRemark(learner)}><Pencil className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <TableRow><TableCell colSpan={5} className="text-center py-10">No learners with "Not Submitted" status in selected cohorts.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                </Card>
              </div>

              <Card className="max-w-md mx-auto">
                  <CardHeader><CardTitle>Generate Report</CardTitle><CardDescription>Your report is ready. You can download it as a CSV or send it via email.</CardDescription></CardHeader>
                  <CardContent className="flex flex-col gap-4 items-center">
                      <Button onClick={handleDownload} variant="outline" className="w-full"><Download /> Download Report</Button>
            <Button onClick={() => state.setEmailDialogOpen(true)} className="w-full" disabled={state.isSendingEmail}>
              {state.isSendingEmail ? <Loader2 className="animate-spin" /> : <Mail />} Email Report
                      </Button>
                  </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </>
  );

  const adminDashboardContent = (
    <>
      {user && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Admin Console</CardTitle>
              <CardDescription>Platform-wide overview and controls</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-md border">
                  <div className="text-sm text-muted-foreground">Total Users</div>
                  <div className="text-2xl font-bold">{adminUsers.length}</div>
                </div>
                <div className="p-4 rounded-md border">
                  <div className="text-sm text-muted-foreground">Total Activities</div>
                  <div className="text-2xl font-bold">{adminActivities.length}</div>
                </div>
                <div className="p-4 rounded-md border">
                  <div className="text-sm text-muted-foreground">Total Remarks</div>
                  <div className="text-2xl font-bold">{adminActivities.filter((a: any) => a.activity === 'Remark Added').length}</div>
                </div>
                <div className="p-4 rounded-md border">
                  <div className="text-sm text-muted-foreground">Learners Tracked</div>
                  <div className="text-2xl font-bold">{adminTotals?.learnersTracked ?? '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Global Activity Timeline</CardTitle>
              <CardDescription>Newest activity first; auto-refreshing every 5s</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <Input
                  placeholder="Filter by learner email or user id"
                  value={adminFilter}
                  onChange={(e) => {
                    setAdminFilter(e.target.value);
                    setTimelinePage(1);
                  }}
                />
                <div className="flex items-center gap-2">
                  <Label className="text-sm">From</Label>
                  <Input
                    type="date"
                    value={adminStartDate}
                    onChange={(e) => {
                      setAdminStartDate(e.target.value);
                      setTimelinePage(1);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">To</Label>
                  <Input
                    type="date"
                    value={adminEndDate}
                    onChange={(e) => {
                      setAdminEndDate(e.target.value);
                      setTimelinePage(1);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Account</Label>
                  <select
                    className="border rounded px-2 py-2 bg-background"
                    value={adminSelectedUserId}
                    onChange={(e) => {
                      setAdminSelectedUserId(e.target.value);
                      setTimelinePage(1);
                    }}
                  >
                    <option value="">All</option>
                    {adminUsers.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.name || u.email || u.id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {[...adminActivities]
                  .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .slice(0, timelinePage * TIMELINE_PAGE_SIZE)
                  .filter((a: any) => {
                    if (!adminFilter) return true;
                    const f = adminFilter.toLowerCase();
                    const val = (a.details?.learnerEmail || a.details?.email || a.userId || '').toLowerCase();
                    return val.includes(f);
                  })
                  .filter((a: any) => {
                    if (!adminStartDate && !adminEndDate && !adminSelectedUserId) return true;
                    const ts = new Date(a.timestamp);
                    let ok = true;
                    if (adminStartDate) ok = ok && (ts >= new Date(adminStartDate + 'T00:00:00'));
                    if (adminEndDate) ok = ok && (ts <= new Date(adminEndDate + 'T23:59:59'));
                    if (adminSelectedUserId) ok = ok && (a.userId === adminSelectedUserId);
                    return ok;
                  })
                  .map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 border-b pb-3">
                      <div className="text-xs text-muted-foreground min-w-[140px]">
                        {activity.date} {activity.time}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{activity.activity}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.details?.filename || activity.details?.learnerEmail || activity.details?.email || ''}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.userId}</div>
                    </div>
                  ))}
                {timelinePage * TIMELINE_PAGE_SIZE < adminActivities.length && (
                  <div className="text-center pt-2">
                    <Button variant="outline" onClick={() => setTimelinePage(timelinePage + 1)}>Load More</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Cohort Distribution</CardTitle>
              <CardDescription>Remarks by cohort (from tracking.json)</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(adminCohortDist).length === 0 ? (
                <div className="text-sm text-muted-foreground">No cohort data yet</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={Object.entries(adminCohortDist).map(([name, value]) => ({ name, value }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                        {Object.entries(adminCohortDist).map((_, idx) => (
                          <Cell key={idx} fill={["hsl(var(--chart-1))","hsl(var(--chart-2))","hsl(var(--chart-3))","hsl(var(--chart-4))","hsl(var(--chart-5))"][idx % 5]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {Object.entries(adminCohortDist).map(([cohort, count]) => (
                      <div key={cohort} className="flex justify-between border p-2 rounded">
                        <span className="text-sm">{cohort}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>Manage platform users (admin cannot be deleted)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Activity</th>
                      <th className="py-2 pr-4">Remarks</th>
                      <th className="py-2 pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u: any) => {
                      const activityCount = adminActivities.filter((a: any) => a.userId === u.id).length;
                      const remarkCount = adminActivities.filter((a: any) => a.userId === u.id && a.activity === 'Remark Added').length;
                      const disabled = u.id === 'admin';
                      return (
                        <tr key={u.id} className="border-t">
                          <td className="py-2 pr-4">{u.name || u.email || u.id}</td>
                          <td className="py-2 pr-4">{u.email}</td>
                          <td className="py-2 pr-4">{activityCount}</td>
                          <td className="py-2 pr-4">{remarkCount}</td>
                          <td className="py-2 pr-4">
                            <button
                              className={`text-red-600 disabled:opacity-50`}
                              disabled={disabled}
                              onClick={async () => {
                                if (!window.confirm(`Delete user ${u.email}? This will also clear their server activities.`)) return;
                                try {
                                  await fetch(`/api/users?id=${encodeURIComponent(u.id)}`, { method: 'DELETE' });
                                  await fetch(`/api/activity?userId=${encodeURIComponent(u.id)}`, { method: 'DELETE' });
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );

  const dashboardContent = (
    <>
      {user && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Dashboard</CardTitle>
              <CardDescription>Track your activities, uploads, and interactions with learners</CardDescription>
            </CardHeader>
            <CardContent>
              <UserDashboard userEmail={user.id} />
            </CardContent>
          </Card>

          {/* Tracking overview sourced from data/tracking.json via /api/tracking */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tracking Overview</CardTitle>
              <CardDescription>Server totals from tracking.json (uploads, remarks, learners)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-md border">
                  <div className="text-sm text-muted-foreground">Uploads</div>
                  <div className="text-2xl font-bold">{tracking?.totals?.uploads ?? '-'}</div>
                </div>
                <div className="p-4 rounded-md border">
                  <div className="text-sm text-muted-foreground">Remarks</div>
                  <div className="text-2xl font-bold">{tracking?.totals?.remarks ?? '-'}</div>
                </div>
                <div className="p-4 rounded-md border">
                  <div className="text-sm text-muted-foreground">Learners Tracked</div>
                  <div className="text-2xl font-bold">{tracking?.totals?.learnersTracked ?? '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

        </>
      )}
    </>
  );

  // Login component for unauthenticated users
  const loginContent = (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Calling Tracker</CardTitle>
          <CardDescription>
            Please log in to access the learner submission and remarks portal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-3">
            <Button asChild className="w-full">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-muted-foreground">
            Secure access to manage learner data and generate reports
          </p>
        </CardFooter>
      </Card>
    </div>
  );

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,69,19,0.1),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(139,69,19,0.03)_25%,rgba(139,69,19,0.03)_50%,transparent_50%,transparent_75%,rgba(139,69,19,0.03)_75%)] bg-[length:20px_20px] pointer-events-none"></div>
      
      <AppHeader />
      
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8 relative z-10">
        {/* Content without duplicate header */}

        {/* Render content based on current view */}
        {(() => {
          // Handle different views
          switch (currentView) {
            case 'home':
              // Admin gets admin dashboard as home
              if (isAdmin) {
                return <AdminDashboard />;
              }
              // Regular users get the normal home workflow
              return (
                <>
                  {/* Badge Celebration Message */}
                  <UserBadges userId={user.id} displayMode="header" />

                  {!state.showDashboard && (
                    <Stepper steps={STEPS} currentStep={currentStep} />
                  )}
                  {state.showDashboard ? dashboardContent : (state.isSummaryView ? summaryViewContent : mainContent)}
                </>
              );
            case 'dashboard':
              // Only for regular users (admin doesn't have dashboard in nav)
              return (
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Your Dashboard</CardTitle>
                    <CardDescription>Track your activities, uploads, and interactions with learners</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UserDashboard userEmail={user.id} />
                  </CardContent>
                </Card>
              );
            case 'calling-tracker':
              return isAdmin ? <AdminCallingTracker /> : <CallingTracker />;
            case 'rankings':
              return <UserRankings isAdmin={isAdmin} />;
            case 'profile':
              return <UserProfile />;
            default:
              // Default view
              if (isAdmin) {
                return <AdminDashboard />;
              }
              return (
                <>
                  {!state.showDashboard && (
                    <Stepper steps={STEPS} currentStep={currentStep} />
                  )}
                  {state.showDashboard ? dashboardContent : (state.isSummaryView ? summaryViewContent : mainContent)}
                </>
              );
          }
        })()}
      </main>
      

      
      {state.currentLearner && (
        <EditRemarkDialog
          isOpen={state.isRemarkDialogOpen}
          setIsOpen={state.setRemarkDialogOpen}
          learner={state.currentLearner}
          initialRemark={getRemarkForLearner(state.currentLearner)}
          onSave={handleSaveRemark}
        />
      )}

      <BadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        userId={user?.id}
      />

      <EmailReportDialog
        isOpen={state.isEmailDialogOpen}
        setIsOpen={state.setEmailDialogOpen}
        onSend={handleEmail}
        isSending={state.isSendingEmail}
      />
    </div>
  );
}
