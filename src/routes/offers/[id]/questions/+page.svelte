<script lang='ts'>
    import { format } from 'date-fns';
    import { auth, ConfirmModal, Roles, settings, translations } from '$lib';
    import createQuestionAnswerState from '$lib/stores/questionAnswerStore.svelte';
    import { untrack } from 'svelte';

    let { data } = $props();

    const questAnsState = createQuestionAnswerState();

    let questionAnswers = $derived(questAnsState.questionAnswerData);

    let confirmModal: ConfirmModal;


    $effect(() => {
        const currentId = data.id;

        untrack(() => {
            if (currentId) {
                questAnsState.setData(data.initialData);
                questAnsState.initSignalR(currentId, $auth.name!);
            }
        });

        return () => {
            untrack(() => {
                questAnsState.stopSignalR();
            });
        };
    });

    async function addQuestion() {
        if (!textInput.trim()) return;
        await questAnsState.sendQuestion(data.id, textInput);
        textInput = "";
    }

    async function addAnswer() {
        if (!textInput.trim()) return;
        await questAnsState.sendAnswer(data.id, currentQuestionId, textInput);
        textInput = "";
    }

    async function deleteAnswer(answerId: string | null) {
        const confirmed = await confirmModal.ask();

        if(!confirmed){
            return;
        }
        await questAnsState.deleteAnswer(data.id, answerId!);
    }

    async function deleteQuestion(questionId: string) {
        const confirmed = await confirmModal.ask();

        if(!confirmed){
            return;
        }
        await questAnsState.deleteQuestion(data.id, questionId);
    }

    const answerValidation = () => {
        return textInput.length <= 255;
    };

    const questionValidation = () => {
        return textInput.length <= 255;
    };

    let textInput = $state<string>('');

    let isAnswering = $state<boolean>(false);

    let currentQuestionId = $state<string>('');

    const switchToAnswer = (questionId: string) => {
        currentQuestionId = questionId;
        isAnswering = true;
    };

    const switchToCommentBack = () => {
        currentQuestionId = '';
        isAnswering = false;
    };

    const t = $derived(translations[settings.lang]);

</script>

<ConfirmModal bind:this={confirmModal} />

<div class="question_answer__block">
    <h2 class="question_answer">❓ {t.offers.questions}</h2>
    <div class="question__answer__container">
        {#each questionAnswers as i}
            <div class="question_answer__item">
                <div class="question_answer__item__question ">
                    ⌚ {format(i.createdAtQuestion, 'dd.MM.yyyy HH:mm')} | 🦰 {i.createdByQuestion}: {i.textQuestion}
                </div>
                {#if auth.hasRole(Roles.Admin)}
                    <div role="button"
                         tabindex="0"
                         class="question_answer__item__delete__question__button"
                         onclick={() => deleteQuestion(i.questionId)}
                         onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && deleteQuestion(i.questionId)}
                    >
                        ➖
                    </div>
                {/if}
                {#if i.createdAtAnswer !== null}
                    {#if auth.hasRole(Roles.Admin)}
                        <div   role="button"
                                tabindex="0"
                                class="question_answer__item__delete__answer__button"
                                onclick={() => deleteAnswer(i.answerId)}
                                onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && deleteAnswer(i.answerId)}
                        >
                            ➖
                        </div>
                    {/if}
                    <div class="question_answer__item__answer">
                        ⌚ {format(i.createdAtAnswer, 'dd.MM.yyyy HH:mm')} | 🦰 {i.createdByAnswer}: {i.textAnswer}
                    </div>
                {:else}
                    {#if auth.hasRole(Roles.Admin) || data.authorId === $auth.id}
                        <div
                                role="button"
                                tabindex="0"
                                class="question_answer__item__button"
                                onclick={() => isAnswering ? switchToCommentBack() : switchToAnswer(i.questionId)}
                                onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && isAnswering ? switchToCommentBack() : switchToAnswer(i.questionId)}>
                            ➕
                        </div>
                    {/if}
                {/if}
            </div>
        {/each}
    </div>
    {#if $auth.isAuthenticated}
        <div class="questions__block__interaction">
            <div class="question__interaction__area">
                <textarea
                    placeholder={isAnswering ? t.offers.typeAnswer : t.offers.typeQuestion}
                    bind:value={textInput}>
                </textarea>
            </div>
            <div class="question__block__confirm">
                <button onclick={isAnswering ? addAnswer : addQuestion}>{isAnswering ? t.offers.answerQuestion : t.offers.askQuestion}</button>
            </div>
            {#if isAnswering}
                <div class="question__block__confirm">
                    <button onclick={switchToCommentBack}>{t.offers.commentBack}</button>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .questions__block__interaction {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    textarea {
        padding: 0.6rem 0.8rem;
        font-size: 1rem;
        border: 1px solid #ccc;
        border-radius: 6px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    textarea:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.3);
    }

    .question__interaction__area{
        display: flex;
        flex-direction: column;
    }

    .question_answer__block {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 2rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #fff8e7 100%);
        border-radius: 16px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        width: 50%;
        margin: auto auto;
        height: 80vh;
    }

    .question__answer__container{
        display: flex;
        flex-direction: column;
        overflow-y: scroll;
    }

    .question_answer__item {
        position: relative;
        margin-bottom: 1rem;
        padding: 0.5rem;
        border-top: 1px solid rgba(122, 66, 244, 0.2);
    }

    .question_answer__item:first-child {
        border-top: 0;
    }

    .question_answer__item__question {
        position: relative;
        background: linear-gradient(135deg, #7a42f4 0%, #9c5dff 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        border-radius: 18px 18px 18px 4px;
        font-size: 1.1rem;
        line-height: 1.5;
        box-shadow: 0 4px 12px rgba(122, 66, 244, 0.3);
        transition: all 0.3s ease;
        margin-left: 0;
        margin-right: 3rem;
        overflow-wrap: break-word;
    }

    .question_answer__item__question::before {
        content: "❓";
        position: absolute;
        top: -8px;
        left: -8px;
        background: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        order: 1;
    }

    .question_answer__item__question:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(122, 66, 244, 0.4);
    }

    .question_answer__item__answer {
        position: relative;
        background: linear-gradient(135deg, #ff9900 0%, #ffb347 100%);
        color: white;
        padding: 1.25rem 1.5rem;
        border-radius: 18px 18px 4px 18px;
        font-size: 1.1rem;
        line-height: 1.5;
        box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3);
        transition: all 0.3s ease;
        margin-left: 3rem;
        margin-right: 0;
        margin-top: 0.5rem;
        overflow-wrap: break-word;
    }

    .question_answer__item__answer::before {
        content: "💡";
        position: absolute;
        top: -8px;
        right: -8px;
        background: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }

    .question_answer__item__answer:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(255, 153, 0, 0.4);
    }

    .question_answer__item__question:not(:first-child) {
        margin-top: 2rem;
        position: relative;
    }

    .question_answer__item__question:not(:first-child)::after {
        content: "";
        position: absolute;
        top: -1rem;
        left: 50%;
        transform: translateX(-50%);
        width: 60px;
        height: 2px;
        background: linear-gradient(90deg, transparent, #ddd, transparent);
    }

    .question_answer__item__button{
        position: absolute;
        bottom: 0;
        right: 0.5rem;
        width: fit-content;
        background: linear-gradient(135deg, #69d335 0%, #12e124 100%);
        color: white;
        padding: 0.5rem;
        border-radius: 100%;
        font-size: 1rem;
        box-shadow: 0 4px 12px rgba(122, 66, 244, 0.3);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .question_answer__item__button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(86, 230, 16, 0.4);
        cursor: pointer;
    }

    .question_answer__item__delete__question__button{
        position: absolute;
        top: 0;
        right: 0.5rem;

        width: fit-content;
        background: linear-gradient(135deg, #ec436a 0%, #e40a65 100%);
        color: white;
        padding: 0.5rem;
        font-size: 1rem;
        box-shadow: 0 4px 12px rgba(209, 18, 24, 0.3);
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .question_answer__item__delete__question__button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(223, 13, 30, 0.4);
        cursor: pointer;
    }

    .question_answer__item__delete__answer__button{
        position: absolute;
        top: 90%;
        transform: translateY(-50%);
        left: 0;
        height: fit-content;
        width: fit-content;
        background: linear-gradient(135deg, #ec436a 0%, #e40a65 100%);
        color: white;
        padding: 0.5rem;
        font-size: 1rem;
        box-shadow: 0 4px 12px rgba(209, 18, 24, 0.3);
        transition: all 0.3s ease;
        cursor: pointer;
        z-index: 1;
    }

    .question_answer__item__delete__answer__button:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(223, 13, 30, 0.4);
        cursor: pointer;
    }

    .question__block__confirm button {
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

    .question__block__confirm button:hover {
        background-color: #ff9900;
        transform: scale(1.03);
    }

    :global([data-theme="dark"]) .question_answer__block {
        background: #1e293b;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        color: #f1f5f9;
    }

    :global([data-theme="dark"]) .question_answer__block::before {
        color: #f1f5f9;
        border-bottom-color: rgba(122, 66, 244, 0.4);
    }

    :global([data-theme="dark"]) .question_answer__item::before {
        background: #1e293b;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }

    :global([data-theme="dark"]) textarea {
        background-color: #334155;
        border-color: #475569;
        color: white;
    }

    :global([data-theme="dark"]) textarea::placeholder {
        color: #94a3b8;
    }

    :global([data-theme="dark"]) textarea:focus {
        border-color: #7a42f4;
        box-shadow: 0 0 5px rgba(122, 66, 244, 0.5);
    }

    :global([data-theme="dark"]) .question__answer__container::-webkit-scrollbar-track {
        background: #1e293b;
    }

    :global([data-theme="dark"]) .question__answer__container::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #7a42f4 0%, #475569 100%);
    }

    :global([data-theme="dark"]) .question_answer__block:empty::before {
        color: #64748b;
    }

    @media (max-width: 768px) {
        .question_answer__block {
            padding: 1.5rem;
            gap: 1rem;
            width: 75%;
        }

        .question_answer__block::before {
            font-size: 1.3rem;
        }

        .question_answer__item__delete__answer__button{
            bottom: 50%;
            font-size: .5rem;
        }

        .question_answer__item__delete__question__button{
            font-size: .5rem;
        }

        .question_answer__item__button{
            font-size: .5rem;
        }

        .question_answer__item__question,
        .question_answer__item__answer {
            margin-left: 0;
            margin-right: 0;
            padding: 1rem;
            font-size: 1rem;
        }

        .question_answer__item__question {
            border-radius: 16px 16px 16px 4px;
        }

        .question_answer__item__answer {
            border-radius: 16px 16px 4px 16px;
            margin-top: 0.75rem;
        }

        .question_answer__item__question::before,
        .question_answer__item__answer::before {
            width: 28px;
            height: 28px;
            font-size: 1rem;
        }
    }

    @media (max-width: 480px) {
        .question_answer__block {
            padding: 1rem;
            border-radius: 12px;
        }

        .question_answer__item__question,
        .question_answer__item__answer {
            padding: 0.875rem;
            font-size: 0.95rem;
        }

        .question_answer__block::before {
            font-size: 1.2rem;
        }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .question__answer__container {
        animation: fadeInUp 0.5s ease-out;
    }

    .question_answer__block:empty::before {
        content: "📭 There're not any questions";
        color: #999;
        font-style: italic;
        border: none;
        text-align: center;
    }

    ::-webkit-scrollbar {
        width: 6px;
    }

    ::-webkit-scrollbar-track {
        background: #fff8e7;
        border-radius: 12px;
    }

    ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #7a42f4 0%, #ff9900 100%);
        background-size: 300% 300%;
        border-radius: 12px;
        animation: gradientShift 3s ease infinite;
    }

    @keyframes gradientShift {
        0% { background-position: 0 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0 50%; }
    }
</style>