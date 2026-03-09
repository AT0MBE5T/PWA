export const Roles = {
    Admin: 'Admin',
    User: 'User',
    Realtor: 'Realtor'
} as const;

export type Role = keyof typeof Roles;