<script lang='ts'>
    import { settings, translations, type AnnouncementShort } from '$lib';
    import { translatePropertyType, translateStatementType } from '$lib/i18n';
    import type SettingsStore from '$lib/stores/settingsStore.svelte';
    import { getContext, type Snippet } from 'svelte';

    let { item, btn_ok_name }: { item: AnnouncementShort, btn_ok_name: Snippet } = $props();

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);
</script>

<div class="shop__item">
    
    {#if item.isVerified}
        <div class="shop__item__description__block__verification"><img src="/icons/check.svg" height="50" width="50" alt="#"></div>
    {/if}
    {#if item.isFavorite}
        <div class="shop__item__description__block__favoriting"><img src="/icons/star.svg" height="50" width="50" alt="#"></div>
    {/if}
    <div class="shop__item__image_block">
        <img src={item.photoUrl} alt={item.title} />
    </div>

    <div class="shop__item__name" title={item.title}>
        {item.title}
    </div>

    <div class="shop__item__description__block">
        <div class="shop__item__description__block__short-description">
            <div class="shop__item__description__block__short-description__item"><img src="/icons/lock.svg" height="20" width="20" alt="#"> {translateStatementType(item.statementTypeName, settingsStore.lang)}</div>
            <div class="shop__item__description__block__short-description__item align-end"><img src="/icons/house.svg" height="20" width="20" alt="#"> {translatePropertyType(item.propertyTypeName, settingsStore.lang)}</div>
            <div class="shop__item__description__block__short-description__item"><img src="/icons/money.svg" height="20" width="20" alt="#"> {item.price} ₴</div>
            <div class="shop__item__description__block__short-description__item align-end"><img src="/icons/ruler.svg" height="20" width="20" alt="#"> {item.area} {t.offers.sqm}</div>
        </div>
        <div class="shop__item__description__block__item" title="{item.location}"><img src="/icons/pin.svg" height="20" width="20" alt="#"> {item.location}</div>
        <div class="shop__item__description__block__item"><img src="/icons/eye.svg" height="20" width="20" alt="#"> {item.viewsCnt}</div>
    </div>

    <div class="shop__item__button__block">
        {#if btn_ok_name}
            {@render btn_ok_name()}
        {:else}
            <button class="shop__item__button__block__buy_button">{t.offers.ok}</button>
        {/if}
    </div>
</div>

<style>
    .shop__item {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 0.8rem;
        height: 32rem;
        width: 20rem;
        background-color: #fff8e7;
        border-radius: 16px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .shop__item:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
    }

    .shop__item__image_block {
        flex-shrink: 0;
        height: 12rem;
        border-radius: 12px;
        overflow: hidden;
        background: #eee;
    }

    .shop__item__image_block img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
        transition: transform 0.3s ease;
    }

    .shop__item:hover .shop__item__image_block img {
        transform: scale(1.05);
    }

    .shop__item__name {
        font-size: 1.2rem;
        font-weight: 600;
        text-align: center;
        color: #333;
        line-height: 1.2;
        height: 3rem;
        overflow: hidden;
        margin-top: 0.5rem;
        padding: 0 0.5rem;
    }

    .shop__item__description__block {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        gap: 0.5rem;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 1rem;
        color: #555;
    }

    .shop__item__description__block__short-description {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px 0;
    }

    .shop__item__description__block__short-description__item,
    .shop__item__description__block__item {
        padding: 4px 0;
        border-bottom: 1px solid rgba(0,0,0,0.05);
    }

    .shop__item__description__block__verification{
        position: absolute;
        right: 0;
        top: 0;
        font-size: 1.5rem;
        z-index: 1;
    }

    .shop__item__description__block__favoriting{
        position: absolute;
        left: 0;
        top: 0;
        font-size: 1.5rem;
        z-index: 1;
    }

    .align-end {
        text-align: end;
    }

    .shop__item__button__block {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: auto;
    }

    .shop__item__button__block__buy_button {
        flex: 1;
        height: 2.5rem;
        border: none;
        background-color: #7a42f4;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
    }

    .shop__item__button__block__buy_button:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .shop__item__description__block__item {
        padding: 4px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        vertical-align: middle;
        border-bottom: 1px solid rgba(0,0,0,0.05);
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :global([data-theme="dark"]) .shop__item {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }

    :global([data-theme="dark"]) .shop__item__name {
        color: var(--text-main);
    }

    :global([data-theme="dark"]) .shop__item__description__block {
        color: var(--text-muted);
    }

    :global([data-theme="dark"]) .shop__item__description__block__short-description__item,
    :global([data-theme="dark"]) .shop__item__description__block__item {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    :global([data-theme="dark"]) .shop__item__image_block img {
        filter: brightness(0.9);
    }

    :global([data-theme="dark"]) .shop__item:hover .shop__item__image_block img {
        filter: brightness(1.1);
    }
</style>