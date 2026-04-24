import { env } from "$env/dynamic/public";
import type { AnnouncementsResponse } from "$lib/interfaces/AnnouncementsResponse";
import type { UserDto } from "$lib/interfaces/UserDto";
import type { UserStatsModel } from "$lib/interfaces/UserStatsModel";
import getCookie from "$lib/utils/cookieData";
import { getItemsProfilePerPage } from "$lib/utils/paginationProfile";
import { openDB } from "idb";
import type { ComplaintGrid } from "$lib/interfaces/ComplaintGrid";
import { settings } from "./settings.svelte";

class PersonalState {
    userDto = $state<UserDto>();
    userComplaints = $state<Record<string, ComplaintGrid[]>>({});
    userStatsModel = $state<UserStatsModel>();
    sold = $state<Record<string, AnnouncementsResponse>>({});
    favorite = $state<Record<string, AnnouncementsResponse>>({});
    placed = $state<Record<string, AnnouncementsResponse>>({});
    bought = $state<Record<string, AnnouncementsResponse>>({});

    DB_NAME = 'PersonalDB';
    DB_VERSION = 1;

    async setUserDto(data: UserDto, userId: string) {
        this.userDto = data;
        const db = await this.getDB();
        const tx = db.transaction('userDto', 'readwrite');
        await tx.store.put(data, userId);
        await tx.done;
    }

    async setUserComplaints(userId: string, page: number, data: ComplaintGrid[]) {
        this.userComplaints[userId] = data;

        const record = { 
            ...data, 
            userId: userId, 
            page: page 
        };

        const db = await this.getDB();
        const tx = db.transaction('userComplaints', 'readwrite');
        await tx.store.put(record);
        await tx.done;
    }

    async updateEmail(userId: string, email: string) {
        if (!this.userDto) return;

        this.userDto.email = email;

        const db = await this.getDB();
        
        const tx = db.transaction('userDto', 'readwrite');
        const store = tx.objectStore('userDto');
        const data = await store.get(userId) as UserDto;

        if (data) {
            data.email = email;
            await store.put($state.snapshot(data), userId);
        }

        await tx.done;
    }

    async updatePhone(userId: string, phone: string) {
        if (!this.userDto) return;

        this.userDto.phoneNumber = phone;

        const db = await this.getDB();
        
        const tx = db.transaction('userDto', 'readwrite');
        const store = tx.objectStore('userDto');
        const data = await store.get(userId) as UserDto;

        if (data) {
            data.phoneNumber = phone;
            await store.put($state.snapshot(data));
        }

        await tx.done;
    }

    async setUserStatsModel(data: UserStatsModel, userId: string) {
        this.userStatsModel = data;
        const db = await this.getDB();
        const tx = db.transaction('userStats', 'readwrite');
        await tx.store.put(data, userId);
        await tx.done;
    }

    async setSold(userId: string, page: number, data: AnnouncementsResponse) {
        this.sold[userId] = data;

        const record = { 
            ...data, 
            userId: userId, 
            page: page 
        };

        const db = await this.getDB();
        const tx = db.transaction('sold', 'readwrite');
        await tx.store.put(record);
        await tx.done;
    }

    async setPlaced(userId: string, page: number, data: AnnouncementsResponse) {
        this.placed[userId] = data;

        const record = { 
            ...data, 
            userId: userId, 
            page: page 
        };

        const db = await this.getDB();
        const tx = db.transaction('placed', 'readwrite');
        await tx.store.put(record);
        await tx.done;
    }

    async setFavorite(userId: string, page: number, data: AnnouncementsResponse) {
        this.favorite[userId] = data;

        const record = { 
            ...data, 
            userId: userId, 
            page: page 
        };

        const db = await this.getDB();
        const tx = db.transaction('favorite', 'readwrite');
        await tx.store.put(record);
        await tx.done;
    }

    async setBought(userId: string, page: number, data: AnnouncementsResponse) {
        this.bought[userId] = data;

        const record = { 
            ...data, 
            userId: userId, 
            page: page 
        };

        const db = await this.getDB();
        const tx = db.transaction('bought', 'readwrite');
        await tx.store.put(record);
        await tx.done;
    }

    getDB = async () => {
        return await openDB(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('userDto')) {
                    db.createObjectStore('userDto');
                }
                if (!db.objectStoreNames.contains('userStats')) {
                    db.createObjectStore('userStats');
                }
                if (!db.objectStoreNames.contains('placed')) {
                    const store = db.createObjectStore('placed', { keyPath: ['userId', 'page', 'pageSize'] });
                    store.createIndex('userId_pageSize', ['userId', 'pageSize'], { unique: false });
                }
                if (!db.objectStoreNames.contains('sold')) {
                    const store = db.createObjectStore('sold', { keyPath: ['userId', 'page', 'pageSize'] });
                    store.createIndex('userId_pageSize', ['userId', 'pageSize'], { unique: false });
                }
                if (!db.objectStoreNames.contains('favorite')) {
                    const store = db.createObjectStore('favorite', { keyPath: ['userId', 'page', 'pageSize'] });
                    store.createIndex('userId_pageSize', ['userId', 'pageSize'], { unique: false });
                }
                if (!db.objectStoreNames.contains('bought')) {
                    const store = db.createObjectStore('bought', { keyPath: ['userId', 'page', 'pageSize'] });
                    store.createIndex('userId_pageSize', ['userId', 'pageSize'], { unique: false });
                }
                if (!db.objectStoreNames.contains('userComplaints')) {
                    db.createObjectStore('userComplaints', { keyPath: ['userId', 'page'] });
                }
            },
        });
    };

    async loadUserDto(id: string) {
        const db = await this.getDB();
        const cached = await db.get('userDto', id);

        if (cached) {
            this.userDto = cached;
        }

        try {
            const accessToken = getCookie('accessToken');
            const response = await fetch(`${env.PUBLIC_API_URL}/api/accounts/get-user-dto`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const userData = response.ok ? await response.json() as UserDto : null;

            if (!userData)
                return;
            
            await this.setUserDto(userData, id);
            settings.online = true;
        } catch (e) {
            settings.online = false;
        }
    }

    async loadUserComplaints(id: string) {
        const db = await this.getDB();
        const cached = await db.get('userComplaints', id);

        if (cached) {
            this.userComplaints = cached;
        }

        try {
            const accessToken = getCookie('accessToken');
            const response = await fetch(`${env.PUBLIC_API_URL}/api/complaints/get-by-user-id/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const complaints = response.ok ? await response.json() as ComplaintGrid[] : null;

            if (!complaints)
                return;
            
            await this.setUserComplaints(id, 1, complaints);
            settings.online = true;
        } catch (e) {
            settings.online = false;
        }
    }

    async loadUserStatsDto(id: string) {

        const db = await this.getDB();
        const cached = await db.get('userStats', id);
        
        if (cached) {
            this.userStatsModel = cached;
        }

        try {
            const accessToken = getCookie('accessToken');
            const response = await fetch(`${env.PUBLIC_API_URL}/api/accounts/get-stats`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const userData = response.ok ? await response.json() as UserStatsModel : null;

            if (!userData)
                return;
            
            await this.setUserStatsModel(userData, id);
            settings.online = true;
        } catch (e) {
            settings.online = false;
        }
    }

    async loadPlaced(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        const db = await this.getDB();
        const pageSize = getItemsProfilePerPage();
        const key = [userId, page, pageSize];

        const cached = await db.get('placed', key);

        const MAX_AGE = 1000 * 60 * 5;

        if (cached) {
            this.placed[userId] = cached;

            if (!cached.timestamp || Date.now() - cached.timestamp > MAX_AGE) {
                this.fetchPlacedAndCache(userId, page);
            }

            return cached;
        }

        return await this.fetchPlacedAndCache(userId, page);
    }

    async fetchPlacedAndCache(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        try {
            const accessToken = getCookie('accessToken');

            const response = await fetch(
                `${env.PUBLIC_API_URL}/api/announcements/get-placed?page=${page}&pageSize=${getItemsProfilePerPage()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const freshData: AnnouncementsResponse = await response.json();

            const pageSize = getItemsProfilePerPage();

            await this.setPlaced(userId, page, {
                ...freshData,
                page,
                pageSize,
                userId,
                timestamp: Date.now()
            });

            this.placed[userId] = freshData;

            settings.online = true;

            return freshData;

        } catch (e) {
            settings.online = false;
            return await this.handleOfflinePlaced(userId, page);
        }
    }

    async handleOfflinePlaced(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        const db = await this.getDB();
        const pageSize = getItemsProfilePerPage();
        const exact = await db.get('placed', [userId, page, pageSize]);
        if (exact) {
            this.placed[userId] = exact;
            return exact;
        }

        const all = await db.getAllFromIndex(
            'placed',
            'userId_pageSize',
            [userId, pageSize]
        );

        if (all.length > 0) {
            const closest = all.sort((a, b) =>
                Math.abs(a.page - page) - Math.abs(b.page - page)
            )[0];

            this.placed[userId] = closest;
            return closest;
        }

        this.placed[userId] = { data: [], totalPages: 0, totalItems: 0, page: 0, pageSize: 0, timestamp: Date.now(), userId: '' };
        return null;
    }

    async loadSold(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        const db = await this.getDB();
        const pageSize = getItemsProfilePerPage();
        const key = [userId, page, pageSize];

        const cached = await db.get('sold', key);

        const MAX_AGE = 1000 * 60 * 5;

        if (cached) {
            this.sold[userId] = cached;

            if (!cached.timestamp || Date.now() - cached.timestamp > MAX_AGE) {
                this.fetchSoldAndCache(userId, page);
            }

            return cached;
        }

        return await this.fetchSoldAndCache(userId, page);
    }

    async fetchSoldAndCache(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        try {
            const accessToken = getCookie('accessToken');

            const response = await fetch(
                `${env.PUBLIC_API_URL}/api/announcements/get-sold?page=${page}&pageSize=${getItemsProfilePerPage()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const freshData: AnnouncementsResponse = await response.json();

            const pageSize = getItemsProfilePerPage();

            await this.setSold(userId, page, {
                ...freshData,
                page,
                pageSize,
                userId,
                timestamp: Date.now()
            });

            this.sold[userId] = freshData;

            settings.online = true;

            return freshData;

        } catch (e) {
            settings.online = false;
            return await this.handleOfflineSold(userId, page);
        }
    }

    async handleOfflineSold(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        const db = await this.getDB();
        const pageSize = getItemsProfilePerPage();
        const exact = await db.get('sold', [userId, page, pageSize]);
        if (exact) {
            this.sold[userId] = exact;
            return exact;
        }

        const all = await db.getAllFromIndex(
            'sold',
            'userId_pageSize',
            [userId, pageSize]
        );

        if (all.length > 0) {
            const closest = all.sort((a, b) =>
                Math.abs(a.page - page) - Math.abs(b.page - page)
            )[0];

            this.sold[userId] = closest;
            return closest;
        }

        this.sold[userId] = { data: [], totalPages: 0, totalItems: 0, page: 0, pageSize: 0, timestamp: Date.now(), userId: '' };
        return null;
    }

    async loadBought(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        const db = await this.getDB();
        const pageSize = getItemsProfilePerPage();
        const key = [userId, page, pageSize];

        const cached = await db.get('bought', key);

        const MAX_AGE = 1000 * 60 * 5;

        if (cached) {
            this.bought[userId] = cached;

            if (!cached.timestamp || Date.now() - cached.timestamp > MAX_AGE) {
                this.fetchBoughtAndCache(userId, page);
            }

            return cached;
        }

        return await this.fetchBoughtAndCache(userId, page);
    }

    async fetchBoughtAndCache(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        try {
            const accessToken = getCookie('accessToken');

            const response = await fetch(
                `${env.PUBLIC_API_URL}/api/announcements/get-bought?page=${page}&pageSize=${getItemsProfilePerPage()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const freshData: AnnouncementsResponse = await response.json();

            const pageSize = getItemsProfilePerPage();

            await this.setBought(userId, page, {
                ...freshData,
                page,
                pageSize,
                userId,
                timestamp: Date.now()
            });

            this.bought[userId] = freshData;

            settings.online = true;

            return freshData;

        } catch (e) {
            settings.online = false;
            return await this.handleOfflineBought(userId, page);
        }
    }

    async handleOfflineBought(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        const db = await this.getDB();
        const pageSize = getItemsProfilePerPage();
        const exact = await db.get('bought', [userId, page, pageSize]);
        if (exact) {
            this.sold[userId] = exact;
            return exact;
        }

        const all = await db.getAllFromIndex(
            'bought',
            'userId_pageSize',
            [userId, pageSize]
        );

        if (all.length > 0) {
            const closest = all.sort((a, b) =>
                Math.abs(a.page - page) - Math.abs(b.page - page)
            )[0];

            this.bought[userId] = closest;
            return closest;
        }

        this.bought[userId] = { data: [], totalPages: 0, totalItems: 0, page: 0, pageSize: 0, timestamp: Date.now(), userId: '' };
        return null;
    }

    async loadFavorite(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        const db = await this.getDB();
        const pageSize = getItemsProfilePerPage();
        const key = [userId, page, pageSize];

        const cached = await db.get('favorite', key);

        const MAX_AGE = 1000 * 60 * 5;

        if (cached) {
            this.favorite[userId] = cached;

            if (!cached.timestamp || Date.now() - cached.timestamp > MAX_AGE) {
                this.fetchFavoriteAndCache(userId, page);
            }

            return cached;
        }

        return await this.fetchFavoriteAndCache(userId, page);
    }

    async fetchFavoriteAndCache(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        try {
            const accessToken = getCookie('accessToken');

            const response = await fetch(
                `${env.PUBLIC_API_URL}/api/favorites/get-favorites?page=${page}&pageSize=${getItemsProfilePerPage()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const freshData: AnnouncementsResponse = await response.json();

            const pageSize = getItemsProfilePerPage();

            await this.setFavorite(userId, page, {
                ...freshData,
                page,
                pageSize,
                userId,
                timestamp: Date.now()
            });

            this.favorite[userId] = freshData;

            settings.online = true;

            return freshData;

        } catch (e) {
            settings.online = false;
            return await this.handleOfflineFavorite(userId, page);
        }
    }

    async handleOfflineFavorite(userId: string, page: number): Promise<AnnouncementsResponse | null> {
        const db = await this.getDB();
        const pageSize = getItemsProfilePerPage();
        const exact = await db.get('favorite', [userId, page, pageSize]);
        if (exact) {
            this.favorite[userId] = exact;
            return exact;
        }

        const all = await db.getAllFromIndex(
            'favorite',
            'userId_pageSize',
            [userId, pageSize]
        );

        if (all.length > 0) {
            const closest = all.sort((a, b) =>
                Math.abs(a.page - page) - Math.abs(b.page - page)
            )[0];

            this.favorite[userId] = closest;
            return closest;
        }

        this.favorite[userId] = { data: [], totalPages: 0, totalItems: 0, page: 0, pageSize: 0, timestamp: Date.now(), userId: '' };
        return null;
    }

    async clearAllData() {
        this.userDto = undefined;
        this.userStatsModel = undefined;
        this.sold = {};
        this.favorite = {};
        this.placed = {};
        this.bought = {};

        const db = await this.getDB();
        const stores = ['userDto', 'userStats', 'sold', 'placed', 'favorite', 'bought'];
        
        const tx = db.transaction(stores, 'readwrite');
        
        await Promise.all([
            ...stores.map(store => tx.objectStore(store).clear()),
            tx.done
        ]);
    }
}

export const personalStore = new PersonalState();