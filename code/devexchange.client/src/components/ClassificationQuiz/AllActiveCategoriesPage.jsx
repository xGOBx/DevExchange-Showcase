import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Search,
    BookOpen,
    Database,
    ArrowRight,
    FilterIcon
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const AllActiveCategoriesPage = () => {
    const navigate = useNavigate();
    const [categoriesByUser, setCategoriesByUser] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCategories, setTotalCategories] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAllActiveCategories();
    }, []);

    const fetchAllActiveCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/api/UploadManager/Get-Active-Categories`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            setCategoriesByUser(data.categoriesByUser);
            setTotalCategories(data.totalCategories);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleCategoryClick = (configLinkId) => {
        navigate(`/ImageQuiz/${configLinkId}`);
    };

    const filteredCategories = categoriesByUser.map(userGroup => ({
        ...userGroup,
        categories: userGroup.categories.filter(category =>
            category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(userGroup => userGroup.categories.length > 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-theme-2/10 to-purple-100/30 dark:from-theme-2/20 dark:to-purple-900/20 py-16">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            All Active Categories
                        </h1>
                        <p className="text-lg text-muted-foreground mb-6">
                            Browse our complete collection of active classification quizzes
                        </p>
                        <Button
                            onClick={() => navigate('/Quizlandingpage')}
                            variant="outline"
                            className="border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                        >
                            Back to Featured Categories
                        </Button>
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">
                            Browse All Categories
                        </h2>
                        <p className="text-muted-foreground mt-2">
                            {totalCategories} active categories available for classification
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
                                        {userGroup.userName}'s Collection
                                    </h3>
                                    <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                                        {userGroup.categories.length} quizzes
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {userGroup.categories.map((category) => (
                                        <Card
                                            key={category.id}
                                            className="group overflow-hidden rounded-xl border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer"
                                            onClick={() => handleCategoryClick(category.configLinkId)}
                                        >
                                            <div className="aspect-video relative overflow-hidden">
                                                {category.imagePath ? (
                                                    <>
                                                        <img
                                                            src={`${API_URL}${category.imagePath}`}
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
                                                    Contribute to classification data while testing your knowledge
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
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {filteredCategories.length === 0 && !loading && !error && (
                    <div className="text-center py-16">
                        <FilterIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold">No matching categories found</h3>
                        <p className="text-muted-foreground mt-2">Try adjusting your search term</p>
                    </div>
                )}
            </div>

            {/* Simple Footer */}
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Browse all active classification quizzes available on our platform.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AllActiveCategoriesPage;