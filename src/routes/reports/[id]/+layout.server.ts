import type { LayoutServerLoad } from "../../$types";


export const load: LayoutServerLoad = async ({ params, locals }) => {
    const { id } = params;
    const userId = locals.user?.id;
    if (!userId) return { error: 'Unauthorized' };
    return {
        userUrl: id
    };
};
