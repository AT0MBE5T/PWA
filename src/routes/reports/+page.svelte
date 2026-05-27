<script lang="ts">
    import { goto } from '$app/navigation';
    import { ReportFilter, ReportUser, ReportPropertyType, ReportGeneral, toast, translations, settings, auth } from '$lib';
    import type { ReportFilterParams } from '$lib';
    import type SettingsStore from '$lib/stores/settingsStore.svelte';
    import { redirect } from '@sveltejs/kit';
    import { getContext, onMount } from 'svelte';

    let isChosen = $state<boolean>(false);

    let data = $state<ReportFilterParams>();

    type Actions = 'General' | 'Client' | 'PropertyType'

    let currentAction = $state<Actions>('General');

    onMount(async () => {
        const userId = $auth.id;

        if (!userId){
            await goto('/login');
        }
    });

    const filterData = (dataRet: ReportFilterParams, action: Actions) => {
        data = dataRet;
        currentAction = action;
        isChosen = true;
    };

    const backToFilter = (status: number = 200) => {
        isChosen = false;
        if (status === 404)
            toast.show(t.validation.userNotFound, 'error');
    };

    const settingsStore = getContext<SettingsStore>('settings');
    const t = $derived(translations[settingsStore.lang]);
</script>

<div class="report__container">
    {#if isChosen}
        {#if currentAction === 'Client' && data !== undefined}
            <ReportUser callBack={backToFilter} data={data} />
        {:else if currentAction === 'PropertyType' && data !== undefined}
            <ReportPropertyType callBack={backToFilter} data={data} />
        {:else if currentAction === 'General'}
            <ReportGeneral callBack={backToFilter} />
        {/if}
    {:else}
        <ReportFilter callBack={filterData} />
    {/if}
</div>

<style>
    .report__container{
        margin: auto auto;
        width: 100%;
    }
</style>