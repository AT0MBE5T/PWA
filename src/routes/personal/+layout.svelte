<script lang="ts">
    import { goto } from '$app/navigation';
    import { settings, translations } from '$lib';

    let { children } = $props();

    type Pages = 'Profile' | 'Stats' | 'Announcements';

    let menuOpen = $state(false);

    const pageClicked = (page: Pages) => {
        currentPage = page;
        menuOpen = false;
    };

    let currentPage = $state<Pages>('Profile');

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

const t = $derived(translations[settings.lang]);
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
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a href="#" class={currentPage === 'Profile' ? 'highlighted_page' : ''} onclick={() => {
                            pageClicked('Profile');
                            goto('/personal/profile');
                            }}>🧑 {t.personal.profile}</a>
                    </li>
                    <li class='header__nav__list__item'>
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a href="#" class={currentPage === 'Stats' ? 'highlighted_page' : ''} onclick={() => {
                            pageClicked('Stats');
                            goto('/personal/stats');
                        }}>📊 {t.personal.stats}</a>
                    </li>
                    <li class='header__nav__list__item'>
                        <!-- svelte-ignore a11y_invalid_attribute -->
                        <a href="#" class={currentPage === 'Announcements' ? 'highlighted_page' : ''} onclick={() => {
                            pageClicked('Announcements');
                            goto('/personal/announcements');
                            }}>📢 {t.personal.announcements}</a>
                    </li>
                </ul>
            </nav>
        </header>
        <main class="container__main main">
            {@render children()}
        </main>
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
        padding: 2rem;
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

        .container__main {
            padding-bottom: 80px;
        }
    }
</style>