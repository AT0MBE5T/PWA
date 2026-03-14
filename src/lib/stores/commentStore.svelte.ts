import type { CommentInterface } from "$lib/interfaces/CommentInterface";
import * as signalR from "@microsoft/signalr";
import { offerFullStore } from "./OfferFullStore.svelte";

const commentState = createCommentState();
export default commentState;

function createCommentState() {
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

    newConnection.on("ReceiveComment", (commentId, offerId, uName, content) => {
        const pendingIndex = comments.findIndex(
            x => x.isPending && x.text === content
        );
        if (pendingIndex !== -1) {
            comments = comments.map((x, i) =>
                i === pendingIndex
                    ? {
                        ...x,
                        id: commentId,
                        isPending: false
                    }
                    : x
            );
        } else {
            comments = [
                ...comments,
                {
                    id: commentId,
                    text: content,
                    author: uName,
                    createdAt: new Date().toISOString(),
                    isPending: false,
                    announcementId: offerId
                }
            ];
        }
        // comments.push({
        //     id: commentId,
        //     text: content,
        //     author: uName,
        //     createdAt: new Date().toISOString(),
        //     isPending: false,
        //     announcementId: offerId
        // });
    });

    newConnection.on("DeleteComment", (commentId: string) => {
        const existData = comments.find(x => x.id === commentId);

        if (existData === undefined)
            return;

        const index = comments.indexOf(existData);
        comments.splice(index, 1);
    });

    newConnection.onreconnected(async () => {
        if (newConnection !== connection) return;

        console.log("Связь восстановлена, синхронизируем...");

        try {
            await newConnection.invoke("JoinCommentsChat", {
                ChatRoom: chatId,
                UserName: userName
            });

            const pending = await offerFullStore.getPendingComments();

            for (const msg of pending) {
                await newConnection.invoke("LeaveComment", chatId, msg.text, userName);
                await offerFullStore.removePendingComment(msg.id);

                const index = comments.findIndex(x => x.text === msg.text);
                comments[index].isPending = false;
            }

            comments = comments.filter(x => !x.isPending);
        } catch (e) {
            console.error("Sync error:", e);
        }
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

        const pending = await offerFullStore.getPendingComments();

        const sortedPending = [...pending].sort((a, b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        for (const msg of sortedPending) {
            await newConnection.invoke("LeaveComment", chatId, msg.text, userName);
            await offerFullStore.removePendingComment(msg.id);

            const index = comments.findIndex(x => x.text === msg.text);
            comments[index].isPending = false;
        }

        comments = comments.filter(x => !x.isPending);
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
        // leaveComment: async (chatId: string, text: string) => {
        //     if (connection) {
        //         await connection.invoke("LeaveComment", chatId, text);
        //     }
        // },
        leaveComment: async (userName: string, chatId: string, text: string) => {
            const tempId = crypto.randomUUID();
            const pendingComment: CommentInterface = {
                id: tempId,
                text: text,
                createdAt: new Date().toISOString(),
                author: userName,
                isPending: true,
                announcementId: chatId
            };

            comments = [...comments, pendingComment];

            if (connection?.state === signalR.HubConnectionState.Connected) {
                try {
                    await connection.invoke("LeaveComment", chatId, text, userName);
                } catch (e) {
                    console.error("Ошибка отправки, сохраняем в outbox", e);
                    await offerFullStore.savePendingComment(pendingComment);
                }
            } else {
                console.log("Оффлайн: сохраняем в очередь");
                await offerFullStore.savePendingComment(pendingComment);
            }
        },
        deleteComment: async (chatId: string, commentId: string) => {
            if (connection) {
                await connection.invoke("DeleteComment", chatId, commentId);
            }
        }
    };
}