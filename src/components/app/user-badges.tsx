'use client';

import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Award, Calendar, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context-supabase';

interface UserBadge {
  id: string;
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_color: string;
  awarded_by: string;
  awarded_date: string;
  performance_reason: string;
}

interface UserBadgesProps {
  userId?: string;
  displayMode?: 'header' | 'full' | 'compact' | 'icon';
  maxDisplay?: number;
  onClick?: () => void;
}

export function UserBadges({ userId, displayMode = 'compact', maxDisplay = 3, onClick }: UserBadgesProps) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      loadUserBadges();
    }
  }, [targetUserId]);

  const loadUserBadges = async () => {
    try {
      const response = await fetch(`/api/badges?userId=${targetUserId}`);
      if (response.ok) {
        const data = await response.json();
        setBadges(data.badges || []);
      }
    } catch (error) {
      console.error('Error loading user badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 rounded-full w-8 h-8"></div>
        <div className="animate-pulse bg-gray-200 rounded w-20 h-4"></div>
      </div>
    );
  }

  if (badges.length === 0) {
    return displayMode === 'full' ? (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No badges earned yet</p>
            <p className="text-sm">Keep up the great work to earn your first badge!</p>
          </div>
        </CardContent>
      </Card>
    ) : null;
  }

  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;

  if (displayMode === 'icon') {
    if (badges.length === 0) return null;

    return (
      <button
        onClick={onClick}
        className="relative p-1 rounded-full hover:bg-gray-100 transition-colors"
        title={`You have ${badges.length} badge${badges.length !== 1 ? 's' : ''}`}
      >
        <Award className="w-5 h-5 text-yellow-600" />
        {badges.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
            {badges.length}
          </span>
        )}
      </button>
    );
  }

  if (displayMode === 'header') {
    return (
      <button
        onClick={onClick}
        className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-orange-50 px-2 py-1 rounded-md border border-yellow-200 hover:from-yellow-100 hover:to-orange-100 transition-colors cursor-pointer"
      >
        <Award className="w-3 h-3 text-yellow-600" />
        <span className="text-xs font-medium text-yellow-800">
          🎉 Admin awarded you {badges.length} badge{badges.length !== 1 ? 's' : ''} of honor!
        </span>
        <div className="flex gap-1">
          {displayBadges.map((badge) => {
            // Special handling for light-colored icons
            const isLightIcon = badge.badge_icon === '⭐' || badge.badge_icon === '💡';
            return (
              <div
                key={badge.id}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isLightIcon ? 'bg-gray-800 text-white' : ''
                }`}
                style={!isLightIcon ? { backgroundColor: badge.badge_color } : {}}
                title={`${badge.badge_name}: ${badge.badge_description}`}
              >
                {badge.badge_icon}
              </div>
            );
          })}
        </div>
      </button>
    );
  }

  if (displayMode === 'compact') {
    return (
      <div className="flex items-center gap-2">
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: badge.badge_color }}
            title={`${badge.badge_name}: ${badge.performance_reason}`}
          >
            <span>{badge.badge_icon}</span>
            <span>{badge.badge_name}</span>
          </div>
        ))}
        {badges.length > maxDisplay && (
          <Badge variant="outline" className="text-xs">
            +{badges.length - maxDisplay} more
          </Badge>
        )}
      </div>
    );
  }

  // Full display mode
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Your Badges ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-gradient-to-r from-yellow-50 to-orange-50"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0"
                  style={{ backgroundColor: badge.badge_color }}
                >
                  {badge.badge_icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{badge.badge_name}</div>
                  <div className="text-sm text-gray-600 mb-1">{badge.badge_description}</div>
                  {badge.performance_reason && (
                    <div className="text-xs text-gray-500 italic">"{badge.performance_reason}"</div>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(badge.awarded_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Awarded by Admin
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
