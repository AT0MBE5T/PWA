<script lang="ts">
    import { onMount, untrack } from 'svelte';
    import { AnnouncementItem, auth, getItemsPerPage, settings, translations, type AnnouncementFull, type CommentInterface, type LookupItem, type QuestionAnswer } from '$lib';
    import {
        type AnnouncementShort,
        type SearchRequestInterface,
        type AnnouncementsResponse,
        type LookupItemSort, 
        Roles} from '$lib';
    import { goto } from '$app/navigation';
    import { fade, fly } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';
    import offerState from '$lib/stores/offerStore.svelte';
    import { openDB } from 'idb';
    import { browser } from '$app/environment';
    import { offerFullStore } from '$lib/stores/OfferFullStore.svelte';

    let searchInput = $state<string>('');
    let filtrationDropdownOpen = $state<boolean>(false);
    let sortingDropdownOpen = $state<boolean>(false);
    let filteredFiltration = $state<LookupItem[]>([]);
    let filteredSorting = $state<LookupItemSort[]>([]);
    let selectedFiltration = $state<string[]>([]);

    let data = $state<AnnouncementShort[]>([]);

    let statementTypes = $state<LookupItem[]>([]);
    let propertyTypes = $state<LookupItem[]>([]);

    let checkedSortId = $state<number>(0);

    let limit = $state(getItemsPerPage());
    let currentPage = $state(1);
    let totalPages = $state<number>(0);

    const t = $derived(translations[settings.lang]);

    const DB_NAME = 'OffersDB';
    const DB_VERSION = 1;

    const getDB = async () => {
        return await openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('page')) {
                    db.createObjectStore('page');
                }
                if (!db.objectStoreNames.contains('statementTypes')) {
                    db.createObjectStore('statementTypes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('propertyTypes')) {
                    db.createObjectStore('propertyTypes', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('announcements')) {
                    db.createObjectStore('announcements', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('announcementDetails')) {
                    db.createObjectStore('announcementDetails', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('questions')) {
                    const store = db.createObjectStore('questions', { keyPath: 'questionId' });
                    store.createIndex('announcementId', 'announcementId', { unique: false });
                }
                if (!db.objectStoreNames.contains('comments')) {
                    const store = db.createObjectStore('comments', { keyPath: 'id' });
                    store.createIndex('announcementId', 'announcementId', { unique: false });
                }
                if (!db.objectStoreNames.contains('outboxQuestions')) {
                    db.createObjectStore('outboxQuestions', { keyPath: 'questionId' });
                }
                if (!db.objectStoreNames.contains('outboxComments')) {
                    db.createObjectStore('outboxComments', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('outboxOffers')) {
                    db.createObjectStore('outboxOffers', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('outboxOffersUpdate')) {
                    db.createObjectStore('outboxOffersUpdate', { keyPath: 'id' });
                }
            },
        });
    };

    const searchTransferData = async (searchData: SearchRequestInterface) => {
        if (!browser) return;
        try {
            const response = await fetch('http://localhost:5118/api/Announcement/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchData)
            });
            if (response.ok) {
                const data = await response.json() as AnnouncementsResponse;
                const db = await getDB();
                const tx = db.transaction('announcements', 'readwrite');
                await Promise.all([...data.data.map(item => tx.store.put(item)), tx.done]);
                offerState.setOffers(data.data);

                offerState.offers.forEach(async i => {
                    const responseDescription = await fetch(`http://localhost:5118/api/Announcement/get-announcement-full-by-id/${i.id}`);

                    const responseComments = await fetch(`http://localhost:5118/api/Comment/get-comments-by-announcement-id/${i.id}`);

                    const responseQuestions = await fetch(`http://localhost:5118/api/Question/get-all-by-announcement-id/${i.id}`);

                    if (!responseDescription.ok) return;
                    let descriptionData = await responseDescription.json() as AnnouncementFull;

                    if (!responseComments.ok) return;
                    let commentsData = await responseComments.json() as CommentInterface[];

                    if (!responseQuestions.ok) return;
                    let questionsData = await responseQuestions.json() as QuestionAnswer[];

                    const db = await getDB();
                    const tx = db.transaction('announcementDetails', 'readwrite');
                    tx.store.put(descriptionData);

                    const tx2 = db.transaction('comments', 'readwrite');
                    for (const comment of commentsData) {
                        await tx2.store.put(comment);
                    }
                    offerFullStore.setComments(i.id, commentsData);
                    await tx2.done;

                    const tx3 = db.transaction('questions', 'readwrite');
                    for (const question of questionsData) {
                        await tx3.store.put(question);
                    }
                    offerFullStore.setQuestions(i.id, questionsData);
                    await tx3.done;
                });
                return;
            }
        } catch (e) { console.warn("Offline: announcements"); }

        const db = await getDB();

        const cachedAnnouncements = await db.getAll('announcements');
        
        const sortedArr = [...cachedAnnouncements].sort((a, b) => {
            return b.viewsCnt - a.viewsCnt;
        });

        offerState.setOffers(sortedArr);
    };

    const getPropertyTypes = async () => {
        if (!browser) return;
        try {
            const response = await fetch('http://localhost:5118/api/PropertyType/get-property-types');
            if (response.ok) {
                const data = await response.json() as LookupItem[];
                const db = await getDB();
                const tx = db.transaction('propertyTypes', 'readwrite');
                await Promise.all([...data.map(item => tx.store.put(item)), tx.done]);
                statementTypes = data;
                return;
            }
        } catch (e) { console.warn("Offline: property types"); }

        const db = await getDB();
        propertyTypes = await db.getAll('propertyTypes');
    };

    const getStatementTypes = async () => {
        if (!browser) return;
        try {
            const response = await fetch('http://localhost:5118/api/StatementType/get-statement-types');
            if (response.ok) {
                const data = await response.json() as LookupItem[];
                const db = await getDB();
                const tx = db.transaction('statementTypes', 'readwrite');
                await Promise.all([...data.map(item => tx.store.put(item)), tx.done]);
                statementTypes = data;
                return;
            }
        } catch (e) { console.warn("Offline: types"); }

        const db = await getDB();
        statementTypes = await db.getAll('statementTypes');
    };

    const getPages = async () => {
        if (!browser) return;
        try {
            const response = await fetch('http://localhost:5118/api/Announcement/get-pages');
            if (response.ok) {
                const count = await response.json() as number;
                const db = await getDB();
                await db.put('page', count, 'totalPages');
                totalPages = count;
                return;
            }
        } catch (e) { console.warn("Offline: pages"); }

        const db = await getDB();
        totalPages = /*await db.get('page', 'totalPages') || */0;
    };

    onMount(async () => {
        await getPages();
        await confirmInteraction();
        await getPropertyTypes();
        await getStatementTypes();
        filteredFiltration = [...statementTypes, ...propertyTypes];
        filteredSorting = sortingData;
    });

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });

    $effect(() => {
        const handleResize = async () => {
            const newLimit = getItemsPerPage();
            if (newLimit !== limit) {
                limit = newLimit;
                currentPage = 1;
                await confirmInteraction();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    });

    let { callBack }: { callBack: (offerId: string) => void } = $props();

    let sortingData = $state<LookupItemSort[]>([
        // svelte-ignore state_referenced_locally
        { id: 1, name: t.offers.priceByDesc },
        // svelte-ignore state_referenced_locally
        { id: 2, name: t.offers.areaByDesc },
        // svelte-ignore state_referenced_locally
        { id: 3, name: t.offers.roomsByDesc },
        // svelte-ignore state_referenced_locally
        { id: 4, name: t.offers.floorsByDesc },
        // svelte-ignore state_referenced_locally
        { id: 5, name: t.offers.priceByAsc },
        // svelte-ignore state_referenced_locally
        { id: 6, name: t.offers.areaByAsc },
        // svelte-ignore state_referenced_locally
        { id: 7, name: t.offers.roomsByAsc },
        // svelte-ignore state_referenced_locally
        { id: 8, name: t.offers.floorsByAsc }
    ]);

    const goToPage = async (page: number) => {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            await confirmInteraction();
        }
    };

    function toggleFiltrationDropdown() {
        filtrationDropdownOpen = !filtrationDropdownOpen;
        sortingDropdownOpen = false;
    }

    function toggleSortingDropdown() {
        sortingDropdownOpen = !sortingDropdownOpen;
        filtrationDropdownOpen = false;
    }

    function handleFiltrationChange(itemId: string, checked: boolean) {
        if (checked) {
            selectedFiltration = [...selectedFiltration, itemId];
        } else {
            selectedFiltration = selectedFiltration.filter(id => id !== itemId);
        }
    }

    const confirmInteraction = async () => {
        const searchValues: SearchRequestInterface = {
            text: searchInput,
            filters: selectedFiltration,
            sortId: checkedSortId,
            page: currentPage,
            limit: limit,
            userId: $auth.id
        };

        offerState.setFilters(searchValues);

        await searchTransferData(searchValues);

        filtrationDropdownOpen = false;
        sortingDropdownOpen = false;
    }

    function switchFull(id: string) {
        goto(`/offers/${id}/description`);
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.search-controls')) {
            filtrationDropdownOpen = false;
            sortingDropdownOpen = false;
        }
    }

    const filtrationHandle = (e: Event, typeId: string) => {
        const input = e.currentTarget as HTMLInputElement;
        handleFiltrationChange(typeId, input.checked);
    };

    let navElementSort = $state<HTMLElement>();
    let navElementFilter = $state<HTMLElement>();

    function handleOutsideClick(event: Event) {
        const target = event.target as Node | null;
        if ((filtrationDropdownOpen && navElementFilter && !navElementFilter.contains(target)) || (sortingDropdownOpen && navElementSort && !navElementSort.contains(target))) {
            filtrationDropdownOpen = false;
            sortingDropdownOpen = false;
        }
    }

    $effect(() => {
        document.addEventListener('click', handleOutsideClick);

        return () => {
            document.removeEventListener('click', handleOutsideClick);
        };
    });

    $effect(() => {
        if (sortingDropdownOpen || filtrationDropdownOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    });

    let allOffers = $derived(offerState.offers);

    $effect(() => {
        untrack(() => {
            offerState.setOffers(data);
            offerState.initSignalR('offers_global', $auth.name!);
        });

        return () => {
            untrack(() => {
                offerState.stopSignalR();
            });
        };
    });
</script>

<div class="main__shop shop">
        <div class="shop__interaction">
            <div class="shop__interaction__search">
                <div class="search-controls">
                    <div class="search-input-container">
                        <input
                                bind:value={searchInput}
                                name="search"
                                type="text"
                                placeholder={t.offers.searchProperties}
                                class="search-input"
                        />
                        <svg class="search-icon" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                    </div>

                    <div class="dropdown-container" bind:this={navElementFilter}>
                        <button
                                class="filter-button {filtrationDropdownOpen ? 'active' : ''}"
                                onclick={toggleFiltrationDropdown}
                        >
                            <svg class="filter-icon" viewBox="0 0 24 24">
                                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
                            </svg>
                            Filters
                            {#if selectedFiltration.length > 0}
                                <span class="filter-count">{selectedFiltration.length}</span>
                            {/if}
                            <svg class="chevron {filtrationDropdownOpen ? 'open' : ''}" viewBox="0 0 24 24">
                                <polyline points="6,9 12,15 18,9"/>
                            </svg>
                        </button>

                        {#if filtrationDropdownOpen && filteredFiltration.length > 0}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div 
                                class="mobile-overlay" 
                                transition:fade={{ duration: 300 }}
                                onclick={toggleSortingDropdown}>
                            </div>

                            <div class="lookup-dropdown" transition:fly={{ y: '100%', duration: 400, easing: cubicOut }}>
                                <div class="dropdown-header">
                                    <h4>Filter by</h4>
                                    {#if selectedFiltration.length > 0}
                                        <button class="clear-all" onclick={() => selectedFiltration = []}>
                                            {t.offers.clearAll}
                                        </button>
                                    {/if}
                                </div>
                                <div class="dropdown-list">
                                    {#each filteredFiltration as type}
                                        <label class="lookup-item">
                                            <input
                                                    type="checkbox"
                                                    name={type.name}
                                                    checked={selectedFiltration.includes(type.id)}
                                                    onchange={(e: Event) => {
                                                    filtrationHandle(e, type.id);
                                                }}
                                            />
                                            <span class="checkbox-custom"></span>
                                            <span class="checkbox-label">{type.name}</span>
                                        </label>
                                    {/each}
                                </div>                                
                            </div>
                        {/if}
                    </div>

                    <div class="dropdown-container" bind:this={navElementSort}>
                        <button
                                class="filter-button {sortingDropdownOpen ? 'active' : ''}"
                                onclick={toggleSortingDropdown}
                        >
                            <svg class="filter-icon" viewBox="0 0 24 24">
                                <path d="M3 6h18M7 12h10M10 18h4"/>
                            </svg>
                            Sort
                            {#if checkedSortId > 0}
                                <span class="filter-count">1</span>
                            {/if}
                            <svg class="chevron {sortingDropdownOpen ? 'open' : ''}" viewBox="0 0 24 24">
                                <polyline points="6,9 12,15 18,9"/>
                            </svg>
                        </button>

                        {#if sortingDropdownOpen && filteredSorting.length > 0}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div 
                                class="mobile-overlay" 
                                transition:fade={{ duration: 300 }}
                                onclick={toggleSortingDropdown}>
                            </div>

                            <div class="lookup-dropdown" transition:fly={{ y: '100%', duration: 400, easing: cubicOut }}>
                                <div class="dropdown-header">
                                    <h4>{t.offers.sortBy}</h4>
                                    {#if checkedSortId > 0}
                                        <button class="clear-all" onclick={() => checkedSortId = 0}>
                                            {t.offers.clearAll}
                                        </button>
                                    {/if}
                                </div>
                                <div class="dropdown-list">
                                    {#each filteredSorting as type}
                                        <label class="lookup-item">
                                            <input
                                                    type="radio"
                                                    name='radio'
                                                    bind:group={checkedSortId}
                                                    value={type.id}
                                            />
                                            <span class="checkbox-label">{type.name}</span>
                                        </label>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>

                    <button class="search-button" onclick={confirmInteraction}>
                        <svg class="search-button-icon" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"/>
                            <path d="m21 21-4.35-4.35"/>
                        </svg>
                        {t.offers.search}
                    </button>
                </div>
            </div>
        </div>
        <div class="shop__items">
            {#each allOffers as i}
                <AnnouncementItem
                        item = {i}
                >
                    {#snippet btn_ok_name()}
                        <button class="shop__item__button__block__buy_button" onclick={() => switchFull(i.id)}>{t.offers.review}</button>
                    {/snippet}
                </AnnouncementItem>
            {/each}
        </div>

        <div class="pagination-controls">
            <button
                    class="pagination-btn"
                    onclick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || data.length === 0}
            >
                ⬅️
            </button>

            {#each Array(totalPages).fill(0).map((_, i) => i + 1) as page}
                <button
                        class="pagination-btn {currentPage === page ? 'active' : ''}"
                        onclick={() => goToPage(page)}
                >
                    {page}
                </button>
            {/each}

            <button
                    class="pagination-btn"
                    onclick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || data.length === 0}
            >
                ➡️
            </button>
        </div>
        {#if auth.hasRole(Roles.Realtor) || auth.hasRole(Roles.Admin)}
            <button class="question_answer__item__button" onclick={() => goto('/offers/create')}>
                +
            </button>
        {/if}
</div>

<style>
    .main__shop {
        align-content: baseline;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        animation: fadeInUp 0.6s ease-out;
        margin-top: 2rem;
        max-width: 86rem;
    }

    .shop__items {
        display: flex;
        justify-content: baseline;
        flex-wrap: wrap;
        gap: 2rem;
        animation: fadeInUp 0.6s ease-out;
    }

    .shop__interaction {
        width: 86rem;
        margin-bottom: 2rem;
    }

    .search-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        position: relative;
    }

    .search-input-container {
        position: relative;
        flex: 1;
        min-width: 200px;
    }

    .search-input {
        width: 100%;
        padding: 0.875rem 1rem 0.875rem 2.75rem;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-size: 1rem;
        background-color: white;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .search-input:focus {
        outline: none;
        border-color: #7a42f4;
        box-shadow: 0 0 0 3px rgba(122, 66, 244, 0.1);
    }

    .search-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        width: 1.25rem;
        height: 1.25rem;
        color: #64748b;
        pointer-events: none;
        fill: none;
        stroke: currentColor;
    }

    .dropdown-container {
        position: relative;
    }

    .filter-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1.25rem;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        background-color: white;
        font-size: 1rem;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        white-space: nowrap;
    }

    .filter-button:hover {
        border-color: #7a42f4;
        background-color: #fafafa;
    }

    .filter-button.active {
        border-color: #7a42f4;
        background-color: #7a42f4;
        color: white;
    }

    .filter-icon {
        width: 1.25rem;
        height: 1.25rem;
        fill: none;
        stroke: currentColor;
    }

    .filter-count {
        background-color: rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 50%;
        width: 1.5rem;
        height: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .filter-button:not(.active) .filter-count {
        background-color: #7a42f4;
        color: white;
    }

    .chevron {
        width: 1rem;
        height: 1rem;
        transition: transform 0.3s ease;
        fill: none;
        stroke: currentColor;
    }

    .chevron.open {
        transform: rotate(180deg);
    }

    .search-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1.5rem;
        background: linear-gradient(135deg, #7a42f4 0%, #9333ea 100%);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(122, 66, 244, 0.3);
    }

    .search-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(122, 66, 244, 0.4);
    }

    .search-button-icon {
        width: 1.25rem;
        height: 1.25rem;
        fill: none;
        stroke: currentColor;
    }

    .lookup-dropdown {
        position: absolute;
        top: calc(100% + 0.75rem);
        left: 0;
        min-width: 280px;
        max-height: 350px;
        display: flex;
        flex-direction: column;
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(226, 232, 240, 0.8);
        border-radius: 16px;
        box-shadow: 
            0 10px 25px -5px rgba(0, 0, 0, 0.1), 
            0 8px 10px -6px rgba(0, 0, 0, 0.1),
            0 0 0 1px rgba(122, 66, 244, 0.05);
        z-index: 1000;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
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

    .dropdown-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem;
        border-bottom: 1px solid rgba(226, 232, 240, 0.8);
        position: sticky;
        top: 0;
        background: inherit;
        z-index: 10;
        border-radius: 16px 16px 0 0;
    }

    .dropdown-list{
        overflow-y: auto;
        flex: 1;
        min-height: 0;
    }

    .dropdown-list::-webkit-scrollbar {
        width: 6px;
    }

    .dropdown-list::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }

    .dropdown-header h4 {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .clear-all {
        background: none;
        border: none;
        color: #7a42f4;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.2s ease;
    }

    .clear-all:hover {
        background-color: rgba(122, 66, 244, 0.1);
    }

    .lookup-item {
        display: flex;
        align-items: center;
        padding: 0.85rem 1.25rem;
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 10px;
    }

    .lookup-item:last-child {
        border-bottom: none;
        border-radius: 0 0 12px 12px;
    }

    .lookup-item:hover {
        background-color: rgba(122, 66, 244, 0.04);
    }

    .lookup-item input[type="checkbox"] {
        display: none;
    }

    .lookup-item input[type="radio"] {
        appearance: none;
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid #cbd5e1;
        border-radius: 50%;
        margin: 0;
        position: relative;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .lookup-item input[type="radio"]:checked {
        border-color: #7a42f4;
        border-width: 6px;
    }

    .checkbox-custom {
        width: 1.25rem;
        height: 1.25rem;
        border: 2px solid #cbd5e1;
        border-radius: 6px;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .lookup-item input[type="checkbox"]:checked + .checkbox-custom {
        background-color: #7a42f4;
        border-color: #7a42f4;
        transform: scale(1.1);
    }

    .lookup-item input[type="checkbox"]:checked + .checkbox-custom::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0.5rem;
        height: 0.75rem;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: translate(-50%, -60%) rotate(45deg);
    }

    .lookup-dropdown::-webkit-scrollbar {
        width: 6px;
    }

    .lookup-dropdown::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }

    .checkbox-label {
        font-size: 0.9rem;
        color: #374151;
        font-weight: 500;
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

    .question_answer__item__button {
        position: fixed;
        right: 2rem;
        bottom: 2rem;
        width: 4rem;
        height: 4rem;
        background: linear-gradient(135deg, #7a42f4 0%, #9333ea 100%);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 3rem;
        box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .question_answer__item__button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(255, 153, 0, 0.4);
    }

    .mobile-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.4);
        z-index: 999;
    }

    :global([data-theme="dark"]) .search-input {
        background-color: var(--bg-card);
        border-color: var(--border-color);
        color: var(--text-main);
    }

    :global([data-theme="dark"]) .filter-button {
        background-color: var(--bg-card);
        border-color: var(--border-color);
        color: var(--text-main);
    }

    :global([data-theme="dark"]) .filter-button:hover {
        background-color: #2d3a4f;
        border-color: var(--input-focus);
    }

    :global([data-theme="dark"]) .lookup-dropdown {
        background-color: rgba(30, 41, 59, 0.9);
        backdrop-filter: blur(12px);
        border-color: var(--border-color);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }

    :global([data-theme="dark"]) .dropdown-header {
        background-color: rgba(15, 23, 42, 0.5);
        border-bottom-color: var(--border-color);
    }

    :global([data-theme="dark"]) .lookup-item:hover {
        background-color: rgba(122, 66, 244, 0.1);
    }

    :global([data-theme="dark"]) .checkbox-label {
        color: var(--text-main);
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

    @media (min-width: 1100px) and (max-width: 1375px) {
        .shop__items{
            grid-template-columns: 1fr 1fr 1fr;
            width: 64rem;
        }
        .shop__interaction{
            width: 64rem;
        }
    }

    @media (min-width: 768px) and (max-width: 1100px) {
        .shop__items{
            grid-template-columns: 1fr 1fr;
            width: 42rem;
        }

        .shop__interaction{
            width: 64rem;
        }

        .search-controls {
            flex-direction: column;
            align-items: stretch;
        }

        .search-controls > button {
            width: 100%;
        }

        .filter-button,
        .search-button {
            justify-content: center;
            min-width: 100%;
        }
    }

    @media (min-width: 672px) and (max-width: 1024px){
        .shop__interaction{
            width: 42rem;
        }
    }

    @media (max-width: 768px) {
        .shop__items{
            grid-template-columns: 1fr;
            width: 20rem;
        }

        .search-controls {
            flex-direction: column;
            align-items: stretch;
        }
        .search-controls > button {
            width: 100%;
        }

        .filter-button,
        .search-button {
            justify-content: center;
            min-width: 100%;
        }

        .lookup-dropdown {
            position: fixed;
            top: auto;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            min-width: 100%;
            border-radius: 24px 24px 0 0;
            max-height: 45vh;
            box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.15);
        }
    }

    @media (max-width: 671px){
        .shop__interaction{
            width: 20rem;
        }
    }

</style>