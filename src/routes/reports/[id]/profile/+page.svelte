<script lang='ts'>
    import { env } from '$env/dynamic/public';
    import type {
        ChangePasswordResponse,
        UserDto} from '$lib';
    import { settings, translations } from '$lib';
    import getCookie from '$lib/utils/cookieData';
    import { format } from 'date-fns';
    import { onMount } from 'svelte';

    let { data } = $props();

    let currentUserId = $derived<string | undefined | null>(data.userUrl);

    onMount(async () => {
        if (currentUserId === undefined || currentUserId === null)
            return;

        await getUserDto(currentUserId);
    });
    
    let userInfo = $state<UserDto | null>(null);

    const getUserDto = async (userId: string) => {
        try {
            const accessToken = getCookie('accessToken');
            const response = await fetch(`${env.PUBLIC_API_URL}/api/accounts/get-user-dto-by-id/${userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const userData = response.ok ? await response.json() as UserDto : null;

            if (!userData)
                return;
            
            userInfo = userData;
            settings.online = true;
        } catch (e) {
            settings.online = false;
        }
    };


    $effect(() => {
        imagePreview = userInfo?.avatar ?? '';
    });

    // svelte-ignore state_referenced_locally
    let imagePreview = $state<string>(userInfo?.avatar ?? '');

const t = $derived(translations[settings.lang]);

</script>

<div class="greeting-container">
    <div class="greeting-authenticated">
        <div class="greeting-header">
            <div class="company-logo">
                <div class="logo-icon">🏢</div>
                <h1 class="company-name">{t.authorization.realEstate}</h1>
            </div>
            <div class="status-badge authenticated">
                <span class="status-dot"></span>
                {t.authorized.online}
            </div>
        </div>
        <div class="user-info">

            <div class="register__form__avatar">
                <label for="image">{t.personal.image}</label>
                <div class="image-upload-container">
                    {#if imagePreview}
                        <div class="image-preview">
                            <img src={imagePreview} alt="Preview" />
                        </div>
                    {/if}
                </div>
            </div>

            <div class="info-card">
                <div class="info-icon">🪪</div>
                <div class="info-content">
                    <h3 class="info-title">{t.authorization.login}</h3>
                    <p class="info-value">{userInfo?.login}</p>
                </div>
            </div>
            <div class="info-card">
                <div class="info-icon">👤</div>
                <div class="info-content">
                    <h3 class="info-title">{t.authorization.name}</h3>
                    <p class="info-value">{userInfo?.name}</p>
                </div>
            </div>
            <div class="info-card">
                <div class="info-icon">👨‍👩‍👦</div>
                <div class="info-content">
                    <h3 class="info-title">{t.authorization.surname}</h3>
                    <p class="info-value">{userInfo?.surname}</p>
                </div>
            </div>
            <div class="info-card">
                <div class="info-icon">🔢</div>
                <div class="info-content">
                    <h3 class="info-title">{t.authorization.age}</h3>
                    <p class="info-value">{userInfo?.age}</p>
                </div>
            </div>
            <div class="info-card">
                <div class="info-icon">📩</div>
                <div class="info-content">
                    <h3 class="info-title">{t.authorization.email}</h3>
                    <p class="info-value">{userInfo?.email}</p>
                </div>
            </div>
            <div class="info-card">
                <div class="info-icon">📱</div>
                <div class="info-content">
                    <h3 class="info-title">{t.authorization.phoneNumber}</h3>
                    <p class="info-value">{userInfo?.phoneNumber}</p>
                </div>
            </div>
            {#if userInfo !== undefined}
                <div class="info-card">
                    <div class="info-icon">⌚</div>
                    <div class="info-content">
                        <h3 class="info-title">{t.personal.registerDate}</h3>
                        <div class="info-value">
                            {userInfo?.createdAt ? format(userInfo.createdAt, 'dd.MM.yyyy HH:mm') : ''}
                        </div>
                    </div>
                </div>
            {/if}
            <div class="info-card">
                <div class="info-icon">📋</div>
                <div class="info-content">
                    <h3 class="info-title">{t.authorized.roles}</h3>
                    <div class="roles-container">
                        {#each userInfo?.roles as role}
                            <span class="role-badge">{role}</span>
                        {/each}
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .greeting-container {
        max-width: 900px;
        margin: auto auto;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        animation: fadeInUp 0.6s ease-out;
    }

    .greeting-authenticated {
        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        position: relative;
        overflow: hidden;
        margin: 2rem auto;
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

    .status-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .status-badge.authenticated {
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
        border: 1px solid rgba(34, 197, 94, 0.2);
    }

    .status-dot {
        width: 8px;
        height: 8px;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse 2s infinite;
    }

    .user-info {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .user-info > :first-child {
        grid-column: span 2;
        justify-content: center;
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

    .info-icon {
        font-size: 2rem;
        opacity: 0.8;
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

    .register__form__avatar{
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .image-upload-container {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .image-preview {
        position: relative;
        display: inline-block;
        max-width: 200px;
        margin: 0 auto;
    }

    .image-preview img {
        width: 100%;
        height: auto;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    :global([data-theme="dark"]) .greeting-authenticated {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    :global([data-theme="dark"]) .info-card {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    :global([data-theme="dark"]) .info-value {
        color: #f8fafc;
    }

    :global([data-theme="dark"]) .info-title {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .role-badge {
        background: linear-gradient(135deg, #818cf8 0%, #a855f7 100%);
        box-shadow: 0 2px 10px rgba(129, 140, 248, 0.2);
    }

    :global([data-theme="dark"]) .status-badge.authenticated {
        background: rgba(34, 197, 94, 0.15);
        color: #4ade80;
        border-color: rgba(74, 222, 128, 0.3);
    }

    :global([data-theme="dark"]) .logo-icon {
        filter: drop-shadow(0 4px 12px rgba(122, 66, 244, 0.4));
    }

    :global([data-theme="dark"]) .greeting-authenticated::before {
        background: linear-gradient(90deg, #818cf8, #a855f7, #fb7185, #818cf8);
        background-size: 300% 100%;
    }

    :global([data-theme="dark"]) label {
        color: #94a3b8;
        font-weight: 500;
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
            margin: 1rem;
            width: 80%;
        }

        .greeting-authenticated {
            padding: 1.5rem;
        }

        .greeting-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
        }

        .company-name {
            font-size: 1.5rem;
        }

        .user-info {
            grid-template-columns: 1fr;
        }
    }
</style>