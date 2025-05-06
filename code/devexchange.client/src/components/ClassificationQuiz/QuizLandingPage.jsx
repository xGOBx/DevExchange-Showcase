import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast, Toaster } from "sonner";

import {
    Search,
    BookOpen,
    Target,
    Clock,
    ArrowRight,
    Layout,
    Database,
    CheckCircle,
    Upload,
    Users,
    BarChart,
    Star
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

// Memoized category card component to prevent unnecessary re-renders
const CategoryCard = React.memo(({ category, onCategoryClick, apiUrl }) => (
    <Card
        className="group overflow-hidden rounded-xl border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => onCategoryClick(category.configLinkId)}
    >
        <div className="aspect-video relative overflow-hidden">
            {category.imagePath ? (
                <>
                    <img
                        src={`${apiUrl}${category.imagePath}`}
                        alt={category.categoryName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-theme-2/10 to-purple-100/30 dark:from-theme-2/20 dark:to-purple-900/20">
                    <BookOpen className="h-12 w-12 text-theme-2/60" />
                </div>
            )}

            <div className="absolute top-3 right-3">
                <span className="text-xs font-medium bg-black/50 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                    Classification Quiz
                </span>
            </div>
        </div>
        <CardContent className="p-6">
            <h4 className="text-xl font-semibold text-foreground group-hover:text-theme-2 transition-colors">
                {category.categoryName}
            </h4>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
                {category.categoryName}
            </p>
            <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                    <Database className="h-4 w-4 mr-1" />
                    Help classify data
                </div>
                <span className="inline-flex items-center text-sm font-medium text-theme-2">
                    Start Quiz
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </span>
            </div>
        </CardContent>
    </Card>
));

const QuizLandingPage = () => {
    const navigate = useNavigate();
    const [categoriesByUser, setCategoriesByUser] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCategories, setTotalCategories] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const fetchCategories = useCallback(async () => {
        try {
            // Fetch categories
            const response = await fetch(`${API_URL}/api/UploadManager/Get-Featured-Categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategoriesByUser(data.categoriesByUser);

            // Use the new API endpoint to get total categories count
            const countResponse = await fetch(`${API_URL}/api/CategoryController/categories/count`);
            if (!countResponse.ok) throw new Error('Failed to fetch category count');
            const countData = await countResponse.json();

            // Check if the response is an object with totalCount property or a direct number
            const totalCount = typeof countData === 'object' && countData.totalCount !== undefined
                ? countData.totalCount
                : typeof countData === 'object' && countData.TotalCount !== undefined
                    ? countData.TotalCount
                    : countData;

            setTotalCategories(totalCount);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, []);
    // Efficient categories fetching with useEffect
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Memoized filtered categories to prevent unnecessary recalculations
    const filteredCategories = useMemo(() => {
        return categoriesByUser
            .map(userGroup => ({
                ...userGroup,
                categories: userGroup.categories.filter(category =>
                    category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
                )
            }))
            .filter(userGroup => userGroup.categories.length > 0);
    }, [categoriesByUser, searchTerm]);

    // Memoized handleCategoryClick to prevent unnecessary re-renders
    const handleCategoryClick = useCallback((configLinkId) => {
        navigate(`/ImageQuiz/${configLinkId}`);
    }, [navigate]);

    // Memoized handleGetVerified to prevent unnecessary re-renders
    const handleGetVerified = useCallback(async () => {
        const isLogged = localStorage.getItem("user");
        if (!isLogged) {
            navigate('/login');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/api/securewebsite/CheckUserReturnId`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error("Authentication Failed", {
                        description: "You are not logged in. Please log in and try again.",
                        duration: 5000
                    });
                    navigate('/login');
                    return;
                }
                const errorData = await response.text(); 
                console.error('Full error response:', errorData);
                throw new Error(errorData || 'Failed to retrieve user ID');
            }

            const userData = await response.json();
            const userId = userData.userId;

            const verificationResponse = await fetch(`${API_URL}/api/WebsiteEmail/sendVerificationEmail`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId
                })
            });

            if (!verificationResponse.ok) {
                const errorData = await verificationResponse.text();
                console.error('Verification error response:', errorData);
                throw new Error(errorData || 'Failed to send verification email');
            }

            const successData = await verificationResponse.json();
            toast.success("Verification Email Sent", {
                description: successData.message || "Check your inbox and click the verification link to get verified.",
                duration: 5000
            });
        } catch (error) {
            console.error('Full verification process error:', error);
            toast.error("Verification Failed", {
                description: error.message || "An unexpected error occurred",
                duration: 5000
            });
        }
    }, [navigate]);

    return (
        <>

            <Toaster richColors />

            <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
                {/* Hero Section */}
                <div className="relative overflow-hidden bg-gradient-to-r from-theme-2/10 to-purple-100/30 dark:from-theme-2/20 dark:to-purple-900/20">
                    <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,transparent)] dark:bg-grid-slate-700/30"></div>
                    <div className="max-w-7xl mx-auto px-4 py-24 relative">
                        <div className="max-w-3xl">
                            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-theme-2/10 text-theme-2 mb-6">
                                <Star className="mr-1 h-3.5 w-3.5" />
                                Interactive Learning Platform
                            </span>
                            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
                                Help Us <span className="text-theme-2">Collect Classification Data</span> Together
                            </h1>
                            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                                Join our collaborative effort to classify data across diverse subject areas. Contribute your expertise while enhancing your knowledge through our community-driven classification system.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    size="lg"
                                    className="bg-theme-2 hover:bg-theme-2/90 text-white font-medium rounded-lg px-8"
                                    onClick={() => navigate('/AllActiveCategoriesPage')}
                                >
                                    Explore Quizzes
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                                >
                                    How It Works
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Abstract decorative elements */}
                    <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-theme-2/20 rounded-full blur-3xl"></div>
                    <div className="absolute top-20 -right-20 w-72 h-72 bg-purple-300/20 dark:bg-purple-700/20 rounded-full blur-3xl"></div>
                </div>

                {/* Stats Bar */}
                <div className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-8">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-theme-2">{totalCategories}+</p>
                                <p className="text-sm text-muted-foreground mt-1">Categories</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-theme-2">1000+</p>
                                <p className="text-sm text-muted-foreground mt-1">Questions</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-theme-2">10k+</p>
                                <p className="text-sm text-muted-foreground mt-1">Classifications</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-theme-2">500+</p>
                                <p className="text-sm text-muted-foreground mt-1">Contributors</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Platform Explanation / How It Works Section */}
                <div className="py-24 bg-white dark:bg-slate-800">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-theme-2/10 text-theme-2 mb-2">
                                About Our Platform
                            </span>
                            <h2 className="text-3xl font-bold mb-4">Classification Through Interactive Quizzes</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Our platform combines fun quizzes with valuable data collection. Take quizzes to help classify data
                                or create your own classification challenges once verified.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="rounded-xl overflow-hidden shadow-lg">
                                <div className="aspect-video bg-gradient-to-br from-theme-2/10 to-purple-100/30 dark:from-theme-2/20 dark:to-purple-900/20 flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-4 p-8 w-full">
                                        <div className="aspect-square bg-white dark:bg-slate-700 rounded-lg shadow-sm flex items-center justify-center">
                                            <Target className="h-12 w-12 text-theme-2" />
                                        </div>
                                        <div className="aspect-square bg-white dark:bg-slate-700 rounded-lg shadow-sm flex items-center justify-center">
                                            <Upload className="h-12 w-12 text-theme-2" />
                                        </div>
                                        <div className="aspect-square bg-white dark:bg-slate-700 rounded-lg shadow-sm flex items-center justify-center">
                                            <Database className="h-12 w-12 text-theme-2" />
                                        </div>
                                        <div className="aspect-square bg-white dark:bg-slate-700 rounded-lg shadow-sm flex items-center justify-center">
                                            <BarChart className="h-12 w-12 text-theme-2" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold mb-6">Collect Classification Data While Having Fun</h3>
                                <p className="text-lg text-muted-foreground mb-6">
                                    Our platform is designed to make classification data collection engaging and interactive. Through gamified quizzes, we're building comprehensive datasets while providing a fun experience.
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex">
                                        <CheckCircle className="h-6 w-6 text-theme-2 mt-0.5 mr-3 flex-shrink-0" />
                                        <span>Take existing quizzes to contribute to classification datasets</span>
                                    </li>
                                    <li className="flex">
                                        <CheckCircle className="h-6 w-6 text-theme-2 mt-0.5 mr-3 flex-shrink-0" />
                                        <span>Get verified to create and upload your own classification quizzes</span>
                                    </li>
                                    <li className="flex">
                                        <CheckCircle className="h-6 w-6 text-theme-2 mt-0.5 mr-3 flex-shrink-0" />
                                        <span>Collect data on subjects that matter to you through custom quizzes</span>
                                    </li>
                                    <li className="flex">
                                        <CheckCircle className="h-6 w-6 text-theme-2 mt-0.5 mr-3 flex-shrink-0" />
                                        <span>Help improve machine learning models with your classifications</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Section */}
                <div id="categories" className="max-w-7xl mx-auto px-4 py-24">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                        <div>
                            <span className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-theme-2/10 text-theme-2 mb-2">
                                Quiz Categories
                            </span>
                            <h2 className="text-3xl font-bold text-foreground">
                                Browse Our Collection
                            </h2>
                            <p className="text-muted-foreground mt-2">
                                {totalCategories} diverse categories to explore and contribute classification data
                            </p>
                        </div>
                        <div className="w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search for specific categories..."
                                    className="pl-10 w-full md:w-[350px] border-slate-300 dark:border-slate-700 rounded-lg"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2 mt-4 flex-wrap">
                                <Button
                                    variant={activeTab === 'all' ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setActiveTab('all')}
                                    className={activeTab === 'all' ? "bg-theme-2" : ""}
                                >
                                    All Categories
                                </Button>
                                <Button
                                    variant={activeTab === 'popular' ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setActiveTab('popular')}
                                    className={activeTab === 'popular' ? "bg-theme-2" : ""}
                                >
                                    Popular
                                </Button>
                                <Button
                                    variant={activeTab === 'new' ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setActiveTab('new')}
                                    className={activeTab === 'new' ? "bg-theme-2" : ""}
                                >
                                    Newest
                                </Button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="rounded-xl overflow-hidden">
                                    <Skeleton className="h-48 w-full" />
                                    <div className="p-4 space-y-3">
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <Alert variant="destructive" className="rounded-lg">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-16">
                            {filteredCategories.map((userGroup) => (
                                <div key={userGroup.userId} className="space-y-6">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-foreground">
                                            {userGroup.userName}'s Quizzes
                                        </h3>
                                        <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                            {userGroup.categories.length} quizzes
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {userGroup.categories.map((category) => (
                                            <CategoryCard
                                                key={category.id}
                                                category={category}
                                                onCategoryClick={handleCategoryClick}
                                                apiUrl={API_URL}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CTA Section */}
                <div className="bg-gradient-to-r from-theme-2/20 to-purple-100/30 dark:from-theme-2/30 dark:to-purple-900/30 py-20">
                    <div className="max-w-5xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-4">Ready to Contribute to Classification Data?</h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Join our community of quiz-takers and creators to help build valuable datasets while having fun.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                size="lg"
                                className="bg-theme-2 hover:bg-theme-2/90 text-white font-medium rounded-lg px-8"
                                onClick={() => document.getElementById('categories').scrollIntoView({ behavior: 'smooth' })}
                            >
                                Take a Quiz
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                                onClick={handleGetVerified}
                            >
                                Get Verified to Create
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Newsletter */}
                <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                    <div className="max-w-3xl mx-auto py-16 px-4">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-foreground mb-3">
                                Stay Updated
                            </h3>
                            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                                Subscribe to receive notifications about new classification quizzes and opportunities to contribute.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <Input
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="flex-1 border-slate-300 dark:border-slate-700 rounded-lg"
                                />
                                <Button className="bg-theme-2 hover:bg-theme-2/90 rounded-lg whitespace-nowrap">
                                    Subscribe
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                                We respect your privacy. Unsubscribe at any time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default QuizLandingPage;