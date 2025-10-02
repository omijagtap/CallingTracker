import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { z } from "zod";
import { LearnerData, Remark } from "@/lib/types";

// Moved out of component for cleaner organization
export type UploadState = "idle" | "validating" | "error" | "success";

const INITIAL_STATE = {
  uploadState: "idle" as UploadState,
  errorMessage: null as string | null,
  fileName: "",
  csvContent: "",
  learnerData: [] as LearnerData[],
  uniqueCohorts: [] as string[],
  selectedCohorts: [] as string[],
  remarks: [] as Remark[],
  colIndices: {
    COHORT: 1,
    EMAIL: 8,
    SUBMISSION_STATUS: 38,
    LEARNER_TYPE: 39,
    SUBMISSION_NAME: 40,
  },
  isSummaryView: false,
  isReportGenerated: false,
  showDashboard: false,
};

export function useHomeState() {
  // All state hooks grouped together
  const [uploadState, setUploadState] = useState(INITIAL_STATE.uploadState);
  const [errorMessage, setErrorMessage] = useState(INITIAL_STATE.errorMessage);
  const [fileName, setFileName] = useState(INITIAL_STATE.fileName);
  const [csvContent, setCsvContent] = useState(INITIAL_STATE.csvContent);
  const [learnerData, setLearnerData] = useState(INITIAL_STATE.learnerData);
  const [uniqueCohorts, setUniqueCohorts] = useState(INITIAL_STATE.uniqueCohorts);
  const [selectedCohorts, setSelectedCohorts] = useState(INITIAL_STATE.selectedCohorts);
  const [remarks, setRemarks] = useState(INITIAL_STATE.remarks);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isRemarkDialogOpen, setRemarkDialogOpen] = useState(false);
  const [isEmailDialogOpen, setEmailDialogOpen] = useState(false);
  const [currentLearner, setCurrentLearner] = useState<LearnerData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSummaryView, setSummaryView] = useState(INITIAL_STATE.isSummaryView);
  const [isReportGenerated, setReportGenerated] = useState(INITIAL_STATE.isReportGenerated);
  const [colIndices, setColIndices] = useState(INITIAL_STATE.colIndices);
  const [showDashboard, setShowDashboard] = useState(INITIAL_STATE.showDashboard);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return {
    uploadState, setUploadState,
    errorMessage, setErrorMessage,
    fileName, setFileName,
    csvContent, setCsvContent,
    learnerData, setLearnerData,
    uniqueCohorts, setUniqueCohorts,
    selectedCohorts, setSelectedCohorts,
    remarks, setRemarks,
    isSendingEmail, setIsSendingEmail,
    isRemarkDialogOpen, setRemarkDialogOpen,
    isEmailDialogOpen, setEmailDialogOpen,
    currentLearner, setCurrentLearner,
    isDragging, setIsDragging,
    isSummaryView, setSummaryView,
    isReportGenerated, setReportGenerated,
    colIndices, setColIndices,
    showDashboard, setShowDashboard,
    isAuthenticated, setIsAuthenticated,
  };
}