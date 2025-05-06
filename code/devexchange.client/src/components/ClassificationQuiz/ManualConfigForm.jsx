import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Minus, Save } from "lucide-react";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";

const ManualConfigForm = ({ onConfigSubmit, showMessage }) => {
    const [categoryName, setCategoryName] = useState("");
    const [questions, setQuestions] = useState([
        { questionKey: "", questionText: "", options: ["", ""] }
    ]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { questionKey: "", questionText: "", options: ["", ""] }]);
    };

    const handleRemoveQuestion = (index) => {
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };

    const handleOptionChange = (questionIndex, optionIndex, value) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].options[optionIndex] = value;
        setQuestions(newQuestions);
    };

    const handleAddOption = (questionIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].options.push("");
        setQuestions(newQuestions);
    };

    const handleRemoveOption = (questionIndex, optionIndex) => {
        const newQuestions = [...questions];
        newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter(
            (_, i) => i !== optionIndex
        );
        setQuestions(newQuestions);
    };

    const handleSubmit = () => {
        if (!categoryName.trim()) {
            showMessage("Category name is required", "error");
            return;
        }

        // Validate questions and options
        for (const question of questions) {
            if (!question.questionKey.trim() || !question.questionText.trim()) {
                showMessage("All questions must have a key and text", "error");
                return;
            }
            if (question.options.some(opt => !opt.trim())) {
                showMessage("All options must have a value", "error");
                return;
            }
        }

        const config = {
            CategoryName: categoryName,
            Questions: questions.map(q => ({
                QuestionKey: q.questionKey,
                QuestionText: q.questionText,
                Options: q.options.map(opt => ({ OptionText: opt }))
            }))
        };

        onConfigSubmit(config);
    };

    return (
        <div className="h-full max-h-[90vh] overflow-y-auto space-y-6 p-4">
            <div className="space-y-4">
                <Input
                    placeholder="Enter Category Name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="border-blue-200 focus:border-blue-500"
                />

                <div className="space-y-6">
                    {questions.map((question, qIndex) => (
                        <div key={qIndex} className="p-4 border border-blue-200 rounded-lg space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium text-blue-700">Question {qIndex + 1}</h3>
                                {questions.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <Input
                                placeholder="Question Key (unique identifier)"
                                value={question.questionKey}
                                onChange={(e) => handleQuestionChange(qIndex, "questionKey", e.target.value)}
                                className="border-blue-200"
                            />

                            <Textarea
                                placeholder="Question Text"
                                value={question.questionText}
                                onChange={(e) => handleQuestionChange(qIndex, "questionText", e.target.value)}
                                className="border-blue-200"
                            />

                            <div className="space-y-3">
                                {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex gap-2">
                                        <Input
                                            placeholder={`Option ${oIndex + 1}`}
                                            value={option}
                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            className="border-blue-200"
                                        />
                                        {question.options.length > 2 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveOption(qIndex, oIndex)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddOption(qIndex)}
                                    className="text-green-600 hover:text-green-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Option
                                </Button>
                            </div>
                        </div>
                    ))}

                    <Button
                        variant="outline"
                        onClick={handleAddQuestion}
                        className="w-full text-blue-600 hover:text-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                    </Button>
                </div>

                <Button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                </Button>
            </div>
        </div>
    );
};

export default ManualConfigForm;