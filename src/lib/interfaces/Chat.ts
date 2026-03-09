export interface Chat {
    chatId: string;
    chatName: string;
    lastMessage: string;
    lastMessageAt: string | null;
    unreadCount: string;
    avatarUrl: string;
}