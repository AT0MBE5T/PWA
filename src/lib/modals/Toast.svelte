<script lang="ts">
    import { fade } from 'svelte/transition';
    import { onMount } from 'svelte';

    let duration = $state<number>(2500);

    let { message, type, showToastCallback }: { message: string, type: string, showToastCallback: () => void } = $props();

    let visible = $state<boolean>(true);

    onMount(() => {
        const timer = setTimeout(() => {
            visible = false;
            const addTime = setTimeout(() => {showToastCallback()}, 250);
            return () => clearTimeout(addTime);
        }, duration);
        return () => clearTimeout(timer);
    });
</script>

{#if visible}
    <div
        class="toast {type}"
        transition:fade={{ duration: 250 }}
    >
        {#if type === 'success'} ✅ {/if}
        {#if type === 'error'} ❌ {/if}
        {#if type === 'info'} ℹ️ {/if}
        <span>{message}</span>
    </div>
{/if}

<style>
    .toast {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(17, 24, 39, 0.9);
        color: #f3f4f6;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 10px 16px;
        border-radius: 12px;
        box-shadow: 0 6px 20px rgba(0,0,0,.3);
        font-weight: 500;
        backdrop-filter: blur(10px);
        z-index: 1200;
        animation: slideUp .25s ease;
    }

    .toast.success { border-left: 4px solid #22c55e; }
    .toast.error { border-left: 4px solid #ef4444; }
    .toast.info { border-left: 4px solid #3b82f6; }

    @keyframes slideUp {
        from { transform: translateY(15px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
</style>