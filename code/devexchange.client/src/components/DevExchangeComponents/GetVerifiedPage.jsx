import React, { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL;

const GetVerifiedPage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [dialogInfo, setDialogInfo] = useState({
        isOpen: false,
        title: '',
        description: '',
        type: '' // 'success', 'info', 'error'
    });
    const navigate = useNavigate();

    const sendVerificationEmail = useCallback(async () => {
        // Check if user is logged in
        const isLogged = localStorage.getItem("user");
        if (!isLogged) {
            navigate('/login');
            return;
        }
        setIsLoading(true);
        try {
            // First, check user authentication and get user ID
            const userResponse = await fetch(`${API_URL}/api/securewebsite/CheckUserReturnId`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            if (!userResponse.ok) {
                if (userResponse.status === 403) {
                    setDialogInfo({
                        isOpen: true,
                        title: 'Authentication Failed',
                        description: 'You are not logged in. Please log in and try again.',
                        type: 'error'
                    });
                    return;
                }
                throw new Error('Failed to retrieve user ID');
            }
            const userData = await userResponse.json();

            // Send verification email
            const verificationResponse = await fetch(`${API_URL}/api/WebsiteEmail/sendVerificationEmailWebConnect`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userData.userId })
            });
            if (!verificationResponse.ok) {
                throw new Error('Failed to send verification email');
            }
            const verificationData = await verificationResponse.json();

            // Handle different response scenarios
            if (verificationData.alreadyVerified) {
                setDialogInfo({
                    isOpen: true,
                    title: 'Already Verified',
                    description: 'You are already verified for Web Connect.',
                    type: 'info'
                });
            } else if (verificationData.expiresIn) {
                setDialogInfo({
                    isOpen: true,
                    title: 'Verification Pending',
                    description: `A verification token already exists. Expires in ${verificationData.expiresIn}`,
                    type: 'info'
                });
            } else {
                // Successful email send
                setDialogInfo({
                    isOpen: true,
                    title: 'Verification Email Sent',
                    description: verificationData.message || 'Check your inbox and click the verification link to get verified.',
                    type: 'success'
                });
            }
        } catch (error) {
            // Comprehensive error handling
            setDialogInfo({
                isOpen: true,
                title: 'Verification Error',
                description: error.message || 'An unexpected error occurred. Please try again.',
                type: 'error'
            });
            console.error('Full verification process error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const handleCloseDialog = () => {
        // Only navigate to home if it was a successful verification
        if (dialogInfo.type === 'success') {
            navigate('/home');
        }
        // Reset dialog state
        setDialogInfo(prev => ({ ...prev, isOpen: false }));
    };

    const handleVerification = async () => {
        await sendVerificationEmail();
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Get Web Connect Verified</h1>

                <div className="space-y-4">
                    <p className="text-muted-foreground text-center">
                        To access exclusive features, you need to verify your Web Connect status.
                    </p>

                    <Button
                        onClick={handleVerification}
                        disabled={isLoading}
                        className="w-full"
                    >
                        {isLoading ? 'Sending Verification Email...' : 'Send Verification Email'}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground mt-4">
                        <p>Check your email after clicking the button to complete verification.</p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Button
                        variant="link"
                        onClick={() => navigate('/home')}
                    >
                        Return to Home
                    </Button>
                </div>
            </div>

            {/* Dynamic Dialog */}
            <Dialog open={dialogInfo.isOpen} onOpenChange={handleCloseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{dialogInfo.title}</DialogTitle>
                        <DialogDescription>
                            {dialogInfo.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={handleCloseDialog}>
                            {dialogInfo.type === 'success' ? 'Proceed to Home' : 'Okay'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default GetVerifiedPage;