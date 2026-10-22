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


import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Search, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { assignPractice } from '@/lib/tutorLinks';

export default function AssignContentDialog({ isOpen, onClose, studentEmail, tutorEmail }) {
  const [contentType, setContentType] = useState('sentence');
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customType, setCustomType] = useState('sentence');
  const [customData, setCustomData] = useState({ word: '', definition: '', question: '', answer: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchContent();
      setSelectedIds([]);
      setSearchQuery('');
      setCustomData({ word: '', definition: '', question: '', answer: '' });
      setCustomType('sentence');
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
         // Validation
         if (customType === 'sentence' && !searchQuery.trim()) {
            toast.error("Please enter sentence text");
            setIsAssigning(false);
            return;
         }
         if (customType === 'vocabulary' && (!customData.word.trim() || !customData.definition.trim())) {
             toast.error("Please enter both word and definition");
             setIsAssigning(false);
             return;
         }
         if (customType === 'civics_question' && (!customData.question.trim() || !customData.answer.trim())) {
             toast.error("Please enter both question and answer");
             setIsAssigning(false);
             return;
         }

         let assignmentData = {
            content_type: 'custom',
            content_id: 'custom',
            custom_type: customType
         };

         if (customType === 'sentence') {
             assignmentData.custom_content = searchQuery;
             assignmentData.custom_data = { text: searchQuery };
         } else if (customType === 'vocabulary') {
             assignmentData.custom_content = `${customData.word}: ${customData.definition}`; // Fallback/Display
             assignmentData.custom_data = { word: customData.word, definition: customData.definition };
         } else if (customType === 'civics_question') {
             assignmentData.custom_content = customData.question;
             assignmentData.custom_data = { question: customData.question, answer: customData.answer };
         }

         await assignPractice(studentEmail, [assignmentData]);
      } else {
          if (selectedIds.length === 0) return;
          
          const assignments = selectedIds.map(id => ({
            content_type: contentType,
            content_id: id
          }));

          await assignPractice(studentEmail, assignments);
      }
      
      // Notify Student
      await base44.entities.Notification.create({
          user_email: studentEmail,
          type: 'assignment',
          title: 'New Assignment',
          message: `Your tutor has assigned you ${contentType === 'custom' ? 'a new task' : 'new practice items'}.`,
          link: '/Practice'
      });

      toast.success("Assignment sent successfully!");
      onClose();
    } catch (error) {
      console.error("Error assigning content", error);
      toast.error(error.message || "Failed to assign content");
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

  const fieldLabel = "text-sm font-bold text-pw-navy";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] sm:h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Assign Practice</DialogTitle>
          <DialogDescription className="break-all">
            Select content to assign to {studentEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <Tabs value={contentType} onValueChange={setContentType} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sentence" className="px-1 text-sm sm:text-base">Sentences</TabsTrigger>
              <TabsTrigger value="vocabulary" className="px-1 text-sm sm:text-base">Vocab</TabsTrigger>
              <TabsTrigger value="civics_question" className="px-1 text-sm sm:text-base">Civics</TabsTrigger>
              <TabsTrigger value="custom" className="px-1 text-sm sm:text-base">Custom</TabsTrigger>
            </TabsList>
          </Tabs>

          {contentType === 'custom' ? (
            <div className="flex-1 py-1 space-y-4 overflow-y-auto">
                <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-pw-navy">Create Custom Assignment</h3>
                    <p className="text-base text-pw-muted">Create content tailored to your student's needs.</p>
                </div>

                <div className="flex p-1 bg-white border border-pw-line rounded-2xl gap-1">
                    {['sentence', 'vocabulary', 'civics_question'].map(type => (
                        <button
                            key={type}
                            onClick={() => setCustomType(type)}
                            aria-pressed={customType === type}
                            className={`flex-1 min-h-[44px] text-sm font-bold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy ${
                                customType === type ? 'bg-pw-navy text-white' : 'text-pw-muted hover:bg-pw-soft'
                            }`}
                        >
                            {type === 'civics_question' ? 'Civics Q&A' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>

                {customType === 'sentence' && (
                    <div className="space-y-2 animate-in fade-in">
                        <label className={fieldLabel}>Sentence Text</label>
                        <Input
                            placeholder="Type sentence here..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-24 text-lg"
                            as="textarea" 
                        />
                    </div>
                )}

                {customType === 'vocabulary' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="space-y-2">
                            <label className={fieldLabel}>Word or Phrase</label>
                            <Input
                                placeholder="e.g. Amendment"
                                value={customData.word}
                                onChange={(e) => setCustomData({...customData, word: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={fieldLabel}>Definition</label>
                            <Input
                                placeholder="e.g. A change to the Constitution"
                                value={customData.definition}
                                onChange={(e) => setCustomData({...customData, definition: e.target.value})}
                                as="textarea"
                                className="h-20"
                            />
                        </div>
                    </div>
                )}

                {customType === 'civics_question' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="space-y-2">
                            <label className={fieldLabel}>Question</label>
                            <Input
                                placeholder="e.g. What is the supreme law of the land?"
                                value={customData.question}
                                onChange={(e) => setCustomData({...customData, question: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={fieldLabel}>Answer</label>
                            <Input
                                placeholder="e.g. The Constitution"
                                value={customData.answer}
                                onChange={(e) => setCustomData({...customData, answer: e.target.value})}
                                as="textarea"
                                className="h-20"
                            />
                        </div>
                    </div>
                )}
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-pw-muted" aria-hidden="true" />
                <Input
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Search content"
                />
              </div>

              <ScrollArea className="flex-1 border border-pw-line rounded-2xl p-2">
                {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-pw-navy" />
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="text-center text-base text-pw-muted py-8">No content found.</p>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                        setSelectedIds(prev => 
                            prev.includes(item.id) 
                            ? prev.filter(id => id !== item.id) 
                            : [...prev, item.id]
                        );
                    }}
                    className={`min-h-[48px] p-3 rounded-2xl border-2 cursor-pointer transition-colors flex justify-between items-start gap-2
                      ${selectedIds.includes(item.id) ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy/40'}`}
                  >
                    <p className="text-base font-semibold text-pw-navy line-clamp-2">
                      {getItemLabel(item)}
                    </p>
                    {selectedIds.includes(item.id) && (
                      <Check className="w-5 h-5 text-pw-navy mt-0.5 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleAssign} 
            disabled={(contentType !== 'custom' && selectedIds.length === 0) || isAssigning} 
          >
            {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {contentType === 'custom' ? 'Assign Custom Task' : `Assign Selected (${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}