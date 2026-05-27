import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { auth, Roles } from '$lib';

export const load: LayoutServerLoad = async ({ locals }) => {
    const user = locals.user;
    const token = locals.token;
    const theme = locals.theme;
    const lang = locals.lang;

    return {
        user,
        token,
        theme,
        lang
    };
};
