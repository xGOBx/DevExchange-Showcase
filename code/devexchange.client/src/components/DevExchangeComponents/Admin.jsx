import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Users, Link as LinkIcon, Search, BookOpen, HelpCircle, Star } from 'lucide-react';
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const API_URL = import.meta.env.VITE_API_URL;

function Admin() {
    document.title = "Admin";
    const [users, setUsers] = useState(null);
    const [connections, setConnections] = useState(null);
    const [classificationUsers, setClassificationUsers] = useState(null);
    const [categories, setCategories] = useState(null);
    const [connectedUsers, setConnectedUsers] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('users-section');

    const [loading, setLoading] = useState({
        users: true,
        connections: true,
        classificationUsers: true,
        categories: true
    });
    const [error, setError] = useState({
        users: null,
        connections: null,
        classificationUsers: null,
        categories: null
    });

    useEffect(() => {
        const fetchData = async () => {
            await fetchUsers();
            await fetchConnections();
            await fetchClassificationUsers();
            await fetchCategories();
        };
        fetchData();
    }, []);

    const fetchUsers = async () => {
        try {
            // Fetch basic user data
            const usersResponse = await axios.get(`${API_URL}/api/Admin/GetUsers`);
            const users = usersResponse.data;

            // Fetch trusted web connect users data
            const trustedUsersResponse = await axios.get(`${API_URL}/api/Admin/GetWebConnectTrustedUsers`);
            const trustedUsers = trustedUsersResponse.data;

            // Combine the data
            const combinedUsers = users.map(user => {
                // Find if this user is in the trusted users list
                const trustedUser = trustedUsers.find(tu => tu.userId === user.id);
                return {
                    ...user,
                    hasWebConnectRole: trustedUser !== undefined,
                    isTrustedWebConnect: trustedUser ? trustedUser.isTrustedWebConnect : false
                };
            });

            setUsers(combinedUsers);
            setLoading(prev => ({ ...prev, users: false }));
        } catch (error) {
            console.error("Error fetching users:", error);
            setError(prev => ({ ...prev, users: "Failed to load users" }));
            setLoading(prev => ({ ...prev, users: false }));
        }
    };

    const fetchConnections = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/WebsiteConnection/GetAllConnections`);
            const connections = response.data.data;
            setConnections(connections);
            setConnectedUsers({});
            setLoading(prev => ({ ...prev, connections: false }));
        } catch (error) {
            console.error("Error fetching connections:", error);
            setError(prev => ({ ...prev, connections: "Failed to load connections" }));
            setLoading(prev => ({ ...prev, connections: false }));
        }
    };

    const fetchClassificationUsers = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/Admin/GetClassificationTrustedUsers`);
            setClassificationUsers(response.data);
            setLoading(prev => ({ ...prev, classificationUsers: false }));
        } catch (error) {
            console.error("Error fetching classification users:", error);
            setError(prev => ({ ...prev, classificationUsers: "Failed to load classification users" }));
            setLoading(prev => ({ ...prev, classificationUsers: false }));
        }
    };



  const fetchCategories = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/CategoryController/GetAllcategories`);
        console.log("Categories API response:", response.data);
        // Set categories directly without transformation
        setCategories(response.data);
        setLoading(prev => ({ ...prev, categories: false }));
    } catch (error) {
        console.error("Error fetching categories:", error);
        setError(prev => ({ ...prev, categories: "Failed to load categories" }));
        setLoading(prev => ({ ...prev, categories: false }));
    }
};

    const handleTrustedToggle = async (userId, isTrustedWebConnect) => {
        try {
            await axios.post(`${API_URL}/api/Admin/UpdateIsTrustedWebConnectStatus`, {
                userId,
                isTrustedWebConnect: !isTrustedWebConnect
            });
            setUsers(users.map(user =>
                user.id === userId ? { ...user, isTrustedWebConnect: !isTrustedWebConnect } : user
            ));
        } catch (error) {
            console.error("Error updating trusted status:", error);
        }
    };

    const handleClassificationTrustedToggle = async (userId, isTrustedClassificationQuiz) => {
        try {
            await axios.post(`${API_URL}/api/Admin/UpdateIsTrustedClassificationUpload`, {
                userId,
                isTrustedClassificationQuiz: !isTrustedClassificationQuiz
            });
            setClassificationUsers(users =>
                users.map(user =>
                    user.userId === userId ? { ...user, isTrustedClassificationQuiz: !isTrustedClassificationQuiz } : user
                )
            );
        } catch (error) {
            console.error("Error updating classification trusted status:", error);
        }
    };

    const handleFeatureToggle = async (connectionId, isFeatured) => {
        try {
            setConnections(prevConnections =>
                prevConnections.map(conn =>
                    conn.id === connectionId ? { ...conn, isFeatured: !isFeatured } : conn
                )
            );

            await axios.post(`${API_URL}/api/WebsiteConnection/UpdateConnectionFeatureStatus`, {
                connectionId,
                isFeatured: !isFeatured
            });

        } catch (error) {
            console.error("Error updating feature status:", error);
            setConnections(prevConnections =>
                prevConnections.map(conn =>
                    conn.id === connectionId ? { ...conn, isFeatured: isFeatured } : conn
                )
            );
            setError(prev => ({
                ...prev,
                connections: "Failed to update feature status"
            }));
            setTimeout(() => {
                setError(prev => ({ ...prev, connections: null }));
            }, 3000);
        }
    };

    const handleConnectionToggle = async (connectionId, isActive) => {
        try {
            setConnections(prevConnections =>
                prevConnections.map(conn =>
                    conn.id === connectionId ? { ...conn, isActive: !isActive } : conn
                )
            );

            await axios.post(`${API_URL}/api/WebsiteConnection/UpdateConnectionStatus`, {
                connectionId,
                isActive: !isActive
            });

            if (!isActive) {
                await axios.post(`${API_URL}/api/WebsiteEmail/sendApprovalNotification`, {
                    websiteId: connectionId
                });
            } else {
                await axios.post(`${API_URL}/api/WebsiteEmail/sendRemovalNotification`, {
                    websiteId: connectionId
                });
            }

        } catch (error) {
            console.error("Error updating connection status:", error);
            setConnections(prevConnections =>
                prevConnections.map(conn =>
                    conn.id === connectionId ? { ...conn, isActive: isActive } : conn
                )
            );
            setError(prev => ({
                ...prev,
                connections: "Failed to update connection status"
            }));
            setTimeout(() => {
                setError(prev => ({ ...prev, connections: null }));
            }, 3000);
        }
    };

    const handleCategoryFeatureToggle = async (categoryId, isFeatured) => {
        try {
            // Update the UI optimistically using the category Id as the unique identifier
            setCategories(prevCategories =>
                prevCategories.map(category =>
                    category.id === categoryId
                        ? { ...category, isFeatured: !isFeatured }
                        : category
                )
            );

            // Make the API call
            await axios.post(`${API_URL}/api/UploadManager/UpdateCategoryFeatureStatus`, {
                categoryId,
                isFeatured: !isFeatured
            });

        } catch (error) {
            console.error("Error updating category feature status:", error);
            // Revert the UI change if the API call fails
            setCategories(prevCategories =>
                prevCategories.map(category =>
                    category.id === categoryId
                        ? { ...category, isFeatured: isFeatured }
                        : category
                )
            );
            setError(prev => ({
                ...prev,
                categories: "Failed to update category feature status"
            }));
            setTimeout(() => {
                setError(prev => ({ ...prev, categories: null }));
            }, 3000);
        }
    };

    const handleCategoryActiveToggle = async (categoryId, isActive) => {
        try {
            // Update the UI optimistically using the category Id as the unique identifier
            setCategories(prevCategories =>
                prevCategories.map(category =>
                    category.id === categoryId
                        ? { ...category, isActive: !isActive }
                        : category
                )
            );

            // Make the API call
            await axios.post(`${API_URL}/api/UploadManager/UpdateCategoryActiveStatus`, {
                categoryId,
                isActive: !isActive
            });

        } catch (error) {
            console.error("Error updating category active status:", error);
            // Revert the UI change if the API call fails
            setCategories(prevCategories =>
                prevCategories.map(category =>
                    category.id === categoryId
                        ? { ...category, isActive: isActive }
                        : category
                )
            );
            setError(prev => ({
                ...prev,
                categories: "Failed to update category active status"
            }));
            setTimeout(() => {
                setError(prev => ({ ...prev, categories: null }));
            }, 3000);
        }
    };

    const filteredUsers = activeTab === 'users-section' && users ?
        users.filter(user =>
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.userName?.toLowerCase().includes(searchTerm.toLowerCase())
        ) : [];

    const filteredClassificationUsers = activeTab === 'classification-users' && classificationUsers && users ?
        classificationUsers.filter(user => {
            const matchedUser = users?.find(u => u.id === user.userId);
            return matchedUser?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                matchedUser?.userName?.toLowerCase().includes(searchTerm.toLowerCase());
        }) : [];

    const filteredConnections = activeTab === 'connections' && connections ?
        connections.filter(connection =>
            connection.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            connection.title?.toLowerCase().includes(searchTerm.toLowerCase())
        ) : [];

    const filteredCategories = activeTab === 'categories' && Array.isArray(categories) ?
        categories.filter(category =>
            category.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getUserNameById(category.userId)?.toLowerCase().includes(searchTerm.toLowerCase())
        ) : [];

    const LoadingState = () => (
        <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
        </div>
    );

    const ErrorState = ({ message }) => (
        <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    );

    // Helper function to get user email by userId
    const getUserEmailById = (userId) => {
        const user = users?.find(u => u.id === userId);
        return user?.email || 'Unknown Email';
    };

    // Helper function to get username by userId
    const getUserNameById = (userId) => {
        const user = users?.find(u => u.id === userId);
        return user?.userName || 'Unknown User';
    };

    // Custom tooltip component that works on click
    const InfoTooltip = ({ title, content }) => (
        <Popover>
            <PopoverTrigger asChild>
                <button className="ml-1 inline-flex items-center justify-center">
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
                <div className="space-y-2">
                    <h4 className="font-medium">{title}</h4>
                    <div className="text-sm text-gray-500">{content}</div>
                </div>
            </PopoverContent>
        </Popover>
    );

    return (
        <div className="container mx-auto py-8 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Admin Panel</CardTitle>
                    <CardDescription>Manage users, website connections, classification quiz permissions, and featured categories</CardDescription>
                    <div className="flex items-center space-x-2 mt-4">
                        <Search className="h-4 w-4 text-gray-500" />
                        <Input
                            type="text"
                            placeholder={`Search ${activeTab === 'users-section' ? 'users' :
                                    activeTab === 'classification-users' ? 'classification users' :
                                        activeTab === 'connections' ? 'connections' :
                                            'categories'
                                }...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="border rounded-lg p-4 bg-gray-50">
                            <h3 className="text-lg font-medium mb-3">Control Panel Navigation</h3>

                            <div className="grid grid-cols-2 gap-4">
                                {/* User Management Section */}
                                <div className="border rounded-lg p-3 bg-white">
                                    <h4 className="text-md font-medium mb-2 flex items-center">
                                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                                        User Management
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setActiveTab('users-section')}
                                            className="py-2 px-3 bg-blue-100 hover:bg-blue-200 rounded-md text-sm flex items-center justify-center"
                                        >
                                            <Users className="h-4 w-4 mr-1" />
                                            DevExchange Users
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('classification-users')}
                                            className="py-2 px-3 bg-blue-100 hover:bg-blue-200 rounded-md text-sm flex items-center justify-center"
                                        >
                                            <BookOpen className="h-4 w-4 mr-1" />
                                            Classification Users
                                        </button>
                                    </div>
                                </div>

                                {/* Content Management Section */}
                                <div className="border rounded-lg p-3 bg-white">
                                    <h4 className="text-md font-medium mb-2 flex items-center">
                                        <Star className="h-5 w-5 mr-2 text-green-600" />
                                        Content Management
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => setActiveTab('connections')}
                                            className="py-2 px-3 bg-green-100 hover:bg-green-200 rounded-md text-sm flex items-center justify-center"
                                        >
                                            <LinkIcon className="h-4 w-4 mr-1" />
                                            Website Connections
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('categories')}
                                            className="py-2 px-3 bg-green-100 hover:bg-green-200 rounded-md text-sm flex items-center justify-center"
                                        >
                                            <Star className="h-4 w-4 mr-1" />
                                            Categories
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            defaultValue="users-section"
                        >
                            <TabsList className="hidden">
                                <TabsTrigger value="users-section">Users</TabsTrigger>
                                <TabsTrigger value="classification-users">Classification</TabsTrigger>
                                <TabsTrigger value="connections">Connections</TabsTrigger>
                                <TabsTrigger value="categories">Categories</TabsTrigger>
                            </TabsList>

                            {/* User Management Tab */}
                            <TabsContent value="users-section">
                                <Card>
                                    <CardHeader className="bg-blue-50 border-b">
                                        <div className="flex items-center">
                                            <Users className="h-5 w-5 mr-2 text-blue-600" />
                                            <div>
                                                <CardTitle>DevExchange User Management</CardTitle>
                                                <CardDescription>View and manage DevExchange user permissions</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading.users ? (
                                            <LoadingState />
                                        ) : error.users ? (
                                            <ErrorState message={error.users} />
                                        ) : filteredUsers && filteredUsers.length > 0 ? (
                                            <Table>
                                                {/* Existing table code for users */}
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead>Created Date</TableHead>
                                                        <TableHead className="text-center">
                                                            <div className="flex items-center justify-center">
                                                                IsTrustedWebConnect
                                                                <InfoTooltip
                                                                    title="Trusted Web Connect Permission"
                                                                    content={
                                                                        <>
                                                                            <p>Users with this permission can submit website connections but will still require admin approval.</p>
                                                                            <p className="mt-2"><strong>When ON:</strong> User can directly publish web connections</p>
                                                                            <p><strong>When OFF:</strong> User submissions require admin approval</p>
                                                                        </>
                                                                    }
                                                                />
                                                            </div>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredUsers.map(user => (
                                                        // In the TableRow for users:
                                                        <TableRow key={user.id}>
                                                            <TableCell>{user.userName}</TableCell>
                                                            <TableCell>{user.email}</TableCell>
                                                            <TableCell>{new Date(user.createdDate).toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-center">
                                                                {user.hasWebConnectRole ? (
                                                                    <Switch
                                                                        checked={user.isTrustedWebConnect}
                                                                        onCheckedChange={() => handleTrustedToggle(user.id, user.isTrustedWebConnect)}
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-400">No WebConnect Role</span>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted-foreground">No users found.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Classification Users Tab */}
                            <TabsContent value="classification-users">
                                <Card>
                                    <CardHeader className="bg-blue-50 border-b">
                                        <div className="flex items-center">
                                            <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                                            <div>
                                                <CardTitle>Classification Quiz User Management</CardTitle>
                                                <CardDescription>View and manage Classification Quiz user permissions</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading.classificationUsers || loading.users ? (
                                            <LoadingState />
                                        ) : error.classificationUsers ? (
                                            <ErrorState message={error.classificationUsers} />
                                        ) : filteredClassificationUsers && filteredClassificationUsers.length > 0 ? (
                                            <Table>
                                                {/* Existing table code for classification users */}
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>User ID</TableHead>
                                                        <TableHead>Email</TableHead>
                                                        <TableHead className="text-center">
                                                            <div className="flex items-center justify-center">
                                                                IsTrustedClassificationQuiz
                                                                <InfoTooltip
                                                                    title="Trusted Classification Quiz Permission"
                                                                    content={
                                                                        <>
                                                                            <p>Users with this permission can upload and create classification quizzes for the platform.</p>
                                                                            <p className="mt-2"><strong>When ON:</strong> User can create and upload classification quizzes</p>
                                                                            <p><strong>When OFF:</strong> User cannot create or upload classification quizzes</p>
                                                                        </>
                                                                    }
                                                                />
                                                            </div>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredClassificationUsers.map(user => (
                                                        <TableRow key={user.userId}>
                                                            <TableCell>{user.userId}</TableCell>
                                                            <TableCell>{getUserEmailById(user.userId)}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Switch
                                                                    checked={user.isTrustedClassificationQuiz}
                                                                    onCheckedChange={() => handleClassificationTrustedToggle(user.userId, user.isTrustedClassificationQuiz)}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted-foreground">No classification users found.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>


                            {/* Connections Tab */}
                            <TabsContent value="connections">
                                <Card>
                                    <CardHeader className="bg-green-50 border-b">
                                        <div className="flex items-center">
                                            <LinkIcon className="h-5 w-5 mr-2 text-green-600" />
                                            <div>
                                                <CardTitle>Website Connections</CardTitle>
                                                <CardDescription>Manage external website connections</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading.connections ? (
                                            <LoadingState />
                                        ) : error.connections ? (
                                            <ErrorState message={error.connections} />
                                        ) : filteredConnections && filteredConnections.length > 0 ? (
                                            <Table>
                                                {/* Updated table code for connections with GitHub link */}
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Title</TableHead>
                                                        <TableHead>Description</TableHead>
                                                        <TableHead>Link</TableHead>
                                                        <TableHead>GitHub Link</TableHead>
                                                        <TableHead>User Email</TableHead>
                                                        <TableHead>Created Date</TableHead>
                                                        <TableHead className="text-center">
                                                            <div className="flex items-center justify-center">
                                                                Active
                                                                <InfoTooltip
                                                                    title="Active Connection Status"
                                                                    content={
                                                                        <>
                                                                            <p>Controls whether a website connection is visible to users on the platform.</p>
                                                                            <p className="mt-2"><strong>When ON:</strong> Connection is visible and accessible to users</p>
                                                                            <p><strong>When OFF:</strong> Connection is hidden from users</p>
                                                                            <p className="mt-2 text-xs">Note: Toggling this sends an email notification to the connection owner.</p>
                                                                        </>
                                                                    }
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="text-center">
                                                            <div className="flex items-center justify-center">
                                                                Featured
                                                                <InfoTooltip
                                                                    title="Featured Connection Status"
                                                                    content={
                                                                        <>
                                                                            <p>Determines if a connection should be highlighted as featured on the platform.</p>
                                                                            <p className="mt-2"><strong>When ON:</strong> Connection is prominently displayed in featured sections</p>
                                                                            <p><strong>When OFF:</strong> Connection appears in standard listings only</p>
                                                                        </>
                                                                    }
                                                                />
                                                            </div>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredConnections.map(connection => (
                                                        <TableRow key={connection.id}>
                                                            <TableCell>{connection.title}</TableCell>
                                                            <TableCell>{connection.description}</TableCell>
                                                            <TableCell>
                                                                <a
                                                                    href={connection.link}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center text-blue-600 hover:text-blue-800"
                                                                >
                                                                    {connection.link}
                                                                    <ExternalLink className="ml-1 h-4 w-4" />
                                                                </a>
                                                            </TableCell>
                                                            <TableCell>
                                                                {connection.gitHubLink ? (
                                                                    <a
                                                                        href={connection.gitHubLink}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        {connection.gitHubLink}
                                                                        <ExternalLink className="ml-1 h-4 w-4" />
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-400">No GitHub link</span>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {connection.userEmail || 'No email found'}
                                                            </TableCell>
                                                            <TableCell>{new Date(connection.createdDate).toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Switch
                                                                    checked={connection.isActive}
                                                                    onCheckedChange={() => handleConnectionToggle(connection.id, connection.isActive)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Switch
                                                                    checked={connection.isFeatured}
                                                                    onCheckedChange={() => handleFeatureToggle(connection.id, connection.isFeatured)}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted-foreground">No connections found.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Categories Tab */}
                            <TabsContent value="categories">
                                <Card>
                                    <CardHeader className="bg-green-50 border-b">
                                        <div className="flex items-center">
                                            <Star className="h-5 w-5 mr-2 text-green-600" />
                                            <div>
                                                <CardTitle>Category Management</CardTitle>
                                                <CardDescription>Manage and feature categories for classification quizzes</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading.categories ? (
                                            <LoadingState />
                                        ) : error.categories ? (
                                            <ErrorState message={error.categories} />
                                        ) : filteredCategories && filteredCategories.length > 0 ? (
                                            <Table>
                                                {/* Existing table code for categories */}
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Category Name</TableHead>
                                                        <TableHead>User Name</TableHead>
                                                        <TableHead>User ID</TableHead>
                                                        <TableHead className="text-center">
                                                            <div className="flex items-center justify-center">
                                                                Active
                                                                <InfoTooltip
                                                                    title="Active Category Status"
                                                                    content={
                                                                        <>
                                                                            <p>Controls whether a category is visible and usable on the platform.</p>
                                                                            <p className="mt-2"><strong>When ON:</strong> Category is visible and accessible to users</p>
                                                                            <p><strong>When OFF:</strong> Category is hidden from users</p>
                                                                        </>
                                                                    }
                                                                />
                                                            </div>
                                                        </TableHead>
                                                        <TableHead className="text-center">
                                                            <div className="flex items-center justify-center">
                                                                Featured
                                                                <InfoTooltip
                                                                    title="Featured Category Status"
                                                                    content={
                                                                        <>
                                                                            <p>Determines if a category should be highlighted as featured on the platform.</p>
                                                                            <p className="mt-2"><strong>When ON:</strong> Category is prominently displayed in featured sections</p>
                                                                            <p><strong>When OFF:</strong> Category appears in standard listings only</p>
                                                                        </>
                                                                    }
                                                                />
                                                            </div>
                                                        </TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredCategories.map(category => (
                                                        <TableRow key={category.id}>
                                                            <TableCell>{category.categoryName}</TableCell>
                                                            <TableCell>{getUserNameById(category.userId)}</TableCell>
                                                            <TableCell>{category.userId}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Switch
                                                                    checked={category.isActive || false}
                                                                    onCheckedChange={() => handleCategoryActiveToggle(category.id, category.isActive || false)}
                                                                />
                                                            </TableCell>
                                                            <TableCell className="text-center">
                                                                <Switch
                                                                    checked={category.isFeatured || false}
                                                                    onCheckedChange={() => handleCategoryFeatureToggle(category.id, category.isFeatured || false)}
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <p className="text-muted-foreground">No categories found.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default Admin;