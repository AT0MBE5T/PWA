import { env } from '$env/dynamic/public';
import type { AnnouncementFull } from '$lib';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
  const { id } = params;
  const userId = locals.user?.id ?? null;

  let authorId = '';

  if (userId === null)
    return {
      id: '',
      authorId: authorId
    };

  try{
    const authorResponse = await getAnnouncementFullInfoById(id, userId, fetch);

    if (authorResponse !== undefined) {
        authorId = authorResponse?.authorId;
    }
  }catch(error){
    console.log(error);
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
  userId: string,
  fetch: typeof globalThis.fetch 
): Promise<AnnouncementFull | undefined> => {
  const response = await fetch(`${env.PUBLIC_API_URL}/api/Announcement/get-announcement-full-by-id`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ announcementId, userId })
  });

  if (!response.ok) return;
  return await response.json();
};