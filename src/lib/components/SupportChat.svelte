<script lang="ts">
    import { auth } from '$lib';
    import { goto } from '$app/navigation';
    import { env } from '$env/dynamic/public';
    import { translations } from '$lib/i18n';
    import { settings } from '$lib/stores/settings.svelte';
    import type SettingsStore from '$lib/stores/settingsStore.svelte';
    import { toast } from '$lib/stores/toast';
    import { getContext } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	let isOpen = $state(false);
	let message = $state("");

	const sendMessage = async (e: SubmitEvent) => {
		e.preventDefault();
		if (!message.trim()) return;

		await onContactAdmins();
		
		message = ""; 
		isOpen = false;
	};

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);

    const onContactAdmins = async () => {
        if($auth.id == null){
            return;
        }

        try{
            const obj = {
                UserNote: message
            };

            const response = await fetch(`${env.PUBLIC_API_URL}/api/supports/add-support`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${$auth.accessToken}`
                },
                body: JSON.stringify(obj)
            });

            if(!response.ok){
                toast.show(t.offers.creatingDialogueError, 'error');
                return;
            }
            settings.online = true;
        }catch{
            settings.online = false;
            toast.show(t.system.errorConnection, 'error', 5000);
        }
    };
</script>

<button 
	class="trigger-btn" 
	onclick={() => isOpen = !isOpen}
	aria-label="Связаться с администрацией"
>
	{#if !isOpen}
		<span in:fade><img src="/icons/support.svg" alt="#" width="50" height="50" /></span>
	{:else}
		<span in:fade><img src="/icons/cross.svg" alt="#" width="40" height="40" /></span>
	{/if}
</button>

{#if isOpen}
	<div 
		class="chat-window" 
		transition:fly={{ y: 20, duration: 300 }}
	>
		<div class="chat-header">
			<h3>{t.chats.support}</h3>
			<p>{t.chats.supportText}</p>
		</div>

		<form onsubmit={sendMessage} class="chat-body">
			<textarea
				bind:value={message}
				placeholder={t.chats.typeMessage}
				required
			></textarea>
			<button type="submit" disabled={!message.trim()}>
				{t.chats.send}
			</button>
		</form>
	</div>
{/if}

<style>
	.trigger-btn {
        position: fixed;
        right: 2rem;
        bottom: 2rem;
        width: 4rem;
        height: 4rem;
        background: linear-gradient(135deg, #7a42f4 0%, #9333ea 100%);
        color: white;
        border: none;
        border-radius: 50%;
        box-shadow: 0 4px 12px #9333ea;
        transition: all 0.3s ease;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
		z-index: 1;
    }

	.trigger-btn img{
		display: flex;
	}

	:global([data-theme="dark"]) .chat-window {
        background: #334155;
        border-top: 1px solid #334155;
    }

    .trigger-btn:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(255, 153, 0, 0.4);
    }

	.chat-window {
		position: fixed;
		bottom: 6rem;
		right: 2rem;
		width: 320px;
		background: white;
		border-radius: 12px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		z-index: 1000;
		border: 1px solid #e5e7eb;
	}

	.chat-header {
        background: var(--header-bg);
        backdrop-filter: blur(10px);
		color: white;
		padding: 1rem;
	}

	.chat-header h3 {
		margin: 0;
		font-size: 1.1rem;
	}

	.chat-header p {
		margin: 0.25rem 0 0;
		font-size: 0.8rem;
		opacity: 0.9;
	}

	.chat-body {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	textarea {
		width: 100%;
		height: 100px;
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		resize: none;
		font-family: inherit;
		outline: none;
	}

	textarea:focus {
		border-color: #2563eb;
	}

	button[type="submit"] {
		background: #7a42f4;
		color: white;
		border: none;
		padding: 0.6rem;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
	}

	button[type="submit"]:disabled {
		background: #af86ff;
		cursor: not-allowed;
	}

	:global([data-theme="dark"]) textarea {
        background: #1e293b;
        border-top: 1px solid #334155;
    }
</style>