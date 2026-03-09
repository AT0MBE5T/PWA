<script lang="ts">
	import { Modal, settings, translations } from '$lib';

	const t = $derived(translations[settings.lang]);

	let open = $state(false);

	let {
		title = t.system.confirmation,
		description = t.system.areYouSure
	} = $props();

	let resolver: (v: boolean) => void;

	export function ask(): Promise<boolean> {
		open = true;

		return new Promise<boolean>((resolve) => {
			resolver = resolve;
		});
	}

	function confirm(result: boolean) {
		open = false;
		resolver?.(result);
	}
</script>

{#if open}
	<Modal bind:open={open} title={title} description={description}>
		<svelte:fragment slot="footer">
			<button class="btn" onclick={() => confirm(true)}>
				{t.system.yes}
			</button>

			<button class="btn" onclick={() => confirm(false)}>
				{t.system.no}
			</button>
		</svelte:fragment>
	</Modal>
{/if}

<style>
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
</style>