import { env } from "$env/dynamic/public";
import type { UserDto } from "$lib";
import { auth, settings, type JwtPayload } from "$lib";
import { Roles } from "$lib";
import { redirect, type Cookies, type Handle } from "@sveltejs/kit";
import { jwtDecode } from "jwt-decode";

export const handle: Handle = async ({ event, resolve }) => {
    let token = event.cookies.get('accessToken');

    const tryRefresh = async () => {
        const refreshToken = event.cookies.get('refreshToken');

        if (!refreshToken) return null;

        const response = await event.fetch(`${env.PUBLIC_API_URL}/api/refreshes/refresh`, {
            method: "POST",
            credentials: "include"
        });

        if (!response.ok) return null;

        const data = await response.json();

        event.cookies.set('accessToken', data.token, {
            path: '/',
            httpOnly: false,
            sameSite: 'strict'
        });

        return data.token;
    };

    if (token) {
        try {
            const decoded = jwtDecode<JwtPayload>(token);

            const isExpired = decoded.exp < Date.now() / 1000;

            if (isExpired) {
                token = await tryRefresh();
            }

        } catch {
            token = await tryRefresh();
        }
    }

    if (!token) {
        token = await tryRefresh();
    }

    if (token) {
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            const userDto = await getUserDto(token);

            event.locals.user = {
                id: decoded.sub,
                name: decoded.name ?? null,
                roles: Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles],
                avatarUrl: userDto?.avatarUrl ?? null,
                personName: decoded.name,
                personSurname: decoded.surname
            };

            event.locals.token = token;
        } catch {
            event.locals.user = null;
        }
    } else {
        event.locals.user = null;
    }

    event.locals.lang = event.cookies.get('lang') ?? 'UA';
    event.locals.theme = event.cookies.get('theme') ?? 'light';

    return resolve(event);
};

const getUserDto = async (token: string): Promise<UserDto | null> => {
    try{
        const response = await fetch(`${env.PUBLIC_API_URL}/api/accounts/get-user-dto`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        const userData = response.ok ? await response.json() as UserDto : null;
        settings.online = true;
        return userData;
    }catch(error){
        settings.online = false;
    }
    return null;
}