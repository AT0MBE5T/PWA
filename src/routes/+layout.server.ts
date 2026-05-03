import type { LayoutServerLoad } from './$types';

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
