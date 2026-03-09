import type { QuestionAnswer } from "$lib/interfaces/QuestionAnswer";
import * as signalR from "@microsoft/signalr";

export default function createQuestionAnswerState() {
    let questionAnswerData = $state<QuestionAnswer[]>([]);
    let connection = $state<signalR.HubConnection | null>(null);

async function initSignalR(chatId: string, userName: string) {
    await stopSignalR();

    const newConnection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5118/messageHub", { withCredentials: true })
        .withAutomaticReconnect()
        .build();

    newConnection.on("ReceiveQuestion", (questionId, userName, message) => {
        questionAnswerData.push({
            questionId: questionId,
            createdAtQuestion: new Date().toISOString(),
            createdByQuestion: userName,
            textQuestion: message,

            answerId: null,
            createdAtAnswer: null,
            createdByAnswer: null,
            textAnswer: null
        });
    });

    newConnection.on("ReceiveAnswer", (answerId, questionId, userName, message) => {
        const existData = questionAnswerData.find(x => x.questionId === questionId);

        if (existData === undefined)
            return;

        existData.answerId = answerId;
        existData.createdAtAnswer = new Date().toISOString();
        existData.createdByAnswer = userName;
        existData.textAnswer = message;
    });

    newConnection.on("DeleteQuestion", (questionId) => {
        const existData = questionAnswerData.find(x => x.questionId === questionId);

        if (existData === undefined)
            return;

        const index = questionAnswerData.indexOf(existData);
        questionAnswerData.splice(index, 1);
    });

    newConnection.on("DeleteAnswer", (answerId) => {
        const existData = questionAnswerData.find(x => x.answerId === answerId);

        if (existData === undefined)
            return;

        const index = questionAnswerData.indexOf(existData);
        questionAnswerData.splice(index, 1);
    });

    try {
        await newConnection.start();
        
        if (newConnection.state !== signalR.HubConnectionState.Connected) return;

        connection = newConnection;

        await connection.invoke("JoinQuestionAnswerChat", { 
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
            oldConn.off("ReceiveQuestion");
            oldConn.off("ReceiveAnswer");
            oldConn.off("DeleteQuestion");
            oldConn.off("DeleteAnswer");
            await oldConn.stop();
        } catch (e) {

        }
    }
}

    return {
        get questionAnswerData() { return questionAnswerData; },
        setData: (data: QuestionAnswer[]) => questionAnswerData = data,
        initSignalR,
        stopSignalR,
        sendQuestion: async (chatId: string, text: string) => {
            if (connection) {
                await connection.invoke("SendQuestion", chatId, text);
            }
        },
        sendAnswer: async (chatId: string, questionId: string, text: string) => {
            if (connection) {
                await connection.invoke("SendAnswer", chatId, questionId, text);
            }
        },
        deleteQuestion: async (chatId: string, questionId: string) => {
            if (connection) {
                await connection.invoke("DeleteQuestion", chatId, questionId);
            }
        },
        deleteAnswer: async (chatId: string, answerId: string) => {
            if (connection) {
                await connection.invoke("DeleteAnswer", chatId, answerId);
            }
        }
    };
}