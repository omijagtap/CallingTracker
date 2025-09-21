
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

type UploadState = "idle" | "validating" | "error" | "success";
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
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [csvContent, setCsvContent] = useState<string>("");
  const [learnerData, setLearnerData] = useState<LearnerData[]>([]);
  const [uniqueCohorts, setUniqueCohorts] = useState<string[]>([]);
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRemarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [currentLearner, setCurrentLearner] = useState<LearnerData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSummaryView, setSummaryView] = useState(false);
  const [isReportGenerated, setReportGenerated] = useState(false);
  const [colIndices, setColIndices] = useState(INITIAL_COL_INDICES);


  const { toast } = useToast();
  const { register, handleSubmit, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });
  
  const processCsvData = useCallback((content: string, indices: typeof INITIAL_COL_INDICES) => {
    const { data, error } = parseCsvContent(content, indices);

    if (error) {
        setUploadState("error");
        setErrorMessage(error);
        setLearnerData([]);
        setUniqueCohorts([]);
        setSelectedCohorts([]);
        setRemarks([]);
        return;
    }
    
    const cohorts = [...new Set(data.map((row) => row.Cohort || "N/A"))].filter(Boolean) as string[];
    
    setLearnerData(data);
    setUniqueCohorts(cohorts);
    setUploadState("success");
    setErrorMessage(null);
    // Reset selections when data is re-processed
    setSelectedCohorts([]);
    setRemarks([]);
  }, []);

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('appState');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        setUploadState(parsedState.uploadState || "idle");
        setFileName(parsedState.fileName || "");
        setCsvContent(parsedState.csvContent || "");
        setLearnerData(parsedState.learnerData || []);
        setUniqueCohorts(parsedState.uniqueCohorts || []);
        setSelectedCohorts(parsedState.selectedCohorts || []);
        setRemarks(parsedState.remarks || []);
        setColIndices(parsedState.colIndices || INITIAL_COL_INDICES);
        
        if (parsedState.csvContent) {
            processCsvData(parsedState.csvContent, parsedState.colIndices || INITIAL_COL_INDICES);
        }
      }
    } catch (error) {
      console.error("Failed to load state from localStorage", error);
    }
  }, [processCsvData]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const appState = {
      uploadState,
      fileName,
      csvContent,
      learnerData,
      uniqueCohorts,
      selectedCohorts,
      remarks,
      colIndices,
    };
    try {
        if (uploadState !== 'idle') {
            localStorage.setItem('appState', JSON.stringify(appState));
        }
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [uploadState, fileName, csvContent, learnerData, uniqueCohorts, selectedCohorts, remarks, colIndices]);
  
  const processFile = async (file: File) => {
    setUploadState("validating");
    setFileName(file.name);
    setReportGenerated(false);
    
    const content = await file.text();
    setCsvContent(content);
    processCsvData(content, colIndices);
  };

  const handleColIndexChange = (key: keyof typeof colIndices, value: string) => {
    const newIndex = columnToIndex(value);
    if (newIndex >= 0) {
        const newIndices = {...colIndices, [key]: newIndex };
        setColIndices(newIndices);
        if (csvContent) {
            processCsvData(csvContent, newIndices);
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
    setIsDragging(false);
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
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  const handleCohortSelection = (cohort: string) => {
    const newSelectedCohorts = selectedCohorts.includes(cohort)
        ? selectedCohorts.filter((c) => c !== cohort)
        : [...selectedCohorts, cohort];

    setSelectedCohorts(newSelectedCohorts);
    
    // Clean up remarks for deselected cohorts
    const learnersInSelectedCohorts = new Set(
      learnerData
        .filter(learner => newSelectedCohorts.includes(learner.Cohort || 'N/A'))
        .map(learner => generateRemarkKey(learner))
    );
    setRemarks(prevRemarks => prevRemarks.filter(remark => learnersInSelectedCohorts.has(remark.key)));
  };
  
  const filteredData = useMemo(() => learnerData.filter((row) =>
    selectedCohorts.includes(row.Cohort || "N/A")
  ), [learnerData, selectedCohorts]);

  const submissionSummary: SubmissionSummary[] = useMemo(() => {
    const totalSubmitted = filteredData.filter(row => row["Submission Status"] === "Submitted").length;
    const totalNotSubmitted = filteredData.length - totalSubmitted;
    return [
        { name: 'Submitted', value: totalSubmitted },
        { name: 'Not Submitted', value: totalNotSubmitted },
    ];
  }, [filteredData]);
  
  const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"];

  const notSubmittedData = useMemo(() => filteredData.filter(
    (row) => row["Submission Status"] === "Not Submitted"
  ), [filteredData]);
  
  const learnerTypeSummary = useMemo(() => {
    return notSubmittedData.reduce((acc, learner) => {
      const type = learner["Learner Type"]?.trim();
      if (type) {
        if (!acc[type]) {
          acc[type] = 0;
        }
        acc[type]++;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [notSubmittedData]);

  const handleEditRemark = (learner: LearnerData) => {
    setCurrentLearner(learner);
    setRemarkDialogOpen(true);
  };

  const handleSaveRemark = (learner: LearnerData, remarkText: string) => {
    const key = generateRemarkKey(learner);
    setRemarks((prev) => {
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
  };

  const getRemarkForLearner = (learner: LearnerData) => {
    const key = generateRemarkKey(learner);
    return remarks.find((r) => r.key === key)?.remark || "";
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
    setReportGenerated(true);
  };

  const handleEmail = async (recipientEmail: string) => {
    setIsSendingEmail(true);
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
      setIsSendingEmail(false);
      return;
    }
    
    const hasRemarks = reportData.some(learner => learner.remarks);

    try {
      const result = await sendEmailReport({
        recipientEmail,
        cohortDetails: selectedCohorts.join(", "),
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
        setReportGenerated(true);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send the email report.",
      });
    } finally {
      setIsSendingEmail(false);
      setEmailDialogOpen(false);
    }
  };

  const handleClear = () => {
    setUploadState("idle");
    setFileName("");
    setCsvContent("");
    setLearnerData([]);
    setUniqueCohorts([]);
    setSelectedCohorts([]);
    setRemarks([]);
    setSummaryView(false);
    setReportGenerated(false);
    setColIndices(INITIAL_COL_INDICES);
    reset();

    try {
      localStorage.removeItem('appState');
    } catch (error) {
      console.error("Failed to clear state from localStorage", error);
    }
    
    toast({
      title: "Data Cleared",
      description: "You can now upload a new CSV file.",
    });
  };


  useEffect(() => {
    // This effect creates a hidden clickable element that the header can trigger
    const handler = document.createElement('a');
    handler.id = 'summary-link-handler';
    handler.style.display = 'none';
    handler.addEventListener('click', () => setSummaryView(true));
    document.body.appendChild(handler);

    return () => {
        document.body.removeChild(handler);
    };
  }, []);

  const renderUploadState = () => {
    switch (uploadState) {
      case "validating":
        return <div className="flex items-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validating...</div>;
      case "error":
        return <Alert variant="destructive"><XCircle className="h-4 w-4" /><AlertTitle>Validation Failed</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert>;
      case "success":
        return (
          <div className="flex justify-between items-center">
            <Alert className="flex-grow"><CheckCircle2 className="h-4 w-4 text-green-500" /><AlertTitle>Upload Successful</AlertTitle><AlertDescription>{fileName}</AlertDescription></Alert>
            <Button variant="outline" onClick={handleClear} className="ml-4">
              <RotateCcw className="mr-2 h-4 w-4" /> Upload New File
            </Button>
          </div>
        );
      default:
        return null;
    }
  };
  
  const showProcessingUI = uploadState === 'success' && learnerData.length > 0;

  const currentStep = useMemo(() => {
    if (uploadState !== 'success') return 1;
    if (selectedCohorts.length === 0) return 2;
    if (isSummaryView) return 3;
    if (isReportGenerated) return 5;
    // Step 4 is active when cohorts are selected, user is not in summary view, and report is not generated.
    if (selectedCohorts.length > 0 && !isSummaryView && !isReportGenerated) return 4;
    return 1; // Default
  }, [uploadState, selectedCohorts, isSummaryView, isReportGenerated]);
  
  const mainContent = (
    <>
      {!showProcessingUI && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Upload Learner Data</CardTitle>
            <CardDescription>Upload a CSV file with learner information to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <label htmlFor="csvFile" className="cursor-pointer">
                <div
                  onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
                  className={`relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-primary bg-accent/20' : 'border-border hover:border-primary/50'}`}
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
      )}

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
                        {(Object.keys(colIndices) as Array<keyof typeof colIndices>).map((key) => (
                            <div key={key} className="flex flex-col gap-2">
                                <Label htmlFor={`col-${key}`} className="text-sm font-medium capitalize text-muted-foreground">
                                    {key.replace('_', ' ').toLowerCase()}
                                </Label>
                                <Input
                                    id={`col-${key}`}
                                    defaultValue={indexToColumn(colIndices[key])}
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
                {uniqueCohorts.map((cohort) => (
                  <div key={cohort} className="flex items-center space-x-2 p-3 rounded-md border">
                    <Checkbox id={cohort} checked={selectedCohorts.includes(cohort)} onCheckedChange={() => handleCohortSelection(cohort)} />
                    <label htmlFor={cohort} className="text-sm font-medium leading-none">{cohort}</label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedCohorts.length > 0 && (
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
                      <Table>
                        <TableHeader><TableRow><TableHead>Learner Email</TableHead><TableHead>Cohort</TableHead><TableHead>Submission Name</TableHead><TableHead>Remarks</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                          {notSubmittedData.length > 0 ? (
                            notSubmittedData.map((learner) => (
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
                      <Button onClick={() => setEmailDialogOpen(true)} className="w-full" disabled={isSendingEmail}>
                          {isSendingEmail ? <Loader2 className="animate-spin" /> : <Mail />} Email Report
                      </Button>
                  </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </>
  );

  const summaryViewContent = (
     <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Submission Summary</CardTitle>
                    <CardDescription>Overview of submission statuses for all learners in selected cohorts.</CardDescription>
                </div>
                <Button variant="outline" onClick={() => setSummaryView(false)}>Back to Main</Button>
            </div>
        </CardHeader>
        <CardContent>
        {selectedCohorts.length > 0 ? (
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
  )

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Learner Submission & Remarks Portal</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-3xl mx-auto">
            A streamlined tool to process learner CSV files, review submissions, and generate professional reports.
          </p>
        </div>

        <Stepper steps={STEPS} currentStep={currentStep} />
        
        {isSummaryView ? summaryViewContent : mainContent}
      </main>
      
      {currentLearner && (
        <EditRemarkDialog
          isOpen={isRemarkDialogOpen}
          setIsOpen={setRemarkDialogOpen}
          learner={currentLearner}
          initialRemark={getRemarkForLearner(currentLearner)}
          onSave={handleSaveRemark}
        />
      )}
      
      <EmailReportDialog
        isOpen={isEmailDialogOpen}
        setIsOpen={setEmailDialogOpen}
        onSend={handleEmail}
        isSending={isSendingEmail}
      />
    </div>
  );
}
