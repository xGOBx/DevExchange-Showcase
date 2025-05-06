import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Pencil, Trash2, RefreshCw, Filter, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ManualConfigForm from './ManualConfigForm'; // Import the new component

const CategoryManager = () => {
    // State management
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [configFile, setConfigFile] = useState(null);
    const [userId, setUserId] = useState(null); // Store user ID here
    const [messageTimeout, setMessageTimeout] = useState(null);
    const [message, setMessage] = useState(null);
    const [duplicateKeys, setDuplicateKeys] = useState([]);

    // Form states
    const [categoryForm, setCategoryForm] = useState({
        categoryName: '',
        configLinkId: null
    });

    const [questionForm, setQuestionForm] = useState({
        questionText: '',
        questionKey: ''
    });

    const [optionForm, setOptionForm] = useState({
        optionText: ''
    });

    // Edit mode flags
    const [editingCategory, setEditingCategory] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(false);
    const [editingOption, setEditingOption] = useState(false);

    // Dialog states
    const [bulkOptionsDialogOpen, setBulkOptionsDialogOpen] = useState(false);
    const [bulkOptionsText, setBulkOptionsText] = useState('');
    const [configLinkFilterValue, setConfigLinkFilterValue] = useState('');
    const [successDialogOpen, setSuccessDialogOpen] = useState(false);
    const [successCategoryName, setSuccessCategoryName] = useState('');

    // API URL base
    const apiBase = import.meta.env.VITE_API_URL;

    // Load categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const showMessage = (text, type) => {
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }

        setMessage({ text, type });

        const timeoutId = setTimeout(() => setMessage(null), 5000);
        setMessageTimeout(timeoutId);
    };


    // Fetch all categories
    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const email = localStorage.getItem('user');
            if (!email) throw new Error('User email not found in localStorage');

            // Fetch user details by email
            const userResponse = await fetch(`${apiBase}/api/securewebsite/user/byemail?email=${email}`);
            if (!userResponse.ok) throw new Error('User not found');
            const userJson = await userResponse.json();
            const userId = userJson.userId;

            // Fetch categories
            const categoryResponse = await fetch(`${apiBase}/api/CategoryController/user/${userId}`);
            if (!categoryResponse.ok) throw new Error('Failed to fetch categories');
            const categoryData = await categoryResponse.json();

            setCategories(categoryData);
            setError(null);
        } catch (err) {
            setError('Failed to fetch categories: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch category details including questions and options
    const fetchCategoryDetails = async (categoryId) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${apiBase}/api/CategoryController/categories/${categoryId}`);

            // Check if questions data is available and properly structured
            console.log("Category details response:", response.data);

            // Explicitly fetch questions for this category to ensure we have the data
            const questionsResponse = await axios.get(`${apiBase}/api/CategoryController/categories/${categoryId}/questions`);
            console.log("Questions response:", questionsResponse.data);

            // Create a complete category object with questions
            const categoryData = {
                ...response.data,
                questions: questionsResponse.data || []
            };

            // Reset selections and form states
            setSelectedQuestion(null);
            setSelectedOption(null);
            setEditingQuestion(false);
            setEditingOption(false);
            setSelectedCategory(categoryData);
            setQuestionForm({ questionText: '', questionKey: '' });
            setOptionForm({ optionText: '' });
            setError(null);
        } catch (err) {
            setError('Failed to fetch category details: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuestionSelect = (question) => {
        console.log("Selected question:", question);

        // If the question object already has options, we can use them directly 
        if (question.options && question.options.length >= 0) {
            setSelectedQuestion(question);
            setSelectedOption(null);
        } else {
            // Otherwise, fetch the options
            fetchOptionsForQuestion(question);
        }
    };

    // Fetch options for a question
    const fetchOptionsForQuestion = async (question) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${apiBase}/api/CategoryController/questions/${question.id}/options`);

            // Create a new question object with the options
            const questionWithOptions = {
                ...question,
                options: response.data
            };

            // Update the selected question with options
            setSelectedQuestion(questionWithOptions);
            setSelectedOption(null);

            // Also update the question in the selectedCategory.questions array
            if (selectedCategory) {
                const updatedQuestions = selectedCategory.questions.map(q =>
                    q.id === question.id ? questionWithOptions : q
                );

                setSelectedCategory({
                    ...selectedCategory,
                    questions: updatedQuestions
                });
            }

            setError(null);
        } catch (err) {
            setError('Failed to fetch options: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch options for a question
    const fetchOptions = async (questionId) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${apiBase}/api/CategoryController/questions/${questionId}/options`);

            if (selectedQuestion && selectedQuestion.id === questionId) {
                setSelectedQuestion({ ...selectedQuestion, options: response.data });
            }

            if (selectedCategory) {
                const questionIndex = selectedCategory.questions.findIndex(q => q.id === questionId);
                if (questionIndex !== -1) {
                    const updatedQuestions = [...selectedCategory.questions];
                    updatedQuestions[questionIndex] = {
                        ...updatedQuestions[questionIndex],
                        options: response.data
                    };
                    setSelectedCategory({ ...selectedCategory, questions: updatedQuestions });
                }
            }

            setError(null);
        } catch (err) {
            setError('Failed to fetch options: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch questions for a category (new helper method)
    const fetchQuestions = async (categoryId) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${apiBase}/api/CategoryController/categories/${categoryId}/questions`);

            // Update the selectedCategory with the new questions
            if (selectedCategory && selectedCategory.id === categoryId) {
                setSelectedCategory({
                    ...selectedCategory,
                    questions: response.data || []
                });
            }

            setError(null);
        } catch (err) {
            setError('Failed to fetch questions: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const SuccessDialog = ({ isOpen, onClose, categoryName }) => {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <CheckCircle className="mr-2 h-6 w-6 text-green-500" />
                            Configuration Saved
                        </DialogTitle>
                        <DialogDescription>
                            The category "{categoryName}" has been successfully created and added to your categories.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={onClose}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };
    // CRUD for Categories
    const createCategory = async () => {
        setIsLoading(true);
        try {
            // Set creation date to current UTC time
            const categoryData = {
                ...categoryForm,
                isFeatured: false,
                isActive: true,
                createdDate: new Date().toISOString()
            };

            const response = await axios.post(`${apiBase}/api/CategoryController/categories`, categoryData);
            await fetchCategories();
            setCategoryForm({
                categoryName: '',
                configLinkId: null
            });
            setError(null);
        } catch (err) {
            setError('Failed to create category: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateCategory = async () => {
        setIsLoading(true);
        try {
            // Maintain original creation date and status flags from selectedCategory
            const categoryData = {
                ...selectedCategory,
                categoryName: categoryForm.categoryName,
                configLinkId: categoryForm.configLinkId || selectedCategory.configLinkId,
                // Preserve existing values for these fields
                isFeatured: selectedCategory.isFeatured,
                isActive: selectedCategory.isActive
            };

            await axios.put(`${apiBase}/api/CategoryController/categories/${selectedCategory.id}`, categoryData);
            await fetchCategories();
            await fetchCategoryDetails(selectedCategory.id);
            setEditingCategory(false);
            setError(null);
        } catch (err) {
            setError('Failed to update category: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCategory = async (categoryId) => {
        if (!window.confirm('Are you sure you want to delete this category?')) return;

        setIsLoading(true);
        try {
            await axios.delete(`${apiBase}/api/CategoryController/categories/${categoryId}`);
            await fetchCategories();
            setSelectedCategory(null);
            setSelectedQuestion(null);
            setSelectedOption(null);
            setError(null);
        } catch (err) {
            setError('Failed to delete category: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    const createQuestion = async () => {
        if (!selectedCategory) {
            setError("Please select a category first");
            return;
        }
        // First, get the options from user
        const bulkText = prompt("Enter options for this question (one per line):");
        if (!bulkText || !bulkText.trim()) {
            setError("Options are required to create a question");
            return;
        }
        // Parse the options
        const optionsArray = bulkText.split('\n')
            .map(line => line.trim())
            .filter(line => line);
        if (optionsArray.length === 0) {
            setError("At least one valid option is required");
            return;
        }
        setIsLoading(true);
        try {
            // Create a question model that matches your QuestionCreateModel DTO
            const questionModel = {
                QuestionKey: questionForm.questionKey || `question_${Date.now()}`,
                QuestionText: questionForm.questionText,
                Options: optionsArray.map(optText => ({
                    OptionText: optText,
                    IsCorrect: false
                }))
            };
            console.log("Creating question with model:", JSON.stringify(questionModel, null, 2));

            const response = await axios.post(
                `${apiBase}/api/CategoryController/categories/${selectedCategory.id}/questions`,
                questionModel,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log("Question creation response:", response.data);
            // Reset question form
            setQuestionForm({ questionText: '', questionKey: '' });
            // Refresh the category to see the new question
            await fetchCategoryDetails(selectedCategory.id);
            setError(null);
        } catch (err) {
            console.error("Error creating question:", err);
            if (err.response && err.response.data) {
                console.error("API error details:", JSON.stringify(err.response.data, null, 2));
                // Extract specific validation errors if available
                const validationErrors = err.response.data.errors;
                if (validationErrors) {
                    const errorMessages = Object.entries(validationErrors)
                        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                        .join('; ');
                    setError(`Validation failed: ${errorMessages}`);
                } else {
                    setError('Failed to create question: ' + (err.response?.data?.title || err.response?.data || err.message));
                }
            } else {
                setError('Failed to create question: ' + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };
    const updateQuestion = async () => {
        if (!selectedQuestion) {
            setError("No question selected");
            return;
        }

        setIsLoading(true);
        try {
            // Create the request body with the "Text" field as required by the API
            const updatedQuestion = {
                id: selectedQuestion.id,
                Text: questionForm.questionText // Changed from QuestionText to Text
            };

            await axios.put(`${apiBase}/api/CategoryController/questions/${selectedQuestion.id}/text`, updatedQuestion);

            // Update the question in the local state as well
            if (selectedCategory) {
                const updatedQuestions = selectedCategory.questions.map(q => {
                    if (q.id === selectedQuestion.id) {
                        return { ...q, QuestionText: questionForm.questionText };
                    }
                    return q;
                });

                setSelectedCategory({
                    ...selectedCategory,
                    questions: updatedQuestions
                });

                if (selectedQuestion) {
                    setSelectedQuestion({
                        ...selectedQuestion,
                        QuestionText: questionForm.questionText
                    });
                }
            }

            setEditingQuestion(false);
            setError(null);
        } catch (err) {
            setError('Failed to update question: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    const deleteQuestion = async (questionId) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;

        setIsLoading(true);
        try {
            await axios.delete(`${apiBase}/api/CategoryController/questions/${questionId}`);
            await fetchQuestions(selectedCategory.id);
            setSelectedQuestion(null);
            setSelectedOption(null);
            setError(null);
        } catch (err) {
            setError('Failed to delete question: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // CRUD for Options
    const createOption = async () => {
        if (!selectedQuestion) {
            setError("Please select a question first");
            return;
        }

        setIsLoading(true);
        try {
            const newOption = {
                optionText: optionForm.optionText,
                isCorrect: false, // Default value
                questionId: selectedQuestion.id
            };

            const response = await axios.post(`${apiBase}/api/CategoryController/options`, newOption);
            await fetchOptions(selectedQuestion.id);
            setOptionForm({ optionText: '' });
            setError(null);
        } catch (err) {
            setError('Failed to create option: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateOption = async () => {
        if (!selectedOption) {
            setError("No option selected");
            return;
        }

        setIsLoading(true);
        try {
            const updatedOption = {
                ...selectedOption,
                optionText: optionForm.optionText,
                // Preserve the existing isCorrect value
                isCorrect: selectedOption.isCorrect
            };

            await axios.put(`${apiBase}/api/CategoryController/options/${selectedOption.id}`, updatedOption);
            await fetchOptions(selectedQuestion.id);
            setEditingOption(false);
            setError(null);
        } catch (err) {
            setError('Failed to update option: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteOption = async (optionId) => {
        if (!window.confirm('Are you sure you want to delete this option?')) return;

        setIsLoading(true);
        try {
            await axios.delete(`${apiBase}/api/CategoryController/options/${optionId}`);
            await fetchOptions(selectedQuestion.id);
            setSelectedOption(null);
            setError(null);
        } catch (err) {
            setError('Failed to delete option: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form changes
    const handleCategoryFormChange = (e) => {
        const { name, value } = e.target;
        setCategoryForm({
            ...categoryForm,
            [name]: name === 'configLinkId' && value ? parseInt(value, 10) : value
        });
    };

    const handleQuestionFormChange = (e) => {
        const { name, value } = e.target;
        setQuestionForm({
            ...questionForm,
            [name]: value
        });
    };

    const handleOptionFormChange = (e) => {
        const { name, value } = e.target;
        setOptionForm({
            ...optionForm,
            [name]: value
        });
    };

    // Start editing an item
    const startEditingCategory = (category) => {
        setCategoryForm({
            categoryName: category.categoryName,
            configLinkId: category.configLinkId
        });
        setEditingCategory(true);
    };

    const startEditingQuestion = (question) => {
        // First ensure we have the full question data
        if (question) {
            setSelectedQuestion(question);
            // Handle both questionText and QuestionText properties
            setQuestionForm({
                questionText: question.QuestionText || question.questionText || '',
                questionKey: question.questionKey || ''
            });
            setEditingQuestion(true);
        }
    };

    const startEditingOption = (option) => {
        setSelectedOption(option);
        setOptionForm({
            optionText: option.optionText
        });
        setEditingOption(true);
    };

    // Cancel editing
    const cancelEditing = (type) => {
        switch (type) {
            case 'category':
                setEditingCategory(false);
                setCategoryForm({
                    categoryName: '',
                    configLinkId: null
                });
                break;
            case 'question':
                setEditingQuestion(false);
                setQuestionForm({ questionText: '', questionKey: '' });
                break;
            case 'option':
                setEditingOption(false);
                setOptionForm({ optionText: '' });
                break;
            default:
                break;
        }
    };

    // Function to bulk add options to a question
    const addBulkOptions = async (questionId, optionsArray) => {
        setIsLoading(true);
        try {
            // Ensure all options have isCorrect set to false since we removed this option
            const optionsWithIsCorrect = optionsArray.map(option => ({
                ...option,
                isCorrect: false
            }));

            await axios.post(`${apiBase}/api/CategoryController/questions/${questionId}/options`, optionsWithIsCorrect);
            await fetchOptions(questionId);
            setError(null);
        } catch (err) {
            setError('Failed to add options: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle bulk options submission from dialog
    const handleBulkOptionsSubmit = () => {
        if (!selectedQuestion) {
            setError("Please select a question first");
            return;
        }

        const options = bulkOptionsText.split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(optText => ({
                optionText: optText,
                isCorrect: false,
                questionId: selectedQuestion.id
            }));

        if (options.length > 0) {
            addBulkOptions(selectedQuestion.id, options);
            setBulkOptionsText('');
            setBulkOptionsDialogOpen(false);
        } else {
            setError("At least one valid option is required");
        }
    };

    // Function to fetch featured categories
    const fetchFeaturedCategories = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${apiBase}/api/CategoryController/categories/featured/true`);
            setCategories(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch featured categories: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to fetch categories by config link ID
    const fetchCategoriesByConfigLink = async (configLinkId) => {
        if (!configLinkId || isNaN(parseInt(configLinkId, 10))) {
            setError("Please enter a valid Config Link ID");
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.get(`${apiBase}/api/CategoryController/categories/configlink/${configLinkId}`);
            setCategories(response.data);
            // Clear selections when changing filter
            setSelectedCategory(null);
            setSelectedQuestion(null);
            setSelectedOption(null);
            setError(null);
        } catch (err) {
            setError('Failed to fetch categories by config link: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    const handleManualConfigSubmit = async (config) => {
        try {
            // Retrieve user email from localStorage
            const email = localStorage.getItem('user');
            if (!email) {
                showMessage('User email not found', 'error');
                return;
            }

            // Fetch user details to get userId
            const userResponse = await fetch(`${apiBase}/api/securewebsite/user/byemail?email=${email}`);
            if (!userResponse.ok) {
                showMessage('Failed to retrieve user details', 'error');
                return;
            }
            const userJson = await userResponse.json();
            const userId = userJson.userId;

            // Prepare the full category payload
            const fullCategoryPayload = {
                userId,
                fullCategory: config
            };

            // Send the configuration to the API
            const response = await fetch(`${apiBase}/api/UploadManager/full-category`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fullCategoryPayload)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Set the category name for the success dialog
                setSuccessCategoryName(config.CategoryName);

                // Open the success dialog
                setSuccessDialogOpen(true);

                // Refresh categories
                await fetchCategories();
            } else if (data.duplicates) {
                // ... existing duplicate handling
            }
        } catch (err) {
            console.error('Configuration save error:', err);
            showMessage('Failed to save configuration', 'error');
        }
    };


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Category Manager</h1>
                <Button
                    variant="outline"
                    onClick={fetchCategories}
                    className="flex items-center"
                >
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Categories Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Categories</CardTitle>
                        <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm" onClick={fetchCategories}>All</Button>
                            <Button variant="outline" size="sm" onClick={fetchFeaturedCategories}>Featured</Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="default"
                                        size="sm"
                                    >
                                        New Category
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[625px]">
                                    <DialogHeader>
                                        <DialogTitle>Manual Category Configuration</DialogTitle>
                                    </DialogHeader>
                                    <ManualConfigForm
                                        onConfigSubmit={(config) => {
                                            handleManualConfigSubmit(config);
                                        }}
                                        showMessage={showMessage}
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[calc(100vh-250px)]">
                            {categories.length > 0 ? (
                                <div className="space-y-2">
                                    {categories.map(category => (
                                        <div
                                            key={category.id}
                                            className={`p-3 rounded-md border ${selectedCategory && selectedCategory.id === category.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-800' : 'border-gray-200 dark:border-gray-800'}`}
                                        >
                                            <div
                                                className="cursor-pointer"
                                                onClick={() => fetchCategoryDetails(category.id)}
                                            >
                                                <div className="font-medium">{category.categoryName}</div>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {!category.isActive && (
                                                        <Badge variant="outline" className="text-gray-500">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                    {category.isFeatured && (
                                                        <Badge className="bg-amber-500">
                                                            Featured
                                                        </Badge>
                                                    )}
                                                    {category.configLinkId && (
                                                        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                            Config: {category.configLinkId}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => startEditingCategory(category)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                    onClick={() => deleteCategory(category.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500">
                                    No categories found. Click "New Category" to create one.
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
                {/* Questions Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Questions</CardTitle>
                        <CardDescription>
                            {selectedCategory ?
                                `Managing questions for "${selectedCategory.categoryName}"` :
                                "Select a category to manage questions"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedCategory ? (
                            <>
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium mb-2">
                                        {editingQuestion ? 'Edit Question' : 'Add New Question'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid w-full items-center gap-1.5">
                                            <label htmlFor="questionText" className="text-sm font-medium">Question</label>
                                            <Textarea
                                                id="questionText"
                                                name="questionText"
                                                value={questionForm.questionText}
                                                onChange={handleQuestionFormChange}
                                                placeholder="Enter question text"
                                            />
                                        </div>
                                        <div className="grid w-full items-center gap-1.5">
                                            <label htmlFor="questionKey" className="text-sm font-medium">Question Key (Optional)</label>
                                            <Input
                                                type="text"
                                                id="questionKey"
                                                name="questionKey"
                                                value={questionForm.questionKey}
                                                onChange={handleQuestionFormChange}
                                                placeholder="Question identifier"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            {editingQuestion ? (
                                                <>
                                                    <Button variant="outline" onClick={() => cancelEditing('question')} disabled={isLoading}>
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={updateQuestion} disabled={isLoading}>
                                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Update
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button onClick={createQuestion} disabled={isLoading}>
                                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Create with Options
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <ScrollArea className="h-80">
                                    {selectedCategory.questions && selectedCategory.questions.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedCategory.questions.map(question => (
                                                <div
                                                    key={question.id}
                                                    className={`p-3 rounded-md border ${selectedQuestion && selectedQuestion.id === question.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-800' : 'border-gray-200 dark:border-gray-800'}`}
                                                >
                                                    <div
                                                        className="cursor-pointer"
                                                        onClick={() => handleQuestionSelect(question)}
                                                    >
                                                        <div className="font-medium">{question.QuestionText || question.questionText}</div>
                                                        {question.questionKey && (
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                Key: {question.questionKey}
                                                            </div>
                                                        )}
                                                        {question.options && (
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {question.options.length} options
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => startEditingQuestion(question)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                            onClick={() => deleteQuestion(question.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            No questions found. Create one to get started.
                                        </div>
                                    )}
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                Select a category to manage questions
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Options Panel */}
                <Card>
                    <CardHeader>
                        <CardTitle>Options</CardTitle>
                        <CardDescription>
                            {selectedQuestion ?
                                `Managing options for "${selectedQuestion.QuestionText || selectedQuestion.questionText}"` :
                                "Select a question to manage options"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedQuestion ? (
                            <>
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium mb-2">
                                        {editingOption ? 'Edit Option' : 'Add New Option'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="grid w-full items-center gap-1.5">
                                            <label htmlFor="optionText" className="text-sm font-medium">Option Text</label>
                                            <Input
                                                type="text"
                                                id="optionText"
                                                name="optionText"
                                                value={optionForm.optionText}
                                                onChange={handleOptionFormChange}
                                                placeholder="Enter option text"
                                            />
                                        </div>
                                        <div className="flex justify-between gap-2">
                                            <Dialog open={bulkOptionsDialogOpen} onOpenChange={setBulkOptionsDialogOpen}>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline">
                                                        <Plus className="mr-2 h-4 w-4" /> Bulk Add
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Add Multiple Options</DialogTitle>
                                                        <DialogDescription>
                                                            Enter each option on a new line.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="py-4">
                                                        <Textarea
                                                            value={bulkOptionsText}
                                                            onChange={(e) => setBulkOptionsText(e.target.value)}
                                                            placeholder="Option 1&#10;Option 2&#10;Option 3"
                                                            rows={10}
                                                        />
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setBulkOptionsDialogOpen(false)}>
                                                            Cancel
                                                        </Button>
                                                        <Button onClick={handleBulkOptionsSubmit}>
                                                            Add Options
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>

                                            <div className="flex justify-end gap-2">
                                                {editingOption ? (
                                                    <>
                                                        <Button variant="outline" onClick={() => cancelEditing('option')} disabled={isLoading}>
                                                            Cancel
                                                        </Button>
                                                        <Button onClick={updateOption} disabled={isLoading}>
                                                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                            Update
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button onClick={createOption} disabled={isLoading || !optionForm.optionText}>
                                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Add
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="my-4" />

                                <ScrollArea className="h-80">
                                    {selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                                        <div className="space-y-2">
                                            {selectedQuestion.options.map(option => (
                                                <div
                                                    key={option.id}
                                                    className={`p-3 rounded-md border flex items-center justify-between ${selectedOption && selectedOption.id === option.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-800' : 'border-gray-200 dark:border-gray-800'}`}
                                                >
                                                    <div className="flex items-center gap-2 flex-1">
                                                        {option.isCorrect ? (
                                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5 text-gray-400" />
                                                        )}
                                                        <span className="font-medium">{option.optionText}</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => startEditingOption(option)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                            onClick={() => deleteOption(option.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500">
                                            No options found. Create one to get started.
                                        </div>
                                    )}
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                Select a question to manage options
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
            <SuccessDialog
                isOpen={successDialogOpen}
                onClose={() => setSuccessDialogOpen(false)}
                categoryName={successCategoryName}
            />
        </div>

    );
};

export default CategoryManager;