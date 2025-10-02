import { v4 as uuidv4 } from 'uuid';
import { db, statements } from './db';

export interface UserModel {
  id: string;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface UploadModel {
  id: string;
  user_id: string;
  filename: string;
  row_count: number;
  file_size: number;
  upload_time?: string;
}

export interface ActivityModel {
  id: string;
  user_id: string;
  activity_type: string;
  details?: any;
  created_at?: string;
}

export interface RemarkModel {
  id: string;
  user_id: string;
  learner_email: string;
  learner_name?: string;
  learner_cohort: string;
  remark: string;
  created_at?: string;
  updated_at?: string;
}

export function createUser(user: Omit<UserModel, 'id'>) {
  const id = uuidv4();
  statements.createUser.run(id, user.name, user.email);
  return { id, ...user };
}

export function getUserById(id: string) {
  return statements.getUserById.get(id) as UserModel | undefined;
}

export function getUserByEmail(email: string) {
  return statements.getUserByEmail.get(email) as UserModel | undefined;
}

export function createUpload(upload: Omit<UploadModel, 'id'>) {
  const id = uuidv4();
  statements.createUpload.run(
    id,
    upload.user_id,
    upload.filename,
    upload.row_count,
    upload.file_size
  );
  return { id, ...upload };
}

export function getUploadsByUserId(userId: string) {
  return statements.getUploadsByUserId.all(userId) as UploadModel[];
}

export function createActivity(activity: Omit<ActivityModel, 'id'>) {
  const id = uuidv4();
  statements.createActivity.run(
    id,
    activity.user_id,
    activity.activity_type,
    JSON.stringify(activity.details)
  );
  return { id, ...activity };
}

export function getActivitiesByUserId(userId: string, limit = 50) {
  return statements.getActivitiesByUserId.all(userId, limit) as ActivityModel[];
}

export function createRemark(remark: Omit<RemarkModel, 'id'>) {
  const id = uuidv4();
  statements.createRemark.run(
    id,
    remark.user_id,
    remark.learner_email,
    remark.learner_name || null,
    remark.learner_cohort,
    remark.remark
  );
  return { id, ...remark };
}

export function updateRemark(id: string, remark: Partial<RemarkModel>) {
  if (remark.remark !== undefined) {
    statements.updateRemark.run(remark.remark, id);
  }
}

export function getRemarksByUserId(userId: string) {
  return statements.getRemarksByUserId.all(userId) as RemarkModel[];
}

export function getRemarkByKey(userId: string, learnerEmail: string, learnerCohort: string) {
  return statements.getRemarkByKey.get(userId, learnerEmail, learnerCohort) as RemarkModel | undefined;
}

export function getDashboardStats(userId: string) {
  const uploadCount = db.prepare('SELECT COUNT(*) as count FROM uploads WHERE user_id = ?').get(userId) as { count: number } | null;
  const remarkCount = db.prepare('SELECT COUNT(*) as count FROM remarks WHERE user_id = ?').get(userId) as { count: number } | null;
  const recentActivities = db.prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT 10').all(userId);

  return {
    uploads: uploadCount?.count || 0,
    remarks: remarkCount?.count || 0,
    recentActivities: recentActivities as ActivityModel[]
  };
}

// Function that creates an upload and activity together in a transaction
export function createUploadWithActivity(
  upload: Omit<UploadModel, 'id'>,
  activityDetails: any
) {
  const uploadId = uuidv4();
  const activityId = uuidv4();

  const transaction = db.transaction(() => {
    statements.createUpload.run(
      uploadId,
      upload.user_id,
      upload.filename,
      upload.row_count,
      upload.file_size
    );

    statements.createActivity.run(
      activityId,
      upload.user_id,
      'CSV_UPLOAD',
      JSON.stringify(activityDetails)
    );

    return {
      upload: { id: uploadId, ...upload },
      activity: {
        id: activityId,
        user_id: upload.user_id,
        activity_type: 'CSV_UPLOAD',
        details: activityDetails
      }
    };
  });

  return transaction();
}