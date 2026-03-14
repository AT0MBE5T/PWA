export interface AuthState {
    id: string | null;
    name: string | null;
    avatarUrl: string | null;
    roles: string[];
    isAuthenticated: boolean;
    accessToken: string | null;
    personName: string | null;
    personSurname: string | null;
}