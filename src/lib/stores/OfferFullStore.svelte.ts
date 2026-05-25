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
import { getItemsPerPage } from '$lib/utils/pagination';
import * as signalR from "@microsoft/signalr";
import { toast } from './toast';
import { getContext } from 'svelte';
import type SettingsStore from './settingsStore.svelte';
import { translations } from '$lib/i18n';
import { goto } from '$app/navigation';

class OfferState {
    offerDetails = $state<Record<string, AnnouncementFull>>({});
    comments = $state<Record<string, CommentInterface[]>>({});
    questions = $state<Record<string, QuestionAnswer[]>>({});
    
    searchDataVar = $state<SearchRequestInterface>();

    connection = $state<signalR.HubConnection | null>(null);

    abortController: AbortController | null = null;

    DB_NAME = 'OffersDB';
    DB_VERSION = 1;

    public async initSignalR(chatId: string, userName: string, settingsStore: SettingsStore, userId: string) {
        await this.stopSignalR();

            if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${env.PUBLIC_API_URL}/messageHub`, { withCredentials: true })
            .withAutomaticReconnect()
            .build();

        const t = $derived(translations[settingsStore.lang]);
    
        newConnection.on("UpdateFullOffer", async (changedById: string, offer: AnnouncementFull) => {
            const oldFavorite = this.offerDetails[offer.id].isFavorite;
            this.offerDetails[offer.id] = offer;
            this.offerDetails[offer.id].isFavorite = oldFavorite;

            if (changedById === userId)
                toast.show(t.system.updatedSuccessfully, 'success', 5000);
            else
                toast.show(t.offers.offerHasBeenChanged, 'info', 5000);
            await goto(`/offers/${offer.id}/description`);
        });

        newConnection.on("DeleteFullOffer", async () => {
            toast.show(t.offers.offerHasBeenRemoved, 'info', 5000);
            await goto('/offers?page=1');
        });

            newConnection.onreconnected(async () => {
                if (newConnection !== this.connection) return;
        
                try {
                    await newConnection.invoke("JoinRoom", {
                        ChatRoom: chatId,
                        UserName: userName
                    });

                } catch (e) {
                    console.error("[App] Sync error:", e);
                }
            });

            try {
                await newConnection.start();

                if (signal.aborted) {
                    await newConnection.stop();
                    return;
                }
                
                if (newConnection.state !== signalR.HubConnectionState.Connected) return;
        
                this.connection = newConnection;
        
                await this.connection.invoke("JoinRoom", { 
                    ChatRoom: chatId, 
                    UserName: userName
                });
            } catch (err: any) {
        if (signal.aborted) return;

        const ignoredErrors = ["connection being closed", "Connection disconnected", "Connection lost"];
        const errorMessage = err?.message || String(err);
        
        if (!ignoredErrors.some(msg => errorMessage.includes(msg))) {
            console.error("[App] SignalR Critical Error:", err);
        }
        }
    }

    public async stopSignalR() {
        if (this.connection) {
            const oldConn = this.connection;
            this.connection = null;
            
            try {
                oldConn.off("UpdateFullOffer");
                oldConn.off("DeleteFullOffer");
                await oldConn.stop();
            } catch (e) {

            }
        }
    }

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

    async getAnnouncementToFill() {
        const searchData = this.searchDataVar ?? { filters: [] , limit: getItemsPerPage(), page: 1, sortId: 0, text: '' };
        const db = await this.getDB();
        const cacheKey = await this.getCacheKey(searchData);

        const cachedPage = await db.get(
            'announcements_pages',
            `${cacheKey}_${searchData.page + 1}`
        );

        if (cachedPage && cachedPage.items.length === 0){
            const cachedPagePrev = await db.get(
                'announcements_pages',
                `${cacheKey}_${searchData.page - 1}`
            );

            if (cachedPagePrev && cachedPagePrev.items.length === 0){
                return null;
            }

            return cachedPagePrev.items[cachedPagePrev.items.length - 1];
        }

        return cachedPage.items[0];
    }

    async syncAnnouncements(searchData: SearchRequestInterface) {
        this.searchDataVar = searchData;
        const db = await this.getDB();
        const cacheKey = await this.getCacheKey(searchData);

        const cachedPage = await db.get(
            'announcements_pages',
            `${cacheKey}_${searchData.page}`
        );

        if (cachedPage) {
            try{
                const onlineData = await this.fetchAndCache(searchData, cacheKey);
                return {
                    data: onlineData.data,
                    totalPages: onlineData.totalPages,
                    page: searchData.page
                };
            }catch{
                return {
                    data: cachedPage.items,
                    totalPages: cachedPage.totalPages,
                    page: searchData.page
                };
            }
        }

        try{
            if (searchData.filters.length !== 0 || searchData.sortId > 0 || searchData.text !== ""){
                searchData.page = 1;
            }
            const onlineData = await this.fetchAndCache(searchData, cacheKey);
            if (onlineData === undefined){
                return await this.getNearestPage(searchData);
            }
            return {
                data: onlineData.data,
                totalPages: onlineData.totalPages,
                page: searchData.page
            };
        }catch {
            if (searchData.filters.length === 0 && searchData.sortId === 0 && searchData.text === ''){
                return await this.getNearestPage(searchData);
            }
            else{
                searchData.page = 1;
                const { data } = await this.searchInCache(searchData);            
                return {
                    data: data,
                    totalPages: 1,
                    page: 1
                };
            }            
        }
    }

    private async getNearestPage(searchData: SearchRequestInterface){
        const db = await this.getDB();
        const cacheKey = await this.getCacheKey(searchData);
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
            totalPages: 1,
            page: 1
        };
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

            if (searchData.page > data.totalPages || searchData.page < 1)
                return undefined;

            if (searchData.filters.length !== 0 || searchData.sortId > 0 || searchData.text !== ""){
                return data;
            }

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

async searchInCache(searchData: SearchRequestInterface) {
    const db = await this.getDB();

    const allPages = await db.getAllFromIndex(
        'announcements_pages',
        'cacheKey'
    );

    const allItems = Array.from(
        new Map(allPages.flatMap(page => page.items).map(item => [item.id, item])).values()
    );

    let filteredText = allItems.filter(item => {
        const query = searchData.text?.toLowerCase() || '';
        return item.title.toLowerCase().includes(query);
    });

    const propertyTypes = await this.getPropertyTypes();
    const statementTypes = await this.getStatementTypes();

const selectedPropertyNames = propertyTypes
    .filter(pt => searchData.filters.includes(pt.id))
    .map(pt => pt.name);

const selectedStatementNames = statementTypes
    .filter(st => searchData.filters.includes(st.id))
    .map(st => st.name);

const filteredResults = filteredText.filter(item => {
    if (searchData.filters.length === 0) return true;

    const propertyMatch = selectedPropertyNames.length === 0 || 
                          selectedPropertyNames.includes(item.propertyTypeName);

    const statementMatch = selectedStatementNames.length === 0 || 
                           selectedStatementNames.includes(item.statementTypeName);

    return propertyMatch && statementMatch;
});

    if (searchData.sortId > 0){
        switch (searchData.sortId){
            case 1:
                filteredResults.sort((a, b) => b.price - a.price);
                break;
            case 2:
                filteredResults.sort((a, b) => b.area - a.area);
                break;
            case 3:
                filteredResults.sort((a, b) => b.rooms - a.rooms);
                break;
            case 4:
                filteredResults.sort((a, b) => b.floors - a.floors);
                break;
            case 5:
                filteredResults.sort((a, b) => b.viewsCnt - a.viewsCnt);
                break;
            case 6:
                filteredResults.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
                break;
            case 7:
                filteredResults.sort((a, b) => a.price - b.price);
                break;
            case 8:
                filteredResults.sort((a, b) => a.area - b.area);
                break;
            case 9:
                filteredResults.sort((a, b) => a.rooms - b.rooms);
                break;
            case 10:
                filteredResults.sort((a, b) => a.floors - b.floors);
                break;
            case 11:
                filteredResults.sort((a, b) => a.viewsCnt - b.viewsCnt);
                break;
            case 12:
                filteredResults.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
                break;
        }
    }

    return {
        data: filteredResults
    };
}

    private async fetchAndCacheFullData(id: string) {
        const db = await this.getDB();

        try {
            const token = getCookie('accessToken');
            const [resFull, resComm, resQuest] = await Promise.all([
                fetch(`${env.PUBLIC_API_URL}/api/announcements/get-announcement-full-by-id/${id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                ),
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

    const allPages = await db.getAll('announcements_pages');
    
    if (allPages.length > 0) {
        const firstPage = allPages[0];
        firstPage.items.unshift(cleanData);
        await db.put('announcements_pages', firstPage);
    } else {
        await db.put('announcements_pages', {
            id: 1,
            items: [cleanData]
        });
    }
}

async addNewFullOffer(data: AnnouncementFull) {
    const db = await this.getDB();
    const cleanData = $state.snapshot(data);
    
    await db.put('announcementDetails', cleanData);
}

async removeOffer(id: string) {
    const db = await this.getDB();
    await db.delete('announcementDetails', id);
    const allPages = await db.getAll('announcements_pages');

    for (const page of allPages) {
        const index = page.items.findIndex((item: any) => String(item.id) === String(id));

        if (index !== -1) {
            const updatedItems = [...page.items];
            updatedItems.splice(index, 1);

            if (updatedItems.length === 0) {
                await db.delete('announcements_pages', page.id);
            } else {
                await db.put('announcements_pages', {
                    ...page,
                    items: updatedItems
                });
            }
        }
    }
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