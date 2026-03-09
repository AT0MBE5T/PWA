import type { UserDto } from '$lib';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
    if (!locals.user) {
        return { userInfo: null };
    }

    const response = await fetch('http://localhost:5118/api/Account/get-user-dto-by-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locals.user.id)
    });

    const userData = response.ok ? await response.json() as UserDto : null;

    return {
        userInfo: userData
    };
};