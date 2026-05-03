import { translations, type Language, type TranslationKeys } from "$lib/i18n";

export default class SettingsStore {
    theme = $state<string>('light');
    lang = $state<Language>('UA');

    constructor(initial: { theme: string, lang: Language }) {
        this.theme = initial.theme;
        this.lang = initial.lang;
    }

    setupEffects() {
        $effect(() => {
            document.cookie = `theme=${this.theme}; path=/; max-age=31536000`;
            document.documentElement.setAttribute('data-theme', this.theme);
        });

        $effect(() => {
            document.cookie = `lang=${this.lang}; path=/; max-age=31536000`;
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