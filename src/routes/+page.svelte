<script lang='ts'>
    import { auth, settings, translations } from '$lib';
    import { goto } from '$app/navigation';
    import { getContext } from 'svelte';
    import type SettingsStore from '$lib/stores/settingsStore.svelte';
    import { Building2, CircleUser, Home, KeyRound, Lock, PartyPopper, Rocket } from 'lucide-svelte';

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);

</script>

<div class="greeting-container">
    {#if $auth.isAuthenticated}
        <div class="greeting-authenticated">
            <div class="greeting-header">
                <div class="company-logo">
                    <div class="logo-icon"><Building2 class="logo-icon-ui" size={40} color={settingsStore.theme === 'dark' ? '#ccc' : '#252525'} /></div>
                    <h1 class="company-name">{t.authorized.title}</h1>
                </div>
            </div>
            <div class="welcome-section">
                <div class="welcome-content">
                    <h2 class="welcome-message">
                        {t.authorized.hello} <span class="user-name">{$auth.personName}</span>!
                        <span class="welcome-emoji"><PartyPopper class="icon-accent bounce" /></span>
                    </h2>
                    <p class="welcome-subtitle">{t.authorized.welcome}</p>
                </div>
                <div class="welcome-animation">
                    <div class="floating-house"><Home class="floating-icon gradient-icon" size={64} color={settingsStore.theme === 'dark' ? '#ccc' : '#252525'} /></div>
                </div>
            </div>
            <div class="user-info">
                <div class="info-card">
                    {#if ($auth.avatarUrl === null || $auth.avatarUrl.length === 0)}
                        <CircleUser size={50} color={settingsStore.theme === 'dark' ? '#ccc' : '#252525'}/>
                    {:else}
                        <img src="{$auth.avatarUrl}" style="width: 3rem;" alt="#">
                    {/if}
                    <div class="info-content">
                        <h3 class="info-title">{t.authorized.name}</h3>
                        <p class="info-value">{$auth.name}</p>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-icon"><KeyRound size={50} color={settingsStore.theme === 'dark' ? '#ccc' : '#252525'}/></div>
                    <div class="info-content">
                        <h3 class="info-title">{t.authorized.roles}</h3>
                        <div class="roles-container">
                            {#each $auth.roles as role}
                                <span class="role-badge">{role}</span>
                            {/each}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {:else}
        <div class="greeting-not-authorized">
            <div class="unauthorized-content">
                <div class="lock-icon"><Lock class="lock-icon-ui" size={64} /></div>
                <h2 class="unauthorized-title">{t.unauthorized.title}</h2>
                <p class="unauthorized-message">
                    {t.unauthorized.message}
                </p>
                <button class="login-button" onclick={() => goto('/login')}>
                    <Rocket class="btn-icon" />
                    {t.unauthorized.loginBtn}
                </button>
            </div>
            <div class="unauthorized-decoration">
                <div class="floating-key"><KeyRound class="floating-decor" size={48} /></div>
            </div>
        </div>
    {/if}
</div>

<style>
    .greeting-container {
        max-width: 900px;
        margin: auto auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        animation: fadeInUp 0.6s ease-out;
        align-content: center;
        height: 100%;
    }

    .greeting-authenticated {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
    }

    .greeting-authenticated::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
        background-size: 300% 100%;
        animation: gradientShift 3s ease-in-out infinite;
    }

    .greeting-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .icon-accent {
        color: #f59e0b;
        filter: drop-shadow(0 4px 10px rgba(245, 158, 11, 0.4));
    }

    .gradient-icon {
        stroke: url(#iconGradient);
        filter: drop-shadow(0 10px 25px rgba(99, 102, 241, 0.4));
    }

    .floating-icon {
        animation: float 3s ease-in-out infinite;
    }

    .lock-icon-ui {
        color: #fbbf24;
        animation: shake 2s infinite;
        filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.4));
    }

    .btn-icon {
        transition: transform 0.2s ease;
    }

    .login-button:hover .btn-icon {
        transform: translateX(4px) scale(1.1);
    }

    .company-logo {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .logo-icon {
        font-size: 2.5rem;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    }

    .company-name {
        margin: 0;
        font-size: 2rem;
        font-weight: 700;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -0.02em;
    }

    .welcome-section {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 2rem;
        align-items: center;
        margin-bottom: 2rem;
        padding: 2rem;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 16px;
        backdrop-filter: blur(10px);
    }

    .welcome-message {
        margin: 0 0 0.5rem 0;
        font-size: 2.25rem;
        font-weight: 800;
        color: #1f2937;
        line-height: 1.2;
    }

    .user-name {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .welcome-emoji {
        display: inline-block;
        animation: bounce 2s infinite;
    }

    .welcome-subtitle {
        margin: 0;
        font-size: 1.125rem;
        color: #6b7280;
        font-weight: 400;
    }

    .welcome-animation {
        position: relative;
    }

    .floating-house {
        font-size: 4rem;
        animation: float 3s ease-in-out infinite;
        filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1));
    }

    .user-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .info-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 12px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .info-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .info-title {
        margin: 0 0 0.25rem 0;
        font-size: 0.875rem;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .info-value {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #1f2937;
    }

    .roles-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .role-badge {
        padding: 0.25rem 0.75rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .greeting-not-authorized {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        padding: 3rem 2rem;
        background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
    }

    .unauthorized-content {
        text-align: center;
    }

    .lock-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.8;
        animation: shake 2s infinite;
    }

    .unauthorized-title {
        margin: 0 0 1rem 0;
        font-size: 2rem;
        font-weight: 700;
        color: #2d3748;
    }

    .unauthorized-message {
        margin: 0 0 2rem 0;
        font-size: 1.125rem;
        color: #4a5568;
        line-height: 1.6;
    }

    .login-button {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem 2rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 1.125rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 4px 14px rgba(102, 126, 234, 0.3);
    }

    .login-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .login-icon {
        font-size: 1.25rem;
    }

    .unauthorized-decoration {
        position: relative;
    }

    .floating-key, .floating-door {
        position: absolute;
        font-size: 3rem;
        opacity: 0.3;
    }

    .floating-key {
        top: -20px;
        right: 20px;
        animation: float 2s ease-in-out infinite;
    }

    .floating-door {
        bottom: -20px;
        right: -10px;
        animation: float 2s ease-in-out infinite reverse;
    }

:global([data-theme="dark"]) .greeting-authenticated {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

:global([data-theme="dark"]) .welcome-section {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

:global([data-theme="dark"]) .info-card {
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

:global([data-theme="dark"]) .greeting-not-authorized {
    background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
}

:global([data-theme="dark"]) .welcome-message,
:global([data-theme="dark"]) .unauthorized-title,
:global([data-theme="dark"]) .info-value {
    color: #f8fafc;
}

:global([data-theme="dark"]) .welcome-subtitle,
:global([data-theme="dark"]) .unauthorized-message,
:global([data-theme="dark"]) .info-title {
    color: #94a3b8;
}

:global([data-theme="dark"]) .role-badge {
    background: linear-gradient(135deg, #818cf8 0%, #a855f7 100%);
    box-shadow: 0 2px 10px rgba(129, 140, 248, 0.2);
}

:global([data-theme="dark"]) .logo-icon,
:global([data-theme="dark"]) .floating-house {
    filter: drop-shadow(0 4px 12px rgba(122, 66, 244, 0.4));
}

:global([data-theme="dark"]) .greeting-authenticated::before {
    background: linear-gradient(90deg, #818cf8, #a855f7, #fb7185, #818cf8);
    background-size: 300% 100%;
}

:global([data-theme="dark"]) .lock-icon {
    text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
}

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes gradientShift {
        0%, 100% { background-position: 0 50%; }
        50% { background-position: 100% 50%; }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        60% { transform: translateY(-5px); }
    }

    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
    }

    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
    @media (max-width: 768px) {
        .greeting-container {
            margin: 2rem 0;
            width: 90%;
        }

        .greeting-authenticated,
        .greeting-not-authorized {
            padding: 1.5rem;
        }

        .greeting-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
        }

        .welcome-section {
            grid-template-columns: 1fr;
            text-align: center;
        }

        .company-name {
            font-size: 1.5rem;
        }

        .welcome-message {
            font-size: 1.75rem;
        }

        .user-info {
            grid-template-columns: 1fr;
        }

        .greeting-not-authorized {
            grid-template-columns: 1fr;
            text-align: center;
        }

        .unauthorized-decoration {
            display: none;
        }
    }
</style>