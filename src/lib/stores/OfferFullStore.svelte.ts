import type { AnnouncementFull } from '$lib/interfaces/AnnouncementFull';
import type { CommentInterface } from '$lib/interfaces/CommentInterface';
import type { QuestionAnswer } from '$lib/interfaces/QuestionAnswer';
import { openDB } from 'idb';
import type { AnnouncementShort } from '$lib/interfaces/AnnouncementShort';
import type { AnnouncementAddModel } from '$lib/interfaces/AnnouncementAddModel';
import type { PropertyTypeInterface } from '$lib/interfaces/PropertyTypeInterface';
import type { StatementTypeInterface } from '$lib/interfaces/StatementTypeInterface';
import type { AnnouncementUpdateModel } from '$lib/interfaces/AnnouncementUpdateModel';
import type { SearchRequestInterface } from '$lib/interfaces/SearchRequestInterface';
import { env } from '$env/dynamic/public';
import offerState from './offerStore.svelte';
import { settings } from './settings.svelte';
import getCookie from '$lib/utils/cookieData';

class OfferState {
    offerDetails = $state<Record<string, AnnouncementFull>>({});
    comments = $state<Record<string, CommentInterface[]>>({});
    questions = $state<Record<string, QuestionAnswer[]>>({});

    DB_NAME = 'OffersDB';
    DB_VERSION = 1;

    async setOfferDetails(data: AnnouncementFull[]) {
        const detailsMap = data.reduce((acc, item) => {
            acc[item.id] = item;
            return acc;
        }, { ...this.offerDetails });

        this.offerDetails = detailsMap;
    }

    async setComments(announcementId: string, data: any[]) {
        this.comments[announcementId] = data;
        const db = await this.getDB();
        const tx = db.transaction('comments', 'readwrite');
        for (const comment of data) {
            await tx.store.put(comment);
        }
        await tx.done;
    }

    async setQuestions(announcementId: string, data: any[]) {
        this.questions[announcementId] = data;
        const db = await this.getDB();
        const tx = db.transaction('questions', 'readwrite');
        for (const question of data) {
            await tx.store.put(question);
        }
        await tx.done;
    }

    async syncAnnouncements(searchData: SearchRequestInterface) {
        const db = await this.getDB();
        const cacheKey = await this.getCacheKey(searchData);

        const cachedPage = await db.get(
            'announcements_pages',
            `${cacheKey}_${searchData.page}`
        );

        if (cachedPage) {
            this.backgroundFetch(searchData);
            return {
                data: cachedPage.items,
                totalPages: cachedPage.totalPages
            };
        }

        try{
            return await this.fetchAndCache(searchData, cacheKey);
        }catch {
            const all = await db.getAllFromIndex(
                'announcements_pages',
                'cacheKey',
                cacheKey
            );

            if (all.length > 0) {
                const closest = all.sort((a, b) =>
                    Math.abs(a.page - searchData.page) - Math.abs(b.page - searchData.page)
                )[0];

                return {
                    data: closest.items,
                    totalPages: closest.totalPages,
                    page: closest.page
                };
            }

            return {
                data: [],
                totalPages: 0
            };
        }
    }

    private async getCacheKey(searchData: SearchRequestInterface) {
        return JSON.stringify({
            ...searchData,
            page: undefined
        });
    }

async updateCachedAnnouncement(announcementId: string, updatedData: Partial<AnnouncementShort>) {
    const db = await this.getDB();
    
    const allPages = await db.getAll('announcements_pages');

    for (const page of allPages) {
        const index = page.items.findIndex((item: { id: string | number }) => item.id === announcementId);
        
        if (index !== -1) {
            page.items[index] = { ...page.items[index], ...updatedData };
            await db.put('announcements_pages', page);
            break;
        }
    }
}

    async fetchAndCache(searchData: SearchRequestInterface, cacheKey: string) {
        try{
            const token = getCookie('accessToken');
            const response = await fetch(`${env.PUBLIC_API_URL}/api/announcements/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(searchData)
            });

            if (!response.ok) throw new Error("Server unreachable");
            const data = await response.json();

            const db = await this.getDB();

            await db.put('announcements_pages', {
                id: `${cacheKey}_${searchData.page}`,
                cacheKey,
                page: searchData.page,
                items: data.data,
                totalPages: data.totalPages,
                timestamp: Date.now()
            });
            settings.online = true;
            return data;
        }catch{
            settings.online = false;
            throw new Error();
        }
    }

    async backgroundFetch(searchData: SearchRequestInterface) {
        try {
            await this.fetchAndCache(searchData, await this.getCacheKey(searchData));
        } catch {}
    }

    private async fetchAndCacheFullData(id: string) {
        const db = await this.getDB();

        try {
            const [resFull, resComm, resQuest] = await Promise.all([
                fetch(`${env.PUBLIC_API_URL}/api/announcements/get-announcement-full-by-id/${id}`),
                fetch(`${env.PUBLIC_API_URL}/api/comments/get-comments-by-announcement-id/${id}`),
                fetch(`${env.PUBLIC_API_URL}/api/questions/get-all-by-announcement-id/${id}`)
            ]);

            if (resFull.ok) {
                const data = await resFull.json();
                await db.put('announcementDetails', data);
                this.offerDetails[id] = data;
            }

            if (resComm.ok) {
                const data = await resComm.json();
                await this.setComments(id, data);
            }

            if (resQuest.ok) {
                const data = await resQuest.json();
                await this.setQuestions(id, data);
            }
            settings.online = true;
        } catch (e) {
            console.error(`[App] Failed to background sync for ${id}`, e);
            settings.online = false;
        }
    }

    async fetchLookupData(type: 'PropertyType' | 'StatementType') {
        const storeName = type === 'PropertyType' ? 'propertyTypes' : 'statementTypes';
        const url = type === 'PropertyType'
                    ? `${env.PUBLIC_API_URL}/api/propertyTypes/get-property-types`
                    : `${env.PUBLIC_API_URL}/api/statementTypes/get-statement-types`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            const db = await this.getDB();
            const tx = db.transaction(storeName, 'readwrite');
            for (const item of data) await tx.store.put(item);
            await tx.done;
            settings.online = true;
            return data;
        } catch (e) {
            settings.online = false;
            const db = await this.getDB();
            return await db.getAll(storeName);
        }
    }

    getDB = async () => {
        return await openDB(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('statementTypes')) {
                    db.createObjectStore('statementTypes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('propertyTypes')) {
                    db.createObjectStore('propertyTypes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('announcements')) {
                    db.createObjectStore('announcements', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('announcements_pages')) {
                    const store = db.createObjectStore('announcements_pages', { keyPath: 'id' });
                    store.createIndex('cacheKey', 'cacheKey', { unique: false });
                    store.createIndex('page', 'page', { unique: false });
                }
                if (!db.objectStoreNames.contains('announcementDetails')) {
                    db.createObjectStore('announcementDetails', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('outboxQuestions')) {
                    db.createObjectStore('outboxQuestions', { keyPath: 'questionId' });
                }
                if (!db.objectStoreNames.contains('outboxComments')) {
                    db.createObjectStore('outboxComments', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('questions')) {
                    const store = db.createObjectStore('questions', { keyPath: 'questionId' });
                    store.createIndex('announcementId', 'announcementId', { unique: false });
                }
                if (!db.objectStoreNames.contains('comments')) {
                    const store = db.createObjectStore('comments', { keyPath: 'id' });
                    store.createIndex('announcementId', 'announcementId', { unique: false });
                }
                if (!db.objectStoreNames.contains('outboxOffers')) {
                    db.createObjectStore('outboxOffers', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('outboxOffersUpdate')) {
                    db.createObjectStore('outboxOffersUpdate', { keyPath: 'id' });
                }
            },
        });
    };

    async updateAnnouncementDetails(adId: string) {
        offerFullStore.offerDetails[adId].closedAt = (new Date()).toISOString();
        const db = await this.getDB();
        const tx = db.transaction('announcementDetails', 'readwrite');
        const store = tx.objectStore('announcementDetails');
        store.put(offerFullStore.offerDetails[adId], adId);
    }

    async updateAnnouncements(adId: string) {
        offerState.offers.find(x => x.id === adId)!.closedAt = (new Date()).toISOString();
        const db = await this.getDB();
        const tx = db.transaction('announcements', 'readwrite');
        const store = tx.objectStore('announcements');
        store.put(offerState.offers.find(x => x.id === adId), adId);
    }

    async getPropertyTypes(): Promise<PropertyTypeInterface[]> {
        const db = await this.getDB();
        return await db.getAll('propertyTypes');
    }

    async getStatementTypes(): Promise<StatementTypeInterface[]> {
        const db = await this.getDB();
        return await db.getAll('statementTypes');
    }

    async savePendingOffer(data: AnnouncementAddModel) {
        const db = await this.getDB();
        const cleanData = $state.snapshot(data);
        await db.put('outboxOffers', cleanData);
    }

    async addNewShortOffer(data: AnnouncementShort) {
        const db = await this.getDB();
        const cleanData = $state.snapshot(data);
        await db.put('announcements', cleanData);
    }

    async addNewFullOffer(data: AnnouncementFull) {
        const db = await this.getDB();
        await db.put('announcementDetails', $state.snapshot(data));
    }

    async removeOffer(id: string) {
        const db = await this.getDB();
        await db.delete('announcements', id);
    }

    async removeOfferFull(id: string) {
        const db = await this.getDB();
        await db.delete('announcementDetails', id);
    }

    async savePendingOfferUpdate(data: AnnouncementUpdateModel) {
        const db = await this.getDB();
        const cleanData = $state.snapshot(data);
        await db.put('outboxOffersUpdate', cleanData);
    }

    async getPendingOffers(): Promise<AnnouncementAddModel[]> {
        const db = await this.getDB();
        return await db.getAll('outboxOffers');
    }

    async getPendingOffersUpdate(): Promise<AnnouncementUpdateModel[]> {
        const db = await this.getDB();
        return await db.getAll('outboxOffersUpdate');
    }

    async removePendingOffers(tempId: string) {
        const db = await this.getDB();
        await db.delete('outboxOffers', tempId);
    }

    async removePendingOffersUpdate(tempId: string) {
        const db = await this.getDB();
        await db.delete('outboxOffersUpdate', tempId);
    }

    async savePendingComment(msg: CommentInterface) {
        const db = await this.getDB();
        await db.put('outboxComments', msg);
    }

    async getPendingComments(): Promise<CommentInterface[]> {
        const db = await this.getDB();
        return await db.getAll('outboxComments');
    }

    async removePendingComment(tempId: string) {
        const db = await this.getDB();
        await db.delete('outboxComments', tempId);
    }

    async savePendingQuestion(msg: QuestionAnswer) {
        const db = await this.getDB();
        await db.put('outboxQuestions', msg);
    }

    async getPendingQuestions(): Promise<QuestionAnswer[]> {
        const db = await this.getDB();
        return await db.getAll('outboxQuestions');
    }

    async removePendingQuestion(tempId: string) {
        const db = await this.getDB();
        await db.delete('outboxQuestions', tempId);
    }

    async loadDetails(id: string) {
        await this.fetchAndCacheFullData(id);
        if (this.offerDetails[id]) return;

        const db = await this.getDB();
        let cached = await db.get('announcementDetails', id);
        
        if (cached) {
            this.offerDetails[id] = cached;
        }
        else{
            this.fetchAndCacheFullData(id);
            cached = await db.get('announcementDetails', id);
            this.offerDetails[id] = cached
        }
    }

    async loadComments(id: string) {
        if (this.comments[id]) return;

        const db = await this.getDB();
        const cached = await db.getAllFromIndex('comments', 'announcementId', id);
        if (cached) {
            this.comments[id] = cached;
        }
    }

    async loadQuestions(id: string) {
        if (this.questions[id]) return;

        const db = await this.getDB();
        const cached = await db.getAllFromIndex('questions', 'announcementId', id);
        if (cached) {
            this.questions[id] = cached;
        }
    }
}

export const offerFullStore = new OfferState();