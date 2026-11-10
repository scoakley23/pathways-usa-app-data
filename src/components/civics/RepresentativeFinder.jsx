import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Eyebrow, PrimaryButton, RaisedCard, SecondaryButton } from '@/components/pathways/ui';
import { MapPin, Loader2, Building2, Users, Landmark, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { getOfficialsFor, isStale, OFFICEHOLDERS_CHECKED_ON, validateLocation } from '@/lib/officeholders';
import { checkedOnText } from '@/lib/officeholderQuestions';

// "Who Represents Me?": the AI (with a web search) works out ONLY the state
// and congressional district for a ZIP code (and a street address when the ZIP
// spans several districts). It never returns names. The result is checked
// against src/data/officeholders.json with validateLocation(); only the state
// and district are saved on the learner's PublicProfile. Every name shown here
// comes from the table (getOfficialsFor()). The ZIP and address are used for
// this lookup only and never saved.
export const LOCATION_SCHEMA = {
  type: 'object',
  properties: {
    state: { type: 'string', description: 'Two-letter USPS code of the state, D.C. or territory' },
    district: { type: 'string', description: 'Congressional district number, or "At-large"' },
    district_ambiguous: { type: 'boolean' },
  },
  required: ['state', 'district', 'district_ambiguous'],
};

export function locationPrompt(zip, address = '') {
  const where = address ? `the U.S. street address "${address}, ${zip}"` : `U.S. ZIP code ${zip}`;
  return `Find the state (or D.C. / U.S. territory) and the U.S. congressional district for ${where}.
Use only official sources (census.gov, house.gov).
${address
    ? 'Use the full street address to find the exact congressional district.'
    : 'If this ZIP code is split between more than one congressional district, set district_ambiguous to true. Do not guess.'}
Return ONLY:
- state: the two-letter USPS code (for example TX, DC, PR)
- district: the district number (for example "2"), or "At-large" for a state, D.C. or territory with one seat
- district_ambiguous: true or false
Do not return any names of people. Do not repeat the ZIP code or address.`;
}

const NOT_CONFIRMED = "We couldn't confirm your district. Please try again.";

export default function RepresentativeFinder() {
  const { location, save } = useLearnerLocation();
  const [zipCode, setZipCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [needsAddress, setNeedsAddress] = useState(false);

  const handleSearch = async () => {
    const zip = zipCode.trim();
    if (!/^\d{5}(-\d{4})?$/.test(zip)) {
      setError('Please enter a valid 5-digit zip code.');
      return;
    }
    const addressStr = streetAddress.trim();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const data = await base44.integrations.Core.InvokeLLM({
        prompt: locationPrompt(zip, addressStr),
        add_context_from_internet: true,
        model: 'gemini_3_flash',
        response_json_schema: LOCATION_SCHEMA,
      });

      const checked = validateLocation({ state: data?.state, district: data?.district });
      const territory = checked.ok && getOfficialsFor({ state: checked.state })?.type === 'territory';
      // A split ZIP code needs the street address (not for D.C. or a territory: one seat).
      if (data?.district_ambiguous && !addressStr && !territory) {
        setNeedsAddress(true);
        return;
      }
      if (!checked.ok || (data?.district_ambiguous && !territory)) {
        setError(NOT_CONFIRMED);
        return;
      }

      setNeedsAddress(false);
      setStreetAddress(''); // the address is used for this lookup only, then discarded
      setSaving(true);
      try {
        await save({ state: checked.state, district: checked.district });
        setSaved(true);
      } catch (err) {
        console.error('Error saving to profile', err);
        setError("We couldn't save this. Please try again.");
      } finally {
        setSaving(false);
      }
    } catch (err) {
      console.error(err);
      setError(NOT_CONFIRMED);
    } finally {
      setLoading(false);
    }
  };

  const officials = location ? getOfficialsFor(location) : null;

  return (
    <section className="py-6 text-pw-navy">
      <RaisedCard className="max-w-3xl mx-auto">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 shrink-0 bg-sand text-ink rounded-2xl grid place-items-center">
            <MapPin className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-[28px] font-display font-normal leading-tight pt-1.5">Who Represents Me?</h2>
        </div>
        <p className="text-base text-pw-muted leading-relaxed">
          Enter your zip code to find your Senators, Representative, Governor, and State Capital — your answers will be used during civics practice.
        </p>
        <p className="text-sm text-pw-muted mt-2">Your address is used only for this lookup and is never saved.</p>

        <div className="mt-5">
          {!needsAddress ? (
            <div className="flex gap-2">
              <Input
                placeholder="Enter your zip code..."
                aria-label="Zip code"
                inputMode="numeric"
                value={zipCode}
                onChange={(e) => { setZipCode(e.target.value); setSaved(false); setNeedsAddress(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 text-base min-w-0"
                maxLength={10}
              />
              <PrimaryButton onClick={handleSearch} disabled={loading} className="h-12 shrink-0">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-label="Searching" /> : 'Search'}
              </PrimaryButton>
            </div>
          ) : (
            <div className="space-y-3 bg-pw-blue-soft rounded-2xl p-4">
              <p className="text-pw-blue-ink text-base font-semibold leading-snug">
                This zip code spans multiple congressional districts. Please enter your street address so we can find your exact representative.
              </p>
              <Input
                placeholder="Enter your street address (e.g. 123 Main St)..."
                aria-label="Street address"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && streetAddress.trim() && handleSearch()}
                className="h-12 text-base bg-white"
                autoFocus
              />
              <p className="text-sm text-pw-muted">Your address is used only for this search. We don&apos;t save it.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SecondaryButton onClick={() => { setNeedsAddress(false); setStreetAddress(''); }} className="border-pw-line">
                  Cancel
                </SecondaryButton>
                <PrimaryButton onClick={handleSearch} disabled={loading || !streetAddress.trim()}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-label="Searching" /> : 'Find My Representative'}
                </PrimaryButton>
              </div>
            </div>
          )}
          <div aria-live="polite">
            {loading && (
              <p className="text-pw-muted text-sm mt-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> Finding your congressional district...
              </p>
            )}
            {saving && !loading && (
              <p className="text-pw-muted text-sm mt-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> Saving to your profile...
              </p>
            )}
            {saved && !loading && !saving && (
              <p className="text-pw-green-ink text-sm font-semibold mt-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> Your state and district are saved — your address was not.
              </p>
            )}
            {error && <p className="text-pw-red-ink text-sm font-semibold mt-3" role="alert">{error}</p>}
          </div>
        </div>
      </RaisedCard>

      {officials && <OfficialsResult officials={officials} />}
    </section>
  );
}

const shownName = (entry) => (entry?.name && entry.name !== 'VACANT' && entry.name !== 'UNCONFIRMED' ? entry.name : null);

// Names for the saved place, from the officeholders table only.
function OfficialsResult({ officials: o }) {
  const row = 'flex items-center gap-3 bg-pw-soft rounded-2xl p-3';
  const capital = shownName(o.capital);
  return (
    <div className="max-w-3xl mx-auto mt-4 space-y-3">
      <div className="grid md:grid-cols-2 gap-4">
        <RaisedCard className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 bg-pw-blue-soft text-pw-blue-ink rounded-xl grid place-items-center">
              <Landmark className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <Eyebrow>{o.type === 'state' ? 'State Information' : 'Where you live'}</Eyebrow>
              <p className="text-lg font-extrabold">{o.place}</p>
            </div>
          </div>
          {capital && (
            <div className={row}>
              <Building2 className="w-5 h-5 text-pw-muted shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm text-pw-muted">{o.type === 'state' ? 'State Capital' : 'Capital'}</p>
                <p className="font-bold">{capital}</p>
              </div>
            </div>
          )}
          <div className={row}>
            <Landmark className="w-5 h-5 text-pw-muted shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm text-pw-muted">Governor</p>
              <p className="font-bold">{shownName(o.governor) || `${o.place} does not have a Governor`}</p>
              {o.mayor && shownName(o.mayor) && <p className="text-sm text-pw-muted">Mayor: {o.mayor.name}</p>}
            </div>
          </div>
        </RaisedCard>

        <RaisedCard className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 bg-sand text-ink rounded-xl grid place-items-center">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
            <Eyebrow>US Senators</Eyebrow>
          </div>
          {o.noSenators ? (
            <div className={row}><p className="font-bold">{o.place} has no U.S. Senators</p></div>
          ) : o.senators.map((s) => (
            <div key={s.name} className={row}><p className="font-bold">{s.name}</p></div>
          ))}
          {o.delegate ? (
            <div className={row}>
              <div className="min-w-0">
                <p className="text-sm text-pw-muted">{o.delegate.title} in the U.S. House (non-voting)</p>
                <p className="font-bold">{o.delegate.name}</p>
              </div>
            </div>
          ) : o.representative && (
            <div className={row}>
              <div className="min-w-0">
                <p className="text-sm text-pw-muted">US Representative — District {o.district}</p>
                <p className="font-bold">{shownName(o.representative) || 'This seat is empty right now'}</p>
              </div>
            </div>
          )}
        </RaisedCard>
      </div>
      <p className="text-sm text-pw-muted px-1">{checkedOnText(OFFICEHOLDERS_CHECKED_ON)}.</p>
      {isStale() && (
        <p className="text-sm text-pw-muted px-1">
          This list was last checked on {OFFICEHOLDERS_CHECKED_ON}. Officials can change; check usa.gov.
        </p>
      )}
    </div>
  );
}
