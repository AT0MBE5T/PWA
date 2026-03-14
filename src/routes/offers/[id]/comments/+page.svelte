<script lang='ts'>
    import type { CommentInterface, AddCommentInterface } from '$lib';
    import { auth, ConfirmModal, Roles, settings, toast, Toast, translations } from '$lib';
    import { format } from 'date-fns';
    import type { PageData } from './$types';
    import { onMount, tick, untrack } from 'svelte';
    import createChatState from '$lib/stores/chatStore.svelte';
    import createCommentState from '$lib/stores/commentStore.svelte';
    import { offerFullStore } from '$lib/stores/OfferFullStore.svelte';
    import { chatOfflineState } from '$lib/stores/ChatOfflineStore.svelte';
    import offerState from '$lib/stores/offerStore.svelte';
    import commentState from '$lib/stores/commentStore.svelte';

    let { data }: { data: PageData } = $props();

    const answerValidation = () => {
        return commentText.length <= 255;
    };

    let commentText = $state<string>('');

    let confirmModal: ConfirmModal;

    let commentContainer: HTMLElement;

    async function deleteComment(commentId: string) {
        const confirmed = await confirmModal.ask();

        if (!confirmed) return;

        await commentState.deleteComment(data.id, commentId);
    }

    let allComments = $derived(commentState.comments);

    $effect(() => {
        const currentId = data.id;
        if (!currentId) return;

        const userName = untrack(() => data.user?.name || 'Guest');

        async function setupChat() {
            try {
                const response = await fetch(`http://localhost:5118/api/Comment/get-comments-by-announcement-id/${currentId}`);
                if (response.ok) {
                    const initialComments = await response.json();
                    offerFullStore.setComments(currentId, initialComments);
                    commentState.setComments(initialComments);
                }
            } catch (e) {
                await offerFullStore.loadComments(currentId);
                const pendingComments = await offerFullStore.getPendingComments();
                let arrToAdd = offerFullStore.comments[currentId].concat(pendingComments);

                const sortedArr = [...arrToAdd].sort((a, b) => {
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                });

                commentState.setComments(sortedArr);
            } finally {
                await commentState.initSignalR(currentId, userName);
            }
        }

        setupChat();

        return () => {
            commentState.stopSignalR();
        };
    });

    async function addComment() {
        if (!commentText.trim()) return;
        await commentState.leaveComment(`${$auth.personName} ${$auth.personSurname}`, data.id, commentText);
        commentText = "";
    }

    $effect(() => {
        if (commentState.comments && commentContainer) {
            tick().then(() => {
                commentContainer.scrollTo({
                    top: commentContainer.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    });

    const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();

            addComment();
        }
    };

const t = $derived(translations[settings.lang]);

</script>

<ConfirmModal bind:this={confirmModal} />

<div class="comments__block">
    <h2 class="comments__title">💬 {t.offers.comments}</h2>
    <div class="comments__block__container" bind:this={commentContainer}>
        {#each allComments as i}
            <div class="comments__item">
                {#if auth.hasRole(Roles.Admin)}
                    <div
                        role="button"
                        tabindex="0"
                        class="comments__block__item__delete"
                        onclick={
                            () => deleteComment(i.id)
                        }
                        onkeydown={
                            (e) => (e.key === 'Enter' || e.key === ' ') && deleteComment(i.id)
                        }>
                        ➖
                    </div>
                {/if}
                {#if i.isPending}
                    🔃
                {/if}
                ⌚ {format(i.createdAt, 'dd.MM.yyyy HH:mm')} | 🦰 {i.author}: {i.text}
            </div>
        {/each}
    </div>
    <div class="comments__block__leave_comment__block">
        <div class="comments__block__comment">
            <textarea
                    placeholder={t.offers.leaveComment}
                    bind:value={commentText}
                    onkeydown={handleKeydown}>
            </textarea>
        </div>
        {#if $auth.isAuthenticated}
            <div class="comment__block__confirm">
                <button onclick={addComment}>{t.offers.leaveComment}</button>
            </div>
        {/if}
    </div>
</div>

<style>
    .comments__block__leave_comment__block{
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .comments__block__comment {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    textarea {
        padding: 0.6rem 0.8rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        resize: none;
    }

    textarea:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.3);
    }

    .comments__block {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 2rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #fff8e7 100%);
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        width: 50%;
        height: 80vh;
        margin: auto auto;
    }

    /* .comments__block::before {
        content: "💬 ${t.offers.comments}";
        font-size: 1.5rem;
        font-weight: bold;
        color: #333;
        text-align: center;
        padding-bottom: 1rem;
        border-bottom: 2px solid rgba(122, 66, 244, 0.2);
        margin-bottom: 1rem;
    } */

    .comments__block__container{
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 2rem;
        overflow-y: scroll;
    }

    .comments__item {
        position: relative;
        background: linear-gradient(135deg, #7a42f4 0%, #9c5dff 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        border-radius: 10px;
        font-size: 1.1rem;
        line-height: 1.5;
        box-shadow: 0 4px 12px rgba(122, 66, 244, 0.3);
        transition: all 0.3s ease;
        overflow-wrap: break-word;
    }

    .comments__item::before {
        content: "💬";
        position: absolute;
        top: -8px;
        left: -8px;
        background: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .comments__item:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(122, 66, 244, 0.4);
    }

    .comment__block__confirm button {
        padding: 0.8rem;
        background-color: #7a42f4;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        width: 100%;
    }

    .comment__block__confirm button:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .comments__item{
        animation: fadeInUp 0.5s ease-out;
    }

    .comments__block:empty::before {
        content: "📭 There are no comments yet";
        color: #999;
        font-style: italic;
        border: none;
        text-align: center;
    }

    ::-webkit-scrollbar {
        width: 6px;
    }

    ::-webkit-scrollbar-track {
        background: #fff8e7;
        border-radius: 12px;
    }

    ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #7a42f4 0%, #ff9900 100%);
        background-size: 300% 300%;
        border-radius: 12px;
        animation: gradientShift 3s ease infinite;
    }

    @keyframes gradientShift {
        0% { background-position: 0 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0 50%; }
    }

    .comments__block__item__delete{
        position: absolute;
        left: 97.5%;
        top: 50%;
        transform: translateY(-50%);
        width: fit-content;
        background: linear-gradient(135deg, #ec436a 0%, #e40a65 100%);
        color: white;
        padding: 0.5rem;
        font-size: 1rem;
        box-shadow: 0 4px 12px rgba(209, 18, 24, 0.3);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .comments__block__item__delete:hover {
        box-shadow: 0 8px 20px rgba(223, 13, 30, 0.4);
        cursor: pointer;
    }

    :global([data-theme="dark"]) .comments__block {
        background: #1e293b;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .comments__block::before {
        color: #f1f5f9;
        border-bottom-color: rgba(122, 66, 244, 0.4);
    }

    :global([data-theme="dark"]) .comments__item {
        background: linear-gradient(135deg, #334155 0%, #475569 100%);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    :global([data-theme="dark"]) .comments__item::before {
        background: #1e293b;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }

    :global([data-theme="dark"]) textarea {
        background-color: #334155;
        border-color: #475569;
        color: white;
    }

    :global([data-theme="dark"]) textarea::placeholder {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) textarea:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.5);
    }

    :global([data-theme="dark"]) .comments__block__container::-webkit-scrollbar-track {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .comments__block__container::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #7a42f4 0%, #475569 100%);
    }

    :global([data-theme="dark"]) .comments__block:empty::before {
        color: #64748b;
    }

    @media (max-width: 768px) {
        .comments__block{
            padding: 1.5rem;
            gap: 0;
            width: 75%;
        }

        .comments__block::before{
            font-size: 1.3rem;
        }

        .comments__block__container{
            padding: 1rem;
        }

        .comments__item{
            width: 100%;
        }

        .comments__block__item__delete{
            font-size: .6rem;
            top: 0;
            left: 95%;
        }
    }
</style>