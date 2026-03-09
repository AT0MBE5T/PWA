export interface QuestionAnswer {
    questionId: string;
    answerId: string | null;
    createdAtQuestion: string;
    createdByQuestion: string;
    createdAtAnswer: string | null;
    createdByAnswer: string | null;
    textAnswer: string | null;
    textQuestion: string;
}