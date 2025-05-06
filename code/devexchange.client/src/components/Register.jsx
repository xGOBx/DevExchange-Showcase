import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

function Register() {
    document.title = "Register";
    const location = useLocation();
    const navigate = useNavigate();

    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        const user = localStorage.getItem("user");
        if (user) {
            // Redirect to the previous page if user is already registered
            navigate(from, { replace: true });
        }
    }, [from, navigate]);

    return (
        <section className='flex justify-center items-center min-h-screen bg-gray-100'>
            <div className='w-full max-w-md bg-white shadow-lg rounded-lg p-8'>
                <header className='mb-6'>
                    <h1 className='text-3xl font-semibold text-center text-gray-700'>Register</h1>
                </header>
                <p className='message text-center text-red-500 mb-4'></p>
                <div className='form-holder'>
                    <form action="#" className='register' onSubmit={registerHandler}>
                        <div className='mb-4'>
                            <label htmlFor="name" className='block text-sm font-medium text-gray-700'>Name</label>
                            <input
                                type="text"
                                name='Name'
                                id='name'
                                required
                                className='mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        <div className='mb-4'>
                            <label htmlFor="email" className='block text-sm font-medium text-gray-700'>Email</label>
                            <input
                                type="email"
                                name='Email'
                                id='email'
                                required
                                className='mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        <div className='mb-4'>
                            <label htmlFor="password" className='block text-sm font-medium text-gray-700'>Password</label>
                            <input
                                type="password"
                                name='Password'
                                id='password'
                                required
                                className='mt-1 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                            />
                        </div>
                        <div className='flex justify-center'>
                            <input
                                type="submit"
                                value="Register"
                                className='bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400'
                            />
                        </div>
                    </form>
                </div>
                <div className='my-5 text-center'>
                    <span>Or </span>
                    <a href="/login" className='text-blue-500 hover:underline'>Login</a>
                </div>
            </div>
        </section>
    );

    async function registerHandler(e) {
        e.preventDefault();
        const form_ = e.target, submitter = document.querySelector("input.login");

        const formData = new FormData(form_, submitter), dataToSend = {};

        for (const [key, value] of formData) {
            dataToSend[key] = value;
        }

        // Create username
        const newUserName = dataToSend.Name.trim().split(" ");
        dataToSend.UserName = newUserName.join("");

        const response = await fetch(`${API_URL}/api/securewebsite/register`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify(dataToSend),
            headers: {
                "content-type": "Application/json",
                "Accept": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Redirect to login page with the original 'from' location
            navigate('/login', { state: { from: location.state?.from } });
        }

        const messageEl = document.querySelector(".message");
        if (data.message) {
            messageEl.innerHTML = data.message;
        } else {
            let errorMessages = "<div>Attention please:</div><div class='normal'>";
            data.errors.forEach(error => {
                errorMessages += error.description + " ";
            });

            errorMessages += "</div>";
            messageEl.innerHTML = errorMessages;
        }

        console.log("login error: ", data);
    }
}

export default Register;
