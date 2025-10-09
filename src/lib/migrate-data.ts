import { supabase } from './supabase';
import * as fs from 'fs';
import * as path from 'path';

// Migration utility to move JSON data to Supabase
export async function migrateJsonToSupabase() {
  console.log('🚀 Starting JSON to Supabase migration...');

  try {
    // Paths to JSON files
    const dataDir = path.join(process.cwd(), 'data');
    const usersFile = path.join(dataDir, 'users.json');
    const activitiesFile = path.join(dataDir, 'activities.json');
    const trackingFile = path.join(dataDir, 'tracking.json');

    // Migrate users
    if (fs.existsSync(usersFile)) {
      console.log('📄 Migrating users...');
      const usersData = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
      
      if (Array.isArray(usersData) && usersData.length > 0) {
        const { data, error } = await supabase
          .from('users')
          .upsert(usersData, { onConflict: 'id' });
        
        if (error) {
          console.error('❌ Error migrating users:', error);
        } else {
          console.log(`✅ Migrated ${usersData.length} users`);
        }
      }
    }

    // Migrate activities
    if (fs.existsSync(activitiesFile)) {
      console.log('📄 Migrating activities...');
      const activitiesData = JSON.parse(fs.readFileSync(activitiesFile, 'utf8'));
      
      if (Array.isArray(activitiesData) && activitiesData.length > 0) {
        // Transform data to match new schema
        const transformedActivities = activitiesData.map((activity: any) => ({
          id: activity.id,
          user_id: activity.userId || activity.user_id,
          activity: activity.activity,
          details: activity.details || {},
          timestamp: activity.timestamp,
          date: activity.date,
          time: activity.time
        }));

        const { data, error } = await supabase
          .from('activities')
          .upsert(transformedActivities, { onConflict: 'id' });
        
        if (error) {
          console.error('❌ Error migrating activities:', error);
        } else {
          console.log(`✅ Migrated ${transformedActivities.length} activities`);
        }
      }
    }

    // Migrate tracking data
    if (fs.existsSync(trackingFile)) {
      console.log('📄 Migrating tracking data...');
      const trackingData = JSON.parse(fs.readFileSync(trackingFile, 'utf8'));
      
      // Migrate CSV uploads
      if (trackingData.csvUploads && Array.isArray(trackingData.csvUploads)) {
        const transformedUploads = trackingData.csvUploads.map((upload: any) => ({
          id: upload.id,
          user_id: upload.userId || upload.user_id,
          user_name: upload.userName || upload.user_name,
          filename: upload.filename,
          upload_date: upload.uploadDate || upload.upload_date,
          cohorts: upload.cohorts || [],
          total_rows: upload.totalRows || upload.total_rows || 0,
          submitted_count: upload.submittedCount || upload.submitted_count || 0,
          not_submitted_count: upload.notSubmittedCount || upload.not_submitted_count || 0
        }));

        const { error: uploadsError } = await supabase
          .from('csv_uploads')
          .upsert(transformedUploads, { onConflict: 'id' });
        
        if (uploadsError) {
          console.error('❌ Error migrating CSV uploads:', uploadsError);
        } else {
          console.log(`✅ Migrated ${transformedUploads.length} CSV uploads`);
        }
      }

      // Migrate remarks
      if (trackingData.remarks && Array.isArray(trackingData.remarks)) {
        const transformedRemarks = trackingData.remarks.map((remark: any) => ({
          id: remark.id,
          user_id: remark.userId || remark.user_id,
          user_name: remark.userName || remark.user_name,
          learner_email: remark.learnerEmail || remark.learner_email,
          learner_cohort: remark.learnerCohort || remark.learner_cohort,
          remark: remark.remark,
          remark_date: remark.remarkDate || remark.remark_date,
          csv_filename: remark.csvFilename || remark.csv_filename || ''
        }));

        const { error: remarksError } = await supabase
          .from('remarks')
          .upsert(transformedRemarks, { onConflict: 'id' });
        
        if (remarksError) {
          console.error('❌ Error migrating remarks:', remarksError);
        } else {
          console.log(`✅ Migrated ${transformedRemarks.length} remarks`);
        }
      }

      // Migrate learner details
      if (trackingData.learnerDetails && Array.isArray(trackingData.learnerDetails)) {
        const transformedLearners = trackingData.learnerDetails.map((learner: any) => ({
          email: learner.email,
          cohort: learner.cohort,
          submission_status: learner.submissionStatus || learner.submission_status || 'Unknown',
          learner_type: learner.learnerType || learner.learner_type || 'Unknown',
          last_remark: learner.lastRemark || learner.last_remark || null,
          history: learner.history || []
        }));

        const { error: learnersError } = await supabase
          .from('learner_details')
          .upsert(transformedLearners, { onConflict: 'email,cohort' });
        
        if (learnersError) {
          console.error('❌ Error migrating learner details:', learnersError);
        } else {
          console.log(`✅ Migrated ${transformedLearners.length} learner details`);
        }
      }
    }

    console.log('🎉 Migration completed successfully!');
    return { success: true, message: 'All data migrated successfully' };

  } catch (error) {
    console.error('💥 Migration failed:', error);
    return { success: false, message: `Migration failed: ${error}` };
  }
}

// Helper function to backup existing JSON data
export function backupJsonData() {
  console.log('💾 Creating backup of JSON data...');
  
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const backupDir = path.join(process.cwd(), 'data-backup');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const files = ['users.json', 'activities.json', 'tracking.json'];
    
    files.forEach(file => {
      const sourcePath = path.join(dataDir, file);
      const backupPath = path.join(backupDir, `${Date.now()}-${file}`);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`✅ Backed up ${file}`);
      }
    });

    console.log('💾 Backup completed!');
    return { success: true, message: 'Backup created successfully' };
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return { success: false, message: `Backup failed: ${error}` };
  }
}

// Helper function to check migration status
export async function checkMigrationStatus() {
  try {
    const [usersRes, activitiesRes, uploadsRes, remarksRes, learnersRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('activities').select('*', { count: 'exact', head: true }),
      supabase.from('csv_uploads').select('*', { count: 'exact', head: true }),
      supabase.from('remarks').select('*', { count: 'exact', head: true }),
      supabase.from('learner_details').select('*', { count: 'exact', head: true })
    ]);

    return {
      users: usersRes.count || 0,
      activities: activitiesRes.count || 0,
      csvUploads: uploadsRes.count || 0,
      remarks: remarksRes.count || 0,
      learnerDetails: learnersRes.count || 0
    };
  } catch (error) {
    console.error('Error checking migration status:', error);
    return null;
  }
}
