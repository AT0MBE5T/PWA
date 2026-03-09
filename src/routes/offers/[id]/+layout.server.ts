import type { AnnouncementFull } from '$lib';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals, fetch }) => {
  const { id } = params;
  const userId = locals.user?.id ?? null;

  if (userId)
    await addViewer(id, userId, fetch);

  const offer = await getAnnouncementFullInfoById(id, userId, fetch);

  return {
    id,
    offer
  };
};

const getAnnouncementFullInfoById = async (
  announcementId: string, 
  userId: string | null,
  fetch: typeof globalThis.fetch 
): Promise<AnnouncementFull | undefined> => {
  const response = await fetch('http://localhost:5118/api/Announcement/get-announcement-full-by-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      announcementId,
      userId
    })
  });

  if (!response.ok) return;
  return await response.json();
};

const addViewer = async (
  announcementId: string, 
  userId: string,
  fetch: typeof globalThis.fetch 
): Promise<void> => {
  await fetch('http://localhost:5118/api/View/add-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      announcementId
    })
  });
};
