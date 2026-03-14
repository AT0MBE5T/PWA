import type { PhotoInterface } from "./PhotoInterface";

export type AnnouncementFull = {
    id: string;
    title: string;
    statementTypeName: string;
    propertyTypeName: string;
    price: number;
    location: string;
    area: number;
    photos: PhotoInterface[];
    content: string;
    createdAt: string;
    floors: number;
    rooms: number;
    description: string;
    authorId: string;
    author: string;
    isVerified: boolean;
    isFavorite: boolean;
    viewsCnt: number;
};