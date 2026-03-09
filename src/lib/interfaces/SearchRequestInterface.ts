export interface SearchRequestInterface {
    text: string;
    filters: string[];
    sortId: number;
    page: number;
    limit: number;
    userId: string | null;
}