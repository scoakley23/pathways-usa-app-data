import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Search, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';
import SentenceDialog from '@/components/admin/SentenceDialog';
import { toast } from "sonner";

export default function Admin() {
  const [sentences, setSentences] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSentence, setEditingSentence] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkUser();
    fetchSentences();
  }, []);

  const checkUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
    } catch (error) {
      // Not logged in or error
    }
  };

  const fetchSentences = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.Sentence.list();
      setSentences(data);
    } catch (error) {
      console.error("Failed to fetch sentences:", error);
      toast.error("Failed to load sentences");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    try {
      await base44.entities.Sentence.create(formData);
      toast.success("Sentence added successfully");
      setIsDialogOpen(false);
      fetchSentences();
    } catch (error) {
      console.error("Failed to create sentence:", error);
      toast.error("Failed to add sentence");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingSentence) return;
    setIsSubmitting(true);
    try {
      await base44.entities.Sentence.update(editingSentence.id, formData);
      toast.success("Sentence updated successfully");
      setIsDialogOpen(false);
      setEditingSentence(null);
      fetchSentences();
    } catch (error) {
      console.error("Failed to update sentence:", error);
      toast.error("Failed to update sentence");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sentence?")) return;
    try {
      await base44.entities.Sentence.delete(id);
      toast.success("Sentence deleted");
      setSentences(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error("Failed to delete sentence:", error);
      toast.error("Failed to delete sentence");
    }
  };

  const openCreateDialog = () => {
    setEditingSentence(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (sentence) => {
    setEditingSentence(sentence);
    setIsDialogOpen(true);
  };

  const filteredSentences = sentences.filter(s => 
    s.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const difficultyColor = {
    easy: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    hard: "bg-red-100 text-red-800"
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Simple role check - in a real app you might want stricter backend rules or more robust frontend checks
  if (currentUser && currentUser.role !== 'admin') {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <h2 className="text-2xl font-bold text-slate-800">Access Denied</h2>
              <p className="text-slate-600">You do not have permission to view this page.</p>
          </div>
      )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sentence Management</h1>
          <p className="text-slate-500">Manage the content for dictation practice.</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> Add Sentence
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search sentences..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-[50%]">Sentence Text</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSentences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-32 text-slate-500">
                  No sentences found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSentences.map((sentence) => (
                <TableRow key={sentence.id}>
                  <TableCell className="font-medium text-slate-800">
                    {sentence.text}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                      {sentence.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={difficultyColor[sentence.difficulty] || "bg-gray-100"}>
                      {sentence.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(sentence)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(sentence.id)}
                          className="text-red-600 focus:text-red-600"
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

      <SentenceDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSubmit={editingSentence ? handleUpdate : handleCreate}
        initialData={editingSentence}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}