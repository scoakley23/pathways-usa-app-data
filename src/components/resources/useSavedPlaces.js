import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

// The signed-in learner's saved places (owner-only SavedPlace records). Only
// the place's id is stored with the email: no location, no notes. One shared
// query, so every Save button and the saved list stay in sync.
export default function useSavedPlaces() {
  const { user, isAuthenticated } = useAuth();
  const email = isAuthenticated ? String(user?.email || '').toLowerCase().trim() : '';
  const queryClient = useQueryClient();
  const queryKey = ['savedPlaces', email];

  const { data: records = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => base44.entities.SavedPlace.filter({ user_email: email }, '-created_date', 1000),
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  });
  const savedIds = useMemo(() => new Set(records.map((r) => r.resource_id)), [records]);

  const toggle = useMutation({
    mutationFn: async (resourceId) => {
      const existing = records.filter((r) => r.resource_id === resourceId);
      if (existing.length) {
        await Promise.all(existing.map((r) => base44.entities.SavedPlace.delete(r.id)));
      } else {
        await base44.entities.SavedPlace.create({ user_email: email, resource_id: resourceId });
      }
    },
    // Show the change right away; the refetch confirms it.
    onMutate: async (resourceId) => {
      await queryClient.cancelQueries({ queryKey });
      const before = queryClient.getQueryData(queryKey) || [];
      const saved = before.some((r) => r.resource_id === resourceId);
      queryClient.setQueryData(queryKey, saved
        ? before.filter((r) => r.resource_id !== resourceId)
        : [{ id: `pending-${resourceId}`, resource_id: resourceId }, ...before]);
      return { before };
    },
    onError: (_err, _id, ctx) => queryClient.setQueryData(queryKey, ctx?.before || []),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    canSave: !!email,
    isLoading: !!email && isLoading,
    savedIds,
    isSaved: (id) => savedIds.has(id),
    toggleSaved: (id) => toggle.mutate(id),
    isSaving: toggle.isPending,
  };
}
