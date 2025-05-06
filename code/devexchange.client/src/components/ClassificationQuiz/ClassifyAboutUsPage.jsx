import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    PuzzleIcon,
    BrainIcon,
    DatabaseIcon,
    LayersIcon,
    CheckCircleIcon,
    UsersIcon,
    SearchIcon,
    SchoolIcon,
    RocketIcon,
    ArrowRightIcon
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ClassifyAboutUsPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Hero Section with Gradient */}
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white py-20">
                <div className="max-w-5xl mx-auto px-6 space-y-4">
                    <Badge variant="outline" className="mb-2 text-white border-white/40 px-4 py-1">
                        Interactive Classification Platform
                    </Badge>
                    <h1 className="text-5xl font-bold tracking-tight mb-4">ClassiQuest</h1>
                    <p className="text-xl opacity-90 max-w-2xl">
                        Turn object classification into an engaging learning experience through interactive quizzes
                    </p>
                    <div className="pt-4 flex gap-4">
                        <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90">
                            Start Classifying
                        </Button>
                        <Button size="lg" variant="outline" className="text-white border-white">
                            How It Works
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mission Statement in Card */}
            <div className="max-w-5xl mx-auto px-6 -mt-10">
                <Card className="border-none shadow-lg mb-16">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center p-4">
                            <Badge variant="secondary" className="mb-4">Our Mission</Badge>
                            <h2 className="text-3xl font-bold text-center mb-4">Classification Made Fun</h2>
                            <p className="text-lg text-center text-muted-foreground max-w-3xl">
                                ClassiQuest transforms the tedious task of identifying and classifying object parts into an
                                interactive, game-like experience. Through engaging quizzes, we gather valuable
                                classification data while making learning enjoyable and meaningful.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* How It Works */}
                <div className="mb-16">
                    <div className="flex flex-col items-center mb-8">
                        <Badge variant="secondary" className="mb-2">Process</Badge>
                        <h2 className="text-3xl font-bold text-center">How ClassiQuest Works</h2>
                        <Separator className="w-24 mt-4 mb-8" />
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        <Card className="border border-purple-100">
                            <CardHeader className="items-center text-center pb-2">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                    <LayersIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <CardTitle className="text-lg">1. Object Selection</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-center text-sm">
                                    Choose from our library of objects needing classification or upload your own.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-purple-100">
                            <CardHeader className="items-center text-center pb-2">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                    <PuzzleIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <CardTitle className="text-lg">2. Take the Quiz</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-center text-sm">
                                    Engage with our interactive quiz to identify and categorize different parts.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-purple-100">
                            <CardHeader className="items-center text-center pb-2">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                    <CheckCircleIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <CardTitle className="text-lg">3. Submit Answers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-center text-sm">
                                    Complete classifications and see how your answers compare with established patterns.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-purple-100">
                            <CardHeader className="items-center text-center pb-2">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                    <DatabaseIcon className="h-6 w-6 text-purple-600" />
                                </div>
                                <CardTitle className="text-lg">4. Data Collection</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-center text-sm">
                                    Your inputs help build a comprehensive classification database for research and AI training.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Data Collection Section */}
                <Card className="mb-16 border-none shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                        <div className="flex items-center gap-2 mb-2">
                            <DatabaseIcon className="h-5 w-5 text-purple-600" />
                            <Badge>Data Impact</Badge>
                        </div>
                        <CardTitle>Your Contributions Matter</CardTitle>
                        <CardDescription>
                            Every classification you make helps build our comprehensive database
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            <p className="text-muted-foreground">
                                Every classification you make contributes to our growing database of labeled objects. This data helps:
                            </p>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex items-start gap-3">
                                    <RocketIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <p className="text-sm">Train machine learning models for automated classification</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <SearchIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <p className="text-sm">Improve object recognition systems in various domains</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <SchoolIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <p className="text-sm">Create educational resources about object structures</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <DatabaseIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                                    <p className="text-sm">Build a comprehensive taxonomy of object classifications</p>
                                </div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
                                <p className="text-sm"><span className="font-semibold">Data Privacy:</span> All contributions are anonymized. We never collect personally identifiable information through the quiz system.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Who We Serve Section */}
                <div className="mb-16">
                    <div className="flex flex-col items-center mb-8">
                        <Badge variant="secondary" className="mb-2">Users</Badge>
                        <h2 className="text-3xl font-bold text-center">Who Benefits</h2>
                        <Separator className="w-24 mt-4 mb-8" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="border border-purple-100">
                            <CardHeader className="pb-2">
                                <SchoolIcon className="h-8 w-8 text-purple-600 mb-2" />
                                <CardTitle>Educational Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Students and educators who want to learn about object structures through interactive experiences.
                                    Our quizzes make learning taxonomy and classification engaging and memorable.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-purple-100">
                            <CardHeader className="pb-2">
                                <DatabaseIcon className="h-8 w-8 text-purple-600 mb-2" />
                                <CardTitle>Data Scientists</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Researchers and AI developers seeking high-quality labeled data for training classification
                                    models. Our platform generates valuable datasets through crowd-sourced expertise.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-purple-100">
                            <CardHeader className="pb-2">
                                <BrainIcon className="h-8 w-8 text-purple-600 mb-2" />
                                <CardTitle>Curious Learners</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Anyone who enjoys interactive learning experiences. Turn your spare time into a productive
                                    activity that contributes to science while expanding your knowledge of how things work.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Join Community CTA */}
                <Card className="border-none bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-xl mb-16">
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col items-center text-center">
                            <UsersIcon className="h-12 w-12 mb-4 opacity-80" />
                            <h2 className="text-3xl font-bold mb-4">Join Our Classification Community</h2>
                            <p className="text-lg opacity-90 max-w-xl mb-8">
                                Be part of a growing network of classifiers who are advancing knowledge while learning.
                                Start your journey to become a classification expert today.
                            </p>
                            <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 font-semibold group">
                                Start Your First Quiz <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
                    <Card className="border-none shadow-md text-center">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-3xl font-bold text-purple-600">50K+</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Active Users</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md text-center">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-3xl font-bold text-purple-600">2.3M</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Classifications Made</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md text-center">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-3xl font-bold text-purple-600">320+</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Object Categories</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md text-center">
                        <CardHeader className="pb-0">
                            <CardTitle className="text-3xl font-bold text-purple-600">98%</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Data Accuracy</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto bg-slate-900 text-white py-12">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-xl font-bold">ClassiQuest</h3>
                            <p className="text-slate-400">Classification through Interactive Learning</p>
                        </div>
                        <div className="flex gap-6">
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">About</Button>
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Quizzes</Button>
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Learn</Button>
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Contact</Button>
                        </div>
                    </div>
                    <Separator className="my-6 bg-slate-700" />
                    <div className="text-center text-slate-400">
                        <p>© {new Date().getFullYear()} ClassiQuest. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassifyAboutUsPage;