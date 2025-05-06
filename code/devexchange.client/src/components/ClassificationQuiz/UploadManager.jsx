import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, Folder, HelpCircle, Lock, Upload, Image as ImageIcon, Trash2, AlertCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ManualConfigForm from './ManualConfigForm'; // Import the new component

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_API_URL;

const UploadManager = () => {
    const [showHelp, setShowHelp] = useState(false);
    const [configFile, setConfigFile] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [progress, setProgress] = useState(0);
    const [showProgress, setShowProgress] = useState(false);
    const [message, setMessage] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [configUploaded, setConfigUploaded] = useState(false);
    const [duplicateKeys, setDuplicateKeys] = useState([]);
    const [messageTimeout, setMessageTimeout] = useState(null);
    const [uploadedImages, setUploadedImages] = useState({});
    const [note, setNote] = useState('');
    const [userId, setUserId] = useState(null); // Store user ID here
    const [imageLoadErrors, setImageLoadErrors] = useState({});
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [draggedFiles, setDraggedFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverCategoryId, setDragOverCategoryId] = useState(null);




    useEffect(() => {
        fetchUploadedImages();
    }, []);



    const fetchUploadedImages = async () => {
        try {
            const userEmail = localStorage.getItem('user');

            if (!userEmail) {
                showMessage('No user email found', 'error');
                return;
            }

            const userResponse = await fetch(
                `${API_URL}/api/securewebsite/user/byemail?email=${encodeURIComponent(userEmail)}`,
                {
                    credentials: 'include',
                }
            );

            if (!userResponse.ok) throw new Error('User not found');
            const userData = await userResponse.json();
            const fetchedUserId = userData.userId; // Fetch the user ID

            setUserId(fetchedUserId); // Save the user ID to the state

            const imagesResponse = await fetch(
                `${API_URL}/api/UploadManager/byUser/${fetchedUserId}`, // Use the fetched user ID
                {
                    credentials: 'include',
                }
            );

            if (!imagesResponse.ok) throw new Error('Failed to fetch images');
            const imagesData = await imagesResponse.json();

            // Group images by category
            const imagesByCategory = imagesData.reduce((acc, image) => {
                const categoryKey = image.configLinkId || 'Uncategorized';
                if (!acc[categoryKey]) {
                    acc[categoryKey] = [];
                }
                acc[categoryKey].push(image);
                return acc;
            }, {});

            setUploadedImages(imagesByCategory);
        } catch (err) {
            console.error('Fetch error:', err);
            showMessage('Failed to fetch uploaded images', 'error');
        }
    };

    const handleDeleteImage = async (image) => {
        setItemToDelete({ type: 'image', data: image });
        setDeleteDialogOpen(true);
    };

    const handleDeleteCategory = async (categoryId) => {
        setItemToDelete({ type: 'category', data: categoryId.toString() });
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const { type, data } = itemToDelete;
            let endpoint = '';
            let body = {};

            if (type === 'image') {
                const containerName = data.imagePath.split('/')[2]?.toLowerCase();
                const fileName = data.imagePath.split('/').pop();

                endpoint = `${API_URL}/api/UploadManager/deleteImage`;
                body = {
                    containerName,
                    fileName,
                    imageId: data.id
                };
            } else if (type === 'category') {
                endpoint = `${API_URL}/api/UploadManager/deleteCategory`;
                body = {
                    categoryId: data
                };
            }

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (response.ok) {
                showMessage(`${type === 'image' ? 'Image' : 'Category'} deleted successfully`, 'success');
                await fetchUploadedImages();
            } else {
                throw new Error(`Failed to delete ${type}`);
            }
        } catch (error) {
            console.error('Delete error:', error);
            showMessage(`Failed to delete ${itemToDelete.type}`, 'error');
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    const handleManualConfigSubmit = async (config) => {
        setCategoryName(config.CategoryName);
        setConfigFile(new File([JSON.stringify(config)], 'manual-config.json', { type: 'application/json' }));

        try {
            if (!userId) {
                showMessage('User ID is missing', 'error');
                return;
            }

            const response = await fetch(`${API_URL}/api/UploadManager/full-category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    fullCategory: config,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showMessage('Configuration saved successfully!', 'success');
                setConfigUploaded(true);
                setDuplicateKeys([]);
            } else if (data.duplicates) {
                setDuplicateKeys(data.duplicates);
                showMessage(
                    `The following QuestionKeys already exist. Please change them and try again.`,
                    'error'
                );
            } else {
                showMessage(data.message || 'Save failed', 'error');
            }
        } catch (err) {
            console.error('Save error:', err);
            showMessage('Failed to save configuration', 'error');
        }
    };


    const showMessage = (text, type) => {
        if (messageTimeout) {
            clearTimeout(messageTimeout);
        }

        setMessage({ text, type });

        const timeoutId = setTimeout(() => setMessage(null), 5000);
        setMessageTimeout(timeoutId);
    };

    const getImageUrl = (imagePath) => {
        try {
            // If it's already a proxy URL, just add the API_URL base
            if (imagePath.startsWith('/api/')) {
                return `${API_URL}${imagePath}`;
            }

            // Handle legacy Azure blob URLs
            const url = new URL(imagePath);
            const pathParts = url.pathname.split('/').filter(Boolean); // Remove empty strings

            // The container name is usually the first segment after the storage account
            // The file name is the last segment
            const containerName = pathParts[1]?.toLowerCase();
            const fileName = pathParts[pathParts.length - 1];

            if (!containerName || !fileName) {
                console.warn('Invalid image path structure:', imagePath);
                return imagePath;
            }

            return `${API_URL}/api/UploadManager/image/${encodeURIComponent(containerName)}/${encodeURIComponent(fileName)}`;
        } catch (e) {
            console.error('Error parsing image path:', e);
            return imagePath;
        }
    };

    const handleFileSelect = (event) => {
        console.log('File selection event triggered', event);

        const file = event.target.files?.[0];

        if (!file) {
            console.warn('No file selected.');
            return;
        }

        console.log(`File selected: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

        const reader = new FileReader();

        reader.onload = (e) => {
            console.log('File read operation completed.');

            try {
                console.log('Attempting to parse JSON content...');
                const jsonContent = JSON.parse(e.target.result);

                if (jsonContent.CategoryName) {
                    console.log(`CategoryName found: ${jsonContent.CategoryName}`);

                    setCategoryName(jsonContent.CategoryName);
                    setConfigFile(file);
                    setNote(jsonContent.CategoryName);
                    showMessage(`Loaded configuration for category: ${jsonContent.CategoryName}`, 'success');
                    setConfigUploaded(false);
                    setDuplicateKeys([]);
                } else {
                    console.warn('JSON file does not contain a CategoryName field.');
                    showMessage('JSON file must contain a CategoryName field', 'error');
                    setConfigFile(null);
                    setCategoryName('');
                }
            } catch (err) {
                console.error('Error parsing JSON:', err);
                showMessage('Invalid JSON file format', 'error');
                setConfigFile(null);
                setCategoryName('');
            }
        };

        reader.onerror = (err) => {
            console.error('Error reading file:', err);
            showMessage('Error reading file', 'error');
        };

        console.log('Starting to read file...');
        reader.readAsText(file);
    };



    const handleFolderSelect = (event) => {
        if (!configUploaded) return;

        const files = Array.from(event.target.files || [])
            .filter(file => file.type.startsWith('image/'));

        if (files.length === 0) {
            showMessage('No image files found in the selected folder', 'error');
            return;
        }

        setImageFiles(files);
        showMessage(`${files.length} images selected from folder`, 'success');
    };

    const handleConfigUpload = async () => {
        if (!configFile) {
            showMessage('Please select a configuration file', 'error');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    let jsonContent = JSON.parse(e.target.result);

                    // Handle legacy "Category" field
                    if (!jsonContent.CategoryName && jsonContent.Category) {
                        jsonContent.CategoryName = jsonContent.Category;
                        delete jsonContent.Category;
                    }

                    // Validate CategoryName
                    if (!jsonContent.CategoryName) {
                        showMessage("Category name is missing in JSON", "error");
                        return;
                    }

                    console.log('Uploading configuration:', jsonContent);

                    if (!userId) {
                        showMessage('User ID is missing', 'error');
                        return;
                    }

                    // Upload configuration to the backend with userId included
                    const response = await fetch(`${API_URL}/api/UploadManager/full-category`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId,  // Send userId separately
                            fullCategory: jsonContent,  // Send the category data
                        }),
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        showMessage('Configuration uploaded successfully!', 'success');
                        setConfigUploaded(true);
                        setDuplicateKeys([]); // Clear duplicate keys on success
                    } else if (data.duplicates) {
                        // Handle duplicate QuestionKeys
                        setDuplicateKeys(data.duplicates);
                        showMessage(
                            `The following QuestionKeys already exist. Please change them and try again.`,
                            'error'
                        );
                    } else {
                        // Handle generic error
                        showMessage(data.message || 'Upload failed', 'error');
                    }
                } catch (err) {
                    console.error('Upload error:', err);
                    showMessage('Failed to upload configuration', 'error');
                }
            };
            reader.readAsText(configFile);
        } catch (err) {
            console.error('Upload error:', err);
            showMessage('Failed to upload configuration', 'error');
        }
    };

    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e, categoryId) => {
        preventDefaults(e);
        setDragOverCategoryId(categoryId);
    };

    const handleDragLeave = (e) => {
        preventDefaults(e);
        setDragOverCategoryId(null);
    };

    const handleDrop = async (e, categoryId) => {
        preventDefaults(e);
        setDragOverCategoryId(null);

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));

        if (files.length === 0) {
            showMessage('Please drop only image files', 'error');
            return;
        }

        // Upload the dropped files to the specific category
        await uploadFilesToCategory(files, categoryId);
    };



    const uploadFilesToCategory = async (files, categoryId) => {
        try {
            const formData = new FormData();

            for (const file of files) {
                if (file.size > 5 * 1024 * 1024) {
                    showMessage(`${file.name} exceeds 5MB size limit`, 'error');
                    continue;
                }
                formData.append('files', file);
            }

            if (!userId) {
                showMessage('User ID is missing', 'error');
                return;
            }

            formData.append('userId', userId);
            formData.append('categoryId', categoryId);

            setShowProgress(true);
            setProgress(0);

            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 90));
            }, 200);

            const response = await fetch(`${API_URL}/api/UploadManager/uploadImage`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            clearInterval(progressInterval);
            setProgress(100);

            const data = await response.json();

            if (response.ok && data.success) {
                showMessage('Images uploaded successfully', 'success');
                fetchUploadedImages();
            } else {
                showMessage(data.message || 'Upload failed', 'error');
            }
        } catch (err) {
            console.error('Upload error:', err);
            showMessage('Failed to upload images', 'error');
        } finally {
            setTimeout(() => {
                setShowProgress(false);
                setProgress(0);
            }, 1000);
        }
    };
    const PageDescription = () => (
        <Card className="mb-8 border-l-4 border-l-blue-500">
            <CardHeader>
                <CardTitle className="text-blue-700">Upload Manager</CardTitle>
                <CardDescription className="text-base space-y-2">
                    <p>
                        Welcome to the Upload Manager! This tool allows you to organize and manage your image uploads by categories.
                        Here's what you can do:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Create categories using either a JSON configuration file or manual entry</li>
                        <li>Upload multiple images to specific categories</li>
                        <li>Drag and drop images directly into existing categories</li>
                        <li>View all uploaded images organized by category</li>
                        <li>Delete individual images or entire categories</li>
                        <li>Track upload progress with a visual progress bar</li>
                    </ul>
                    <p className="mt-4 text-sm text-blue-600">
                        Note: Images must be less than 5MB in size. Supported formats include common image types (JPEG, PNG, GIF).
                    </p>
                </CardDescription>
            </CardHeader>
        </Card>
    );

    const handleImageUpload = async () => {
        if (!configUploaded) {
            showMessage('Please upload configuration first', 'error');
            return;
        }

        if (imageFiles.length === 0) {
            showMessage('No images selected', 'error');
            return;
        }

        setShowProgress(true);
        setProgress(0);

        try {
            const formData = new FormData();

            // Ensure files are image files and within the size limit
            for (const file of imageFiles) {
                if (!file.type.startsWith('image/')) {
                    showMessage(`${file.name} is not an image file`, 'error');
                    continue;
                }

                if (file.size > 5 * 1024 * 1024) {  // Check if the file size exceeds 5MB
                    showMessage(`${file.name} exceeds 5MB size limit`, 'error');
                    continue;
                }

                formData.append('files', file);
            }

            // Check if userId exists
            if (!userId) {
                showMessage('User ID is missing', 'error');
                return;
            }

            // Append userId to the form data
            formData.append('userId', userId);

            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 90));
            }, 200);

            const response = await fetch(`${API_URL}/api/UploadManager/uploadImage`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            clearInterval(progressInterval);
            setProgress(100);

            const data = await response.json();

            if (response.ok && data.success) {
                showMessage('Images uploaded successfully', 'success');
                setImageFiles([]);  // Clear the image files
                fetchUploadedImages(); // Refresh the images list
            } else {
                showMessage(data.message || 'Upload failed', 'error');
            }
        } catch (err) {
            console.error('Upload error:', err);
            showMessage('Failed to upload images', 'error');
        } finally {
            setTimeout(() => {
                setShowProgress(false);
                setProgress(0);
            }, 1000);
        }
    };
    return (
        <div className="container mx-auto py-6 space-y-8">
            <Card className="border-t-4 border-t-blue-500">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-blue-700">Upload Configuration and Images</CardTitle>
                            <CardDescription>Upload your configuration file and associated images</CardDescription>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="text-blue-600 hover:text-blue-700 hover:border-blue-300">
                                    <HelpCircle className="h-5 w-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md md:max-w-2xl lg:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold text-blue-700">Help & Instructions</DialogTitle>
                                </DialogHeader>

                                <div className="mt-6 space-y-6">
                                    <div className="rounded-lg border p-4 bg-blue-50">
                                        <h3 className="text-lg font-semibold text-blue-700 mb-4">Config File Uploading Instructions</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <Badge className="bg-blue-500 hover:bg-blue-600 h-6 w-6 flex items-center justify-center p-0 rounded-full">1</Badge>
                                                <p>Select a configuration file (JSON) containing category and question details.</p>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Badge className="bg-blue-500 hover:bg-blue-600 h-6 w-6 flex items-center justify-center p-0 rounded-full">2</Badge>
                                                <p>Upload the configuration before selecting images.</p>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Badge className="bg-blue-500 hover:bg-blue-600 h-6 w-6 flex items-center justify-center p-0 rounded-full">3</Badge>
                                                <p>Once uploaded, choose a folder with images.</p>
                                            </div>

                                            <div className="flex items-start gap-3">
                                                <Badge className="bg-blue-500 hover:bg-blue-600 h-6 w-6 flex items-center justify-center p-0 rounded-full">4</Badge>
                                                <p>Click the 'Upload Images' button to complete the process.</p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-blue-200">
                                            <p className="text-red-600 font-medium">Note: If you get any errors uploading, please make sure you triple check that the layout of your config file is correct.</p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-4">
                                        <h3 className="text-lg font-semibold text-blue-700 mb-2">Example JSON Format:</h3>
                                        <pre className="bg-gray-100 text-sm p-3 rounded-lg mt-2 overflow-x-auto">
                                            {`{
    "CategoryName": "Jink",
    "Questions": [
        {
            "QuestionKey": "jink-001",
            "QuestionText": "What is the primary color of this Jink?",
            "Options": [
                { "OptionText": "Red" },
                { "OptionText": "Blue" },
                { "OptionText": "Green" },
                { "OptionText": "Purple" }
            ]
        },
        {
            "QuestionKey": "jink-002",
            "QuestionText": "What is the typical habitat of a Jink?",
            "Options": [
                { "OptionText": "Mountains" },
                { "OptionText": "Forests" },
                { "OptionText": "Deserts" },
                { "OptionText": "Oceans" }
            ]
        }
    ]
}`}
                                        </pre>
                                    </div>

                                    <div className="rounded-lg border p-4 bg-purple-50">
                                        <h3 className="text-lg font-semibold text-purple-700 mb-4">Manually Adding Questions</h3>
                                        <p className="mb-4">
                                            You can also manually enter the data if you would like. This function also doubles as allowing you to upload new questions to an already existing category.
                                        </p>
                                        <p className="font-medium">
                                            Once you have manually added all your data, upload then upload your images.
                                        </p>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Tabs defaultValue="file" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="file">Upload Config File</TabsTrigger>
                            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                        </TabsList>

                        <TabsContent value="file">
                            <label className="block space-y-2">
                                <span className="text-sm font-medium">Configuration File (JSON)</span>
                                <label htmlFor="configFileInput" className="block">
                                    <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 hover:bg-blue-50/50 cursor-pointer transition-colors">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText className="h-8 w-8 text-blue-500" />
                                            <span className="text-sm text-blue-600">
                                                {configFile ? configFile.name : 'Select Config File'}
                                            </span>
                                        </div>
                                    </div>
                                </label>
                                <input
                                    id="configFileInput"
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </label>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
                                onClick={handleConfigUpload}
                                disabled={!configFile}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Configuration
                            </Button>
                        </TabsContent>

                        <TabsContent value="manual">
                            <ManualConfigForm
                                onConfigSubmit={handleManualConfigSubmit}
                                showMessage={showMessage}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Category Display */}
                    {categoryName && (
                        <Alert className="border-blue-200 bg-blue-50">
                            <AlertDescription className="flex items-center gap-2 text-blue-700">
                                <span>Category from config: </span>
                                <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300">{categoryName}</Badge>
                                {configUploaded && (
                                    <Badge className="ml-auto bg-green-500 hover:bg-green-600">Configuration Saved</Badge>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                    {/* Image Folder Selection */}
                    <div className={`space-y-4 ${!configUploaded ? 'opacity-50' : ''}`}>
                        <div className="relative">
                            {!configUploaded && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Lock className="h-4 w-4" />
                                        <span>Save configuration first</span>
                                    </div>
                                </div>
                            )}

                            {configUploaded && (
                                <>
                                    <label className="block space-y-2">
                                        <span className="text-sm font-medium">Images Folder</span>
                                        <label htmlFor="imageFolderInput" className="block">
                                            <div className="border-2 border-dashed border-purple-200 rounded-lg p-6 hover:bg-purple-50/50 cursor-pointer transition-colors">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Folder className="h-8 w-8 text-purple-500" />
                                                    <span className="text-sm text-purple-600">
                                                        {imageFiles.length > 0
                                                            ? `${imageFiles.length} image(s) selected`
                                                            : 'Select Images Folder'}
                                                    </span>
                                                </div>
                                            </div>
                                        </label>
                                        <input
                                            id="imageFolderInput"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            webkitdirectory=""
                                            directory=""
                                            onChange={handleFolderSelect}
                                            className="hidden"
                                            disabled={!configUploaded}
                                        />
                                    </label>

                                    <Button
                                        className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                                        onClick={handleImageUpload}
                                        disabled={!configUploaded || imageFiles.length === 0}
                                    >
                                        <ImageIcon className="mr-2 h-4 w-4" />
                                        Upload Images
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {showProgress && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-blue-700">
                                <span>Upload Progress</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress
                                value={progress}
                                className="h-2 bg-blue-100"
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </Progress>
                        </div>
                    )}

                    {/* Message Display */}
                    {message && (
                        <Alert
                            variant={message.type === 'error' ? 'destructive' : 'default'}
                            className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}
                        >
                            <AlertDescription className={
                                message.type === 'error' ? 'text-red-700' : 'text-green-700'
                            }>
                                {message.text}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Uploaded Images Section */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold tracking-tight text-blue-700">Uploaded Images</h2>
                <Separator className="bg-blue-200" />

                {Object.entries(uploadedImages).map(([categoryId, images]) => (
                    <Card
                        key={categoryId}
                        className={`border-t-4 border-t-purple-500 transition-all ${dragOverCategoryId === categoryId ? 'ring-2 ring-purple-500 shadow-lg' : ''
                            }`}
                        onDragEnter={(e) => handleDragEnter(e, categoryId)}
                        onDragOver={preventDefaults}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, categoryId)}
                    >
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-purple-700">
                                <span>Category ID: {categoryId}</span>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                                        {images.length} images
                                    </Badge>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteCategory(categoryId)}
                                        className="ml-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardTitle>
                            {dragOverCategoryId === categoryId && (
                                <div className="text-sm text-purple-600">
                                    Drop images here to upload to this category
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {images.map((image) => (
                                    <div
                                        key={image.id}
                                        className="group relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50"
                                    >
                                        <img
                                            src={getImageUrl(image.imagePath)}
                                            alt={image.fileName}
                                            className="object-cover w-full h-full transition-all group-hover:scale-105"
                                            onError={(e) => {
                                                console.error(`Failed to load image: ${image.fileName}`);
                                                e.target.onerror = null;
                                                setTimeout(() => {
                                                    const timestamp = new Date().getTime();
                                                    e.target.src = `${getImageUrl(image.imagePath)}?t=${timestamp}`;
                                                }, 1000);
                                                e.target.onerror = () => {
                                                    e.target.src = '/placeholder-image.png';
                                                };
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-white truncate">
                                                        {image.fileName}
                                                    </p>
                                                    <p className="text-xs text-white/80">
                                                        {format(new Date(image.uploadDate), 'MMM d, yyyy')}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteImage(image);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {Object.keys(uploadedImages).length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8 text-purple-500">
                            <ImageIcon className="h-12 w-12 mb-4" />
                            <p>No images uploaded yet</p>
                        </CardContent>
                    </Card>
                )}
            </div>
            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription>
                            {itemToDelete?.type === 'category' ? (
                                <>
                                    <AlertCircle className="h-6 w-6 text-red-500 mb-2" />
                                    Are you sure you want to delete this category and all its associated images? This action cannot be undone.
                                </>
                            ) : (
                                <>
                                    Are you sure you want to delete this image? This action cannot be undone.
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-500 hover:bg-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default UploadManager;