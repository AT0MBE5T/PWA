<script lang='ts'>
    import { page } from '$app/state';
    import { auth, settings, translations } from '$lib';
    import { chatOfflineState } from '$lib/stores/ChatOfflineStore.svelte.js';
    import chatState from '$lib/stores/chatStore.svelte.js';
    import { format } from 'date-fns';
    import { onMount, untrack } from 'svelte';
    const { data, children } = $props();

    let allChats = $derived(chatState.chats);

    onMount(async () => {
        const userId = $auth.id;

        if (!userId)
            return;

        settings.isLoading = true;
        await chatState.loadData($auth.id!);
        settings.isLoading = false;
    });

    $effect(() => {
        const chats = chatOfflineState.chats[$auth.id!];

        untrack(() => {
            if (chats) {
                chatState.setChats(chats);
                chatState.initSignalR($auth.id!, data.user!.name!);
            }
        });

        return () => {
            untrack(() => {
                chatState.stopSignalR();
            });
        };
    });

    const t = $derived(translations[settings.lang]);
</script>

<div class="chat-wrapper">
    <aside class="contacts-sidebar">
        <div class="sidebar-header">
            <h3>{t.chats.myChats}</h3>
        </div>
        <div class="contacts-list">
            {#each allChats as chat}
                <a 
                    href="/chats/{chat.chatId}" 
                    class="contact-item" 
                    class:active={page.params.id === chat.chatId}
                >
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
                    <div class="contact-info">
                        <span class="contact-name">{chat.chatName}</span>
                        <span class="contact-role">{chat.lastMessage}</span>
                        <span class="contact-role">{chat.lastMessageAt === null ? '' : format(new Date(chat.lastMessageAt), format(chat.lastMessageAt, 'MM.dd.yyyy') === format(new Date(), 'MM.dd.yyyy') ? 'HH:mm' : 'dd.MM.yyyy HH:mm')}</span>
                    </div>
                </a>
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

    /* .avatar {
        font-size: 1.5rem;
        background: #eee;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    } */

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
    }
</style>