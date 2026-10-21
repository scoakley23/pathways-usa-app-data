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
import { categoryById, parseCsv, cleanResourceRow, resourceKey, loadZipTable } from '@/lib/resourceHub';

const BATCH = 50;

// Admin: places shown on the Resource Hub map. Import takes a CSV or JSON
// file in the format described in content/resources/README.md; rows already
// in the list (same name, street address and ZIP) are skipped, so an import
// can be re-run.
export default function ResourcesTab() {
  const { items, isLoading, isSubmitting, fetchItems, createItem, updateItem, deleteItem } = useContentManager('CommunityResource', 'place', listAllResources);
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [importing, setImporting] = useState(null); // { done, total }
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

  const toggleActive = async (r) => {
    try {
      await base44.entities.CommunityResource.update(r.id, { is_active: r.is_active === false });
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
      const zipTable = await loadZipTable();
      const seen = new Set(items.map(resourceKey));
      const records = [];
      const problems = [];
      let duplicates = 0;
      rows.forEach((row, i) => {
        const { record, error } = cleanResourceRow(row, zipTable);
        if (error) { problems.push(`Row ${i + 2}: ${error}`); return; }
        const key = resourceKey(record);
        if (seen.has(key)) { duplicates++; return; }
        seen.add(key);
        records.push(record);
      });
      if (!records.length) {
        toast.error(`Nothing new to import. ${duplicates} already listed, ${problems.length} with problems.`);
        if (problems.length) console.warn('Import problems:\n' + problems.join('\n'));
        return;
      }
      if (!window.confirm(`Import ${records.length} new places? (${duplicates} already listed, ${problems.length} rows skipped.)`)) return;
      setImporting({ done: 0, total: records.length });
      for (let i = 0; i < records.length; i += BATCH) {
        await base44.entities.CommunityResource.bulkCreate(records.slice(i, i + BATCH));
        setImporting({ done: Math.min(i + BATCH, records.length), total: records.length });
      }
      toast.success(`Imported ${records.length} places`);
      if (problems.length) {
        toast.warning(`${problems.length} rows were skipped. See the browser console for details.`);
        console.warn('Import problems:\n' + problems.join('\n'));
      }
    } catch (err) {
      console.error('Import failed:', err);
      toast.error(`Import failed: ${err.message || 'unknown error'}`);
    } finally {
      setImporting(null);
      refresh();
    }
  };

  const q = searchQuery.toLowerCase();
  const filtered = items.filter((r) =>
    [r.name, r.city, r.state, r.zip, r.category].some((v) => String(v || '').toLowerCase().includes(q))
  );

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
      <p className="text-sm text-pw-muted">
        {items.length} places ({items.filter((r) => r.is_active === false).length} hidden). Learners see only places that are not hidden.
      </p>
      <div className="border border-pw-line rounded-3xl bg-white shadow-raised overflow-hidden">
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
              filtered.map((r) => (
                <TableRow key={r.id} className={r.is_active === false ? 'opacity-60' : ''}>
                  <TableCell className="font-semibold text-pw-navy">
                    {r.name}
                    {r.is_active === false && <span className="ml-2 text-sm font-normal text-pw-muted">(hidden)</span>}
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="font-semibold whitespace-nowrap">{categoryById(r.category).label}</Badge></TableCell>
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
