import type { ImageItem } from "./ImageItem";

export interface AnnouncementAddModel {
    id: string;
    images: ImageItem[];
    propertyTypeId: string;
    statementTypeId: string;
    location: string;
    area: string;
    floors: string;
    rooms: string;
    title: string;
    price: string;
    content: string;
    description: string;
    userId: string;
}