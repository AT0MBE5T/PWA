import type { AnnouncementShort } from "$lib/interfaces/AnnouncementShort";
import type { SearchRequestInterface } from "$lib/interfaces/SearchRequestInterface";
import * as signalR from "@microsoft/signalr";

const offerState = createOfferState();
export default offerState;

function createOfferState() {
    let offers = $state<AnnouncementShort[]>([]);
    let connection = $state<signalR.HubConnection | null>(null);
    let currentFilters = $state<SearchRequestInterface | null>(null);

    function matchesFilters(offer: AnnouncementShort, filters: SearchRequestInterface) {
        return !filters;
    }

async function initSignalR(chatId: string, userName: string) {
    await stopSignalR();

    const newConnection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:5118/messageHub", { withCredentials: true })
        .withAutomaticReconnect()
        .build();

    newConnection.on("ReceiveOffer", (offer: AnnouncementShort) => {
        if (!currentFilters || matchesFilters(offer, currentFilters)) {
            offers = [offer, ...offers];
        }
    });

    newConnection.on("UpdateOffer", (offer: AnnouncementShort) => {
        const existData = offers.find(x => x.id === offer.id);

        if (existData === undefined)
            return;

        existData.area = offer.area;
        existData.isFavorite = offer.isFavorite;
        existData.isVerified = offer.isVerified;
        existData.location = offer.location;
        existData.photoUrl = offer.photoUrl;
        existData.price = offer.price;
        existData.propertyTypeName = offer.propertyTypeName;
        existData.statementTypeName = offer.statementTypeName;
        existData.title = offer.title;
        existData.viewsCnt = offer.viewsCnt;
    });

    newConnection.on("DeleteOffer", (offerId: string) => {
        const existData = offers.find(x => x.id === offerId);

        if (existData === undefined)
            return;

        const index = offers.indexOf(existData);
        offers.splice(index, 1);
    });

    try {
        await newConnection.start();
        
        if (newConnection.state !== signalR.HubConnectionState.Connected) return;

        connection = newConnection;

        await connection.invoke("JoinOffersChat", { 
            ChatRoom: chatId, 
            UserName: userName
        });
    } catch (err) {
        console.error("SignalR Error:", err);
    }
}

async function stopSignalR() {
    if (connection) {
        const oldConn = connection;
        connection = null;
        
        try {
            oldConn.off("ReceiveOffer");
            oldConn.off("UpdateOffer");
            oldConn.off("DeleteOffer");
            await oldConn.stop();
        } catch (e) {

        }
    }
}

    return {
        get offers() { return offers; },
        setOffers: (data: AnnouncementShort[]) => offers = data,
        setFilters: (filters: SearchRequestInterface) => {
            currentFilters = filters;
        },
        initSignalR,
        stopSignalR
    };
}