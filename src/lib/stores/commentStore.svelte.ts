import type { CommentInterface } from "$lib/interfaces/CommentInterface";
import * as signalR from "@microsoft/signalr";

export default function createCommentState() {
    let comments = $state<CommentInterface[]>([]);
    let connection = $state<signalR.HubConnection | null>(null);
    let abortController: AbortController | null = null;

async function initSignalR(chatId: string, userName: string) {
    if (abortController) abortController.abort();
    abortController = new AbortController();
    const signal = abortController.signal;

    await stopSignalR();

    const newConnection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5118/messageHub", { withCredentials: true })
        .withAutomaticReconnect()
        .build();

    newConnection.on("ReceiveComment", (uId, uName, content) => {
        comments.push({
            id: '',
            text: content,
            author: uName,
            createdAt: new Date().toISOString()
        });
    });

    newConnection.on("DeleteComment", (commentId: string) => {
        const existData = comments.find(x => x.id === commentId);

        if (existData === undefined)
            return;

        const index = comments.indexOf(existData);
        comments.splice(index, 1);
    });

    try {
        await newConnection.start();
        
        if (signal.aborted) {
            await newConnection.stop();
            return;
        }

        if (newConnection.state !== signalR.HubConnectionState.Connected) return;
        connection = newConnection;

        await connection.invoke("JoinCommentsChat", { 
            ChatRoom: chatId, 
            UserName: userName
        });

    } catch (err: any) {
        if (signal.aborted) return;

        const ignoredErrors = ["connection being closed", "Connection disconnected", "Connection lost"];
        const errorMessage = err?.message || String(err);
        
        if (!ignoredErrors.some(msg => errorMessage.includes(msg))) {
            console.error("SignalR Critical Error:", err);
        }
    }
}

    async function stopSignalR() {
        if (connection) {
            try {
                connection.off("ReceiveComment");
                connection.off("DeleteComment");
                await connection.stop();
            } catch (e) {

            } finally {
                connection = null;
            }
        }
    }

    return {
        get comments() { return comments; },
        setComments: (data: CommentInterface[]) => comments = data,
        initSignalR,
        stopSignalR,
        leaveComment: async (chatId: string, text: string) => {
            if (connection) {
                await connection.invoke("LeaveComment", chatId, text);
            }
        },
        deleteComment: async (chatId: string, commentId: string) => {
            if (connection) {
                await connection.invoke("DeleteComment", chatId, commentId);
            }
        }
    };
}