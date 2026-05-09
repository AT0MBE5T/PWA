<script lang="ts">
    import { env } from "$env/dynamic/public";
    import { settings, translations, type ComplaintGrid } from "$lib";
    import type SettingsStore from "$lib/stores/settingsStore.svelte.js";
    import getCookie from "$lib/utils/cookieData.js";
    import { getContext, onMount } from "svelte";

    let { data } = $props();
    let currentUserId = $derived<string | undefined | null>(data.userUrl);
    let complaints = $state<ComplaintGrid[] | null>(null);

    const loadUserComplaints = async(id: string) => {
        try {
            const accessToken = getCookie('accessToken');
            const response = await fetch(`${env.PUBLIC_API_URL}/api/complaints/get-by-user-id/${id}`, {
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

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);
</script>

<div class="complaints-container">
    <div class="complaints-header">
        <div class="header-icon"><img src="/icons/bull-horn.svg" height="25" width="25" alt="#"></div>
        <h2>{t.personal.complaints}</h2>
    </div>

    <div class="table-wrapper">
        <table>
            <thead>
                <tr>
                    <th>{t.personal.dateComplaint}</th>
                    <th>{t.personal.offerComplaint}</th>
                    <th>{t.personal.typeComplaint}</th>
                    <th>{t.personal.commentComplaint}</th>
                    <th>{t.personal.statusComplaint}</th>
                    <th>{t.personal.solutionComplaint}</th>
                </tr>
            </thead>
            <tbody>
                {#if complaints && complaints.length > 0}
                    {#each complaints as complaint}
                        <tr class={getStatusClass(complaint.statusName)}>
                            <td class="date-cell">
                                {new Date(complaint.createdAt).toLocaleDateString()}
                            </td>
                            <td>
                                <span class="announcement-link">
                                    {complaint.announcementName}
                                </span>
                            </td>
                            <td><span class="type-tag">{complaint.typeName}</span></td>
                            <td>
                                <div class="note-container" title={complaint.userNote}>
                                    {complaint.userNote}
                                </div>
                            </td>
                            <td>
                                <span class="status-badge">
                                    {complaint.statusName}
                                </span>
                            </td>
                            <td>
                                <div class="admin-decision">
                                    {#if complaint.adminNote}
                                        <span class="admin-text">{complaint.adminNote}</span>
                                        <small class="process-date">
                                            {complaint.processedAt ? new Date(complaint.processedAt).toLocaleDateString() : ''}
                                        </small>
                                    {:else}
                                        <span class="pending-dash">—</span>
                                    {/if}
                                </div>
                            </td>
                        </tr>
                    {/each}
                {:else}
                    <tr>
                        <td colspan="6" class="empty-state">
                            <div class="empty-content">
                                <span><img src="/icons/empty.svg" height="25" width="25" alt="#"></span>
                                <p>{t.personal.emptyComplaints}</p>
                            </div>
                        </td>
                    </tr>
                {/if}
            </tbody>
        </table>
    </div>
</div>

<style>
    .complaints-container {
        max-width: 1100px;
        margin: 2rem auto;
        padding: 0 1rem;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        animation: fadeInUp 0.6s ease-out;
    }

    .complaints-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .header-icon {
        font-size: 2rem;
    }

    .complaints-header h2 {
        margin: 0;
        font-size: 1.75rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
    }

    .table-wrapper {
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.3);
    }

    table {
        width: 100%;
        border-collapse: collapse;
        text-align: left;
    }

    th {
        background: rgba(248, 249, 250, 0.5);
        padding: 1.25rem 1rem;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    td {
        padding: 1.25rem 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.03);
        color: #374151;
        font-size: 0.95rem;
        vertical-align: middle;
    }

    tr {
        transition: background-color 0.2s ease;
    }

    tr:hover {
        background-color: rgba(255, 255, 255, 0.5);
    }

    .status-badge {
        padding: 0.4rem 0.8rem;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        display: inline-block;
    }

    .status-resolved .status-badge {
        background: #dcfce7;
        color: #166534;
    }

    .status-rejected .status-badge {
        background: #fee2e2;
        color: #991b1b;
    }

    .status-pending .status-badge {
        background: #fef9c3;
        color: #854d0e;
    }

    tr[class^="status-"] {
        border-left: 4px solid transparent;
    }
    .status-resolved { border-left-color: #22c55e !important; }
    .status-rejected { border-left-color: #ef4444 !important; }
    .status-pending { border-left-color: #eab308 !important; }

    .announcement-link {
        font-weight: 600;
        color: #4f46e5;
    }

    .type-tag {
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        font-size: 0.85rem;
    }

    .note-container {
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #6b7280;
    }

    .admin-decision {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .admin-text {
        font-weight: 500;
    }

    .process-date {
        font-size: 0.75rem;
        color: #9ca3af;
    }

    .empty-state {
        text-align: center;
        padding: 4rem 0;
    }

    .empty-content span {
        font-size: 3rem;
        display: block;
        margin-bottom: 1rem;
    }

    :global([data-theme="dark"]) .table-wrapper {
        background: rgba(30, 41, 59, 0.7);
        border-color: rgba(255, 255, 255, 0.1);
    }

    :global([data-theme="dark"]) td {
        color: #e2e8f0;
        border-bottom-color: rgba(255, 255, 255, 0.05);
    }

    :global([data-theme="dark"]) th {
        background: rgba(15, 23, 42, 0.3);
        color: #94a3b8;
    }

    :global([data-theme="dark"]) tr:hover {
        background-color: rgba(255, 255, 255, 0.03);
    }

    :global([data-theme="dark"]) .status-resolved .status-badge { background: rgba(34, 197, 94, 0.2); color: #4ade80; }
    :global([data-theme="dark"]) .status-rejected .status-badge { background: rgba(239, 68, 68, 0.2); color: #f87171; }
    :global([data-theme="dark"]) .status-pending .status-badge { background: rgba(234, 179, 8, 0.2); color: #fbbf24; }

    @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
        .table-wrapper {
            border-radius: 12px;
        }
        td, th {
            padding: 0.75rem;
            font-size: 0.85rem;
        }
    }
</style>