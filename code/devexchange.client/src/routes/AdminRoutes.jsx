import { useState, useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

function AdminRoutes() {
    const [isAdmin, setIsAdmin] = useState(false);
    const [waiting, setWaiting] = useState(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/api/Admin/CheckAdmin`, {
                    credentials: 'include',
                    method: 'GET',
                });

                if (response.ok) {
                    const data = await response.json();
                    setIsAdmin(data.isAdmin);  // If admin, allow access
                    setWaiting(false);
                } else {
                    setIsAdmin(false);
                    setWaiting(false);  // Not admin, redirect
                }
            } catch (error) {
                console.error("Error checking admin status:", error);
                setWaiting(false);
                setIsAdmin(false);
            }
        };

        checkAdminStatus();
    }, []);

    // If waiting for response, show a loading page
    if (waiting) {
        return (
            <div className="waiting-page">
                <div>Loading...</div>
            </div>
        );
    }

    // If not an admin, redirect to home or login
    return isAdmin ? <Outlet /> : <Navigate to="/home" />;
}

export default AdminRoutes;
