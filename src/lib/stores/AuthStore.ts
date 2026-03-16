import { writable } from "svelte/store";
import type { AuthState } from '$lib';
import { goto } from "$app/navigation";
import { env } from "$env/dynamic/public";

function createAuthStore() {
    const initialState: AuthState = {
        id: null,
        name: null,
        avatarUrl: null,
        roles: [],
        isAuthenticated: false,
        accessToken: null,
        personName: null,
        personSurname: null
    };

    const { subscribe, set, update } = writable<AuthState>(initialState);

    return {
        subscribe,

        set,

        update,

        hasRole: (role: string) => {
            let currentRoles: string[] = [];
            subscribe(state => currentRoles = state.roles)();
            return currentRoles.includes(role);
        },
        
        sync: (user: { id: string | null, name: string | null, avatarUrl: string | null, roles: string[], personName: string | null, personSurname: string | null } | null, token: string | null) => {
            if (user && token) {
                set({
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    roles: user.roles,
                    isAuthenticated: true,
                    accessToken: token,
                    personName: user.personName,
                    personSurname: user.personSurname
                });
            } else {
                set(initialState);
            }
        },

        login: async (token: string) => {
            document.cookie = `accessToken=${token}; path=/; SameSite=Strict;`;
            await goto('/');
            window.location.reload();
        },

        logout: async () => {
            set(initialState);
            document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            try {
                await fetch(`${env.PUBLIC_API_URL}/api/Refresh/logout`, {
                    method: "GET",
                    credentials: "include"
                });
            } finally {
                goto('/login');
            }
        }
    };
}

export const auth = createAuthStore();