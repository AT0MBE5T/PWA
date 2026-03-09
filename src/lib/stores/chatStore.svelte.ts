import type { Chat } from "$lib";
import type { Message } from "$lib";
import * as signalR from "@microsoft/signalr";

export default function createChatState() {
    let messages = $state<Message[]>([]);
    let chats = $state<Chat[]>([]);
    let connection = $state<signalR.HubConnection | null>(null);

async function initSignalR(chatId: string, userName: string) {
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
            isRead: false
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

    try {
        await newConnection.start();

        if (newConnection.state !== signalR.HubConnectionState.Connected) return;

        connection = newConnection;

        await connection.invoke("JoinChat", { 
            ChatRoom: chatId, 
            UserName: userName
        });
    } catch (err: any) {
        const ignoredErrors = [
            "Invocation canceled due to the underlying connection being closed",
            "Connection disconnected",
            "Connection lost"
        ];

        const errorMessage = err?.message || String(err);
        const isIgnored = ignoredErrors.some(msg => errorMessage.includes(msg));

        if (!isIgnored) {
            console.error("SignalR Critical Error:", err);
        } else {
            console.warn("SignalR: Connection closed during initialization (expected on nav).");
        }
    }
}

async function stopSignalR() {
    if (connection) {
        const oldConn = connection;
        connection = null;
        
        try {
            oldConn.off("ReceiveMessage");
            await oldConn.stop();
        } catch (e) {

        }
    }
}

    return {
        get messages() { return messages; },
        get chats() { return chats; },
        setMessages: (data: Message[]) => messages = data,
        setChats: (data: Chat[]) => chats = data,
        initSignalR,
        stopSignalR,
        sendMessage: async (chatId: string, text: string) => {
            if (connection) {
                await connection.invoke("SendMessage", chatId, text);
            }
        },
        leaveComment: async (chatId: string, text: string) => {
            if (connection) {
                await connection.invoke("LeaveComment", chatId, text);
            }
        }
    };
}