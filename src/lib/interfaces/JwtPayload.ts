export interface JwtPayload {
    exp: number;
    sub: string;
    name: string;
    roles: string[];
}