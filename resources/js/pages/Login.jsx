import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestLayout from '../layouts/GuestLayout';
import Button from '../components/ui/Button';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login({ email, password });
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <GuestLayout>
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">
                    <h1 className="text-3xl font-bold text-center mb-6">Login</h1>

                    {error && (
                        <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded mb-4 text-sm">
                        <div className="font-medium">Demo Accounts</div>
                        <div className="mt-1">
                            Admin: <span className="font-mono">admin@test.com</span> / <span className="font-mono">password</span>
                        </div>
                        <div>
                            User: <span className="font-mono">user@test.com</span> / <span className="font-mono">password</span>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-5">

                        <div>
                            <label className="block text-gray-700 mb-2">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            variant="primary"
                            size="lg"
                            className="w-full"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-gray-500">
                        Don’t have an account?{' '}
                        <a href="/register" className="text-blue-600 hover:underline">
                            Register
                        </a>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
