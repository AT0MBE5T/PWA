import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals, fetch }) => {
    const userId = locals.user?.id;
    if (!userId) return { error: 'Unauthorized' };

    //const page = Number(url.searchParams.get('page')) || 1;
    const tab = url.searchParams.get('tab') || 'Favorite';

    return {
        currentTab: tab
    };
};
