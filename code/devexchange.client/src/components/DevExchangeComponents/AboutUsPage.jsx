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
    RocketIcon,
    GlobeIcon,
    UsersIcon,
    LightbulbIcon,
    CheckCircleIcon,
    GraduationCapIcon,
    CodeIcon,
    SearchIcon
} from "lucide-react";

const AboutUsPage = () => {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Hero Section with Gradient */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-20">
                <div className="max-w-5xl mx-auto px-6 space-y-4">
                    <Badge variant="outline" className="mb-2 text-white border-white/40 px-4 py-1">
                        Student Developer Platform
                    </Badge>
                    <h1 className="text-5xl font-bold tracking-tight mb-4">Welcome to DevExchange</h1>
                    <p className="text-xl opacity-90 max-w-2xl">
                        Connecting student developers and showcasing innovative projects
                    </p>
                    <div className="pt-4">
                        <Button size="lg" className="bg-white text-blue-700 hover:bg-white/90">
                            Get Started
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
                            <h2 className="text-3xl font-bold text-center mb-4">Building Connections</h2>
                            <p className="text-lg text-center text-muted-foreground max-w-3xl">
                                DevExchange is a platform built by students, for students. We believe in making student projects
                                more accessible, discoverable, and connected across diverse backgrounds and disciplines.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                {/* Feature Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 mb-2">
                                <RocketIcon className="h-5 w-5 text-blue-600" />
                                <Badge variant="outline">Feature</Badge>
                            </div>
                            <CardTitle className="text-2xl">Showcase Your Work</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Upload or link your programs, websites, and applications to gain visibility.
                                We provide a centralized hub where your creativity can shine.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" className="gap-1">
                                Learn more <span className="text-lg">→</span>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2 mb-2">
                                <GlobeIcon className="h-5 w-5 text-blue-600" />
                                <Badge variant="outline">Feature</Badge>
                            </div>
                            <CardTitle className="text-2xl">Discover & Connect</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">
                                Find projects and fellow developers from various backgrounds.
                                Explore solutions you might never have discovered otherwise.
                            </p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="ghost" className="gap-1">
                                Learn more <span className="text-lg">→</span>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                {/* Who We Serve Section */}
                <div className="mb-16">
                    <div className="flex flex-col items-center mb-8">
                        <Badge variant="secondary" className="mb-2">Community</Badge>
                        <h2 className="text-3xl font-bold text-center">Who We Serve</h2>
                        <Separator className="w-24 mt-4 mb-8" />
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <Card className="border border-blue-100">
                            <CardHeader className="pb-2">
                                <GraduationCapIcon className="h-8 w-8 text-blue-600 mb-2" />
                                <CardTitle>Students from All Backgrounds</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Whether you're studying computer science, design, business, or any other field,
                                    DevExchange welcomes projects from all disciplines and skill levels.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-blue-100">
                            <CardHeader className="pb-2">
                                <CodeIcon className="h-8 w-8 text-blue-600 mb-2" />
                                <CardTitle>Project Creators</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Looking for recognition? Need feedback? Want to build your portfolio?
                                    Upload your work and connect with peers who appreciate your innovation.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border border-blue-100">
                            <CardHeader className="pb-2">
                                <SearchIcon className="h-8 w-8 text-blue-600 mb-2" />
                                <CardTitle>Project Seekers</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    Searching for inspiration or collaboration opportunities?
                                    Browse our diverse collection of student-created projects to find what you need.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Why DevExchange Section */}
                <div className="mb-16">
                    <Card className="overflow-hidden border-none shadow-xl">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-1"></div>
                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                            <div className="flex items-center gap-2 mb-2">
                                <LightbulbIcon className="h-5 w-5 text-blue-600" />
                                <Badge>Unique Value</Badge>
                            </div>
                            <CardTitle className="text-2xl">Why DevExchange?</CardTitle>
                            <CardDescription>What makes our platform unique</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 pb-8">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <p>Student-focused community that understands your needs</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <p>Easy project submission and linking process</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <p>Cross-disciplinary discovery to expand your horizons</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <p>Opportunity to showcase your work to peers and potential employers</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Join Community CTA */}
                <Card className="border-none bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl mb-16">
                    <CardContent className="pt-8 pb-8">
                        <div className="flex flex-col items-center text-center">
                            <UsersIcon className="h-12 w-12 mb-4 opacity-80" />
                            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
                            <p className="text-lg opacity-90 max-w-xl mb-8">
                                DevExchange is more than a platform—it's a community of innovative student developers
                                ready to share, learn, and grow together.
                            </p>
                            <Button size="lg" className="bg-white text-blue-700 hover:bg-white/90 font-semibold">
                                Get Started Today
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="mt-auto bg-slate-900 text-white py-12">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="mb-4 md:mb-0">
                            <h3 className="text-xl font-bold">DevExchange</h3>
                            <p className="text-slate-400">Connecting Student Developers</p>
                        </div>
                        <div className="flex gap-6">
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">About</Button>
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Projects</Button>
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Community</Button>
                            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">Contact</Button>
                        </div>
                    </div>
                    <Separator className="my-6 bg-slate-700" />
                    <div className="text-center text-slate-400">
                        <p>© {new Date().getFullYear()} DevExchange. All rights reserved.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AboutUsPage;