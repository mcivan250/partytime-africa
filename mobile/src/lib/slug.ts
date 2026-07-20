// URL-friendly slug with a random suffix so share links stay unique
// (events.slug has a unique constraint).
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const suffix = Math.random().toString(36).substring(2, 8);
  return base ? `${base}-${suffix}` : suffix;
}
