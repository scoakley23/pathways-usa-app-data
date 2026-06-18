import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Loader2, Building2, Users, User, Landmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function RepresentativeFinder() {
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!zipCode.trim() || zipCode.trim().length < 5) {
      setError('Please enter a valid 5-digit zip code.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);

    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: `Look up the elected officials and state capital for the US zip code ${zipCode.trim()}. Find:
- The two US Senators for that state
- The US Representative for that congressional district
- The Governor of that state
- The state capital city

Return the data in the specified JSON format. Use current, up-to-date information.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            state: { type: "string", description: "Full state name" },
            state_abbreviation: { type: "string", description: "Two-letter state abbreviation" },
            state_capital: { type: "string", description: "State capital city" },
            governor: { type: "string", description: "Name of the governor" },
            governor_party: { type: "string", description: "Political party of the governor" },
            senators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  party: { type: "string" }
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
                district: { type: "string" }
              }
            }
          },
          required: ["state", "state_capital", "governor", "senators", "representative"]
        }
      });
      setResults(data);
    } catch (err) {
      setError('Could not find representatives for this zip code. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
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
          Enter your zip code to find your Senators, Representative, Governor, and State Capital — key facts for the civics test.
        </p>
      </div>

      <div className="max-w-md mx-auto mb-8">
        <div className="flex gap-3">
          <Input
            placeholder="Enter your zip code..."
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
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
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
      </div>

      {results && (
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* State Info Card */}
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
              <div className="flex items-center gap-3 pl-2">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Governor</p>
                  <p className="font-semibold text-slate-800">{results.governor} <span className="text-xs text-slate-400">({results.governor_party})</span></p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Senators & Representative Card */}
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
                <div key={i} className="flex items-center gap-3 pl-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">{senator.name}</p>
                    <p className="text-xs text-slate-400">{senator.party}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-3 pl-2">
                  <User className="w-4 h-4 text-slate-400" />
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