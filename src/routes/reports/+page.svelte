<script lang="ts">
    import { ReportFilter, ReportUser, ReportPropertyType, ReportGeneral, Toast, toast, translations, settings } from '$lib';
    import type { ReportFilterParams } from '$lib';

    let isChosen = $state<boolean>(false);

    let data = $state<ReportFilterParams>();

    type Actions = 'General' | 'Client' | 'PropertyType'

    let currentAction = $state<Actions>('General');

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

    const t = $derived(translations[settings.lang]);
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