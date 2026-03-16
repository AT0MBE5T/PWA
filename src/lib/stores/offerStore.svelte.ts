import type { AnnouncementFull } from "$lib/interfaces/AnnouncementFull";
import type { AnnouncementShort } from "$lib/interfaces/AnnouncementShort";
import type { CommentInterface } from "$lib/interfaces/CommentInterface";
import type { QuestionAnswer } from "$lib/interfaces/QuestionAnswer";
import type { SearchRequestInterface } from "$lib/interfaces/SearchRequestInterface";
import * as signalR from "@microsoft/signalr";
import { offerFullStore } from "./OfferFullStore.svelte";
import type { AnnouncementAddModel } from "$lib/interfaces/AnnouncementAddModel";
import getCookie from "$lib/utils/cookieData";
import type { AnnouncementUpdateModel } from "$lib/interfaces/AnnouncementUpdateModel";
import { env } from "$env/dynamic/public";

const offerState = createOfferState();
export default offerState;

function createOfferState() {
    let offers = $state<AnnouncementShort[]>([]);
    let connection = $state<signalR.HubConnection | null>(null);
    let currentFilters = $state<SearchRequestInterface | null>(null);

    let offerDetails = $state<AnnouncementFull[]>([]);
    let comments = $state<CommentInterface[]>([]);
    let questions = $state<QuestionAnswer[]>([]);

    function matchesFilters(offer: AnnouncementShort, filters: SearchRequestInterface) {
        return !filters;
    }

async function initSignalR(chatId: string, userName: string) {
    await stopSignalR();

    const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${env.PUBLIC_API_URL}/messageHub`, { withCredentials: true })
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

    newConnection.onreconnected(async () => {
        if (newConnection !== connection) return;

        try {
            await newConnection.invoke("JoinOffersChat", {
                ChatRoom: chatId,
                UserName: userName
            });

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

            try {
                const token = getCookie('accessToken');
                const response = await fetch(`${env.PUBLIC_API_URL}/api/Announcement/update-announcement`, {
                    method: 'POST',
                    body: formData,
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    await offerFullStore.removePendingOffersUpdate(offer.id);
                    
                    const index = offers.findIndex(x => x.id === offer.id);
                    if (index !== -1) {
                        offers[index].isPending = false;
                    }
                }
            } catch (e) {
                console.error("Failed to sync update for offer", offer.id, e);
            }
        }

        offers = offers.filter(x => !x.isPending);
        } catch (e) {
            console.error("Sync error:", e);
        }
    });

    try {
        await newConnection.start();
        
        if (newConnection.state !== signalR.HubConnectionState.Connected) return;

        connection = newConnection;

        await connection.invoke("JoinOffersChat", { 
            ChatRoom: chatId, 
            UserName: userName
        });

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
            formData.append("UserId", offer.userId);

            const token = getCookie('accessToken');

            const response = await fetch(`${env.PUBLIC_API_URL}/api/Announcement/add-announcement`, {
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

            const index = offers.findIndex(x => x.title === offer.title);

            if (index !== -1)
                offers[index].isPending = false;
        }

        const pendingUpdate = await offerFullStore.getPendingOffersUpdate();

        for (const offer of pendingUpdate) {
                        const formData = new FormData();

            offer.images
                .filter(i => i.type === 'new')
                .forEach(img => {
                    formData.append("NewPhotos", img.file);
                });

            offer.deletedImageIds.forEach(id => {
                formData.append("DeletedImageIds", id);
            });

            offer.images.forEach(img => {
                if (img.type === 'existing') {
                    formData.append("ExistingImageOrder", img.id);
                } else {
                    formData.append("ExistingImageOrder", 'new');
                }
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
            formData.append("AnnouncementId", offer.id);

            const token = getCookie('accessToken');

            const response = await fetch(`${env.PUBLIC_API_URL}/api/Announcement/update-announcement`, {
                method: 'POST',
                body: formData,
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                credentials: "include"
            });

            await offerFullStore.removePendingOffersUpdate(offer.id);

            const index = offers.findIndex(x => x.id === offer.id);
            if (index !== -1)
                offers[index].isPending = false;
        }

        offers = offers.filter(x => !x.isPending);
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

        addOffer: async (data: AnnouncementAddModel) => {
            const short: AnnouncementShort = {
                id: data.id,
                area: Number(data.area),
                isFavorite: false,
                isPending: true,
                isVerified: false,
                location: data.location,
                photoUrl: data.images
                    .filter(i => i.type === 'existing' || (i.type === 'new' && i.preview))
                    .map(i => {
                        if (i.type === 'existing') {
                            return i.url
                        } else {
                            return i.preview
                        }
                    }).at(0) ?? '',
                price: Number(data.price),
                propertyTypeName: (await offerFullStore.getPropertyTypes()).filter(x => x.id === data.propertyTypeId).at(0)?.name ?? '',
                statementTypeName: (await offerFullStore.getStatementTypes()).filter(x => x.id === data.statementTypeId).at(0)?.name ?? '',
                title: data.title,
                viewsCnt: 0
            }
            offers = [...offers, short];
            offerFullStore.addNewShortOffer(short);
        },

        addFullOffer: async (data: AnnouncementAddModel, authorId: string, authorName: string) => {
            const full: AnnouncementFull = {
                id: data.id,
                area: Number(data.area),
                isFavorite: false,
                isVerified: false,
                location: data.location,
                photos: data.images
                    .filter(i => i.type === 'existing' || (i.type === 'new' && i.preview))
                    .map(i => {
                        if (i.type === 'existing') {
                            return {
                                id: i.id,
                                url: i.url
                            };
                        } else {
                            return {
                                id: crypto.randomUUID(), 
                                url: i.preview
                            };
                        }
                    }),
                price: Number(data.price),
                propertyTypeName: (await offerFullStore.getPropertyTypes()).filter(x => x.id === data.propertyTypeId).at(0)?.name ?? '',
                statementTypeName: (await offerFullStore.getStatementTypes()).filter(x => x.id === data.statementTypeId).at(0)?.name ?? '',
                title: data.title,
                viewsCnt: 0,
                author: authorName,
                authorId: authorId,
                content: data.content,
                createdAt: new Date().toISOString(),
                description: data.description,
                floors: Number(data.floors),
                rooms: Number(data.rooms)
            }
            offerDetails = [...offerDetails, full];
            offerFullStore.addNewFullOffer(full);
        },

    updateOffer: async (data: AnnouncementUpdateModel) => {
        const found = offerFullStore.offerDetails[data.id];

        if (!found) return;

        found.area = Number(data.area);
        found.content = data.content;
        found.description = data.description;
        found.floors = Number(data.floors);
        found.location = data.location;
        found.price = Number(data.price);
        found.rooms = Number(data.rooms);
        found.title = data.title;
        
        found.photos = data.images
            .filter(i => i.type === 'existing' || (i.type === 'new' && i.preview))
            .map(i => {
                if (i.type === 'existing') {
                    return {
                        id: i.id,
                        url: i.url
                    };
                } else {
                    return {
                        id: crypto.randomUUID(), 
                        url: i.preview
                    };
                }
            });

        const offer = offers.find(x => x.id === data.id)

        if (!offer) return;

        offer.area = Number(data.area);
        offer.location = data.location;
        offer.price = Number(data.price);
        offer.title = data.title;
        
        offer.photoUrl = data.images
            .filter(i => i.type === 'existing' || (i.type === 'new' && i.preview))
            .map(i => {
                return i.type === 'existing'
                    ? i.url
                    : i.preview
            }).at(0) ?? '';

        const db = await offerFullStore.getDB();
        await db.put('announcementDetails', $state.snapshot(found));
        await db.put('announcements', $state.snapshot(offer));
    },

        get offerDetails() { return offerDetails; },
        setOfferDetails: (data: AnnouncementFull[]) => offerDetails = data,

        get comments() { return comments; },
        setComments: (data: CommentInterface[]) => comments = data,

        get questions() { return questions; },
        setQuestions: (data: QuestionAnswer[]) => questions = data,

        setFilters: (filters: SearchRequestInterface) => {
            currentFilters = filters;
        },
        initSignalR,
        stopSignalR
    };
}