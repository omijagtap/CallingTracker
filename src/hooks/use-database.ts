import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

interface DatabaseHookResult {
  submitUpload: (upload: {
    filename: string;
    row_count: number;
    file_size: number;
  }) => Promise<void>;
  submitActivity: (activity: {
    activity_type: string;
    details?: any;
  }) => Promise<void>;
  submitRemark: (remark: {
    learner_email: string;
    learner_name?: string;
    learner_cohort: string;
    remark: string;
  }) => Promise<void>;
  updateRemark: (remarkId: string, remark: {
    learner_name?: string;
    remark?: string;
  }) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useDatabase(): DatabaseHookResult {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitUpload = useCallback(async (upload: {
    filename: string;
    row_count: number;
    file_size: number;
  }) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'upload',
          data: {
            upload: {
              user_id: user.id,
              ...upload
            },
            activityDetails: {
              filename: upload.filename,
              rowCount: upload.row_count,
              fileSize: upload.file_size,
              uploadTime: new Date().toLocaleString()
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit upload');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit upload');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const submitActivity = useCallback(async (activity: {
    activity_type: string;
    details?: any;
  }) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'activity',
          data: {
            user_id: user.id,
            ...activity
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit activity');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit activity');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const submitRemark = useCallback(async (remark: {
    learner_email: string;
    learner_name?: string;
    learner_cohort: string;
    remark: string;
  }) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'remark',
          data: {
            user_id: user.id,
            ...remark
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit remark');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit remark');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateRemark = useCallback(async (remarkId: string, remark: {
    learner_name?: string;
    remark?: string;
  }) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'updateRemark',
          data: {
            id: remarkId,
            remark
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update remark');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update remark');
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    submitUpload,
    submitActivity,
    submitRemark,
    updateRemark,
    loading,
    error
  };
}