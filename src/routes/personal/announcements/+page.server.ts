import type { AnnouncementsResponse, AnnouncementStatRequest } from '$lib';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals, fetch }) => {
    const userId = locals.user?.id;
    if (!userId) return { error: 'Unauthorized' };

    const page = Number(url.searchParams.get('page')) || 1;
    const tab = url.searchParams.get('tab') || 'Favorite';

    const fetchers = {
        'Sold': getSold,
        'Placed': getPlaced,
        'Bought': getBought,
        'Favorite': getFavorites
    };

    const fetchFn = fetchers[tab as keyof typeof fetchers] || getFavorites;
    const result = await fetchFn(userId, page, fetch);

    return {
        items: result?.data,
        totalPages: result?.totalPages,
        currentPage: page,
        currentTab: tab
    };
};

const getSold = async (
    userId: string, 
    page: number, 
    fetch: typeof globalThis.fetch 
): Promise<AnnouncementsResponse | null> => {
    const sendData: AnnouncementStatRequest = { userId, page };

    const response = await fetch('http://localhost:5118/api/Announcement/get-sold-by-user-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendData)
    });

    if (!response.ok) return null;

    return await response.json() as AnnouncementsResponse;
};

const getFavorites = async (
    userId: string, 
    page: number, 
    fetch: typeof globalThis.fetch 
): Promise<AnnouncementsResponse | null> => {
    const sendData: AnnouncementStatRequest = { userId, page };

    const response = await fetch('http://localhost:5118/api/Favorite/get-favorites-by-user-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sendData)
    });

    if (!response.ok) return null;

    return await response.json() as AnnouncementsResponse;
};

const getPlaced = async (
    userId: string, 
    page: number, 
    fetch: typeof globalThis.fetch
): Promise<AnnouncementsResponse | null> => {
    const sendData: AnnouncementStatRequest = { userId, page };

        const response = await fetch('http://localhost:5118/api/Announcement/get-placed-by-user-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendData)
        });

    if (!response.ok) return null;

    return await response.json() as AnnouncementsResponse;
};

const getBought = async (
    userId: string, 
    page: number, 
    fetch: typeof globalThis.fetch 
): Promise<AnnouncementsResponse | null> => {
    const sendData: AnnouncementStatRequest = { userId, page };

        const response = await fetch('http://localhost:5118/api/Announcement/get-bought-by-user-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sendData)
        });

    if (!response.ok) return null;

    return await response.json() as AnnouncementsResponse;
};
