<script lang='ts'>
    import { ConfirmModal, toast, translations, settings, Roles } from '$lib';
    import { auth } from '$lib';
    import {format} from "date-fns";
    import type { PageData } from './$types';
    import { fade, fly } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import Modal from '$lib/modals/Modal.svelte';
    import { offerFullStore } from '$lib/stores/OfferFullStore.svelte';
    import { onMount } from 'svelte';

    let { data }: { data: PageData } = $props();
    let offer = $derived(offerFullStore.offerDetails[data.id!]);

    onMount(async () => {
        await offerFullStore.loadDetails(data.id!);
    });

    const t = $derived(translations[settings.lang]);

    const onContactAuthor = async () => {
        if($auth.id == null){
            return;
        }

        const confirmed = await confirmModal.ask();

        if(!confirmed){
            return;
        }

        const response = await fetch('http://localhost:5118/api/Chat/get-or-create-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${$auth.accessToken}`
            },
            body: JSON.stringify(offer!.authorId)
        });

        if(!response.ok){
            toast.show(t.offers.creatingDialogueError, 'error');
            return;
        }

        const chatId = await response.json() as string;

        toast.show(t.offers.dialogueCreatedSuccessfully, 'success');
        
        goto(`/chats/${chatId}`);
    };

    const onVerifyClick = async () => {
        const response = await fetch('http://localhost:5118/api/Announcement/switch-verification', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${$auth.accessToken}`
            },
            body: JSON.stringify(data.id)
        });

        if(!response.ok){
            toast.show(offer?.isVerified ? t.offers.unverifyError : t.offers.verifyError, 'error');
            return;
        }

        toast.show(offer?.isVerified ? t.offers.unverifiedSuccessfully : t.offers.verifiedSuccessfully, 'success');

        offer!.isVerified = !offer?.isVerified;
    };

const onFavoriteClick = async (isAdd: boolean) => {
        const response = await fetch(`http://localhost:5118/api/Favorite/${isAdd ? 'add-favorite' : 'delete-favorite'}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${$auth.accessToken}`
            },
            body: JSON.stringify({
                userId: $auth.id,
                announcementId: data.id
            })
        });

        if(!response.ok){
            toast.show(offer?.isFavorite ? t.offers.unfavoriteError: t.offers.favoriteError, 'error');
            return;
        }

        toast.show(offer?.isFavorite ? t.offers.unfavoriteSuccessfully : t.offers.favoriteSuccessfully, 'success');

        offer!.isFavorite = !offer?.isFavorite;
    };

    let confirmModal: ConfirmModal;

    const onDeleteClick = async () => {
        const confirmed = await confirmModal.ask();

        if(!confirmed){
            return;
        }

        const response = await fetch('http://localhost:5118/api/Announcement/delete-announcement-by-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${$auth.accessToken}`
            },
            body: JSON.stringify(data.id)
        });

        if(!response.ok){
            toast.show(t.offers.deletingError, 'error');
            goto('/offers');
            return;
        }

        offerFullStore.removeOffer(data.id);
        offerFullStore.removeOfferFull(data.id);

        toast.show(t.offers.deletedSuccessfully, 'success');
        goto('/offers');
    };

let currentIndex = $state(0);
    let isLightboxOpen = $state(false);
    
    const photos = $derived(offer?.photos.map(x => x.url) ?? []);

    function nextPhoto(e?: Event) {
        e?.stopPropagation();
        currentIndex = (currentIndex + 1) % photos.length;
    }

    function prevPhoto(e?: Event) {
        e?.stopPropagation();
        currentIndex = (currentIndex - 1 + photos.length) % photos.length;
    }

    function toggleLightbox() {
        isLightboxOpen = !isLightboxOpen;
        if (typeof document !== 'undefined') {
            document.body.style.overflow = isLightboxOpen ? 'hidden' : 'auto';
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!isLightboxOpen) return;
        if (e.key === 'Escape') toggleLightbox();
        if (e.key === 'ArrowRight') nextPhoto();
        if (e.key === 'ArrowLeft') prevPhoto();
    }

    const typeData = [
        {
            id: 'af50d369-2a08-4530-9ef7-6eab9535bb28',
            // svelte-ignore state_referenced_locally
            name: t.offers.fakePhotos
        },
        {
            id: '281bc340-d6d0-4793-b962-49733006d034',
            // svelte-ignore state_referenced_locally
            name: t.offers.fraud
        },
        {
            id: '6c0cbff2-ec9e-40cd-bb97-3a6f28ef950a',
            // svelte-ignore state_referenced_locally
            name: t.offers.spam
        },
        {
            id: 'e5382992-5dbe-4507-b11b-70dfb78cf63c',
            // svelte-ignore state_referenced_locally
            name: t.offers.alreadySold
        },
        {
            id: 'd1be6d40-5acc-4bfe-b67f-7e46db5935a8',
            // svelte-ignore state_referenced_locally
            name: t.offers.incorrectPrice
        },
        {
            id: 'cbd35b8e-68da-4864-b961-a6466105ff77',
            // svelte-ignore state_referenced_locally
            name: t.offers.wrongLocation
        },
        {
            id: '328fa889-a350-4f0f-8906-a7302c8db058',
            // svelte-ignore state_referenced_locally
            name: t.offers.offensiveContent
        },
        {
            id: 'eaeadf75-6ce4-4d8d-834d-1acd607b0b14',
            // svelte-ignore state_referenced_locally
            name: t.offers.unprofessionalBehaviour
        },
        {
            id: '226922c1-5227-41a6-bba1-612f797cdd0a',
            // svelte-ignore state_referenced_locally
            name: t.offers.duplicateListing
        },
        {
            id: '38b6ba77-2c9f-400c-9ca4-8d4a618d31e1',
            // svelte-ignore state_referenced_locally
            name: t.offers.other
        },
    ]

    let showComplaint = $state<boolean>(false);
    let userNote = $state<string>('');
    let typeId = $state<string>(typeData[0].id);

    const createComplaint = async () => {
        const userId = $auth.id;
        const offerId = data.id;
        if (userNote === '' || typeId === '' || userId === null || offerId === undefined)
            return;

        await fetch('http://localhost:5118/api/Complaint/add-complaint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                announcementId: offerId,
                userNote,
                typeId
            })
        });

        showComplaint = false;
    }

</script>

<svelte:window onkeydown={handleKeydown} />

<ConfirmModal bind:this={confirmModal} />

<Modal
        bind:open={showComplaint}
        title="Complain"
>
    <div class="complaint__form">
        <div class="complaint__form__type">
            <label for="type">{t.offers.reasonForComplain}</label>
            <select id="type" bind:value={typeId} name="type">
                {#each typeData as type (type.id)}
                    <option value={type.id}>{type.name}</option>
                {/each}
            </select>
        </div>
        <div class="complaint__form__text">
            <label for="notes">{t.offers.notes}</label>
            <input bind:value={userNote} name="notes" type="text" />
        </div>
    </div>

    <svelte:fragment slot="footer">
        <button class="btn" onclick={createComplaint}>{t.offers.complain}</button>
    </svelte:fragment>
</Modal>

<div class="item__container">
    <div class="description__item">
        <header>
            <div class="header__container">
                <div class="header__container__actions">
                    <div class="header__container__verification">
                        {#if auth.hasRole(Roles.Admin)}
                            <div class={offer?.isVerified ? 'footer__container__unverify' : 'footer__container__verify'}>
                                <button onclick={onVerifyClick}>{offer?.isVerified ? t.offers.unverify : t.offers.verify}</button>
                            </div>
                        {/if}
                        <div class="header__container__verification__text">
                            {offer?.isVerified ? `✅ ${t.offers.verified}` : `❌ ${t.offers.unverified}`}
                        </div>
                    </div>
                    <div class="header__container__favoriting">
                        {#if $auth.isAuthenticated}
                            <div class={offer?.isFavorite ? 'footer__container__unfavorite' : 'footer__container__favorite'}>
                                <button onclick={() => onFavoriteClick(!offer?.isFavorite!)}>{offer?.isFavorite ? t.offers.unfavorite : t.offers.favorite}</button>
                            </div>
                        {/if}
                        <div class="header__container__favorite__text">
                            {offer?.isFavorite ? `🌟 ${t.offers.inFavorite}` : `⭐ ${t.offers.addInFavorite}`}
                        </div>
                    </div>
                </div>
                <div class="header__container__title">{offer?.title}</div>
                <div class="header__container__content">
                    <div class="description__item__left__image_block">
                        <div class="carousel">
                            {#if photos.length > 0}
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <div class="carousel__main" onclick={toggleLightbox} role="button" tabindex="0">
                                    <img src={photos[currentIndex]} alt="Property" />
                                    <div class="zoom-hint">🔍 {t.offers.clickToEnlarge}</div>
                                    
                                    {#if photos.length > 1}
                                        <button class="nav-btn prev" onclick={prevPhoto}>❮</button>
                                        <button class="nav-btn next" onclick={nextPhoto}>❯</button>
                                    {/if}
                                </div>

                                <div class="carousel__thumbnails">
                                    {#each photos as photo, i}
                                        <button 
                                            class="thumbnail {i === currentIndex ? 'active' : ''}" 
                                            onclick={() => currentIndex = i}
                                        >
                                            <img src={photo} alt="Thumbnail {i}" />
                                        </button>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    </div>
                    <div class="description__item__right__main_info_block">
                        <div class="description__item__right__main_info_block__item">💵 {t.offers.price}: {offer?.price} ₴</div>
                        <div class="description__item__right__main_info_block__item">🔐 {t.offers.statementType}: {offer?.statementTypeName}</div>
                        <div class="description__item__right__main_info_block__item">🏠 {t.offers.propertyType}: {offer?.propertyTypeName}</div>
                        <div class="description__item__right__main_info_block__item">👁️ {t.offers.viewsCnt}: {offer?.viewsCnt}</div>
                    </div>    
                </div>

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        {#if isLightboxOpen}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="lightbox" transition:fade={{ duration: 200 }} onclick={toggleLightbox}>
                <button class="close-btn">&times;</button>
                
                <div class="lightbox__content" onclick={(e) => e.stopPropagation()}>
                    <img 
                        src={photos[currentIndex]} 
                        alt="Full size property" 
                        transition:fly={{ y: 20, duration: 300 }}
                    />
                    
                    {#if photos.length > 1}
                        <button class="nav-btn prev big" onclick={prevPhoto}>❮</button>
                        <button class="nav-btn next big" onclick={nextPhoto}>❯</button>
                    {/if}
                </div>
                
                <div class="lightbox__counter">
                    {currentIndex + 1} / {photos.length}
                </div>
            </div>
        {/if}
            </div>
        </header>

        <main>
            <div class="main__container">
                <div class="shop__item__description__block__item item__location">📌 {t.offers.location}: {offer?.location}</div>
                <div class="main__container__content">
                    <div class="shop__item__description__block__item">🪜 {t.offers.floors}: {offer?.floors}</div>
                    <div class="shop__item__description__block__item item__rooms">🛏 {t.offers.rooms}: {offer?.rooms}</div>
                    <div class="shop__item__description__block__item item__area">📐 {t.offers.area}: {offer?.area} {t.offers.sqm}</div>
                </div>
                <div class="shop__item__description__block__item item__content">📃 {t.offers.content}: {offer?.content}</div>
            </div>
        </main>️

        <footer>
            <div class="footer__container">
                <div class="shop__item__description__block__item item__description">📄 {t.offers.description}: {offer?.description}</div>
                <div class="footer__container__publisher_info_block">
                    <div class="shop__item__description__block__item">🦰 {t.offers.author}: {offer?.author}</div>
                    <div class="shop__item__description__block__item">
                        ⌚ {t.offers.createdAt}: 
                        {offer?.createdAt ? format(offer.createdAt, 'dd.MM.yyyy HH:mm') : ''}
                    </div>
                </div>
                {#if $auth.isAuthenticated}
                    <div class="footer__container__buy">
                        <button onclick={onContactAuthor}>💰 {t.offers.contactRealtor}</button>
                    </div>
                    <div class="footer__container__complain">
                        <button onclick={() => showComplaint = true}>💢 {t.offers.complain}</button>
                    </div>
                {/if}
                {#if auth.hasRole(Roles.Admin) || $auth.id === data.authorId}
                    <div class="footer__container__edit">
                        <button onclick={() => goto(`/offers/${data.id}/edit`)}>✏️ {t.offers.edit}</button>
                    </div>
                {/if}
            </div>
        </footer>
        {#if auth.hasRole(Roles.Admin)}
            <div class="delete__item">
                <button onclick={onDeleteClick}>🗑️ {t.offers.deleteAnnouncement}</button>
            </div>
        {/if}
    </div>
</div>

<style>
    .complaint__form{
        background-color: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .complaint__form__text{
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .complaint__form label {
        font-weight: bold;
        color: #333;
    }

    .complaint__form label {
        font-weight: bold;
        color: #333;
    }

    .complaint__form input {
        padding: 0.6rem 0.8rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .complaint__form input:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.3);
    }

    .item__container {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .description__item {
        max-width: 800px;
        margin: 2rem auto;
        background-color: #fff8e7;
        border-radius: 20px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        overflow: hidden;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        animation: fadeInUp 0.6s ease-out;
    }

    .footer__container__buy button{
        padding: 0.8rem;
        background-color: #7a42f4;
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

    .footer__container__buy button:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .footer__container__complain button{
        padding: 0.8rem;
        background-color: #7a42f4;
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

    .footer__container__complain button:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .footer__container__edit button{
        padding: 0.8rem;
        background-color: #7a42f4;
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

    .footer__container__edit button:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .footer__container__verify button{
        padding: 0.8rem;
        background-color: #42f44e;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: 0;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        border: none;
        border-radius: 8px;
        width: 10rem;
    }

    .footer__container__verify button:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .footer__container__unverify button{
        padding: 0.8rem;
        background-color: #f44242;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        border: none;
        border-radius: 8px;
        width: 10rem;
    }

    .footer__container__unverify button:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

.footer__container__favorite button{
        padding: 0.8rem;
        background-color: #42f44e;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: 0;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        border: none;
        border-radius: 8px;
        width: 10rem;
    }

    .footer__container__favorite button:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .footer__container__unfavorite button{
        padding: 0.8rem;
        background-color: #f44242;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        border: none;
        border-radius: 8px;
        width: 10rem;
    }

    .footer__container__unfavorite button:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .delete__item button {
        padding: 0.8rem;
        background-color: #f44242;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: 0;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        width: 100%;
    }

    .delete__item button:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    header {
        background: linear-gradient(135deg, #7a42f4 0%, #ff9900 100%);
        color: white;
        padding: 1.5rem;
    }

    .header__container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .header__container__verification{
        display: flex;
        flex-direction: column-reverse;
        justify-content: center;
        align-items: center;
        gap: 1rem;
    }

    .header__container__favoriting{
        display: flex;
        flex-direction: column-reverse;
        justify-content: center;
        align-items: center;
        gap: 1rem;
    }

    .header__container__actions{
        width: 100%;
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
    }

    .header__container__favorite__text{
        text-align: end;
        font-size: 1.5rem;
    }

    .header__container__verification__text{
        text-align: start;
        font-size: 1.5rem;
    }

    .header__container__title {
        font-size: 2rem;
        font-weight: bold;
        padding-bottom: 1rem;
    }

    .header__container__content{
        display: flex;
        gap: 5rem;
        align-items: flex-start;
    }

    .description__item__left__image_block {
        flex: 0 0 300px;
        height: 100%;
        overflow: hidden;
        border-radius: .5rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);

        padding: .25rem;
    }

    .description__item__left__image_block img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
        transition: transform 0.3s ease;
    }

    .description__item__left__image_block:hover img {
        transform: scale(1.05);
    }

    .description__item__right__main_info_block {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .description__item__right__main_info_block__item {
        font-size: 1.2rem;
        font-weight: 500;
        padding: 0.5rem 0;
        border-bottom: 1px solid rgba(255,255,255,0.3);
    }

    .description__item__right__main_info_block__item:first-child {
        font-size: 1.8rem;
        font-weight: bold;
        border-bottom: 2px solid rgba(255,255,255,0.5);
        padding-bottom: 1rem;
    }

    main {
        padding: 1.5rem;
        background-color: #fff8e7;
    }

    .main__container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .item__location{
        border-right: 4px solid #7a42f4;
    }

    .main__container__content{
        display: flex;
        justify-content: space-between;
        gap: 1.5rem;
    }

    .shop__item__description__block__item {
        background-color: #ffffff;
        padding: 1rem;
        border-radius: 12px;
        font-size: 1.1rem;
        color: #333;
        border-left: 4px solid #7a42f4;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .shop__item__description__block__item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .item__rooms{
        border-left: none;
        border-bottom: 4px solid #7a42f4;
    }

    .item__content{
        border-right: 4px solid #7a42f4;
    }

    .item__area{
        border-left: none;
        border-right: 4px solid #7a42f4;
    }

    footer {
        background-color: #f5f5f5;
        padding: 1.5rem;
        border-top: 1px solid rgba(0,0,0,0.1);
    }

    .footer__container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    footer .shop__item__description__block__item {
        background-color: #ffffff;
        border-left: 4px solid #ff9900;
    }

    footer .shop__item__description__block__item:last-child {
        border-left: none;
        border-right: 4px solid #ff9900;
    }

    .footer__container__publisher_info_block{
        display: flex;
        justify-content: space-between;
    }

    .item__description{
        border-right: 4px solid #ff9900;
    }

    .carousel {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
        width: 100%;
    }

    .carousel__main {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 10;
        overflow: hidden;
        border-radius: 12px;
        background: #000;
    }

    .carousel__main img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.2s ease;
    }

    .nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        padding: 1rem 0.6rem;
        cursor: pointer;
        font-size: 1.5rem;
        transition: background 0.2s;
        backdrop-filter: blur(4px);
        z-index: 2;
    }

    .nav-btn:hover {
        background: rgba(122, 66, 244, 0.8);
    }

    .prev { left: 0; border-radius: 0 8px 8px 0; }
    .next { right: 0; border-radius: 8px 0 0 8px; }

    .carousel__thumbnails {
        display: flex;
        overflow-y: auto;
        overflow-x: hidden;
        justify-content: space-between;

        flex-wrap: wrap;
        row-gap: 1rem;
    }

    .thumbnail {
        flex: 0 0 80px;
        height: 60px;
        border: 2px solid transparent;
        border-radius: .5rem;
        overflow: hidden;
        cursor: pointer;
        padding: 0;
        transition: all 0.2s;
        background: none;
    }

    .thumbnail img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .thumbnail.active {
        border-color: #7a42f4;
        transform: scale(0.95);
    }

    .carousel__thumbnails::-webkit-scrollbar {
        height: 4px;
    }
    .carousel__thumbnails::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 10px;
    }

    .carousel__main {
        cursor: zoom-in;
        position: relative;
    }

    .zoom-hint {
        position: absolute;
        top: 10px;
        left: 10px;
        background: rgba(0,0,0,0.5);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 0.7rem;
        opacity: 0;
        transition: opacity 0.3s;
    }

    .carousel__main:hover .zoom-hint {
        opacity: 1;
    }

    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        backdrop-filter: blur(8px);
    }

    .lightbox__content {
        position: relative;
        max-width: 90%;
        max-height: 85vh;
    }

    .lightbox__content img {
        max-width: 100%;
        max-height: 85vh;
        object-fit: contain;
        border-radius: 4px;
        box-shadow: 0 0 30px rgba(0,0,0,0.5);
    }

    .close-btn {
        position: absolute;
        top: 20px;
        right: 30px;
        background: none;
        border: none;
        color: white;
        font-size: 3rem;
        cursor: pointer;
        line-height: 1;
    }

    .nav-btn.big {
        background: rgba(255, 255, 255, 0.1);
        padding: 2rem 1rem;
        font-size: 2.5rem;
    }

    .nav-btn.big:hover {
        background: rgba(122, 66, 244, 0.5);
    }

    .lightbox__counter {
        position: absolute;
        bottom: 20px;
        color: white;
        font-size: 1.2rem;
        font-weight: 300;
    }

    :global([data-theme="dark"]) .carousel__thumbnails::-webkit-scrollbar-thumb {
        background: #334155;
    }

    :global([data-theme="dark"]) .description__item {
        background-color: #1e293b;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) main,
    :global([data-theme="dark"]) footer {
        background-color: #1e293b;
    }

    :global([data-theme="dark"]) footer {
        border-top: 1px solid #334155;
    }

    :global([data-theme="dark"]) .shop__item__description__block__item {
        background-color: #0f172a;
        color: #cbd5e1;
        border-left-color: #7c3aed;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    }

    :global([data-theme="dark"]) .shop__item__description__block__item:hover {
        background-color: #1e293b;
        border-left-color: #ff9900;
    }

    :global([data-theme="dark"]) .item__location,
    :global([data-theme="dark"]) .item__content,
    :global([data-theme="dark"]) .item__area {
        border-right-color: #7c3aed;
    }

    :global([data-theme="dark"]) .item__rooms {
        border-bottom-color: #7c3aed;
    }

    :global([data-theme="dark"]) .description__item__right__main_info_block__item {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: #e2e8f0;
    }

    :global([data-theme="dark"]) .description__item__right__main_info_block__item:first-child {
        border-bottom: 2px solid #7c3aed;
        color: #fff;
    }

    :global([data-theme="dark"]) .footer__container__buy button {
        background-color: #7c3aed;
    }

    :global([data-theme="dark"]) .footer__container__buy button:hover {
        background-color: #ff9900;
        color: #000;
    }

    :global([data-theme="dark"]) .footer__container__complain button {
        background-color: #7c3aed;
    }

    :global([data-theme="dark"]) .footer__container__complain button:hover {
        background-color: #ff9900;
        color: #000;
    }

    :global([data-theme="dark"]) footer .shop__item__description__block__item {
        background-color: #0f172a;
        border-left-color: #ff9900;
    }

    :global([data-theme="dark"]) footer .shop__item__description__block__item:last-child {
        border-right-color: #ff9900;
    }

    :global([data-theme="dark"]) .carousel__thumbnails::-webkit-scrollbar-thumb {
        background: #475569;
    }

    :global([data-theme="dark"]) .thumbnail {
        background-color: #0f172a;
    }

    :global([data-theme="dark"]) .thumbnail.active {
        border-color: #ff9900;
    }

    :global([data-theme="dark"]) header {
        background: linear-gradient(135deg, #4c1d95 0%, #b45309 100%);
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

    @media (max-width: 768px) {
        .description__item {
            margin: 1rem;
            border-radius: 16px;
        }

        .header__container {
            gap: 1.5rem;
        }

        .header__container__content{
            flex-direction: row;
            gap: 1rem;
        }

        .description__item__left__image_block{
            width: 100%;
        }

        .main__container {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        header,
        main,
        footer {
            padding: 1.5rem;
        }

        .description__item__right__main_info_block__item:first-child {
            font-size: 1.5rem;
        }
    }

    @media (max-width: 600px) {
        .header__container__content{
            flex-direction: column;
            gap: 1rem;
        }
    }

    @media (max-width: 480px) {
        .description__item {
            margin: 0.5rem;
            border-radius: 12px;
        }

        header,
        main,
        footer {
            padding: 1rem;
        }

        .description__item__right__main_info_block__item {
            font-size: 1rem;
        }

        .description__item__right__main_info_block__item:first-child {
            font-size: 1.3rem;
        }

        .shop__item__description__block__item {
            font-size: 1rem;
            padding: 0.75rem;
        }
    }
</style>