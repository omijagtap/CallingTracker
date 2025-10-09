'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context-supabase';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Save, 
  Edit3,
  UserCheck,
  Settings,
  Shield,
  Award,
  Trophy,
  Calendar
} from 'lucide-react';
import { UserBadges } from './user-badges';
import { BadgeModal } from './badge-modal';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  bio?: string;
  location?: string;
  phone?: string;
  reportingManager?: string;
  reportingManagerEmail?: string;
  created_at?: string;
  updated_at?: string;
}

export function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    reportingManager: '',
    reportingManagerEmail: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [showMonthlyBadges, setShowMonthlyBadges] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/profile?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile({
          id: user?.id || '',
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          bio: data.bio || '',
          location: data.location || '',
          phone: data.phone || '',
          reportingManager: data.reportingManager || '',
          reportingManagerEmail: data.reportingManagerEmail || ''
        });
      } else {
        // If profile doesn't exist, create from user data
        setProfile({
          id: user?.id || '',
          name: user?.name || '',
          email: user?.email || '',
          bio: '',
          location: '',
          phone: '',
          reportingManager: '',
          reportingManagerEmail: ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to user data
      setProfile({
        id: user?.id || '',
        name: user?.name || '',
        email: user?.email || '',
        bio: '',
        location: '',
        phone: '',
        reportingManager: '',
        reportingManagerEmail: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          ...profile
        }),
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been saved successfully.",
        });
        setIsEditing(false);
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isAdmin = user?.id === 'admin';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">👤 My Profile</h1>
        <p className="text-gray-400">Manage your personal information and settings</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500/80 to-purple-500/80 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/20 shadow-lg">
                <User className="w-8 h-8 text-white drop-shadow-sm" />
              </div>
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  {profile.name || 'Unknown User'}
                  {isAdmin && <Shield className="w-5 h-5 text-yellow-400" />}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "outline" : "default"}
              className="flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Full Name</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-white/10 border-white/20 text-white"
                />
              ) : (
                <div className="p-3 bg-white/5 rounded-md border border-white/10 text-white">
                  {profile.name || 'Not provided'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <div className="p-3 bg-white/5 rounded-md border border-white/10 text-gray-400">
                {profile.email} (Cannot be changed)
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  className="bg-white/10 border-white/20 text-white"
                />
              ) : (
                <div className="p-3 bg-white/5 rounded-md border border-white/10 text-white">
                  {profile.phone || 'Not provided'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              {isEditing ? (
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your location"
                  className="bg-white/10 border-white/20 text-white"
                />
              ) : (
                <div className="p-3 bg-white/5 rounded-md border border-white/10 text-white">
                  {profile.location || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-white flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Bio / About Me
            </Label>
            {isEditing ? (
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="bg-white/10 border-white/20 text-white resize-none"
              />
            ) : (
              <div className="p-3 bg-white/5 rounded-md border border-white/10 text-white min-h-[100px]">
                {profile.bio || 'No bio provided'}
              </div>
            )}
          </div>

          {/* Reporting Manager Section */}
          <div className="border-t border-white/20 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Reporting Manager
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="reportingManager" className="text-white">Manager Name</Label>
                {isEditing ? (
                  <Input
                    id="reportingManager"
                    value={profile.reportingManager}
                    onChange={(e) => handleInputChange('reportingManager', e.target.value)}
                    placeholder="Enter manager's name"
                    className="bg-white/10 border-white/20 text-white"
                  />
                ) : (
                  <div className="p-3 bg-white/5 rounded-md border border-white/10 text-white">
                    {profile.reportingManager || 'Not provided'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportingManagerEmail" className="text-white">Manager Email</Label>
                {isEditing ? (
                  <Input
                    id="reportingManagerEmail"
                    type="email"
                    value={profile.reportingManagerEmail}
                    onChange={(e) => handleInputChange('reportingManagerEmail', e.target.value)}
                    placeholder="Enter manager's email"
                    className="bg-white/10 border-white/20 text-white"
                  />
                ) : (
                  <div className="p-3 bg-white/5 rounded-md border border-white/10 text-white">
                    {profile.reportingManagerEmail || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              📧 Reports will be sent to your manager's email when you generate calling reports
            </p>
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/30 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            🏆 Achievements & Badges
          </CardTitle>
          <CardDescription className="text-yellow-200">
            Your recognition and accomplishments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badge Display */}
          <div className="bg-white/10 rounded-lg p-4">
            <UserBadges userId={user?.id} displayMode="full" />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setShowMonthlyBadges(false);
                setShowBadgeModal(true);
              }}
              variant="outline"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/30 text-white"
            >
              <Award className="w-4 h-4" />
              View All Badges
            </Button>
            <Button
              onClick={() => {
                setShowMonthlyBadges(true);
                setShowBadgeModal(true);
              }}
              variant="outline"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border-white/30 text-white"
            >
              <Calendar className="w-4 h-4" />
              Monthly Achievements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-xl shadow-xl">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
              <span className="text-gray-300">Account Type</span>
              <Badge variant={isAdmin ? "default" : "outline"}>
                {isAdmin ? '👑 Admin' : '📋 Program Coordinator'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-md">
              <span className="text-gray-300">User ID</span>
              <span className="text-white font-mono text-sm">{profile.id}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Badge Modal */}
      <BadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        userId={user?.id}
        showMonthlyView={showMonthlyBadges}
      />
    </div>
  );
}
