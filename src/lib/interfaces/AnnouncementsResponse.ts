import type {AnnouncementShort} from "./AnnouncementShort";

export interface AnnouncementsResponse {
    data: AnnouncementShort[];
    totalItems: number;
    totalPages: number;
    page: number;
    pageSize: number;
    userId: string;
    timestamp: number;
}