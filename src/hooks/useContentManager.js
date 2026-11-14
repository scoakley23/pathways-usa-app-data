import React, { useState, useCallback } from 'react';
import { content } from '@/api/content';
import { toast } from 'sonner';

/**
 * Shared CRUD hook for admin content management (Sentences, CivicsQuestions, VocabularyWords, Places).
 * `listFn` (optional) replaces the default list() call, e.g. to read past 5,000 records.
 */
export function useContentManager(entityName, itemName, listFn) {
  const store = React.useMemo(() => content.contentAdmin(entityName), [entityName]);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = listFn ? await listFn() : await store.list();
      setItems(data);
    } catch (error) {
      console.error(`Failed to fetch ${itemName}s:`, error);
      toast.error(`Failed to load ${itemName}s`);
    } finally {
      setIsLoading(false);
    }
  }, [store, itemName, listFn]);

  const createItem = async (formData) => {
    setIsSubmitting(true);
    try {
      await store.create(formData);
      toast.success(`${itemName} added successfully`);
      fetchItems();
      return true;
    } catch (error) {
      console.error(`Failed to create ${itemName}:`, error);
      toast.error(`Failed to add ${itemName}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateItem = async (id, formData) => {
    setIsSubmitting(true);
    try {
      await store.update(id, formData);
      toast.success(`${itemName} updated successfully`);
      fetchItems();
      return true;
    } catch (error) {
      console.error(`Failed to update ${itemName}:`, error);
      toast.error(`Failed to update ${itemName}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${itemName}?`)) return;
    try {
      await store.remove(id);
      toast.success(`${itemName} deleted`);
      setItems((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error(`Failed to delete ${itemName}:`, error);
      toast.error(`Failed to delete ${itemName}`);
    }
  };

  return { items, isLoading, isSubmitting, fetchItems, createItem, updateItem, deleteItem };
}