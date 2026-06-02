<script lang="ts">
    import { auth, Roles, toast, Toast, translations } from '$lib';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { settings } from '$lib';
    import '../app.css';
    import { onMount, setContext, untrack } from 'svelte';
    import { personalStore } from '$lib/stores/PersonalStore.svelte';
    import { env } from '$env/dynamic/public';
    import SettingsStore from '$lib/stores/settingsStore.svelte';
    import type { Language } from '$lib/i18n';
    import SupportChat from '$lib/components/SupportChat.svelte';
    let { data, children } = $props();

    let menuOpen = $state(false);
    let navElement = $state<HTMLElement>();

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
        await auth.logout();
        await goto('/login');
    };

    onMount(async () => {
        if (!$auth.isAuthenticated)
            return;

        try{
            personalStore.loadUserDto($auth.id!);
            personalStore.loadUserStatsDto($auth.id!);
        }catch(error){
            console.error(error);
        }
    });

    async function requestNotificationPermission() {
        if (!("Notification" in window)) {
            console.error("[App] This browser doesn't support notifications");
            return;
        }

        if (Notification.permission === "granted") {
            return "granted";
        }

        if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            return permission;
        }
    }

    async function subscribeUserToPush() {
        try{
            const registration = await navigator.serviceWorker.ready;
            const publicVapidKey = env.PUBLIC_VAPID_KEY;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicVapidKey
            });

            await fetch(`${env.PUBLIC_API_URL}/api/notifications/subscribe`, {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${$auth.accessToken}`,
                }
            });
            settings.online = true;
        }catch{
            settings.online = false;
        }
    }

    $effect(() => {
        untrack(() => {
            requestNotificationPermission();
            if ($auth.isAuthenticated)
                subscribeUserToPush();
        });
    });

    const onlineCheck = async () => {
        if (!navigator.onLine) {
            settings.online = false;
            return;
        }
        
        try {
            const result = await settings.checkServer();
            settings.online = result;
        } catch {
            settings.online = false;
        }
    };

        const goOffline = () => settings.online = false;

        onMount(async () => {
            const result = await settings.checkServer();
            settings.online = result && navigator.onLine;
        });

    onMount(() => {
        window.addEventListener('online', onlineCheck);
        window.addEventListener('offline', goOffline);

        return () => {
            window.removeEventListener('online', onlineCheck);
            window.removeEventListener('offline', goOffline);
        };
    });

    const handleCheck = async () => {
        await onlineCheck();
    };

    setInterval(async() => {
        await settings.checkServer();
    }, 30000);

    const settingsStore = new SettingsStore({
        theme: data.theme ?? "light",
        lang: (data.lang ?? "UA") as Language
    });

    settingsStore.setupEffects();

    setContext('settings', settingsStore);

    settings.lang = settingsStore.lang;

    const t = $derived(translations[settingsStore.lang]);

</script>

<Toast 
    show={$toast.show}
    message={$toast.message} 
    type={$toast.type}
    duration={$toast.duration}
    showToastCallback={toast.hide}
/>

{#if settings.isLoading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <div class="loading-text">{t.system.loading}</div>
        </div>
{/if}

<div class="wrapper">
    {#if $auth.isAuthenticated && settings.online && !$page.route.id?.startsWith('/chats')}
        <SupportChat/>
    {/if}
    <div class="wrapper__container">
            <header class="container__header">
                <nav class="header__nav" bind:this={navElement}>
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_static_element_interactions -->
                    <div class="header__logo" onclick={() => goto('/')}> <img style="width: 2rem; height: 2rem;" src='/icon512_rounded.png' alt="#"/> Realsy</div>

                    <ul class="header__nav__list {menuOpen ? 'open' : ''}">
                        <li class="header__nav__list__item">
                            <button class={$page.url.pathname === '/' ? 'active' : ''} onclick={() => { menuOpen = false; goto('/'); }}>
                                <img src="/icons/house.svg" height="25" width="25" alt="#"> {t.header.page_main}
                            </button>
                        </li>
                        <li class="header__nav__list__item">
                            <button class={$page.route.id?.startsWith('/offers') ? 'active' : ''} onclick={() => { menuOpen = false; goto('/offers?page=1'); }}>
                                <img src="/icons/houses.svg" height="25" width="25" alt="#"> {t.header.page_offers}
                            </button>
                        </li>
                        {#if $auth.isAuthenticated && (auth.hasRole(Roles.Realtor) || auth.hasRole(Roles.Admin))}
                            <li class="header__nav__list__item">
                                <button class={$page.route.id?.startsWith('/reports') ? 'active' : ''} onclick={() => { menuOpen = false; goto('/reports'); }}>
                                    <img src="/icons/chart.svg" height="25" width="25" alt="#"> {t.header.page_reports}
                                </button>
                            </li>
                        {/if}

                        {#if $auth.isAuthenticated}
                            <li class="header__nav__list__item">
                                <button class={$page.route.id?.startsWith('/chats') ? 'active' : ''} onclick={() => { menuOpen = false; goto('/chats'); }}>
                                    <img src="/icons/chat.svg" height="25" width="25" alt="#"> {t.header.page_chats}
                                </button>
                            </li>
                        {/if}

                        {#if $auth.isAuthenticated}
                            <li class="header__nav__list__item login-logout-btn">
                                <button onclick={logout}>
                                    <img src="/icons/logout.svg" height="25" width="25" alt="#"> {t.header.logout}
                                </button>
                            </li>
                        {:else}
                            <li class="header__nav__list__item login-logout-btn">
                                <button class={$page.route.id?.startsWith('/login') ? 'active' : ''} onclick={() => {menuOpen = false; goto('/login');}}>
                                    <img src="/icons/login.svg" height="25" width="25" alt="#"> {t.header.login}
                                </button>
                            </li>
                        {/if}
                    </ul>
                    <div class="header__controls">
                        <button 
                            class="status-badge {settings.online ? 'authenticated' : 'not-authenticated'}" 
                            onclick={handleCheck}
                            disabled={settings.isLoading}
                        >
                            <p class="status-dot {settings.online ? 'pulse' : ''} {settings.online ? '' : 'status-dot-offline'}"></p>
                            <span>{settings.online ? t.authorized.online : t.authorized.offline} </span>
                        </button>
                        <button class="control-btn" onclick={() => settingsStore.toggleLang()} title="{ t.system.changeLang }">
                            <img src="/icons/globe.svg" height="25" width="25" alt="#"> <span>{settingsStore.lang === 'EN' ? t.header.lang_en : t.header.lang_ua}</span>
                        </button>
                        
                        <button class="control-btn" onclick={() => settingsStore.toggleTheme()} title="{ t.system.changeTheme }">
                            {#if (settingsStore.theme === 'dark')}
                                <img src="/icons/moon.svg" height="25" width="25" alt="#">
                            {:else}
                                <img src="/icons/sun.svg" height="25" width="25" alt="#">
                            {/if}
                            <span>{settingsStore.theme === 'dark' ? t.header.theme_dark : t.header.theme_light}</span>
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
                                        <div class="default-avatar"><img src="/icons/user.svg" height="40" width="40" alt="#"></div>
                                    {/if}
                                </div>
                                <h3 class="profile-name">{$auth.personName}</h3>
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

.status-badge {
    appearance: none;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    transition: all 0.2s ease;
}

.status-badge:active {
    transform: scale(0.95);
}

.status-badge:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.status-badge.authenticated {
    background: rgba(34, 197, 94, 0.1);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(34, 197, 94, 0.2);
            font-size: 1.1rem;
        font-weight: 500;
        font-family: inherit;
}

.status-badge.not-authenticated {
    background: rgba(239, 68, 68, 0.1); 
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(239, 68, 68, 0.2);
            font-size: 1.1rem;
        font-weight: 500;
        font-family: inherit;
}

.status-dot, .status-dot-offline {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.status-dot { background: #22c55e; }
.status-dot-offline { background: #ef4444; }

.pulse {
    animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
    0% { box-shadow: 0 0 0 0px rgba(34, 197, 94, 0.4); }
    100% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
}

:global([data-theme="dark"]) .status-badge.authenticated {
    background: rgba(34, 197, 94, 0.15);
    color: #4ade80;
    border-color: rgba(74, 222, 128, 0.3);
}

:global([data-theme="dark"]) .status-badge.not-authenticated {
    background: rgba(239, 68, 68, 0.15);
    color: #f87171;
    border-color: rgba(248, 113, 113, 0.3);
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
        max-width: 86rem;
        margin: 0 auto;
    }

    .header__logo {
        font-weight: 800;
        font-size: 1.4rem;
        color: white;
        cursor: pointer;
        letter-spacing: -0.5px;
        display: flex;
        gap: .3rem;
        align-items: center;
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
        display: flex;
        gap: .3rem;
        align-items: center;
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
    display: flex;
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
        gap: 2px;
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

        display: flex;
        gap: .3rem;
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

    @media (max-width: 1240px) {
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

    @media (max-width: 600px) {
    span {
        display: none;
    }

    .container__header {
        padding: 0 0.8rem;
        border-radius: 0;
    }

    .header__controls {
        gap: 0.5rem;
    }

    .control-btn, .status-badge {
        padding: 0.4rem 0.5rem;
    }

    .profile-name {
        display: none;
    }

    .profile-container {
        padding: 0;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .avatar-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .burger { 
        display: flex; 
    }

    .header__nav__list {
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        width: 100%;
        height: calc(100vh - 60px);
        flex-direction: column;
        background: #2d1b4e;
        padding: 2rem 1rem;
        margin: 0;
        border-radius: 0;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        display: none;
        box-sizing: border-box;
        justify-content: flex-start;
        gap: 1.5rem;
    }

    .header__nav__list.open {
        display: flex;
    }

    .header__nav__list__item {
        width: 100%;
    }

    .header__nav__list__item button {
        width: 100%;
        justify-content: center;
        padding: 1rem;
        font-size: 1.2rem;
    }

    .divider, .logout-btn, .login-btn { 
        display: none; 
    }
    
    .login-logout-btn { 
        display: block; 
        width: 100%;
    }
}
</style>