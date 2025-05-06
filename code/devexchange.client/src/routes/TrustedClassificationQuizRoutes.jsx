import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;
function TrustedClassificationQuizRoutes() {
    const [isTrustedClassificationQuiz, setIsTrustedClassificationQuiz] = useState(false);
    const [waiting, setWaiting] = useState(true);

    useEffect(() => {
        const checkTrustStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/Admin/CheckIsTrustedClassificationUpload`, {
                    credentials: 'include',
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsTrustedClassificationQuiz(data.isTrustedClassificationQuiz);
                    setWaiting(false);
                } else {
                    setIsTrustedClassificationQuiz(false);
                    setWaiting(false);
                }
            } catch (error) {
                console.error("Error checking Trusted status:", error);
                setWaiting(false);
                setIsTrustedClassificationQuiz(false);
            }
        };
        checkTrustStatus();
    }, []);

    // If waiting for response, show a loading page
    if (waiting) {
        return (
            <div className="waiting-page">
                <div>Loading...</div>
            </div>
        );
    }

    // If not trusted, redirect to home
    if (!isTrustedClassificationQuiz) {
        return <Navigate to="/home" />;
    }

    // If trusted, just render the Outlet without adding the SubNavBar
    // The SubNavBar will be handled by the parent component
    return <Outlet />;
}

export default TrustedClassificationQuizRoutes;
