
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Loader2, ChevronRight, Save, AlertCircle, CheckCircle, 
    Camera, CheckCheck, HelpCircle, ArrowLeft, Trophy
} from 'lucide-react';
import {
    Card, CardContent, CardDescription, CardFooter, 
    CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, 
    DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';


const ImageQuiz = () => {
    const { configLinkId } = useParams();
    const navigate = useNavigate();
    const [quizData, setQuizData] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [answers, setAnswers] = useState({});
    const [showContinuePrompt, setShowContinuePrompt] = useState(false);
    const [sessionId] = useState(localStorage.getItem('sessionId') || `session-${Math.random().toString(36).substring(2, 15)}`);
    const [fadingMessage, setFadingMessage] = useState(null);
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);

    useEffect(() => {
        if (configLinkId) {
            fetchQuizData();
        }
    }, [configLinkId]);

    useEffect(() => {
        if (quizData) {
            restoreProgress();
        }
    }, [quizData]);

    useEffect(() => {
        setAnswers({}); // Reset answers when currentImageIndex changes
    }, [currentImageIndex]);


    useEffect(() => {
        if (fadingMessage) {
            const timer = setTimeout(() => {
                setFadingMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [fadingMessage]);

    useEffect(() => {
        if (message && message.type === 'error') {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const getUserIdentifier = () => {
        const userId = localStorage.getItem('userId');
        return userId || sessionId;
    };
    const validateAnswers = (savedAnswers) => {
        if (!savedAnswers) return {};

        const validAnswers = {};
        const validQuestionIds = new Set(quizData.questions.map(q => q.id));

        Object.entries(savedAnswers).forEach(([questionId, optionId]) => {
            questionId = parseInt(questionId);
            if (validQuestionIds.has(questionId)) {
                const question = quizData.questions.find(q => q.id === questionId);
                if (question && question.options.some(opt => opt.id === optionId)) {
                    validAnswers[questionId] = optionId;
                }
            }
        });

        return validAnswers;
    };

    const fetchQuizData = async () => {
        try {
            setLoading(true);
            const userIdentifier = getUserIdentifier();

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/QuizCreationController/CreateQuiz/${configLinkId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'userId': userIdentifier,
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data.images || !data.questions) {
                throw new Error('Invalid quiz data received');
            }

            setQuizData(data);
        } catch (error) {
            console.error("Error fetching quiz:", error);
            setMessage({ text: error.message, type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const restoreProgress = () => {
        try {
            const savedProgress = localStorage.getItem(`quizProgress_${configLinkId}`);
            if (!savedProgress) return;

            const progress = JSON.parse(savedProgress);

            if (!validateProgress(progress)) {
                console.warn('Invalid saved progress found - starting fresh');
                localStorage.removeItem(`quizProgress_${configLinkId}`);
                return;
            }

            const validImageIndex = Math.min(progress.imageIndex, quizData.images.length - 1);
            const validAnswers = progress.imageIndex === validImageIndex ? validateAnswers(progress.answers) : {};

            setCurrentImageIndex(validImageIndex);
            setAnswers(validAnswers);
        } catch (error) {
            console.error('Error restoring progress:', error);
            localStorage.removeItem(`quizProgress_${configLinkId}`);
        }
    };


    const validateProgress = (progress) => {
        return (
            progress &&
            typeof progress.imageIndex === 'number' &&
            progress.imageIndex >= 0 &&
            typeof progress.answers === 'object' &&
            progress.categoryId === quizData.categoryId
        );
    };


    const handleAnswerSelect = (questionId, optionId) => {
        const newAnswers = {
            ...answers,
            [questionId]: optionId // Store as string to match the API expectation
        };
        setAnswers(newAnswers);

        const progress = {
            imageIndex: currentImageIndex,
            answers: newAnswers,
            categoryId: quizData?.categoryId,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(`quizProgress_${configLinkId}`, JSON.stringify(progress));
        setFadingMessage({ text: "Answer saved", type: "success" });
    };

    const handleSubmitImage = async () => {
        if (!quizData) return;

        const currentImage = quizData.images[currentImageIndex];
        const isLastImage = currentImageIndex === quizData.images.length - 1;

        // Validate answers before submission
        const answersArray = Object.entries(answers).map(([questionId, optionId]) => ({
            questionId: parseInt(questionId),
            optionId: optionId // Keep as string since that's what we stored
        }));

        if (answersArray.length !== quizData.questions.length) {
            setMessage({
                text: `Please answer all questions (${answersArray.length}/${quizData.questions.length} answered)`,
                type: "error"
            });
            return;
        }

        const requestBody = {
            imageName: currentImage.imageName,
            imagePath: currentImage.imagePath,
            categoryId: quizData.categoryId,
            answers: answersArray
        };

        try {
            const userIdentifier = getUserIdentifier();
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/QuizCreationController/SubmitImageAnswers`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "userId": userIdentifier
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to submit answers");
            }

            const result = await response.json();

            if (result.isImageComplete) {
                if (isLastImage) {
                    localStorage.removeItem(`quizProgress_${configLinkId}`);
                    setShowCompletionDialog(true);
                } else {
                    setShowContinuePrompt(true);
                    const newProgress = {
                        imageIndex: currentImageIndex + 1,
                        answers: {},
                        categoryId: quizData.categoryId,
                        lastSaved: new Date().toISOString()
                    };
                    localStorage.setItem(`quizProgress_${configLinkId}`, JSON.stringify(newProgress));
                }
            }
        } catch (error) {
            console.error("Error submitting answers:", error);
            setMessage({
                text: `Error submitting answers: ${error.message}`,
                type: "error"
            });
        }
    };

    const handleQuizCompletion = () => {
        setShowCompletionDialog(false);
        navigate('/QuizLandingPage');
    };


    const handleContinue = () => {
        setShowContinuePrompt(false);
        setAnswers({}); // This resets answers, but the next image index change might not be respecting this

        // Move to the next image
        const newImageIndex = currentImageIndex + 1;
        setCurrentImageIndex(newImageIndex);

        // Save progress with empty answers
        const progress = {
            imageIndex: newImageIndex,
            answers: {},
            categoryId: quizData?.categoryId,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(`quizProgress_${configLinkId}`, JSON.stringify(progress));
    };
    const handleQuit = () => {
        saveProgress();
        navigate('/QuizLandingPage');
    };

    const saveProgress = () => {
        if (!quizData) return;

        const progress = {
            imageIndex: currentImageIndex,
            answers: answers,
            categoryId: quizData.categoryId,
            lastSaved: new Date().toISOString()
        };

        localStorage.setItem(`quizProgress_${configLinkId}`, JSON.stringify(progress));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-blue-50 to-blue-100">
                <div className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center">
                    <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-4" />
                    <p className="text-xl text-blue-700 font-medium">Loading your quiz...</p>
                    <p className="text-sm text-blue-500 mt-2">This will just take a moment</p>
                </div>
            </div>
        );
    }

    if (!quizData || !quizData.images || !quizData.questions) {
        return (
            <div className="flex items-center justify-center h-screen bg-gradient-to-b from-red-50 to-red-100">
                <Card className="max-w-md mx-auto border-red-200 bg-white shadow-lg">
                    <CardHeader className="bg-red-50 border-b border-red-100">
                        <CardTitle className="text-center text-red-600">Error Loading Quiz</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center mb-4">
                            <AlertCircle className="h-12 w-12 text-red-500" />
                        </div>
                        <Alert variant="destructive" className="bg-red-50 border-red-200">
                            <AlertDescription className="text-center py-2">
                                No quiz data available. Please try again later.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-4 pb-6 bg-red-50 border-t border-red-100">
                        <Button
                            onClick={() => navigate('/dashboard')}
                            className="bg-blue-600 hover:bg-blue-700 px-8 py-2"
                        >
                            Return to Dashboard
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const currentImage = quizData.images[currentImageIndex];
    const allQuestionsAnswered = quizData.questions.length > 0 &&
        Object.keys(answers).length === quizData.questions.length;
    const progressPercentage = ((currentImageIndex + 1) / quizData.images.length) * 100;
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = quizData.questions.length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 py-8 px-4 md:px-8">
            {/* Continue/Quit Dialog */}
            <Dialog open={showContinuePrompt} onOpenChange={setShowContinuePrompt}>
                <DialogContent className="sm:max-w-md bg-gradient-to-b from-green-50 to-white border-green-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-700">
                            <CheckCircle className="text-green-500 h-5 w-5" />
                            Image Complete!
                        </DialogTitle>
                        <DialogDescription className="text-green-700/80">
                            You've completed image {currentImageIndex + 1} of {quizData.images.length}.
                            Would you like to continue to the next image or save and finish later?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="sm:justify-center gap-4 mt-6">
                        <Button onClick={handleContinue} className="gap-2 bg-green-600 hover:bg-green-700">
                            Continue <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" onClick={handleQuit} className="gap-2 border-green-300 text-green-700 hover:bg-green-50">
                            <Save className="h-4 w-4" /> Save & Quit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* Quiz Completion Dialog */}
            <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                <DialogContent className="sm:max-w-md bg-gradient-to-b from-blue-50 to-indigo-50 border-blue-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-center gap-2 text-blue-700 text-xl">
                            <Trophy className="text-yellow-500 h-8 w-8" />
                            Quiz Completed!
                        </DialogTitle>
                        <DialogDescription className="text-blue-700/80 text-center mt-2">
                            Congratulations! You've successfully completed the {quizData.category} quiz.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 flex justify-center">
                        <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-md text-center">
                            <p className="text-blue-800 font-medium">
                                You've answered all questions for all {quizData.images.length} images.
                            </p>
                            <p className="text-blue-600 mt-2">
                                Your responses have been recorded successfully.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-center mt-4">
                        <Button
                            onClick={handleQuizCompletion}
                            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-2"
                        >
                            Return to Categories <ChevronRight className="h-4 w-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Quiz Content */}
            <div className="container max-w-6xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <Button variant="ghost" size="sm" onClick={handleQuit} className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 gap-1">
                        <Save className="h-4 w-4" /> Save & Exit
                    </Button>
                    <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                        {quizData.category}
                    </h1>
                    <div className="w-20"></div> {/* Balance spacer */}
                </div>

                {/* Progress section */}
                <div className="mb-6 bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                    <div className="flex justify-between text-sm text-blue-600 mb-2">
                        <span className="flex items-center gap-1">
                            <Camera className="h-4 w-4" /> Image {currentImageIndex + 1} of {quizData.images.length}
                        </span>
                        <span className="font-medium">{progressPercentage.toFixed(0)}% Complete</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3 bg-blue-100">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                            style={{ width: `${progressPercentage}%` }} />
                    </Progress>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Image Section - takes 2/5 on large screens */}
                    <div className="lg:col-span-2">
                        <Card className="h-full shadow-lg border-blue-200 overflow-hidden">
                            <CardHeader className="bg-blue-50 border-b border-blue-100 p-4">
                                <CardTitle className="text-blue-700 text-lg flex items-center gap-2">
                                    <Camera className="h-5 w-5" />
                                    Image {currentImageIndex + 1}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 flex items-center justify-center bg-gray-50 h-[400px]">
                                <div className="relative w-full h-full flex items-center justify-center p-4">
                                    <img
                                        src={`${import.meta.env.VITE_API_URL}${currentImage.imagePath}`}
                                        alt={`Quiz ${currentImageIndex + 1}`}
                                        className="max-w-full max-h-full object-contain shadow-md border border-gray-200"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Questions Section - takes 3/5 on large screens */}
                    <div className="lg:col-span-3 flex flex-col">
                        <Card className="flex-grow shadow-lg border-blue-200">
                            <CardHeader className="bg-blue-50 border-b border-blue-100 p-4">
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-blue-700 text-lg">Questions</CardTitle>
                                    <span className={`text-sm font-medium rounded-full px-3 py-1 flex items-center gap-1 
                                                     ${allQuestionsAnswered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {allQuestionsAnswered ?
                                            <CheckCheck className="h-4 w-4" /> :
                                            <HelpCircle className="h-4 w-4" />}
                                        {answeredCount}/{totalQuestions} Answered
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                                {quizData.questions.map((question, idx) => (
                                    <div key={question.id}
                                        className={`p-4 bg-white rounded-lg border transition-all shadow-sm
                                                    ${Object.keys(answers).includes(question.id.toString()) ?
                                                'border-green-200 bg-green-50/30' :
                                                'border-blue-200 hover:shadow-md'}`}>
                                        <p className="font-medium mb-4 text-blue-800 flex gap-2">
                                            <span className="inline-flex items-center justify-center bg-blue-600 text-white rounded-full w-6 h-6 text-sm font-bold flex-shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span>{question.QuestionText}</span>
                                        </p>
                                        <RadioGroup
                                            key={`question-${question.id}-image-${currentImageIndex}`}
                                            value={answers[question.id]?.toString()}
                                            onValueChange={(value) => handleAnswerSelect(question.id, value)}
                                            className="space-y-2 ml-8"
                                        >
                                            {question.options.map((option) => (
                                                <div key={option.id}
                                                    className={`flex items-center space-x-2 p-2.5 rounded-md transition-colors
                                                        ${answers[question.id] === option.id ?
                                                            'bg-blue-100 border border-blue-300' :
                                                            'hover:bg-blue-50 border border-transparent'}`}>
                                                    <RadioGroupItem
                                                        value={option.id.toString()}
                                                        id={`option-${option.id}`}
                                                        className="text-blue-600"
                                                    />
                                                    <Label
                                                        htmlFor={`option-${option.id}`}
                                                        className="flex-grow cursor-pointer text-blue-700"
                                                    >
                                                        {option.optionText}
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="pt-4 pb-6 border-t border-blue-100 bg-gradient-to-b from-blue-50 to-indigo-50 p-4">
                                <Button
                                    onClick={handleSubmitImage}
                                    disabled={!allQuestionsAnswered}
                                    className={`w-full py-4 text-lg font-semibold ${allQuestionsAnswered ?
                                            'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' :
                                            'bg-gray-300 text-gray-600 cursor-not-allowed'
                                        }`}
                                >
                                    {allQuestionsAnswered ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <CheckCircle className="h-5 w-5" />
                                            Submit Answers
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            Please Answer All Questions
                                        </span>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                {/* Messages */}
                {message && (
                    <div className="fixed bottom-6 right-6 max-w-sm z-50">
                        <Alert
                            variant={message.type === 'error' ? "destructive" : "default"}
                            className={`shadow-lg ${message.type === 'error' ?
                                'bg-red-50 border-red-200 text-red-800' :
                                'bg-green-50 border-green-200 text-green-800'}`}
                        >
                            {message.type === 'error' ?
                                <AlertCircle className="h-4 w-4 text-red-600" /> :
                                <CheckCircle className="h-4 w-4 text-green-600" />}
                            <AlertDescription>{message.text}</AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* Fading Confirmation Message */}
                {fadingMessage && (
                    <div className="fixed bottom-6 right-6 p-3 bg-green-100 border border-green-300 rounded-md shadow-lg text-green-700 flex items-center gap-2 fade-out z-50">
                        <CheckCheck className="h-5 w-5" />
                        {fadingMessage.text}
                        <style jsx>{`
                            .fade-out {
                                animation: fadeOut 3s forwards;
                            }
                            @keyframes fadeOut {
                                0% { opacity: 1; }
                                75% { opacity: 1; }
                                100% { opacity: 0; }
                            }
                        `}</style>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageQuiz;