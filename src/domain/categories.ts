import type { CategoryId, CreatorType } from './types';

export const categories: { id: CategoryId; label: string }[] = [
  { id: 'environment', label: 'Environment' },
  { id: 'health', label: 'Health' },
  { id: 'science', label: 'Science' },
  { id: 'education', label: 'Education' },
  { id: 'public-policy', label: 'Public Policy' },
  { id: 'economic-policy', label: 'Economic Policy' },
  { id: 'community', label: 'Community' },
  { id: 'arts-culture', label: 'Arts & Culture' },
  { id: 'business', label: 'Business' },
  { id: 'other', label: 'Other' },
];

const categoryLabels = Object.fromEntries(categories.map((c) => [c.id, c.label])) as Record<
  CategoryId,
  string
>;

export function categoryLabel(id: CategoryId): string {
  return categoryLabels[id];
}

export const creatorTypeLabels: Record<CreatorType, string> = {
  individual: 'Individual',
  influencer: 'Creator',
  nonprofit: 'Nonprofit',
  organization: 'Organization',
  business: 'Business',
  'community-group': 'Community group',
};
