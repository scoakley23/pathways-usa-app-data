import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button, Card as RaisedCard } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage from '@/hooks/useAppLanguage';
import { REP_LINES } from '@/components/lessons/learnStrings';

// A small plain label.
const Eyebrow = ({ children }) => <p className="text-base font-semibold text-muted" dir="auto">{children}</p>;

// The finder's words in the app language (pack; English when missing).
function useRepText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(REP_LINES, language, { cacheKey: 'find_rep_v1' });
  return (key, vars = {}) => Object.entries(vars).reduce((out, [k, v]) => out.split(`{${k}}`).join(String(v)), (language !== 'en' && tr(key)) || REP_LINES[key] || key);
}
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


export default function RepresentativeFinder() {
  const t = useRepText();
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
      setError(t('bad_zip'));
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
        setError(t('save_failed'));
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
      <RaisedCard padding="p-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 shrink-0 bg-line-soft text-navy rounded-card grid place-items-center">
            <MapPin className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-[1.375rem] font-bold leading-tight pt-2" dir="auto">{t('title')}</h2>
        </div>
        <p className="text-base text-muted leading-relaxed" dir="auto">{t('intro')}</p>
        <p className="text-small text-muted mt-2" dir="auto">{t('zip_note')}</p>

        <div className="mt-5">
          {!needsAddress ? (
            <div className="flex gap-2">
              <Input
                placeholder={t('zip_placeholder')}
                aria-label={t('zip_label')}
                inputMode="numeric"
                value={zipCode}
                onChange={(e) => { setZipCode(e.target.value); setSaved(false); setNeedsAddress(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 text-base min-w-0"
                maxLength={10}
              />
              <Button variant="next" onClick={handleSearch} disabled={loading} className="h-12 shrink-0">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-label={t('searching')} /> : t('search')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 bg-line-soft rounded-card p-4">
              <p className="text-navy text-base font-semibold leading-snug" dir="auto">
                {t(addressReason === 'split' ? 'split' : 'unknown')}
              </p>
              <Input
                placeholder={t('address_placeholder')}
                aria-label={t('address_label')}
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && streetAddress.trim() && handleSearch()}
                className="h-12 text-base bg-white"
                autoFocus
              />
              <p className="text-small text-muted" dir="auto">{t('address_note')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button variant="second" onClick={() => { setNeedsAddress(false); setStreetAddress(''); }}>
                  {t('cancel')}
                </Button>
                <Button variant="next" onClick={handleSearch} disabled={loading || !streetAddress.trim()}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-label={t('searching')} /> : t('find')}
                </Button>
              </div>
            </div>
          )}
          <div aria-live="polite">
            {loading && (
              <p className="text-muted text-sm mt-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> <span dir="auto">{t('finding')}</span>
              </p>
            )}
            {saving && !loading && (
              <p className="text-muted text-sm mt-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" /> <span dir="auto">{t('saving')}</span>
              </p>
            )}
            {saved && !loading && !saving && (
              <p className="text-correct text-sm font-semibold mt-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> <span dir="auto">{t('saved')}</span>
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
  const t = useRepText();
  const row = 'flex items-center gap-3 bg-line-soft rounded-card p-3';
  const capital = shownName(o.capital);
  return (
    <div className="mt-4 space-y-3">
      <div className="grid md:grid-cols-2 gap-4">
        <RaisedCard padding="p-4" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 bg-line-soft text-navy rounded-card grid place-items-center">
              <Landmark className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <Eyebrow>{o.type === 'state' ? t('state_info') : t('where_you_live')}</Eyebrow>
              <p className="text-lg font-bold">{o.place}</p>
            </div>
          </div>
          {capital && (
            <div className={row}>
              <Building2 className="w-5 h-5 text-muted shrink-0" aria-hidden="true" />
              <div>
                <p className="text-small text-muted" dir="auto">{o.type === 'state' ? t('state_capital') : t('capital')}</p>
                <p className="font-bold">{capital}</p>
              </div>
            </div>
          )}
          <div className={row}>
            <Landmark className="w-5 h-5 text-muted shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-small text-muted" dir="auto">{t('governor')}</p>
              <p className="font-bold">{shownName(o.governor) || t('no_governor', { place: o.place })}</p>
              {o.mayor && shownName(o.mayor) && <p className="text-small text-muted" dir="auto">{t('mayor', { name: o.mayor.name })}</p>}
            </div>
          </div>
        </RaisedCard>

        <RaisedCard padding="p-4" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 bg-line-soft text-navy rounded-card grid place-items-center">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
            <Eyebrow>{t('senators')}</Eyebrow>
          </div>
          {o.noSenators ? (
            <div className={row}><p className="font-bold" dir="auto">{t('no_senators', { place: o.place })}</p></div>
          ) : o.senators.map((s) => (
            <div key={s.name} className={row}><p className="font-bold">{s.name}</p></div>
          ))}
          {o.delegate ? (
            <div className={row}>
              <div className="min-w-0">
                <p className="text-small text-muted" dir="auto">{t('delegate', { title: o.delegate.title })}</p>
                <p className="font-bold">{o.delegate.name}</p>
              </div>
            </div>
          ) : o.representative && (
            <div className={row}>
              <div className="min-w-0">
                <p className="text-small text-muted" dir="auto">{t('representative', { district: o.district })}</p>
                <p className="font-bold">{shownName(o.representative) || t('seat_empty')}</p>
              </div>
            </div>
          )}
        </RaisedCard>
      </div>
      <p className="text-small text-muted px-1">{checkedOnText(OFFICEHOLDERS_CHECKED_ON)}.</p>
      {isStale() && (
        <p className="text-small text-muted px-1" dir="auto">{t('stale', { date: OFFICEHOLDERS_CHECKED_ON })}</p>
      )}
    </div>
  );
}
