import * as signalR from "@microsoft/signalr";
import { chatOfflineState } from "./ChatOfflineStore.svelte";
import { offerFullStore } from "./OfferFullStore.svelte";
import commentState from "./commentStore.svelte";
import questionAnswerState from "./questionAnswerStore.svelte";
import offerState from "./offerStore.svelte";
import { settings } from "./settings.svelte";
import getCookie from "$lib/utils/cookieData";
import { env } from "$env/dynamic/public";

export async function syncAllPendingData(connection: signalR.HubConnection) {
    if (connection.state !== signalR.HubConnectionState.Connected) return;

    await Promise.allSettled([
        syncPendingMessages(connection),
        syncPendingComments(connection),
        syncPendingQuestionsAnswers(connection),
        syncPendingOffers(connection)
    ]);
}

async function syncPendingMessages(conn: signalR.HubConnection) {
    const pending = await chatOfflineState.getPendingMessages();
    if (pending.length === 0) return;

    for (const msg of pending) {
        try {
            await conn.invoke("SendMessage", msg.chatId, msg.content, msg.senderName, null);
            await chatOfflineState.removePendingMessage(msg.id);
        } catch (err) {
            console.error("[Sync] Ошибка отправки сообщения:", err);
            break;
        }
    }
}

async function syncPendingComments(conn: signalR.HubConnection){
        const pending = await offerFullStore.getPendingComments();

        const sortedPending = [...pending].sort((a, b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        for (const msg of sortedPending) {
            await conn.invoke("LeaveComment", msg.announcementId, msg.text, msg.author);
            await offerFullStore.removePendingComment(msg.id);

            const index = commentState.comments.findIndex(x => x.text === msg.text);
            commentState.comments[index].isPending = false;
        }

        commentState.setComments(commentState.comments.filter(x => !x.isPending));
}

async function syncPendingQuestionsAnswers(conn: signalR.HubConnection){
    const pending = await offerFullStore.getPendingQuestions();

        for (const msg of pending) {
            if (msg.answerId === null){
                await conn.invoke("SendQuestion", msg.announcementId, msg.textQuestion, msg.createdByQuestion);
            } else {
                await conn.invoke("SendAnswer", msg.announcementId, msg.questionId, msg.textAnswer, msg.createdByAnswer);
            }

            await offerFullStore.removePendingQuestion(msg.questionId);
        }

        questionAnswerState.setData(questionAnswerState.questionAnswerData.filter(x => !x.isQuestionPending));
}

async function syncPendingOffers(conn: signalR.HubConnection){
        const pending = await offerFullStore.getPendingOffers();

        for (const offer of pending) {
            const formData = new FormData();
            offer.images
                .filter(i => i.type === 'new')
                .forEach(img => {
                    formData.append("Photos", img.file);
                });
            formData.append("PropertyType", offer.propertyTypeId);
            formData.append("StatementType", offer.statementTypeId);
            formData.append("Location", offer.location);
            formData.append("Area", offer.area);
            formData.append("Floors", offer.floors);
            formData.append("Rooms", offer.rooms);
            formData.append("Title", offer.title);
            formData.append("Price", offer.price);
            formData.append("Content", offer.content);
            formData.append("Description", offer.description);

            const token = getCookie('accessToken');

            const response = await fetch(`${env.PUBLIC_API_URL}/api/announcements/add-announcement`, {
                method: 'POST',
                body: formData,
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                credentials: "include"
            });

            await offerFullStore.removePendingOffers(offer.id);
            await offerFullStore.removeOffer(offer.id);
            await offerFullStore.removeOfferFull(offer.id);

            const index = offerState.offers.findIndex(x => x.title === offer.title);

            if (index !== -1)
                offerState.offers[index].isPending = false;
        }

    const pendingUpdate = await offerFullStore.getPendingOffersUpdate();
    
            for (const offer of pendingUpdate) {
                const formData = new FormData();
    
                offer.images
                    .filter(i => i.type === 'new')
                    .forEach(img => formData.append("NewPhotos", img.file));
    
                offer.deletedImageIds.forEach(id => formData.append("DeletedImageIds", id));
    
                offer.images.forEach(img => {
                    formData.append("ExistingImageOrder", img.type === 'existing' ? img.id : 'new');
                });

                await offerFullStore.loadDetails(offer.id);
                const offerShort = offerFullStore.offerDetails[offer.id];
    
                formData.append("PropertyTypeId", offer.propertyTypeId);
                formData.append("StatementTypeId", offer.statementTypeId);
                formData.append("Location", offer.location);
                formData.append("Area", offer.area.toString());
                formData.append("Floors", offer.floors.toString());
                formData.append("Rooms", offer.rooms.toString());
                formData.append("Title", offer.title);
                formData.append("Price", offer.price.toString());
                formData.append("Content", offer.content);
                formData.append("Description", offer.description);
                formData.append("AnnouncementId", offer.id);
                formData.append("UpdatedAt", offerShort.updatedAt ?? "");
    
                try {
                    const token = getCookie('accessToken');
                    const response = await fetch(`${env.PUBLIC_API_URL}/api/announcements/update-announcement`, {
                        method: 'POST',
                        body: formData,
                        headers: { "Authorization": `Bearer ${token}` }
                    });
    
                    if (response.ok) {
                        await offerFullStore.removePendingOffersUpdate(offer.id);
                        
                        const index = offerState.offers.findIndex(x => x.id === offer.id);
                        if (index !== -1) {
                            offerState.offers[index].isPending = false;
                        }
                    }
                    settings.online = true;
                } catch (e) {
                    settings.online = false;
                    console.error("[App] Failed to sync update for offer", offer.id, e);
                }
            }
    
            offerState.setOffers(offerState.offers.filter(x => !x.isPending));
}