import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Search, User, Calendar, Star } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

function ExploreProjects() {
    document.title = "Explore Projects";
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const getImageUrl = (imagePath) => {
        try {
            const fileName = imagePath.split('/').pop();
            if (!fileName) return imagePath;
            return `${API_URL}/api/WebsiteConnection/image/${encodeURIComponent(fileName)}`;
        } catch (e) {
            console.error('Error parsing image path:', e);
            return imagePath;
        }
    };

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/WebsiteConnection/GetAllConnections`);
                const data = await response.json();
                if (data.success) {
                    // Filter only active projects
                    const activeProjects = data.data.filter(project => project.isActive);
                    setProjects(activeProjects);
                    setFilteredProjects(activeProjects);
                }
            } catch (err) {
                setError('Failed to load projects');
                console.error('Error fetching projects:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    useEffect(() => {
        let result = [...projects];

        // Apply search filter
        if (searchTerm) {
            result = result.filter(project =>
                project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.userName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply sorting
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
                break;
            case 'alphabetical':
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
            default:
                break;
        }

        setFilteredProjects(result);
    }, [searchTerm, sortBy, projects]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
                <div className="container mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <Card key={n} className="bg-white/5 animate-pulse">
                                <div className="h-48 bg-white/10"></div>
                                <CardHeader>
                                    <div className="h-6 bg-white/10 rounded w-3/4"></div>
                                    <div className="h-4 bg-white/10 rounded w-full mt-2"></div>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0A0A0A] text-white p-8">
                <div className="container mx-auto text-center">
                    <h2 className="text-2xl text-red-400">{error}</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold mb-4">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                            Explore All Projects
                        </span>
                    </h1>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        Discover innovative projects created by talented students across our platform
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 h-5 w-5" />
                        <Input
                            type="text"
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white placeholder-white/40"
                        />
                    </div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="alphabetical">Alphabetical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProjects.map(project => (
                        <Card key={project.id} className="bg-white/5 backdrop-blur-xl border-white/10 group hover:bg-white/10 transition-all duration-300">
                            <div className="h-48 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                <img
                                    src={getImageUrl(project.imagePath)}
                                    alt={project.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        e.target.src = '/placeholder-image.png';
                                    }}
                                />
                                {project.isFeatured && (
                                    <div className="absolute top-4 right-4 z-20 bg-yellow-500/90 text-black px-3 py-1 rounded-full flex items-center gap-1">
                                        <Star className="h-4 w-4" />
                                        <span className="text-sm font-medium">Featured</span>
                                    </div>
                                )}
                            </div>
                            <CardHeader>
                                <CardTitle className="text-xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                                    {project.title}
                                </CardTitle>
                                <p className="text-white/60 text-sm mb-4 line-clamp-2">
                                    {project.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-white/40">
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>{project.userName}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(project.createdDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <a
                                    href={project.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Visit Project
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* No Results Message */}
                {filteredProjects.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-white/60 text-lg">No projects found matching your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExploreProjects;