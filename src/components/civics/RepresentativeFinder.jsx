import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2, Building2, Users, Landmark, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import OfficialPhoto from '@/components/civics/OfficialPhoto';

export default function RepresentativeFinder({ userEmail, onDataLoaded }) {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [profileId, setProfileId] = useState(null);
  const [saved, setSaved] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    if (!userEmail) return;
    const loadProfile = async () => {
      try {
        const normalizedEmail = userEmail.toLowerCase().trim();
        const profiles = await base44.entities.PublicProfile.list({
          query: { user_email: normalizedEmail },
          sort: { created_date: -1 },
          limit: 1
        });
        if (profiles.length > 0) {
          const profile = profiles[0];
          setProfileId(profile.id);
          if (profile.zip_code) {
            setZipCode(profile.zip_code);
            setSaved(true);
          }
          if (profile.representative_data) {
            setResults(profile.representative_data);
            if (onDataLoaded) onDataLoaded(profile.representative_data);
          }
        }
      } catch (err) {
        console.error("Error loading profile", err);
      }
    };
    loadProfile();
  }, [userEmail]);

  const detectChanges = (oldData, newData) => {
    if (!oldData) return [];
    const changes = [];

    if (oldData.state_capital !== newData.state_capital) {
      changes.push({ field: 'State Capital', old: oldData.state_capital, new: newData.state_capital });
    }
    if (oldData.governor !== newData.governor) {
      changes.push({ field: 'Governor', old: oldData.governor, new: newData.governor });
    }

    const oldSenatorNames = (oldData.senators || []).map(s => s.name).sort().join(', ');
    const newSenatorNames = (newData.senators || []).map(s => s.name).sort().join(', ');
    if (oldSenatorNames !== newSenatorNames) {
      changes.push({ field: 'US Senators', old: oldSenatorNames, new: newSenatorNames });
    }

    if (oldData.representative?.name !== newData.representative?.name) {
      changes.push({
        field: 'US Representative',
        old: oldData.representative?.name || 'Unknown',
        new: newData.representative?.name || 'Unknown'
      });
    }

    return changes;
  };

  const notifyChanges = async (changes, state) => {
    if (changes.length === 0 || !userEmail) return;

    const changeList = changes.map(c => `• ${c.field}: ${c.old} → ${c.new}`).join('\n');

    try {
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: userEmail,
        subject: `Your ${state} representatives have changed`,
        body: `Hello!\n\nThe following elected officials for your area in ${state} have changed:\n\n${changeList}\n\nThese changes are now reflected in your civics test practice answers. Log in to review the updated information.\n\n— Citizenship Learning Hub`
      });

      // Create in-app notification
      await base44.entities.Notification.create({
        user_email: userEmail,
        type: 'alert',
        title: 'Representatives Updated',
        message: `${changes.length} change(s) detected for ${state}:\n${changeList.replace(/\n/g, ' ')}`,
        link: '/'
      });
    } catch (err) {
      console.error("Error sending notification", err);
    }
  };

  const handleSearch = async () => {
    if (!zipCode.trim() || zipCode.trim().length < 5) {
      setError('Please enter a valid 5-digit zip code.');
      return;
    }
    setError('');
    setLoading(true);
    const previousData = results;
    setResults(null);
    setSaved(false);

    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `For US zip code ${zipCode.trim()}, look up the EXACT current elected officials from these official sources ONLY:\n\n1. First determine which state and congressional district this zip code belongs to.\n2. US Senators: Look up the TWO current US Senators for that state from senate.gov/senators/\n3. US Representative: Look up the specific Representative for that congressional district from house.gov/representatives/\n4. Governor: Look up the current Governor from nga.org/governors/\n5. State capital: The official capital city of the state.\n6. Photo URLs: Include official portrait photo URLs for each person from house.gov or senate.gov.\n\nCRITICAL: Use ONLY official .gov and .org sources. The US Representative MUST match the specific congressional district for this zip code. Double check all names.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            state: { type: "string" },
            state_abbreviation: { type: "string" },
            state_capital: { type: "string" },
            governor: { type: "string" },
            governor_party: { type: "string" },
            governor_photo_url: { type: "string" },
            senators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  party: { type: "string" },
                  photo_url: { type: "string" }
                }
              },
              minItems: 2,
              maxItems: 2
            },
            representative: {
              type: "object",
              properties: {
                name: { type: "string" },
                party: { type: "string" },
                district: { type: "string" },
                photo_url: { type: "string" }
              }
            }
          },
          required: ["state", "state_capital", "governor", "senators", "representative"]
        }
      });

      // Show results IMMEDIATELY — don't wait for saving
      setResults(data);
      setLoading(false);
      if (onDataLoaded) onDataLoaded(data);

      // Save to profile and notify changes in the background
      saveToProfile(data);
      const changes = detectChanges(previousData, data);
      if (changes.length > 0) {
        notifyChanges(changes, data.state);
      }
    } catch (err) {
      setError('Could not find representatives for this zip code. Please try again.');
      console.error(err);
      setLoading(false);
    }
  };

  const saveToProfile = async (data) => {
    if (!userEmail) return;
    setSaving(true);
    try {
      const normalizedEmail = userEmail.toLowerCase().trim();
      const profiles = await base44.entities.PublicProfile.list({
        query: { user_email: normalizedEmail },
        sort: { created_date: -1 },
        limit: 1
      });

      if (profiles.length > 0) {
        const pid = profiles[0].id;
        await base44.entities.PublicProfile.update(pid, {
          zip_code: zipCode.trim(),
          representative_data: data
        });
        setProfileId(pid);
      }
      setSaved(true);
    } catch (err) {
      console.error("Error saving to profile", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 text-red-600 rounded-2xl mb-4">
          <MapPin className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">Who Represents Me?</h2>
        <p className="text-slate-500 mt-2 max-w-lg mx-auto">
          Enter your zip code to find your Senators, Representative, Governor, and State Capital — your answers will be used during civics practice.
        </p>
      </div>

      <div className="max-w-md mx-auto mb-8">
        <div className="flex gap-3">
          <Input
            placeholder="Enter your zip code..."
            value={zipCode}
            onChange={(e) => { setZipCode(e.target.value); setSaved(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-12 text-lg"
            maxLength={10}
          />
          <Button
            onClick={handleSearch}
            disabled={loading}
            className="h-12 px-6 bg-red-600 hover:bg-red-700"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </Button>
        </div>
        {loading && (
          <p className="text-blue-600 text-sm mt-3 text-center flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Searching house.gov, senate.gov, and nga.org...
          </p>
        )}
        {saving && !loading && (
          <p className="text-blue-600 text-sm mt-2 text-center flex items-center justify-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" /> Saving to your profile...
          </p>
        )}
        {saved && !loading && !saving && (
          <p className="text-green-600 text-sm mt-2 text-center flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Saved to your profile!
          </p>
        )}
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
      </div>

      {loading && !results && (
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-4">
          <div className="rounded-xl bg-slate-100 animate-pulse h-48" />
          <div className="rounded-xl bg-slate-100 animate-pulse h-48" />
        </div>
      )}

      {results && (
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">State Information</p>
                  <p className="text-lg font-bold text-slate-900">{results.state} ({results.state_abbreviation})</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pl-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">State Capital</p>
                  <p className="font-semibold text-slate-800">{results.state_capital}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pl-2">
                <OfficialPhoto photoUrl={results.governor_photo_url} name={results.governor} size="md" />
                <div>
                  <p className="text-xs text-slate-500">Governor</p>
                  <p className="font-semibold text-slate-800">{results.governor} <span className="text-xs text-slate-400">({results.governor_party})</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-white">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 text-red-700 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">US Senators</p>
                </div>
              </div>
              {results.senators.map((senator, i) => (
                <div key={i} className="flex items-center gap-4 pl-2">
                  <OfficialPhoto photoUrl={senator.photo_url} name={senator.name} size="md" />
                  <div>
                    <p className="font-semibold text-slate-800">{senator.name}</p>
                    <p className="text-xs text-slate-400">{senator.party}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-4 pl-2">
                  <OfficialPhoto photoUrl={results.representative?.photo_url} name={results.representative?.name} size="md" />
                  <div>
                    <p className="text-xs text-slate-500">US Representative</p>
                    <p className="font-semibold text-slate-800">{results.representative.name}</p>
                    <p className="text-xs text-slate-400">{results.representative.party} — District {results.representative.district}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

export function getPersonalizedAnswer(question, representativeData) {
  if (!representativeData || !question) return null;
  const q = question.toLowerCase();
  if (q.includes("senator") || q.includes("senators")) {
    return representativeData.senators.map(s => s.name).join(" and ");
  }
  if (q.includes("representative") || q.includes("house of representatives")) {
    return `${representativeData.representative.name} (District ${representativeData.representative.district})`;
  }
  if (q.includes("governor")) {
    return representativeData.governor;
  }
  if (q.includes("capital")) {
    return representativeData.state_capital;
  }
  return null;
}