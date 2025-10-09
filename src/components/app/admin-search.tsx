'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Search, User, Mail, MessageSquare, X, Activity, FileText, Calendar } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface SearchResult {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'learner' | 'activity';
  details?: any;
}

interface AdminSearchProps {
  onClose?: () => void;
  onUserSelect?: (user: any) => void;
}

export function AdminSearch({ onClose, onUserSelect }: AdminSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchRef.current) {
      searchRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      setLoading(true);
      try {
        // Search users
        const usersRes = await fetch('/api/users');
        const users = usersRes.ok ? await usersRes.json() : [];

        // Search tracking data
        const trackingRes = await fetch('/api/tracking?admin=true');
        const tracking = trackingRes.ok ? await trackingRes.json() : {};

        // Search activities
        const activitiesRes = await fetch('/api/activity');
        const activities = activitiesRes.ok ? await activitiesRes.json() : [];

        const searchResults: SearchResult[] = [];

        // Search in users with enhanced data
        users.forEach((user: any) => {
          if (
            user.name?.toLowerCase().includes(query.toLowerCase()) ||
            user.email?.toLowerCase().includes(query.toLowerCase()) ||
            user.id?.toLowerCase().includes(query.toLowerCase())
          ) {
            // Get user's activities, uploads, and remarks
            const userActivities = activities.filter((a: any) => a.userId === user.id);
            const userUploads = tracking.timeline?.uploads?.filter((u: any) => u.userId === user.id) || [];
            const userRemarks = tracking.timeline?.remarks?.filter((r: any) => r.userId === user.id) || [];
            
            searchResults.push({
              id: user.id,
              name: user.name || user.email,
              email: user.email,
              type: 'user',
              details: {
                ...user,
                activities: userActivities,
                uploads: userUploads,
                remarks: userRemarks,
                stats: {
                  totalActivities: userActivities.length,
                  totalUploads: userUploads.length,
                  totalRemarks: userRemarks.length,
                  lastActive: userActivities.length > 0 ? userActivities[0].timestamp : null,
                  cohortsWorked: new Set(userRemarks.map((r: any) => r.learnerCohort)).size
                }
              }
            });
          }
        });

        // Search in remarks for learners
        if (tracking.timeline?.remarks) {
          tracking.timeline.remarks.forEach((remark: any) => {
            if (
              remark.learnerEmail?.toLowerCase().includes(query.toLowerCase()) ||
              remark.learnerCohort?.toLowerCase().includes(query.toLowerCase()) ||
              remark.remark?.toLowerCase().includes(query.toLowerCase())
            ) {
              const existingLearner = searchResults.find(r => 
                r.type === 'learner' && r.email === remark.learnerEmail
              );
              
              if (!existingLearner) {
                searchResults.push({
                  id: remark.learnerEmail,
                  name: remark.learnerEmail,
                  email: remark.learnerEmail,
                  type: 'learner',
                  details: {
                    cohort: remark.learnerCohort,
                    remarks: tracking.timeline.remarks.filter((r: any) => 
                      r.learnerEmail === remark.learnerEmail
                    )
                  }
                });
              }
            }
          });
        }

        // Search in activities
        activities.forEach((activity: any) => {
          if (
            activity.activity?.toLowerCase().includes(query.toLowerCase()) ||
            activity.details?.filename?.toLowerCase().includes(query.toLowerCase()) ||
            activity.details?.learnerEmail?.toLowerCase().includes(query.toLowerCase())
          ) {
            searchResults.push({
              id: activity.id,
              name: activity.activity,
              email: activity.userId,
              type: 'activity',
              details: activity
            });
          }
        });

        setResults(searchResults.slice(0, 10)); // Limit to 10 results
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchData, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleResultClick = (result: SearchResult) => {
    setSelectedResult(result);
    
    // If it's a user and onUserSelect is provided, call it
    if (result.type === 'user' && onUserSelect) {
      onUserSelect(result.details || result);
      handleClose(); // Close the search modal
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSelectedResult(null);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search users, learners, activities..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Search Results */}
          <div className="w-1/2 border-r max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            )}
            
            {!loading && results.length === 0 && query.length >= 2 && (
              <div className="p-4 text-center text-muted-foreground">
                No results found for "{query}"
              </div>
            )}

            {!loading && results.length === 0 && query.length < 2 && (
              <div className="p-4 text-center text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}

            {results.map((result) => (
              <div
                key={`${result.type}-${result.id}`}
                className={`p-3 border-b cursor-pointer hover:bg-muted/50 ${
                  selectedResult?.id === result.id ? 'bg-muted' : ''
                }`}
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-center gap-2">
                  {result.type === 'user' && <User className="w-4 h-4" />}
                  {result.type === 'learner' && <Mail className="w-4 h-4" />}
                  {result.type === 'activity' && <MessageSquare className="w-4 h-4" />}
                  <div className="flex-1">
                    <div className="font-medium text-sm">{result.name}</div>
                    <div className="text-xs text-muted-foreground">{result.email}</div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {result.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Details Panel */}
          <div className="w-1/2 max-h-[60vh] overflow-y-auto">
            {selectedResult ? (
              <div className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  {selectedResult.type === 'user' && <User className="w-5 h-5" />}
                  {selectedResult.type === 'learner' && <Mail className="w-5 h-5" />}
                  {selectedResult.type === 'activity' && <MessageSquare className="w-5 h-5" />}
                  <div>
                    <h3 className="font-semibold">{selectedResult.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedResult.email}</p>
                  </div>
                </div>

                {selectedResult.type === 'user' && (
                  <UserDashboardView userId={selectedResult.details.id} userDetails={selectedResult.details} />
                )}

                {selectedResult.type === 'learner' && (
                  <div className="space-y-2">
                    <div><strong>Cohort:</strong> {selectedResult.details.cohort}</div>
                    <div><strong>Total Remarks:</strong> {selectedResult.details.remarks?.length || 0}</div>
                    <div className="mt-3">
                      <strong>Recent Remarks:</strong>
                      <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                        {selectedResult.details.remarks?.slice(0, 5).map((remark: any, index: number) => (
                          <div key={index} className="p-2 bg-muted rounded text-sm">
                            <div className="font-medium">{remark.userName}</div>
                            <div className="text-muted-foreground text-xs">
                              {new Date(remark.remarkDate).toLocaleDateString()}
                            </div>
                            <div className="mt-1">{remark.remark}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedResult.type === 'activity' && (
                  <div className="space-y-2">
                    <div><strong>Activity:</strong> {selectedResult.details.activity}</div>
                    <div><strong>User:</strong> {selectedResult.details.userId}</div>
                    <div><strong>Date:</strong> {new Date(selectedResult.details.timestamp).toLocaleString()}</div>
                    {selectedResult.details.details && (
                      <div className="mt-3">
                        <strong>Details:</strong>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedResult.details.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Select a search result to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Enhanced User Dashboard View Component
function UserDashboardView({ userId, userDetails }: { userId: string; userDetails: any }) {
  const [userHistory, setUserHistory] = useState<{
    activities: any[];
    uploads: any[];
    remarks: any[];
    stats: any;
  }>({ activities: [], uploads: [], remarks: [], stats: {} });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserHistory = async () => {
      try {
        // Load user activities
        const activitiesRes = await fetch('/api/activity');
        const allActivities = activitiesRes.ok ? await activitiesRes.json() : [];
        const userActivities = allActivities.filter((a: any) => a.userId === userId);

        // Load tracking data
        const trackingRes = await fetch('/api/tracking?admin=true');
        const trackingData = trackingRes.ok ? await trackingRes.json() : {};
        
        const userUploads = trackingData.timeline?.uploads?.filter((u: any) => u.userId === userId) || [];
        const userRemarks = trackingData.timeline?.remarks?.filter((r: any) => r.userId === userId) || [];

        // Load user profile
        try {
          const profileRes = await fetch(`/api/profile?userId=${userId}`);
          if (profileRes.ok) {
            const profile = await profileRes.json();
            setUserProfile(profile);
          }
        } catch (error) {
          console.log('Could not load user profile');
        }

        // Calculate stats
        const stats = {
          totalActivities: userActivities.length,
          totalUploads: userUploads.length,
          totalRemarks: userRemarks.length,
          lastActive: userActivities.length > 0 ? new Date(userActivities[0].timestamp).toLocaleDateString() : 'Never',
          cohortsWorked: new Set(userRemarks.map((r: any) => r.learnerCohort)).size
        };

        setUserHistory({
          activities: userActivities.slice(0, 20),
          uploads: userUploads,
          remarks: userRemarks.slice(0, 10),
          stats
        });
      } catch (error) {
        console.error('Error loading user history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserHistory();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* User Profile Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-lg border border-blue-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{userDetails.name || userDetails.email}</h3>
            <p className="text-blue-300">{userDetails.email}</p>
            <p className="text-xs text-gray-400">ID: {userDetails.id}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/10 p-3 rounded-lg border border-white/20">
          <div className="text-2xl font-bold text-blue-400">{userHistory.stats.totalActivities}</div>
          <div className="text-xs text-gray-400">Total Activities</div>
        </div>
        <div className="bg-white/10 p-3 rounded-lg border border-white/20">
          <div className="text-2xl font-bold text-green-400">{userHistory.stats.totalUploads}</div>
          <div className="text-xs text-gray-400">CSV Uploads</div>
        </div>
        <div className="bg-white/10 p-3 rounded-lg border border-white/20">
          <div className="text-2xl font-bold text-purple-400">{userHistory.stats.totalRemarks}</div>
          <div className="text-xs text-gray-400">Remarks Added</div>
        </div>
        <div className="bg-white/10 p-3 rounded-lg border border-white/20">
          <div className="text-2xl font-bold text-orange-400">{userHistory.stats.cohortsWorked}</div>
          <div className="text-xs text-gray-400">Cohorts Worked</div>
        </div>
      </div>

      {/* Profile Information */}
      {userProfile && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
            <User className="w-4 h-4 text-purple-400" />
            📋 Profile Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Account Type:</span>
              <span className="text-white ml-2">📋 Program Coordinator</span>
            </div>
            {userProfile.phone && (
              <div>
                <span className="text-gray-400">Phone:</span>
                <span className="text-white ml-2">{userProfile.phone}</span>
              </div>
            )}
            {userProfile.location && (
              <div>
                <span className="text-gray-400">Location:</span>
                <span className="text-white ml-2">{userProfile.location}</span>
              </div>
            )}
            {userProfile.reportingManager && (
              <div>
                <span className="text-gray-400">Manager:</span>
                <span className="text-white ml-2">{userProfile.reportingManager}</span>
              </div>
            )}
          </div>
          {userProfile.bio && (
            <div className="mt-3">
              <span className="text-gray-400 text-sm">Bio:</span>
              <p className="text-white text-sm mt-1 bg-black/20 p-2 rounded">{userProfile.bio}</p>
            </div>
          )}
        </div>
      )}

      {/* Last Active & Status */}
      <div className="bg-white/5 p-3 rounded-lg border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white">Last Active:</span>
          <span className="text-sm text-blue-300">{userHistory.stats.lastActive}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-medium text-white">Status:</span>
          <span className="text-sm text-green-400">Active User</span>
        </div>
      </div>

      {/* Recent Activities Timeline */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
          <Activity className="w-4 h-4 text-blue-400" />
          Recent Activities
        </h4>
        <ScrollArea className="h-40">
          <div className="space-y-3">
            {userHistory.activities.length > 0 ? (
              userHistory.activities.map((activity: any, index: number) => {
                const isRecent = index < 3;
                return (
                  <div key={activity.id} className={`p-3 rounded-lg border ${
                    isRecent ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        isRecent ? 'text-blue-300' : 'text-gray-400'
                      }`}>
                        {activity.activity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                    {activity.details?.filename && (
                      <div className="text-xs text-blue-400 mt-1">
                        📁 {activity.details.filename}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-gray-400 text-xs text-center py-4">No activities found</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* CSV Uploads */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
          <FileText className="w-4 h-4 text-green-400" />
          CSV Uploads
        </h4>
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {userHistory.uploads.length > 0 ? (
              userHistory.uploads.map((upload: any) => (
                <div key={upload.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{upload.filename}</span>
                    <span className="text-xs text-green-400">{upload.totalRows} rows</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(upload.uploadDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-blue-400 mt-1">
                    Cohorts: {upload.cohorts.join(', ')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-xs text-center py-4">No uploads found</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Recent Remarks & Feedback */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          Recent Remarks & Feedback
        </h4>
        <ScrollArea className="h-40">
          <div className="space-y-3">
            {userHistory.remarks.length > 0 ? (
              userHistory.remarks.map((remark: any) => (
                <div key={remark.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">{remark.learnerEmail}</span>
                    <span className="text-xs text-purple-400">{remark.learnerCohort}</span>
                  </div>
                  <div className="text-xs text-gray-300 bg-black/20 p-2 rounded mb-2">
                    💬 "{remark.remark}"
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(remark.remarkDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-xs text-center py-4">No remarks found</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Email Reports Sent */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
          <Mail className="w-4 h-4 text-orange-400" />
          Email Reports Sent
        </h4>
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">0</div>
            <div className="text-xs text-gray-400">Reports sent this month</div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            Email tracking coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
