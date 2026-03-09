<script lang="ts">
    import { translations, settings } from '$lib';
    import { createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';

    let { open = $bindable(false), title = null, description = null, closeOnBackdrop = true } = $props();

    const dispatch = createEventDispatcher<{ close: void }>();

    // svelte-ignore non_reactive_update
        let dialogEl: HTMLDivElement | null = null;

    function trapFocus(e: KeyboardEvent) {
        if (!open || e.key !== "Tab" || !dialogEl) return;
        const focusables = dialogEl.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement;

        if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function close() {
        open = false;
        dispatch("close");
    }

    function backdropClick(e: MouseEvent) {
        if (!closeOnBackdrop) return;
        if (e.target === e.currentTarget) close();
    }

    function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") {
            e.stopPropagation();
            close();
        }
    }

    const t = $derived(translations[settings.lang]);
</script>

{#if open}
    <!-- svelte-ignore event_directive_deprecated -->
    <div
        class="modal-backdrop"
        role="presentation"
        on:click={backdropClick}
        on:keydown={onKey}
    >
        <div
            class="modal"
            bind:this={dialogEl}
            role="dialog"
            tabindex="0"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-desc" : undefined}
            on:keydown={trapFocus}
            transition:fade={{ duration: 120 }}
        >
            <header class="modal__header">
                {#if title}<h2 id="modal-title" class="modal__title">{title}</h2>{/if}
                <button class="modal__close" on:click={close} aria-label="{t.system.closeDialog}">×</button>
            </header>

            {#if description}
                <p id="modal-desc" class="modal__desc">{description}</p>
            {/if}

            <!-- svelte-ignore slot_element_deprecated -->
            <section class="modal__body">
                <slot />
            </section>

            <!-- svelte-ignore slot_element_deprecated -->
            <footer class="modal__footer">
                <slot name="footer">
                    <button class="btn" on:click={close}>{t.offers.ok}</button>
                </slot>
            </footer>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(11, 15, 25, 0.7);
        display: grid;
        place-items: center;
        padding: 24px;
        z-index: 1000;
        backdrop-filter: blur(14px) saturate(150%);
        animation: backdropIn 0.25s ease;
    }

    .modal {
        outline: none;
        width: min(100%, 36rem);
        max-height: 85vh;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        overflow: hidden;
        transform: translateY(10px);
        opacity: 0;
        background: #F4F5F0;
        color: #111827;
        border-radius: 20px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 12px 60px rgba(255, 255, 255, 0.2);
        animation: modalIn 0.25s ease forwards;
    }

    .modal__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 18px 22px 10px 22px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(to bottom, rgba(255,255,255,0.05), transparent);
    }

    .modal__title {
        margin: 0;
        font-size: 1.35rem;
        font-weight: bold;
        line-height: 1.4;
        letter-spacing: .1rem;
        color: #7a42f4;
        font-family: Consolas, sans-serif;
    }

    .modal__desc {
        margin: 6px 22px 14px 22px;
        font-size: 1.1rem;
        color: #333;
        font-weight: 400;
        line-height: 1.6;
        letter-spacing: .2px;
        text-align: justify;
        text-wrap: balance;
        animation: fadeInText 0.3s ease forwards;
    }

    :global([data-theme="dark"]) .modal__desc {
        color: #94a3b8;
    }

    .btn {
        padding: 0.8rem;
        background-color: #7a42f4;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        width: 100%;
    }

    .btn:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .modal__close {
        appearance: none;
        border: none;
        background: transparent;
        color: #9ca3af;
        font-size: 1.6rem;
        padding: 4px 8px;
        border-radius: 10px;
        cursor: pointer;
        transition: color 0.25s ease, background 0.25s ease;
    }

    .modal__close:hover {
        color: #60a5fa;
        background: rgba(255, 255, 255, 0.05);
    }

    .modal__body {
        padding: 18px 22px 8px 22px;
        overflow: auto;
    }

    .modal__footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 14px 22px 18px 22px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(to top, rgba(255,255,255,0.05), transparent);
    }

    .btn:focus-visible {
        outline: 2px solid #60a5fa;
        outline-offset: 2px;
    }

    :global([data-theme="dark"]) .modal {
        background: #1e293b;
        border: 1px solid #334155;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        border-radius: 20px;
    }

    @keyframes modalIn {
        from { opacity: 0; transform: translateY(20px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    @keyframes backdropIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes fadeInText {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 520px) {
        .modal-backdrop {
            padding: 0;
        }

        .modal {
            width: 100%;
            border-radius: 20px 20px 0 0;
            border: none;
            max-height: 92vh;
            animation: modalInMobile 0.25s ease forwards;
        }

        @keyframes modalInMobile {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
    }
</style>
