<script lang="ts">
    import { env } from "$env/dynamic/public";
    import { settings, auth, translations, type ComplaintGrid } from "$lib";
    import { personalStore } from "$lib/stores/PersonalStore.svelte";
    import getCookie from "$lib/utils/cookieData.js";
    import { onMount } from "svelte";

    let { data } = $props();
    let currentUserId = $derived<string | undefined | null>(data.userUrl);
    let complaints = $state<ComplaintGrid[] | null>(null);

    const loadUserComplaints = async(id: string) => {
        try {
            const accessToken = getCookie('accessToken');
            const response = await fetch(`${env.PUBLIC_API_URL}/api/Complaint/get-by-user-id/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            complaints = await response.json() as ComplaintGrid[];

            if (!complaints)
                return;
            
            settings.online = true;
        } catch (e) {
            settings.online = false;
            //console.error("Ошибка загрузки данных", e);
        }
    }

    onMount(async () => {
        if (currentUserId === undefined || currentUserId === null)
            return;

        settings.isLoading = true;
        await loadUserComplaints(currentUserId);
        settings.isLoading = false;
    });

    function getStatusClass(statusName: string) {
        switch (statusName?.toLowerCase()) {
            case 'resolved':
            case 'вирішено': 
                return 'status-resolved';
            case 'rejected':
            case 'відхилено': 
                return 'status-rejected';
            case 'pending':
            case 'очікує': 
                return 'status-pending';
            default: 
                return '';
        }
    }

    const t = $derived(translations[settings.lang]);
</script>

<div class="complaints-container">
    <h2>Мої скарги</h2>

    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>Дата</th>
                    <th>Оголошення</th>
                    <th>Тип</th>
                    <th>Коментар</th>
                    <th>Статус</th>
                    <th>Адмін</th>
                    <th>Нотатки</th>
                    <th>Дата рішення</th>
                </tr>
            </thead>
            <tbody>
                {#if complaints?.length !== undefined && complaints.length > 0}
                    {#each complaints as complaint}
                        <tr class={getStatusClass(complaint.statusName)}>
                            <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                            <td><strong>{complaint.announcementName}</strong></td>
                            <td>{complaint.typeName}</td>
                            <td>
                                <span class="note" title={complaint.userNote}>
                                    {complaint.userNote}
                                </span>
                            </td>
                            <td>
                                <span class="status-badge">
                                    {complaint.statusName}
                                </span>
                            </td>
                            <td>
                                {complaint.adminName || '—'}
                                {#if complaint.adminNote}
                                    <i class="info-icon" title={complaint.adminNote}>ℹ️</i>
                                {/if}
                            </td>
                            <td>
                                {complaint.adminNote || '—'}
                            </td>
                            <td>
                                {complaint.processedAt !== null ? new Date(complaint.processedAt).toLocaleDateString() : '—'}
                            </td>
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan="6" class="empty">Скарг не знайдено</td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>

<style>
    .complaints-container {
        padding: 1rem;
        font-family: sans-serif;
    }

    .table-wrapper {
        overflow-x: auto;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }

    th, td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    th {
        background-color: #f8f9fa;
        color: #666;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 0.85rem;
    }

    tr.status-resolved {
        background-color: #39ff00;
    }

    tr.status-rejected {
        background-color: #ff4500;
    }

    tr.status-pending {
        background-color: #ffde80;
    }

    .status-badge {
        font-weight: bold;
        font-size: 0.9rem;
    }

    .note {
        display: inline-block;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: help;
    }

    .info-icon {
        cursor: help;
        margin-left: 5px;
        font-style: normal;
    }

    .empty {
        text-align: center;
        color: #999;
        padding: 2rem;
    }
</style>