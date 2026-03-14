<script lang='ts'>
    import { onMount } from 'svelte';
    import type {
        PropertyTypeInterface,
        StatementTypeInterface,
        AnnouncementEditResponse,
        ValidationErrors,
        LookupItem,
        ImageItem,

        AnnouncementShort,

        AnnouncementAddModel,

        AnnouncementUpdateModel



    } from '$lib';
    import { Modal, Toast, auth, settings, translations } from '$lib';
    import { goto } from '$app/navigation';
    import { offerFullStore } from '$lib/stores/OfferFullStore.svelte';
    import offerState from '$lib/stores/offerStore.svelte';

    let { isUpdate, announcementId }: { isUpdate: boolean, announcementId: string } = $props();

    let show = $state<boolean>(false);
    let errors = $state<ValidationErrors>({});
    let imageError = $state<boolean>(false);
    let imageErrorText = $state<string>('');
    let propertyTypeId = $state<string | ''>('');
    let propertyTypeIdError = $state<boolean>(false);
    let propertyTypeErrorText = $state<string>('');
    let locationInput = $state<string>('');
    let locationError = $state<boolean>(false);
    let locationErrorText = $state<string>('');
    let areaInput = $state<number | ''>('');
    let areaError = $state<boolean>(false);
    let areaErrorText = $state<string>('');
    let floorsInput = $state<number | ''>('');
    let floorsError = $state<boolean>(false);
    let floorsErrorText = $state<string>('');
    let roomsInput = $state<number | ''>('');
    let roomsError = $state<boolean>(false);
    let roomsErrorText = $state<string>('');
    let titleInput = $state<string>('');
    let titleError = $state<boolean>(false);
    let titleErrorText = $state<string>('');
    let statementTypeId = $state<string | ''>('');
    let statementTypeError = $state<boolean>(false);
    let statementTypeErrorText = $state<string>('');
    let priceInput = $state<number | ''>('');
    let priceError = $state<boolean>(false);
    let priceErrorText = $state<string>('');
    let contentInput = $state<string>('');
    let contentError = $state<boolean>(false);
    let contentErrorText = $state<string>('');
    let descriptionInput = $state<string>('');
    let descriptionError = $state<boolean>(false);
    let descriptionErrorText = $state<string>('');

    let propertyTypes = $state<PropertyTypeInterface[]>([]);
    let statementTypes = $state<StatementTypeInterface[]>([]);

    onMount(async () => {
        await getPropertyTypes();
        await getStatementTypes();
        if(isUpdate){
            await getDataForEdit();
        }

        filteredPropertyTypes = propertyTypes;
        filteredStatementTypes = statementTypes;
    })

    // const getDataForEdit = async () => {
    //     try{
    //         const response = await fetch('http://localhost:5118/api/Announcement/get-announcement-for-edit', {
    //             method: 'Post',
    //             body: JSON.stringify(announcementId),
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 "Authorization": `Bearer ${$auth.accessToken}`
    //             },
    //         });

    //         if(!response.ok){
    //             return;
    //         }

    //         const data = await response.json() as AnnouncementEditResponse;

    //         propertyTypeSearch = (propertyTypes.find((type: LookupItem) =>
    //             type.id === data.propertyTypeId
    //         ))!.name;

    //         statementTypeSearch = (statementTypes.find((type: LookupItem) =>
    //             type.id === data.statementTypeId
    //         ))!.name;

    //         propertyTypeId = data.propertyTypeId;
    //         statementTypeId = data.statementTypeId;
    //         areaInput = data.area;
    //         contentInput = data.content;
    //         descriptionInput = data.description;
    //         floorsInput = data.floors;
    //         locationInput = data.location;
    //         priceInput = data.price;
    //         roomsInput = data.rooms;
    //         titleInput = data.title;

    //         images = data.photos.map(p => ({
    //             type: 'existing',
    //             id: p.id,
    //             url: p.url
    //         }));
    //     }catch{
    //         const data = await offerFullStore.getPendingOffersUpdate();

    //         propertyTypeSearch = (propertyTypes.find((type: LookupItem) =>
    //             type.id === data
    //         ))!.name;

    //         statementTypeSearch = (statementTypes.find((type: LookupItem) =>
    //             type.id === data.statementTypeId
    //         ))!.name;

    //         propertyTypeId = data.propertyTypeId;
    //         statementTypeId = data.statementTypeId;
    //         areaInput = data.area;
    //         contentInput = data.content;
    //         descriptionInput = data.description;
    //         floorsInput = data.floors;
    //         locationInput = data.location;
    //         priceInput = data.price;
    //         roomsInput = data.rooms;
    //         titleInput = data.title;

    //         images = data.photos.map(p => ({
    //             type: 'existing',
    //             id: p.id,
    //             url: p.url
    //         }));
    //     }
    // };

    const getDataForEdit = async () => {
    try {
        const response = await fetch('http://localhost:5118/api/Announcement/get-announcement-for-edit', {
            method: 'POST',
            body: JSON.stringify(announcementId),
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${$auth.accessToken}`
            },
        });

        if (!response.ok) throw new Error("Server error");

        const data = await response.json() as AnnouncementEditResponse;

        images = data.photos.map(p => ({
            type: 'existing',
            id: p.id,
            url: p.url
        }));

        applyDataToForm(data);

    } catch (error) {
        console.warn("Offline mode: loading from IndexedDB");
        
        const offlineData = offerFullStore.offerDetails[announcementId];

if (offlineData) {
    // 1. Находим ID типов по их именам из справочников
    const propType = propertyTypes.find(t => t.name === offlineData.propertyTypeName);
    const statType = statementTypes.find(t => t.name === offlineData.statementTypeName);

    const mappedData: AnnouncementEditResponse = {
        // Копируем примитивы
        title: offlineData.title,
        location: offlineData.location,
        area: offlineData.area,
        floors: offlineData.floors,
        rooms: offlineData.rooms,
        price: offlineData.price,
        content: offlineData.content,
        description: offlineData.description,
        
        // Мапим ID (если не нашли, ставим пустую строку или дефолт)
        propertyTypeId: propType?.id ?? "",
        statementTypeId: statType?.id ?? "",
        userId: offlineData.authorId,

        // Преобразуем массив строк photosUrl в массив объектов PhotoInterface
        // Так как в просмотре обычно нет ID конкретных фото, 
        // используем URL как ID или индекс (для существующих фото это допустимо)
        photos: offlineData.photos
    };

    applyDataToForm(mappedData);
}
    }
};

// Хелпер для заполнения реактивных переменных
function applyDataToForm(data: AnnouncementEditResponse) {
    propertyTypeId = data.propertyTypeId;
    statementTypeId = data.statementTypeId;
    
    // Обновляем строковые значения для поисковых инпутов
    propertyTypeSearch = propertyTypes.find(t => t.id === data.propertyTypeId)?.name ?? "";
    statementTypeSearch = statementTypes.find(t => t.id === data.statementTypeId)?.name ?? "";

    areaInput = data.area;
    contentInput = data.content;
    descriptionInput = data.description;
    floorsInput = data.floors;
    locationInput = data.location;
    priceInput = data.price;
    roomsInput = data.rooms;
    titleInput = data.title;

    // Важно: мапим в ImageItem для UI компонента загрузки фото
    images = data.photos.map(p => ({
        type: 'existing',
        id: p.id,
        url: p.url
    }));
}

    const getPropertyTypes = async () => {
        try{
            const response = await fetch('http://localhost:5118/api/PropertyType/get-property-types', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if(!response.ok){
                return;
            }

            propertyTypes = await response.json() as LookupItem[];
        }catch{
            propertyTypes = await offerFullStore.getPropertyTypes();
        }
    };

    const getStatementTypes = async () => {
        try{
            const response = await fetch('http://localhost:5118/api/StatementType/get-statement-types', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if(!response.ok){
                return;
            }

            statementTypes = await response.json() as LookupItem[];
        }catch{
            statementTypes = await offerFullStore.getStatementTypes();
        }
    };

    let propertyTypeSearch = $state<string>('');
    let statementTypeSearch = $state<string>('');
    let propertyTypeDropdownOpen = $state<boolean>(false);
    let statementTypeDropdownOpen = $state<boolean>(false);
    let filteredPropertyTypes = $state<LookupItem[]>([]);
    let filteredStatementTypes = $state<LookupItem[]>([]);


    let images = $state<ImageItem[]>([]);
    let deletedImageIds = $state<string[]>([]);

    function handleFileChange(event: Event): void {
        const target = event.target as HTMLInputElement;

        if (!target.files) return;

        const newItems: ImageItem[] = Array.from(target.files).map(file => ({
            type: 'new',
            file,
            preview: URL.createObjectURL(file)
        }));

        images = [...images, ...newItems];

        imageError = false;
        imageErrorText = '';

        target.value = '';
    }

    function moveImage(index: number, direction: 'up' | 'down') {
        const newArr = [...images];

        const targetIndex = direction === 'up'
            ? index - 1
            : index + 1;

        if (targetIndex < 0 || targetIndex >= newArr.length) return;

        [newArr[index], newArr[targetIndex]] = [newArr[targetIndex], newArr[index]];

        images = newArr;
    }

    function removeImage(index: number) {
        const img = images[index];

        if (img.type === 'existing') {
            deletedImageIds = [...deletedImageIds, img.id];
        } else {
            URL.revokeObjectURL(img.preview);
        }

        images = images.filter((_, i) => i !== index);
    }

    function handlePropertyTypeSearch(event: Event): void {
        const target = event.target as HTMLInputElement;
        const searchTerm = target.value.toLowerCase();
        propertyTypeSearch = target.value;

        if (searchTerm === '') {
            filteredPropertyTypes = propertyTypes;
        } else {
            filteredPropertyTypes = propertyTypes.filter((type: LookupItem) =>
                type.name.toLowerCase().includes(searchTerm)
            );
        }

        propertyTypeDropdownOpen = true;
        propertyTypeIdError = false;
        propertyTypeErrorText = '';
    }

    function selectPropertyType(type: LookupItem): void {
        propertyTypeIdError = false;
        propertyTypeErrorText = '';
        propertyTypeSearch = type.name;
        propertyTypeId = type.id;
        propertyTypeDropdownOpen = false;
        filteredPropertyTypes = propertyTypes;
    }

    function handleStatementTypeSearch(event: Event): void {
        const target = event.target as HTMLInputElement;
        const searchTerm = target.value.toLowerCase();
        statementTypeSearch = target.value;

        if (searchTerm === '') {
            filteredStatementTypes = statementTypes;
        } else {
            filteredStatementTypes = statementTypes.filter((type: LookupItem) =>
                type.name.toLowerCase().includes(searchTerm)
            );
        }

        statementTypeDropdownOpen = true;
        statementTypeError = false;
        statementTypeErrorText = '';
    }

    function selectStatementType(type: LookupItem): void {
        statementTypeError = false;
        statementTypeErrorText = '';
        statementTypeSearch = type.name;
        statementTypeId = type.id;
        statementTypeDropdownOpen = false;
        filteredStatementTypes = statementTypes;
    }

    function handleClickOutside(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.lookup-container')) {
            propertyTypeDropdownOpen = false;
            statementTypeDropdownOpen = false;
        }
    }

    onMount(() => {
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    });

    function validateForm(): boolean {
        let isValid = true;

        imageError = false;
        propertyTypeIdError = false;
        locationError = false;
        areaError = false;
        floorsError = false;
        roomsError = false;
        titleError = false;
        statementTypeError = false;
        priceError = false;
        contentError = false;
        descriptionError = false;

        if (!images) {
            imageError = true;
            imageErrorText = t.validation.selectImage;
            isValid = false;
        }

        if (!propertyTypeId || !propertyTypes.some(t => t.name === propertyTypeSearch)) {
            propertyTypeIdError = true;
            propertyTypeErrorText = t.validation.selectPropertyType;
            isValid = false;
        }

        if (!locationInput.trim()) {
            locationError = true;
            locationErrorText = t.validation.locationRequired;
            isValid = false;
        }

        if (locationInput.length < 3 || locationInput.length > 100) {
            locationError = true;
            locationErrorText = t.validation.locationLength;
            isValid = false;
        }

        if (!areaInput) {
            areaError = true;
            areaErrorText = t.validation.areaRequired;
            isValid = false;
        }

        if (Number(areaInput) < 1 || Number(areaInput) > 999999) {
            areaError = true;
            areaErrorText = t.validation.areaBetween;
            isValid = false;
        }

        if (!titleInput.trim()) {
            titleError = true;
            titleErrorText = t.validation.titleRequired;
            isValid = false;
        }

        if (titleInput.length > 100) {
            titleError = true;
            titleErrorText = t.validation.titleLength;
            isValid = false;
        }

        if (!statementTypeId || !statementTypes.some(t => t.name === statementTypeSearch)) {
            statementTypeError = true;
            statementTypeErrorText = t.validation.selectStatementType;
            isValid = false;
        }

        if (!priceInput) {
            priceError = true;
            priceErrorText = t.validation.priceRequired;
            isValid = false;
        }

        if (Number(priceInput) < 1 || Number(priceInput) > 99999999) {
            priceError = true;
            priceErrorText = t.validation.priceBetween;
            isValid = false;
        }

        if (!contentInput.trim()) {
            contentError = true;
            contentErrorText = t.validation.contentRequired;
            isValid = false;
        }

        if (contentInput.length > 255) {
            contentError = true;
            contentErrorText = t.validation.contentLength;
            isValid = false;
        }

        if (!descriptionInput.trim()) {
            descriptionError = true;
            descriptionErrorText = t.validation.descriptionRequired;
            isValid = false;
        }

        if (descriptionInput.length > 500) {
            descriptionError = true;
            descriptionErrorText = t.validation.descriptionLength;
            isValid = false;
        }

        return isValid;
    }

    async function confirmClicked(): Promise<void> {
        if (validateForm()) {
            const formData = new FormData();
            images
                .filter(i => i.type === 'new')
                .forEach(img => {
                    formData.append("Photos", img.file);
                });
            formData.append("PropertyType", propertyTypeId);
            formData.append("StatementType", statementTypeId);
            formData.append("Location", locationInput);
            formData.append("Area", areaInput.toString());
            formData.append("Floors", floorsInput?.toString() ?? 0);
            formData.append("Rooms", roomsInput?.toString() ?? 0);
            formData.append("Title", titleInput);
            formData.append("Price", priceInput.toString());
            formData.append("Content", contentInput);
            formData.append("Description", descriptionInput);
            formData.append("UserId", $auth.id!);

            try{
                const response = await fetch('http://localhost:5118/api/Announcement/add-announcement', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        "Authorization": `Bearer ${$auth.accessToken}`
                    },
                    credentials: "include"
                });

                if(response.ok) {
                    toastType = 'success';
                    toastText = t.system.addedSuccessfully;
                    showToast = true;
                }
                else{
                    toastType = 'error';
                    toastText = t.system.errorOccurred;
                    showToast = true;
                }

                goto('/offers');
            }catch{
                const dataToAdd: AnnouncementAddModel = {
                    propertyTypeId: propertyTypeId,
                    statementTypeId: statementTypeId,
                    area: areaInput.toString(),
                    location: locationInput,
                    floors: floorsInput?.toString() ?? 0,
                    rooms: roomsInput?.toString() ?? 0,
                    title: titleInput,
                    price: priceInput.toString(),
                    content: contentInput,
                    description: descriptionInput,
                    userId: $auth.id!,
                    images: images,
                    id: crypto.randomUUID().toString()
                }
                await offerFullStore.savePendingOffer(dataToAdd);
                await offerState.addOffer(dataToAdd);
                await offerState.addFullOffer(dataToAdd, $auth.id!, `${$auth.name} ${$auth.personSurname}`);

                goto('/offers');
            }
        } else {
            toastType = 'error';
            toastText = t.system.validationError;
            showToast = true;
        }
    }

    async function updateClicked(): Promise<void> {
        if (validateForm()) {
            const formData = new FormData();

            images
                .filter(i => i.type === 'new')
                .forEach(img => {
                    formData.append("NewPhotos", img.file);
                });

            deletedImageIds.forEach(id => {
                formData.append("DeletedImageIds", id);
            });

            images.forEach(img => {
                if (img.type === 'existing') {
                    formData.append("ExistingImageOrder", img.id);
                } else {
                    formData.append("ExistingImageOrder", 'new');
                }
            });

            formData.append("PropertyType", propertyTypeId);
            formData.append("StatementType", statementTypeId);
            formData.append("Location", locationInput);
            formData.append("Area", areaInput.toString());
            formData.append("Floors", floorsInput.toString());
            formData.append("Rooms", roomsInput.toString());
            formData.append("Title", titleInput);
            formData.append("Price", priceInput.toString());
            formData.append("Content", contentInput);
            formData.append("Description", descriptionInput);
            formData.append("AnnouncementId", announcementId);

            try{
                const response = await fetch('http://localhost:5118/api/Announcement/update-announcement', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        "Authorization": `Bearer ${$auth.accessToken}`
                    },
                    credentials: "include"
                });

                if(response.ok) {
                    toastType = 'success';
                    toastText = t.system.updatedSuccessfully;
                    showToast = true;
                }
                else{
                    toastType = 'error';
                    toastText = t.system.errorOccurred;
                    showToast = true;
                }
                goto('/offers');
            }catch{
                const dataToUpdate: AnnouncementUpdateModel = {
                    propertyTypeId: propertyTypeId,
                    statementTypeId: statementTypeId,
                    area: areaInput.toString(),
                    location: locationInput,
                    floors: floorsInput?.toString() ?? 0,
                    rooms: roomsInput?.toString() ?? 0,
                    title: titleInput,
                    price: priceInput.toString(),
                    content: contentInput,
                    description: descriptionInput,
                    userId: $auth.id!,
                    images: images,
                    deletedImageIds: deletedImageIds,
                    id: announcementId
                }
                await offerFullStore.savePendingOfferUpdate(dataToUpdate);
                await offerState.updateOffer(dataToUpdate);

                goto('/offers');
            }
        } else {
            toastType = 'error';
            toastText = t.system.validationError;
            showToast = true;
        }
    }

    function handleLocationInputChange(): void {
        locationError = false;
        locationErrorText = '';
    }

    function handleAreaInputChange(): void {
        areaError = false;
        areaErrorText = '';
    }

    function handleFloorsInputChange(): void {
        floorsError = false;
        floorsErrorText = '';
    }

    function handleRoomsInputChange(): void {
        roomsError = false;
        roomsErrorText = '';
    }

    function handleTitleInputChange(): void {
        titleError = false;
        titleErrorText = '';
    }

    function handlePriceInputChange(): void {
        priceError = false;
        priceErrorText = '';
    }

    function handleContentInputChange(): void {
        contentError = false;
        contentErrorText = '';
    }

    function handleDescriptionInputChange(): void {
        descriptionError = false;
        descriptionErrorText = '';
    }

    let toastText = $state<string>('');
    let toastType = $state<string>('');
    let showToast = $state<boolean>(false);

    const showToastClose = (): void => {
        showToast = false;
    };

    const t = $derived(translations[settings.lang]);

</script>

{#if showToast}
    <Toast message={toastText} type={toastType} showToastCallback={showToastClose} />
{/if}

<div class="announcement__wrapper">
    <Modal bind:open={show} title={t.system.validationErrors}>
        <ul class="error-list">
            {#each Object.entries(errors) as [field, messages]}
                <li>
                    <strong>{field}:</strong>
                    <ul>
                        {#each messages as msg}
                            <li>{msg}</li>
                        {/each}
                    </ul>
                </li>
            {/each}
        </ul>
    </Modal>

    <div class="announcement__form__container">
        <h1 class="announcement__form__title">{t.authorized.title}</h1>
        <div class="announcement__form">
            <div class="announcement__form__item">
                <label for="image">{t.offers.images}</label>
                <div class="image-upload-container">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onchange={handleFileChange}
                        class="image-upload-button"
                    />

                    <div class="previews-container">
                        {#each images as img, i (img.type === 'existing' ? img.id : img.preview)}
                        <div class="image-preview">
                            <!-- svelte-ignore a11y_img_redundant_alt -->
                            <img
                                src={img.type === 'existing' ? img.url : img.preview}
                                alt="photo"
                                style="width:100px;height:100px;object-fit:cover"
                            />
                            <div class="controls">
                                <button type="button" onclick={() => moveImage(i,'up')}>←</button>
                                <button type="button" onclick={() => removeImage(i)}>✕</button>
                                <button type="button" onclick={() => moveImage(i,'down')}>→</button>
                            </div>
                            {#if i === 0}
                                <span class="main-badge">{t.offers.main_photo}</span>
                            {/if}
                        </div>
                        {/each}
                        </div>

                    {#if imageError}
                        <p style="color: red; font-size: 14px;">{imageErrorText}</p>
                    {/if}
                </div>
            </div>

            <div class="announcement__form__sides">
                <div class="announcement__form-left">
                    <div class="announcement__form__item">
                        <label for="propertyType">{t.offers.propertyType}</label>
                        <div class="lookup-container">
                            <input
                                    bind:value={propertyTypeSearch}
                                    oninput={handlePropertyTypeSearch}
                                    onfocus={() => propertyTypeDropdownOpen = true}
                                    name="propertyType"
                                    type="text"
                                    placeholder={t.offers.searchPropertyType}
                                    autocomplete="off"
                            />
                            {#if propertyTypeDropdownOpen && filteredPropertyTypes.length > 0}
                                <div class="lookup-dropdown">
                                    {#each filteredPropertyTypes as type}
                                        <div
                                                class="lookup-item"
                                                role="button"
                                                tabindex="0"
                                                onclick={() => selectPropertyType(type)}
                                                onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectPropertyType(type)}
                                        >
                                            {type.name}
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <div class="error-text">{propertyTypeErrorText}</div>
                    </div>

                    <div class="announcement__form__item">
                        <label for="location">{t.offers.location}</label>
                        <input
                                bind:value={locationInput}
                                oninput={handleLocationInputChange}
                                name="location"
                                type="text"
                        />
                        <div class="error-text">{locationErrorText}</div>
                    </div>

                    <div class="announcement__form__item">
                        <label for="area">{t.offers.area}</label>
                        <input
                                bind:value={areaInput}
                                oninput={handleAreaInputChange}
                                name="area"
                                type="number"
                        />
                        <div class="error-text">{areaErrorText}</div>
                    </div>

                    <div class="announcement__form__item">
                        <label for="floors">{t.offers.floors}</label>
                        <input
                                bind:value={floorsInput}
                                oninput={handleFloorsInputChange}
                                name="floors"
                                type="number"
                        />
                        <div class="error-text">{floorsErrorText}</div>
                    </div>
                </div>

                <div class="announcement__form-right">
                    <div class="announcement__form__item">
                        <label for="rooms">{t.offers.rooms}</label>
                        <input
                                bind:value={roomsInput}
                                oninput={handleRoomsInputChange}
                                name="rooms"
                                type="number"
                        />
                        <div class="error-text">{roomsErrorText}</div>
                    </div>

                    <div class="announcement__form__item">
                        <label for="title">{t.offers.title}</label>
                        <input
                                bind:value={titleInput}
                                oninput={handleTitleInputChange}
                                name="title"
                                type="text"
                        />
                        <div class="error-text">{titleErrorText}</div>
                    </div>

                    <div class="announcement__form__item">
                        <label for="statementType">{t.offers.statementType}</label>
                        <div class="lookup-container">
                            <input
                                    bind:value={statementTypeSearch}
                                    oninput={handleStatementTypeSearch}
                                    onfocus={() => statementTypeDropdownOpen = true}
                                    name="statementType"
                                    type="text"
                                    placeholder={t.offers.searchStatementType}
                                    autocomplete="off"
                            />
                            {#if statementTypeDropdownOpen && filteredStatementTypes.length > 0}
                                <div class="lookup-dropdown">
                                    {#each filteredStatementTypes as type}
                                        <div
                                                class="lookup-item"
                                                role="button"
                                                tabindex="0"
                                                onclick={() => selectStatementType(type)}
                                                onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && selectStatementType(type)}
                                        >
                                            {type.name}
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                        <div class="error-text">{statementTypeErrorText}</div>
                    </div>

                    <div class="announcement__form__item">
                        <label for="price">{t.offers.price}</label>
                        <input
                                bind:value={priceInput}
                                oninput={handlePriceInputChange}
                                name="price"
                                type="number"
                        />
                        <div class="error-text">{priceErrorText}</div>
                    </div>
                </div>
            </div>

            <div class="announcement__form__item">
                <label for="content">{t.offers.content}</label>
                <textarea
                        bind:value={contentInput}
                        oninput={handleContentInputChange}
                        name="content"
                ></textarea>
                <div class="error-text">{contentErrorText}</div>
            </div>

            <div class="announcement__form__item">
                <label for="description">{t.offers.description}</label>
                <textarea
                        bind:value={descriptionInput}
                        oninput={handleDescriptionInputChange}
                        name="description"
                ></textarea>
                <div class="error-text">{descriptionErrorText}</div>
            </div>

            <div class="announcement__form__confirm">
                <button onclick={isUpdate ? updateClicked : confirmClicked}>{isUpdate ? t.offers.update : t.offers.create}</button>
            </div>
        </div>
    </div>
</div>

<style>
    .announcement__wrapper {
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .announcement__form__container {
        background-color: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        gap: 2rem;
        max-width: 800px;
        width: 100%;
    }

    .announcement__form__title {
        margin: 0 auto;
        color: #333;
        font-size: 2rem;
    }

    .announcement__form__sides {
        display: flex;
        gap: 2rem;
    }

    .announcement__form-left,
    .announcement__form-right {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .announcement__form__item {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .announcement__form label {
        font-weight: bold;
        color: #333;
    }

    .announcement__form input,
    .announcement__form textarea {
        padding: 0.6rem 0.8rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .announcement__form input:focus,
    .announcement__form textarea:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.3);
    }

    .announcement__form textarea {
        resize: vertical;
        min-height: 80px;
    }

    .error-text {
        min-height: 1.5em;
        font-size: 0.9em;
        color: #d32f2f;
    }

    .image-upload-container {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }

    .image-upload-button {
        padding: 0.6rem 0.8rem;
        font-size: 1rem;
        border: 2px dashed #ccc;
        border-radius: 6px;
        background-color: #f9f9f9;
        color: #666;
        cursor: pointer;
        transition: border-color 0.2s ease, background-color 0.2s ease;
        text-align: center;
    }

    .image-upload-button:hover {
        border-color: #7a42f4;
        background-color: #f0f0f0;
    }

    .lookup-container {
        position: relative;
    }

    .lookup-container input {
        width: 100%;
    }

    .lookup-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: white;
        border: 1px solid #ccc;
        border-top: none;
        border-radius: 0 0 6px 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
    }

    .lookup-item {
        padding: 0.6rem 0.8rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
        border-bottom: 1px solid #f0f0f0;
    }

    .lookup-item:last-child {
        border-bottom: none;
    }

    .lookup-item:hover {
        background-color: #f5f5f5;
    }

    .lookup-item:active {
        background-color: #7a42f4;
        color: white;
    }

    .announcement__form__confirm button {
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

    .announcement__form__confirm button:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .error-list > li {
        margin-bottom: 6px;
    }

    .error-list strong {
        color: #ef4444;
    }

    .error-list ul {
        margin: 4px 0 0 12px;
        padding: 0;
        list-style-type: disc;
    }

    .error-list ul li {
        font-size: 0.9rem;
        color: #f87171;
    }

    .previews-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .image-preview {
        position: relative;
        display: inline-block;
        max-width: 200px;
    }

    .image-preview img {
        width: 100% !important;
        height: 100% !important;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .image-preview:first-child {
        border: 2px solid orange;
    }

    .controls {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        justify-content: space-around;
        padding: 4px;
        opacity: 0;
        transition: opacity 0.2s;
    }

    .image-preview:hover .controls {
        opacity: 1;
    }

    .controls button {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.1rem;
    }

    .main-badge {
        position: absolute;
        top: 5px;
        left: 5px;
        background: var(--input-focus);
        color: white;
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: bold;
        text-transform: uppercase;
    }

    :global([data-theme="dark"]) .image-upload-button{
        background-color: #0f172a;
        border: 1px solid #334155;
        color: #f1f5f9;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .lookup-item:hover {
        background-color: rgba(122, 66, 244, 0.1);

    }

    :global([data-theme="dark"]) .lookup-dropdown {
        background-color: rgba(30, 41, 59, 0.9);
        backdrop-filter: blur(12px);
        border-color: var(--border-color);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }

    :global([data-theme="dark"]) .announcement__wrapper {
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .announcement__form__container {
        background: #1e293b;
        border: 1px solid #334155;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        padding: 2.5rem;
        border-radius: 20px;
    }

    :global([data-theme="dark"]) .announcement__form__title {
        color: #f8fafc;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    :global([data-theme="dark"]) label {
        color: #94a3b8;
        font-weight: 500;
    }

    :global([data-theme="dark"]) .announcement__form input {
        background-color: #0f172a;
        border: 1px solid #334155;
        color: #f1f5f9;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .announcement__form input:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 0 3px rgba(122, 66, 244, 0.2);
        outline: none;
    }

    :global([data-theme="dark"]) .announcement__form textarea {
        background-color: #0f172a;
        border: 1px solid #334155;
        color: #f1f5f9;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .announcement__form textarea:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 0 3px rgba(122, 66, 244, 0.2);
        outline: none;
    }

    :global([data-theme="dark"]) .announcement__form div[class*="ErrorText"] {
        color: #fb7185;
        font-size: 0.85rem;
        margin-top: 4px;
    }

    :global([data-theme="dark"]) .announcement__form__confirm button {
        background: linear-gradient(135deg, #7a42f4 0%, #6366f1 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(122, 66, 244, 0.3);
    }

    :global([data-theme="dark"]) .announcement__form__confirm button:hover {
        background: linear-gradient(135deg, #8b5cf6 0%, #7a42f4 100%);
        transform: translateY(-1px);
    }

    @media (max-width: 768px) {
        .announcement__form__sides {
            flex-direction: column;
            gap: 1rem;
        }

        .announcement__form__container {
            padding: 1rem;
            margin: 1rem;
        }

        .announcement__form__title {
            font-size: 1.5rem;
        }
    }
</style>