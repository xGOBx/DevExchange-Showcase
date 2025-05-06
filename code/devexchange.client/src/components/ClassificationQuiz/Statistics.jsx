import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Sector, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, ChevronsLeft } from "lucide-react";
import { Download } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";


const API_URL = import.meta.env.VITE_API_URL;

const Statistics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);
    const [selectedImage, setSelectedImage] = useState('');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [userTrendData, setUserTrendData] = useState([]);
    const [rawUserTrendData, setRawUserTrendData] = useState({});


    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const email = localStorage.getItem('user');
            if (!email) throw new Error('User email not found in localStorage');

            // Fetch user details by email
            const userResponse = await fetch(`${API_URL}/api/securewebsite/user/byemail?email=${email}`);
            if (!userResponse.ok) throw new Error('User not found');
            const userJson = await userResponse.json();
            const userId = userJson.userId;

            // Fetch statistics using userId
            const response = await fetch(
                `${API_URL}/api/AnswerStatistics/config/sorted?userId=${userId}`,
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                }
            );

            if (response.status === 404) throw new Error('You currently have no statistics to display ');
            if (!response.ok) throw new Error('Failed to fetch statistics');

            const allData = await response.json();

            // Process the image paths to use the proxy endpoint
            const processedData = allData.map(category => ({
                ...category,
                images: category.images?.map(image => ({
                    ...image,
                    imagePath: image.imagePath.startsWith('/api')
                        ? `${API_URL}${image.imagePath}`
                        : `${API_URL}/api/UploadManager/image/${encodeURIComponent(category.categoryName.toLowerCase())}/${encodeURIComponent(image.imageName)}`
                })) || [] // Ensure images is always an array
            }));

            setData(processedData);

            const uniqueCategories = processedData.map(item => ({
                configLinkId: item.configLinkId,
                name: item.categoryName,
            }));
            setCategories(uniqueCategories);

            // Fetch user trend data
            const trendResponse = await fetch(
                `${API_URL}/api/AnswerStatistics/user/configlink-user-count?userId=${userId}`,
                {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
                }
            );
            if (trendResponse.ok) {
                const trendData = await trendResponse.json();
                setRawUserTrendData(trendData);

                // Process trend data for initial category
                if (processedData.length > 0) {
                    const defaultCategory = processedData[0].configLinkId;
                    processUserTrendData(trendData, defaultCategory);
                }
            }

            if (processedData.length > 0) {
                const defaultCategory = processedData[0].configLinkId;
                setSelectedCategory(defaultCategory);

                const defaultCategoryData = processedData.find(item => item.configLinkId === defaultCategory);
                if (defaultCategoryData?.images?.length > 0) {
                    setSelectedImage(defaultCategoryData.images[0].imageName);
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const processUserTrendData = (rawData, categoryId) => {
        // Convert categoryId to string as object keys might be strings
        const categoryData = rawData[categoryId.toString()] || rawData[categoryId] || {};

        // Prepare trend data with fallback to 'all_time' if other timeframes are zero
        const processedTrendData = [
            { timeframe: '1 Day', users: categoryData['1_day'] || 0 },
            { timeframe: '3 Days', users: categoryData['3_days'] || 0 },
            { timeframe: '7 Days', users: categoryData['7_days'] || 0 },
            { timeframe: '30 Days', users: categoryData['30_days'] || 0 },
            { timeframe: 'All Time', users: categoryData['all_time'] || 0 }
        ];

        // Filter out entries with zero users, but always keep 'All Time'
        const filteredTrendData = processedTrendData.filter(
            entry => entry.users > 0 || entry.timeframe === 'All Time'
        );

        setUserTrendData(filteredTrendData);
    };

    useEffect(() => {
        fetchInitialData();
    }, []);

    const handleCategoryChange = (value) => {
        const categoryId = parseInt(value);
        setSelectedCategory(categoryId);

        // Find the selected category data from existing data
        const selectedCategoryData = data.find(item => item.configLinkId === categoryId);

        // Reset selected image to the first image in the new category
        if (selectedCategoryData?.images?.length > 0) {
            setSelectedImage(selectedCategoryData.images[0].imageName);
        } else {
            setSelectedImage('');
        }

        // Process user trend data for the new category
        processUserTrendData(rawUserTrendData, categoryId);

        setCurrentQuestionIndex(0);
        setActiveIndex(0);
    };

    const handleImageChange = (value) => {
        setSelectedImage(value);
        setCurrentQuestionIndex(0);
        setActiveIndex(0);
    };

    const handleExport = async (format) => {
        try {
            const email = localStorage.getItem('user');
            if (!email) throw new Error('User email not found in localStorage');

            // Fetch user details by email
            const userResponse = await fetch(`${API_URL}/api/securewebsite/user/byemail?email=${email}`);
            if (!userResponse.ok) throw new Error('User not found');
            const userJson = await userResponse.json();
            const userId = userJson.userId;

            // Create the export URL
            const exportUrl = `${API_URL}/api/AnswerStatistics/export/${format}?userId=${userId}`;

            // Add auth token to the URL if needed
            const token = localStorage.getItem('authToken');
            const finalUrl = token ? `${exportUrl}&token=${token}` : exportUrl;

            // Create a temporary link element and trigger download
            const link = document.createElement('a');
            link.href = finalUrl;
            link.setAttribute('download', `statistics_${format}_${Date.now()}.${format}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            setError(`Failed to export data: ${err.message}`);
        }
    };


    if (loading) {
        return (
            <Card className="w-full max-w-5xl mx-auto mt-8">
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-72" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-12" />
                            <Skeleton className="h-12" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full max-w-5xl mx-auto mt-8">
                <CardContent className="p-6">
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }
    // Find the selected category data
    const selectedCategoryData = data.find(item => item.configLinkId === selectedCategory);
    const selectedImageData = selectedCategoryData?.images?.find(item => item.imageName === selectedImage);
    const currentQuestion = selectedImageData?.questions?.[currentQuestionIndex];


    // Process chart data and handle edge cases
    const pieChartData = currentQuestion?.options?.map((option, index) => {
        // Ensure questionCount is a number to prevent NaN
        const count = typeof option.questionCount === 'number' ? option.questionCount : 0;
        return {
            name: option.optionText || `Option ${index + 1}`,
            value: count,
            id: index,
        };
    }).filter(item => item.value > 0) || [];

    // Calculate total votes for percentage calculation
    const totalVotes = pieChartData.reduce((sum, item) => sum + item.value, 0);

    // Beautiful gradient color scheme
    const COLORS = [
        ['#4158D0', '#C850C0'],
        ['#0093E9', '#80D0C7'],
        ['#8EC5FC', '#E0C3FC'],
        ['#FBAB7E', '#F7CE68'],
        ['#85FFBD', '#FFFB7D'],
        ['#FF9A8B', '#FF6A88'],
    ];

    // Active sector animation
    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

        // Calculate percentage safely
        const percent = totalVotes > 0 ? value / totalVotes : 0;

        // Gradient fill setup
        const colorIndex = payload.id % COLORS.length;
        const gradientId = `pieGradient${colorIndex}`;

        return (
            <g>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={COLORS[colorIndex][0]} />
                        <stop offset="100%" stopColor={COLORS[colorIndex][1]} />
                    </linearGradient>
                </defs>

                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 8}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={`url(#${gradientId})`}
                    stroke="#fff"
                    strokeWidth={2}
                />
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius - 4}
                    outerRadius={innerRadius - 1}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={`url(#${gradientId})`}
                />
                <text x={cx} y={cy + 5} textAnchor="middle" fill="#333" style={{ fontSize: '14px' }}>
                    {value} votes
                </text>
                <text x={cx} y={cy + 25} textAnchor="middle" fill="#333" style={{ fontSize: '14px' }}>
                    {(percent * 100).toFixed(1)}%
                </text>
            </g>
        );
    };
    const handleNext = () => {
        if (currentQuestion && currentQuestionIndex < selectedImageData.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setActiveIndex(0); // Reset active sector
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setActiveIndex(0); // Reset active sector
        }
    };

    const handleBack = () => {
        setCurrentQuestionIndex(0);
        setActiveIndex(0); // Reset active sector
    };

    // Get the active option text for display
    const getActiveOptionText = () => {
        if (pieChartData.length === 0 || activeIndex >= pieChartData.length) {
            return "";
        }
        return pieChartData[activeIndex].name;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-5xl mx-auto">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                    <CardTitle className="text-2xl font-bold text-center">Classification Statistics</CardTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {categories.length > 0 && (
                            <Select value={selectedCategory.toString()} onValueChange={handleCategoryChange}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(category => (
                                        <SelectItem key={category.configLinkId} value={category.configLinkId.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {selectedCategoryData?.images?.length > 0 && (
                            <Select value={selectedImage} onValueChange={handleImageChange}>
                                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                    <SelectValue placeholder="Select image" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedCategoryData.images.map(item => (
                                        <SelectItem key={item.imageName} value={item.imageName}>
                                            {item.imageName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="flex justify-end mt-4">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    className="bg-white/10 border-white/20 text-white"
                                    disabled={!selectedImageData}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Data
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport('json')}>
                                    Export as JSON
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport('csv')}>
                                    Export as CSV
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {!selectedImageData ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                                <div className="rounded-full w-12 h-12 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <ChevronRight className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-lg text-gray-500">Select a category and image to view statistics</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <Card>
                                    <CardContent className="p-0">
                                        <img
                                            src={selectedImageData.imagePath}
                                            alt={selectedImage}
                                            className="w-full h-[400px] object-cover rounded-lg"
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        {currentQuestion && (
                                            <>
                                                <h3 className="text-xl font-semibold mb-4">
                                                    {currentQuestion.questionText}
                                                </h3>
                                                <div className="h-[300px]">
                                                    <ResponsiveContainer>
                                                        <PieChart>
                                                            <defs>
                                                                {COLORS.map((color, index) => (
                                                                    <linearGradient key={`gradient-${index}`} id={`pieGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="0%" stopColor={color[0]} />
                                                                        <stop offset="100%" stopColor={color[1]} />
                                                                    </linearGradient>
                                                                ))}
                                                            </defs>
                                                            <Pie
                                                                activeIndex={activeIndex < pieChartData.length ? activeIndex : 0}
                                                                activeShape={renderActiveShape}
                                                                data={pieChartData}
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={45}
                                                                outerRadius={70}
                                                                dataKey="value"
                                                                onMouseEnter={onPieEnter}
                                                            >
                                                                {pieChartData.map((entry, index) => (
                                                                    <Cell
                                                                        key={`cell-${index}`}
                                                                        fill={`url(#pieGradient${index % COLORS.length})`}
                                                                        stroke="#fff"
                                                                        strokeWidth={1}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value, name) => {
                                                                    return [`${value} votes (${(value / totalVotes * 100).toFixed(1)}%)`, name];
                                                                }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={currentQuestionIndex === 0}
                                    >
                                        <ChevronsLeft className="w-4 h-4 mr-1" />
                                        First
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handlePrev}
                                        disabled={currentQuestionIndex === 0}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-1" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleNext}
                                        disabled={!selectedImageData || currentQuestionIndex === selectedImageData.questions.length - 1}
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                                {selectedImageData?.questions?.length > 0 && (
                                    <span className="text-sm text-gray-500">
                                        Question {currentQuestionIndex + 1} of {selectedImageData.questions.length}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {selectedImageData.questions.map((question, index) => {
                                    const totalVotes = question.options?.reduce(
                                        (sum, opt) => sum + (typeof opt.questionCount === 'number' ? opt.questionCount : 0),
                                        0
                                    ) || 0;

                                    return (
                                        <Card key={index} className={index === currentQuestionIndex ? 'border-primary' : ''}>
                                            <CardContent className="p-6">
                                                <h4 className="text-lg font-medium mb-4">
                                                    {index + 1}. {question.questionText}
                                                </h4>
                                                <div className="space-y-4">
                                                    {question.options?.map((option, optIndex) => {
                                                        const count = typeof option.questionCount === 'number' ? option.questionCount : 0;
                                                        const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;

                                                        return (
                                                            <div key={optIndex} className="space-y-2">
                                                                <div className="flex justify-between text-sm">
                                                                    <span>{option.optionText}</span>
                                                                    <span>{percentage.toFixed(1)}% ({count})</span>
                                                                </div>
                                                                <Progress value={percentage} className="h-2" />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                                {userTrendData.length > 0 && (
                                    <Card className="mt-8">
                                        <CardHeader>
                                            <CardTitle>User Engagement Trends</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={userTrendData}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="timeframe" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="users"
                                                            stroke="#8884d8"
                                                            activeDot={{ r: 8 }}
                                                            name="Unique Users"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
export default Statistics;