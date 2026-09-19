const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");
const fs = require("fs");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

console.log("================================");
console.log("STUDYSYNC SERVER STARTED");
console.log(
    "Gemini API key loaded:",
    !!process.env.GEMINI_API_KEY
);
console.log("================================");

const app = express();

app.use(express.json({ limit: "2mb" }));

/* FILE UPLOAD */

const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "uploads/");
        },

        filename: function (req, file, cb) {
            const filename =
                Date.now() +
                "-" +
                Math.round(Math.random() * 1E9) +
                ".pdf";

            cb(null, filename);
        }
    }),

    limits: {
        fileSize: 20 * 1024 * 1024
    }
});


/* GEMINI */

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


async function generateWithRetry(contents, config = {}) {

    const models = [
        "gemini-3.6-flash",
        "gemini-2.5-flash"
    ];

    let lastError;

    for (const model of models) {

        for (let attempt = 1; attempt <= 3; attempt++) {

            try {

                console.log(
                    `Trying ${model} (attempt ${attempt})...`
                );

                const response =
                    await ai.models.generateContent({

                        model: model,

                        config: config,

                        contents: contents

                    });

                console.log(
                    `Successfully generated response with ${model}.`
                );

                return response;

            } catch (error) {

                lastError = error;

                console.error(
                    `${model} failed on attempt ${attempt}:`,
                    error.message
                );

                /*
                 * Only retry temporary server errors.
                 */

                if (
                    error.status !== 503 &&
                    error.status !== 429
                ) {

                    throw error;

                }

                /*
                 * Wait before trying again.
                 */

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            1500 * attempt
                        )
                );
            }
        }
    }

    throw lastError;
}

/* SERVE WEBSITE */

app.use(express.static("public"));


/* =========================================================
   GENERATE NOTES
   ========================================================= */

app.post(
    "/generate-notes",
    upload.single("pdf"),
    async (req, res) => {

        try {

            if (!req.file) {
                return res.status(400).json({
                    error: "No PDF was uploaded."
                });
            }

            if (req.file.mimetype !== "application/pdf") {

                fs.unlinkSync(req.file.path);

                return res.status(400).json({
                    error: "Please upload a PDF file."
                });
            }

            console.log("PDF received.");
            console.log("Sending PDF to Gemini...");
            console.log("Creating study notes...");

            const pdfData =
                fs.readFileSync(req.file.path);

            const response =
                await ai.models.generateContent({

                    model: "gemini-3.6-flash",

                    contents: [

                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data:
                                    pdfData.toString("base64")
                            }
                        },

                        {
                            text: `You are an expert study-note creator.

Read and understand the ENTIRE PDF before creating the notes.

Your job is NOT to rewrite the slides.

Create a concise, high-quality study guide that helps a high-school student actually study and prepare for a test.

IMPORTANT:

- Do NOT simply copy the slides.
- Do NOT include every sentence or bullet point.
- Do NOT repeat information.
- Combine information from multiple slides when they discuss the same concept.
- Remove filler and unnecessary introductions.
- Remove repeated examples.
- Focus on information that is important to understand or remember.
- Keep explanations short and clear.
- Preserve important definitions.
- Preserve important formulas and equations.
- Preserve variables and units when relevant.
- Include important processes and their steps.
- Include cause-and-effect relationships.
- Include important comparisons.
- Include important examples when they help explain a concept.
- Explain important diagrams, graphs, or tables at a useful conceptual level.
- Include important exceptions or special cases.
- Do not invent information that is not supported by the PDF.

Make the notes appropriate for a high-school student.

Use Markdown formatting.

Use:

# Main Topic

## Big Idea

## Key Concepts

### Concept Name

## Key Terms

## Processes

## Formulas

## Examples

## Important Comparisons

## What to Remember

Use **bold** for important vocabulary.

For mathematical formulas, use LaTeX.

Inline math:
$F = ma$

Larger equations:
$$F = ma$$

Return ONLY the finished study notes.`
                        }
                    ]
                });

            const generatedNotes =
                response.text;

            console.log(
                "Notes generated successfully."
            );

            fs.unlinkSync(req.file.path);

            res.json({
                notes: generatedNotes
            });

        } catch (error) {

            console.error(error);

            if (
                req.file &&
                fs.existsSync(req.file.path)
            ) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                error:
                    error.message ||
                    "Failed to generate notes."
            });
        }
    }
);


/* =========================================================
   GENERATE FLASHCARDS
   ========================================================= */

app.post(
    "/generate-flashcards",
    async (req, res) => {

        try {

            const notes =
                req.body.notes;

            if (!notes || !notes.trim()) {

                return res.status(400).json({
                    error:
                        "No study notes were provided."
                });
            }

            console.log(
                "Creating flashcards..."
            );

            const response =
                await ai.models.generateContent({

                    model: "gemini-3.6-flash",

                    config: {
                        responseMimeType:
                            "application/json"
                    },

                    contents: [

                        {
                            text: `You are creating multiple-choice flashcards for a high-school student.

Create 12 high-quality questions based ONLY on the study notes below.

Test understanding rather than just memorization.

Each question MUST have exactly 4 answer choices.

Exactly ONE answer must be correct.

Incorrect answers should be believable but clearly incorrect.

Do not create trick questions.

Do not use information that is not present in the notes.

Spread questions across different concepts.

Return ONLY valid JSON.

Use exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Answer A",
        "Answer B",
        "Answer C",
        "Answer D"
      ],
      "correctAnswer": 0,
      "explanation": "Short explanation."
    }
  ]
}

correctAnswer:
0 = first option
1 = second option
2 = third option
3 = fourth option

The explanation should be short and educational.

STUDY NOTES:

${notes}`
                        }
                    ]
                });

            let flashcards;

            try {

                flashcards =
                    JSON.parse(response.text);

            } catch (error) {

                console.error(
                    "Invalid flashcard JSON:"
                );

                console.error(
                    response.text
                );

                return res.status(500).json({
                    error:
                        "Gemini returned an invalid flashcard format."
                });
            }

            if (
                !flashcards.questions ||
                !Array.isArray(
                    flashcards.questions
                )
            ) {

                return res.status(500).json({
                    error:
                        "Flashcards were not generated correctly."
                });
            }

            const validQuestions =
                flashcards.questions.filter(
                    question => {

                        return (
                            typeof question.question ===
                                "string" &&

                            Array.isArray(
                                question.options
                            ) &&

                            question.options.length ===
                                4 &&

                            Number.isInteger(
                                question.correctAnswer
                            ) &&

                            question.correctAnswer >=
                                0 &&

                            question.correctAnswer <=
                                3 &&

                            typeof question.explanation ===
                                "string"
                        );
                    }
                );

            if (
                validQuestions.length ===
                0
            ) {

                return res.status(500).json({
                    error:
                        "No valid flashcards were generated."
                });
            }

            console.log(
                `${validQuestions.length} flashcards generated.`
            );

            res.json({
                questions:
                    validQuestions
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    error.message ||
                    "Failed to generate flashcards."
            });
        }
    }
);


/* =========================================================
   GENERATE AI QUIZ
   ========================================================= */

app.post(
    "/generate-quiz",
    async (req, res) => {

        try {

            const notes =
                req.body.notes;

            if (!notes || !notes.trim()) {

                return res.status(400).json({
                    error:
                        "No study notes were provided."
                });
            }

            console.log(
                "Creating AI quiz..."
            );

            const response =
                await ai.models.generateContent({

                    model: "gemini-3.6-flash",

                    config: {
                        responseMimeType:
                            "application/json"
                    },

                    contents: [

                        {
                            text: `You are an expert high-school teacher creating a realistic practice test.

Create 10 high-quality multiple-choice test questions based ONLY on the study notes below.

IMPORTANT:
This quiz must be DIFFERENT from flashcards.

Flashcards test quick memory and recall.

This quiz should feel like an ACTUAL HIGH-SCHOOL TEST.

Prioritize questions that require the student to APPLY what they learned.

QUESTION TYPES:

1. NUMERICAL PROBLEMS
If the notes contain formulas, equations, measurements, rates, percentages, ratios, or other numerical information, create calculation questions using realistic numbers.

For example, instead of:
"What is the formula for acceleration?"

Ask something like:
"A car increases its velocity from 10 m/s to 30 m/s in 5 seconds. What is its acceleration?"

Make sure all numbers and information are supported by the material.

2. SCENARIO QUESTIONS

Give the student a realistic situation and ask them to determine what concept applies.

3. APPLICATION QUESTIONS

Ask the student to use a concept to solve a new problem rather than simply repeating a definition.

4. DATA INTERPRETATION

If the notes contain graphs, tables, measurements, trends, or experimental results, create questions where the student must interpret the information.

5. COMPARISON QUESTIONS

Ask the student to determine the difference between related concepts or decide which concept applies to a situation.

6. MULTI-STEP QUESTIONS

When appropriate, require the student to perform multiple reasoning steps before choosing an answer.

7. CONCEPTUAL QUESTIONS

Use conceptual questions when numerical or application questions are not appropriate.

NUMERICAL QUESTION RULES:

- Use realistic numbers.
- Make sure the numbers produce a solvable problem.
- Include all necessary information in the question.
- Use the correct units.
- Make incorrect choices represent realistic calculation mistakes.
- Do not create impossible calculations.
- Do not require knowledge that is not contained in the notes.
- If a formula is needed, the student should be able to determine it from the notes.
- Do NOT make every question a calculation if the subject does not require it.

DIFFICULTY:

Make the quiz similar to a real high-school test.

Use a mixture of:

- Medium questions
- Challenging questions
- Application questions
- A few straightforward questions

Do NOT make every question extremely difficult.

AVOID:

- Simple definition questions whenever an application question is possible.
- Questions that can be answered just by recognizing a sentence from the notes.
- Trick questions.
- Ambiguous questions.
- Information outside the notes.
- Repeating the same concept multiple times unnecessarily.

Each question MUST:

- Have exactly 4 answer choices.
- Have exactly ONE correct answer.
- Have believable incorrect answers.
- Be appropriate for a high-school student.
- Clearly test the material.

For calculation questions, the explanation should show the important calculation steps.

For example:

"Using a = Δv / Δt:
a = (30 - 10) / 5
a = 4 m/s²"

Use LaTeX for mathematical expressions.

Return ONLY valid JSON.

Use exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": 0,
      "explanation": "Short explanation showing why the answer is correct."
    }
  ]
}

correctAnswer:
0 = first option
1 = second option
2 = third option
3 = fourth option

STUDY NOTES:

${notes}`
                        }
                    ]
                });

            let quiz;

            try {

                quiz =
                    JSON.parse(response.text);

            } catch (error) {

                console.error(
                    "Invalid quiz JSON:"
                );

                console.error(
                    response.text
                );

                return res.status(500).json({
                    error:
                        "Gemini returned an invalid quiz."
                });
            }

            if (
                !quiz.questions ||
                !Array.isArray(
                    quiz.questions
                )
            ) {

                return res.status(500).json({
                    error:
                        "Quiz was not generated correctly."
                });
            }

            const validQuestions =
                quiz.questions.filter(
                    question => {

                        return (
                            typeof question.question ===
                                "string" &&

                            Array.isArray(
                                question.options
                            ) &&

                            question.options.length ===
                                4 &&

                            Number.isInteger(
                                question.correctAnswer
                            ) &&

                            question.correctAnswer >=
                                0 &&

                            question.correctAnswer <=
                                3 &&

                            typeof question.explanation ===
                                "string"
                        );
                    }
                );

            if (
                validQuestions.length ===
                0
            ) {

                return res.status(500).json({
                    error:
                        "No valid quiz questions were generated."
                });
            }

            console.log(
                `${validQuestions.length} quiz questions generated.`
            );

            res.json({
                questions:
                    validQuestions
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    error.message ||
                    "Failed to generate quiz."
            });
        }
    }
);


/* =========================================================
   STUDY AI
   ========================================================= */

app.post(
    "/study-ai",
    async (req, res) => {

        try {

            const notes =
                req.body.notes;

            const question =
                req.body.question;

            if (
                !notes ||
                !notes.trim()
            ) {

                return res.status(400).json({
                    error:
                        "No study notes were provided."
                });
            }

            if (
                !question ||
                !question.trim()
            ) {

                return res.status(400).json({
                    error:
                        "Please enter a question."
                });
            }

            console.log(
                "Study AI question:",
                question
            );

            const response =
                await ai.models.generateContent({

                    model: "gemini-3.6-flash",

                    contents: [

                        {
                            text: `You are StudySync's AI tutor.

You are helping a high-school student study.

The student has provided study notes.

Answer the student's question using the study notes as your primary source.

IMPORTANT:

- Explain concepts clearly and simply.
- Do not make up information.
- If the answer is not contained in the notes, say that the notes do not contain enough information.
- You may explain concepts in a different way to make them easier to understand.
- Give examples when helpful.
- Break complicated ideas into smaller steps.
- Do not simply copy the notes.
- Keep the response focused on the student's question.
- Use Markdown formatting when helpful.
- For formulas, use LaTeX.

STUDY NOTES:

${notes}

STUDENT QUESTION:

${question}

Give the student a helpful explanation.`
                        }
                    ]
                });

            res.json({
                answer:
                    response.text
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                error:
                    error.message ||
                    "Study AI failed."
            });
        }
    }
);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`StudySync is running at http://localhost:${PORT}`);
    });
}

module.exports = app;