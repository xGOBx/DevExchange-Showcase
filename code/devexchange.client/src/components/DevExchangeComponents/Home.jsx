import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Send, Sparkles, Star, ExternalLink, Code2, Zap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

function Home() {
    document.title = "Welcome";
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState({});
    const [websiteConnections, setWebsiteConnections] = useState([]);
    const [hoveredCard, setHoveredCard] = useState(null);

    const getImageUrl = (imagePath) => {
        try {
            const fileName = imagePath.split('/').pop();
            if (!fileName) {
                console.warn('Invalid image path:', imagePath);
                return imagePath;
            }
            return `${API_URL}/api/WebsiteConnection/image/${encodeURIComponent(fileName)}`;
        } catch (e) {
            console.error('Error parsing image path:', e);
            return imagePath;
        }
    };

    useEffect(() => {
        const user = localStorage.getItem("user");
        fetch(`${API_URL}/api/SecureWebsite/home/${user}`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        }).then(response => response.json())
            .then(data => {
                setUserInfo(data.userInfo);
            }).catch(error => {
                console.log("Error fetching user info: ", error);
            });

        // Updated to use new featuredActive endpoint
        fetch(`${API_URL}/api/WebsiteConnection/featuredActive`, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }).then(response => response.json())
            .then(data => {
                if (data.success) {
                    setWebsiteConnections(data.data);
                }
            }).catch(error => {
                console.log("Error fetching featured website connections: ", error);
            });
    }, []);


    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">
            {/* Hero Section */}
            <div className="relative h-[700px] overflow-hidden">
                {/* Animated background gradients */}
                <div className="absolute inset-0 bg-[#0A0A0A]">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-700"></div>
                    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
                </div>
                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

                <div className="relative z-20 h-full flex items-center">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl">
                            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl px-6 py-3 rounded-2xl mb-8 border border-white/10">
                                <Zap className="w-5 h-5 text-teal-400" />
                                <span className="text-white/80 font-medium">Next-Gen Student Innovation Platform</span>
                            </div>
                            <h1 className="text-7xl font-bold mb-8 leading-tight">
                                Programs by
                                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 animate-gradient-x">
                                    Students, for Students
                                </span>
                            </h1>
                            <p className="text-2xl text-white/70 mb-12 leading-relaxed max-w-3xl">
                                Join the next generation of student developers creating groundbreaking projects
                                and shaping the future of technology.
                            </p>
                            <div className="flex gap-6 items-center">
                                <Button
                                    variant="default"
                                    size="lg"
                                    className="bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 hover:from-teal-500 hover:via-blue-600 hover:to-purple-700 text-white px-10 py-7 rounded-2xl transition-all transform hover:scale-105 hover:shadow-[0_0_30px_rgba(79,209,197,0.3)] font-medium text-lg"
                                    onClick={() => navigate("/WebsiteConnectionForm")}
                                >
                                    Launch Your Project
                                    <ChevronRight className="ml-2 w-6 h-6" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="bg-white/5 backdrop-blur-xl border-white/10 text-white hover:bg-white/10 px-10 py-7 rounded-2xl font-medium text-lg group"
                                    onClick={() => navigate("/ExploreProjects")}

                                >
                                    Explore Projects
                                    <ExternalLink className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating tech elements */}
                <div className="absolute right-10 top-1/4 animate-float-slow">
                    <Code2 className="w-24 h-24 text-white/10" />
                </div>
                <div className="absolute right-32 bottom-1/4 animate-float-slower">
                    <Star className="w-16 h-16 text-white/10" />
                </div>
            </div>

            {/* Programs Section */}
            <div className="container mx-auto px-4 py-32">
                <div className="text-center mb-20">
                    <h2 className="text-5xl font-bold mb-6 inline-block">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                            Featured Projects
                        </span>
                    </h2>
                    <p className="text-white/60 text-xl max-w-2xl mx-auto">
                        Explore our handpicked selection of outstanding student projects that represent the best of innovation and creativity.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {websiteConnections.length > 0 ? (
                        websiteConnections.map(program => (
                            <a
                                key={program.id}
                                href={program.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                                onMouseEnter={() => setHoveredCard(program.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                <Card className="overflow-hidden transition-all duration-500 hover:translate-y-[-8px] bg-white/5 backdrop-blur-xl border-white/10 rounded-2xl relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-blue-500/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    <div className="h-48 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                        <img
                                            src={getImageUrl(program.imagePath)}
                                            alt={program.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                console.error(`Failed to load image: ${program.title}`);
                                                e.target.onerror = null;
                                                setTimeout(() => {
                                                    const timestamp = new Date().getTime();
                                                    e.target.src = `${getImageUrl(program.imagePath)}?t=${timestamp}`;
                                                }, 1000);
                                                e.target.onerror = () => {
                                                    e.target.src = '/placeholder-image.png';
                                                };
                                            }}
                                        />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                                            {program.title}
                                        </CardTitle>
                                        <p className="text-white/60 mt-2 line-clamp-2">
                                            {program.description}
                                        </p>
                                    </CardHeader>
                                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                                </Card>
                            </a>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-white/60">
                            No featured projects available at the moment.
                        </div>
                    )}
                </div>
            </div>


            {/* Newsletter Section */}
            <div className="relative py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 via-blue-500/20 to-purple-600/20"></div>
                <div className="absolute inset-0 backdrop-blur-3xl"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDIwIDAgTCAwIDAgMCAyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="text-center">
                        <h3 className="text-4xl font-bold mb-6 inline-block">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                                Join the Innovation Movement
                            </span>
                        </h3>
                        <p className="text-white/60 text-xl mb-12 max-w-2xl mx-auto">
                            Stay at the forefront of student innovation. Get exclusive updates, tutorials,
                            and early access to new projects.
                        </p>
                        <div className="flex max-w-md mx-auto gap-4">
                            <Input
                                type="email"
                                placeholder="Enter your email"
                                className="bg-white/5 border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-teal-500/30 rounded-xl px-6 py-6 text-lg"
                            />
                            <Button
                                variant="default"
                                className="bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white rounded-xl px-8 flex items-center gap-2 text-lg hover:shadow-[0_0_30px_rgba(79,209,197,0.3)]"
                            >
                                Subscribe
                                <Send className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
export default Home;