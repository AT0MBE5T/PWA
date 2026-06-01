import { writable } from "svelte/store";
import { settings, type AuthState } from '$lib';
import { goto } from "$app/navigation";
import { env } from "$env/dynamic/public";
import getCookie from "$lib/utils/cookieData";

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

login: async (token: string, refresh: string) => {
    const domain = window.location.hostname; 

    document.cookie = `accessToken=${token}; path=/; domain=${domain}; SameSite=Strict; Secure; Max-Age=900`;
    document.cookie = `refreshToken=${refresh}; path=/; domain=${domain}; SameSite=Strict; Secure; Max-Age=2592000`;
    
    await goto('/');
    window.location.reload();
},

        logout: async () => {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            await fetch(`${env.PUBLIC_API_URL}/api/notifications/unsubscribe`, {
                method: "POST",
                credentials: "include",
                headers:{
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${initialState.accessToken}`
                },
                body: JSON.stringify(subscription?.endpoint)
            });

            set(initialState);
            document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
            try {
                await fetch(`${env.PUBLIC_API_URL}/api/refreshes/logout`, {
                    method: "POST",
                    credentials: "include"
                });
                settings.online = true;
            }catch{
                settings.online = false;
            } finally {
                window.location.reload();
                await goto('/login');
            }
        }
    };
}

export const auth = createAuthStore();