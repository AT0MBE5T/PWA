export interface Message {
    id: string;
    chatId: string;
    senderId: string;
    senderName: string;
    content: string;
    createdAt: string;
    isRead: boolean;
}
