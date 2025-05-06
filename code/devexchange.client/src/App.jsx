import React from 'react';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Route, Routes, BrowserRouter, Link, useLocation } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import TrustedClassificationQuizRoutes from './routes/TrustedClassificationQuizRoutes';
import TrustedWebConnectRoutes from './routes/TrustedWebConnectRoutes';
import { Home as HomeIcon, User, LogOut, Lock, Settings,Info } from 'lucide-react';
import AllActiveCategoriesPage from './components/ClassificationQuiz/AllActiveCategoriesPage';
import ProtectedRoutes from './routes/ProtectedRoutes';
import './App.css';
import Home from './components/DevExchangeComponents/Home';
import Admin from './components/DevExchangeComponents/Admin';
import Login from './components/Login';
import Register from './components/Register';
import UploadManager from './components/ClassificationQuiz/UploadManager';
import QuizLandingPage from './components/ClassificationQuiz/QuizLandingPage';
import ImageQuiz from './components/ClassificationQuiz/ImageQuiz';
import Statistics from './components/ClassificationQuiz/Statistics';
import WebsiteConnectionForm from './components/DevExchangeComponents/WebsiteConnectionForm';
import ExploreProjects from './components/DevExchangeComponents/ExploreProjects';
import SubNavBar from './components/SubNavBar';
import { Upload, BarChart } from 'lucide-react';
import AboutUsPage from './components/DevExchangeComponents/AboutUsPage';
import CategoryManager from './components/ClassificationQuiz/CategoryManager';
import { Toaster } from "@/components/ui/sonner";
import ClassificationQuizVerification from './components/ClassificationQuiz/ClassificationQuizVerification';
import WebConnectVerification from './components/DevExchangeComponents/WebConnectVerification';
import GetVerifiedPage from './components/DevExchangeComponents/GetVerifiedPage';
import UserProfile from './components/DevExchangeComponents/UserProfile';
import ClassifyAboutUsPage from './components/ClassificationQuiz/ClassifyAboutUsPage';


const API_URL = import.meta.env.VITE_API_URL;

// Custom NavLink component that works with shadcn NavigationMenuLink
const NavLink = ({ to, children, icon }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <NavigationMenuItem>
            <Link to={to}>
                <NavigationMenuLink
                    className={`group inline-flex h-10 w-max items-center justify-center rounded-lg px-4 py-2 text-white transition-colors ${isActive
                        ? "bg-blue-800 font-medium"
                        : "bg-transparent hover:bg-blue-700/70"
                        }`}
                >
                    {icon && <span className="mr-2">{icon}</span>}
                    {children}
                </NavigationMenuLink>
            </Link>
        </NavigationMenuItem>
    );
};

function Navigation() {
    const location = useLocation();
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const isTrustedWebConnect = localStorage.getItem("isTrustedWebConnect") === "true";
    const isTrustedClassificationQuiz = localStorage.getItem("isTrustedClassificationQuiz") === "true";
    const isLogged = localStorage.getItem("user");
    const userEmail = localStorage.getItem("userEmail") || "";

    // Get first letter of email for avatar (if available)
    const userInitial = isLogged ? isLogged.charAt(0).toUpperCase() : "U";

    // This will force the component to re-render when the location changes
    const navigationKey = `nav-${location.pathname}`;

    const logout = async () => {
        try {
            const response = await fetch(`${API_URL}/api/securewebsite/logout`, {
                method: "GET",
                credentials: "include"
            });

            if (response.ok) {
                localStorage.removeItem("user");
                localStorage.removeItem("sessionId");
                localStorage.removeItem("quizProgress_1");
                localStorage.removeItem("isAdmin");
                localStorage.removeItem("isTrustedWebConnect");
                localStorage.removeItem("Admin");
                localStorage.removeItem("loglevel");
                localStorage.removeItem("true");
                localStorage.removeItem("INFO");
                localStorage.removeItem("isTrustedClassificationQuiz");
                localStorage.removeItem("userEmail");

                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('quizProgress_')) {
                        localStorage.removeItem(key);
                    }
                });

                window.location.href = "/login";
            } else {
                console.error("Could not log out:", response);
            }
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div key={navigationKey} className="border-b border-border/40 shadow-sm z-50 bg-gradient-to-r from-theme-2 to-theme-1">
            <div className="container mx-auto flex h-16 items-center px-4 max-w-7xl">
                <div className="text-white font-bold text-xl mr-6">DevExchange</div>
                <NavigationMenu>
                    <NavigationMenuList className="space-x-2">
                        <NavLink to="/" icon={<HomeIcon size={16} />}>Home</NavLink>
                        {isLogged && isAdmin && (
                            <NavLink to="/admin" icon={<Lock size={16} />}>Admin</NavLink>
                        )}
                     
                        <NavLink to="/AboutUsPage" icon={<Info size={16} />}>
                            About Us
                        </NavLink>
                    </NavigationMenuList>
                </NavigationMenu>

                <div className="ml-auto flex items-center space-x-4">
                    {isLogged ? (
                        <>
                            {/* Profile Avatar Button */}
                            <Link to="/UserProfile" className="relative rounded-full h-10 w-10 flex items-center justify-center bg-blue-700 hover:bg-blue-800 transition-colors text-white font-medium text-lg">
                                {userInitial}
                            </Link>
                            <Button
                                onClick={logout}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <LogOut size={16} />
                                Log Out
                            </Button>
                        </>
                    ) : (
                        <NavigationMenu>
                            <NavigationMenuList className="space-x-2">
                                <NavLink to="/login" icon={<User size={16} />}>Login</NavLink>
                                <NavLink to="/register">Register</NavLink>
                            </NavigationMenuList>
                        </NavigationMenu>
                    )}
                </div>
            </div>
        </div>
    );
}

function NotFound() {
    return (
        <div>
            <header>
                <h1>Not Found</h1>
            </header>
            <p>
                <Link to="/">Back to Home</Link>
            </p>
        </div>
    );
}

// Wrapper for routes that need the SubNavBar
function QuizNavBarWrapper({ children, title, navItems }) {
    return (
        <>
            <SubNavBar title={title} navItems={navItems} />
            {children}
        </>
    );
}

function AppLayout() {
    const location = useLocation();

    // Function to determine if the current route should use SubNavBar
    const shouldUseSubNav = () => {
        // Check if current path is a route that should use SubNavBar
        return location.pathname === '/QuizLandingPage' ||
            location.pathname.startsWith('/ImageQuiz') ||
            location.pathname === '/uploadManager' ||
            location.pathname === '/statistics' ||
            location.pathname === '/AllActiveCategoriesPage' ||
            location.pathname === '/CategoryManager' ||
            location.pathname === '/ClassifyAboutUsPage';



    };

    const getQuizNavItems = () => {
        // Check if user has trusted classification quiz permissions
        const isTrustedClassificationQuiz = localStorage.getItem("isTrustedClassificationQuiz") === "true";

        // Base navigation items
        const items = [];

        // Add navigation items specific to ImageQuiz
        if (location.pathname.startsWith('/ImageQuiz')) {
            items.push({
                path: '/QuizLandingPage',
                label: 'Back to Categories',
                alwaysShow: true
            });
        }

        // Add Upload Manager and Statistics for trusted users on ALL quiz-related pages
        if (isTrustedClassificationQuiz) {
            items.push(
                {
                    path: '/uploadManager',
                    label: 'Upload Manager',
                    icon: <Upload className="mr-2 h-4 w-4" />,
                    alwaysShow: false
                },
                {
                    path: '/statistics',
                    label: 'Statistics',
                    icon: <BarChart className="mr-2 h-4 w-4" />,
                    alwaysShow: false
                }
            );
        }

        return items;
    };

    const getQuizTitle = () => {
        if (location.pathname === '/QuizLandingPage') return 'Classification Quiz';
        if (location.pathname.startsWith('/ImageQuiz')) return 'Image Quiz';
        if (location.pathname === '/uploadManager') return 'Upload Manager';
        if (location.pathname === '/statistics') return 'Quiz Statistics';
        if (location.pathname === '/AllActiveCategoriesPage') return 'All Categories ';
        if (location.pathname === '/CategoryManager') return 'Category Manager ';
        if (location.pathname === '/ClassifyAboutUsPage') return 'About Us ';


        return '';
    };

    return (
        <section className="min-h-screen bg-background text-foreground">
            {/* Display either the main navigation or SubNavBar based on the route */}
            {shouldUseSubNav() ? (
                <SubNavBar
                    title={getQuizTitle()}
                />
            ) : (
                <Navigation />
            )}

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/home" element={<Home />} />
                <Route path="/QuizLandingPage" element={<QuizLandingPage />} />
                <Route path="/ImageQuiz" element={<ImageQuiz />} />
                <Route path="/ImageQuiz/:configLinkId" element={<ImageQuiz />} />
                <Route path="/ExploreProjects" element={<ExploreProjects />} />
                <Route path="/AllActiveCategoriesPage" element={<AllActiveCategoriesPage />} />
                <Route path="/AboutUsPage" element={<AboutUsPage />} />
                <Route path="/ClassifyAboutUsPage" element={<ClassifyAboutUsPage />} />



                <Route element={<ProtectedRoutes />}>
                    <Route path="/verify-classification-quiz" element={<ClassificationQuizVerification />} />
                    <Route path="/verify-web-connect" element={<WebConnectVerification />} />
                    <Route path="/get-verified-web" element={<GetVerifiedPage />} />
                    <Route path="/UserProfile" element={<UserProfile />} />

                    {/* Admin Routes - Highest Security Level */}
                    <Route element={<AdminRoutes />}>
                        <Route path="/admin" element={<Admin />} />
                    </Route>

                    {/* Trusted User Routes */}
                    <Route element={<TrustedWebConnectRoutes />}>
                        <Route path="/WebsiteConnectionForm" element={<WebsiteConnectionForm />} />
                    </Route>

                    {/* Trusted Classification Quiz Routes */}
                    <Route element={<TrustedClassificationQuizRoutes />}>
                        <Route path="/statistics" element={<Statistics />} />
                        <Route path="/uploadManager" element={<UploadManager />} />
                        <Route path="/CategoryManager" element={<CategoryManager />} />

                    </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>

        </section>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}

export default App;