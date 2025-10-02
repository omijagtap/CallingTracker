import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TRACKING_FILE = path.join(process.cwd(), 'data', 'tracking.json');

interface CSVUpload {
  id: string;
  userId: string;
  userName: string;
  filename: string;
  uploadDate: string;
  cohorts: string[];
  totalRows: number;
  submittedCount: number;
  notSubmittedCount: number;
}

interface Remark {
  id: string;
  userId: string;
  userName: string;
  learnerEmail: string;
  learnerCohort: string;
  remark: string;
  remarkDate: string;
  csvFilename: string;
}

interface LearnerDetail {
  email: string;
  cohort: string;
  submissionStatus: string;
  learnerType: string;
  lastRemark?: {
    remark: string;
    date: string;
    by: string;
  };
  history: {
    date: string;
    action: string;
    details: string;
    by: string;
  }[];
}

interface TrackingData {
  csvUploads: CSVUpload[];
  remarks: Remark[];
  learnerDetails: LearnerDetail[];
}

// Initialize tracking file if it doesn't exist
if (!fs.existsSync(path.dirname(TRACKING_FILE))) {
  fs.mkdirSync(path.dirname(TRACKING_FILE), { recursive: true });
}
if (!fs.existsSync(TRACKING_FILE)) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify({
    csvUploads: [],
    remarks: [],
    learnerDetails: []
  }, null, 2));
}

function readTrackingData(): TrackingData {
  const data = fs.readFileSync(TRACKING_FILE, 'utf-8');
  return JSON.parse(data);
}

function writeTrackingData(data: TrackingData) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2));
}

export function trackCSVUpload(upload: Omit<CSVUpload, 'id' | 'uploadDate'>) {
  const data = readTrackingData();
  const newUpload = {
    id: uuidv4(),
    ...upload,
    uploadDate: new Date().toISOString()
  };
  data.csvUploads.unshift(newUpload);
  writeTrackingData(data);
  return newUpload;
}

export function trackRemark(remark: Omit<Remark, 'id' | 'remarkDate'>) {
  const data = readTrackingData();
  const newRemark = {
    id: uuidv4(),
    ...remark,
    remarkDate: new Date().toISOString()
  };
  const learnerIndex = data.learnerDetails.findIndex(
    (l: LearnerDetail) => l.email === remark.learnerEmail && l.cohort === remark.learnerCohort
  );
  
  // Add remark to global remarks list (newest first)
  data.remarks.unshift(newRemark as Remark);

  if (learnerIndex >= 0) {
    // Update existing learner
    data.learnerDetails[learnerIndex].lastRemark = {
      remark: remark.remark,
      date: newRemark.remarkDate,
      by: remark.userName
    };
    data.learnerDetails[learnerIndex].history.unshift({
      date: newRemark.remarkDate,
      action: 'Remark Added',
      details: remark.remark,
      by: remark.userName
    });
  } else {
    // Create new learner entry
    data.learnerDetails.push({
      email: remark.learnerEmail,
      cohort: remark.learnerCohort,
      submissionStatus: 'Not Submitted', // Default since remarks are usually for non-submissions
      learnerType: 'Unknown', // Will be updated when processing CSV
      lastRemark: {
        remark: remark.remark,
        date: newRemark.remarkDate,
        by: remark.userName
      },
      history: [{
        date: newRemark.remarkDate,
        action: 'Remark Added',
        details: remark.remark,
        by: remark.userName
      }]
    });
  }

  writeTrackingData(data);
  return newRemark;
}

export function updateLearnerDetails(
  email: string,
  cohort: string,
  update: Partial<LearnerDetail>,
  actionBy: string
) {
  const data = readTrackingData();
  const learnerIndex = data.learnerDetails.findIndex(
    l => l.email === email && l.cohort === cohort
  );

  const now = new Date().toISOString();
  const historyEntry = {
    date: now,
    action: 'Details Updated',
    details: `Updated: ${Object.keys(update).join(', ')}`,
    by: actionBy
  };

  if (learnerIndex >= 0) {
    // Update existing learner
    data.learnerDetails[learnerIndex] = {
      ...data.learnerDetails[learnerIndex],
      ...update,
      history: [historyEntry, ...data.learnerDetails[learnerIndex].history]
    };
  } else {
    // Create new learner entry
    data.learnerDetails.push({
      email,
      cohort,
      submissionStatus: 'Unknown',
      learnerType: 'Unknown',
      ...update,
      history: [historyEntry]
    });
  }

  writeTrackingData(data);
}

export function getCSVUploads(userId?: string) {
  const data = readTrackingData();
  if (userId) {
    return data.csvUploads.filter(upload => upload.userId === userId);
  }
  return data.csvUploads;
}

export function getRemarks(userId?: string) {
  const data = readTrackingData();
  if (userId) {
    return data.remarks.filter(remark => remark.userId === userId);
  }
  return data.remarks;
}

export function getLearnerDetails(email?: string, cohort?: string) {
  const data = readTrackingData();
  if (email && cohort) {
    return data.learnerDetails.find(
      l => l.email === email && l.cohort === cohort
    );
  }
  return data.learnerDetails;
}

export function getDashboardStats() {
  const data = readTrackingData();
  return {
    totalUploads: data.csvUploads.length,
    totalRemarks: data.remarks.length,
    totalLearners: data.learnerDetails.length,
    recentUploads: data.csvUploads.slice(0, 5),
    recentRemarks: data.remarks.slice(0, 5),
    remarksByDate: data.remarks.reduce((acc, remark) => {
      const date = remark.remarkDate.split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
}