import type {AnnouncementShort} from "./AnnouncementShort";

export interface AnnouncementsResponse {
    data: AnnouncementShort[];
    totalPages: number;
    pageSize: number;
}