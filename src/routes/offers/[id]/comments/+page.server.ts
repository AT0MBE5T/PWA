import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
    const { id: id } = params;

    const response = await fetch(`http://localhost:5118/api/Comment/get-comments-by-announcement-id/${id}`);
    
    if (response.ok) {
        const initialComments = await response.json();
        console.log(`${id} - ${initialComments}`);
        return { 
            id, 
            initialComments 
        };
    }

    return { id, initialComments: [] };
};
