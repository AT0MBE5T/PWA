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
import type { AnnouncementsResponse } from '$lib/interfaces/AnnouncementsResponse';

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
        try {
            const response = await fetch('http://localhost:5118/api/Announcement/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchData)
            });

            if (!response.ok) throw new Error("Server unreachable");

            const data = await response.json() as AnnouncementsResponse;
            const db = await this.getDB();

            const tx = db.transaction('announcements', 'readwrite');
            await Promise.all([
                ...data.data.map(item => tx.store.put(item)),
                tx.done
            ]);

            await Promise.allSettled(data.data.map(i => this.fetchAndCacheFullData(i.id)));

            return data.data;

        } catch (e) {
            const db = await this.getDB();
            const cached = await db.getAll('announcements');
            await new Promise(res => setTimeout(res, 500));
            return [...cached].sort((a, b) => b.viewsCnt - a.viewsCnt);
        }
    }

    private async fetchAndCacheFullData(id: string) {
        const db = await this.getDB();

        try {
            const [resFull, resComm, resQuest] = await Promise.all([
                fetch(`http://localhost:5118/api/Announcement/get-announcement-full-by-id/${id}`),
                fetch(`http://localhost:5118/api/Comment/get-comments-by-announcement-id/${id}`),
                fetch(`http://localhost:5118/api/Question/get-all-by-announcement-id/${id}`)
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
        } catch (e) {
            console.error(`Failed to background sync for ${id}`, e);
        }
    }

    async fetchLookupData(type: 'PropertyType' | 'StatementType') {
        const storeName = type === 'PropertyType' ? 'propertyTypes' : 'statementTypes';
        const url = type === 'PropertyType'
                    ? 'http://localhost:5118/api/PropertyType/get-property-types'
                    : 'http://localhost:5118/api/StatementType/get-statement-types';

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            const db = await this.getDB();
            const tx = db.transaction(storeName, 'readwrite');
            for (const item of data) await tx.store.put(item);
            await tx.done;

            return data;
        } catch (e) {
            const db = await this.getDB();
            return await db.getAll(storeName);
        }
    }

    async getPages(): Promise<number> {
        const storeName = 'page';
        const response = 'http://localhost:5118/api/Announcement/get-pages';

        try {
            const res = await fetch(response);
            if (!res.ok) throw new Error();
            const count = await res.json() as number;
            
            const db = await this.getDB();
            await db.put(storeName, count, 'totalPages');

            return count;
        } catch (e) {
            const db = await this.getDB();
            return await db.get(storeName, 'totalPages');
        }
    }

    getDB = async () => {
        return await openDB(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('page')) {
                    db.createObjectStore('page');
                }
                if (!db.objectStoreNames.contains('statementTypes')) {
                    db.createObjectStore('statementTypes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('propertyTypes')) {
                    db.createObjectStore('propertyTypes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('announcements')) {
                    db.createObjectStore('announcements', { keyPath: 'id' });
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
        if (this.offerDetails[id]) return;

        const db = await this.getDB();
        const cached = await db.get('announcementDetails', id);
        
        if (cached) {
            this.offerDetails[id] = cached;
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