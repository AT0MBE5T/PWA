<script lang="ts">
    import { goto } from '$app/navigation';
    import { env } from '$env/dynamic/public';
    import { Modal, auth, settings, toast, translations } from '$lib';
    import { personalStore } from '$lib/stores/PersonalStore.svelte';

    const t = $derived(translations[settings.lang]);

    let loginInput = $state<string>('');
    let passwordInput = $state<string>('');

    let loginError = $state<boolean>(false);
    let passwordError = $state<boolean>(false);

    let loginErrorText = $derived<string>(loginError ? t.validation.loginError : '');
    let passwordErrorText = $derived<string>(passwordError ? t.validation.passwordError : '');

    const validation = (): boolean => {
        if(loginInput.length < 4){
            loginError = true;
            return false;
        }

        else if(passwordInput.length < 6){
            passwordError = true;
            return false;
        }

        return true;
    }

    const confirmClicked = async () => {
        if(!validation()){
            return;
        }

        settings.isLoading = true;
        await sendData(loginInput, passwordInput);
        settings.isLoading = false;
    }

    const sendData = async (login: string, password: string) => {
        const jsonData = JSON.stringify({
            login,
            password
        });

        try {
            const response = await fetch(`${env.PUBLIC_API_URL}/api/Account/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "include",
                body: jsonData
            });

            switch(response.status){
                case 200:
                    await personalStore.clearAllData();
                    const res = await response.json() as { id: string, login: string, accessToken: string };
                    auth.login(res.accessToken);
                    toast.show(t.system.success, 'success');
                    break;
                case 401:
                    longText = t.validation.passwordError;
                    switchModal(true);
                    break;
                case 404:
                    longText = t.validation.loginNotExist;
                    switchModal(true);
                    break;
                default:
                    toastError();
                    break;
            }

        } catch (error) {
            longText = t.system.dbError;
            switchModal(true);
        }
    };

    let show = $state<boolean>(false);
    let longText = $state<string>('');
    const switchModal = (isOpen: boolean) => {
        show = isOpen;
    };

    const toastError = () => {
        toast.show(t.system.errorOccurred, 'error');
    };

</script>

<div class="main__login login">
    <Modal
            bind:open={show}
            title={t.authorization.loginError}
            description={t.authorization.checkFields}
            on:close={toastError}
    >
        <p>{longText}</p>

        <svelte:fragment slot="footer">
            <button class="btn" onclick={() => {
                switchModal(false);
                toastError();
            }}>{t.offers.ok}</button>
        </svelte:fragment>
    </Modal>
    <div class="login__form-container">
        <h1 class="login__form__title">{t.authorization.realEstate}</h1>
        <div class="login__form">
            <div class="login__form__login">
                <label for="login">{t.authorization.login}</label>
                <input bind:value={loginInput} oninput={() => {
                loginError = false;
            }} name="login" type="text" />
                <div>{loginErrorText}</div>
            </div>
            <div class="login__form__password">
                <label for="password">{t.authorization.password}</label>
                <input bind:value={passwordInput} oninput={() => {
                passwordError = false;
            }} name="password" type="password" />
                <div>{passwordErrorText}</div>
            </div>
            <div class="login__form__confirm">
                <button onclick={confirmClicked}>{t.authorization.loginConfirmBtn}</button>
            </div>
        </div>
        <div class="footer__login">
            <div class="login__form__create-account">{t.authorization.dontHaveAcc}</div>
            <button class="login__form__create-account-btn" onclick={() => goto('/register')}>{t.authorization.registerBtn}</button>
        </div>

    </div>
</div>

<style>
    .main__login {
        width: 100%;
        max-width: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .login__form-container{
        background-color: white;
        padding: 2.5rem;
        border-radius: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .login__form__title{
        font-size: 2rem;
        text-align: center;
    }

    .login__form__login,
    .login__form__password {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }

    .login__form label {
        font-weight: bold;
        color: #333;
    }

    .login__form input {
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        padding: 0.75rem;
    }

    .login__form input:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.3);
    }

    .login__form__login div,
    .login__form__password div {
        min-height: 1.5em;
        font-size: 0.9rem;
        color: #d32f2f;
    }

    .login__form__confirm button {
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

    .login__form__confirm button:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .login__form__create-account-btn{
        padding: 0.8rem;
        background-color: #7a42f4;
        color: white;
        font-size: 1rem;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 0.3s ease, transform 0.2s ease;
        width: 90%;
    }

    .login__form__create-account-btn:hover{
        background-color: #ff9900;
        transform: scale(1.03);
    }

    .footer__login{
        display: flex;
        gap: 1rem;
    }

    .login__form__create-account{
        align-content: center;
        width: 100%;
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

    :global([data-theme="dark"]) .main__login {
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .login__form-container {
        background: #1e293b;
        border: 1px solid #334155;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        padding: 2.5rem;
        border-radius: 20px;
    }

    :global([data-theme="dark"]) .login__form__title {
        color: #f8fafc;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    :global([data-theme="dark"]) .login__form label {
        color: #94a3b8;
        font-weight: 500;
    }

    :global([data-theme="dark"]) p {
        color: #94a3b8;
        font-weight: 500;
    }

    :global([data-theme="dark"]) .login__form input {
        background-color: #0f172a;
        border: 1px solid #334155;
        color: #f1f5f9;
        padding: 0.75rem;
        border-radius: 8px;
        transition: all 0.2s ease;
    }

    :global([data-theme="dark"]) .login__form input:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 0 3px rgba(122, 66, 244, 0.2);
        outline: none;
    }

    :global([data-theme="dark"]) .login__form div[class*="ErrorText"] {
        color: #fb7185;
        font-size: 0.85rem;
        margin-top: 4px;
    }

    :global([data-theme="dark"]) .login__form__confirm button {
        background: linear-gradient(135deg, #7a42f4 0%, #6366f1 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(122, 66, 244, 0.3);
    }

    :global([data-theme="dark"]) .login__form__confirm button:hover {
        background: linear-gradient(135deg, #8b5cf6 0%, #7a42f4 100%);
        transform: translateY(-1px);
    }

    :global([data-theme="dark"]) .footer__login {
        border-top: 1px solid #334155;
        padding-top: 1.5rem;
    }

    :global([data-theme="dark"]) .login__form__create-account-btn {
        color: #a78bfa;
        background: transparent;
        border: 1px solid #4c1d95;
    }

    :global([data-theme="dark"]) .login__form__create-account-btn:hover {
        background: rgba(122, 66, 244, 0.1);
        border-color: #7a42f4;
    }
</style>