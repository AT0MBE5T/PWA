<script lang='ts'>
    import { type ReportFilterParams, type PropertyTypeInterface, Roles, translations, settings } from '$lib';
    import { auth } from '$lib';
    import { onMount } from 'svelte';

    let { callBack }: {callBack: (data: ReportFilterParams, action: Action) => void} = $props();

    let dateFrom = $state<string>('');
    let dateTo = $state<string>('');
    let clientName = $state<string>('');
    let propertyType = $state<string>('');
    let isInterval = $state<boolean>(false);

    let propertyTypes = $state<PropertyTypeInterface[]>([]);

    const getPropertyTypes = async () => {
        const response = await fetch('http://localhost:5118/api/PropertyType/get-property-types', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if(!response.ok){
            return;
        }

        propertyTypes = await response.json() as PropertyTypeInterface[];
    };

    onMount(async () => {
        await getPropertyTypes();
    });

    type Action = 'General' | 'Client' | 'PropertyType'

    $effect(() => {
        clearFilter();
        switchElementsByCurrentPage(currentPage);
    });

    let currentPage = $state<Action>('General');

    const validation = (page: Action) => {
        switch(page){
            case 'General':
                return true;

            case 'Client':
                if(dateFrom.length === 0){
                    return false;
                }

                if(isInterval && dateTo.length === 0){
                    return false;
                }

                return !(auth.hasRole(Roles.Admin) && clientName.length === 0);

            case 'PropertyType':
                if(dateFrom.length === 0){
                    return false;
                }

                if(isInterval && dateTo.length === 0){
                    return false;
                }

                return propertyType.length !== 0;
        }
    };

    function applyFilter() {

        if(!validation(currentPage)){
            return;
        }

        const ret: ReportFilterParams = {
          dateFrom,
          dateTo,
          clientName,
          propertyType
        };

        callBack(ret, currentPage);
    }

    function clearFilter() {
        dateFrom = "";
        dateTo = "";
        clientName = "";
        propertyType = "";
    }

    const pageClicked = (page: Action) => {
        currentPage = page;
    };

    let intervalVisible = $state<boolean>(true);
    let datesVisible = $state<boolean>(true);
    let clientVisible = $state<boolean>(true);
    let propertyTypeVisible = $state<boolean>(true);
    let cleanButtonVisible = $state<boolean>(true);

    const switchElementsByCurrentPage = (page: Action) => {
        switch(page){
            case 'General':
                intervalVisible = false;
                datesVisible = false;
                clientVisible = false;
                propertyTypeVisible = false;
                cleanButtonVisible = false;
                break;
            case 'Client':
                intervalVisible = true;
                datesVisible = true;
                clientVisible = true;
                propertyTypeVisible = false;
                cleanButtonVisible = true;
                break;
            case 'PropertyType':
                intervalVisible = true;
                datesVisible = true;
                clientVisible = false;
                propertyTypeVisible = true;
                cleanButtonVisible = true;
                break;
        }
    };

    const t = $derived(translations[settings.lang]);

</script>

<div class="filter-container">
    <div class="filter-header">
        <h3 class="filter-title">{t.reports.searchFilters}</h3>
        <div class="filter-icon">🔍</div>
    </div>

    <header class="container__header header">
        <nav class='header__nav'>
            <ul class='header__nav__list'>
                {#if auth.hasRole(Roles.Admin)}
                    <li class='header__nav__list__item'>
                        <button class={currentPage === 'General' ? 'highlighted_page' : ''} onclick={() => pageClicked('General')}>{t.reports.general}</button>
                    </li>
                {/if}
                <li class='header__nav__list__item'>
                    <button class={currentPage === 'Client' ? 'highlighted_page' : ''} onclick={() => pageClicked('Client')}>{t.reports.client}</button>
                </li>
                <li class='header__nav__list__item'>
                    <button class={currentPage === 'PropertyType' ? 'highlighted_page' : ''} onclick={() => pageClicked('PropertyType')}>{t.offers.propertyType}</button>
                </li>
            </ul>
        </nav>
    </header>

    <div class="filter-content">
        <div class="form-group" class:hidden={!intervalVisible}>
            <div class="checkbox-group">
                <label class="checkbox-label">
                    <input type="checkbox" bind:checked={isInterval} class="checkbox" />
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-text">{t.reports.useDateSpan}</span>
                </label>
            </div>
        </div>
        <div class="form-group" class:hidden={!datesVisible}>
            <div class="date-inputs">
                <div class="input-group">
                    <label for="dateFromInput" class="input-label">{isInterval ? t.reports.dateFrom : t.reports.date}</label>
                    <input id="dateFromInput" type="date" bind:value={dateFrom} class="input-field date-input" />
                </div>
                {#if isInterval}
                    <div class="input-group">
                        <label for="dateToInput" class="input-label">{t.reports.dateTo}</label>
                        <input id="dateToInput" type="date" bind:value={dateTo} class="input-field date-input" />
                    </div>
                {/if}
            </div>
        </div>
        <div class="form-group" class:hidden={!clientVisible}>
            <div class="input-group">
                <label for="clientNameInput" class="input-label">{t.reports.clientLogin}</label>
                {#if !auth.hasRole(Roles.Admin)}
                    <input
                            id="clientNameInput"
                            type="text"
                            readonly={true}
                            value={$auth.name}
                            placeholder="Test"
                            class="input-field text-input"
                    />
                {:else}
                    <input
                            id="clientNameInput"
                            type="text"
                            readonly={false}
                            bind:value={clientName}
                            placeholder="Test"
                            class="input-field text-input"
                    />
                {/if}
            </div>
        </div>
        <div class="form-group" class:hidden={!propertyTypeVisible}>
            <div class="input-group">
                <label for="propertyTypeSelect" class="input-label">{t.offers.propertyType}</label>
                <select id="propertyTypeSelect" bind:value={propertyType} class="input-field select-input">
                    {#each propertyTypes as type}
                        <option value={type.id}>{type.name}</option>
                    {/each}
                </select>
            </div>
        </div>
    </div>
    <div class="filter-actions">
        <button class="btn btn-secondary" class:hidden={!cleanButtonVisible} onclick={clearFilter} type="button">
            <span class="btn-icon">🗑️</span>
            Clear
        </button>
        <button class="btn btn-primary" class:btn-max-width={!cleanButtonVisible} onclick={applyFilter}>
            <span class="btn-icon">✓</span>
            Form
        </button>
    </div>
</div>

<style>
    .filter-container {
        max-width: 600px;
        min-width: 420px;
        margin: 0 auto;
        background: var(--filter-bg);
        border-radius: 16px;
        box-shadow: 0 8px 32px var(--filter-shadow);
        overflow: hidden;
        color: var(--filter-text);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    }

    .filter-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: white;
    }

    .container__header {
        backdrop-filter: blur(8px);
        padding: 15px 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        background: #1e293b;
        background: var(--header-bg);
    }

    .header__nav__list {
        display: flex;
        justify-content: center;
        align-items: center;
        list-style: none;
        padding: 0;
        margin: 0;
        gap: 1.5rem;
    }

    .header__nav__list__item button {
        position: relative;
        background: none;
        border: none;
        padding: 0.5rem 1.2rem;
        cursor: pointer;
        font-size: 1.1rem;
        font-weight: 500;
        color: #ffffff;
        transition: color 0.3s ease;
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

    .filter-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        letter-spacing: -0.025em;
    }

    .filter-icon {
        font-size: 1.5rem;
        opacity: 0.8;
    }

    .filter-content {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    
    :global([data-theme="dark"]) .filter-content {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .checkbox-group {
        display: flex;
        align-items: center;
    }

    .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        cursor: pointer;
        font-size: 0.95rem;
        color: #4a5568;
        font-weight: 500;
    }

    .checkbox {
        position: absolute;
        opacity: 0;
        pointer-events: none;
    }

    .checkbox-custom {
        width: 20px;
        height: 20px;
        border: 2px solid var(--filter-border);
        border-radius: 4px;
        position: relative;
        transition: all 0.2s ease;
        background: white;
        background: var(--filter-input-bg);
    }

    .checkbox:checked + .checkbox-custom {
        background: #667eea;
        border-color: #667eea;
    }

    .checkbox:checked + .checkbox-custom::after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 12px;
        font-weight: bold;
    }

    .checkbox-text {
        user-select: none;
        color: var(--filter-label);
    }

    .date-inputs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .input-label {
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
        letter-spacing: 0.025em;
    }

    .input-field {
        border: 1px solid #ccc;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    .input-field:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.3);
    }

    :global([data-theme="dark"]) .input-field {
        background-color: #0f172a;
        border: 1px solid #334155;
        color: #f1f5f9;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .input-field:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 0 3px rgba(122, 66, 244, 0.2);
        outline: none;
    }

    .input-field:hover {
        border-color: #cbd5e0;
    }

    .text-input::placeholder {
        color: #a0aec0;
        font-style: italic;
    }

    .select-input {
        appearance: none;
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a0aec0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 1rem;
        padding-right: 2.5rem;
    }

    .filter-actions {
        padding: 1.5rem 2rem 2rem;
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        background: var(--filter-footer-bg);
        border-top: 1px solid var(--filter-border);
    }

    .btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        letter-spacing: 0.025em;
        min-width: 120px;
        justify-content: center;
        width: 100%;
    }

    .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.3);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px 0 rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
        border: 2px solid var(--filter-border);
        background: var(--filter-secondary-btn);
        color: var(--filter-text);
    }

    .btn-secondary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px 0 var(--filter-secondary-btn);
    }

    .btn-icon {
        font-size: 0.875rem;
    }

    .btn-max-width{
        width: 100%;
    }

    :global([data-theme="dark"]) .filter-container {
        --filter-bg: #1a202c;
        --filter-text: #e2e8f0;
        --filter-label: #a0aec0;
        --filter-border: #2d3748;
        --filter-input-bg: #2d3748;
        --filter-footer-bg: #171923;
        --filter-secondary-btn: #2d3748;
        --filter-shadow: rgba(0, 0, 0, 0.4);
    }

    :global([data-theme="dark"]) .main__register {
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .register__form__container {
        background: #1e293b;
        border: 1px solid #334155;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        padding: 2.5rem;
        border-radius: 20px;
    }

    :global([data-theme="dark"]) .register__form__title {
        color: #f8fafc;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    :global([data-theme="dark"]) label {
        color: #94a3b8;
        font-weight: 500;
    }

    :global([data-theme="dark"]) .register__form input {
        background-color: #0f172a;
        border: 1px solid #334155;
        color: #f1f5f9;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .register__form input:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 0 3px rgba(122, 66, 244, 0.2);
        outline: none;
    }

    /* Колір помилок під інпутами */
    :global([data-theme="dark"]) .register__form div[class*="ErrorText"] {
        color: #fb7185; /* Ніжно-червоний */
        font-size: 0.85rem;
        margin-top: 4px;
    }

    :global([data-theme="dark"]) .register__form__confirm button {
        background: linear-gradient(135deg, #7a42f4 0%, #6366f1 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(122, 66, 244, 0.3);
    }

    :global([data-theme="dark"]) .register__form__confirm button:hover {
        background: linear-gradient(135deg, #8b5cf6 0%, #7a42f4 100%);
        transform: translateY(-1px);
    }

    :global([data-theme="dark"]) .footer__register {
        border-top: 1px solid #334155;
        padding-top: 1.5rem;
        margin-top: 1.5rem;
    }

    :global([data-theme="dark"]) .register__form__login-form {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .register__form__create-account-btn {
        color: #a78bfa;
        background: transparent;
        border: 1px solid #4c1d95;
    }

    :global([data-theme="dark"]) .register__form__create-account-btn:hover {
        background: rgba(122, 66, 244, 0.1);
        border-color: #7a42f4;
    }

    @media (max-width: 640px) {
        .filter-container {
            margin: 1rem;
            border-radius: 12px;
        }

        .filter-content {
            padding: 1.5rem;
        }

        .date-inputs {
            grid-template-columns: 1fr;
        }

        .filter-actions {
            padding: 1rem 1.5rem 1.5rem;
            flex-direction: column-reverse;
        }

        .btn {
            min-width: auto;
        }
    }

    .filter-container {
        animation: slideIn 0.6s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .checkbox-label:focus-within .checkbox-custom {
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
    }

    .btn:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
    }

    .hidden {
        display: none;
    }
</style>