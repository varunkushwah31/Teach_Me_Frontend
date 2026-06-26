import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuizzes } from '../hooks/useQuizzes';
import {
    BrainCircuit,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Loader2,
    Trophy,
    ChevronDown,
    ChevronUp,
    AlertCircle,
} from 'lucide-react';
import type { QuizDTO, QuizResponseDTO } from '../services/api';

// ── Result screen ────────────────────────────────────────────────────────────

interface ResultsScreenProps {
    result: QuizResponseDTO;
    activeQuiz: QuizDTO;
    onReturn: () => void;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, activeQuiz, onReturn }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const passed = result.passed;
    const pct = result.score.toFixed(0);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-6">

                {/* Score header */}
                <div className="flex flex-col items-center text-center py-6">
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-2xl ${
                        passed
                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/20 border border-red-500/30 text-red-400'
                    }`}>
                        <Trophy className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-1">
                        {passed ? 'Well done!' : 'Keep practicing'}
                    </h2>
                    <p className="text-5xl font-bold mt-2 mb-1" style={{ color: passed ? '#34d399' : '#f87171' }}>
                        {pct}%
                    </p>
                    <p className="text-zinc-400 text-sm">
                        {result.correctAnswers} of {result.totalQuestions} correct
                        {result.totalQuestions > 0 && ` · pass mark ${activeQuiz.passScore}%`}
                    </p>
                </div>

                {/* Per-question feedback */}
                {result.feedback && result.feedback.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider px-1">Question breakdown</h3>

                        {result.feedback.map((fb, i) => {
                            const isOpen = expandedIndex === i;
                            const opts = activeQuiz.questions[i]?.options ?? [];

                            return (
                                <div
                                    key={fb.questionText} // ✅ Fix: Used unique question text instead of index array key
                                    className={`rounded-2xl border transition-colors ${
                                        fb.isCorrect
                                            ? 'bg-emerald-950/30 border-emerald-900/40'
                                            : 'bg-red-950/30 border-red-900/40'
                                    }`}
                                >
                                    <button
                                        onClick={() => setExpandedIndex(isOpen ? null : i)}
                                        className="w-full flex items-start gap-3 px-5 py-4 text-left"
                                    >
                                        <span className="shrink-0 mt-0.5">
                                            {fb.isCorrect
                                                ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                : <XCircle className="w-5 h-5 text-red-400" />
                                            }
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">
                                                {fb.questionText}
                                            </p>
                                            {!fb.isCorrect && (
                                                <p className="text-xs text-red-400 mt-1">
                                                    Your answer: {opts[fb.userAnswer] ?? `Option ${fb.userAnswer + 1}`}
                                                </p>
                                            )}
                                        </div>
                                        <span className="shrink-0 text-zinc-500 mt-0.5">
                                            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </span>
                                    </button>

                                    {isOpen && (
                                        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-3">
                                            {/* Correct answer */}
                                            {!fb.isCorrect && (
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-medium text-emerald-400 mb-0.5">Correct answer</p>
                                                        <p className="text-sm text-zinc-200">
                                                            {opts[fb.correctAnswer] ?? `Option ${fb.correctAnswer + 1}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* All options, annotated */}
                                            <div className="space-y-1.5">
                                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">All options</p>
                                                {opts.map((opt, oi) => {
                                                    const isCorrectOpt = oi === fb.correctAnswer;
                                                    const isUserOpt = oi === fb.userAnswer;

                                                    // ✅ Fix: Extracted nested ternary into independent string constants
                                                    let optionStyleClass = 'text-zinc-400';
                                                    if (isCorrectOpt) {
                                                        optionStyleClass = 'bg-emerald-500/10 text-emerald-300';
                                                    } else if (isUserOpt && !fb.isCorrect) {
                                                        optionStyleClass = 'bg-red-500/10 text-red-300';
                                                    }

                                                    return (
                                                        <div
                                                            key={opt} // ✅ Fix: Used specific option value text string for iterations
                                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${optionStyleClass}`}
                                                        >
                                                            <span className="font-mono text-xs w-5 shrink-0">
                                                                {String.fromCodePoint(65 + oi)}.
                                                            </span>
                                                            <span className="flex-1">{opt}</span>
                                                            {isCorrectOpt && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                                                            {isUserOpt && !isCorrectOpt && <XCircle className="w-3.5 h-3.5 shrink-0" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation */}
                                            {fb.explanation && (
                                                <div className="flex items-start gap-2 mt-1">
                                                    <AlertCircle className="w-4 h-4 text-[#968fff] shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-medium text-[#968fff] mb-0.5">Explanation</p>
                                                        <p className="text-sm text-zinc-300 leading-relaxed">{fb.explanation}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                <button
                    onClick={onReturn}
                    className="w-full py-3 bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white font-medium rounded-xl transition-all shadow-lg shadow-[#5b4fff]/20"
                >
                    Back to quizzes
                </button>
            </div>
        </div>
    );
};

// ── Main QuizPage ─────────────────────────────────────────────────────────────

const QuizPage: React.FC = () => {
    const { documentId: docIdParam } = useParams<{ documentId?: string }>();
    const navigate = useNavigate();

    const documentId = docIdParam ? Number.parseInt(docIdParam, 10) : Number.NaN;
    const validId = !Number.isNaN(documentId);

    const { quizzes, loading, fetchQuizzesForDocument, gradeQuiz } = useQuizzes();

    const [activeQuiz, setActiveQuiz] = useState<QuizDTO | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [quizResult, setQuizResult] = useState<QuizResponseDTO | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (validId) {
            void fetchQuizzesForDocument(documentId);
        }
    }, [documentId, validId, fetchQuizzesForDocument]);

    const handleStartQuiz = (quiz: QuizDTO) => {
        setActiveQuiz(quiz);
        setUserAnswers(new Array(quiz.questions.length).fill(-1));
        setCurrentQuestionIndex(0);
        setQuizResult(null);
        setSubmitError(null);
    };

    const handleSelectOption = (optionIndex: number) => {
        setUserAnswers((prev) => {
            const next = [...prev];
            next[currentQuestionIndex] = optionIndex;
            return next;
        });
    };

    const handleNext = () => {
        if (activeQuiz && currentQuestionIndex < activeQuiz.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
        }
    };

    const handleSubmit = async () => {
        if (!activeQuiz) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            const result = await gradeQuiz(activeQuiz.id, userAnswers);
            setQuizResult(result);
        } catch {
            setSubmitError('Failed to submit quiz — check your connection and try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReturn = () => {
        setActiveQuiz(null);
        setQuizResult(null);
    };

    if (!validId) {
        return (
            <div className="flex flex-col h-full bg-[#0a0a0a] items-center justify-center text-center p-6 gap-4">
                <BrainCircuit className="w-12 h-12 text-zinc-600" />
                <h2 className="text-xl font-semibold text-white">No document selected</h2>
                <p className="text-zinc-400 max-w-xs">Open a document from the library and generate a quiz to start here.</p>
                <button
                    onClick={() => navigate('/upload')}
                    className="px-5 py-2.5 bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white rounded-xl font-medium transition-all"
                >
                    Go to library
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-[#0a0a0a]">
                <Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" />
            </div>
        );
    }

    if (quizResult && activeQuiz) {
        return <ResultsScreen result={quizResult} activeQuiz={activeQuiz} onReturn={handleReturn} />;
    }

    if (!activeQuiz) {
        return (
            <div className="flex flex-col h-full bg-[#0a0a0a] p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-[#5b4fff]/20 to-[#968fff]/20 border border-[#5b4fff]/20">
                            <BrainCircuit className="w-5 h-5 text-[#968fff]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Available Quizzes</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Document #{documentId}</p>
                        </div>
                    </div>

                    {quizzes.length === 0 ? (
                        <div className="text-center py-16">
                            <BrainCircuit className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-500">No quizzes generated for this document yet.</p>
                            <p className="text-zinc-600 text-sm mt-1">Go to the library and click the quiz icon to generate one.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quizzes.map(quiz => (
                                <div key={quiz.id} className="bg-[#111111]/85 border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{quiz.title}</h3>
                                        <p className="text-sm text-zinc-400 mb-1">{quiz.description}</p>
                                        <p className="text-xs text-zinc-600">Pass mark: {quiz.passScore}%</p>
                                    </div>
                                    <button
                                        onClick={() => handleStartQuiz(quiz)}
                                        className="mt-4 w-full bg-[#5b4fff]/10 hover:bg-[#5b4fff]/20 text-[#968fff] border border-[#5b4fff]/20 py-2.5 rounded-xl font-medium transition-colors"
                                    >
                                        Start · {quiz.totalQuestions} questions
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const isAnswered = userAnswers[currentQuestionIndex] !== -1;
    const isLastQuestion = currentQuestionIndex === activeQuiz.questions.length - 1;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-zinc-400 font-medium text-sm">
                        Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                    </h3>
                    <button onClick={() => setActiveQuiz(null)} className="text-zinc-500 hover:text-white transition-colors">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-1 mb-8">
                    <div
                        className="bg-[#5b4fff] h-1 rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                    />
                </div>

                <div className="bg-[#111111]/85 border border-zinc-800/80 p-8 rounded-2xl shadow-2xl mb-6">
                    <h2 className="text-xl text-white font-medium mb-8 leading-relaxed">
                        {currentQuestion.questionText}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => (
                            <button
                                key={option} // ✅ Fix: Replaced multi-faceted string concat tracking key with alternative unique value option text
                                onClick={() => handleSelectOption(idx)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    userAnswers[currentQuestionIndex] === idx
                                        ? 'bg-[#5b4fff]/20 border-[#5b4fff]/50 text-white'
                                        : 'bg-[#1a1a1a] border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-[#222222]'
                                }`}
                            >
                                <span className="inline-block w-6 font-mono text-zinc-500 mr-2">
                                    {String.fromCodePoint(65 + idx)}.
                                </span>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                {submitError && (
                    <p className="text-red-400 text-sm mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {submitError}
                    </p>
                )}

                <div className="flex justify-end">
                    {isLastQuestion ? (
                        <button
                            onClick={() => void handleSubmit()}
                            disabled={!isAnswered || submitting}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all"
                        >
                            {submitting
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                                : <><CheckCircle2 className="w-5 h-5" /> Submit quiz</>
                            }
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!isAnswered}
                            className="flex items-center gap-2 bg-[#5b4fff] hover:bg-[#5b4fff]/90 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all"
                        >
                            Next <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPage;