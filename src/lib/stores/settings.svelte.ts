import { browser } from '$app/environment';
import { translations, type Language, type TranslationKeys } from '$lib/i18n';

class SettingsStore {
    theme = $state<string>(browser ? localStorage.getItem('theme') || 'light' : 'light');
    lang = $state<Language>(browser ? localStorage.getItem('lang') as Language || 'UA' : 'UA');

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