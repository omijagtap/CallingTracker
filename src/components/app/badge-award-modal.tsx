'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context-supabase';
import { Award, Star, Trophy, Users, Lightbulb, Heart, TrendingUp, MessageCircle } from 'lucide-react';

interface BadgeTemplate {
  badge_type: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  badge_color: string;
}

interface UserStats {
  remarks: number;
  uploads: number;
  totalActivities: number;
}

interface BadgeAwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUser: any;
  userStats?: UserStats;
}

export function BadgeAwardModal({ isOpen, onClose, selectedUser, userStats }: BadgeAwardModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [badgeTemplates, setBadgeTemplates] = useState<BadgeTemplate[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<BadgeTemplate | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBadgeTemplates();
    }
  }, [isOpen]);

  const loadBadgeTemplates = async () => {
    try {
      const response = await fetch('/api/badges');
      if (response.ok) {
        const data = await response.json();
        setBadgeTemplates(data.badgeTemplates || []);
        
        // Auto-suggest badge based on user performance
        if (userStats && data.badgeTemplates.length > 0) {
          suggestBadge(data.badgeTemplates);
        }
      }
    } catch (error) {
      console.error('Error loading badge templates:', error);
    }
  };

  const suggestBadge = (templates: BadgeTemplate[]) => {
    if (!userStats) return;

    let suggestedBadge = null;
    let reason = '';

    if (userStats.remarks >= 20) {
      suggestedBadge = templates.find(t => t.badge_type === 'excellence');
      reason = `Outstanding performance with ${userStats.remarks} meaningful remarks added`;
    } else if (userStats.remarks >= 10) {
      suggestedBadge = templates.find(t => t.badge_type === 'top_performer');
      reason = `Consistent performance with ${userStats.remarks} remarks and ${userStats.uploads} uploads`;
    } else if (userStats.remarks >= 5) {
      suggestedBadge = templates.find(t => t.badge_type === 'rising_star');
      reason = `Great potential shown with ${userStats.remarks} remarks`;
    } else if (userStats.uploads >= 3) {
      suggestedBadge = templates.find(t => t.badge_type === 'dedication');
      reason = `Dedicated work with ${userStats.uploads} CSV uploads`;
    } else {
      suggestedBadge = templates.find(t => t.badge_type === 'team_player');
      reason = `Active participation in the platform`;
    }

    if (suggestedBadge) {
      setSelectedBadge(suggestedBadge);
      setCustomReason(reason);
    }
  };

  const awardBadge = async () => {
    if (!selectedBadge || !selectedUser || !user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          badgeType: selectedBadge.badge_type,
          badgeName: selectedBadge.badge_name,
          badgeDescription: selectedBadge.badge_description,
          badgeIcon: selectedBadge.badge_icon,
          badgeColor: selectedBadge.badge_color,
          awardedBy: user.id,
          performanceReason: customReason
        }),
      });

      if (response.ok) {
        toast({
          title: "Badge Awarded! 🎉",
          description: `${selectedBadge.badge_name} awarded to ${selectedUser.name}`,
        });
        onClose();
        setSelectedBadge(null);
        setCustomReason('');
      } else {
        throw new Error('Failed to award badge');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to award badge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (iconText: string) => {
    const iconMap: { [key: string]: any } = {
      '🌟': Star,
      '🏆': Trophy,
      '👨‍🏫': Users,
      '💡': Lightbulb,
      '🤝': Users,
      '💪': Heart,
      '⭐': Star,
      '📢': MessageCircle,
    };
    
    const IconComponent = iconMap[iconText] || Award;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Award className="w-4 h-4 text-yellow-500" />
            Award Badge to {selectedUser?.name}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Recognize outstanding performance
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Performance Summary */}
          {userStats && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                Performance Summary
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{userStats.remarks}</div>
                  <div className="text-gray-600">Remarks</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{userStats.uploads}</div>
                  <div className="text-gray-600">Uploads</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{userStats.totalActivities}</div>
                  <div className="text-gray-600">Activities</div>
                </div>
              </div>
            </div>
          )}

          {/* Badge Selection */}
          <div>
            <Label className="text-sm font-medium">Select Badge</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {badgeTemplates.map((template) => (
                <div
                  key={template.badge_type}
                  className={`p-2 border rounded cursor-pointer transition-all ${
                    selectedBadge?.badge_type === template.badge_type
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedBadge(template)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{template.badge_icon}</span>
                    <span className="font-medium text-xs">{template.badge_name}</span>
                  </div>
                  <p className="text-[10px] text-gray-600">{template.badge_description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Reason */}
          <div>
            <Label htmlFor="reason" className="text-sm">Reason for Award</Label>
            <Textarea
              id="reason"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Why is this user receiving this badge?"
              rows={2}
              className="mt-1 text-sm"
            />
          </div>

          {/* Preview */}
          {selectedBadge && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded border border-yellow-200">
              <h4 className="font-medium mb-2 text-sm">Badge Preview</h4>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                  style={{ backgroundColor: selectedBadge.badge_color }}
                >
                  {selectedBadge.badge_icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{selectedBadge.badge_name}</div>
                  <div className="text-xs text-gray-600">{selectedBadge.badge_description}</div>
                  {customReason && (
                    <div className="text-[10px] text-gray-500 mt-1">"{customReason}"</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
            <Button 
              onClick={awardBadge} 
              disabled={!selectedBadge || loading}
              size="sm"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              {loading ? 'Awarding...' : 'Award Badge 🏆'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
