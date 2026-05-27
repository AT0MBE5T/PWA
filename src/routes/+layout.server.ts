import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { auth, Roles } from '$lib';

export const load: LayoutServerLoad = async ({ locals, url }) => {
    const user = locals.user;
    const token = locals.token;
    const theme = locals.theme;
    const lang = locals.lang;

    if (url.pathname.startsWith('/personal') && !user) {
        throw redirect(303, '/login');
    }

    if (url.pathname.startsWith('/chats') && !user) {
        throw redirect(303, '/login');
    }

    if (url.pathname.startsWith('/reports') && !auth.hasRole(Roles.Admin)) {
        throw redirect(303, '/');
    }

    return {
        user,
        token,
        theme,
        lang
    };
};
