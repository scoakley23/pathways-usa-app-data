import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from 'sonner';
import { RESOURCE_CATEGORIES, COST_LABELS, cleanResourceRow, loadZipTable } from '@/lib/resourceHub';

const EMPTY = {
  name: '', category: 'legal', address: '', city: '', state: '', zip: '', latitude: '', longitude: '',
  phone: '', website: '', languages: '', cost: '', description: '', source: '', source_url: '', last_verified: '',
};

const SELECT = 'flex min-h-[44px] w-full rounded-2xl border-2 border-pw-line bg-white px-3 text-base text-pw-navy focus-visible:outline-none focus-visible:border-pw-navy';

// Add/edit one Resource Hub place. Leave latitude/longitude empty to place the
// pin at the center of the ZIP code (marked as approximate).
export default function ResourceDialog({ open, onOpenChange, onSubmit, initialData, isSubmitting }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!open) return;
    if (!initialData) { setForm({ ...EMPTY, last_verified: new Date().toISOString().slice(0, 10) }); return; }
    const next = { ...EMPTY };
    Object.keys(EMPTY).forEach((k) => { next[k] = initialData[k] ?? ''; });
    next.languages = (initialData.languages || []).join('; ');
    // A ZIP-center pin is recomputed from the ZIP, so a changed ZIP moves it.
    if (initialData.location_precision === 'zip') { next.latitude = ''; next.longitude = ''; }
    setForm(next);
  }, [open, initialData]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { record, error } = cleanResourceRow({ ...form, is_active: initialData?.is_active ?? true }, await loadZipTable());
    if (error) { toast.error(error); return; }
    onSubmit(record);
  };

  const field = (id, label, props = {}) => (
    <div className="space-y-2">
      <Label htmlFor={`res-${id}`} className="text-sm font-bold text-pw-navy">{label}</Label>
      <Input id={`res-${id}`} value={form[id]} onChange={set(id)} {...props} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Place' : 'Add New Place'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {field('name', 'Name', { required: true, placeholder: 'e.g., Community Legal Center' })}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="res-category" className="text-sm font-bold text-pw-navy">Category</Label>
              <select id="res-category" value={form.category} onChange={set('category')} className={SELECT}>
                {RESOURCE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="res-cost" className="text-sm font-bold text-pw-navy">Cost</Label>
              <select id="res-cost" value={form.cost} onChange={set('cost')} className={SELECT}>
                <option value="">Not stated</option>
                {Object.entries(COST_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          {field('address', 'Street address')}
          <div className="grid grid-cols-[1fr_5rem_7rem] gap-3">
            {field('city', 'City')}
            {field('state', 'State', { maxLength: 2, placeholder: 'MA' })}
            {field('zip', 'ZIP', { inputMode: 'numeric', required: !form.latitude })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field('latitude', 'Latitude (optional)', { inputMode: 'decimal' })}
            {field('longitude', 'Longitude (optional)', { inputMode: 'decimal' })}
          </div>
          <p className="text-sm text-pw-muted -mt-2">Leave empty to put the pin at the center of the ZIP code.</p>
          {field('phone', 'Phone')}
          {field('website', 'Website')}
          {field('languages', 'Languages (separate with ;)', { placeholder: 'English; Spanish' })}
          <div className="space-y-2">
            <Label htmlFor="res-description" className="text-sm font-bold text-pw-navy">Description</Label>
            <Textarea
              id="res-description"
              value={form.description}
              onChange={set('description')}
              className="min-h-[80px] rounded-2xl border-2 border-pw-line text-base md:text-base text-pw-navy focus-visible:border-pw-navy"
            />
          </div>
          {field('source', 'Source', { placeholder: 'e.g., DOJ EOIR Recognized Organizations roster' })}
          {field('source_url', 'Source link')}
          {field('last_verified', 'Last checked', { type: 'date' })}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Place'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
