<script lang='ts'>
    import AnnouncementForm from '$lib/components/announcement/AnnouncementForm.svelte';

    let { data } = $props();
</script>

<AnnouncementForm isUpdate={true} announcementId={data.id!} />