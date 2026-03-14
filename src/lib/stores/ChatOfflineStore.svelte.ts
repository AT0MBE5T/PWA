import { openDB } from 'idb';
import type { Chat } from '$lib/interfaces/Chat';
import type { Message } from '$lib/interfaces/Message';

class ChatOfflineState {
    chats = $state<Record<string, Chat[]>>({});
    messages = $state<Record<string, Message[]>>({});

    DB_NAME = 'ChatsDB';
    DB_VERSION = 1;

    async setChats(userId: string, data: Chat[]) {
        this.chats[userId] = data;
        const db = await this.getDB();
        const tx = db.transaction('chats', 'readwrite');
        for (const i of data) {
            await tx.store.put(i);
        }
        await tx.done;
    }

    async setMessages(chatId: string, data: Message[]) {
        this.messages[chatId] = data;
        const db = await this.getDB();
        const tx = db.transaction('messages', 'readwrite');
        for (const i of data) {
            await tx.store.put(i);
        }
        await tx.done;
    }

    getDB = async () => {
        return await openDB(this.DB_NAME, this.DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('chats')) {
                    db.createObjectStore('chats', { keyPath: 'chatId' });
                }
                if (!db.objectStoreNames.contains('outbox')) {
                    db.createObjectStore('outbox', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('messages')) {
                    const store = db.createObjectStore('messages', { keyPath: 'id' });
                    store.createIndex('chatId', 'chatId', { unique: false });
                }
            },
        });
    };

    async savePendingMessage(msg: Message) {
        const db = await this.getDB();
        await db.put('outbox', msg);
    }

    async getPendingMessages(): Promise<Message[]> {
        const db = await this.getDB();
        return await db.getAll('outbox');
    }

    async removePendingMessage(tempId: string) {
        const db = await this.getDB();
        await db.delete('outbox', tempId);
    }

    async loadChats(id: string) {
        if (this.chats[id]) return;

        const db = await this.getDB();
        const cached = await db.getAll('chats');
        
        if (cached) {
            this.chats[id] = cached;
            console.log("Дані підтягнуто з IndexedDB:", cached);
        }
    }

    async loadMessages(id: string) {
        if (this.messages[id]) return;

        const db = await this.getDB();
        const cached = await db.getAllFromIndex('messages', 'chatId', id);
        if (cached) {
            this.messages[id] = cached;
            console.log("Дані підтягнуто з IndexedDB:", cached);
        }
    }

    async clearAllData() {
        this.chats = {};
        this.messages = {};

        const db = await this.getDB();
        const stores = ['chats', 'messages'];
        
        const tx = db.transaction(stores, 'readwrite');
        
        await Promise.all([
            ...stores.map(store => tx.objectStore(store).clear()),
            tx.done
        ]);

        console.log("ChatOfflineDB успешно очищена");
    }
}

export const chatOfflineState = new ChatOfflineState();