import { useMemo, useState } from "react";
import confetti from "canvas-confetti";

const questions = [
    {
        question: "How are You ?",
        options: ["Good", "Not Good", "Bad Not", "Naah"],
        answer: "Good",
    },
    {
        question: "How are you are parents",
        options: [
            "Good and happy",
            "happy and good",
            "and good happy",
            "Good happy and",
        ],
        answer: "Good and happy",
    },
    {
        question: "Are you settled and everything working well",
        options: [
            "yes and yes",
            "yes but no",
            "no but yes",
            "no and no",
        ],
        answer: "yes and yes",
    },
    {
        question: "Tough Question: Are you taken / have a boyfriend",
        options: ["yes", "no"],
        answer: "no",
    },
    {
        question: "Would you consider me as an option",
        options: [
            "hmm possibly",
            "chal hat",
            "ewwww",
            "chutiya hey kya",
        ],
        answer: "hmm possibly",
    },
    {
        question: "Did i rush on things",
        options: ["nahi", "ha"],
        answer: "nahi",
    },
    {
        question: "Can i ask you out if you are ok",
        options: ["nahi", "ha"],
        answer: "ha",
    },
];

const TOUGH_QUESTION_INDEX = 3;
const FRIENDSHIP_QUESTION_INDEX = 4;

const GOOGLE_SCRIPT_URL =
    import.meta.env.VITE_GOOGLE_SCRIPT_URL;

function Dashboard() {
    const [started, setStarted] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [completed, setCompleted] = useState(false);
    const [earlyExit, setEarlyExit] = useState(false);
    const [finalResponse, setFinalResponse] = useState("");
    const [showRain, setShowRain] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);

    const question = questions[currentQuestion];

    const selectedAnswer = answers[currentQuestion];

    const isLastQuestion =
        currentQuestion === questions.length - 1;

    const progress =
        ((currentQuestion + 1) / questions.length) * 100;

    const rainDrops = useMemo(() => {
        return Array.from({ length: 80 }, (_, index) => ({
            id: index,
            left: Math.random() * 100 + "%",
            delay: Math.random() * 0.5 + "s",
            duration: 0.6 + Math.random() * 0.5 + "s",
        }));
    }, []);

    // --------------------------------------------------
    // START
    // --------------------------------------------------

    const handleStart = () => {
        setStarted(true);
        setCurrentQuestion(0);
        setAnswers({});
        setCompleted(false);
        setEarlyExit(false);
        setFinalResponse("");
        setShowRain(false);
        setIsProcessing(false);
        setShowFeedback(false);
    };

    // --------------------------------------------------
    // SELECT ANSWER
    // --------------------------------------------------

    const handleAnswerSelect = (option) => {
        if (isProcessing) {
            return;
        }

        setAnswers((previousAnswers) => ({
            ...previousAnswers,
            [currentQuestion]: option,
        }));
    };

    // --------------------------------------------------
    // CONFETTI
    // --------------------------------------------------

    const celebrate = (isFinalQuestion) => {
        confetti({
            particleCount: isFinalQuestion ? 220 : 100,
            spread: isFinalQuestion ? 110 : 75,
            startVelocity: isFinalQuestion ? 38 : 25,
            origin: {
                x: 0.5,
                y: 0.65,
            },
            disableForReducedMotion: true,
        });

        if (isFinalQuestion) {
            window.setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 90,
                    startVelocity: 30,
                    origin: {
                        x: 0.15,
                        y: 0.7,
                    },
                    disableForReducedMotion: true,
                });

                confetti({
                    particleCount: 100,
                    spread: 90,
                    startVelocity: 30,
                    origin: {
                        x: 0.85,
                        y: 0.7,
                    },
                    disableForReducedMotion: true,
                });
            }, 200);
        }
    };

    // --------------------------------------------------
    // WRONG ANSWER RAIN
    // --------------------------------------------------

    const showWrongAnswerRain = () => {
        setShowRain(true);

        window.setTimeout(() => {
            setShowRain(false);
        }, 1800);
    };

    // --------------------------------------------------
    // SUBMIT QUIZ
    // --------------------------------------------------

    const submitQuiz = async (
        answersToSubmit = answers,
        finalResponseToSubmit = finalResponse
    ) => {
        const score = questions.reduce(
            (totalScore, currentQuestionData, index) => {
                if (
                    answersToSubmit[index] ===
                    currentQuestionData.answer
                ) {
                    return totalScore + 1;
                }

                return totalScore;
            },
            0
        );

        const submissionAnswers = questions.map(
            (currentQuestionData, index) => {
                const selected =
                    answersToSubmit[index];

                return {
                    question:
                        currentQuestionData.question,

                    selectedAnswer: selected || "",

                    correctAnswer:
                        currentQuestionData.answer,

                    correct:
                        selected ===
                        currentQuestionData.answer,
                };
            }
        );

        const payload = {
            score,

            total: questions.length,

            percentage: Math.round(
                (score / questions.length) * 100
            ),

            answers: submissionAnswers,

            finalResponse:
                finalResponseToSubmit,

            earlyExit,
        };

        const formData =
            new URLSearchParams();

        formData.append(
            "data",
            JSON.stringify(payload)
        );

        if (!GOOGLE_SCRIPT_URL) {
            throw new Error(
                "VITE_GOOGLE_SCRIPT_URL is not configured."
            );
        }

        await fetch(
            GOOGLE_SCRIPT_URL,
            {
                method: "POST",
                mode: "no-cors",
                body: formData,
            }
        );
    };

    // --------------------------------------------------
    // EARLY EXIT
    // --------------------------------------------------

    const exitQuestionnaire = async (
        selectedAnswer
    ) => {
        const updatedAnswers = {
            ...answers,
            [currentQuestion]:
                selectedAnswer,
        };

        setAnswers(updatedAnswers);
        setEarlyExit(true);

        try {
            await submitQuiz(
                updatedAnswers
            );
        } catch (error) {
            console.error(
                "Failed to submit early exit:",
                error
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // --------------------------------------------------
    // NEXT
    // --------------------------------------------------

    const handleNext = async () => {
        if (isProcessing) {
            return;
        }

        if (!selectedAnswer) {
            return;
        }

        setIsProcessing(true);

        const isCorrect =
            selectedAnswer === question.answer;

        // ------------------------------------------------
        // QUESTION 4
        //
        // YES -> EXIT
        // ------------------------------------------------

        if (
            currentQuestion ===
                TOUGH_QUESTION_INDEX &&
            selectedAnswer === "yes"
        ) {
            await exitQuestionnaire(
                selectedAnswer
            );

            return;
        }

        // ------------------------------------------------
        // QUESTION 5
        //
        // Anything other than "hmm possibly"
        // -> EXIT
        // ------------------------------------------------

        if (
            currentQuestion ===
                FRIENDSHIP_QUESTION_INDEX &&
            selectedAnswer !==
                "hmm possibly"
        ) {
            await exitQuestionnaire(
                selectedAnswer
            );

            return;
        }

        // ------------------------------------------------
        // NORMAL ANSWER
        // ------------------------------------------------

        if (isCorrect) {
            celebrate(isLastQuestion);
        } else {
            showWrongAnswerRain();
        }

        // ------------------------------------------------
        // LAST MCQ
        // ------------------------------------------------

        if (isLastQuestion) {
            setShowFeedback(true);
            setIsProcessing(false);

            return;
        }

        // ------------------------------------------------
        // NEXT QUESTION
        // ------------------------------------------------

        setCurrentQuestion(
            (previousQuestion) =>
                previousQuestion + 1
        );

        window.setTimeout(() => {
            setIsProcessing(false);
        }, 0);
    };

    // --------------------------------------------------
    // SUBMIT FEEDBACK
    // --------------------------------------------------

    const handleFeedbackSubmit = async () => {
        if (isProcessing) {
            return;
        }

        setIsProcessing(true);

        try {
            await submitQuiz(
                answers,
                finalResponse
            );

            // Close feedback screen
            setShowFeedback(false);

            // Show separate thank-you screen
            setCompleted(true);
        } catch (error) {
            console.error(
                "Failed to submit feedback:",
                error
            );

            alert(
                "Unable to submit your response. Please try again."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    // --------------------------------------------------
    // PREVIOUS
    // --------------------------------------------------

    const handlePrevious = () => {
        if (isProcessing) {
            return;
        }

        if (currentQuestion === 0) {
            return;
        }

        setCurrentQuestion(
            (previousQuestion) =>
                previousQuestion - 1
        );
    };

    // --------------------------------------------------
    // RESTART
    // --------------------------------------------------

    const handleRestart = () => {
        setStarted(false);
        setCurrentQuestion(0);
        setAnswers({});
        setCompleted(false);
        setEarlyExit(false);
        setFinalResponse("");
        setShowRain(false);
        setIsProcessing(false);
        setShowFeedback(false);
    };

    // ==================================================
    // SCREEN 1 - START
    // ==================================================

    if (!started) {
        return (
            <main className="min-h-[100svh] bg-[#fff5f7] px-4 py-8 sm:py-10">
                <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl items-center justify-center">
                    <section className="w-full rounded-3xl border border-[#f3dce1] bg-white p-7 text-center shadow-sm sm:p-12">

                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f3] text-4xl">
                            📝
                        </div>

                        <p className="mt-7 text-sm font-medium text-[#d95f72]">
                            Welcome
                        </p>

                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1d1d1f] sm:text-4xl">
                            Questions for Shakshi
                        </h1>

                        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                            Answer a series of multiple-choice questions,
                            kyuki meri gaand phati hey kise puchhu tujse
                        </p>

                        <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-3">

                            <div className="rounded-2xl bg-[#fff9fa] p-4">
                                <p className="text-2xl font-semibold text-[#d95f72]">
                                    {questions.length}
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Questions
                                </p>
                            </div>

                            <div className="rounded-2xl bg-[#fff9fa] p-4">
                                <p className="text-2xl font-semibold text-[#d95f72]">
                                    4
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                    Options
                                </p>
                            </div>

                        </div>

                        <button
                            type="button"
                            onClick={handleStart}
                            className="mt-9 min-h-[52px] rounded-full bg-[#d95f72] px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#c95164] active:scale-95"
                        >
                            Start Questionnaire →
                        </button>

                        <p className="mt-4 text-xs text-gray-400">
                            Good luck! 🍀
                        </p>

                    </section>
                </div>
            </main>
        );
    }

    // ==================================================
    // SCREEN 2 - EARLY EXIT
    // ==================================================

    if (earlyExit) {
        return (
            <main className="min-h-[100svh] bg-[#fff5f7] px-4 py-8 sm:py-10">
                <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl items-center justify-center">

                    <section className="w-full rounded-3xl border border-[#f3dce1] bg-white p-8 text-center shadow-sm sm:p-12">

                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#fff0f3] text-5xl">
                            😊
                        </div>

                        <p className="mt-7 text-sm font-medium text-[#d95f72]">
                            Okay
                        </p>

                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1d1d1f] sm:text-4xl">
                            Thank you for responding ❤️
                        </h1>

                        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-500">
                            I appreciate your honesty.
                        </p>

                        <div className="mx-auto mt-6 max-w-md rounded-2xl bg-[#fff5f7] p-6">
                            <p className="text-lg font-medium leading-7 text-[#9e4554]">
                                Let's keep our friendship 🤝❤️
                            </p>
                        </div>

                        <p className="mt-6 text-sm text-gray-400">
                            No more questions. Promise. 😄
                        </p>

                    </section>
                </div>
            </main>
        );
    }

    // ==================================================
    // SCREEN 3 - FEEDBACK
    // ==================================================

    if (showFeedback) {
        return (
            <main className="min-h-[100svh] bg-[#fff5f7] px-4 py-8 sm:py-10">

                <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl items-center justify-center">

                    <section className="w-full rounded-3xl border border-[#f3dce1] bg-white p-7 shadow-sm sm:p-12">

                        <div className="text-center">

                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff0f3] text-4xl">
                                💭
                            </div>

                            <p className="mt-6 text-sm font-medium text-[#d95f72]">
                                One last thing
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1d1d1f] sm:text-4xl">
                                I want your feedback
                            </h1>

                            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
                                Now that you've answered everything,
                                tell me honestly what you think.
                            </p>

                        </div>

                        <div className="mt-8">

                            <label
                                htmlFor="final-response"
                                className="mb-3 block text-sm font-medium text-[#9e4554]"
                            >
                                Your feedback
                            </label>

                            <textarea
                                id="final-response"
                                value={finalResponse}
                                onChange={(event) =>
                                    setFinalResponse(
                                        event.target.value
                                    )
                                }
                                disabled={isProcessing}
                                placeholder="Tell me what you really think..."
                                rows={7}
                                autoCapitalize="sentences"
                                autoCorrect="on"
                                spellCheck={true}
                                className="w-full resize-none appearance-none rounded-2xl border border-[#eee1e4] bg-[#fff9fa] p-4 text-base text-[#1d1d1f] outline-none transition placeholder:text-gray-400 focus:border-[#d95f72] focus:ring-2 focus:ring-[#f8dce1] disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
                            />

                        </div>

                        <div className="mt-7 flex items-center justify-between gap-3">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowFeedback(false)
                                }
                                disabled={isProcessing}
                                className="min-h-[48px] rounded-full px-5 py-3 text-sm font-medium text-gray-600 transition hover:bg-[#fff0f3] hover:text-[#b04f60] active:scale-95 disabled:cursor-not-allowed disabled:text-gray-300"
                            >
                                ← Back
                            </button>

                            <button
                                type="button"
                                onClick={handleFeedbackSubmit}
                                disabled={isProcessing}
                                className={
                                    "min-h-[48px] rounded-full px-7 py-3 text-sm font-medium text-white transition active:scale-95 " +
                                    (isProcessing
                                        ? "cursor-not-allowed bg-[#e8b9c1]"
                                        : "bg-[#d95f72] hover:bg-[#c95164]")
                                }
                            >
                                {isProcessing
                                    ? "Submitting..."
                                    : "Submit 🎉"}
                            </button>

                        </div>

                    </section>
                </div>
            </main>
        );
    }

    // ==================================================
    // SCREEN 4 - FINAL THANK YOU
    // ==================================================

    if (completed) {
        return (
            <main className="min-h-[100svh] bg-[#fff5f7] px-4 py-8 sm:py-10">

                <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl items-center justify-center">

                    <section className="w-full rounded-3xl border border-[#f3dce1] bg-white p-8 text-center shadow-sm sm:p-12">

                        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#fff0f3] text-5xl">
                            ❤️
                        </div>

                        <p className="mt-7 text-sm font-medium text-[#d95f72]">
                            Done
                        </p>

                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#1d1d1f] sm:text-4xl">
                            Thank you for responding ❤️
                        </h1>

                        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-gray-500">
                            I really appreciate you taking the time
                            to answer everything honestly.
                        </p>

                        <div className="mx-auto mt-7 max-w-md rounded-2xl bg-[#fff5f7] p-6">
                            <p className="text-lg font-medium leading-7 text-[#9e4554]">
                                That's all from my side. 😊
                            </p>
                        </div>

                        <p className="mt-6 text-sm text-gray-400">
                            Have a good day! 🌸
                        </p>

                    </section>
                </div>
            </main>
        );
    }

    // ==================================================
    // SCREEN 5 - QUESTIONNAIRE
    // ==================================================

    return (
        <main className="relative min-h-[100svh] overflow-hidden bg-[#fff5f7] px-4 py-8 sm:py-10">

            {showRain && (
                <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">

                    <div className="absolute inset-0 bg-[#5b5260]/10" />

                    <div className="absolute inset-0 overflow-hidden">

                        {rainDrops.map((drop) => (
                            <span
                                key={drop.id}
                                className="rain-drop"
                                style={{
                                    left: drop.left,
                                    animationDelay: drop.delay,
                                    animationDuration: drop.duration,
                                }}
                            />
                        ))}

                    </div>

                    <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2">

                        <div className="mx-auto w-full max-w-xs rounded-3xl border border-[#e8dfe2] bg-white px-7 py-6 text-center shadow-xl">

                            <div className="text-5xl">
                                🌧️
                            </div>

                            <p className="mt-3 text-xl font-semibold text-[#1d1d1f]">
                                Okay 🥲
                            </p>

                        </div>

                    </div>
                </div>
            )}

            <div className="mx-auto max-w-3xl">

                <header className="mb-7 text-center sm:mb-8">

                    <p className="text-sm font-medium text-[#d95f72]">
                        Questionnaire
                    </p>

                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#1d1d1f] sm:text-3xl">
                        Test your knowledge
                    </h1>

                    <p className="mt-2 text-sm text-gray-500">
                        Question {currentQuestion + 1} of{" "}
                        {questions.length}
                    </p>

                </header>

                <div className="mb-5">

                    <div
                        className="h-2 overflow-hidden rounded-full bg-[#f4dfe3]"
                        role="progressbar"
                        aria-valuemin="0"
                        aria-valuemax={questions.length}
                        aria-valuenow={currentQuestion + 1}
                    >

                        <div
                            className="h-full rounded-full bg-[#d95f72] transition-all duration-500"
                            style={{
                                width: progress + "%",
                            }}
                        />

                    </div>

                </div>

                <section className="rounded-3xl border border-[#f3dce1] bg-white p-5 shadow-sm sm:p-8">

                    <div className="mb-5 flex items-center justify-between">

                        <span className="rounded-full bg-[#fff0f3] px-3 py-1 text-xs font-medium text-[#b04f60]">
                            Question {currentQuestion + 1}
                        </span>

                        <span className="text-xs text-gray-400">
                            {currentQuestion + 1}/
                            {questions.length}
                        </span>

                    </div>

                    <h2 className="text-lg font-semibold leading-7 text-[#1d1d1f] sm:text-xl sm:leading-8">
                        {question.question}
                    </h2>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                        {question.options.map(
                            (option, index) => {

                                const isSelected =
                                    selectedAnswer ===
                                    option;

                                return (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() =>
                                            handleAnswerSelect(
                                                option
                                            )
                                        }
                                        disabled={
                                            isProcessing
                                        }
                                        aria-pressed={
                                            isSelected
                                        }
                                        className={
                                            "flex min-h-[72px] w-full items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.98] " +
                                            (isSelected
                                                ? "border-[#d95f72] bg-[#fff0f3]"
                                                : "border-[#eee1e4] bg-white hover:border-[#e5b8c0] hover:bg-[#fff9fa]") +
                                            (isProcessing
                                                ? " cursor-not-allowed opacity-90"
                                                : "")
                                        }
                                    >

                                        <span
                                            className={
                                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium " +
                                                (isSelected
                                                    ? "bg-[#d95f72] text-white"
                                                    : "bg-[#f7f3f4] text-gray-500")
                                            }
                                        >
                                            {String.fromCharCode(
                                                65 + index
                                            )}
                                        </span>

                                        <span
                                            className={
                                                "min-w-0 text-sm " +
                                                (isSelected
                                                    ? "font-medium text-[#9e4554]"
                                                    : "text-gray-700")
                                            }
                                        >
                                            {option}
                                        </span>

                                        {isSelected && (
                                            <span className="ml-auto shrink-0 text-lg text-[#d95f72]">
                                                ✓
                                            </span>
                                        )}

                                    </button>
                                );
                            }
                        )}

                    </div>

                    <div className="mt-7 flex items-center justify-between gap-3">

                        <button
                            type="button"
                            onClick={
                                handlePrevious
                            }
                            disabled={
                                currentQuestion ===
                                    0 ||
                                isProcessing
                            }
                            className={
                                "min-h-[48px] rounded-full px-5 py-3 text-sm font-medium transition sm:px-6 " +
                                (currentQuestion ===
                                    0 ||
                                isProcessing
                                    ? "cursor-not-allowed text-gray-300"
                                    : "text-gray-600 hover:bg-[#fff0f3] hover:text-[#b04f60] active:scale-95")
                            }
                        >
                            ← Previous
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={
                                !selectedAnswer ||
                                isProcessing
                            }
                            className={
                                "min-h-[48px] rounded-full px-6 py-3 text-sm font-medium text-white transition sm:px-7 " +
                                (!selectedAnswer ||
                                isProcessing
                                    ? "cursor-not-allowed bg-[#e8b9c1]"
                                    : "bg-[#d95f72] hover:bg-[#c95164] active:scale-95")
                            }
                        >
                            {isProcessing
                                ? "Processing..."
                                : isLastQuestion
                                    ? "Continue →"
                                    : "Next →"}
                        </button>

                    </div>

                </section>
            </div>
        </main>
    );
}

export default Dashboard;

