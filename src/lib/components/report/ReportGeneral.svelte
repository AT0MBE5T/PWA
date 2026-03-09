<script lang='ts'>
    import { onMount } from 'svelte';
    import { auth, settings, translations } from '$lib';
    import type { GeneralStats } from '$lib';

    let { callBack }: { callBack: () => void } = $props();

    let generalStats = $state<GeneralStats>();

    const getGeneralStats = async (): Promise<void> => {
        if($auth.id === null){
            return;
        }

        const response = await fetch('http://localhost:5118/api/Report/get-general-report', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if(!response.ok){
            return;
        }

        generalStats = await response.json() as GeneralStats;
    };

    onMount(async (): Promise<void> => {
        await getGeneralStats();
    });

    const t = $derived(translations[settings.lang]);
</script>

<div class="report__container">
    {#if generalStats !== undefined}
        <div>
            <h1 class="section-title">📊 {t.reports.report}</h1>
            <div class="report__container__summary">
                <div class="report__container__item">
                    <h3>💼 {t.reports.completedDeals}</h3>
                    <div style="font-size: 2rem; font-weight: bold; color: #4CAF50; margin-top: 10px;">{generalStats.totalClosedAnnouncements}</div>
                </div>
                <div class="report__container__item">
                    <h3>💰 {t.reports.totalProfit}</h3>
                    <div style="font-size: 2rem; font-weight: bold; color: #2196F3; margin-top: 10px;">{generalStats.totalIncome}</div>
                </div>
            </div>
        </div>

        <div>
            <h2 class="section-title">🏆 {t.reports.topDeal}</h2>
            <div class="report__container__top_property">
                <div class="report__container__item"><strong>{t.reports.name}:</strong> <span>{generalStats.topDealName}</span></div>
                <div class="report__container__item"><strong>{t.reports.statementType}:</strong> <span>{generalStats.topDealStatementType}</span></div>
                <div class="report__container__item"><strong>{t.reports.price}:</strong> <span>{generalStats.topDealPrice}</span></div>
                <div class="report__container__item"><strong>{t.reports.realtor}:</strong> <span>{generalStats.topDealRealtorName}</span></div>
                <div class="report__container__item"><strong>{t.reports.customer}:</strong> <span>{generalStats.topDealCustomerName}</span></div>
                <div class="report__container__item"><strong>{t.reports.soldDate}:</strong> <span>{generalStats.topDealSoldDate}</span></div>
            </div>
        </div>

        <div>
            <h2 class="section-title">👥 {t.reports.topRealtors}</h2>
            <div class="report__container__top_realtors">
                <div class="realtor-card">
                    <div class="report__container__item"><strong>{t.reports.name}:</strong> <span>{generalStats.topRealtorNameFirst}</span></div>
                    <div class="report__container__item"><strong>{t.reports.deals}:</strong> <span>{generalStats.topRealtorDealsFirst}</span></div>
                    <div class="report__container__item"><strong>{t.reports.profit}:</strong> <span>{generalStats.topRealtorIncomeFirst}</span></div>
                </div>
                <div class="realtor-card">
                    <div class="report__container__item"><strong>{t.reports.name}:</strong> <span>{generalStats.topRealtorNameSecond}</span></div>
                    <div class="report__container__item"><strong>{t.reports.deals}:</strong> <span>{generalStats.topRealtorDealsSecond}</span></div>
                    <div class="report__container__item"><strong>{t.reports.profit}:</strong> <span>{generalStats.topRealtorIncomeSecond}</span></div>
                </div>
            </div>
        </div>

        <div>
            <h2 class="section-title">🏠 {t.reports.propertyTypes}</h2>
            <div class="report__container__top_property_types">
                <div class="property-type-card">
                    <div class="report__container__item"><strong>{t.reports.type}:</strong> <span>{generalStats.topPropertyTypeNameFirst}</span></div>
                    <div class="report__container__item"><strong>{t.reports.count}:</strong> <span>{generalStats.topPropertyTypeCntFirst}</span></div>
                    <div class="report__container__item"><strong>{t.reports.avgPrice}:</strong> <span>{generalStats.topPropertyTypeAvgPriceFirst}</span></div>
                </div>
                <div class="property-type-card">
                    <div class="report__container__item"><strong>{t.reports.type}:</strong> <span>{generalStats.topPropertyTypeNameSecond}</span></div>
                    <div class="report__container__item"><strong>{t.reports.count}:</strong> <span>{generalStats.topPropertyTypeCntSecond}</span></div>
                    <div class="report__container__item"><strong>{t.reports.avgPrice}:</strong> <span>{generalStats.topPropertyTypeAvgPriceSecond}</span></div>
                </div>
            </div>
        </div>

        <div>
            <h2 class="section-title">🎯 {t.reports.topClients}</h2>
            <div class="report__container__top_clients">
                <div class="client-card">
                    <div class="report__container__item"><strong>{t.reports.name}:</strong> <span>{generalStats.topClientNameFirst}</span></div>
                    <div class="report__container__item"><strong>{t.reports.deals}:</strong> <span>{generalStats.topClientDealsFirst}</span></div>
                    <div class="report__container__item"><strong>{t.reports.spent}:</strong> <span>{generalStats.topClientSpentFirst}</span></div>
                </div>
                <div class="client-card">
                    <div class="report__container__item"><strong>{t.reports.name}:</strong> <span>{generalStats.topClientNameSecond}</span></div>
                    <div class="report__container__item"><strong>{t.reports.deals}:</strong> <span>{generalStats.topClientDealsSecond}</span></div>
                    <div class="report__container__item"><strong>{t.reports.spent}:</strong> <span>{generalStats.topClientSpentSecond}</span></div>
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
        width: 50%;
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
        grid-template-columns: 1fr 1fr;
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
        grid-template-columns: 1fr 1fr;
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

    .report__container__top_property_types {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .property-type-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.1);
        transition: transform 0.3s ease;
    }

    .property-type-card:hover {
        transform: scale(1.02);
    }

    .property-type-card .report__container__item {
        padding: 8px 0;
        border-bottom: 1px solid rgba(255,255,255,0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .property-type-card .report__container__item:last-child {
        border-bottom: none;
    }

    .report__container__top_clients {
        display: grid;
        grid-template-columns: 1fr 1fr;
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

    .report__container__summary .report__container__item,
    .report__container__top_property,
    .realtor-card,
    .client-card {
        background: var(--card-bg) !important;
        color: var(--card-text);
        box-shadow: 0 8px 25px var(--card-shadow);
        border: 1px solid var(--border-color);
    }

    .report__container__item strong {
        color: var(--card-secondary-text);
    }

    :global([data-theme="dark"]) .report__container {
        --card-bg: #1e1e2d;
        --card-text: #ffffff;
        --card-secondary-text: #a0aec0;
        --card-shadow: rgba(0, 0, 0, 0.4);
        --border-color: #2d2d3f;
    }

    :global([data-theme="dark"]) .property-type-card {
        background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
        border: none;
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

        .report__container__top_realtors{
            grid-template-columns: 1fr;
        }

        .report__container__top_property_types{
            grid-template-columns: 1fr;
        }

        .report__container__top_property_types{
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

        .report__container__top_property_types{
            grid-template-columns: 1fr;
        }

        .report__container__top_property_types{
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