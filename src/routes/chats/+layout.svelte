<script lang='ts'>
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { auth, settings, translations } from '$lib';
    import { chatOfflineState } from '$lib/stores/ChatOfflineStore.svelte.js';
    import chatState from '$lib/stores/chatStore.svelte.js';
    import type SettingsStore from '$lib/stores/settingsStore.svelte';
    import { redirect } from '@sveltejs/kit';
    import { format } from 'date-fns';
    import { getContext, onMount } from 'svelte';
    const { children } = $props();

    let allChats = $derived(chatState.chats);

    onMount(async () => {
        // const userId = $auth.id;
        // console.log(userId);

        // if (!userId){
        //     await goto('/login');
        //     return;
        // }

        settings.isLoading = true;
        await chatState.loadData($auth.id!);
        settings.isLoading = false;
    });

    $effect(() => {
        const chats = chatOfflineState.chats[$auth.id!];
        if (chats) {
            chatState.setChats(chats);
            chatState.initSignalR($auth.id!, `${$auth.name} ${$auth.personSurname}`);
        }
    });

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);

const groupedChats = $derived({
    common: allChats.filter(c => c.chatTypeId === 'fdd46cb6-b697-4aa0-a61d-5659df8efb46'),
    support: allChats.filter(c => c.chatTypeId === '17631888-462b-4be8-975d-7332cce11dfb'), 
    privates: allChats.filter(c => c.chatTypeId === 'c80e92eb-b14d-4258-bf31-e44b1d3e8bc7')
});

let expandedSections = $state(['common', 'support', 'privates']);

function toggleSection(sectionId: string) {
    if (expandedSections.includes(sectionId)) {
        expandedSections = expandedSections.filter(id => id !== sectionId);
    } else {
        expandedSections.push(sectionId);
    }
}

const sections = $derived([
    { id: 'common', title: t.chats.common, items: groupedChats.common },
    { id: 'support', title: t.chats.support, items: groupedChats.support },
    { id: 'privates', title: t.chats.privates, items: groupedChats.privates }
]);
</script>

<div class="chat-wrapper">
    <aside class="contacts-sidebar">
        <div class="sidebar-header">
            <h3>{t.chats.myChats}</h3>
        </div>
        <div class="contacts-list">
{#each sections as section}
        {#if section.items.length > 0}
        <button 
                class="section-header" 
                onclick={() => toggleSection(section.id)}
                aria-expanded={expandedSections.includes(section.id)}
            >
                <span class="chevron" class:rotated={expandedSections.includes(section.id)}>
                    <img src="/icons/chevron-right.svg" alt="" width="12" />
                </span>
                {section.title}
                <span class="count">{section.items.length}</span>
            </button>
{#if expandedSections.includes(section.id)}
                <div class="section-content">
            {#each section.items as chat}
                <a 
                    href="/chats/{chat.chatId}" 
                    class="contact-item" 
                    class:active={page.params.id === chat.chatId}
                >
                    <div class="avatar-wrapper">
                        {#if chat.avatarUrl}
                            <img 
                                src={chat.avatarUrl} 
                                alt="User Avatar" 
                                class="avatar-img" 
                            />
                        {:else}
                            <div class="default-avatar"><img src="/icons/user.svg" height="35" width="35" alt="#"></div>
                        {/if}
                    </div>
                    <div class="contact-info">
                        {#if chat.chatId === '74679c97-aa14-444e-b3ae-9a6d8d01399f'}
                            <span class="contact-name">{t.chats.common}</span>
                        {:else}
                            <span class="contact-name">{chat.chatName}</span>
                        {/if}
                        <span class="contact-role">{chat.closedAt !== null ? `[${t.chats.closed}]` : chat.chatId === '74679c97-aa14-444e-b3ae-9a6d8d01399f' ? `${chat.lastMessageBy} | ${chat.lastMessage}` : chat.lastMessage}</span>
                        <span class="contact-role">{chat.closedAt !== null ? format(new Date(chat.closedAt), format(chat.closedAt, 'MM.dd.yyyy') === format(new Date(), 'MM.dd.yyyy') ? 'HH:mm' : 'dd.MM.yyyy HH:mm') : (chat.lastMessageAt === null ? '' : format(new Date(chat.lastMessageAt), format(chat.lastMessageAt, 'MM.dd.yyyy') === format(new Date(), 'MM.dd.yyyy') ? 'HH:mm' : 'dd.MM.yyyy HH:mm'))}</span>
                    </div>
                </a>
                    {/each}
                </div>
            {/if}
        {/if}
    {/each}
</div>
    </aside>

    <main class="chat-main">
        {@render children()}
    </main>
</div>

<style>
    .chat-wrapper {
        display: grid;
        grid-template-columns: 1fr 3fr;
        height: 85vh;
        margin: 2rem auto;
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        width: 65%;
    }

    .contacts-sidebar {
        background: #f8f9fa;
        border-right: 1px solid #eee;
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        padding: 1.5rem;
        border-bottom: 1px solid #eee;
        background: white;
    }

    .contacts-list {
        overflow-y: auto;
        flex: 1;
    }

.section-divider {
    padding: 0.75rem 1.5rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05rem;
    font-weight: 700;
    color: #888;
    background: #f8f9fa;
    position: sticky;
    top: 0;
    z-index: 10;
    border-bottom: 1px solid #eee;
}

:global([data-theme="dark"]) .section-divider {
    background: #1e293b;
    color: #64748b;
    border-bottom: 1px solid #334155;
}

.section-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: #f8f9fa;
    border: none;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 700;
    color: #666;
    text-transform: uppercase;
    text-align: left;
    position: sticky;
    top: 0;
    z-index: 10;
}

.chevron {
    display: flex;
    transition: transform 0.2s ease;
}

.chevron.rotated {
    transform: rotate(90deg); /* Поворот стрелки вниз при открытии */
}

.count {
    margin-left: auto;
    background: #eee;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.65rem;
    color: #888;
}

.section-content {
    display: flex;
    flex-direction: column;
}

/* Темная тема */
:global([data-theme="dark"]) .section-header {
    background: #1e293b;
    color: #94a3b8;
    border-bottom: 1px solid #334155;
}

:global([data-theme="dark"]) .count {
    background: #334155;
    color: #64748b;
}

    .contact-item {
        display: flex;
        align-items: center;
        gap: .5rem;
        padding: 1rem 1rem;
        text-decoration: none;
        color: #333;
        transition: all 0.2s;
        border-bottom: 1px solid #f1f1f1;
    }

    .contact-item:hover {
        background: #f0ebff;
    }

    .contact-item.active {
        background: #7a42f4;
        color: white;
    }

    .contact-item.active .contact-role {
        color: #e0d4ff;
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

    .contact-info {
        display: flex;
        flex-direction: column;
    }

    .contact-name {
        font-weight: 600;
    }

    .contact-role {
        font-size: 0.8rem;
        color: #888;
    }

    .chat-main {
        display: flex;
        flex-direction: column;
        width: 100%;

        overflow: auto;
    }

    :global([data-theme="dark"]) .chat-wrapper {
        background: #0f172a;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    }

    :global([data-theme="dark"]) .contacts-sidebar {
        background: #1e293b;
        border-right: 1px solid #334155;
    }

    :global([data-theme="dark"]) .sidebar-header {
        background: #1e293b;
        border-bottom: 1px solid #334155;
        color: #f8fafc;
    }

    :global([data-theme="dark"]) .contact-item {
        color: #cbd5e1;
        border-bottom: 1px solid #334155;
    }

    :global([data-theme="dark"]) .contact-item:hover {
        background: #334155;
    }

    :global([data-theme="dark"]) .contact-item.active {
        background: #7a42f4;
        color: white;
    }

    :global([data-theme="dark"]) .avatar {
        background: #334155;
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .contact-role {
        color: #64748b;
    }

    @media (max-width: 900px) {
        .chat-wrapper {
            grid-template-columns: 2fr 4fr;

            height: 80vh;
            border-radius: 0;
        }

        .contact-item{
            flex-direction: column;
            justify-content: center;
            padding: 1rem 0;
        }

        .section-divider {
            padding: 0.5rem;
            text-align: center;
            font-size: 0.6rem;
        }

        .section-header {
            padding: 0.5rem;
            justify-content: center;
        }
        .chevron, .count {
            display: none;
        }
    }
</style>