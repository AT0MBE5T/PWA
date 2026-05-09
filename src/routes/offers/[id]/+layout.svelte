<script lang='ts'>
    import { page } from '$app/stores';
    import { settings, translations } from '$lib';
    import { offerFullStore } from '$lib/stores/OfferFullStore.svelte.js';
    import type SettingsStore from '$lib/stores/settingsStore.svelte.js';
    import { getContext } from 'svelte';

    let { data, children } = $props();

    let menuOpen = $state(false);

    const isActive = (path: string) => $page.url.pathname.endsWith(path);

    let navElement = $state<HTMLElement>();

    function handleOutsideClick(event: Event) {
        const target = event.target as Node | null;
        if (menuOpen && navElement && !navElement.contains(target)) {
            menuOpen = false;
        }
    }

    $effect(() => {
        document.addEventListener('click', handleOutsideClick);

        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    });

    let offer = $derived(offerFullStore.offerDetails[data.id!]);

    const formatLocation = (location: string) => {
        if (!location) return '';
        return encodeURIComponent(location);
    };

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);
</script>

<div class="wrapper">
    <div class="wrapper__container container">
        <header class="container__header header">
            <nav class='header__nav' bind:this={navElement}>
                <button
                        class="burger"
                        aria-label="Toggle menu"
                        onclick={() => (menuOpen = !menuOpen)}>
                    <div class="line"></div>
                    <div class="line"></div>
                    <div class="line"></div>
                </button>
                <ul class="header__nav__list {menuOpen ? 'open' : ''}">
                    <li class='header__nav__list__item'>
                        <a href="/offers/{data.id}/description" 
                        class={isActive('/description') ? 'highlighted_page' : ''}>
                        <img src="/icons/description.svg" height="25" width="25" alt="#"> {t.offers.description}
                        </a>
                    </li>
                    <li class='header__nav__list__item'>
                        <a href="/offers/{data.id}/comments" 
                        class={isActive('/comments') ? 'highlighted_page' : ''}>
                        <img src="/icons/chat.svg" height="25" width="25" alt="#"> {t.offers.comments}
                        </a>
                    </li>
                    <li class='header__nav__list__item'>
                        <a href="/offers/{data.id}/questions" 
                        class={isActive('/questions') ? 'highlighted_page' : ''}>
                        <img src="/icons/question.svg" height="25" width="25" alt="#"> {t.offers.questions}
                        </a>
                    </li>
                </ul>
            </nav>
        </header>
        <main class="container__main main">
            {@render children()}
        </main>
        {#if offer?.location && settings.online}
            <div class="container__map">
                <iframe
                    title="MAP"
                    loading="lazy"
                    width="100%"
                    height="100%"
                    src='https://www.google.com/maps?q=${formatLocation(offer?.location)}&output=embed'>
                </iframe>
            </div>
        {/if}
    </div>
</div>

<style>
    .wrapper {
        display: flex;
        width: 100%;
    }

    .wrapper__container {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
    }

    .container__header {
        width: var(--sidebar-width);
        position: fixed;
        height: 100%;
        background: var(--header-bg); 
        backdrop-filter: blur(15px);
        border-right: 1px solid var(--header-border);
        padding: 2rem 1rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 99;
        top: 0;
    }

    .container__map {
        width: var(--sidebar-width);
        position: fixed;
        height: 93%;
        display: flex;
        justify-content: center;
        align-items: center;
        bottom: 0;
        right: 0;
        box-sizing: border-box;
    }

    .container__map iframe {
        width: 100%;
        height: 100%;
        border: none;
        border-radius: 21px;

        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);

        box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.05);

        transition: all 0.3s ease;
    }

    .container__map iframe:hover {
        transform: scale(1.01);
    }

    .container__map::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 20px;
        background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.2),
            rgba(0,0,0,0.4)
        );
        pointer-events: none;
        transition: opacity 0.3s ease;
    }

    .container__map:hover::after {
        opacity: 0;
    }

    .header__nav {
        width: 100%;
    }

    .header__nav__list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .header__nav__list__item a {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0.8rem 1.2rem;
        color: var(--text-secondary);
        text-decoration: none;
        border-radius: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        font-size: 1.1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .header__nav__list__item a:hover {
        background: var(--nav-hover-bg);
        color: var(--accent-color);
    }

    .highlighted_page {
        background: var(--nav-hover-bg) !important;
        color: var(--accent-color) !important;
        box-shadow: inset 0 0 0 1px var(--accent-color);
    }

    .container__main {
        flex: 1;
        padding: 2rem 2rem 0 2rem;
        display: flex;
        justify-content: center;
        overflow-y: auto;
    }

    .burger {
        display: none;
    }

    @media (max-width: 1300px) {
        .wrapper__container {
            flex-direction: column;
        }

        .container__header {
            width: 100%;
            height: auto;
            position: fixed;
            bottom: 0;
            top: auto;
            flex-direction: row;
            padding: 0.5rem;
            border-right: none;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px 20px 0 0;
            z-index: 1;
        }

        .header__nav__list {
            flex-direction: row;
            justify-content: space-around;
            width: 100%;
        }

        .header__nav__list__item a {
            flex-direction: column;
            font-size: 1rem;
            padding: 0.5rem;
            gap: 4px;
        }

        .container__map {
            position: relative;
            width: 100%;
            height: 30rem;
            margin-bottom: 6rem;
        }

        .container__map iframe {
            border-radius: 21px;
        }
    }
</style>