// Cache tag names, shared by cached reads and the Server Actions that revalidate them (docs/data-fetching.md).
export const profileTag = (userId: string) => `profile:${userId}`;
export const handleTag = (handle: string) => `handle:${handle.toLowerCase()}`;
