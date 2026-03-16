import type { UserDto } from "$lib";
import { auth, type JwtPayload } from "$lib";
import { Roles } from "$lib";
import { redirect, type Handle } from "@sveltejs/kit";
import { jwtDecode } from "jwt-decode";

export const handle: Handle = async ({ event, resolve }) => {
    let token = event.cookies.get('accessToken');

    if (token) {
        try {
            const decoded = jwtDecode<JwtPayload>(token);
            
            if (decoded.exp < Date.now() / 1000) {
                const newToken = await tryServerRefresh(event.fetch);
                if (newToken) {
                    token = newToken;
                    event.cookies.set('accessToken', token, { path: '/', httpOnly: false, sameSite: 'strict' });
                } else {
                    token = undefined;
                }
            }
        } catch {
            token = undefined;
        }
    }
    else{
        const newToken = await tryServerRefresh(event.fetch);
        if (newToken) {
            token = newToken;
            event.cookies.set('accessToken', token, { path: '/', httpOnly: false, sameSite: 'strict' });
        } else {
            token = undefined;
        }
    }

    if (token) {
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
    } else {
        event.locals.user = null;
    }

    const user = event.locals.user;
    const url = event.url.pathname;

    if (url.startsWith('/personal') && !user) {
        throw redirect(303, '/login');
    }

    if (url.startsWith('/chats') && !user) {
        throw redirect(303, '/login');
    }

    if (url.startsWith('/reports') && !auth.hasRole(Roles.Admin)) {
        throw redirect(303, '/');
    }

    return await resolve(event);
};

async function tryServerRefresh(svelteFetch: typeof fetch) {
    try{
        const response = await svelteFetch("http://localhost:5118/api/Refresh/refresh", {
            method: "POST"
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.token as string;
    }catch{

    }
}

const getUserDto = async (token: string): Promise<UserDto | null> => {
    try{
        const response = await fetch('http://localhost:5118/api/Account/get-user-dto-by-id', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

        const userData = response.ok ? await response.json() as UserDto : null;
        return userData;
    }catch(error){

    }
    return null;
}