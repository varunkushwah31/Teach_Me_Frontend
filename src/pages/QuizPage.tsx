import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDocumentQuizzes, submitQuiz, type QuizDTO, type QuizResponseDTO } from '../services/api';
import { BrainCircuit, CheckCircle2, XCircle, ArrowRight, Loader2, Trophy } from 'lucide-react';

const QuizPage: React.FC = () => {
    const { token } = useAuth();
    const documentId = 1;

    const [quizzes, setQuizzes] = useState<QuizDTO[]>([]);
    const [activeQuiz, setActiveQuiz] = useState<QuizDTO | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    const [quizResult, setQuizResult] = useState<QuizResponseDTO | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        getDocumentQuizzes(token, documentId)
            .then(data => setQuizzes(data))
            .catch(err => console.error("Failed to fetch quizzes", err))
            .finally(() => setLoading(false));
    }, [token, documentId]);

    const handleStartQuiz = (quiz: QuizDTO) => {
        setActiveQuiz(quiz);
        setUserAnswers(new Array(quiz.questions.length).fill(-1));
        setCurrentQuestionIndex(0);
        setQuizResult(null);
    };

    const handleSelectOption = (optionIndex: number) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setUserAnswers(newAnswers);
    };

    const handleNext = () => {
        if (activeQuiz && currentQuestionIndex < activeQuiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handleSubmit = async () => {
        if (!token || !activeQuiz) return;
        setLoading(true);
        try {
            const result = await submitQuiz(token, activeQuiz.id, userAnswers);
            setQuizResult(result);
        } catch (err) {
            console.error("Failed to submit quiz", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex h-full items-center justify-center bg-[#0a0a0a]"><Loader2 className="w-8 h-8 animate-spin text-[#5b4fff]" /></div>;

    if (!activeQuiz) {
        return (
            <div className="flex flex-col h-full bg-[#0a0a0a] p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto w-full space-y-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-linear-to-br from-[#5b4fff]/20 to-[#968fff]/20 border border-[#5b4fff]/20">
                            <BrainCircuit className="w-5 h-5 text-[#968fff]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Available Quizzes</h2>
                    </div>

                    {quizzes.length === 0 ? (
                        <p className="text-zinc-500 text-center py-10">No quizzes generated for this document yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {quizzes.map(quiz => (
                                <div key={quiz.id} className="bg-[#111111]/85 border border-zinc-800/80 p-6 rounded-2xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white mb-2">{quiz.title}</h3>
                                        <p className="text-sm text-zinc-400 mb-4">{quiz.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleStartQuiz(quiz)}
                                        className="w-full bg-[#5b4fff]/10 hover:bg-[#5b4fff]/20 text-[#968fff] border border-[#5b4fff]/20 py-2.5 rounded-xl font-medium transition-colors"
                                    >
                                        Start {quiz.totalQuestions} Questions
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (quizResult) {
        return (
            <div className="flex flex-col h-full bg-[#0a0a0a] items-center justify-center p-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl ${quizResult.passed ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'}`}>
                    <Trophy className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">You scored {quizResult.score.toFixed(0)}%</h2>
                <p className="text-zinc-400 mb-8">{quizResult.correctAnswers} out of {quizResult.totalQuestions} correct.</p>
                <button onClick={() => setActiveQuiz(null)} className="px-6 py-3 bg-[#5b4fff] hover:bg-[#5b4fff]/90 text-white font-medium rounded-xl transition-all shadow-lg shadow-[#5b4fff]/20">
                    Return to Quizzes
                </button>
            </div>
        );
    }

    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const isAnswered = userAnswers[currentQuestionIndex] !== -1;
    const isLastQuestion = currentQuestionIndex === activeQuiz.questions.length - 1;

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-zinc-400 font-medium">Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</h3>
                    <button onClick={() => setActiveQuiz(null)} className="text-zinc-500 hover:text-white transition-colors"><XCircle className="w-5 h-5" /></button>
                </div>

                <div className="bg-[#111111]/85 border border-zinc-800/80 p-8 rounded-2xl shadow-2xl mb-6">
                    <h2 className="text-xl text-white font-medium mb-8 leading-relaxed">
                        {currentQuestion.questionText}
                    </h2>

                    <div className="space-y-3">
                        {currentQuestion.options.map((option, idx) => (
                            <button
                                key={option} // ✅ Fix: Replaced 'idx' with the actual 'option' string
                                onClick={() => handleSelectOption(idx)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${
                                    userAnswers[currentQuestionIndex] === idx
                                        ? 'bg-[#5b4fff]/20 border-[#5b4fff]/50 text-white'
                                        : 'bg-[#1a1a1a] border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-[#222222]'
                                }`}
                            >
                                {/* ✅ Fix: Replaced fromCharCode with fromCodePoint */}
                                <span className="inline-block w-6 font-mono text-zinc-500 mr-2">{String.fromCodePoint(65 + idx)}.</span>
                                {option}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end">
                    {isLastQuestion ? (
                        <button
                            onClick={() => void handleSubmit()}
                            disabled={!isAnswered}
                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-all"
                        >
                            <CheckCircle2 className="w-5 h-5" /> Submit Quiz
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