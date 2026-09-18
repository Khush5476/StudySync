/* =========================================================
   ELEMENTS
   ========================================================= */

const pdfFile =
    document.getElementById("pdfFile");

const fileBox =
    document.getElementById("fileBox");

const fileText =
    document.getElementById("fileText");

const generateButton =
    document.getElementById("generateButton");

const loading =
    document.getElementById("loading");

const status =
    document.getElementById("status");


/* MODE BUTTONS */

const modeSection =
    document.getElementById("modeSection");

const notesModeButton =
    document.getElementById("notesModeButton");

const flashcardModeButton =
    document.getElementById("flashcardModeButton");

const quizModeButton =
    document.getElementById("quizModeButton");

const studyAiModeButton =
    document.getElementById("studyAiModeButton");


/* NOTES */

const notesSection =
    document.getElementById("notesSection");

const notes =
    document.getElementById("notes");

const copyButton =
    document.getElementById("copyButton");


/* FLASHCARDS */

const flashcardSection =
    document.getElementById("flashcardSection");

const flashcardProgress =
    document.getElementById("flashcardProgress");

const scoreElement =
    document.getElementById("score");

const questionCard =
    document.getElementById("questionCard");

const roundLabel =
    document.getElementById("roundLabel");

const questionText =
    document.getElementById("questionText");

const answers =
    document.getElementById("answers");

const feedback =
    document.getElementById("feedback");

const feedbackTitle =
    document.getElementById("feedbackTitle");

const feedbackText =
    document.getElementById("feedbackText");

const nextQuestionButton =
    document.getElementById(
        "nextQuestionButton"
    );


/* QUIZ */

const quizSection =
    document.getElementById("quizSection");

const quizProgress =
    document.getElementById("quizProgress");

const quizScoreNumber =
    document.getElementById(
        "quizScoreNumber"
    );

const quizQuestion =
    document.getElementById("quizQuestion");

const quizAnswers =
    document.getElementById("quizAnswers");

const quizFeedback =
    document.getElementById("quizFeedback");

const quizFeedbackTitle =
    document.getElementById(
        "quizFeedbackTitle"
    );

const quizFeedbackText =
    document.getElementById(
        "quizFeedbackText"
    );

const quizNextButton =
    document.getElementById(
        "quizNextButton"
    );


/* STUDY AI */

const studyAiSection =
    document.getElementById(
        "studyAiSection"
    );

const studyAiForm =
    document.getElementById(
        "studyAiForm"
    );

const studyAiInput =
    document.getElementById(
        "studyAiInput"
    );

const studyAiButton =
    document.getElementById(
        "studyAiButton"
    );

const chatMessages =
    document.getElementById(
        "chatMessages"
    );


/* COMPLETE */

const completeSection =
    document.getElementById(
        "completeSection"
    );

const finalScore =
    document.getElementById(
        "finalScore"
    );

const restartButton =
    document.getElementById(
        "restartButton"
    );


/* =========================================================
   VARIABLES
   ========================================================= */

let generatedNotes = "";


/* FLASHCARD VARIABLES */

let allQuestions = [];

let currentRoundQuestions = [];

let wrongQuestions = [];

let currentQuestionIndex = 0;

let score = 0;

let currentRound = 1;

let questionAnswered = false;


/* QUIZ VARIABLES */

let quizQuestions = [];

let quizIndex = 0;

let quizScore = 0;

let quizAnswered = false;


/* =========================================================
   FILE HANDLING
   ========================================================= */

pdfFile.addEventListener(
    "change",
    function () {

        if (!pdfFile.files.length) {
            return;
        }

        handleFile(
            pdfFile.files[0]
        );
    }
);


function handleFile(file) {

    status.textContent = "";

    if (
        file.type !== "application/pdf" &&
        !file.name
            .toLowerCase()
            .endsWith(".pdf")
    ) {

        status.textContent =
            "Please choose a PDF file.";

        return;
    }

    const maxSize =
        20 * 1024 * 1024;

    if (file.size > maxSize) {

        status.textContent =
            "The PDF is too large. Maximum size is 20 MB.";

        return;
    }

    fileText.textContent =
        file.name;

    fileBox.classList.add(
        "selected"
    );
}


/* =========================================================
   DRAG AND DROP
   ========================================================= */

fileBox.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        fileBox.classList.add(
            "dragover"
        );
    }
);


fileBox.addEventListener(
    "dragleave",
    function () {

        fileBox.classList.remove(
            "dragover"
        );
    }
);


fileBox.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        fileBox.classList.remove(
            "dragover"
        );

        const files =
            event.dataTransfer.files;

        if (!files.length) {
            return;
        }

        const file =
            files[0];

        const dataTransfer =
            new DataTransfer();

        dataTransfer.items.add(
            file
        );

        pdfFile.files =
            dataTransfer.files;

        handleFile(file);
    }
);


/* =========================================================
   GENERATE NOTES
   ========================================================= */

generateButton.addEventListener(
    "click",
    async function () {

        status.textContent = "";

        if (!pdfFile.files.length) {

            status.textContent =
                "Please choose a PDF first.";

            return;
        }

        const file =
            pdfFile.files[0];

        if (
            file.size >
            20 * 1024 * 1024
        ) {

            status.textContent =
                "The PDF is too large. Maximum size is 20 MB.";

            return;
        }

        generateButton.disabled =
            true;

        generateButton.style.opacity =
            "0.65";

        loading.classList.remove(
            "hidden"
        );

        modeSection.classList.add(
            "hidden"
        );

        notesSection.classList.add(
            "hidden"
        );

        flashcardSection.classList.add(
            "hidden"
        );

        quizSection.classList.add(
            "hidden"
        );

        studyAiSection.classList.add(
            "hidden"
        );

        completeSection.classList.add(
            "hidden"
        );

        const formData =
            new FormData();

        formData.append(
            "pdf",
            file
        );

        try {

            const response =
                await fetch(
                    "/generate-notes",
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Failed to generate notes."
                );
            }

            generatedNotes =
                data.notes;

            notes.innerHTML =
                convertMarkdownToHTML(
                    generatedNotes
                );

            if (window.MathJax) {

                await MathJax.typesetPromise([
                    notes
                ]);
            }

            /* RESET OLD STUDY MATERIALS */

            allQuestions = [];

            quizQuestions = [];

            wrongQuestions = [];

            /* SHOW MODES */

            modeSection.classList.remove(
                "hidden"
            );

            showNotes();

            modeSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        } catch (error) {

            console.error(error);

            status.textContent =
                error.message ||
                "Something went wrong.";

        } finally {

            loading.classList.add(
                "hidden"
            );

            generateButton.disabled =
                false;

            generateButton.style.opacity =
                "1";
        }
    }
);


/* =========================================================
   SHOW NOTES
   ========================================================= */

notesModeButton.addEventListener(
    "click",
    showNotes
);


function showNotes() {

    notesModeButton.classList.add(
        "active"
    );

    flashcardModeButton.classList.remove(
        "active"
    );

    quizModeButton.classList.remove(
        "active"
    );

    studyAiModeButton.classList.remove(
        "active"
    );

    notesSection.classList.remove(
        "hidden"
    );

    flashcardSection.classList.add(
        "hidden"
    );

    quizSection.classList.add(
        "hidden"
    );

    studyAiSection.classList.add(
        "hidden"
    );

    completeSection.classList.add(
        "hidden"
    );

    notesSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   FLASHCARD MODE
   ========================================================= */

flashcardModeButton.addEventListener(
    "click",
    async function () {

        if (allQuestions.length > 0) {

            startFlashcards();

            return;
        }

        await generateFlashcards();
    }
);


async function generateFlashcards() {

    if (!generatedNotes) {

        status.textContent =
            "Study notes have not been generated yet.";

        return;
    }

    flashcardModeButton.disabled =
        true;

    flashcardModeButton.style.opacity =
        "0.6";

    flashcardSection.classList.remove(
        "hidden"
    );

    questionText.textContent =
        "AI is creating your flashcards...";

    answers.innerHTML = "";

    feedback.classList.add(
        "hidden"
    );

    flashcardSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    try {

        const response =
            await fetch(
                "/generate-flashcards",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        notes:
                            generatedNotes
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to generate flashcards."
            );
        }

        allQuestions =
            data.questions;

        startFlashcards();

    } catch (error) {

        console.error(error);

        questionText.textContent =
            "Could not create flashcards.";

        status.textContent =
            error.message ||
            "Something went wrong.";

    } finally {

        flashcardModeButton.disabled =
            false;

        flashcardModeButton.style.opacity =
            "1";
    }
}


/* =========================================================
   START FLASHCARDS
   ========================================================= */

function startFlashcards() {

    currentRound = 1;

    currentQuestionIndex = 0;

    score = 0;

    wrongQuestions = [];

    currentRoundQuestions =
        [...allQuestions];

    scoreElement.textContent =
        score;

    completeSection.classList.add(
        "hidden"
    );

    notesSection.classList.add(
        "hidden"
    );

    quizSection.classList.add(
        "hidden"
    );

    studyAiSection.classList.add(
        "hidden"
    );

    flashcardSection.classList.remove(
        "hidden"
    );

    flashcardModeButton.classList.add(
        "active"
    );

    notesModeButton.classList.remove(
        "active"
    );

    quizModeButton.classList.remove(
        "active"
    );

    studyAiModeButton.classList.remove(
        "active"
    );

    showQuestion();

    flashcardSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   SHOW FLASHCARD
   ========================================================= */

function showQuestion() {

    questionAnswered = false;

    if (
        currentQuestionIndex >=
        currentRoundQuestions.length
    ) {

        finishRound();

        return;
    }

    const question =
        currentRoundQuestions[
            currentQuestionIndex
        ];

    flashcardProgress.textContent =
        `Question ${
            currentQuestionIndex + 1
        } of ${
            currentRoundQuestions.length
        }`;

    if (currentRound === 1) {

        roundLabel.textContent =
            "ROUND 1";

    } else {

        roundLabel.textContent =
            `RETRY ROUND ${currentRound}`;
    }

    questionText.innerHTML =
        convertMarkdownToHTML(
            question.question
        );

    answers.innerHTML = "";

    question.options.forEach(
        function (option, index) {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "answer-button";

            button.innerHTML =
                convertMarkdownToHTML(
                    option
                );

            button.addEventListener(
                "click",
                function () {

                    selectAnswer(
                        index
                    );
                }
            );

            answers.appendChild(
                button
            );
        }
    );

    feedback.classList.add(
        "hidden"
    );

    questionCard.classList.remove(
        "correct-animation",
        "wrong-animation"
    );

    if (window.MathJax) {

        MathJax.typesetPromise([
            questionText,
            answers
        ]);
    }
}


/* =========================================================
   SELECT FLASHCARD ANSWER
   ========================================================= */

function selectAnswer(
    selectedIndex
) {

    if (questionAnswered) {
        return;
    }

    questionAnswered = true;

    const question =
        currentRoundQuestions[
            currentQuestionIndex
        ];

    const buttons =
        answers.querySelectorAll(
            ".answer-button"
        );

    buttons.forEach(
        button => {
            button.disabled = true;
        }
    );

    const correctButton =
        buttons[
            question.correctAnswer
        ];

    if (
        selectedIndex ===
        question.correctAnswer
    ) {

        correctButton.classList.add(
            "correct"
        );

        score++;

        scoreElement.textContent =
            score;

        questionCard.classList.add(
            "correct-animation"
        );

        feedbackTitle.textContent =
            "✓ Correct!";

        feedbackTitle.style.color =
            "#73e99f";

        feedbackText.textContent =
            question.explanation;

    } else {

        buttons[
            selectedIndex
        ].classList.add(
            "wrong"
        );

        correctButton.classList.add(
            "correct"
        );

        if (
            !wrongQuestions.includes(
                question
            )
        ) {

            wrongQuestions.push(
                question
            );
        }

        questionCard.classList.add(
            "wrong-animation"
        );

        feedbackTitle.textContent =
            "✕ Not quite";

        feedbackTitle.style.color =
            "#ff8585";

        feedbackText.innerHTML =
            `<strong>Correct answer:</strong>
            ${escapeHTML(
                question.options[
                    question.correctAnswer
                ]
            )}
            <br><br>
            ${escapeHTML(
                question.explanation
            )}`;
    }

    feedback.classList.remove(
        "hidden"
    );

    if (
        currentQuestionIndex ===
        currentRoundQuestions.length - 1
    ) {

        if (
            wrongQuestions.length > 0
        ) {

            nextQuestionButton.innerHTML =
                "Continue →";

        } else {

            nextQuestionButton.innerHTML =
                "Finish →";
        }

    } else {

        nextQuestionButton.innerHTML =
            "Next Question →";
    }
}


/* =========================================================
   NEXT FLASHCARD
   ========================================================= */

nextQuestionButton.addEventListener(
    "click",
    function () {

        if (!questionAnswered) {
            return;
        }

        currentQuestionIndex++;

        if (
            currentQuestionIndex >=
            currentRoundQuestions.length
        ) {

            finishRound();

        } else {

            showQuestion();
        }
    }
);


/* =========================================================
   FINISH FLASHCARD ROUND
   ========================================================= */

function finishRound() {

    if (
        wrongQuestions.length > 0
    ) {

        currentRound++;

        currentRoundQuestions =
            [...wrongQuestions];

        wrongQuestions = [];

        currentQuestionIndex = 0;

        setTimeout(
            function () {
                showQuestion();
            },
            350
        );

        return;
    }

    finishFlashcards();
}


/* =========================================================
   FINISH FLASHCARDS
   ========================================================= */

function finishFlashcards() {

    flashcardSection.classList.add(
        "hidden"
    );

    completeSection.classList.remove(
        "hidden"
    );

    finalScore.textContent =
        `${score} / ${allQuestions.length}`;

    completeSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   AI QUIZ
   ========================================================= */

quizModeButton.addEventListener(
    "click",
    async function () {

        if (quizQuestions.length > 0) {

            startQuiz();

            return;
        }

        await generateQuiz();
    }
);


async function generateQuiz() {

    if (!generatedNotes) {

        status.textContent =
            "Study notes have not been generated yet.";

        return;
    }

    quizModeButton.disabled =
        true;

    quizModeButton.style.opacity =
        "0.6";

    quizSection.classList.remove(
        "hidden"
    );

    quizQuestion.textContent =
        "AI is creating your quiz...";

    quizAnswers.innerHTML = "";

    quizFeedback.classList.add(
        "hidden"
    );

    quizSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    try {

        const response =
            await fetch(
                "/generate-quiz",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        notes:
                            generatedNotes
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to generate quiz."
            );
        }

        quizQuestions =
            data.questions;

        startQuiz();

    } catch (error) {

        console.error(error);

        quizQuestion.textContent =
            "Could not create quiz.";

        status.textContent =
            error.message ||
            "Something went wrong.";

    } finally {

        quizModeButton.disabled =
            false;

        quizModeButton.style.opacity =
            "1";
    }
}


/* =========================================================
   START QUIZ
   ========================================================= */

function startQuiz() {

    quizIndex = 0;

    quizScore = 0;

    quizAnswered = false;

    quizScoreNumber.textContent =
        "0";

    quizSection.classList.remove(
        "hidden"
    );

    notesSection.classList.add(
        "hidden"
    );

    flashcardSection.classList.add(
        "hidden"
    );

    studyAiSection.classList.add(
        "hidden"
    );

    completeSection.classList.add(
        "hidden"
    );

    quizModeButton.classList.add(
        "active"
    );

    notesModeButton.classList.remove(
        "active"
    );

    flashcardModeButton.classList.remove(
        "active"
    );

    studyAiModeButton.classList.remove(
        "active"
    );

    showQuizQuestion();

    quizSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   SHOW QUIZ QUESTION
   ========================================================= */

function showQuizQuestion() {

    quizAnswered = false;

    const question =
        quizQuestions[
            quizIndex
        ];

    if (!question) {

        finishQuizMode();

        return;
    }

    quizProgress.textContent =
        `Question ${
            quizIndex + 1
        } of ${
            quizQuestions.length
        }`;

    quizQuestion.innerHTML =
        convertMarkdownToHTML(
            question.question
        );

    quizAnswers.innerHTML = "";

    question.options.forEach(
        function (option, index) {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "answer-button";

            button.innerHTML =
                convertMarkdownToHTML(
                    option
                );

            button.addEventListener(
                "click",
                function () {

                    answerQuiz(
                        index
                    );
                }
            );

            quizAnswers.appendChild(
                button
            );
        }
    );

    quizFeedback.classList.add(
        "hidden"
    );

    if (window.MathJax) {

        MathJax.typesetPromise([
            quizQuestion,
            quizAnswers
        ]);
    }
}


/* =========================================================
   ANSWER QUIZ
   ========================================================= */

function answerQuiz(
    selectedIndex
) {

    if (quizAnswered) {
        return;
    }

    quizAnswered = true;

    const question =
        quizQuestions[
            quizIndex
        ];

    const buttons =
        quizAnswers.querySelectorAll(
            ".answer-button"
        );

    buttons.forEach(
        button => {
            button.disabled = true;
        }
    );

    const correctButton =
        buttons[
            question.correctAnswer
        ];

    if (
        selectedIndex ===
        question.correctAnswer
    ) {

        quizScore++;

        quizScoreNumber.textContent =
            quizScore;

        correctButton.classList.add(
            "correct"
        );

        quizFeedbackTitle.textContent =
            "✓ Correct!";

        quizFeedbackTitle.style.color =
            "#73e99f";

    } else {

        buttons[
            selectedIndex
        ].classList.add(
            "wrong"
        );

        correctButton.classList.add(
            "correct"
        );

        quizFeedbackTitle.textContent =
            "✕ Not quite";

        quizFeedbackTitle.style.color =
            "#ff8585";
    }

    quizFeedbackText.innerHTML =
        convertMarkdownToHTML(
            question.explanation
        );

    quizFeedback.classList.remove(
        "hidden"
    );

    if (
        quizIndex ===
        quizQuestions.length - 1
    ) {

        quizNextButton.textContent =
            "Finish Quiz →";

    } else {

        quizNextButton.textContent =
            "Next Question →";
    }

    if (window.MathJax) {

        MathJax.typesetPromise([
            quizFeedbackText
        ]);
    }
}


/* =========================================================
   NEXT QUIZ QUESTION
   ========================================================= */

quizNextButton.addEventListener(
    "click",
    function () {

        if (!quizAnswered) {
            return;
        }

        quizIndex++;

        showQuizQuestion();
    }
);


/* =========================================================
   FINISH QUIZ
   ========================================================= */

function finishQuizMode() {

    quizSection.classList.add(
        "hidden"
    );

    completeSection.classList.remove(
        "hidden"
    );

    finalScore.textContent =
        `${quizScore} / ${quizQuestions.length}`;

    completeSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


/* =========================================================
   STUDY AI
   ========================================================= */

studyAiModeButton.addEventListener(
    "click",
    function () {

        if (!generatedNotes) {

            status.textContent =
                "Study notes have not been generated yet.";

            return;
        }

        notesSection.classList.add(
            "hidden"
        );

        flashcardSection.classList.add(
            "hidden"
        );

        quizSection.classList.add(
            "hidden"
        );

        completeSection.classList.add(
            "hidden"
        );

        studyAiSection.classList.remove(
            "hidden"
        );

        notesModeButton.classList.remove(
            "active"
        );

        flashcardModeButton.classList.remove(
            "active"
        );

        quizModeButton.classList.remove(
            "active"
        );

        studyAiModeButton.classList.add(
            "active"
        );

        studyAiSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        studyAiInput.focus();
    }
);


/* =========================================================
   STUDY AI CHAT
   ========================================================= */

studyAiForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const question =
            studyAiInput.value.trim();

        if (!question) {
            return;
        }

        addUserMessage(
            question
        );

        studyAiInput.value = "";

        studyAiButton.disabled =
            true;

        studyAiButton.textContent =
            "Thinking...";

        const loadingMessage =
            addAiMessage(
                "Thinking about your question..."
            );

        try {

            const response =
                await fetch(
                    "/study-ai",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            notes:
                                generatedNotes,

                            question:
                                question
                        })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Study AI failed."
                );
            }

            loadingMessage.innerHTML =
                convertMarkdownToHTML(
                    data.answer
                );

            if (window.MathJax) {

                await MathJax.typesetPromise([
                    loadingMessage
                ]);
            }

            chatMessages.scrollTop =
                chatMessages.scrollHeight;

        } catch (error) {

            console.error(error);

            loadingMessage.textContent =
                error.message ||
                "Sorry, something went wrong.";
        }

        studyAiButton.disabled =
            false;

        studyAiButton.textContent =
            "Ask AI →";
    }
);


/* =========================================================
   ADD USER MESSAGE
   ========================================================= */

function addUserMessage(
    message
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "user-message";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "user-bubble";

    bubble.textContent =
        message;

    wrapper.appendChild(
        bubble
    );

    chatMessages.appendChild(
        wrapper
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* =========================================================
   ADD AI MESSAGE
   ========================================================= */

function addAiMessage(
    message
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "ai-message";

    const avatar =
        document.createElement(
            "div"
        );

    avatar.className =
        "chat-avatar";

    avatar.textContent =
        "AI";

    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "chat-bubble";

    bubble.textContent =
        message;

    wrapper.appendChild(
        avatar
    );

    wrapper.appendChild(
        bubble
    );

    chatMessages.appendChild(
        wrapper
    );

    chatMessages.scrollTop =
        chatMessages.scrollHeight;

    return bubble;
}


/* =========================================================
   COPY NOTES
   ========================================================= */

copyButton.addEventListener(
    "click",
    async function () {

        try {

            await navigator.clipboard.writeText(
                generatedNotes
            );

            const originalText =
                copyButton.innerHTML;

            copyButton.innerHTML =
                "✓ Copied";

            setTimeout(
                function () {

                    copyButton.innerHTML =
                        originalText;

                },
                1500
            );

        } catch (error) {

            console.error(error);
        }
    }
);


/* =========================================================
   RESTART
   ========================================================= */

restartButton.addEventListener(
    "click",
    function () {

        if (
            quizQuestions.length > 0
        ) {

            startQuiz();

        } else if (
            allQuestions.length > 0
        ) {

            startFlashcards();
        }
    }
);


/* =========================================================
   MARKDOWN → HTML
   ========================================================= */

function convertMarkdownToHTML(
    markdown
) {

    if (!markdown) {
        return "";
    }

    let text =
        escapeHTML(markdown);

    const mathBlocks = [];


    /* DISPLAY MATH */

    text = text.replace(
        /\$\$([\s\S]*?)\$\$/g,
        function (match) {

            const id =
                `___MATH_BLOCK_${mathBlocks.length}___`;

            mathBlocks.push(match);

            return id;
        }
    );


    /* INLINE MATH */

    text = text.replace(
        /(?<!\$)\$([^$\n]+)\$(?!\$)/g,
        function (match) {

            const id =
                `___MATH_BLOCK_${mathBlocks.length}___`;

            mathBlocks.push(match);

            return id;
        }
    );


    /* HEADINGS */

    text = text.replace(
        /^### (.*)$/gm,
        "<h3>$1</h3>"
    );

    text = text.replace(
        /^## (.*)$/gm,
        "<h2>$1</h2>"
    );

    text = text.replace(
        /^# (.*)$/gm,
        "<h1>$1</h1>"
    );


    /* BOLD */

    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    /* BULLETS */

    text = text.replace(
        /^\s*[-*] (.*)$/gm,
        "<li>$1</li>"
    );


    text = text.replace(
        /(<li>.*<\/li>\n?)+/g,
        function (match) {

            return `<ul>${match}</ul>`;
        }
    );


    /* PARAGRAPHS */

    const lines =
        text.split(/\n{2,}/);

    text =
        lines
            .map(
                block => {

                    block =
                        block.trim();

                    if (!block) {
                        return "";
                    }

                    if (
                        block.startsWith(
                            "<h1>"
                        ) ||

                        block.startsWith(
                            "<h2>"
                        ) ||

                        block.startsWith(
                            "<h3>"
                        ) ||

                        block.startsWith(
                            "<ul>"
                        )
                    ) {

                        return block;
                    }

                    return `<p>${block.replace(
                        /\n/g,
                        "<br>"
                    )}</p>`;
                }
            )
            .join("");


    /* RESTORE MATH */

    mathBlocks.forEach(
        function (
            math,
            index
        ) {

            text =
                text.replace(
                    `___MATH_BLOCK_${index}___`,
                    math
                );
        }
    );

    return text;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}