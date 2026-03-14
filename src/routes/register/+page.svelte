<script lang="ts">
    import { goto } from '$app/navigation';
    import { Modal, auth, toast, translations, settings } from '$lib';
    import { personalStore } from '$lib/stores/PersonalStore.svelte';

    const t = $derived(translations[settings.lang]);

    let loginInput = $state<string>('');
    let nameInput = $state<string>('');
    let surnameInput = $state<string>('');
    let emailInput = $state<string>('');
    let phoneNumberInput = $state<string>('');
    let ageInput = $state<string>('');
    let passwordInput = $state<string>('');
    let repeatPasswordInput = $state<string>('');

    let loginError = $state<boolean>(false);
    let nameError = $state<boolean>(false);
    let surnameError = $state<boolean>(false);
    let emailError = $state<boolean>(false);
    let phoneNumberError = $state<boolean>(false);
    let ageError = $state<boolean>(false);
    let passwordError = $state<boolean>(false);
    let repeatPasswordError = $state<boolean>(false);

    let loginErrorText = $derived<string>(loginError ? t.validation.loginLength : "");
    let nameErrorText = $derived<string>(nameError ? t.validation.nameLength : "");
    let surnameErrorText = $derived<string>(surnameError ? t.validation.surenameLength : "");
    let emailErrorText = $derived<string>(emailError ? t.validation.emailError : "");
    let phoneNumberErrorText = $derived<string>(phoneNumberError ? t.validation.phoneError : "");
    let ageErrorText = $derived<string>(ageError ? t.validation.ageBetween : "");
    let passwordErrorText = $derived<string>(passwordError ? t.validation.passwordError : "");
    let repeatPasswordErrorText = $derived<string>(repeatPasswordError ? t.validation.repeatPasswordError : "");

    let fileInput = $state<HTMLInputElement>();
    let selectedFileName = $state<string>('');
    let imagePreview = $state<string>('');
    let selectedFile = $state<File | null>(null);
    let imageError = $state<boolean>(false);
    let imageErrorText = $state<string>('');

    function handleFileChange(event: Event): void {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
            selectedFile = file;
            selectedFileName = file.name;

            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target?.result) {
                    imagePreview = e.target.result as string;
                }
            };
            reader.readAsDataURL(file);

            imageError = false;
            imageErrorText = '';
        }
    }

    function removeImage(): void {
        selectedFile = null;
        selectedFileName = '';
        imagePreview = '';
        if (fileInput) {
            fileInput.value = '';
        }
    }

    let { openLogin, successCallback }: { openLogin: (val: boolean) => void, successCallback: () => void } = $props();

    let show = $state<boolean>(false);

    let longText = $state<string>('');

    const switchModal = (isOpen: boolean) => {
        show = isOpen;
    }

    const validation = (): boolean => {

        if (!selectedFile && !imagePreview) {
            imageError = true;
            imageErrorText = t.validation.selectImage;
            return false;
        }

        if(loginInput.length < 3 || loginInput.length > 50){
            loginError = true;
            return false;
        }

        if(nameInput.length < 3 || nameInput.length > 50){
            nameError = true;
            return false;
        }

        if(surnameInput.length < 3 || surnameInput.length > 50){
            surnameError = true;
            return false;
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if(emailInput.length < 3 || emailInput.length > 255 || !emailRegex.test(emailInput)){
            emailError = true;
            return false;
        }

        if(phoneNumberInput.length !== 13 && phoneNumberInput[0] !== '+'){
            phoneNumberError = true;
            return false;
        }

        if(Number(ageInput) < 1 || Number(ageInput) > 130){
            ageError = true;
            return false;
        }

        const regex = /\d+/;

        if(passwordInput.length > 255 || !regex.test(passwordInput)){
            passwordError = true;
            return false;
        }

        if(repeatPasswordInput !== passwordInput){
            repeatPasswordError = true;
            return false;
        }

        return true;
    }

    const confirmClicked = () => {
        if(!validation()){
            return;
        }

        sendData(selectedFile as File, loginInput, nameInput, surnameInput, emailInput, phoneNumberInput, ageInput, passwordInput, repeatPasswordInput);
    }

    const toastError = () => {
        toast.show(t.system.errorOccurred, 'error');
    };

    const sendData = async (avatar: File, loginInput: string, nameInput: string, surnameInput: string, emailInput: string, phoneNumberInput: string, ageInput: string, passwordInput: string, repeatPasswordInput: string) => {
        const formData = new FormData();
        
        formData.append('Avatar', avatar); 
        formData.append('Login', loginInput);
        formData.append('Name', nameInput);
        formData.append('Surname', surnameInput);
        formData.append('Email', emailInput);
        formData.append('PhoneNumber', phoneNumberInput);
        formData.append('Age', ageInput);
        formData.append('Password', passwordInput);
        formData.append('RepeatPassword', repeatPasswordInput);

        try {
            const response = await fetch('http://localhost:5118/api/Account/register', {
                method: 'POST',
                credentials: "include",
                body: formData
            });

            if(response.ok){
                await personalStore.clearAllData();
                const res = await response.json() as { id: string, login: string, accessToken: string };
                auth.login(res.accessToken);
                successCallback();
                return;
            }
            else{
                errors = (await response.json()).errors;
                switchModal(true);
            }

        } catch (error) {
            longText = t.authorization.loginAlreadyExist
            switchModal(true);
        }
    };

    let errors = $state<Record<string, string[]>>({});

</script>

<div class="main__register register">
    <Modal bind:open={show} title={t.system.validationError} on:close={toastError}>
        {#if (longText.length === 0)}
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
        {:else}
            <p>{longText}</p>
        {/if}
    </Modal>
    <div class="register__form__container">
        <h1 class="register__form__title">{t.authorization.realEstate}</h1>

            <div class="register__form__avatar">
                <label for="image">{t.personal.image}</label>
                <div class="image-upload-container">
                    <input
                            bind:this={fileInput}
                            type="file"
                            accept="image/*"
                            onchange={handleFileChange}
                            style="display: none;"
                    />
                    <button
                            type="button"
                            class="image-upload-button"
                            onclick={() => fileInput?.click()}
                    >
                        {selectedFileName || t.authorization.chooseImage}
                    </button>
                    {#if imagePreview}
                        <div class="image-preview">
                            <img src={imagePreview} alt="Preview" />
                            <button
                                    type="button"
                                    class="remove-image"
                                    onclick={removeImage}
                            >
                                ✕
                            </button>
                        </div>
                    {/if}
                </div>
                <div class="error-text">{imageErrorText}</div>
            </div>

        <div class="register__form">

            <div class="register__form__login">
                <label for="login">{t.authorization.login}</label>
                <input bind:value={loginInput} oninput={() => {
                    loginError = false;
                }} name="login" type="text" />
                <div>{loginErrorText}</div>
            </div>

            <div class="register__form__name">
                <label for="name">{t.authorization.name}</label>
                <input bind:value={nameInput} oninput={() => {
                    nameError = false;
                }} name="name" type="text" />
                <div>{nameErrorText}</div>
            </div>

            <div class="register__form__surname">
                <label for="surname">{t.authorization.surname}</label>
                <input bind:value={surnameInput} oninput={() => {
                    surnameError = false;
                }} name="name" type="text" />
                <div>{surnameErrorText}</div>
            </div>

            <div class="register__form__email">
                <label for="email">{t.authorization.email}</label>
                <input bind:value={emailInput} oninput={() => {
                    emailError = false;
                }} name="email" type="email" />
                <div>{emailErrorText}</div>
            </div>
            <div class="register__form__phone">
                <label for="phone">{t.authorization.phoneNumber}</label>
                <input bind:value={phoneNumberInput} oninput={() => {
                    phoneNumberError = false;
                }} name="phone" type="text" />
                <div>{phoneNumberErrorText}</div>
            </div>

            <div class="register__form__age">
                <label for="age">{t.authorization.age}</label>
                <input bind:value={ageInput} oninput={() => {
                    ageError = false;
                }} name="age" type="number" />
                <div>{ageErrorText}</div>
            </div>

            <div class="register__form__password">
                <label for="password">{t.authorization.password}</label>
                <input bind:value={passwordInput} oninput={() => {
                    passwordError = false;
                }} name="password" type="password" />
                <div>{passwordErrorText}</div>
            </div>

            <div class="register__form__repeat-password">
                <label for="repeat-password">{t.authorization.repeatPassword}</label>
                <input bind:value={repeatPasswordInput} oninput={() => {
                    repeatPasswordError = false;
                }} name="repeat-password" type="password" />
                <div>{repeatPasswordErrorText}</div>
            </div>
        </div>

        <div class="register__form__confirm">
            <button onclick={confirmClicked}>{t.authorization.registerConfirmBtn}</button>
        </div>
        <div class="footer__register">
            <div class="register__form__login-form">{t.authorization.alreadyHaveAcc}</div>
            <button class="register__form__create-account-btn" onclick={() => goto('/login')}>{t.authorization.loginBtn}</button>
        </div>
    </div>
</div>

<style>
    .main__register {
        width: 100%;
        max-width: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .register__form__container{
        background-color: white;
        padding: 2rem;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .register__form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        column-gap: 2rem;
    }

    .register__form__title{
        font-size: 2rem;
        text-align: center;
    }

    .register__form__avatar,
    .register__form__login,
    .register__form__name,
    .register__form__surname,
    .register__form__email,
    .register__form__phone,
    .register__form__age,
    .register__form__password,
    .register__form__repeat-password {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    label {
        font-weight: bold;
        color: #333;
    }

    .register__form input {
        padding: 0.6rem 0.8rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .register__form input:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.3);
    }

    .register__form__login div,
    .register__form__password div,
    .register__form__repeat-password div,
    .register__form__name div,
    .register__form__surname div,
    .register__form__email div,
    .register__form__phone div,
    .register__form__age div {
        min-height: 1.5em;
        font-size: 0.9em;
        color: #d32f2f;
    }

    .register__form__confirm button {
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

    .register__form__confirm button:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .register__form__create-account-btn{
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

    .register__form__create-account-btn:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .footer__register{
        display: flex;
        gap: 1rem;
    }

    .register__form__login-form{
        align-content: center;
        width: 100%;
    }

    .error-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-left: 1rem;
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

    .error-text {
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

    .image-preview {
        position: relative;
        display: inline-block;
        max-width: 200px;
        margin: 0 auto;
    }

    .image-preview img {
        width: 100%;
        height: auto;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .remove-image {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 24px;
        height: 24px;
        border: none;
        border-radius: 50%;
        background-color: #d32f2f;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: background-color 0.2s ease;
    }

    .remove-image:hover {
        background-color: #b71c1c;
    }

    :global([data-theme="dark"]) .image-upload-button{
        background-color: #0f172a;
        border: 1px solid #334155;
        color: #f1f5f9;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .main__register {
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .register__form__container {
        background: #1e293b;
        border: 1px solid #334155;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        padding: 2.5rem;
        border-radius: 20px;
    }

    :global([data-theme="dark"]) .register__form__title {
        color: #f8fafc;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    :global([data-theme="dark"]) label {
        color: #94a3b8;
        font-weight: 500;
    }

    :global([data-theme="dark"]) .register__form input {
        background-color: #0f172a;
        border: 1px solid #334155;
        color: #f1f5f9;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .register__form input:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 0 3px rgba(122, 66, 244, 0.2);
        outline: none;
    }

    :global([data-theme="dark"]) .register__form__confirm button {
        background: linear-gradient(135deg, #7a42f4 0%, #6366f1 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(122, 66, 244, 0.3);
    }

    :global([data-theme="dark"]) .register__form__confirm button:hover {
        background: linear-gradient(135deg, #8b5cf6 0%, #7a42f4 100%);
        transform: translateY(-1px);
    }

    :global([data-theme="dark"]) .footer__register {
        border-top: 1px solid #334155;
        padding-top: 1.5rem;
        margin-top: 1.5rem;
    }

    :global([data-theme="dark"]) .register__form__login-form {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) .register__form__create-account-btn {
        color: #a78bfa;
        background: transparent;
        border: 1px solid #4c1d95;
    }

    :global([data-theme="dark"]) .register__form__create-account-btn:hover {
        background: rgba(122, 66, 244, 0.1);
        border-color: #7a42f4;
    }
    
    @media (max-width: 768px) {
        .register__form__container{
            width: 80%;
            margin: 2rem auto;
        }

        .register__form{
            grid-template-columns: 1fr;
        }
    }
    
</style>