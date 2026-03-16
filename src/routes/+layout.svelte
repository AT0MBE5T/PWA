<script lang="ts">
    import { auth, Roles, toast, Toast, translations, type AnnouncementsResponse, type AnnouncementStatRequest, type UserDto, type UserStatsModel } from '$lib';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { settings } from '$lib';
    import '../app.css';
    import { onMount } from 'svelte';
    import { personalStore } from '$lib/stores/PersonalStore.svelte';
    import { env } from '$env/dynamic/public';

    let { data, children } = $props();

    let menuOpen = $state(false);
    let navElement = $state<HTMLElement>();

    let showToast = $state(false);

    const showToastClose = () => { showToast = false; };

    function handleOutsideClick(event: Event) {
        if (!browser) return;
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

    // svelte-ignore state_referenced_locally
        auth.sync(data.user, data.token);

    const logout = async () => {
        await personalStore.clearAllData();
        auth.logout();
        goto('/login');
    };

    onMount(async () => {
        if (browser) {
            const { registerSW } = await import('virtual:pwa-register');
            registerSW({ 
                immediate: true,
                onRegistered(r) {
                    console.log('SW Registered:', r);
                },
                onRegisterError(error) {
                    console.error('SW registration error', error);
                }
            });
        }

        if (!$auth.isAuthenticated)
            return;

        try{
            const sold = await getSold(1);
            const bought = await getBought(1);
            const favorite = await getFavorites(1);
            const placed = await getPlaced(1);
            const userDto = await getUserDto();
            const userStats = await getUserStats();

            personalStore.setBought($auth.id!, bought?.data ?? []);
            personalStore.setPlaced($auth.id!, placed?.data ?? []);
            personalStore.setFavorite($auth.id!, favorite?.data ?? []);
            personalStore.setSold($auth.id!, sold?.data ?? []);
            personalStore.setUserDto(userDto!, $auth.id!);
            personalStore.setUserStatsModel(userStats!, $auth.id!);
        }catch(error){

        }
    });

    const getUserDto = async () => {
        try{
            const response = await fetch(`${env.PUBLIC_API_URL}/api/Account/get-user-dto-by-id`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${$auth.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const userData = response.ok ? await response.json() as UserDto : null;
            return userData;
        }catch{

        }
    };

    const getUserStats = async () => {
        try{
            const response = await fetch(`${env.PUBLIC_API_URL}/api/Account/get-stats-by-user-id`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${$auth.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const userData = response.ok ? await response.json() as UserStatsModel : null;
            return userData;
        }catch{

        }
    };

    const getSold = async (
        page: number
    ): Promise<AnnouncementsResponse | null> => {
        try{
            const response = await fetch(`${env.PUBLIC_API_URL}/api/Announcement/get-sold-by-user-id/${page}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${$auth.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) return null;
            return await response.json() as AnnouncementsResponse;
        }catch{
            return null;
        }
    };

    const getFavorites = async (
        page: number
    ): Promise<AnnouncementsResponse | null> => {
        try{
            const response = await fetch(`${env.PUBLIC_API_URL}/api/Favorite/get-favorites-by-user-id/${page}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${$auth.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) return null;
            return await response.json() as AnnouncementsResponse;
        }catch{
            return null;
        }
    };

    const getPlaced = async (
        page: number
    ): Promise<AnnouncementsResponse | null> => {
        try{
            const response = await fetch(`${env.PUBLIC_API_URL}/api/Announcement/get-placed-by-user-id/${page}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${$auth.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) return null;
            return await response.json() as AnnouncementsResponse;
        }catch{
            return null;
        }
    };

    const getBought = async (
        page: number
    ): Promise<AnnouncementsResponse | null> => {
        try{
            const response = await fetch(`${env.PUBLIC_API_URL}/api/Announcement/get-bought-by-user-id/${page}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${$auth.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) return null;
            return await response.json() as AnnouncementsResponse;
        }catch{
            return null;
        }
    };

    const t = $derived(translations[settings.lang]);

</script>

{#if $toast.show}
    <Toast 
        message={$toast.message} 
        type={$toast.type} 
        showToastCallback={toast.hide} 
    />
{/if}

{#if settings.isLoading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <div class="loading-text">{t.system.loading}</div>
        </div>
{/if}

<div class="wrapper">
    <div class="wrapper__container">
            <header class="container__header">
                <nav class="header__nav" bind:this={navElement}>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="header__logo" onclick={() => goto('/')}>🏠 Realsy</div>

                    <ul class="header__nav__list {menuOpen ? 'open' : ''}">
                        <li class="header__nav__list__item">
                            <button class={$page.url.pathname === '/' ? 'active' : ''} onclick={() => { menuOpen = false; goto('/'); }}>
                                👋 {t.header.page_main}
                            </button>
                        </li>
                        <li class="header__nav__list__item">
                            <button class={$page.route.id?.startsWith('/offers') ? 'active' : ''} onclick={() => { menuOpen = false; goto('/offers'); }}>
                                📋 {t.header.page_offers}
                            </button>
                        </li>
                        {#if $auth.isAuthenticated && (auth.hasRole(Roles.Realtor) || auth.hasRole(Roles.Admin))}
                            <li class="header__nav__list__item">
                                <button class={$page.route.id?.startsWith('/reports') ? 'active' : ''} onclick={() => { menuOpen = false; goto('/reports'); }}>
                                    📊 {t.header.page_reports}
                                </button>
                            </li>
                        {/if}

                        {#if $auth.isAuthenticated}
                            <li class="header__nav__list__item">
                                <button class={$page.route.id?.startsWith('/chats') ? 'active' : ''} onclick={() => { menuOpen = false; goto('/chats'); }}>
                                    💬 {t.header.page_chats}
                                </button>
                            </li>
                        {/if}

                        {#if $auth.isAuthenticated}
                            <li class="header__nav__list__item login-logout-btn">
                                <button onclick={logout}>
                                    ⬅️ {t.header.logout}
                                </button>
                            </li>
                        {:else}
                            <li class="header__nav__list__item login-logout-btn">
                                <button class={$page.route.id?.startsWith('/login') ? 'active' : ''} onclick={() => goto('/login')}>
                                    ➡️ {t.header.login}
                                </button>
                            </li>
                        {/if}
                    </ul>

                    <div class="header__controls">
                        <button class="control-btn" onclick={() => settings.toggleLang()} title="{ t.system.changeLang }">
                            🌐 {settings.lang === 'EN' ? t.header.lang_en : t.header.lang_ua}
                        </button>
                        
                        <button class="control-btn" onclick={() => settings.toggleTheme()} title="{ t.system.changeLang }">
                            {settings.theme === 'dark' ? '🌙' : '☀️'} {settings.theme === 'dark' ? t.header.theme_dark : t.header.theme_light}
                        </button>

                        <div class="divider"></div>

                        {#if $auth.isAuthenticated}
                            <button class="profile-container {$page.route.id?.startsWith('/personal') ? 'profile-container-active' : ''}" onclick={() => goto('/personal/profile')}>
                                <div class="avatar-wrapper">
                                    {#if $auth.avatarUrl}
                                        <img 
                                            src={$auth.avatarUrl} 
                                            alt="User Avatar" 
                                            class="avatar-img" 
                                        />
                                    {:else}
                                        <div class="default-avatar">👤</div>
                                    {/if}
                                </div>
                                <h3 class="profile-name">{$auth.name}</h3>
                            </button>
                            <button class="logout-btn" onclick={logout}>{t.header.logout}</button>
                        {:else}
                            <button class="login-btn" onclick={() => goto('/login')}>{t.header.login}</button>
                        {/if}

                        <!-- svelte-ignore a11y_consider_explicit_label -->
                        <button class="burger {menuOpen ? 'open' : ''}" onclick={() => (menuOpen = !menuOpen)}>
                            <div class="line"></div>
                            <div class="line"></div>
                            <div class="line"></div>
                        </button>
                    </div>
                </nav>
            </header>

        <main class="container__main">
            {@render children()}
        </main>
    </div>
</div>

<style>
    .loading-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 15, 15, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(4px);
    }

    .spinner {
        width: 60px;
        height: 60px;
        border: 6px solid rgba(255, 255, 255, 0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    .loading-text {
        color: #fff;
        font-size: 1.2rem;
        font-weight: 500;
        letter-spacing: 1px;
        animation: fadeIn 1.2s ease-in-out infinite alternate;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    @keyframes fadeIn {
        from { opacity: 0.4; }
        to { opacity: 1; }
    }

    .wrapper {
        background: var(--bg-gradient);
        color: var(--main-text);
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        width: 100%;
        transition: background 0.4s ease, color 0.4s ease;
    }

    .wrapper__container {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .container__main{
        flex: 1;
        display: flex;
        justify-content: center;
    }

    .container__header {
        background: var(--header-bg);
        backdrop-filter: blur(10px);
        padding: 0 1.5rem;
        min-height: 60px;
        display: flex;
        align-items: center;
        border-radius: 0 0 20px 20px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
        position: sticky;
        top: 0;
        z-index: 100;
    }

    .header__nav {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
    }

    .header__logo {
        font-weight: 800;
        font-size: 1.4rem;
        color: white;
        cursor: pointer;
        letter-spacing: -0.5px;
    }

    .header__controls {
        display: flex;
        align-items: center;
        gap: 0.8rem;
    }

    .control-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 0.4rem 0.7rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .control-btn:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .divider {
        width: 1px;
        height: 24px;
        background: rgba(255, 255, 255, 0.3);
        margin: 0 5px;
    }

    .login-btn, .logout-btn {
        background: var(--accent-color);
        color: #4b2c85;
        border: none;
        padding: 0.5rem 1.2rem;
        border-radius: 5px;
        font-weight: 600;
        cursor: pointer;
    }

.profile-container {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: var(--text-primary);
    
    padding: 0.4rem 1rem 0.4rem 0.4rem; 
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(5px);
    outline: none;
}

.profile-container:hover, .profile-container-active {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    border-color: var(--accent-color);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2), 0 0 10px rgba(251, 191, 36, 0.1);
}

.avatar-wrapper {
    width: 2.5rem;
    height: 2.5rem;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.1);
}

.avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.default-avatar {
    font-size: 1.2rem;
}

.profile-name {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
}

    .burger {
        display: none;
        flex-direction: column;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
    }

    .burger .line {
        width: 22px;
        height: 2px;
        background: white;
        transition: 0.3s;
    }

    .header__nav__list {
        display: flex;
        justify-content: center;
        align-items: center;
        list-style: none;
        padding: 0;
        margin: 0 1rem; 
        gap: .5rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .header__nav__list__item button:hover, .active {
        color: white !important;
        background: rgba(255, 255, 255, 0.15);
    }

    .active {
        color: #ffd580 !important;
    }

    .active::after {
        width: 100% !important;
    }

    .header__nav__list__item button::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -3px;
        width: 0;
        height: 2px;
        background-color: orange;
        transition: width 0.3s ease;
    }

    .header__nav__list__item button {
        background: transparent;
        color: rgba(255, 255, 255, 0.8);
        transition: all 0.2s;
        position: relative;
        border: none;
        padding: 0.5rem 1.2rem;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: 500;
        font-family: inherit;
    }

    .header__nav__list__item button:hover {
        color: #ffd580;
    }

    .header__nav__list__item button:hover::after {
        width: 100%;
    }

    .login-logout-btn{
        display: none;
    }

    @media (max-width: 850px) {
        .burger { display: flex; }

        .header__nav__list {
            position: absolute;
            top: 80px;
            right: 1.5rem;
            flex-direction: column;
            background: #2d1b4e;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            display: none;
        }

        .header__nav__list.open {
            display: flex;
        }

        .divider, .logout-btn, .login-btn { display: none; }
        .login-logout-btn { display:block; }
    }
</style>