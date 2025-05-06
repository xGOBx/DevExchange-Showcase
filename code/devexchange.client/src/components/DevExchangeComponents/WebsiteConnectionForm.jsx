import React, { useState } from 'react';
import { Upload, Github } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
const API_URL = import.meta.env.VITE_API_URL;

const WebsiteConnectionForm = () => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        link: '',
        gitHubLink: '',
        image: null,
    });
    const [preview, setPreview] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5000000) {
                setError('Image must be less than 5MB');
                return;
            }
            setFormData({ ...formData, image: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    const sendSubmissionConfirmationEmail = async (WebsiteId) => {
        try {
            const response = await fetch(`${API_URL}/api/WebsiteEmail/sendSubmissionConfirmation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ WebsiteId }),
            });

            if (!response.ok) {
                console.error('Failed to send confirmation email');
            }
        } catch (error) {
            console.error('Error sending confirmation email:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.link || !formData.image) {
            setError('Please fill in all required fields and upload an image');
            return;
        }

        // Validate GitHub link format if provided
        if (formData.gitHubLink && !formData.gitHubLink.startsWith('https://github.com/')) {
            setError('GitHub link must start with https://github.com/');
            return;
        }

        setError('');
        setSuccess(false);
        setSubmitting(true);

        try {
            // First, verify user session and get user ID
            const userResponse = await fetch(`${API_URL}/api/securewebsite/CheckUserReturnId`, {
                method: 'GET',
                credentials: 'include',
            });

            if (!userResponse.ok) {
                throw new Error(userResponse.status === 403
                    ? 'Please log in to continue'
                    : await userResponse.text() || 'Failed to verify user session');
            }

            const userData = await userResponse.json();

            // Prepare form data with proper Content-Type
            const imageData = new FormData();
            imageData.append('image', formData.image);
            imageData.append('title', formData.title);
            imageData.append('description', formData.description);
            imageData.append('link', formData.link);
            imageData.append('gitHubLink', formData.gitHubLink);
            imageData.append('userId', userData.userId);

            const uploadResponse = await fetch(`${API_URL}/api/WebsiteConnection/uploadUserProgramData`, {
                method: 'POST',
                body: imageData,
                credentials: 'include'
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.message || 'Failed to upload connection');
            }

            const result = await uploadResponse.json();
            if (!result.success) {
                throw new Error(result.message || 'Upload failed');
            }

            // Send confirmation email
            await sendSubmissionConfirmationEmail(result.data.id);

            setSuccess(true);
            setShowSuccessDialog(true);
            setFormData({ title: '', description: '', link: '', gitHubLink: '', image: null });
            setPreview('');
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to upload. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className="max-w-md mx-auto mt-8">
            <CardHeader>
                <CardTitle>Connect Your Website</CardTitle>
                <div className="bg-blue-50 p-4 rounded-lg mt-4 text-sm text-blue-800">
                    <h3 className="font-semibold mb-2">How to Connect Your Website:</h3>
                    <ol className="list-decimal list-inside space-y-2">
                        <li>Enter your website's title that will be displayed to users</li>
                        <li>Provide a compelling description (this helps users understand what your website offers)</li>
                        <li>Input your website's homepage URL (must start with http:// or https://)</li>
                        <li>Optionally, provide a GitHub repository link for your project</li>
                        <li>Upload a banner image that represents your website (max 5MB)
                            <ul className="list-disc list-inside ml-4 mt-1 text-blue-700">
                                <li>Recommended size: 1200x630 pixels</li>
                                <li>Format: JPG, PNG, or GIF</li>
                            </ul>
                        </li>
                    </ol>
                    <p className="mt-3 text-blue-700 italic">
                        Note: All submissions will be reviewed for quality and relevance before being published.
                        You will receive an email notification once your submission has been approved.
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Website Title <span className="text-red-500">*</span></label>
                        <Input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter website title"
                            className="w-full"
                            disabled={submitting}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Description <span className="text-red-500">*</span></label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Enter a brief description of your website"
                            className="min-h-[100px] resize-y"
                            disabled={submitting}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Homepage URL <span className="text-red-500">*</span></label>
                        <Input
                            type="url"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="https://example.com"
                            className="w-full"
                            disabled={submitting}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium flex items-center gap-1">
                            <Github size={16} />
                            GitHub Repository URL <span className="text-gray-500 text-xs">(Optional)</span>
                        </label>
                        <Input
                            type="url"
                            value={formData.gitHubLink}
                            onChange={(e) => setFormData({ ...formData, gitHubLink: e.target.value })}
                            placeholder="https://github.com/username/repository"
                            className="w-full"
                            disabled={submitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Banner Image <span className="text-red-500">*</span></label>
                        <div className="mt-1 flex items-center">
                            <Button
                                type="button"
                                onClick={() => document.getElementById('image-upload').click()}
                                className="flex items-center gap-2"
                                disabled={submitting}
                            >
                                <Upload size={16} />
                                Upload Image
                            </Button>
                            <input
                                id="image-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                                disabled={submitting}
                                required
                            />
                        </div>
                        {preview && (
                            <div className="mt-2">
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="max-h-32 rounded-lg object-cover"
                                />
                            </div>
                        )}
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Connection'}
                    </Button>
                </form>
            </CardContent>

            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Website Connection Submitted Successfully!</DialogTitle>
                        <DialogDescription>
                            Your website connection has been submitted and is pending verification.
                            A confirmation email has been sent to your registered email address.
                            You will receive another email notification once your submission has been reviewed and approved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                        <Button onClick={() => setShowSuccessDialog(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default WebsiteConnectionForm;