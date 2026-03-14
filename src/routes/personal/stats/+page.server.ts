import type { UserStatsModel } from '$lib';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
if (!locals.user) {
        return { stats: null };
    }

    // const response = await fetch('http://localhost:5118/api/Account/get-stats-by-user-id', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(locals.user.id)
    // });

    // const stats = response.ok ? await response.json() as UserStatsModel : null;

    return {
        // stats
    };
};
