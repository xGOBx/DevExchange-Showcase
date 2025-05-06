import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const API_URL = import.meta.env.VITE_API_URL;

const WebConnectVerification = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [verificationStatus, setVerificationStatus] = useState({
        loading: true,
        success: false,
        message: '',
        alreadyVerified: false
    });

    useEffect(() => {
        // Extract token from URL
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');

        const verifyToken = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/securewebsite/verify-web-connect`, {
                    params: { token }
                });

                setVerificationStatus({
                    loading: false,
                    success: true,
                    message: response.data.message,
                    alreadyVerified: response.data.alreadyVerified
                });
            } catch (error) {
                setVerificationStatus({
                    loading: false,
                    success: false,
                    message: error.response?.data?.error || 'Verification failed',
                    alreadyVerified: false
                });
            }
        };

        if (token) {
            verifyToken();
        } else {
            setVerificationStatus({
                loading: false,
                success: false,
                message: 'No verification token found',
                alreadyVerified: false
            });
        }
    }, [location]);

    const handleRedirect = () => {
        navigate('/home'); // Adjust the path as needed
    };

    if (verificationStatus.loading) {
        return (
            <Card className="w-[400px] mx-auto mt-10">
                <CardHeader>
                    <CardTitle>Verifying...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Checking web connection verification status...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-[400px] mx-auto mt-10">
            <CardHeader>
                <CardTitle>
                    {verificationStatus.success ? 'Verification Successful' : 'Verification Failed'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {verificationStatus.success ? (
                    <Alert variant="default">
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>
                            {verificationStatus.message}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {verificationStatus.message}
                        </AlertDescription>
                    </Alert>
                )}
                {verificationStatus.success && (
                    <Button
                        onClick={handleRedirect}
                        className="w-full mt-4"
                    >
                        Go to Dashboard
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default WebConnectVerification;