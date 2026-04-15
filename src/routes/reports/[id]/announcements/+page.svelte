<script lang='ts'>
    import { goto } from '$app/navigation';
    import { env } from '$env/dynamic/public';
    import { AnnouncementItem, auth, translations, settings, Roles, toast, getItemsProfilePerPage, type AnnouncementsResponse } from '$lib';
    import getCookie from '$lib/utils/cookieData.js';
    import { onMount, tick } from 'svelte';

    const { data } = $props();
    let currentUserId = $derived<string | undefined | null>(data.userUrl);

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
        // const oldPageSize = itemsPerPage;
        // const globalIndex = (currentPage - 1) * oldPageSize;
        // const newPage = Math.floor(globalIndex / newPageSize) + 1;

        // itemsPerPage = newPageSize;
        // currentPage = newPage;

        // goToPage(newPage, false);

        itemsPerPage = newPageSize;
        currentPage = currentPage;

        goToPage(currentPage, false);
    }

    $effect(() => {
        const page = data.currentPage;
        const tab = data.currentTab;
        const userId = $auth.id;

        if (!currentUserId)
            return;

        if (userId) {
            switch(tab) {
                case 'Sold': getSold(currentUserId, page ?? 1); break;
                case 'Bought': getBought(currentUserId, page ?? 1); break;
                case 'Placed': getPlaced(currentUserId, page ?? 1); break;
                case 'Favorite': getFavorite(currentUserId, page ?? 1); break;
            }
        }

        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    });

    // const loadPlaced = async () => {
    //     const page = data.currentPage;
    //     const tab = data.currentTab;
    //     const userId = $auth.id;

    //     const res = await personalStore.loadPlaced(userId!, page ?? 1);
    //     if (res !== null && res.page !== undefined && res.page !== data.currentPage){
    //         toast.show(t.system.noData, 'error');
    //         goToPage(res.page, false);
    //     }
    // };

    let placedData = $state<AnnouncementsResponse | null>(null);
    let favoriteData = $state<AnnouncementsResponse | null>(null);
    let boughtData = $state<AnnouncementsResponse | null>(null);
    let soldData = $state<AnnouncementsResponse | null>(null);

    const getPlaced = async (userId: string, page: number): Promise<AnnouncementsResponse | null> => {
        try {
            const accessToken = getCookie('accessToken');

            const response = await fetch(
                `${env.PUBLIC_API_URL}/api/Announcement/get-placed-by-user-id?userId=${userId}&page=${page}&pageSize=${getItemsProfilePerPage()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const freshData: AnnouncementsResponse = await response.json();

            placedData = freshData;
            settings.online = true;
            return freshData;

        } catch (e) {
            settings.online = false;
            return null;
        }
    }

    const getFavorite = async (userId: string, page: number): Promise<AnnouncementsResponse | null> => {
        try {
            const accessToken = getCookie('accessToken');

            const response = await fetch(
                `${env.PUBLIC_API_URL}/api/Favorite/get-favorites-by-user-id?userId=${userId}&page=${page}&pageSize=${getItemsProfilePerPage()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const freshData: AnnouncementsResponse = await response.json();

            favoriteData = freshData;
            settings.online = true;
            return freshData;

        } catch (e) {
            settings.online = false;
            return null;
        }
    }

const getSold = async (userId: string, page: number): Promise<AnnouncementsResponse | null> => {
        try {
            const accessToken = getCookie('accessToken');

            const response = await fetch(
                `${env.PUBLIC_API_URL}/api/Announcement/get-sold-by-user-id?userId=${userId}&page=${page}&pageSize=${getItemsProfilePerPage()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const freshData: AnnouncementsResponse = await response.json();

            soldData = freshData;
            settings.online = true;
            return freshData;

        } catch (e) {
            settings.online = false;
            return null;
        }
    }

    const getBought = async (userId: string, page: number): Promise<AnnouncementsResponse | null> => {
        try {
            const accessToken = getCookie('accessToken');

            const response = await fetch(
                `${env.PUBLIC_API_URL}/api/Announcement/get-bought-by-user-id?userId=${userId}&page=${page}&pageSize=${getItemsProfilePerPage()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) return null;

            const freshData: AnnouncementsResponse = await response.json();

            boughtData = freshData;
            settings.online = true;
            return freshData;

        } catch (e) {
            settings.online = false;
            return null;
        }
    }

    let offers = $derived(data.currentTab === 'Sold' ? soldData :
                            data.currentTab === 'Bought' ? boughtData :
                            data.currentTab === 'Placed' ? placedData :
                            favoriteData);

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
    let totalPages = $derived(offers?.totalPages ?? 0);

    let announcementId = $state<string>('');

    const goToPage = (page: number, isClicked: boolean) => {
        if (data.currentPage === undefined || (isClicked && data.currentPage === page))
            return;

        if (page < 1 || page > totalPages)
            page = 1;

        const url = new URL(window.location.href);
        url.searchParams.set('page', page.toString());
        
        //goto(url.toString(), { keepFocus: true, noScroll: true });
        goto(url.toString(), { invalidateAll: true });
    };

    const offerClicked = async (id: string) => {
        announcementId = id;
        goto(`/offers/${id}/description`);
    };

const t = $derived(translations[settings.lang]);

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
                    }}>🏷️ {t.personal.favorite}</button>
            </li>
            <li class='header__nav__list__item'>
                <button class={currentAction === 'Bought' ? 'highlighted_page' : ''} onclick={() => {
                    pageClicked('Bought');
                    }}>🛒 {t.personal.bought}</button>
            </li>
            {#if $auth.roles.includes(Roles.Realtor) || $auth.roles.includes(Roles.Admin)}
                <li class='header__nav__list__item'>
                    <button class={currentAction === 'Sold' ? 'highlighted_page' : ''} onclick={() => {
                        pageClicked('Sold');
                        }}>💲 {t.personal.sold}</button>
                </li>
                <li class='header__nav__list__item'>
                    <button class={currentAction === 'Placed' ? 'highlighted_page' : ''} onclick={() => {
                        pageClicked('Placed');
                        }}>🏷️ {t.personal.placed}</button>
                </li>
            {/if}
        </ul>
    </nav>
    <div class="main__shop shop">
        <div class="shop__items">
            {#each offers?.data as i}
                <AnnouncementItem item={i}>
                    {#snippet btn_ok_name()}
                        <button class="shop__item__button__block__buy_button" onclick={() => offerClicked(i.id)}>{t.reports.open}</button>
                    {/snippet}
                </AnnouncementItem>
            {/each}
        </div>
        <div class="pagination-controls">
            <button
                    class="pagination-btn"
                    onclick={() => goToPage(currentPage - 1, true)}
                    disabled={currentPage === 1 || offers?.totalItems === 0}
            >
                ⬅️
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
                    disabled={currentPage === totalPages || offers?.totalItems === 0}
            >
                ➡️
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
        padding: 0.5rem 1rem;
        border: 2px solid #e2e8f0;
        background-color: white;
        color: #374151;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
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
        color: white;
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
        .shop__items {
            grid-template-columns: 1fr;
        }

        .burger {
            display: flex;
            position: absolute;
            right: 20px;
            top: 20px;
        }

        .header__nav__list {
            position: absolute;
            top: 70px;
            right: 20px;
            flex-direction: column;
            align-items: start;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 1rem 2rem;
            gap: 1rem;
            transform: translateY(-20px);
            opacity: 0;
            pointer-events: none;
        }

        .header__nav__list.open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
            z-index: 55;
        }

        .header__nav__list__item{
            width: 100%;
        }

        .header__nav__list__item button {
            padding: 0.5rem 1rem;
            width: 100%;
            text-align: start;
        }

        .header__nav__list__item button::after {
            left: 50%;
            transform: translateX(-50%);
        }
    }
</style>