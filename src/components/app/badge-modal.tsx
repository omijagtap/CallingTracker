'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Award, Calendar, User, Filter, Trophy } from 'lucide-react';
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

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  showMonthlyView?: boolean;
}

export function BadgeModal({ isOpen, onClose, userId, showMonthlyView = false }: BadgeModalProps) {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [filteredBadges, setFilteredBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const targetUserId = userId || user?.id;

  // Generate month and year options
  const currentDate = new Date();
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  
  const years = Array.from({ length: 3 }, (_, i) => {
    const year = currentDate.getFullYear() - i;
    return { value: year.toString(), label: year.toString() };
  });

  // Set default to current month/year
  useEffect(() => {
    if (showMonthlyView && !selectedMonth && !selectedYear) {
      setSelectedMonth(String(currentDate.getMonth() + 1).padStart(2, '0'));
      setSelectedYear(currentDate.getFullYear().toString());
    }
  }, [showMonthlyView, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isOpen && targetUserId) {
      loadUserBadges();
    }
  }, [isOpen, targetUserId]);

  // Filter badges when month/year changes
  useEffect(() => {
    if (showMonthlyView && selectedMonth && selectedYear) {
      const filtered = badges.filter(badge => {
        const badgeDate = new Date(badge.awarded_date);
        const badgeMonth = String(badgeDate.getMonth() + 1).padStart(2, '0');
        const badgeYear = badgeDate.getFullYear().toString();
        return badgeMonth === selectedMonth && badgeYear === selectedYear;
      });
      setFilteredBadges(filtered);
    } else {
      setFilteredBadges(badges);
    }
  }, [badges, selectedMonth, selectedYear, showMonthlyView]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {showMonthlyView ? (
              <Trophy className="w-5 h-5 text-yellow-500" />
            ) : (
              <Award className="w-5 h-5 text-yellow-500" />
            )}
            {showMonthlyView ? 'Monthly Achievements' : 'Your Badges of Honor'} ({filteredBadges.length})
          </DialogTitle>
          <DialogDescription className="text-sm">
            {showMonthlyView 
              ? 'Badges earned in the selected month'
              : 'Recognition for your outstanding performance and contributions'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Month/Year Filter for Monthly View */}
        {showMonthlyView && (
          <div className="flex gap-3 items-center mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredBadges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {showMonthlyView ? 'No badges this month' : 'No badges yet'}
              </h3>
              <p className="text-sm">
                {showMonthlyView 
                  ? 'No badges were earned in the selected month. Try a different month or keep working hard!'
                  : 'Keep up the great work to earn your first badge!'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {filteredBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-start gap-3 p-4 rounded-lg border bg-gradient-to-r from-yellow-50 to-orange-50 hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: badge.badge_color }}
                    >
                      {badge.badge_icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-base">{badge.badge_name}</div>
                      <div className="text-sm text-gray-600 mb-2">{badge.badge_description}</div>
                      {badge.performance_reason && (
                        <div className="text-sm text-gray-700 italic bg-white/50 p-2 rounded border-l-4 border-yellow-400 mb-2">
                          "{badge.performance_reason}"
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(badge.awarded_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Awarded by Admin</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
