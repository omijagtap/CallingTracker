import { v4 as uuidv4 } from 'uuid';
import { supabase, CSVUpload, Remark, LearnerDetail } from './supabase';

// CSV Upload functions
export async function trackCSVUpload(upload: Omit<CSVUpload, 'id' | 'upload_date' | 'created_at'>) {
  const newUpload = {
    id: uuidv4(),
    ...upload,
    upload_date: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('csv_uploads')
    .insert([newUpload])
    .select()
    .single();

  if (error) {
    console.error('Error tracking CSV upload:', error);
    throw error;
  }

  return data;
}

export async function getCSVUploads(userId?: string) {
  let query = supabase
    .from('csv_uploads')
    .select('*')
    .order('upload_date', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching CSV uploads:', error);
    throw error;
  }

  return data || [];
}

// Remark functions
export async function trackRemark(remark: Omit<Remark, 'id' | 'remark_date' | 'created_at'>) {
  const newRemark = {
    id: uuidv4(),
    ...remark,
    remark_date: new Date().toISOString()
  };

  // Insert the remark
  const { data: remarkData, error: remarkError } = await supabase
    .from('remarks')
    .insert([newRemark])
    .select()
    .single();

  if (remarkError) {
    console.error('Error tracking remark:', remarkError);
    throw remarkError;
  }

  // Update or create learner details
  await updateLearnerDetails(
    remark.learner_email,
    remark.learner_cohort,
    {
      last_remark: {
        remark: remark.remark,
        date: newRemark.remark_date,
        by: remark.user_name
      }
    },
    remark.user_name
  );

  return remarkData;
}

export async function getRemarks(userId?: string) {
  let query = supabase
    .from('remarks')
    .select('*')
    .order('remark_date', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching remarks:', error);
    throw error;
  }

  return data || [];
}

export async function deleteRemark(remarkId: string) {
  const { error } = await supabase
    .from('remarks')
    .delete()
    .eq('id', remarkId);

  if (error) {
    console.error('Error deleting remark:', error);
    throw error;
  }

  return { success: true };
}

// Learner Details functions
export async function updateLearnerDetails(
  email: string,
  cohort: string,
  update: Partial<LearnerDetail>,
  actionBy: string
) {
  const now = new Date().toISOString();
  const historyEntry = {
    date: now,
    action: 'Details Updated',
    details: `Updated: ${Object.keys(update).join(', ')}`,
    by: actionBy
  };

  // Check if learner exists
  const { data: existing } = await supabase
    .from('learner_details')
    .select('*')
    .eq('email', email)
    .eq('cohort', cohort)
    .single();

  if (existing) {
    // Update existing learner
    const updatedHistory = [historyEntry, ...(existing.history || [])];
    
    const { data, error } = await supabase
      .from('learner_details')
      .update({
        ...update,
        history: updatedHistory,
        updated_at: now
      })
      .eq('email', email)
      .eq('cohort', cohort)
      .select()
      .single();

    if (error) {
      console.error('Error updating learner details:', error);
      throw error;
    }

    return data;
  } else {
    // Create new learner entry
    const newLearner = {
      email,
      cohort,
      submission_status: 'Unknown',
      learner_type: 'Unknown',
      ...update,
      history: [historyEntry]
    };

    const { data, error } = await supabase
      .from('learner_details')
      .insert([newLearner])
      .select()
      .single();

    if (error) {
      console.error('Error creating learner details:', error);
      throw error;
    }

    return data;
  }
}

export async function getLearnerDetails(email?: string, cohort?: string) {
  let query = supabase
    .from('learner_details')
    .select('*')
    .order('updated_at', { ascending: false });

  if (email && cohort) {
    query = query.eq('email', email).eq('cohort', cohort);
    const { data, error } = await query.single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching learner details:', error);
      throw error;
    }
    
    return data;
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching learner details:', error);
    throw error;
  }

  return data || [];
}

// Dashboard stats
export async function getDashboardStats() {
  const [uploadsRes, remarksRes, learnersRes] = await Promise.all([
    supabase.from('csv_uploads').select('*', { count: 'exact', head: true }),
    supabase.from('remarks').select('*', { count: 'exact', head: true }),
    supabase.from('learner_details').select('*', { count: 'exact', head: true })
  ]);

  // Get recent uploads and remarks
  const [recentUploadsRes, recentRemarksRes] = await Promise.all([
    supabase.from('csv_uploads').select('*').order('upload_date', { ascending: false }).limit(5),
    supabase.from('remarks').select('*').order('remark_date', { ascending: false }).limit(5)
  ]);

  // Get remarks by date
  const { data: allRemarks } = await supabase
    .from('remarks')
    .select('remark_date')
    .order('remark_date', { ascending: false });

  const remarksByDate = (allRemarks || []).reduce((acc, remark) => {
    const date = remark.remark_date.split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalUploads: uploadsRes.count || 0,
    totalRemarks: remarksRes.count || 0,
    totalLearners: learnersRes.count || 0,
    recentUploads: recentUploadsRes.data || [],
    recentRemarks: recentRemarksRes.data || [],
    remarksByDate
  };
}

// Get tracking data for API route
export async function getTrackingData(userId?: string, isAdmin: boolean = false) {
  const uploads = await getCSVUploads(userId);
  const remarks = await getRemarks(userId);
  const learners = await getLearnerDetails();
  const learnersArr = Array.isArray(learners) ? learners : (learners ? [learners] : []);

  const remarksByCohort = remarks.reduce((acc: Record<string, number>, r: any) => {
    const key = (r.learner_cohort || 'Unknown').toString();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let adminData = {};
  if (isAdmin) {
    // Get all data for admin view
    const allUploads = await getCSVUploads();
    const allRemarks = await getRemarks();
    const allLearners = await getLearnerDetails();
    const allLearnersArr = Array.isArray(allLearners) ? allLearners : (allLearners ? [allLearners] : []);

    // Calculate cohort distribution from all data
    const allCohortData = allRemarks.reduce((acc: Record<string, number>, r: any) => {
      const key = (r.learner_cohort || 'Unknown').toString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Activity timeline data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUploads = allUploads.filter(u => 
      new Date(u.upload_date) >= thirtyDaysAgo
    );
    const recentRemarks = allRemarks.filter(r => 
      new Date(r.remark_date) >= thirtyDaysAgo
    );

    adminData = {
      globalStats: {
        totalUploads: allUploads.length,
        totalRemarks: allRemarks.length,
        totalLearners: allLearnersArr.length,
        activeUsers: new Set([...allUploads.map(u => u.user_id), ...allRemarks.map(r => r.user_id)]).size
      },
      cohortDistribution: allCohortData,
      recentActivity: {
        uploads: recentUploads.slice(0, 20),
        remarks: recentRemarks.slice(0, 20)
      },
      timeline: {
        uploads: allUploads.slice(0, 50),
        remarks: allRemarks.slice(0, 50)
      }
    };
  }

  return {
    userId: userId || null,
    totals: {
      uploads: uploads.length,
      remarks: remarks.length,
      learnersTracked: learnersArr.length,
    },
    recent: {
      uploads: uploads.slice(0, 5),
      remarks: remarks.slice(0, 5),
    },
    remarksByCohort,
    ...adminData
  };
}
