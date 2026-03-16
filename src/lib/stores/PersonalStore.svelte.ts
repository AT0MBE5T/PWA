import type { AnnouncementShort } from "$lib/interfaces/AnnouncementShort";
import type { UserDto } from "$lib/interfaces/UserDto";
import type { UserStatsModel } from "$lib/interfaces/UserStatsModel";
import { openDB } from "idb";

class PersonalState {
    userDto = $state<UserDto>();
    userStatsModel = $state<UserStatsModel>();
    sold = $state<Record<string, AnnouncementShort[]>>({});
    favorite = $state<Record<string, AnnouncementShort[]>>({});
    placed = $state<Record<string, AnnouncementShort[]>>({});
    bought = $state<Record<string, AnnouncementShort[]>>({});

    DB_NAME = 'PersonalDB';
    DB_VERSION = 1;

    async setUserDto(data: UserDto, userId: string) {
        this.userDto = data;
        const db = await this.getDB();
        const tx = db.transaction('userDto', 'readwrite');
        await tx.store.put(data, userId);
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

    async setSold(userId: string, data: AnnouncementShort[]) {
        this.sold[userId] = data;
        const db = await this.getDB();
        const tx = db.transaction('sold', 'readwrite');
        for (const i of data) {
            await tx.store.put(i);
        }
        await tx.done;
    }

    async setPlaced(userId: string, data: AnnouncementShort[]) {
        this.placed[userId] = data;
        const db = await this.getDB();
        const tx = db.transaction('placed', 'readwrite');
        for (const i of data) {
            await tx.store.put(i);
        }
        await tx.done;
    }

    async setFavorite(userId: string, data: AnnouncementShort[]) {
        this.favorite[userId] = data;
        const db = await this.getDB();
        const tx = db.transaction('favorite', 'readwrite');
        for (const i of data) {
            await tx.store.put(i);
        }
        await tx.done;
    }

    async setBought(userId: string, data: AnnouncementShort[]) {
        this.bought[userId] = data;
        const db = await this.getDB();
        const tx = db.transaction('bought', 'readwrite');
        for (const i of data) {
            await tx.store.put(i);
        }
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
                if (!db.objectStoreNames.contains('sold')) {
                    db.createObjectStore('sold', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('placed')) {
                    db.createObjectStore('placed', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('favorite')) {
                    db.createObjectStore('favorite', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('bought')) {
                    db.createObjectStore('bought', { keyPath: 'id' });
                }
            },
        });
    };

    async loadUserDto(id: string) {
        if (this.userDto) return;

        const db = await this.getDB();
        const cached = await db.get('userDto', id);
        
        if (cached) {
            this.userDto = cached;
        }
    }

    async loadUserStatsDto(id: string) {
        if (this.userStatsModel) return;

        const db = await this.getDB();
        const cached = await db.get('userStats', id);
        
        if (cached) {
            this.userStatsModel = cached;
        }
    }

    async loadPlaced(id: string) {
        if (this.placed[id]) return;

        const db = await this.getDB();
        const cached = await db.getAll('placed');
        
        if (cached) {
            this.placed[id] = cached;
        }
    }

    async loadBought(id: string) {
        if (this.bought[id]) return;

        const db = await this.getDB();
        const cached = await db.getAll('bought');
        
        if (cached) {
            this.bought[id] = cached;
        }
    }

    async loadFavorite(id: string) {
        if (this.favorite[id]) return;

        const db = await this.getDB();
        const cached = await db.getAll('favorite');
        
        if (cached) {
            this.favorite[id] = cached;
        }
    }

    async loadSold(id: string) {
        if (this.sold[id]) return;

        const db = await this.getDB();
        const cached = await db.getAll('sold');
        
        if (cached) {
            this.sold[id] = cached;
        }
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