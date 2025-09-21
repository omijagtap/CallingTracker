
This file contains all the source code for the application, organized by file path. You can use this to easily recreate the project on your local machine.

---
### **File: `src/ai/dev.ts`**
---
```typescript
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-email-subject.ts';
import '@/ai/flows/validate-csv-format.ts';
```

---
### **File: `src/ai/flows/generate-email-subject.ts`**
---
```typescript
'use server';

/**
 * @fileOverview Email subject line generator for reports based on cohort details and the current date.
 *
 * - generateEmailSubject - A function that generates the email subject line.
 * - GenerateEmailSubjectInput - The input type for the generateEmailSubject function.
 * - GenerateEmailSubjectOutput - The return type for the generateEmailSubject function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmailSubjectInputSchema = z.object({
  cohortDetails: z.string().describe('Details of the selected cohorts (e.g., Cohort A, Cohort B).'),
  reportType: z.string().describe('The type of report being sent (e.g., Submission Summary).'),
});
export type GenerateEmailSubjectInput = z.infer<typeof GenerateEmailSubjectInputSchema>;

const GenerateEmailSubjectOutputSchema = z.object({
  subjectLine: z.string().describe('The generated email subject line.'),
});
export type GenerateEmailSubjectOutput = z.infer<typeof GenerateEmailSubjectOutputSchema>;

export async function generateEmailSubject(input: GenerateEmailSubjectInput): Promise<GenerateEmailSubjectOutput> {
  return generateEmailSubjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEmailSubjectPrompt',
  input: {schema: GenerateEmailSubjectInputSchema},
  output: {schema: GenerateEmailSubjectOutputSchema},
  prompt: `You are an expert in writing concise and informative email subject lines.

  Generate an email subject line for a report with the following details:
  Report Type: {{{reportType}}}

The subject line should be clear, relevant, and easily understood by the recipient. It should just be the report type.
`,
});

const generateEmailSubjectFlow = ai.defineFlow(
  {
    name: 'generateEmailSubjectFlow',
    inputSchema: GenerateEmailSubjectInputSchema,
    outputSchema: GenerateEmailSubjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
```

---
### **File: `src/ai/flows/validate-csv-format.ts`**
---
```typescript
'use server';

/**
 * @fileOverview Validates the format and completeness of an uploaded CSV file.
 *
 * - validateCsvFormat - A function that validates the CSV file format.
 * - ValidateCsvFormatInput - The input type for the validateCsvFormat function.
 * - ValidateCsvFormatOutput - The return type for the validateCsvFormat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ValidateCsvFormatInputSchema = z.object({
  csvHeaders: z
    .array(z.string())
    .describe('An array of header columns from the CSV file.'),
});
export type ValidateCsvFormatInput = z.infer<
  typeof ValidateCsvFormatInputSchema
>;

const ValidateCsvFormatOutputSchema = z.object({
  isValid: z
    .boolean()
    .describe(
      'Whether the CSV file is valid and contains all required fields.'
    ),
  missingColumns: z
    .array(z.string())
    .optional()
    .describe('An array of missing column names if the validation fails.'),
  errorMessage: z
    .string()
    .optional()
    .describe('A user-friendly error message if the CSV file is not valid.'),
});
export type ValidateCsvFormatOutput = z.infer<
  typeof ValidateCsvFormatOutputSchema
>;

export async function validateCsvFormat(
  input: ValidateCsvFormatInput
): Promise<ValidateCsvFormatOutput> {
  return validateCsvFormatFlow(input);
}

const requiredColumns = ['Learner Type', 'Submission Status', 'AO Date', 'Email'];

const prompt = ai.definePrompt({
  name: 'validateCsvFormatPrompt',
  input: {schema: ValidateCsvFormatInputSchema},
  output: {schema: ValidateCsvFormatOutputSchema},
  prompt: `You are a data validation expert. Your task is to validate the headers of a CSV file.

The CSV file MUST contain the following columns: ${requiredColumns.join(', ')}.

The uploaded CSV file has the following headers:
{{#each csvHeaders}}
- {{{this}}}
{{/each}}

Compare the required columns with the actual headers provided. The match should be case-insensitive and ignore leading/trailing spaces.

- If all required columns are present, set \`isValid\` to true.
- If any required columns are missing, set \`isValid\` to false.
- In the \`missingColumns\` array, list all the required columns that were not found in the CSV headers.
- Based on the missing columns, construct a user-friendly \`errorMessage\`. For example: "The CSV file is missing the following required columns: 'Column A', 'Column B'."

Respond with a valid JSON object matching the output schema.
`,
});

const validateCsvFormatFlow = ai.defineFlow(
  {
    name: 'validateCsvFormatFlow',
    inputSchema: ValidateCsvFormatInputSchema,
    outputSchema: ValidateCsvFormatOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (output) {
        return output;
      }
    } catch (e) {
        console.error("AI validation failed, falling back to manual check.", e)
    }
    
    // Fallback validation in case the AI fails or doesn't return output
    const providedHeaders = new Set(input.csvHeaders.map(h => h.toLowerCase().trim()));
    const missing: string[] = [];
    for (const col of requiredColumns) {
      if (!providedHeaders.has(col.toLowerCase())) {
        missing.push(col);
      }
    }

    if (missing.length > 0) {
      return {
        isValid: false,
        missingColumns: missing,
        errorMessage: `The CSV file is missing the following required columns: ${missing.map(m => `'${m}'`).join(', ')}.`,
      };
    } else {
      return { isValid: true };
    }
  }
);
```

---
### **File: `src/ai/genkit.ts`**
---
```typescript
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
```

---
### **File: `src/app/globals.css`**
---
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 210 40% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 210 40% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 25 95% 53%; /* Vibrant Orange */
    --primary-foreground: 210 40% 9.8%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 330 85% 60%; /* Vibrant Pink */
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 210 40% 98%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 25 95% 53%;
    --radius: 0.5rem;
    --chart-1: 25 95% 53%;
    --chart-2: 330 85% 60%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 210 40% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 210 40% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 25 95% 53%;
    --primary-foreground: 210 40% 9.8%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --accent: 330 85% 60%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 0 86% 97%;
    --border: 217 33% 17%;
    --input: 217 33% 17%;
    --ring: 25 95% 53%;
    --chart-1: 25 95% 53%;
    --chart-2: 330 85% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---
### **File: `src/app/layout.tsx`**
---
```typescript
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppHeader } from '@/components/app/header';

export const metadata: Metadata = {
  title: 'Cohort Canvas',
  description: 'Generated by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={cn('font-body antialiased min-h-screen bg-background')}>
        <AppHeader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

---
### **File: `src/app/page.tsx`**
---
```typescript
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
                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
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
```

---
### **File: `src/components/app/edit-remark-dialog.tsx`**
---
```typescript
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LearnerData } from "@/lib/types";

interface EditRemarkDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  learner: LearnerData;
  initialRemark: string;
  onSave: (learner: LearnerData, remark: string) => void;
}

export function EditRemarkDialog({
  isOpen,
  setIsOpen,
  learner,
  initialRemark,
  onSave,
}: EditRemarkDialogProps) {
  const [remark, setRemark] = useState(initialRemark);

  useEffect(() => {
    if (isOpen) {
      setRemark(initialRemark);
    }
  }, [isOpen, initialRemark]);

  const handleSave = () => {
    onSave(learner, remark);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Remark for {learner.Email}</DialogTitle>
          <DialogDescription>
            Add or update the remark for this learner. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Cohort</Label>
            <span className="col-span-3 text-sm">{learner.Cohort}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Submission</Label>
            <span className="col-span-3 text-sm">{learner["Submission Name"]}</span>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="remark" className="text-right pt-2">
              Remark
            </Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="col-span-3"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---
### **File: `src/components/app/email-report-dialog.tsx`**
---
```typescript
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface EmailReportDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSend: (email: string) => Promise<void>;
  isSending: boolean;
}

export function EmailReportDialog({
  isOpen,
  setIsOpen,
  onSend,
  isSending,
}: EmailReportDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    onSend(email);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
        setEmail("");
        setError("");
    }
    setIsOpen(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Email Report</DialogTitle>
          <DialogDescription>
            Enter the recipient's email address to send the report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Recipient
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              placeholder="manager@example.com"
            />
          </div>
          {error && <p className="col-span-4 text-sm text-red-500 text-center">{error}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSend} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
              </>
            ) : (
              "Send Email"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---
### **File: `src/components/app/header.tsx`**
---
```typescript
"use client"
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export function AppHeader() {
    const [isClient, setIsClient] = useState(false);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const checkData = () => {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                setHasData(parsedState.uploadState === 'success' && parsedState.learnerData?.length > 0);
            } else {
                setHasData(false);
            }
        };

        checkData(); // Initial check

        const interval = setInterval(checkData, 1000); // Check every second

        // Also listen for custom event
        window.addEventListener('storageUpdated', checkData);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storageUpdated', checkData);
        };
    }, []);

    const handleSummaryClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const summaryLink = document.getElementById('summary-link-handler');
        if (summaryLink) {
            summaryLink.click();
        }
    }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-foreground">
              Calling Tracker
            </h1>
            <p className="text-xs text-muted-foreground">
              Submission & Remarks Management
            </p>
          </div>
        </div>

        <div className='flex items-center gap-4'>
            {isClient && (
                 <Button
                    id="summary-link"
                    variant="link"
                    onClick={handleSummaryClick}
                    className={cn(
                        "text-foreground transition-opacity",
                        { "opacity-50 pointer-events-none": !hasData }
                    )}
                    disabled={!hasData}
                 >
                    Summary
                 </Button>
            )}
        </div>
      </div>
    </header>
  );
}
```

---
### **File: `src/components/app/stepper.tsx`**
---
```typescript
"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="p-6 bg-card border rounded-lg shadow-sm">
        <div className="flex items-start justify-between relative">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-border -z-10"></div>
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            }}
          ></div>

          {steps.map((step, index) => {
            const isActive = step.number === currentStep;
            const isCompleted = step.number < currentStep;

            return (
              <div
                key={step.number}
                className="flex flex-col items-center text-center w-40"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 bg-card",
                    {
                      "border-primary": isActive || isCompleted,
                      "border-border": !isActive && !isCompleted,
                      "bg-primary text-primary-foreground": isCompleted,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <span
                      className={cn("font-semibold", {
                        "text-primary": isActive,
                        "text-muted-foreground": !isActive,
                      })}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
                <h3
                  className={cn("mt-3 text-sm font-semibold", {
                    "text-foreground": isActive || isCompleted,
                    "text-muted-foreground": !isActive && !isCompleted,
                  })}
                >
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

---
### **File: `src/components/icons.tsx`**
---
```typescript
import { UploadCloud, LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

export const IconUpload = (props: LucideProps) => (
  <UploadCloud {...props} />
);
```

---
### **File: `src/components/logo.tsx`**
---
```typescript
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 44" // Adjusted viewBox for the text
      className={cn("w-auto h-10", className)}
      // Set a fixed height and auto width to maintain aspect ratio
    >
      <text 
        id="logo-text"
        x="50%" 
        y="50%" 
        dominantBaseline="central" 
        textAnchor="middle" 
        fontSize="24" 
        fontWeight="bold"
        fill="#ED1C24"
      >
        upGrad
      </text>
    </svg>
  );
}
```

---
### **File: `src/components/ui/alert-dialog.tsx`**
---
```typescript
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const AlertDialog = AlertDialogPrimitive.Root

const AlertDialogTrigger = AlertDialogPrimitive.Trigger

const AlertDialogPortal = AlertDialogPrimitive.Portal

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
```

---
### **File: `src/components/ui/alert.tsx`**
---
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
```

---
### **File: `src/components/ui/button.tsx`**
---
```typescript
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

---
### **File: `src/components/ui/card.tsx`**
---
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

---
### **File: `src/components/ui/checkbox.tsx`**
---
```typescript
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
```

---
### **File: `src/components/ui/dialog.tsx`**
---
```typescript
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
```

---
### **File: `src/components/ui/input.tsx`**
---
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

---
### **File: `src/components/ui/label.tsx`**
---
```typescript
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

---
### **File: `src/components/ui/table.tsx`**
---
```typescript
import * as React from "react"

import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
```

---
### **File: `src/components/ui/textarea.tsx`**
---
```typescript
import * as React from 'react';

import {cn} from '@/lib/utils';

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({className, ...props}, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export {Textarea};
```

---
### **File: `src/components/ui/toast.tsx`**
---
```typescript
"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
```

---
### **File: `src/components/ui/toaster.tsx`**
---
```typescript
"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

---
### **File: `src/hooks/use-toast.ts`**
---
```typescript
"use client"

// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
```

---
### **File: `src/lib/actions.ts`**
---
```typescript
"use server";

import { generateEmailSubject } from "@/ai/flows/generate-email-subject";
import { ReportData } from "@/lib/types";
import { format } from 'date-fns';
import nodemailer from "nodemailer";

interface EmailPayload {
  recipientEmail: string;
  cohortDetails: string;
  reportType: string;
  reportData: ReportData[];
  hasRemarks: boolean;
}

export async function sendEmailReport(payload: EmailPayload) {
  const { recipientEmail, cohortDetails, reportType, reportData, hasRemarks } = payload;
  
  // Date format: 09-Sep-2025
  const today = format(new Date(), "dd-MMM-yyyy");
  
  const cohortWord = payload.cohortDetails.includes(',') ? "Cohorts" : "Cohort";

  const subjectResponse = await generateEmailSubject({
    cohortDetails: cohortDetails,
    reportType: reportType
  });
  
  const subject = `${subjectResponse.subjectLine} – ${cohortWord} – ${today}`;

  const htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; word-wrap: break-word; max-width: 200px;}
          th { background-color: #004080; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          tr:nth-child(odd) { background-color: #ffffff; }
        </style>
      </head>
      <body>
        <p>Hi Manager,</p>
        <p>Based on the ${cohortWord} ${cohortDetails}, below is the <b>${reportType}</b> for learners who have <b>Not Submitted</b>:</p>
        <div style='overflow-x:auto;'>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Cohort ID</th>
                <th>Learner Type</th>
                <th>Submission Name</th>
                ${hasRemarks ? '<th>Remarks</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${reportData
                .map(
                  (learner) => {
                    const learnerTypeStyle = learner["Learner Type"]?.toLowerCase() === 'international' ? 'background-color:#cfe2f3;' : (learner["Learner Type"]?.toLowerCase() === 'domestic' ? 'background-color:#d9ead3;' : '');
                    const remarkStyle = learner.remarks ? 'background-color:#f8cbad;' : '';
                    return `
                      <tr>
                        <td>${learner.Email}</td>
                        <td>${learner.Cohort}</td>
                        <td style="${learnerTypeStyle}">${learner["Learner Type"]}</td>
                        <td>${learner["Submission Name"]}</td>
                        ${hasRemarks ? `<td style="${remarkStyle}">${learner.remarks || "N/A"}</td>` : ''}
                      </tr>
                    `
                  }
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <p>Best regards,<br>UpGrad Team</p>
      </body>
    </html>
  `;
  
  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: recipientEmail,
      subject: subject,
      html: htmlBody,
    });

    return {
      success: true,
      message: `Email report sent successfully to ${recipientEmail}.`,
    };
  } catch (error) {
    console.error("Failed to send email report:", error);
    return {
      success: false,
      message: "Failed to send email. Please check server logs and credentials.",
    };
  }
}
```

---
### **File: `src/lib/types.ts`**
---
```typescript
export interface LearnerData {
  "Learner Type": string;
  "Submission Status": string;
  "Submission Name": string;
  Email: string;
  Cohort?: string;
  [key: string]: any;
}

export interface Remark {
  key: string;
  remark: string;
}

export interface ReportData extends LearnerData {
  remarks: string;
}
```

---
### **File: `src/lib/utils.ts`**
---
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
