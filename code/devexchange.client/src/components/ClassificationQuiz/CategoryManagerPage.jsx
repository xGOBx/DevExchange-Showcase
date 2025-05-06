import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Button
} from "@/components/ui/button";
import {
    Input
} from "@/components/ui/input";
import {
    Textarea
} from "@/components/ui/textarea";
import {
    Checkbox
} from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Badge
} from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Label
} from "@/components/ui/label";
import { Loader2 } from "lucide-react";


const CategoryManagerPage = () => {
    // State management
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState('');

    // Modal states
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState({ type: null, id: null });

    // Form states
    const [categoryForm, setCategoryForm] = useState({
        categoryName: '',
        isFeatured: false,
        isActive: true,
        configLinkId: null
    });

    const [questionForm, setQuestionForm] = useState({ questionText: '', order: 0 });
    const [optionForm, setOptionForm] = useState({ optionText: '', isCorrect: false });

    // Form dialog states
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
    const [optionDialogOpen, setOptionDialogOpen] = useState(false);

    // Edit mode flags
    const [editingCategory, setEditingCategory] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(false);
    const [editingOption, setEditingOption] = useState(false);

    // API URL base
    const apiBase = import.meta.env.VITE_API_URL;

    // Load user information and their categories on component mount
    useEffect(() => {
        // Try to get user email from localStorage or context
        const email = localStorage.getItem('user'); // Adjust based on your auth implementation
        if (email) {
            setUserEmail(email);
            fetchUserIdByEmail(email);
        }
    }, []);

    // Fetch categories when userId is available
    useEffect(() => {
        if (userId) {
            fetchUserCategories(userId);
        }
    }, [userId]);

    // Fetch user ID by email
    const fetchUserIdByEmail = async (email) => {
        setIsLoading(true);
        try {
            const userResponse = await fetch(`${apiBase}/api/securewebsite/user/byemail?email=${email}`);
            if (!userResponse.ok) throw new Error('User not found');
            const userJson = await userResponse.json();
            setUserId(userJson.userId);
            setError(null);
        } catch (err) {
            setError('Failed to fetch user details: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch categories for specific user
    const fetchUserCategories = async (userId) => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${apiBase}/api/CategoryController/user/${userId}/categories`);
            // Ensure response.data is an array
            setCategories(Array.isArray(response.data) ? response.data : []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch user categories: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch all categories
    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${apiBase}/api/CategoryController/categories`);
            setCategories(response.data);
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
            // Ensure questions is an array
            const categoryData = {
                ...response.data,
                questions: Array.isArray(response.data.questions) ? response.data.questions : []
            };

            // Clear selected question when changing categories
            setSelectedQuestion(null);
            setSelectedOption(null);
            setSelectedCategory(categoryData);
            setError(null);
        } catch (err) {
            setError('Failed to fetch category details: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    const selectCategoryFromList = (categoryData) => {
        // Ensure questions is an array
        const questions = Array.isArray(categoryData.questions) ? categoryData.questions : [];

        // Set the selected category by combining category data with questions
        setSelectedCategory({
            ...categoryData.category,
            questions: questions
        });

        // Clear selected question and option
        setSelectedQuestion(null);
        setSelectedOption(null);
    };
    // Handle question selection
    const handleQuestionSelect = (question) => {
        setSelectedQuestion(question);
        setSelectedOption(null);
    };

    // CRUD for Categories
    const createCategory = async () => {
        setIsLoading(true);
        try {
            // Set creation date to current UTC time and user ID
            const categoryData = {
                ...categoryForm,
                userId: userId,
                createdDate: new Date().toISOString()
            };

            await axios.post(`${apiBase}/api/CategoryController/categories`, categoryData);
            await fetchUserCategories(userId);
            setCategoryForm({
                categoryName: '',
                isFeatured: false,
                isActive: true,
                configLinkId: null
            });
            setCategoryDialogOpen(false);
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
            // Maintain original creation date and user ID from selectedCategory
            const categoryData = {
                ...selectedCategory,
                categoryName: categoryForm.categoryName,
                isFeatured: categoryForm.isFeatured,
                isActive: categoryForm.isActive,
                configLinkId: categoryForm.configLinkId || selectedCategory.configLinkId
            };

            await axios.put(`${apiBase}/api/CategoryController/categories/${selectedCategory.id}`, categoryData);
            await fetchUserCategories(userId);
            setCategoryDialogOpen(false);
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
        setIsLoading(true);
        try {
            await axios.delete(`${apiBase}/api/CategoryController/categories/${categoryId}`);
            await fetchUserCategories(userId);
            setSelectedCategory(null);
            setSelectedQuestion(null);
            setSelectedOption(null);
            setDeleteDialogOpen(false);
            setError(null);
        } catch (err) {
            setError('Failed to delete category: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // CRUD for Questions
    const createQuestion = async () => {
        setIsLoading(true);
        try {
            const newQuestion = {
                ...questionForm,
                categoryId: selectedCategory.id
            };

            await axios.post(`${apiBase}/api/CategoryController/questions`, newQuestion);
            await fetchCategoryDetails(selectedCategory.id);
            setQuestionForm({ questionText: '', order: 0 });
            setQuestionDialogOpen(false);
            setError(null);
        } catch (err) {
            setError('Failed to create question: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateQuestion = async () => {
        setIsLoading(true);
        try {
            const updatedQuestion = {
                ...selectedQuestion,
                questionText: questionForm.questionText,
                order: questionForm.order
            };

            await axios.put(`${apiBase}/api/CategoryController/questions/${selectedQuestion.id}`, updatedQuestion);
            await fetchCategoryDetails(selectedCategory.id);
            setQuestionDialogOpen(false);
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
        setIsLoading(true);
        try {
            await axios.delete(`${apiBase}/api/CategoryController/questions/${questionId}`);
            await fetchCategoryDetails(selectedCategory.id);
            setSelectedQuestion(null);
            setSelectedOption(null);
            setDeleteDialogOpen(false);
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
        setIsLoading(true);
        try {
            const newOption = {
                ...optionForm,
                questionId: selectedQuestion.id
            };

            await axios.post(`${apiBase}/api/CategoryController/options`, newOption);
            // Refresh the question to get updated options
            const updatedCategory = { ...selectedCategory };
            const questionIndex = updatedCategory.questions.findIndex(q => q.id === selectedQuestion.id);

            if (questionIndex !== -1) {
                // Get options for the updated question
                const response = await axios.get(`${apiBase}/api/CategoryController/questions/${selectedQuestion.id}/options`);
                updatedCategory.questions[questionIndex].options = response.data;

                // Update the selected question with new options
                setSelectedQuestion({
                    ...selectedQuestion,
                    options: response.data
                });

                setSelectedCategory(updatedCategory);
            }

            setOptionForm({ optionText: '', isCorrect: false });
            setOptionDialogOpen(false);
            setError(null);
        } catch (err) {
            setError('Failed to create option: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateOption = async () => {
        setIsLoading(true);
        try {
            const updatedOption = {
                ...selectedOption,
                optionText: optionForm.optionText,
                isCorrect: optionForm.isCorrect
            };

            await axios.put(`${apiBase}/api/CategoryController/options/${selectedOption.id}`, updatedOption);

            // Refresh the question to get updated options
            const updatedCategory = { ...selectedCategory };
            const questionIndex = updatedCategory.questions.findIndex(q => q.id === selectedQuestion.id);

            if (questionIndex !== -1) {
                // Get options for the updated question
                const response = await axios.get(`${apiBase}/api/CategoryController/questions/${selectedQuestion.id}/options`);
                updatedCategory.questions[questionIndex].options = response.data;

                // Update the selected question with new options
                setSelectedQuestion({
                    ...selectedQuestion,
                    options: response.data
                });

                setSelectedCategory(updatedCategory);
            }

            setOptionDialogOpen(false);
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
        setIsLoading(true);
        try {
            await axios.delete(`${apiBase}/api/CategoryController/options/${optionId}`);

            // Refresh the question to get updated options
            const updatedCategory = { ...selectedCategory };
            const questionIndex = updatedCategory.questions.findIndex(q => q.id === selectedQuestion.id);

            if (questionIndex !== -1) {
                // Get options for the updated question
                const response = await axios.get(`${apiBase}/api/CategoryController/questions/${selectedQuestion.id}/options`);
                updatedCategory.questions[questionIndex].options = response.data;

                // Update the selected question with new options
                setSelectedQuestion({
                    ...selectedQuestion,
                    options: response.data
                });

                setSelectedCategory(updatedCategory);
            }

            setSelectedOption(null);
            setDeleteDialogOpen(false);
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
        const { name, value, type } = e.target;
        setCategoryForm({
            ...categoryForm,
            [name]: type === 'number' ? parseInt(value, 10) : value
        });
    };

    const handleCategoryCheckboxChange = (name, checked) => {
        setCategoryForm({
            ...categoryForm,
            [name]: checked
        });
    };

    const handleQuestionFormChange = (e) => {
        const { name, value } = e.target;
        setQuestionForm({
            ...questionForm,
            [name]: name === 'order' ? parseInt(value, 10) : value
        });
    };

    const handleOptionFormChange = (e) => {
        const { name, value } = e.target;
        setOptionForm({
            ...optionForm,
            [name]: value
        });
    };

    const handleOptionCheckboxChange = (name, checked) => {
        setOptionForm({
            ...optionForm,
            [name]: checked
        });
    };

    // Start editing an item
    const startEditingCategory = (category) => {
        setCategoryForm({
            categoryName: category.categoryName,
            isFeatured: category.isFeatured,
            isActive: category.isActive,
            configLinkId: category.configLinkId
        });
        setEditingCategory(true);
        setCategoryDialogOpen(true);
    };

    const startEditingQuestion = (question) => {
        setSelectedQuestion(question);
        setQuestionForm({
            questionText: question.questionText,
            order: question.order
        });
        setEditingQuestion(true);
        setQuestionDialogOpen(true);
    };

    const startEditingOption = (option) => {
        setSelectedOption(option);
        setOptionForm({
            optionText: option.optionText,
            isCorrect: option.isCorrect
        });
        setEditingOption(true);
        setOptionDialogOpen(true);
    };

    // Open dialogs for creating new items
    const openNewCategoryDialog = () => {
        setCategoryForm({
            categoryName: '',
            isFeatured: false,
            isActive: true,
            configLinkId: null
        });
        setEditingCategory(false);
        setCategoryDialogOpen(true);
    };

    const openNewQuestionDialog = () => {
        setQuestionForm({ questionText: '', order: 0 });
        setEditingQuestion(false);
        setQuestionDialogOpen(true);
    };

    const openNewOptionDialog = () => {
        setOptionForm({ optionText: '', isCorrect: false });
        setEditingOption(false);
        setOptionDialogOpen(true);
    };

    // Delete confirmation handlers
    const confirmDelete = () => {
        if (itemToDelete.type === 'category') {
            deleteCategory(itemToDelete.id);
        } else if (itemToDelete.type === 'question') {
            deleteQuestion(itemToDelete.id);
        } else if (itemToDelete.type === 'option') {
            deleteOption(itemToDelete.id);
        }
    };

    const openDeleteDialog = (type, id) => {
        setItemToDelete({ type, id });
        setDeleteDialogOpen(true);
    };

    // Function to bulk add options to a question
    const addBulkOptions = async (questionId, optionsArray) => {
        setIsLoading(true);
        try {
            await axios.post(`${apiBase}/api/CategoryController/questions/${questionId}/options`, optionsArray);

            // Refresh the question to get updated options
            const updatedCategory = { ...selectedCategory };
            const questionIndex = updatedCategory.questions.findIndex(q => q.id === questionId);

            if (questionIndex !== -1) {
                // Get options for the updated question
                const response = await axios.get(`${apiBase}/api/CategoryController/questions/${questionId}/options`);
                updatedCategory.questions[questionIndex].options = response.data;

                if (selectedQuestion && selectedQuestion.id === questionId) {
                    // Update the selected question with new options
                    setSelectedQuestion({
                        ...selectedQuestion,
                        options: response.data
                    });
                }

                setSelectedCategory(updatedCategory);
            }

            setError(null);
        } catch (err) {
            setError('Failed to add options: ' + (err.response?.data || err.message));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Bulk options dialog state
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkOptionsText, setBulkOptionsText] = useState('');

    const handleBulkOptionsSubmit = () => {
        if (!selectedQuestion || !bulkOptionsText) return;

        const options = bulkOptionsText.split('\n').map(line => {
            const isCorrect = line.startsWith('*');
            const text = isCorrect ? line.substring(1).trim() : line.trim();
            return {
                optionText: text,
                isCorrect: isCorrect,
                questionId: selectedQuestion.id
            };
        }).filter(opt => opt.optionText);

        if (options.length > 0) {
            addBulkOptions(selectedQuestion.id, options);
            setBulkDialogOpen(false);
            setBulkOptionsText('');
        }
    };

    // Get deletion confirmation message based on item type
    const getDeleteConfirmMessage = () => {
        switch (itemToDelete.type) {
            case 'category':
                return "Are you sure you want to delete this category? This will also delete all its questions and options.";
            case 'question':
                return "Are you sure you want to delete this question? This will also delete all its options.";
            case 'option':
                return "Are you sure you want to delete this option?";
            default:
                return "Are you sure you want to delete this item?";
        }
    };

    // Main component render
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="space-y-8">
                <h1 className="text-3xl font-bold">Category Manager</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {!userId ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>Enter Your Email</CardTitle>
                            <CardDescription>We need your email to fetch your categories</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="your.email@example.com"
                                    value={userEmail}
                                    onChange={(e) => setUserEmail(e.target.value)}
                                />
                                <Button onClick={() => fetchUserIdByEmail(userEmail)}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Load Categories"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Tabs defaultValue="categories">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="categories">Categories</TabsTrigger>
                            <TabsTrigger value="questions" disabled={!selectedCategory}>Questions</TabsTrigger>
                            <TabsTrigger value="options" disabled={!selectedQuestion}>Options</TabsTrigger>
                        </TabsList>

                        {/* Categories Tab */}
                        <TabsContent value="categories">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Your Categories</CardTitle>
                                        <CardDescription>Manage your custom categories</CardDescription>
                                    </div>
                                    <Button onClick={openNewCategoryDialog}>Add New Category</Button>
                                </CardHeader>
                                <CardContent>
                                        {categories.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead className="text-right">Actions</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {Array.isArray(categories) && categories.map((category) => (
                                                        <TableRow
                                                            key={category.category.id}
                                                            className={
                                                                selectedCategory && selectedCategory.id === category.category.id
                                                                    ? "bg-muted/50"
                                                                    : ""
                                                            }
                                                        >
                                                            <TableCell
                                                                className="font-medium cursor-pointer"
                                                                onClick={() => selectCategoryFromList(category)}
                                                            >
                                                                {category.category.categoryName}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {category.category.isFeatured &&
                                                                        <Badge variant="default">Featured</Badge>
                                                                    }
                                                                    {!category.category.isActive &&
                                                                        <Badge variant="outline">Inactive</Badge>
                                                                    }
                                                                    {category.category.configLinkId &&
                                                                        <Badge variant="secondary">
                                                                            Config: {category.category.configLinkId}
                                                                        </Badge>
                                                                    }
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => startEditingCategory(category.category)}
                                                                    >
                                                                        Edit
                                                                    </Button>
                                                                    <Button
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        onClick={() => openDeleteDialog('category', category.category.id)}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-muted-foreground">No categories found. Create one to get started.</p>
                                            </div>
                                        )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Questions Tab */}
                        <TabsContent value="questions">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            Questions for {selectedCategory?.categoryName}
                                        </CardTitle>
                                        <CardDescription>
                                            Manage questions in this category
                                        </CardDescription>
                                    </div>
                                    <Button onClick={openNewQuestionDialog}>Add New Question</Button>
                                </CardHeader>
                                <CardContent>
                                    {selectedCategory && selectedCategory.questions.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Question Text</TableHead>
                                                    <TableHead>Order</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedCategory.questions.map((question) => (
                                                    <TableRow
                                                        key={question.id}
                                                        className={
                                                            selectedQuestion && selectedQuestion.id === question.id
                                                                ? "bg-muted/50"
                                                                : ""
                                                        }
                                                    >
                                                        <TableCell
                                                            className="font-medium cursor-pointer"
                                                            onClick={() => handleQuestionSelect(question)}
                                                        >
                                                            {question.questionText}
                                                        </TableCell>
                                                        <TableCell>{question.order}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => startEditingQuestion(question)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => openDeleteDialog('question', question.id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-muted-foreground">
                                                No questions found for this category. Add one to get started.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Options Tab */}
                        <TabsContent value="options">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>
                                            Options for Question
                                        </CardTitle>
                                        <CardDescription>
                                            {selectedQuestion?.questionText}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button onClick={openNewOptionDialog}>
                                            Add Option
                                        </Button>
                                        <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
                                            Bulk Add
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {selectedQuestion && selectedQuestion.options && selectedQuestion.options.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Option Text</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedQuestion.options.map((option) => (
                                                    <TableRow key={option.id}>
                                                        <TableCell className="font-medium">
                                                            {option.optionText}
                                                        </TableCell>
                                                        <TableCell>
                                                            {option.isCorrect && (
                                                                <Badge className="bg-green-500 hover:bg-green-600">
                                                                    Correct
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => startEditingOption(option)}
                                                                >
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => openDeleteDialog('option', option.id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-muted-foreground">
                                                No options found for this question. Add one to get started.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}

                {/* Category Dialog */}
                <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingCategory ? "Edit Category" : "Add New Category"}
                            </DialogTitle>
                            <DialogDescription>
                                Enter the details for your category
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="categoryName">Category Name</Label>
                                <Input
                                    id="categoryName"
                                    name="categoryName"
                                    value={categoryForm.categoryName}
                                    onChange={handleCategoryFormChange}
                                    placeholder="Enter category name"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isFeatured"
                                    checked={categoryForm.isFeatured}
                                    onCheckedChange={(checked) => handleCategoryCheckboxChange('isFeatured', checked)}
                                />
                                <Label htmlFor="isFeatured">Featured Category</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isActive"
                                    checked={categoryForm.isActive}
                                    onCheckedChange={(checked) => handleCategoryCheckboxChange('isActive', checked)}
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="configLinkId">Config Link ID (Optional)</Label>
                                <Input
                                    id="configLinkId"
                                    name="configLinkId"
                                    type="number"
                                    value={categoryForm.configLinkId || ''}
                                    onChange={handleCategoryFormChange}
                                    placeholder="Enter config link ID"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={editingCategory ? updateCategory : createCategory}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingCategory ? "Update" : "Create")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Question Dialog */}
                <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingQuestion ? "Edit Question" : "Add New Question"}
                            </DialogTitle>
                            <DialogDescription>
                                Enter the details for your question
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="questionText">Question Text</Label>
                                <Textarea
                                    id="questionText"
                                    name="questionText"
                                    value={questionForm.questionText}
                                    onChange={handleQuestionFormChange}
                                    placeholder="Enter question text"
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order">Display Order</Label>
                                <Input
                                    id="order"
                                    name="order"
                                    type="number"
                                    value={questionForm.order}
                                    onChange={handleQuestionFormChange}
                                    placeholder="Enter display order"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={editingQuestion ? updateQuestion : createQuestion}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingQuestion ? "Update" : "Create")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Option Dialog */}
                <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingOption ? "Edit Option" : "Add New Option"}
                            </DialogTitle>
                            <DialogDescription>
                                Enter the details for your option
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="optionText">Option Text</Label>
                                <Input
                                    id="optionText"
                                    name="optionText"
                                    value={optionForm.optionText}
                                    onChange={handleOptionFormChange}
                                    placeholder="Enter option text"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isCorrect"
                                    checked={optionForm.isCorrect}
                                    onCheckedChange={(checked) => handleOptionCheckboxChange('isCorrect', checked)}
                                />
                                <Label htmlFor="isCorrect">This is the correct answer</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOptionDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={editingOption ? updateOption : createOption}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingOption ? "Update" : "Create")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Bulk Options Dialog */}
                <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Multiple Options</DialogTitle>
                            <DialogDescription>
                                Enter one option per line. Add * at the beginning of a line to mark it as the correct answer.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <Textarea
                                value={bulkOptionsText}
                                onChange={(e) => setBulkOptionsText(e.target.value)}
                                placeholder="Option 1&#10;*Option 2 (correct)&#10;Option 3"
                                rows={8}
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleBulkOptionsSubmit}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Options"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
                            <AlertDialogDescription>
                                {getDeleteConfirmMessage()}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );

};

export default CategoryManagerPage;