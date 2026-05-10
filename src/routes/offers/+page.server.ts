import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
    const page = Number(url.searchParams.get('page'));

    return {
        currentPage: page
    };
};
