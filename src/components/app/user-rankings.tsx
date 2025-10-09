'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { TrendingUp, Trophy, Medal, Award, Star, Crown } from 'lucide-react';
import { AnimatedCounter } from '../ui/animated-counter';
import { useAuth } from '@/lib/auth-context-supabase';

interface UserRankingsProps {
  isAdmin?: boolean;
}

export function UserRankings({ isAdmin = false }: UserRankingsProps) {
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState<{
    csvUploads: any[];
    remarks: any[];
  }>({
    csvUploads: [],
    remarks: []
  });
  const [userMap, setUserMap] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [trackingRes, usersRes] = await Promise.all([
          fetch('/api/tracking?admin=true'),
          fetch('/api/users')
        ]);

        if (trackingRes.ok) {
          const trackingJson = await trackingRes.json();
          setTrackingData({
            csvUploads: trackingJson.timeline?.uploads || [],
            remarks: trackingJson.timeline?.remarks || []
          });
        }

        if (usersRes.ok) {
          const users = await usersRes.json();
          const userMapping: {[key: string]: string} = {};
          users.forEach((user: any) => {
            userMapping[user.id] = user.name || user.email;
            userMapping[user.email] = user.name || user.email;
          });
          userMapping['admin'] = 'Admin';
          setUserMap(userMapping);
        }
      } catch (error) {
        console.error('Error loading rankings data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate user rankings by meaningful remarks (exclude DNP)
  const userRemarkCounts = trackingData.remarks.reduce((acc: Record<string, {count: number, user: any}>, remark: any) => {
    const userId = remark.userId || remark.user_id;
    const userName = userMap[userId] || remark.userName || userId || 'Unknown User';
    const remarkText = (remark.remark || '').toLowerCase().trim();
    
    // Skip DNP, Dnp, dnp remarks as they are not meaningful
    if (remarkText === 'dnp' || remarkText === 'did not pick' || remarkText === 'no response' || remarkText === '' || remarkText.length < 3) {
      return acc;
    }
    
    if (!acc[userName]) {
      acc[userName] = { count: 0, user: { id: userId, name: userName } };
    }
    acc[userName].count += 1;
    return acc;
  }, {});

  const sortedRemarkUsers = Object.entries(userRemarkCounts)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 15);

  // Calculate user rankings by uploads
  const userUploadCounts = trackingData.csvUploads.reduce((acc: Record<string, {count: number, user: any}>, upload: any) => {
    const userId = upload.userId || upload.user_id;
    const userName = userMap[userId] || upload.userName || userId || 'Unknown User';
    if (!acc[userName]) {
      acc[userName] = { count: 0, user: { id: userId, name: userName } };
    }
    acc[userName].count += 1;
    return acc;
  }, {});

  const sortedUploadUsers = Object.entries(userUploadCounts)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 15);

  // Calculate score based only on meaningful remarks (1 point per remark)
  const overallScores = Object.entries(userRemarkCounts).map(([userName, data]) => {
    const remarks = data.count;
    const score = remarks; // 1 point per meaningful remark
    return {
      userName,
      score,
      remarks,
      uploads: 0, // Not counting uploads anymore
      user: data.user
    };
  }).sort((a, b) => b.score - a.score).slice(0, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">🏆 User Rankings</h1>
        <p className="text-gray-400">Top performers based on meaningful learner engagement and calling activities</p>
        <p className="text-sm text-gray-500 mt-2">Rankings exclude DNP (Did Not Pick) and empty remarks</p>
      </div>

      {/* Overall Leaderboard */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Crown className="w-6 h-6 text-yellow-400" />
            🌟 Overall Leaderboard
          </CardTitle>
          <CardDescription>Score based on meaningful remarks only (1 point per remark)</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {overallScores.map((entry, index) => {
                const isTopThree = index < 3;
                const isTopTen = index < 10;
                const currentUserName = userMap[user?.id || ''] || user?.name || user?.email;
                const isCurrentUser = entry.userName === currentUserName;
                
                return (
                  <div 
                    key={entry.userName} 
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                      isCurrentUser && isAdmin ? 'bg-gradient-to-r from-yellow-400/30 to-orange-400/30 border-yellow-400/50 shadow-xl ring-2 ring-yellow-400/30' :
                      isCurrentUser ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-500/50 shadow-xl ring-2 ring-green-500/30' :
                      index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 shadow-lg' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30 shadow-lg' :
                      index === 2 ? 'bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-600/30 shadow-lg' :
                      isTopTen ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20' :
                      'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black shadow-lg' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-black shadow-lg' :
                        index === 2 ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' :
                        isTopTen ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white' :
                        'bg-gray-600 text-white'
                      }`}>
                        {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      <div>
                        <div className={`font-bold ${isTopThree ? 'text-white text-lg' : 'text-white'} flex items-center gap-2`}>
                          {entry.userName}
                          {isCurrentUser && (
                            <Badge className={`text-xs ${
                              isAdmin ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'
                            }`}>
                              YOU
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-blue-300">💬 {entry.remarks} meaningful remarks</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {isCurrentUser ? (isAdmin ? '👑 Your Admin Rank' : '🌟 Your Rank') :
                           index === 0 ? '👑 Champion' : 
                           index === 1 ? '⭐ Excellence Award' : 
                           index === 2 ? '🔥 Outstanding Performance' : 
                           isTopTen ? '✨ Top Performer' : 
                           '💪 Active Contributor'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${isTopThree ? 'text-2xl text-white' : 'text-xl text-white'}`}>
                        <AnimatedCounter value={entry.score} duration={2000} />
                      </div>
                      <div className="text-xs text-gray-400">remarks</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>


      {/* Achievement Badges */}
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Award className="w-5 h-5 text-purple-400" />
            🎖️ Achievement Levels
          </CardTitle>
          <CardDescription>Recognition levels based on contribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
              <Crown className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
              <div className="font-bold text-white">Champion</div>
              <div className="text-xs text-gray-300">20+ remarks</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <Star className="w-8 h-8 mx-auto mb-2 text-purple-400" />
              <div className="font-bold text-white">Expert</div>
              <div className="text-xs text-gray-300">15+ remarks</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-blue-400" />
              <div className="font-bold text-white">Rising Star</div>
              <div className="text-xs text-gray-300">10+ remarks</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-green-400" />
              <div className="font-bold text-white">Contributor</div>
              <div className="text-xs text-gray-300">5+ remarks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
