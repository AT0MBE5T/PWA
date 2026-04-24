<script lang="ts">
    import { fly } from 'svelte/transition';
    import { backOut } from 'svelte/easing';

    let {
        show,
        message,
        type,
        duration,
        showToastCallback
    }: {
        show: boolean,
        message: string,
        type: string,
        duration: number,
        showToastCallback: () => void
    } = $props();

    let visible = $state<boolean>(true);
    let timer: any;

$effect(() => {
        if (show) {
            visible = true;
            
            if (timer) clearTimeout(timer);
            
            timer = setTimeout(() => {
                visible = false;
            }, duration);
        } else {
            visible = false;
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    });

    function handleOutEnd() {
        if (!visible) {
            showToastCallback();
        }
    }
</script>

{#if visible}
    <div
class="toast {type}"
        in:fly={{ y: -50, duration: 800, easing: backOut }}
        out:fly={{ y: -50, duration: 600 }}
        onoutroend={handleOutEnd}
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
    }

    .toast.success { border-left: 4px solid #22c55e; }
    .toast.error { border-left: 4px solid #ef4444; }
    .toast.info { border-left: 4px solid #3b82f6; }
</style>