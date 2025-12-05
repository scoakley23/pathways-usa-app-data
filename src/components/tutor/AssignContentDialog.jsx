import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Search, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AssignContentDialog({ isOpen, onClose, studentEmail, tutorEmail }) {
  const [contentType, setContentType] = useState('sentence');
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchContent();
      setSelectedId(null);
      setSearchQuery('');
    }
  }, [isOpen, contentType]);

  useEffect(() => {
    filterItems();
  }, [searchQuery, items]);

  const fetchContent = async () => {
    setIsLoading(true);
    try {
      let data = [];
      if (contentType === 'sentence') {
        data = await base44.entities.Sentence.list();
      } else if (contentType === 'vocabulary') {
        data = await base44.entities.VocabularyWord.list();
      } else if (contentType === 'civics_question') {
        data = await base44.entities.CivicsQuestion.list();
      }
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Error fetching content", error);
      toast.error("Failed to load content");
    } finally {
      setIsLoading(false);
    }
  };

  const filterItems = () => {
    if (!searchQuery) {
      setFilteredItems(items);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = items.filter(item => {
      if (contentType === 'sentence') return item.text.toLowerCase().includes(lowerQuery);
      if (contentType === 'vocabulary') return item.word.toLowerCase().includes(lowerQuery);
      if (contentType === 'civics_question') return item.question.toLowerCase().includes(lowerQuery);
      return false;
    });
    setFilteredItems(filtered);
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    try {
      if (contentType === 'custom') {
         if (!searchQuery.trim()) {
            toast.error("Please enter custom text");
            setIsAssigning(false);
            return;
         }
         await base44.entities.Assignment.create({
            tutor_email: tutorEmail,
            student_email: studentEmail,
            content_type: 'custom',
            content_id: 'custom', // Placeholder
            custom_content: searchQuery,
            status: 'pending',
            assigned_date: new Date().toISOString()
         });
      } else {
          if (!selectedId) return;
          await base44.entities.Assignment.create({
            tutor_email: tutorEmail,
            student_email: studentEmail,
            content_type: contentType,
            content_id: selectedId,
            status: 'pending',
            assigned_date: new Date().toISOString()
          });
      }
      toast.success("Assignment sent successfully!");
      onClose();
    } catch (error) {
      console.error("Error assigning content", error);
      toast.error("Failed to assign content");
    } finally {
      setIsAssigning(false);
    }
  };

  const getItemLabel = (item) => {
    if (contentType === 'sentence') return item.text;
    if (contentType === 'vocabulary') return item.word;
    if (contentType === 'civics_question') return item.question;
    return '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Practice</DialogTitle>
          <DialogDescription>
            Select content to assign to {studentEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <Tabs value={contentType} onValueChange={setContentType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sentence">Sentences</TabsTrigger>
              <TabsTrigger value="vocabulary">Vocab</TabsTrigger>
              <TabsTrigger value="civics_question">Civics</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          {contentType === 'custom' ? (
            <div className="flex-1 p-4 space-y-4">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Create Custom Assignment</h3>
                    <p className="text-xs text-slate-500">Enter a custom sentence or instruction for the student to practice.</p>
                </div>
                <Input
                    placeholder="Type custom sentence here..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-24 text-lg"
                    as="textarea" 
                />
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="flex-1 border rounded-md p-2">
                {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No content found.</p>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-start hover:bg-slate-50
                      ${selectedId === item.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <p className="text-sm font-medium text-slate-800 pr-4 line-clamp-2">
                      {getItemLabel(item)}
                    </p>
                    {selectedId === item.id && (
                      <Check className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAssign} 
            disabled={(contentType !== 'custom' && !selectedId) || isAssigning} 
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAssigning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {contentType === 'custom' ? 'Assign Custom Task' : 'Assign Selected'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}