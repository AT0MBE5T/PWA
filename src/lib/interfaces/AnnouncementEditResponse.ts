import type { PhotoInterface } from "./PhotoInterface";

export type AnnouncementEditResponse = {
    photos: PhotoInterface[];
    propertyTypeId: string;
    statementTypeId: string;
    location: string;
    area: number;
    floors: number;
    rooms: number;
    title: string;
    price: number;
    content: string;
    description: string;
    userId: string;
};