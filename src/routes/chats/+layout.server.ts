import type { Chat } from '$lib';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ fetch, locals }) => {
    if (!locals.user) return { chats: [] };

    const response = await fetch('http://localhost:5118/api/Chat/my-chats');
    
    if (response.ok) {
        const chats = await response.json() as Chat[];
        return { chats };
    }

    return { chats: [] };
};