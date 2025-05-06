import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap, Mail } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

function Login() {
    document.title = "Login";
    const location = useLocation();
    const navigate = useNavigate();

    // Get the redirect path from state or default to home
    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            // Redirect to the previous page if user is already logged in
            navigate(from, { replace: true });
        }
    }, [from, navigate]);

    return (
        <ScrollArea className="h-screen">
            <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
                {/* Hero Section - Removed negative margin approach */}
                <div className="bg-indigo-600">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover opacity-10" />
                        <div className="relative container mx-auto px-4 py-12">
                            <div className="max-w-2xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <GraduationCap className="w-8 h-8 text-indigo-200" />
                                    <h2 className="text-xl font-semibold text-white">DevExchange</h2>
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
                                    Share Your Code Journey with Fellow Students
                                </h1>
                                <p className="text-indigo-100 text-sm mb-4">
                                    Join our community of student developers. Share your projects, get feedback, and learn from others.
                                </p>
                                <Link to="/register">
                                    <Button variant="secondary" size="default" className="font-semibold">
                                        Start Your Journey
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Form Section - Now with positive margin */}
                <div className="container mx-auto px-4 mt-8 mb-16">
                    <Card className="max-w-md mx-auto shadow-xl">
                        <CardHeader>
                            <CardTitle>Welcome back</CardTitle>
                            <CardDescription>
                                Please enter your credentials to access your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="message text-red-500 text-center mb-4"></div>
                            <form onSubmit={loginHandler} className="space-y-4">
                                <div className="space-y-2">
                                    <Input
                                        type="email"
                                        name="Email"
                                        id="email"
                                        placeholder="Email address"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        name="Password"
                                        id="password"
                                        placeholder="Password"
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Sign in
                                </Button>
                            </form>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <div className="text-sm text-center">
                                <Link to="#" className="text-indigo-600 hover:text-indigo-700">
                                    Forgot your password?
                                </Link>
                            </div>
                            <Separator />
                            <div className="text-sm text-center">
                                Don't have an account?{" "}
                                <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                    Sign up for free
                                </Link>
                            </div>
                        </CardFooter>
                    </Card>
                </div>

                {/* Newsletter Section */}
                <div className="bg-gray-900 py-12">
                    <div className="container mx-auto px-4">
                        <Card className="max-w-2xl mx-auto bg-gray-800 border-gray-700">
                            <CardHeader>
                                <CardTitle className="text-white text-center">Stay Updated</CardTitle>
                                <CardDescription className="text-gray-400 text-center">
                                    Subscribe to our newsletter for the latest updates
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex space-x-2">
                                    <Input
                                        type="email"
                                        placeholder="Enter your email"
                                        className="bg-gray-700 border-gray-600 text-white"
                                    />
                                    <Button className="whitespace-nowrap">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Subscribe
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ScrollArea>
    );

    async function loginHandler(e) {
        e.preventDefault();
        const form_ = e.target;
        const formData = new FormData(form_);
        const dataToSend = Object.fromEntries(formData);
        const messageEl = document.querySelector(".message");

        try {
            const response = await fetch(`${API_URL}/api/securewebsite/login`, {
                method: "POST",
                credentials: "include",
                body: JSON.stringify(dataToSend),
                headers: {
                    "content-type": "application/json",
                    "Accept": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("user", dataToSend.Email);
                localStorage.setItem("isAdmin", data.isAdmin);
                localStorage.setItem("isTrustedWebConnect", data.isTrustedWebConnect);
                localStorage.setItem("isTrustedClassificationQuiz", data.isTrustedClassificationQuiz);

                
                // Navigate to the previous page instead of using document.location
                navigate(from, { replace: true });
            } else {
                messageEl.innerHTML = data.message || "Something went wrong, please try again";
            }
        } catch (error) {
            console.error("Login error:", error);
            messageEl.innerHTML = "Something went wrong, please try again";
        }
    }

}

export default Login;