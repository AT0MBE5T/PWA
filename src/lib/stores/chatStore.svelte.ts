import type { Chat } from "$lib";
import type { Message } from "$lib";
import * as signalR from "@microsoft/signalr";
import { chatOfflineState } from "./ChatOfflineStore.svelte";

const chatState = createChatState();
export default chatState;

function createChatState() {
    let messages = $state<Message[]>([]);
    let chats = $state<Chat[]>([]);
    let connection = $state<signalR.HubConnection | null>(null);
    let isConnecting = false;

    async function initSignalR(chatId: string, userName: string) {
        if (isConnecting) return;
        
        if (connection && connection.state !== signalR.HubConnectionState.Disconnected) {
            return;
        }

        isConnecting = true;
        await stopSignalR();

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5118/messageHub", { withCredentials: true })
            .withAutomaticReconnect()
            .build();

    newConnection.on("ReceiveMessage", (uId, uName, content, chatId) => {
        messages.push({
            id: '',
            chatId,
            senderId: uId,
            senderName: uName,
            content,
            createdAt: new Date().toISOString(),
            isRead: false,
            isPending: false
        });
    });

    newConnection.on("UpdateChatList", (
        chatId: string,
        userId: string,
        userName: string,
        message: string
    ) => {
        const chatIndex = chats.findIndex(c => c.chatId === chatId);

        if (chatIndex !== -1) {
            chats[chatIndex].lastMessage = message;
            chats[chatIndex].lastMessageAt = new Date().toISOString();

            const [updatedChat] = chats.splice(chatIndex, 1);
            chats.unshift(updatedChat);
        } else {
            chats.unshift({
                avatarUrl: '',
                chatId: chatId,
                chatName: userName,
                lastMessage: message,
                lastMessageAt: new Date().toISOString(),
                unreadCount: '1'
            });
        }
    });

    newConnection.onreconnected(async () => {
        if (newConnection !== connection) return;

        console.log("Связь восстановлена, синхронизируем...");

        try {
            await newConnection.invoke("JoinChat", {
                ChatRoom: chatId,
                UserName: userName
            });

            const pending = await chatOfflineState.getPendingMessages();

            for (const msg of pending) {
                await newConnection.invoke("SendMessage", msg.chatId, msg.content);
                await chatOfflineState.removePendingMessage(msg.id);
            }

            messages = messages.filter(x => !x.isPending);
        } catch (e) {
            console.error("Sync error:", e);
        }
    });

    try {
            await newConnection.start();
            connection = newConnection;
            
            await connection.invoke("JoinChat", { ChatRoom: chatId, UserName: userName });
        } catch (err) {
            console.error("SignalR Start Error:", err);
        } finally {
            isConnecting = false; 
        }
    }

async function stopSignalR() {
        if (connection) {
            const oldConn = connection;
            connection = null;
            try {
                oldConn.off("ReceiveMessage");
                oldConn.off("UpdateChatList");
                await oldConn.stop();
            } catch (e) {}
        }
    }

    return {
        get messages() { return messages; },
        get chats() { return chats; },
        setMessages: (data: Message[]) => messages = data,
        setChats: (data: Chat[]) => chats = data,
        initSignalR,
        stopSignalR,
        sendMessage: async (userId: string, userName: string, chatId: string, text: string) => {
            const tempId = crypto.randomUUID();
            const pendingMsg: Message = {
                id: tempId,
                chatId: chatId,
                senderId: userId,
                content: text,
                createdAt: new Date().toISOString(),
                isRead: false,
                senderName: userName,
                isPending: true
            };

            messages = [...messages, pendingMsg]; 

            if (connection?.state === signalR.HubConnectionState.Connected) {
                try {
                    await connection.invoke("SendMessage", chatId, text);
                } catch (e) {
                    console.error("Ошибка отправки, сохраняем в outbox", e);
                    await chatOfflineState.savePendingMessage(pendingMsg);
                }
            } else {
                console.log("Оффлайн: сохраняем в очередь");
                await chatOfflineState.savePendingMessage(pendingMsg);
            }
        },
        leaveComment: async (chatId: string, text: string) => {
            if (connection) {
                await connection.invoke("LeaveComment", chatId, text);
            }
        }
    };
}