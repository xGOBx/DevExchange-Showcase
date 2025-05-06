import React, { useState, useEffect } from 'react';
const API_URL = import.meta.env.VITE_API_URL;

const UserProfile = () => {
    const [userData, setUserData] = useState(null);
    const [userConnections, setUserConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            // First, verify user session and get user ID
            const userResponseId = await fetch(`${API_URL}/api/securewebsite/CheckUserReturnId`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!userResponseId.ok) {
                throw new Error(userResponseId.status === 403
                    ? 'Please log in to continue'
                    : await userResponseId.text() || 'Failed to verify user session');
            }

            const userId = await userResponseId.json();

            // Get the current user's email
            const userResponse = await fetch(`${API_URL}/api/securewebsite/user/byemail?email=${localStorage.getItem('user') || ''}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!userResponse.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await userResponse.json();

            // Get user's home page data which includes more details
            const homeResponse = await fetch(`${API_URL}/api/securewebsite/home/${userData.email}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!homeResponse.ok) {
                throw new Error('Failed to fetch home data');
            }

            const homeData = await homeResponse.json();

            // Parsing 'isAdmin' from localStorage
            // Note: There's a space after 'isAdmin' in the localStorage key, which might be unintentional
            const isAdmin = JSON.parse(localStorage.getItem('isAdmin') || '{}');
            const isTrustedWebConnect = JSON.parse(localStorage.getItem('isTrustedWebConnect ') || '{}');
            const isTrustedClassificationQuiz = JSON.parse(localStorage.getItem('isTrustedClassificationQuiz ') || '{}');


            // Setting user data in state
            setUserData({
                id: userId,
                email: userData.email,
                name: homeData.userInfo.name,
                userName: userData.userName,
                isAdmin: isAdmin || false,
                isTrustedWebConnect: isTrustedWebConnect || false,
                isTrustedClassificationQuiz: isTrustedClassificationQuiz || false
            });

            // Fetch the user's owned web connections
            const connectionsResponse = await fetch(`${API_URL}/api/WebsiteConnection/owned`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!connectionsResponse.ok) {
                throw new Error('Failed to fetch connections');
            }

            const connectionsData = await connectionsResponse.json();

            if (connectionsData.success) {
                setUserConnections(connectionsData.data);
            }

            setLoading(false);
        } catch (err) {
            console.error("Error fetching user profile:", err);
            setError("Failed to load profile. Please make sure you're logged in.");
            setLoading(false);
        }
    };

    const handleDeleteClick = (connection) => {
        setConnectionToDelete(connection);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!connectionToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${API_URL}/api/WebsiteConnection/${connectionToDelete.id}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to delete connection');
            }

            const responseData = await response.json();

            if (responseData.success) {
                // Remove the deleted connection from the state
                setUserConnections(prevConnections =>
                    prevConnections.filter(conn => conn.id !== connectionToDelete.id)
                );
                // Close the modal
                setDeleteModalOpen(false);
                setConnectionToDelete(null);
            } else {
                console.error("Failed to delete connection:", responseData.message);
            }
        } catch (err) {
            console.error("Error deleting connection:", err);
        } finally {
            setIsDeleting(false);
        }
    };

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

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setConnectionToDelete(null);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg font-semibold">Loading profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="mt-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                    <div className="bg-blue-600 p-4">
                        <h1 className="text-2xl font-bold text-white">User Profile</h1>
                    </div>

                    {userData && (
                        <div className="p-6">
                            <div className="flex items-start">
                                <div className="mr-8">
                                    <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-3xl text-gray-600">{userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}</span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold">User Information</h2>
                                    <div className="mt-2 border-t border-gray-200 pt-2">
                                        <div className="grid grid-cols-3 gap-1 py-2">
                                            <span className="text-gray-600 font-medium">Name:</span>
                                            <span className="col-span-2">{userData.name}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 py-2">
                                            <span className="text-gray-600 font-medium">Username:</span>
                                            <span className="col-span-2">{userData.userName}</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 py-2">
                                            <span className="text-gray-600 font-medium">Email:</span>
                                            <span className="col-span-2">{userData.email}</span>
                                        </div>
                                    </div>

                                    <h2 className="text-lg font-semibold mt-4">Roles & Permissions</h2>
                                    <div className="mt-2 border-t border-gray-200 pt-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-2 ${userData.isAdmin ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-gray-700">Administrator</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-2 ${userData.isTrustedWebConnect ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-gray-700">Trusted Web Connect</span>
                                            </div>
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-2 ${userData.isTrustedClassificationQuiz ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <span className="text-gray-700">Trusted Classification Quiz</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Web Connections Section */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="bg-blue-600 p-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">My Web Connections</h1>
                        <button
                            onClick={() => window.location.href = '/WebsiteConnectionForm'}
                            className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-1 px-3 rounded text-sm"
                        >
                            + New Connection
                        </button>
                    </div>

                    <div className="p-6">
                        {userConnections.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                <p>You haven't created any web connections yet.</p>
                                <button
                                    onClick={() => window.location.href = '/WebsiteConnectionForm'}
                                    className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Create New Connection
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {userConnections.map(connection => (
                                    <div
                                        key={connection.id}
                                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                    >
                                        <div className="h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {connection.imagePath ? (
                                                <img
                                                    src={getImageUrl(connection.imagePath)}
                                                    alt={connection.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    onError={(e) => {
                                                        console.error(`Failed to load image: ${connection.title}`);
                                                        e.target.onerror = null;
                                                        setTimeout(() => {
                                                            const timestamp = new Date().getTime();
                                                            e.target.src = `${getImageUrl(connection.imagePath)}?t=${timestamp}`;
                                                        }, 1000);
                                                        e.target.onerror = () => {
                                                            e.target.src = '/placeholder-image.png';
                                                        };
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-gray-400 text-xl">No Image</div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-lg truncate">{connection.title}</h3>
                                                <div className="flex space-x-1">
                                                    {connection.isActive && (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                                                    )}
                                                    {connection.isFeatured && (
                                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Featured</span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{connection.description}</p>
                                            <div className="flex justify-between items-center mt-4">
                                                <span className="text-xs text-gray-500">Created: {formatDate(connection.createdDate)}</span>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleDeleteClick(connection)}
                                                        className="text-red-500 hover:text-red-700 text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                   
                                                    <a
                                                        href={connection.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-500 hover:text-green-700 text-sm"
                                                    >
                                                        Visit
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => window.history.back()}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
                    >
                        Back
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Home
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold mb-4">Delete Web Connection</h3>
                        <p className="mb-6">
                            Are you sure you want to delete the connection "{connectionToDelete?.title}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={cancelDelete}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded flex items-center"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;