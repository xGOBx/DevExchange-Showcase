import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuLink
} from "@/components/ui/navigation-menu";
import { Home, LogIn, LogOut, FolderOpen, ChevronDown, ChevronUp, BarChart, Upload, List, Info } from 'lucide-react';


const API_URL = import.meta.env.VITE_API_URL;

const SubNavBar = ({ title, navItems = [] }) => {
    const isLogged = localStorage.getItem("user");
    const location = useLocation();
    const navigate = useNavigate();
    const [resourceMenuOpen, setResourceMenuOpen] = useState(false);

    // Get permission from localStorage
    const isTrustedClassificationQuiz = localStorage.getItem("isTrustedClassificationQuiz") === "true";

    const logout = async () => {
        try {
            const response = await fetch(`${API_URL}/api/securewebsite/logout`, {
                method: "GET",
                credentials: "include"
            });

            if (response.ok) {
                // Clear all relevant localStorage items
                localStorage.removeItem("user");
                localStorage.removeItem("sessionId");
                localStorage.removeItem("isAdmin");
                localStorage.removeItem("isTrustedWebConnect");
                localStorage.removeItem("Admin");
                localStorage.removeItem("loglevel");
                localStorage.removeItem("true");
                localStorage.removeItem("INFO");
                localStorage.removeItem("isTrustedClassificationQuiz");

                // Clear all quiz progress items
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('quizProgress_')) {
                        localStorage.removeItem(key);
                    }
                });

                // Redirect to login page
                navigate("/login");
            } else {
                console.error("Could not log out:", response);
            }
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // Add specific navigation items for ImageQuiz pages
    const customNavItems = [];
    if (location.pathname.startsWith('/ImageQuiz')) {
        customNavItems.push({
            path: '/QuizLandingPage',
            label: 'Back to Categories',
            icon: <Home className="mr-2 h-4 w-4" />,
            alwaysShow: true
        });
    }

    // Default nav items that will appear on all sub navigation bars
    const defaultNavItems = [
        {
            path: '/',
            label: 'DevExchange',
            icon: <Home className="mr-2 h-4 w-4" />,
            alwaysShow: true
        },
        {
            path: '/QuizLandingPage',
            label: 'Home',
            icon: <Home className="mr-2 h-4 w-4" />,
            alwaysShow: location.pathname !== '/QuizLandingPage'
        },
        {
            path: '/ClassifyAboutUsPage',
            label: 'About Us',
            icon: <Info size={16} className="mr-2 h-4 w-4" />,
            alwaysShow: true
        },
        ...customNavItems
    ];

    // Resource manager submenu items - only visible to trusted users
    const resourceManagerItems = [
        {
            path: '/statistics',
            label: 'Statistics',
            icon: <BarChart className="mr-2 h-4 w-4" />
        },
        {
            path: '/uploadManager',
            label: 'Upload Manager',
            icon: <Upload className="mr-2 h-4 w-4" />
        },
        {
            path: '/CategoryManager',
            label: 'Category Manager',
            icon: <List className="mr-2 h-4 w-4" />
        }
    ];

    // Combine default items with filtered custom items
    const allNavItems = [...defaultNavItems, ...navItems];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (resourceMenuOpen) {
                setResourceMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [resourceMenuOpen]);

    return (
        <header className="bg-card shadow-sm py-4 px-8 border-b border-border/40">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <span className="text-xl font-semibold text-foreground">
                        {title}
                    </span>
                </div>
                <NavigationMenu>
                    <NavigationMenuList className="space-x-6">
                        {allNavItems.map((item, index) => (
                            (item.alwaysShow || item.path !== location.pathname) && (
                                <NavigationMenuItem key={index}>
                                    <Link to={item.path}>
                                        <NavigationMenuLink
                                            className="px-4 py-2 text-muted-foreground hover:text-theme-2 transition-colors flex items-center"
                                        >
                                            {item.icon && item.icon}
                                            {item.label}
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                            )
                        ))}

                        {/* Resource Manager Dropdown - Only shown to trusted users */}
                        {isTrustedClassificationQuiz && (
                            <NavigationMenuItem className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setResourceMenuOpen(!resourceMenuOpen);
                                    }}
                                    className="px-4 py-2 text-muted-foreground hover:text-theme-2 transition-colors flex items-center"
                                >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    Resource Manager
                                    {resourceMenuOpen ?
                                        <ChevronUp className="ml-2 h-4 w-4" /> :
                                        <ChevronDown className="ml-2 h-4 w-4" />}
                                </button>

                                {resourceMenuOpen && (
                                    <div className="absolute left-0 mt-2 w-56 bg-card rounded-md shadow-lg z-50 border border-border/40">
                                        <div className="py-1">
                                            {resourceManagerItems.map((item, index) => (
                                                <Link
                                                    key={index}
                                                    to={item.path}
                                                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-theme-2 transition-colors flex items-center"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {item.icon}
                                                    {item.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </NavigationMenuItem>
                        )}

                        {isLogged ? (
                            <NavigationMenuItem>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors flex items-center"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log Out
                                </button>
                            </NavigationMenuItem>
                        ) : (
                            <NavigationMenuItem>
                                <Link to="/login">
                                    <NavigationMenuLink
                                        className="px-4 py-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors flex items-center"
                                    >
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Log In
                                    </NavigationMenuLink>
                                </Link>
                            </NavigationMenuItem>
                        )}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </header>
    );
};

export default SubNavBar;