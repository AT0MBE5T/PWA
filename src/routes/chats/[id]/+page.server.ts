import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
    const { id: chatId } = params;

    const response = await fetch(`http://localhost:5118/api/Chat/get-messages-by-chat-id/${chatId}`);
    
    if (response.ok) {
        const initialMessages = await response.json();
        return { 
            chatId, 
            initialMessages 
        };
    }

    return { chatId, initialMessages: [] };
};
