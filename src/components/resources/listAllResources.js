import { base44 } from '@/api/base44Client';

// Every CommunityResource, read in cursor pages. A plain list() stops at
// 5,000 records, and the Resource Hub holds more than that.
export async function listAllResources() {
  const all = [];
  let page = await base44.entities.CommunityResource.list({ sort: 'name', limit: 1000 });
  all.push(...page.items);
  while (page.has_more) {
    page = await base44.entities.CommunityResource.list({ cursor: page.next_cursor, limit: 1000 });
    all.push(...page.items);
  }
  return all;
}
