"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, Upload, LogIn, LogOut, UserPlus } from "lucide-react";

interface Activity {
  id: string;
  userId: string;
  activity: string;
  details: any;
  timestamp: string;
  date: string;
  time: string;
}

interface ActivityViewerProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityViewer({ userId, isOpen, onClose }: ActivityViewerProps) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (isOpen && userId) {
      const userActivities = JSON.parse(localStorage.getItem('user_activity') || '[]')
        .filter((activity: Activity) => activity.userId === userId)
        .sort((a: Activity, b: Activity) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Show last 10 activities
      
      setActivities(userActivities);
    }
  }, [isOpen, userId]);

  const getActivityIcon = (activity: string) => {
    switch (activity) {
      case 'Account Created':
        return <UserPlus className="h-4 w-4" />;
      case 'User Login':
        return <LogIn className="h-4 w-4" />;
      case 'User Logout':
        return <LogOut className="h-4 w-4" />;
      case 'CSV Upload':
        return <Upload className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activity: string) => {
    switch (activity) {
      case 'Account Created':
        return 'bg-green-100 text-green-800';
      case 'User Login':
        return 'bg-blue-100 text-blue-800';
      case 'User Logout':
        return 'bg-gray-100 text-gray-800';
      case 'CSV Upload':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Activity History
              </CardTitle>
              <CardDescription>Recent activities and login history</CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-96">
          {activities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No activities found</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.activity)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.activity)}`}>
                        {activity.activity}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activity.date} at {activity.time}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.activity === 'CSV Upload' && (
                        <p>Uploaded "{activity.details.filename}" with {activity.details.rowCount} rows</p>
                      )}
                      {activity.activity === 'User Login' && (
                        <p>Logged in from {activity.details.platform}</p>
                      )}
                      {activity.activity === 'Account Created' && (
                        <p>Account created for {activity.details.email}</p>
                      )}
                      {activity.activity === 'User Logout' && (
                        <p>Logged out at {activity.details.logoutTime}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
