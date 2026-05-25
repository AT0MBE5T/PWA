export interface Chat {
    chatId: string;
    chatName: string;
    lastMessage: string;
    lastMessageAt: string | null;
    lastMessageBy: string | null;
    unreadCount: string;
    avatarUrl: string;
    closedAt: string | null;
    offerId: string | null;
    offerTitle: string | null;
    realtorId: string | null;
    chatTypeId: string;
    supportId: string | null;
}