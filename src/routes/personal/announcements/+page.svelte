<script lang='ts'>
    import { goto } from '$app/navigation';
    import { AnnouncementItem, auth, translations, settings, Roles, toast, getItemsProfilePerPage } from '$lib';
    import { personalStore } from '$lib/stores/PersonalStore.svelte.js';
    import type SettingsStore from '$lib/stores/settingsStore.svelte.js';
    import { getContext, onMount } from 'svelte';

    const { data } = $props();

    let itemsPerPage = getItemsProfilePerPage();

    onMount(() => {
        const handleResize = () => {
            const newSize = getItemsProfilePerPage();

            if (newSize !== itemsPerPage) {
                updatePagination(newSize);
            }
        };

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    });

    function updatePagination(newPageSize: number) {
        itemsPerPage = newPageSize;
        currentPage = currentPage;

        goToPage(currentPage, false);
    }

    $effect(() => {
        const page = data.currentPage;
        const tab = data.currentTab;
        const userId = $auth.id;

        if (userId) {
            switch(tab) {
                case 'Sold': personalStore.loadSold(userId, page ?? 1); break;
                case 'Bought': personalStore.loadBought(userId, page ?? 1); break;
                case 'Placed': loadPlaced(); break;
                case 'Favorite': personalStore.loadFavorite(userId, page ?? 1); break;
            }
        }

        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    });

    const loadPlaced = async () => {
        const page = data.currentPage;
        const tab = data.currentTab;
        const userId = $auth.id;

        const res = await personalStore.loadPlaced(userId!, page ?? 1);
        if (res !== null && res.page !== undefined && res.page !== data.currentPage){
            toast.show(t.system.noData, 'error');
            goToPage(res.page, false);
        }
    };

    let offers = $derived(data.currentTab === 'Sold' ? personalStore.sold :
                            data.currentTab === 'Bought' ? personalStore.bought :
                            data.currentTab === 'Placed' ? personalStore.placed :
                            personalStore.favorite);

    let currentAction = $derived(data.currentTab);

    async function pageClicked(tabName: string) {
        await goto(`?tab=${tabName}&page=1`, { 
            replaceState: false, 
            keepFocus: true, 
            noScroll: true 
        });
    }

    let menuOpen = $state(false);

    let navElement = $state<HTMLElement>();

    function handleOutsideClick(event: Event) {
        const target = event.target as Node | null;
        if (menuOpen && navElement && !navElement.contains(target)) {
            menuOpen = false;
        }
    }

    let currentPage = $derived(data.currentPage ?? 0);
    let totalPages = $derived(offers[$auth.id!]?.totalPages ?? 0);

    let announcementId = $state<string>('');

    const goToPage = (page: number, isClicked: boolean) => {
        if (data.currentPage === undefined || (isClicked && data.currentPage === page))
            return;

        if (page < 1 || page > totalPages)
            page = 1;

        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        
        goto(url.toString(), { invalidateAll: true });
    };

    const offerClicked = async (id: string) => {
        announcementId = id;
        goto(`/offers/${id}/edit`);
    };

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);

</script>

<div class="container">
    <nav class='header__nav' bind:this={navElement}>
        <button
                class="burger"
                aria-label="Toggle menu"
                onclick={() => (menuOpen = !menuOpen)}>
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
        </button>
        <ul class="header__nav__list {menuOpen ? 'open' : ''}">
            <li class='header__nav__list__item'>
                <button class={currentAction === 'Favorite' ? 'highlighted_page' : ''} onclick={() => {
                    pageClicked('Favorite');
                    }}><img src="/icons/star.svg" height="25" width="25" alt="#"> <span>{t.personal.favorite}</span></button>
            </li>
            <li class='header__nav__list__item'>
                <button class={currentAction === 'Bought' ? 'highlighted_page' : ''} onclick={() => {
                    pageClicked('Bought');
                    }}><img src="/icons/cart.svg" height="25" width="25" alt="#"> <span>{t.personal.bought}</span></button>
            </li>
            {#if $auth.roles.includes(Roles.Realtor) || $auth.roles.includes(Roles.Admin)}
                <li class='header__nav__list__item'>
                    <button class={currentAction === 'Sold' ? 'highlighted_page' : ''} onclick={() => {
                        pageClicked('Sold');
                        }}><img src="/icons/dollar.svg" height="25" width="25" alt="#"> <span>{t.personal.sold}</span></button>
                </li>
                <li class='header__nav__list__item'>
                    <button class={currentAction === 'Placed' ? 'highlighted_page' : ''} onclick={() => {
                        pageClicked('Placed');
                        }}><img src="/icons/tag.svg" height="25" width="25" alt="#"> <span>{t.personal.placed}</span></button>
                </li>
            {/if}
        </ul>
    </nav>
    <div class="main__shop shop">
        <div class="shop__items">
            {#each offers[$auth.id!]?.data as i}
                <AnnouncementItem item={i}>
                    {#snippet btn_ok_name()}
                        <button class="shop__item__button__block__buy_button" onclick={() => offerClicked(i.id)}>{t.personal.edit}</button>
                    {/snippet}
                </AnnouncementItem>
            {/each}
        </div>
        <div class="pagination-controls">
            <button
                    class="pagination-btn"
                    onclick={() => goToPage(currentPage - 1, true)}
                    disabled={currentPage === 1 || offers[$auth.id!]?.totalItems === 0}
            >
                <img src="/icons/chevron-left.svg" height="20" width="20" alt="#">
            </button>
            {#each Array(totalPages).fill(0).map((_, i) => i + 1) as page}
                <button
                        class="pagination-btn {currentPage === page ? 'active' : ''}"
                        onclick={() => goToPage(page, true)}
                >
                    {page}
                </button>
            {/each}
            <button
                    class="pagination-btn"
                    onclick={() => goToPage(currentPage + 1, true)}
                    disabled={currentPage === totalPages || offers[$auth.id!]?.totalItems === 0}
            >
                <img src="/icons/chevron-right.svg" height="20" width="20" alt="#">
            </button>
        </div>
    </div>
</div>

<style>

    .main__shop {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        animation: fadeInUp 0.6s ease-out;
        width: 100%;
        margin-top: 2rem;
    }

    .shop__items {
        display: grid;
        justify-content: center;
        flex-wrap: wrap;
        gap: 2rem;
        animation: fadeInUp 0.6s ease-out;
        grid-template-columns: 1fr 1fr 1fr;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .shop__item__button__block__buy_button {
        width: 100%;
        margin-top: 1rem;
        padding: 0.75rem;
        border: none;
        background-color: #7a42f4;
        color: white;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .shop__item__button__block__buy_button:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .pagination-controls {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        margin: 2rem 0;
    }

    .pagination-btn {
        border: 2px solid #e2e8f0;
        background-color: white;
        color: #374151;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
        font-size: 1rem;
        width: 44px;
        height: 37.5px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .pagination-btn.active {
        background-color: #7a42f4;
        border-color: #7a42f4;
        color: white;
    }

    .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }


.burger {
        display: none;
        flex-direction: column;
        justify-content: space-between;
        width: 25px;
        height: 18px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }

    .burger .line {
        width: 100%;
        height: 3px;
        background-color: white;
        border-radius: 2px;
        transition: all 0.3s ease;
    }

    .header__nav__list {
        display: flex;
        justify-content: center;
        align-items: center;
        list-style: none;
        padding: 0;
        margin: 0;
        gap: 1.5rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
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
        position: relative;
        background: none;
        border: none;
        padding: 0.5rem 1.2rem;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: 500;
        color: var(--text-main);
        transition: color 0.3s ease;
        font-family: inherit;
    }

    .header__nav__list__item button::after {
        content: "";
        position: absolute;
        bottom: -3px;
        width: 0;
        height: 2px;
        background-color: orange;
        transition: width 0.3s ease;
    }

    .header__nav__list__item button:hover {
        color: #ffd580;
    }

    .header__nav__list__item button:hover::after {
        width: 100%;
    }

    .highlighted_page {
        color: #ffaa00 !important;
    }

    :global([data-theme="dark"]) .highlighted_page {
        color: #ffd580 !important;
    }

    .highlighted_page::after {
        width: 100% !important;
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

    @media (min-width: 1100px) and (max-width: 1440px) {
        .shop__items{
            grid-template-columns: 1fr 1fr 1fr;
        }
    }

    @media (max-width: 1100px) {
        .shop__items{
            grid-template-columns: 1fr 1fr;
        }
    }

    @media (max-width: 768px) {
        .container{
            margin-bottom: 4rem;
        }

        .shop__items {
            grid-template-columns: 1fr;
        }

        .burger {
            display: flex;
            position: absolute;
            right: 20px;
            top: 20px;
        }

        .header__nav__list{
            gap: 0;
        }

        span{
            font-size: 10px;
        }
    }
</style>