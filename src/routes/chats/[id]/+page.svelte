<script lang='ts'>
    import { format } from 'date-fns';
    import { auth, ConfirmModal, settings, translations, type Message } from '$lib';
    import { onMount, tick, untrack } from 'svelte';
    import createChatState from '$lib/stores/chatStore.svelte.js';
    import { chatOfflineState } from '$lib/stores/ChatOfflineStore.svelte.js';
    import chatState from '$lib/stores/chatStore.svelte.js';

    let { data } = $props();
    let textInput = $state<string>('');
    let messageContainer: HTMLElement;

    let allMessages = $derived(chatState.messages);

    $effect(() => {
        const chatId = data.chatId;

        (async () => {
            try {
                const response = await fetch(`http://localhost:5118/api/Chat/get-messages-by-chat-id/${chatId}`);
                if (response.ok) {
                    const initialMessages = await response.json() as Message[];
                    chatOfflineState.setMessages(chatId, initialMessages);
                }
            } catch {
                console.log('Оффлайн сообщения берём с кеша');
            } finally {
                await chatOfflineState.loadMessages(chatId);
            }
        })();
    });

$effect(() => {
    const chatId = data.chatId;
    const userName = data.user?.name;

    if (!chatId || !userName) return;

    const offlineMessages = chatOfflineState.messages[chatId];
    if (offlineMessages) {
        chatState.setMessages(offlineMessages);
    }

    chatState.initSignalR(chatId, userName);

    return () => {
        chatState.stopSignalR();
    };
});

    async function sendMessage() {
        if (!textInput.trim()) return;
        await chatState.sendMessage($auth.id!, $auth.name!, data.chatId, textInput);
        textInput = "";
    }

    let confirmModal: ConfirmModal;

    const addMessage = async () => {
        sendMessage();
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addMessage();
        }
    };

    $effect(() => {
        if (chatOfflineState.messages[data.chatId] && messageContainer) {
            tick().then(() => {
                messageContainer.scrollTo({
                    top: messageContainer.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    });

    const t = $derived(translations[settings.lang]);

</script>

<ConfirmModal bind:this={confirmModal} />

<div class="chat-content">
    <div class="messages-viewport" bind:this={messageContainer}>
        {#each allMessages as msg}
            <div class="msg-wrapper" class:mine={msg.senderId === $auth.id}>
                <div class="msg-bubble">
                    <p>{msg.content}</p>
                    <span class="msg-time">
                        {format(new Date(msg.createdAt), format(msg.createdAt, 'MM.dd.yyyy') === format(new Date(), 'MM.dd.yyyy') ? 'HH:mm' : 'dd.MM.yyyy HH:mm')}
                    </span>
                </div>
            </div>
        {:else}
            <div class="empty-chat">
                <p>{t.chats.noMessages}</p>
            </div>
        {/each}
    </div>

    <div class="input-area">
        <textarea
            placeholder={t.chats.typeMessage}
            bind:value={textInput}
            onkeydown={handleKeydown}
        ></textarea>
        <button onclick={addMessage} disabled={!textInput.trim()}>
            <span>➤</span>
        </button>
    </div>
</div>

<style>
    .chat-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
    }

    .messages-viewport {
        flex: 1;
        overflow-y: auto;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background: #fdfcff;
    }

    .msg-wrapper {
        display: flex;
        width: 100%;
        justify-content: flex-start;
    }

    .msg-wrapper.mine {
        justify-content: flex-end;
    }

    .msg-bubble {
        max-width: 70%;
        padding: 0.8rem 1rem;
        border-radius: 15px;
        position: relative;
        background: #fff;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        border: 1px solid #eee;
    }

    .mine .msg-bubble {
        background: #7a42f4;
        color: white;
        border: none;
        border-bottom-right-radius: 2px;
    }

    .msg-wrapper:not(.mine) .msg-bubble {
        background: #fff;
        border-bottom-left-radius: 2px;
    }

    .msg-time {
        font-size: 0.7rem;
        opacity: 0.7;
        display: block;
        margin-top: 0.3rem;
        text-align: right;
    }

    .input-area {
        padding: 1rem 1.5rem;
        background: white;
        border-top: 1px solid #eee;
        display: flex;
        gap: 1rem;
        align-items: flex-end;
    }

    textarea {
        flex: 1;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 0.75rem;
        resize: none;
        height: 45px;
        max-height: 120px;
        font-family: inherit;
    }

    button {
        background: #7a42f4;
        color: white;
        border: none;
        width: 45px;
        height: 45px;
        border-radius: 12px;
        cursor: pointer;
        transition: transform 0.2s;
    }

    button:hover:not(:disabled) {
        transform: scale(1.05);
        background: #6635d0;
    }

    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    /* Фон вікна повідомлень */
    :global([data-theme="dark"]) .messages-viewport {
        background: #0f172a;
    }

    /* Бульбашка іншого користувача (рієлтора) */
    :global([data-theme="dark"]) .msg-wrapper:not(.mine) .msg-bubble {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }

    /* Ваша бульбашка (фіолетова) — зробимо трохи насиченішою */
    :global([data-theme="dark"]) .mine .msg-bubble {
        background: linear-gradient(135deg, #6d28d9 0%, #7a42f4 100%);
    }

    /* Поле вводу */
    :global([data-theme="dark"]) .input-area {
        background: #1e293b;
        border-top: 1px solid #334155;
    }

    :global([data-theme="dark"]) textarea {
        background: #0f172a;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) textarea:focus {
        border-color: #7a42f4;
    }

    /* Скролбар для темної теми */
    :global([data-theme="dark"]) .messages-viewport::-webkit-scrollbar-track {
        background: #0f172a;
    }

    :global([data-theme="dark"]) .messages-viewport::-webkit-scrollbar-thumb {
        background: #334155;
    }
</style>