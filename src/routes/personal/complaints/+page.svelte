<script lang="ts">
    import { settings, auth, translations } from "$lib";
    import { personalStore } from "$lib/stores/PersonalStore.svelte";
    import type SettingsStore from "$lib/stores/settingsStore.svelte";
    import { getContext, onMount } from "svelte";

    onMount(async () => {
        settings.isLoading = true;
        await personalStore.loadUserComplaints($auth.id!);
        settings.isLoading = false;
    });

    const userComplaints = $derived(personalStore.userComplaints[$auth.id!]);

    function getStatusClass(statusName: string) {
        switch (statusName?.toLowerCase()) {
            case 'resolved':
            case 'вирішено': return 'status-resolved';
            case 'rejected':
            case 'відхилено': return 'status-rejected';
            case 'pending':
            case 'очікує': return 'status-pending';
            default: return '';
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
                {#if userComplaints?.length > 0}
                    {#each userComplaints as complaint}
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

@media (max-width: 700px) {
    .complaints-container {
        margin: 1rem auto;
        margin-bottom: 6rem;
    }

    .complaints-header h2 {
        font-size: 1.4rem;
    }

    table thead {
        display: none;
    }

    table, tbody, tr {
        display: block;
        width: 100%;
    }

    tr {
        margin-bottom: 1rem;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        padding: 1rem;
        box-sizing: border-box;
        border: 1px solid rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease;
    }

    :global([data-theme="dark"]) tr {
        background: rgba(30, 41, 59, 0.9);
        border-color: rgba(255, 255, 255, 0.05);
    }

    tr[class^="status-"] {
        border-left: 5px solid transparent !important;
    }
    .status-resolved { border-left-color: #22c55e !important; }
    .status-rejected { border-left-color: #ef4444 !important; }
    .status-pending { border-left-color: #eab308 !important; }

    td {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6rem 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        font-size: 0.9rem;
    }

    :global([data-theme="dark"]) td {
        border-bottom-color: rgba(255, 255, 255, 0.05);
    }

    td:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }
    td:first-child {
        padding-top: 0;
    }

    .note-container {
        max-width: 180px; 
        text-align: right;
    }

    .admin-decision {
        align-items: flex-end;
    }
    
    td:nth-child(1)::before { content: "Дата:"; font-weight: 600; color: #9ca3af; }
    td:nth-child(2)::before { content: "Оголошення:"; font-weight: 600; color: #9ca3af; }
    td:nth-child(3)::before { content: "Тип:"; font-weight: 600; color: #9ca3af; }
    td:nth-child(4)::before { content: "Коментар:"; font-weight: 600; color: #9ca3af; }
    td:nth-child(5)::before { content: "Статус:"; font-weight: 600; color: #9ca3af; }
    td:nth-child(6)::before { content: "Рішення:"; font-weight: 600; color: #9ca3af; }

    .empty-state {
        padding: 2rem 0;
    }
    td.empty-state::before {
        display: none;
    }
    .empty-content {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
}

@media (max-width: 360px) {
    .complaints-container {
        padding: 0 0.5rem;
    }

    tr {
        padding: 0.75rem;
    }

    td {
        font-size: 0.85rem;
        padding: 0.5rem 0;
    }

    .note-container {
        max-width: 130px;
    }

    .status-badge {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
    }
}
</style>