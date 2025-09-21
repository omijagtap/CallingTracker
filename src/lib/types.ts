
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
