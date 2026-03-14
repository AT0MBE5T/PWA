import type { ImageItem } from "./ImageItem";

export interface AnnouncementUpdateModel {
    id: string;
    images: ImageItem[];
    deletedImageIds: string[];
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