<script lang='ts'>
    import { format } from 'date-fns';
    import { auth, ConfirmModal, settings, toast, translations, type BuyRequest } from '$lib';
    import { getContext, tick } from 'svelte';
    import { chatOfflineState } from '$lib/stores/ChatOfflineStore.svelte.js';
    import chatState from '$lib/stores/chatStore.svelte.js';
    import { offerFullStore } from '$lib/stores/OfferFullStore.svelte.js';
    import { env } from '$env/dynamic/public';
    import type SettingsStore from '$lib/stores/settingsStore.svelte.js';

    let { data } = $props();
    let textInput = $state<string>('');
    let messageContainer: HTMLElement;
    let chat = $derived(chatState.chats.find(x => x.chatId === data.chatId));

    let allMessages = $derived(chatState.messages);

    $effect(() => {
        const chatId = data.chatId;
        settings.isLoading = true;
        (async () => {
            await chatState.loadMessages(chatId);
        })();
        settings.isLoading = false;
    });

$effect(() => {
    const chatId = data.chatId;
    const userName = `${data.user?.name} ${data.user?.personSurname}`;

    if (!chatId || !userName) return;

    const offlineMessages = chatOfflineState.messages[chatId];
    if (offlineMessages) {
        chatState.setMessages(offlineMessages);
    }

    chatState.initSignalR($auth.id!, userName, chatId);

    return () => {
        chatState.stopSignalR();
    };
});

    const onCloseAnnouncementClick = async () => {
        if($auth.id == null){
            return;
        }

        const confirmed = await confirmModal.ask();

        if(!confirmed){
            return;
        }

        const chatWithId = allMessages.find(x => x.senderId !== $auth.id)?.senderId;

        if (!chatWithId)
            return;

        const dataForBuy: BuyRequest = {
            announcementId: chat?.offerId!,
            customerId: chatWithId
        };

        try{
            const response = await fetch(`${env.PUBLIC_API_URL}/api/announcements/close-announcement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${$auth.accessToken}`
                },
                body: JSON.stringify(dataForBuy)
            });

            if(!response.ok){
                toast.show(t.offers.closeError, 'error');
                return;
            }

            toast.show(t.offers.closeSuccess, 'success');
            offerFullStore.offerDetails[chat?.offerId!].closedAt = new Date().toISOString();
            settings.online = true;
        }catch{
            settings.online = false;
        }
    };

    async function sendMessage() {
        if (!textInput.trim()) return;
        await chatState.sendMessage($auth.id!, `${$auth.name} ${$auth.personSurname}`, data.chatId, textInput, chat?.offerId!, chat?.realtorId!);
        textInput = "";
    }

    let confirmModal: ConfirmModal;

    const addMessage = async () => {
        sendMessage();
    };

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && chat?.closedAt === null) {
            e.preventDefault();
            addMessage();
        }
    };

    $effect(() => {
        if (allMessages && messageContainer) {
            tick().then(() => {
                messageContainer.scrollTo({
                    top: messageContainer.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    });

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);

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
        {#if chat?.closedAt !== null}
            <div class="closed_text">[{t.chats.closed}]</div>
        {/if}
        {#if chat?.closedAt === null && $auth.id === chat?.realtorId}
            <div class="footer__container__close">
                <button onclick={onCloseAnnouncementClick}>🔒 {t.offers.close}</button>
            </div>
        {/if}
    </div>

    <div class="input-area">
        <textarea
            placeholder={t.chats.typeMessage}
            bind:value={textInput}
            onkeydown={handleKeydown}
            disabled={chat?.closedAt !== null}
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

    .closed_text{
        margin: 0 auto;
        font-size: 2rem;
    }

    .footer__container__close button{
        padding: 0.8rem;
        background-color: #f44242;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: 0;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        width: 100%;
        border: none;
        border-radius: 8px;
    }

    .footer__container__close button:hover{
        background-color: #ff9900;
        transform: scale(1.03);
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

    :global([data-theme="dark"]) .footer__container__close button:hover {
        background-color: #ff9900;
        color: #000;
    }

    :global([data-theme="dark"]) .closed_text{
        color: #ccc;
    }

    :global([data-theme="dark"]) .messages-viewport {
        background: #0f172a;
    }

    :global([data-theme="dark"]) .msg-wrapper:not(.mine) .msg-bubble {
        background: #1e293b;
        border-color: #334155;
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .mine .msg-bubble {
        background: linear-gradient(135deg, #6d28d9 0%, #7a42f4 100%);
    }

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

    :global([data-theme="dark"]) .messages-viewport::-webkit-scrollbar-track {
        background: #0f172a;
    }

    :global([data-theme="dark"]) .messages-viewport::-webkit-scrollbar-thumb {
        background: #334155;
    }
</style>