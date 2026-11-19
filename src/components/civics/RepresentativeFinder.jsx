import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Eyebrow, PrimaryButton, RaisedCard, SecondaryButton } from '@/components/pathways/ui';
import { MapPin, Loader2, Building2, Users, Landmark, CheckCircle2 } from 'lucide-react';
import { districts, NOT_CONFIRMED } from '@/api/districts';
import { districtForZip } from '@/lib/zipDistricts';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { getOfficialsFor, isStale, OFFICEHOLDERS_CHECKED_ON, validateLocation } from '@/lib/officeholders';
import { checkedOnText } from '@/lib/officeholderQuestions';

// "Who Represents Me?": the ZIP code is looked up on the device in the Census
// table (src/lib/zipDistricts.js), nothing sent. Only when the ZIP spans more
// than one congressional district (or isn't in the table) is the street
// address asked for and looked up once (src/api/districts.js: Geocodio on
// Supabase, the AI on Base44), returning only the state and district. The
// result is checked against src/data/officeholders.json with
// validateLocation(); only the state and district are saved. Every name shown
// here comes from the table (getOfficialsFor()). The ZIP and address are used
// for this lookup only and never saved.

const ADDRESS_REASONS = {
  split: 'This zip code spans multiple congressional districts. Please enter your street address so we can find your exact representative.',
  unknown: "We couldn't find this zip code in our list. Please enter your street address so we can find your representative.",
};

export default function RepresentativeFinder() {
  const { location, save } = useLearnerLocation();
  const [zipCode, setZipCode] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [needsAddress, setNeedsAddress] = useState(false);
  const [addressReason, setAddressReason] = useState('split');

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
      let found = null;
      if (!addressStr) {
        // On the device: the Census ZIP table.
        const fromTable = await districtForZip(zip);
        if (fromTable?.district) found = fromTable;
        else {
          const territory = fromTable?.state && getOfficialsFor({ state: fromTable.state })?.type === 'territory';
          if (territory) found = { state: fromTable.state, district: 'At-large' };
          else {
            setAddressReason(fromTable ? 'split' : 'unknown');
            setNeedsAddress(true);
            return;
          }
        }
      } else {
        found = await districts.lookupAddress({ zip: zip.slice(0, 5), address: addressStr });
      }

      const checked = validateLocation({ state: found.state, district: found.district });
      if (!checked.ok) {
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
    <section className="py-6 text-navy">
      <RaisedCard className="max-w-3xl mx-auto">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 shrink-0 bg-tint text-navy rounded-2xl grid place-items-center">
            <MapPin className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-[1.75rem] font-display font-normal leading-tight pt-1.5">Who Represents Me?</h2>
        </div>
        <p className="text-base text-muted leading-relaxed">
          Enter your zip code to find your Senators, Representative, Governor, and State Capital — your answers will be used during civics practice.
        </p>
        <p className="text-sm text-muted mt-2">Your address is used only for this lookup and is never saved.</p>

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
            <div className="space-y-3 bg-tint rounded-2xl p-4">
              <p className="text-navy text-base font-semibold leading-snug">
                {ADDRESS_REASONS[addressReason]}
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
              <p className="text-sm text-muted">Your address is used only for this search. We don&apos;t save it.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SecondaryButton onClick={() => { setNeedsAddress(false); setStreetAddress(''); }} className="border-line">
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
              <p className="text-muted text-sm mt-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> Finding your congressional district...
              </p>
            )}
            {saving && !loading && (
              <p className="text-muted text-sm mt-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> Saving to your profile...
              </p>
            )}
            {saved && !loading && !saving && (
              <p className="text-correct text-sm font-semibold mt-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> Your state and district are saved — your address was not.
              </p>
            )}
            {error && <p className="text-not-yet text-sm font-semibold mt-3" role="alert">{error}</p>}
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
  const row = 'flex items-center gap-3 bg-tint rounded-2xl p-3';
  const capital = shownName(o.capital);
  return (
    <div className="max-w-3xl mx-auto mt-4 space-y-3">
      <div className="grid md:grid-cols-2 gap-4">
        <RaisedCard className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 bg-tint text-navy rounded-xl grid place-items-center">
              <Landmark className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <Eyebrow>{o.type === 'state' ? 'State Information' : 'Where you live'}</Eyebrow>
              <p className="text-lg font-extrabold">{o.place}</p>
            </div>
          </div>
          {capital && (
            <div className={row}>
              <Building2 className="w-5 h-5 text-muted shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm text-muted">{o.type === 'state' ? 'State Capital' : 'Capital'}</p>
                <p className="font-bold">{capital}</p>
              </div>
            </div>
          )}
          <div className={row}>
            <Landmark className="w-5 h-5 text-muted shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm text-muted">Governor</p>
              <p className="font-bold">{shownName(o.governor) || `${o.place} does not have a Governor`}</p>
              {o.mayor && shownName(o.mayor) && <p className="text-sm text-muted">Mayor: {o.mayor.name}</p>}
            </div>
          </div>
        </RaisedCard>

        <RaisedCard className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 bg-tint text-navy rounded-xl grid place-items-center">
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
                <p className="text-sm text-muted">{o.delegate.title} in the U.S. House (non-voting)</p>
                <p className="font-bold">{o.delegate.name}</p>
              </div>
            </div>
          ) : o.representative && (
            <div className={row}>
              <div className="min-w-0">
                <p className="text-sm text-muted">US Representative — District {o.district}</p>
                <p className="font-bold">{shownName(o.representative) || 'This seat is empty right now'}</p>
              </div>
            </div>
          )}
        </RaisedCard>
      </div>
      <p className="text-sm text-muted px-1">{checkedOnText(OFFICEHOLDERS_CHECKED_ON)}.</p>
      {isStale() && (
        <p className="text-sm text-muted px-1">
          This list was last checked on {OFFICEHOLDERS_CHECKED_ON}. Officials can change; check usa.gov.
        </p>
      )}
    </div>
  );
}
