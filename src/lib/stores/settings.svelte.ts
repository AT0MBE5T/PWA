import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { translations, type Language, type TranslationKeys } from '$lib/i18n';

class SettingsStore {
    lang = $state<Language>("UA");
    online = $state<boolean>(false);

    isLoading = $state<boolean>(false);

    public async checkServer() {
        try {
            const res = await fetch(`${env.PUBLIC_API_URL}/api/accounts/ping`, {
                cache: 'no-store'
            });
            this.online = res.ok;
            return res.ok;
        } catch {
            this.online = false;
            return false;
        }
    }
}

export const settings = new SettingsStore();