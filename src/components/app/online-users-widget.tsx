'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Users, Wifi, WifiOff, Clock } from 'lucide-react';

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  is_online: boolean;
  last_seen: string;
}

export function OnlineUsersWidget() {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('/api/users/online?admin=true');
        if (response.ok) {
          const data = await response.json();
          console.log('🟢 Online Users Widget received data:', data.onlineUsers);
          setOnlineUsers(data.onlineUsers || []);
        }
      } catch (error) {
        console.error('Error fetching online users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOnlineUsers();
    // Refresh every 15 seconds for more responsive updates
    const interval = setInterval(fetchOnlineUsers, 15000);

    return () => clearInterval(interval);
  }, []);

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getUserDisplayName = (user: OnlineUser) => {
    if (user.id === 'admin') return 'Admin (You)';
    return user.name || user.email.split('@')[0];
  };

  const getUserInitials = (user: OnlineUser) => {
    if (user.id === 'admin') return 'A';
    const name = user.name || user.email;
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5 text-green-500" />
          Online Users ({onlineUsers.length})
        </CardTitle>
        <CardDescription>
          Users currently active on the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : onlineUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <WifiOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No users currently online</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                        user.id === 'admin' 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}>
                        {getUserInitials(user)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {getUserDisplayName(user)}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      <Wifi className="w-3 h-3 mr-1" />
                      Online
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatLastSeen(user.last_seen)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
