<script lang='ts'>
    import { auth, settings, translations } from '$lib';
    import { onMount } from 'svelte';
    import type {
        PropertyTypeReportRequest,
        ReportFilterParams,
        PropertyTypeStats} from '$lib';

    let { data, callBack }: { data: ReportFilterParams, callBack: () => void } = $props();

    let propertyTypeStats = $state<PropertyTypeStats>();

    const getPropertyTypeStats = async (): Promise<void> => {
        if($auth.id === null){
            return;
        }

        const requestData: PropertyTypeReportRequest = {
            propertyTypeId: data.propertyType,
            dateFrom: data.dateFrom,
            dateTo: data.dateTo
        };

        const response = await fetch('http://localhost:5118/api/Report/get-report-by-property-type-id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if(!response.ok){
            return;
        }

        propertyTypeStats = await response.json() as PropertyTypeStats;
    };

    onMount(async (): Promise<void> => {
        await getPropertyTypeStats();
    });

    const t = $derived(translations[settings.lang]);
</script>

<div class="report__container">
    {#if propertyTypeStats !== undefined}
        <div>
            <h1 class="section-title">📊 {t.reports.report}</h1>
            <div class="report__container__summary">
                <div class="report__container__item">
                    <h3>💼 {t.reports.placedAnnouncements}</h3>
                    <div style="font-size: 2rem; font-weight: bold; color: #4CAF50;">{propertyTypeStats.totalPlacedAnnouncements}</div>
                </div>
                <div class="report__container__item">
                    <h3>💰 {t.reports.deals}</h3>
                    <div style="font-size: 2rem; font-weight: bold; color: #2196F3;">{propertyTypeStats.totalDeals}</div>
                </div>
                <div class="report__container__item">
                    <h3>📈 {t.reports.profit}</h3>
                    <div style="font-size: 2rem; font-weight: bold; color: #FF9800;">{propertyTypeStats.totalIncome}</div>
                </div>
            </div>
        </div>

        <div>
            <h2 class="section-title">🏆 {t.reports.topDeal}</h2>
            <div class="report__container__top_property">
                <div class="report__container__item"><strong>{t.reports.name}:</strong> <span>{propertyTypeStats.topDealName}</span></div>
                <div class="report__container__item"><strong>{t.reports.statementType}:</strong> <span>{propertyTypeStats.topDealStatementType}</span></div>
                <div class="report__container__item"><strong>{t.reports.price}:</strong> <span>{propertyTypeStats.topDealPrice}</span></div>
                <div class="report__container__item"><strong>{t.reports.realtor}:</strong> <span>{propertyTypeStats.topDealRealtorName}</span></div>
                <div class="report__container__item"><strong>{t.reports.customer}:</strong> <span>{propertyTypeStats.topDealCustomerName}</span></div>
                <div class="report__container__item"><strong>{t.reports.sold}:</strong> <span>{propertyTypeStats.topDealSoldDate}</span></div>
            </div>
        </div>

        <div>
            <h2 class="section-title">👥 {t.reports.topRealtor}</h2>
            <div class="report__container__top_realtors">
                <div class="realtor-card">
                    <div class="report__container__item"><strong>{t.reports.name}:</strong> <span>{propertyTypeStats.topRealtorName}</span></div>
                    <div class="report__container__item"><strong>{t.reports.deals}:</strong> <span>{propertyTypeStats.topRealtorDeals}</span></div>
                    <div class="report__container__item"><strong>{t.reports.earned}:</strong> <span>{propertyTypeStats.topRealtorIncome}</span></div>
                </div>
            </div>
        </div>

        <div>
            <h2 class="section-title">🎯 {t.reports.topClient}</h2>
            <div class="report__container__top_clients">
                <div class="client-card">
                    <div class="report__container__item"><strong>{t.reports.name}:</strong> <span>{propertyTypeStats.topClientName}</span></div>
                    <div class="report__container__item"><strong>{t.reports.deals}:</strong> <span>{propertyTypeStats.topClientDeals}</span></div>
                    <div class="report__container__item"><strong>{t.reports.spent}:</strong> <span>{propertyTypeStats.topClientSpent}</span></div>
                </div>
            </div>
        </div>
        <div>
            <button class="shop__item__button__block__buy_button" onclick={() => callBack()}>{t.reports.back}</button>
        </div>
    {/if}
</div>

<style>
    .report__container {
        width: 60rem;
        margin: 0 auto;
        display: grid;
        gap: 30px;
        padding: 3rem 0;
    }

    .section-title {
        color: var(--card-text);
        font-size: 1.8rem;
        font-weight: 600;
        margin-bottom: 20px;
        text-align: center;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }

    .report__container__summary {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
    }

    .report__container__summary .report__container__item {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        padding: 30px 20px;
        border-radius: 15px;
        text-align: center;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        position: relative;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        width: 100%;
    }

    .report__container__summary .report__container__item:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 35px rgba(0,0,0,0.15);
    }

    .report__container__summary .report__container__item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #4CAF50, #45a049);
    }

    .report__container__summary .report__container__item:nth-child(2)::before {
        background: linear-gradient(90deg, #2196F3, #1976D2);
    }

    .report__container__summary .report__container__item:nth-child(3)::before {
        background: linear-gradient(90deg, #FF9800, #F57C00);
    }

    .report__container__top_property {
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        border-left: 5px solid #e91e63;
        transition: transform 0.3s ease;
    }

    .report__container__top_property:hover {
        transform: scale(1.02);
    }

    .report__container__top_property .report__container__item {
        padding: 10px 0;
        border-bottom: 1px solid var(--border-color);
        font-weight: 500;
    }

    .report__container__top_property .report__container__item:last-child {
        border-bottom: none;
    }

    .report__container__top_realtors {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }

    .realtor-card {
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        border-left: 5px solid #4CAF50;
        transition: transform 0.3s ease;
    }

    .realtor-card:hover {
        transform: translateY(-3px);
    }

    .realtor-card .report__container__item {
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .realtor-card .report__container__item:last-child {
        border-bottom: none;
    }

    .report__container__item {
        padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .report__container__item:last-child {
        border-bottom: none;
    }

    .report__container__top_clients {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }

    .client-card {
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        border-left: 5px solid #FF9800;
        transition: transform 0.3s ease;
    }

    .client-card:hover {
        transform: translateY(-3px);
    }

    .client-card .report__container__item {
        padding: 8px 0;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .client-card .report__container__item:last-child {
        border-bottom: none;
    }

    .report__container__item::before {
        font-size: 1.2rem;
        margin-right: 10px;
    }

    .report__container__item strong {
        color: var(--card-secondary-text);
    }

    .report__container__summary .report__container__item,
    .report__container__top_property,
    .realtor-card,
    .client-card {
        background: var(--card-bg) !important;
        color: var(--card-text);
        box-shadow: 0 8px 25px var(--card-shadow);
        border: 1px solid var(--border-color);
    }

    :global([data-theme="dark"]) .report__container {
        --card-bg: #1e1e2d;
        --card-text: #ffffff;
        --card-secondary-text: #a0aec0;
        --card-shadow: rgba(0, 0, 0, 0.4);
        --border-color: #2d2d3f;
    }

    @media (min-width: 600px) and (max-width: 1100px) {
        .report__container {
            padding: 10px;
            gap: 20px;
            width: 80%;
        }

        .report__container__summary {
            grid-template-columns: 1fr;
        }

        .section-title {
            font-size: 1.5rem;
        }
    }

    .report__container > div {
        animation: fadeInUp 0.6s ease-out;
    }

    @media (max-width: 600px) {
        .report__container {
            padding: 10px;
            gap: 20px;
            width: 100%;
        }

        .report__container__summary {
            grid-template-columns: 1fr;
        }

        .report__container__top_realtors{
            grid-template-columns: 1fr;
        }

        .report__container__top_clients{
            grid-template-columns: 1fr;
        }

        .section-title {
            font-size: 1.5rem;
        }
    }

    .report__container > div {
        animation: fadeInUp 0.6s ease-out;
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
</style>