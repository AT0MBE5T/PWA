<script lang="ts">
    import { settings, translations } from "$lib";
    
    const t = $derived(translations[settings.lang]);
</script>

<div class="placeholder">
    <div class="icon">💬</div>
    <h2>{t.chats.messages}</h2>
    <p>{t.chats.selectContact}</p>
</div>

<style>
    .placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #333;
        text-align: center;
        padding: 2rem;
    }
    .icon { font-size: 4rem; margin-bottom: 1rem; }

    :global([data-theme="dark"]) .placeholder {
        color: #64748b;
        background-color: var(--bg-card);
    }

    :global([data-theme="dark"]) .placeholder h2 {
        color: #f8fafc;
    }
</style>