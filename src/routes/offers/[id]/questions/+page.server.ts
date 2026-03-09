import type { AnnouncementFull, QuestionAnswer } from '$lib';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, fetch }) => {
    const { id } = params;
    const userId = locals.user?.id ?? null;

    if (userId === null)
      return {
        id: '',
        authorId: '',
        initialData: []
    };

    const response = await fetch(`http://localhost:5118/api/Question/get-all-by-announcement-id/${id}`);
    const authorResponse = await getAnnouncementFullInfoById(id, userId, fetch);

    if (response.ok && authorResponse !== undefined) {
        const initialData = await response.json() as QuestionAnswer[];
        return { 
            id,
            authorId: authorResponse?.authorId,
            initialData 
        };
    }

    return { id, authorId: authorResponse?.authorId, initialData: [] };
};

const getAnnouncementFullInfoById = async (
  announcementId: string,
  userId: string,
  fetch: typeof globalThis.fetch 
): Promise<AnnouncementFull | undefined> => {
  const response = await fetch('http://localhost:5118/api/Announcement/get-announcement-full-by-id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ announcementId, userId })
  });

  if (!response.ok) return;
  return await response.json();
};