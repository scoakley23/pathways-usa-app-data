import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import SentenceDialog from '@/components/admin/SentenceDialog';
import { useContentManager } from '@/hooks/useContentManager';

const difficultyColor = {
  easy: "bg-pw-green-soft text-pw-green-ink",
  medium: "bg-pw-blue-soft text-pw-blue-ink",
  hard: "bg-pw-red-soft text-pw-red-ink",
};

export default function SentencesTab() {
  const { items: sentences, isLoading, isSubmitting, fetchItems, createItem, updateItem, deleteItem } = useContentManager('Sentence', 'sentence');
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSubmit = async (formData) => {
    const success = editingItem ? await updateItem(editingItem.id, formData) : await createItem(formData);
    if (success) {
      setIsDialogOpen(false);
      setEditingItem(null);
    }
  };

  const filtered = sentences.filter(s =>
    s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pw-navy" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pw-muted" aria-hidden="true" />
          <Input type="search" placeholder="Search sentences..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Button onClick={() => { setEditingItem(null); setIsDialogOpen(true); }} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Sentence
        </Button>
      </div>
      <div className="border border-pw-line rounded-[14px] bg-white shadow-raised overflow-hidden">
        <Table className="text-base [&_th]:px-2 [&_td]:px-2 sm:[&_th]:px-4 sm:[&_td]:px-4 [&_th]:text-sm [&_th]:font-bold [&_th]:text-pw-muted">
          <TableHeader>
            <TableRow className="bg-pw-soft hover:bg-pw-soft">
              <TableHead className="w-[50%]">Sentence Text</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center h-32 text-pw-muted">No sentences found.</TableCell></TableRow>
            ) : (
              filtered.map((sentence) => (
                <TableRow key={sentence.id}>
                  <TableCell className="font-semibold text-pw-navy">{sentence.text}</TableCell>
                  <TableCell><Badge variant="secondary" className="font-semibold whitespace-nowrap">{sentence.category}</Badge></TableCell>
                  <TableCell><Badge className={`${difficultyColor[sentence.difficulty] || "bg-pw-soft text-pw-navy"} capitalize whitespace-nowrap`}>{sentence.difficulty}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions"><MoreHorizontal className="h-5 w-5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => { setEditingItem(sentence); setIsDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteItem(sentence.id)} className="text-pw-red-ink focus:text-pw-red-ink"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <SentenceDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSubmit={handleSubmit} initialData={editingItem} isSubmitting={isSubmitting} />
    </div>
  );
}