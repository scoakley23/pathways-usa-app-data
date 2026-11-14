import { content } from '@/api/content';

// Every CommunityResource (Resource Hub place), sorted by name. Read in pages
// (Base44: cursor pages, a plain list() stops at 5,000; Supabase: 1,000-row
// pages), in src/api/content.js.
export function listAllResources() {
  return content.allPlaces();
}
