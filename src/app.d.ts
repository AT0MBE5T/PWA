declare global {
	namespace App {
		interface Locals {
			user: {
                id: string | null;
                name: string | null;
                roles: string[];
				avatarUrl: string | null;
				personName: string | null;
				personSurname: string | null;
            } | null;

			token: string;
			theme: string;
			lang: string;
		}
	}
}

export {};
