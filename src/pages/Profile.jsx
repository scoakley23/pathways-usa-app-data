import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Flame, Star, GraduationCap, School, Save, Loader2, Volume2 } from 'lucide-react';
import BadgesDisplay from '@/components/gamification/BadgesDisplay';
import TutorDashboard from '@/components/tutor/TutorDashboard';
import { toast } from "sonner";
import { ensurePublicProfile } from '@/lib/profileService';
import VoiceSettings from '@/components/utils/VoiceSettings';
import DeleteMyData from '@/components/profile/DeleteMyData';
import YourTutorCard from '@/components/persona/YourTutorCard';
import PageHeader from '@/components/PageHeader';
import { RaisedCard } from '@/components/pathways/ui';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const userData = await base44.auth.me();
      setUser(userData);

      // Fetch Public Profile for display name
      const profiles = await base44.entities.PublicProfile.filter({ user_email: userData.email.toLowerCase().trim() });

      if (profiles.length > 0) {
        setPublicProfile(profiles[0]);
        setDisplayName(profiles[0].display_name || userData.full_name || "");
        
        if (profiles[0].account_type === 'tutor') {
             const rels = await base44.entities.TutorRelationship.filter({ tutor_email: userData.email });
             setStudents(rels);
        }
      } else {
        setDisplayName(userData.full_name || "");
      }
    } catch (error) {
      console.error("Error fetching profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Update Public Profile
      if (publicProfile) {
        await base44.entities.PublicProfile.update(publicProfile.id, {
          display_name: displayName
        });
      } else {
        const { profile: newProfile } = await ensurePublicProfile(user.email, {
          display_name: displayName,
          points: user.points || 0,
          badges_count: (user.badges || []).length
        });
        setPublicProfile(newProfile);
      }
      
      // Optionally update User entity full_name if needed, but display_name is primarily for public view
      await base44.auth.updateMe({ full_name: displayName });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile", error);
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-pw-navy" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-extrabold text-pw-navy">Please sign in to view your profile</h2>
      </div>
    );
  }

  const initials = displayName 
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase();

  const iconSquare = 'w-10 h-10 rounded-2xl grid place-items-center shrink-0';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-pw-navy">
      <PageHeader title="Profile" />
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Column: Profile Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <RaisedCard>
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 shrink-0">
                <AvatarFallback className="text-xl bg-pw-blue-soft text-pw-blue-ink font-extrabold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold leading-tight break-words">
                  {displayName || "User"}
                </h2>
                <p className="text-pw-muted text-sm break-all">{user.email}</p>
              </div>
            </div>

            {(!publicProfile || publicProfile.account_type !== 'tutor') && (
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-pw-soft py-3 px-1">
                <p className="text-2xl font-extrabold">{user.points || 0}</p>
                <p className="text-sm text-pw-muted font-bold">Points</p>
              </div>
              <div className="rounded-2xl bg-pw-soft py-3 px-1">
                <p className="text-2xl font-extrabold">{(user.badges || []).length}</p>
                <p className="text-sm text-pw-muted font-bold">Badges</p>
              </div>
              <div className="rounded-2xl bg-pw-soft py-3 px-1">
                <p className="text-2xl font-extrabold">{user.max_streak || 0}</p>
                <p className="text-sm text-pw-muted font-bold">Streak</p>
              </div>
            </div>
            )}
          </RaisedCard>

          <Card>
            <CardHeader className="p-5 sm:p-6">
              <CardTitle className="text-xl">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-base font-bold text-pw-navy">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                <Button type="submit" disabled={isSaving} className="w-full">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Stats & Relationships */}
        <div className="w-full md:w-2/3 space-y-6">
          
          {publicProfile && publicProfile.account_type === 'tutor' ? (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-2xl font-extrabold">Classroom Progress</h3>
                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/Tutor'}>
                        <School className="w-4 h-4" /> Manage Students
                    </Button>
                </div>
                <TutorDashboard currentUserEmail={user.email} students={students} />
            </div>
          ) : (
            <>
              {/* Detailed Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <RaisedCard padding="p-4">
                  <span className={`${iconSquare} bg-pw-blue-soft text-pw-blue-ink`}>
                    <Trophy className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-3xl font-extrabold leading-none">{user.total_correct || 0}</p>
                  <p className="mt-1 text-sm font-bold text-pw-muted">Correct Answers</p>
                </RaisedCard>
                <RaisedCard padding="p-4">
                  <span className={`${iconSquare} bg-pw-red-soft text-pw-red-ink`}>
                    <Flame className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-3xl font-extrabold leading-none">{user.current_streak || 0}</p>
                  <p className="mt-1 text-sm font-bold text-pw-muted">Current Streak</p>
                </RaisedCard>
                <RaisedCard padding="p-4">
                  <span className={`${iconSquare} bg-pw-teal-soft text-pw-teal-ink`}>
                    <Star className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-3xl font-extrabold leading-none">{user.points || 0}</p>
                  <p className="mt-1 text-sm font-bold text-pw-muted">Total Points</p>
                </RaisedCard>
                <RaisedCard padding="p-4">
                  <span className={`${iconSquare} bg-pw-green-soft text-pw-green-ink`}>
                    <GraduationCap className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-3xl font-extrabold leading-none">{(user.badges || []).length}</p>
                  <p className="mt-1 text-sm font-bold text-pw-muted">Badges Earned</p>
                </RaisedCard>
              </div>

              <div className="w-full">
                  <Card>
                    <CardHeader className="p-5 sm:p-6">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <span className={`${iconSquare} bg-pw-red-soft text-pw-red-ink`}>
                          <Trophy className="w-5 h-5" aria-hidden="true" />
                        </span>
                        Your Badge Collection
                      </CardTitle>
                      <CardDescription>Unlock badges by practicing consistently.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
                      <BadgesDisplay earnedBadges={user.badges || []} />
                    </CardContent>
                  </Card>
              </div>
            </>
          )}

          {!(publicProfile && publicProfile.account_type === 'tutor') && (
            <div className="w-full">
              <YourTutorCard />
            </div>
          )}

          <div className="w-full">
            <Card>
              <CardHeader className="p-5 sm:p-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <span className={`${iconSquare} bg-pw-blue-soft text-pw-blue-ink`}>
                    <Volume2 className="w-5 h-5" aria-hidden="true" />
                  </span>
                  Voice & Audio
                </CardTitle>
                <CardDescription>Choose how the app sounds during practice and interviews.</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
                <VoiceSettings />
              </CardContent>
            </Card>
          </div>

          {user?.email && (
            <div className="w-full">
              <DeleteMyData userEmail={user.email} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
