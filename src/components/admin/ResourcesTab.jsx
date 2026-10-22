import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import ResourceDialog from '@/components/admin/ResourceDialog';
import { listAllResources } from '@/components/resources/listAllResources';
import { useContentManager } from '@/hooks/useContentManager';
import { categoryById, parseCsv, planImport, loadZipTable, placeServices } from '@/lib/resourceHub';

const CREATE_BATCH = 50;

// Places an import hid until a person checks them ("... - check").
const needsCheck = (r) => /- check\b/.test(r.relevance_note || '');
const UPDATE_BATCH = 200;
const SHOW_ROWS = 300;

// Base44 sometimes refuses a burst of requests; wait and try a batch again
// (2 s, 5 s, 15 s) before giving up.
async function withRetry(fn) {
  for (const wait of [2000, 5000, 15000, 0]) {
    try {
      return await fn();
    } catch (err) {
      if (!wait) throw err;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

// Admin: places shown on the Resource Hub map. Import takes a CSV or JSON
// file in the format described in content/resources/README.md. Rows that
// match a saved place (by source id, or name + street address + ZIP) update
// it; other rows are added. Re-running a file never makes duplicates.
export default function ResourcesTab() {
  const { items, isLoading, isSubmitting, fetchItems, createItem, updateItem, deleteItem } = useContentManager('CommunityResource', 'place', listAllResources);
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [importing, setImporting] = useState(null); // { done, total }
  const [show, setShow] = useState('all'); // all | shown | check | removed | hidden
  const fileRef = useRef(null);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const refresh = () => {
    fetchItems();
    queryClient.invalidateQueries({ queryKey: ['communityResources'] });
  };

  const handleSubmit = async (formData) => {
    const success = editingItem ? await updateItem(editingItem.id, formData) : await createItem(formData);
    if (success) {
      setIsDialogOpen(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: ['communityResources'] });
    }
  };

  // A place waiting for a check that should stay hidden.
  const keepHidden = async (r) => {
    try {
      await base44.entities.CommunityResource.update(r.id, { is_active: false, relevance_note: 'Checked: not relevant' });
      refresh();
    } catch {
      toast.error('Could not update the place');
    }
  };

  const toggleActive = async (r) => {
    // Showing a place that was waiting for a check marks it as checked.
    const showing = r.is_active === false;
    const changes = { is_active: showing };
    if (showing && needsCheck(r)) changes.relevance_note = 'Checked: shown';
    try {
      await base44.entities.CommunityResource.update(r.id, changes);
      refresh();
    } catch {
      toast.error('Could not update the place');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const rows = /\.json$/i.test(file.name) ? JSON.parse(text) : parseCsv(text);
      if (!Array.isArray(rows)) throw new Error('The JSON file must be a list of places.');
      const plan = planImport(rows, items, await loadZipTable());
      if (plan.problems.length) console.warn('Import problems:\n' + plan.problems.join('\n'));
      const work = plan.creates.length + plan.updates.length;
      if (!work) {
        toast.error(`Nothing to change. ${plan.unchanged} already up to date, ${plan.problems.length} rows with problems.`);
        return;
      }
      const summary = [
        `${plan.creates.length} new places`,
        `${plan.updates.length} places updated${plan.hiding ? ` (${plan.hiding} of them hidden)` : ''}`,
        `${plan.unchanged} already up to date`,
        plan.duplicates ? `${plan.duplicates} repeated rows skipped` : '',
        plan.problems.length ? `${plan.problems.length} rows with problems skipped` : '',
      ].filter(Boolean).join('\n');
      if (!window.confirm(`Import this file?\n\n${summary}`)) return;
      let done = 0;
      setImporting({ done, total: work });
      for (let i = 0; i < plan.creates.length; i += CREATE_BATCH) {
        const batch = plan.creates.slice(i, i + CREATE_BATCH);
        await withRetry(() => base44.entities.CommunityResource.bulkCreate(batch));
        done += batch.length;
        setImporting({ done, total: work });
      }
      for (let i = 0; i < plan.updates.length; i += UPDATE_BATCH) {
        const batch = plan.updates.slice(i, i + UPDATE_BATCH);
        await withRetry(() => base44.entities.CommunityResource.bulkUpdate(batch));
        done += batch.length;
        setImporting({ done, total: work });
      }
      toast.success(`Done: ${plan.creates.length} added, ${plan.updates.length} updated`);
      if (plan.problems.length) toast.warning(`${plan.problems.length} rows were skipped. See the browser console for details.`);
    } catch (err) {
      console.error('Import failed:', err);
      toast.error(`Import stopped: ${err.message || 'unknown error'}. Run the same file again to finish; finished places are not repeated.`);
    } finally {
      setImporting(null);
      refresh();
    }
  };

  const q = searchQuery.toLowerCase();
  const filtered = items.filter((r) =>
    (show === 'all' || (show === 'shown' && r.is_active !== false) || (show === 'hidden' && r.is_active === false) ||
      (show === 'check' && needsCheck(r)) ||
      (show === 'removed' && r.is_active === false && !needsCheck(r))) &&
    [r.name, r.city, r.state, r.zip, r.category].some((v) => String(v || '').toLowerCase().includes(q))
  );
  const visible = filtered.slice(0, SHOW_ROWS);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pw-navy" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pw-muted" aria-hidden="true" />
          <Input type="search" placeholder="Search places..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input ref={fileRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={handleImport} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={!!importing} className="w-full sm:w-auto">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? `Importing ${importing.done}/${importing.total}` : 'Import CSV/JSON'}
          </Button>
          <Button onClick={() => { setEditingItem(null); setIsDialogOpen(true); }} className="w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Add Place
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="places-show" className="text-sm font-bold text-pw-navy">Show</label>
        <select
          id="places-show"
          value={show}
          onChange={(e) => setShow(e.target.value)}
          className="min-h-[44px] rounded-2xl border-2 border-pw-line bg-white px-3 text-base text-pw-navy"
        >
          <option value="all">All places</option>
          <option value="shown">Shown to learners</option>
          <option value="check">Waiting for your check</option>
          <option value="removed">Hidden as not relevant</option>
          <option value="hidden">All hidden</option>
        </select>
        <p className="text-sm text-pw-muted">
          {items.length} places ({items.filter((r) => r.is_active === false).length} hidden). Learners see only places that are not hidden.
          {filtered.length > SHOW_ROWS && ` Showing the first ${SHOW_ROWS} of ${filtered.length}; search to narrow.`}
        </p>
      </div>
      <div className="border border-pw-line rounded-[14px] bg-white shadow-raised overflow-hidden">
        <Table className="text-base [&_th]:px-2 [&_td]:px-2 sm:[&_th]:px-4 sm:[&_td]:px-4 [&_th]:text-sm [&_th]:font-bold [&_th]:text-pw-muted">
          <TableHeader>
            <TableRow className="bg-pw-soft hover:bg-pw-soft">
              <TableHead className="w-[35%]">Name</TableHead>
              <TableHead className="w-[20%]">Category</TableHead>
              <TableHead className="w-[25%]">City</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center h-32 text-pw-muted">No places found.</TableCell></TableRow>
            ) : (
              visible.map((r) => (
                <TableRow key={r.id} className={r.is_active === false ? 'opacity-60' : ''}>
                  <TableCell className="font-semibold text-pw-navy">
                    {r.name}
                    {r.is_active === false && <span className="ml-2 text-sm font-normal text-pw-muted">(hidden)</span>}
                    {r.relevance_note && <span className="block text-sm font-normal text-pw-muted">{r.relevance_note}</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {placeServices(r).map((s) => (
                        <Badge key={s} variant="secondary" className="font-semibold whitespace-nowrap">{categoryById(s).label}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-pw-muted">{[r.city, r.state].filter(Boolean).join(', ') || '—'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions"><MoreHorizontal className="h-5 w-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setEditingItem(r); setIsDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(r)}>
                          {r.is_active === false ? <><Eye className="mr-2 h-4 w-4" /> Show</> : <><EyeOff className="mr-2 h-4 w-4" /> Hide</>}
                        </DropdownMenuItem>
                        {needsCheck(r) && (
                          <DropdownMenuItem onClick={() => keepHidden(r)}>
                            <EyeOff className="mr-2 h-4 w-4" /> Keep hidden (checked)
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={async () => { await deleteItem(r.id); queryClient.invalidateQueries({ queryKey: ['communityResources'] }); }}
                          className="text-pw-red-ink focus:text-pw-red-ink"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <ResourceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleSubmit} initialData={editingItem} isSubmitting={isSubmitting} />
    </div>
  );
}
