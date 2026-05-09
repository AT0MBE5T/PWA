import { env } from '$env/dynamic/public';
import { settings, type AnnouncementFull } from '$lib';
import getCookie from '$lib/utils/cookieData';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals, fetch }) => {
      const { id } = params;
      const userId = locals.user?.id ?? null;

      let authorId = '';
  
  try{
      if (userId)
        await addViewer(id, fetch);

      const offer = await getAnnouncementFullInfoById(id, userId, fetch);

      authorId = offer?.authorId ?? '';
      settings.online = offer !== undefined;

  }catch(error){
      settings.online = false;
  }
  finally{
      return {
        id,
        authorId: authorId
      };
  }
};

const getAnnouncementFullInfoById = async (
  announcementId: string, 
  userId: string | null,
  fetch: typeof globalThis.fetch 
): Promise<AnnouncementFull | undefined> => {
  const response = await fetch(`${env.PUBLIC_API_URL}/api/announcements/get-announcement-full-by-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      announcementId
    })
  });

  if (!response.ok) return;
  return await response.json();
};

const addViewer = async (
  announcementId: string,
  fetch: typeof globalThis.fetch 
): Promise<void> => {
  const accessToken = getCookie('accessToken');
  await fetch(`${env.PUBLIC_API_URL}/api/views/add-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
    body: JSON.stringify({
      announcementId
    })
  });
};
