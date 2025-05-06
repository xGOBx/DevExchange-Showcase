import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function TrustedWebConnectRoutes() {
    const [isTrustedWebConnect, setIsTrustedWebConnect] = useState(false);
    const [waiting, setWaiting] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkTrustStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/Admin/CheckIsTrustedWebConnect`, {
                    credentials: 'include',
                    method: 'GET',
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsTrustedWebConnect(data.isTrustedWebConnect);
                    setWaiting(false);
                } else {
                    setIsTrustedWebConnect(false);
                    setWaiting(false);
                }
            } catch (error) {
                console.error("Error checking Trusted status:", error);
                setWaiting(false);
                setIsTrustedWebConnect(false);
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

    // If not trusted, redirect to get verified page
    // Pass the original intended location as state so we can redirect back after verification
    return isTrustedWebConnect
        ? <Outlet />
        : <Navigate
            to="/get-verified-web"
            state={{ from: location }}
            replace
        />;
}

export default TrustedWebConnectRoutes;