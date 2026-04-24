import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { translations, type Language, type TranslationKeys } from '$lib/i18n';

class SettingsStore {
    theme = $state<string>(browser ? localStorage.getItem('theme') || 'light' : 'light');
    lang = $state<Language>(browser ? localStorage.getItem('lang') as Language || 'UA' : 'UA');

    online = $state<boolean>(false);

    isLoading = $state<boolean>(false);

    constructor() {
        $effect.root(() => {
            $effect(() => {
                if (browser) {
                    localStorage.setItem('theme', this.theme);
                    document.documentElement.setAttribute('data-theme', this.theme);
                }
            });

            $effect(() => {
                if (browser) {
                    localStorage.setItem('lang', this.lang);
                }
            });
        });
    }

    public async checkServer() {
        try {
            const res = await fetch(`${env.PUBLIC_API_URL}/api/accounts/ping`);
            this.online = res.ok;
            return res.ok;
        } catch {
            this.online = false;
            return false;
        }
    }

    get t(): TranslationKeys {
        return translations[this.lang];
    }

    toggleTheme(): void {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
    }

    toggleLang(): void {
        this.lang = this.lang === 'UA' ? 'EN' : 'UA';
    }
}

export const settings = new SettingsStore();