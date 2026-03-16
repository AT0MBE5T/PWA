import type { QuestionAnswer } from "$lib/interfaces/QuestionAnswer";
import * as signalR from "@microsoft/signalr";
import { offerFullStore } from "./OfferFullStore.svelte";
import offerState from "./offerStore.svelte";
import { env } from "$env/dynamic/public";

const questionAnswerState = createQuestionAnswerState();
export default questionAnswerState;

function createQuestionAnswerState() {
    let questionAnswerData = $state<QuestionAnswer[]>([]);
    let connection = $state<signalR.HubConnection | null>(null);
    let currentChatId = $state<string | null>(null);
    let isConnecting = false;
    let isSyncing = false;

async function setup(currentId: string) {
    try {
        const response = await fetch(
            `${env.PUBLIC_API_URL}/api/Question/get-all-by-announcement-id/${currentId}`
        );

        if (response.ok) {
            const initialQuestions = await response.json();

            offerFullStore.setQuestions(currentId, initialQuestions);
            offerState.setQuestions(initialQuestions);
            questionAnswerState.setData(initialQuestions);
        }
    } catch {
        await offerFullStore.loadQuestions(currentId);
        const pendingQuestions = await offerFullStore.getPendingQuestions();
        let arrToAdd = offerFullStore.questions[currentId].concat(pendingQuestions);

        const sortedArr = [...arrToAdd].sort((a, b) => {
            return new Date(a.createdAtQuestion).getTime() - new Date(b.createdAtQuestion).getTime();
        });

        questionAnswerState.setData(sortedArr);
        offerState.setQuestions(sortedArr);
    }
}

async function initSignalR(chatId: string, userName: string) {
    if ((connection || isConnecting) && currentChatId === chatId) {
        return;
    }

    isConnecting = true;
    await stopSignalR();
    currentChatId = chatId;

    const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${env.PUBLIC_API_URL}/messageHub`, { withCredentials: true })
        .withAutomaticReconnect()
        .build();

    newConnection.on("ReceiveQuestion", (announcementId, questionId, userName, message) => {
        const pendingIndex = questionAnswerData.findIndex(
            x => x.isQuestionPending && x.textQuestion === message && x.createdByQuestion === userName
        );

        if (pendingIndex !== -1) {
            questionAnswerData = questionAnswerData.map((x, i) =>
                i === pendingIndex
                    ? {
                        ...x,
                        questionId,
                        isQuestionPending: false
                    }
                    : x
            );
        } else {
            questionAnswerData = [
                ...questionAnswerData,
                {
                    questionId,
                    createdAtQuestion: new Date().toISOString(),
                    createdByQuestion: userName,
                    textQuestion: message,
                    answerId: null,
                    createdAtAnswer: null,
                    createdByAnswer: null,
                    textAnswer: null,
                    isQuestionPending: false,
                    isAnswerPending: null,
                    announcementId
                }
            ];
        }
    });

    newConnection.on("ReceiveAnswer", (answerId, questionId, userName, message) => {
        const existData = questionAnswerData.find(x => x.questionId === questionId);

        if (existData === undefined)
            return;

        questionAnswerData = questionAnswerData.map(x =>
            x.questionId === questionId
                ? {
                    ...x,
                    answerId,
                    createdAtAnswer: new Date().toISOString(),
                    createdByAnswer: userName,
                    textAnswer: message,
                    isAnswerPending: false
                }
                : x
        );
    });

    newConnection.on("DeleteQuestion", (questionId) => {
        const existData = questionAnswerData.find(x => x.questionId === questionId);

        if (existData === undefined)
            return;

        questionAnswerData = questionAnswerData.filter(x => x.questionId !== questionId);
    });

    newConnection.on("DeleteAnswer", (answerId) => {
        const existData = questionAnswerData.find(x => x.answerId === answerId);

        if (existData === undefined)
            return;

        existData.answerId = null;
        existData.createdAtAnswer = null;
        existData.createdByAnswer = null;
        existData.textAnswer = null;
    });

    newConnection.onreconnected(async () => {
    if (newConnection !== connection) return;
    if (isSyncing) return;

    isSyncing = true;

    try {
        await newConnection.invoke("JoinQuestionAnswerChat", {
            ChatRoom: chatId,
            UserName: userName
        });

        const pending = await offerFullStore.getPendingQuestions();

        for (const msg of pending) {
            if (msg.answerId === null){
                await newConnection.invoke("SendQuestion", chatId, msg.textQuestion, userName);
            } else {
                await newConnection.invoke("SendAnswer", chatId, msg.questionId, msg.textAnswer, userName);
            }

            await offerFullStore.removePendingQuestion(msg.questionId);
        }

        questionAnswerData = questionAnswerData.filter(x => !x.isQuestionPending);
    } finally {
        isSyncing = false;
    }
});

    try {
        if (currentChatId !== chatId) {
            await newConnection.stop();
            return;
        }

        connection = newConnection;
        await newConnection.start();

        await connection.invoke("JoinQuestionAnswerChat", { 
            ChatRoom: chatId, 
            UserName: userName
        });

        const pending = await offerFullStore.getPendingQuestions();

        const sortedPending = [...pending].sort((a, b) => {
            return new Date(a.createdAtQuestion).getTime() - new Date(b.createdAtQuestion).getTime();
        });

        for (const msg of sortedPending) {
            if (msg.answerId === null){
                await newConnection.invoke("SendQuestion", chatId, msg.textQuestion, userName);
            } else {
                await newConnection.invoke("SendAnswer", chatId, msg.questionId, msg.textAnswer, userName);
            }

            await offerFullStore.removePendingQuestion(msg.questionId);
            const index = questionAnswerData.findIndex(x => x.textQuestion === msg.textQuestion);
            questionAnswerData[index].isAnswerPending = false;
            questionAnswerData[index].isQuestionPending = false;
        }

        questionAnswerData = questionAnswerData.filter(x => !x.isQuestionPending);
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
    finally{
        isConnecting = false;
    }
}

async function stopSignalR() {
    currentChatId = null;
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
        sendQuestion: async (userName: string, chatId: string, text: string) => {
            const tempId = crypto.randomUUID();
            const pendingQuestion: QuestionAnswer = {
                questionId: tempId,
                textQuestion: text,
                createdAtQuestion: new Date().toISOString(),
                isAnswerPending: null,
                isQuestionPending: true,
                createdByQuestion: userName,
                answerId: null,
                createdAtAnswer: null,
                createdByAnswer: null,
                textAnswer: null,
                announcementId: chatId
            };
            
            questionAnswerData = [...questionAnswerData, pendingQuestion];

            if (connection?.state === signalR.HubConnectionState.Connected) {
                try {
                    await connection.invoke("SendQuestion", chatId, text, userName);
                } catch (e) {
                    await offerFullStore.savePendingQuestion(pendingQuestion);
                }
            } else {
                await offerFullStore.savePendingQuestion(pendingQuestion);
            }
        },
        sendAnswer: async (userName: string, chatId: string, text: string, questionId: string) => {
            const question = questionAnswerData.find(x => x.questionId === questionId);
            if (!question)
                return;

            const tempId = crypto.randomUUID();
            const pendingAnswer: QuestionAnswer = {
                questionId: questionId,
                textQuestion: question.textQuestion,
                createdAtQuestion: question.createdAtQuestion,
                isAnswerPending: true,
                isQuestionPending: question.isQuestionPending,
                createdByQuestion: question.createdByQuestion,
                answerId: tempId,
                createdAtAnswer: new Date().toISOString(),
                createdByAnswer: userName,
                textAnswer: text,
                announcementId: chatId
            };

            const exist = questionAnswerData.find(x => x.questionId === questionId);

            if (exist) {
                exist.answerId = tempId;
                exist.textAnswer = text;
                exist.createdAtAnswer = new Date().toISOString();
                exist.createdByAnswer = userName;
                exist.isAnswerPending = true;
            }

            if (connection?.state === signalR.HubConnectionState.Connected) {
                try {
                    await connection.invoke("SendAnswer", chatId, questionId, text, userName);
                } catch (e) {
                    await offerFullStore.savePendingQuestion(pendingAnswer);
                }
            } else {
                await offerFullStore.savePendingQuestion(pendingAnswer);
            }
        },
        setup,
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