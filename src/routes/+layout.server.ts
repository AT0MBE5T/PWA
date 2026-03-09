import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url, locals, fetch }) => {
    const user = locals.user;
    const token = locals.token;

    return {
        user,
        token
    };
};
