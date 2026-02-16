import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestLayout from '../layouts/GuestLayout';
import Button from '../components/ui/Button';
import InlineAlert from '../components/ui/InlineAlert';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSubmitError('');
        setLoading(true);

        try {
            await register(form);
            navigate('/');
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                setSubmitError('Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <GuestLayout>
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md">
                    <h1 className="text-3xl font-bold text-center mb-6">Register</h1>

                    {submitError && (
                        <div className="mb-4">
                            <InlineAlert>{submitError}</InlineAlert>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">

                        {/* Name */}
                        <div>
                            <label className="block text-gray-700 mb-2">Name</label>
                            <input
                                name="name"
                                type="text"
                                placeholder="Your name"
                                value={form.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 ${errors.name ? 'border-red-500' : ''}`}
                                required
                            />
                            {errors.name && <p className="text-red-600 mt-1">{errors.name[0]}</p>}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-gray-700 mb-2">Email</label>
                            <input
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 ${errors.email ? 'border-red-500' : ''}`}
                                required
                            />
                            {errors.email && <p className="text-red-600 mt-1">{errors.email[0]}</p>}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-gray-700 mb-2">Password</label>
                            <input
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 ${errors.password ? 'border-red-500' : ''}`}
                                required
                            />
                            {errors.password && <p className="text-red-600 mt-1">{errors.password[0]}</p>}
                        </div>

                        {/* Password confirmation */}
                        <div>
                            <label className="block text-gray-700 mb-2">Confirm Password</label>
                            <input
                                name="password_confirmation"
                                type="password"
                                placeholder="••••••••"
                                value={form.password_confirmation}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100"
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
                            {loading ? 'Registering...' : 'Register'}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-gray-500">
                        Already have an account?{' '}
                        <a href="/login" className="text-blue-600 hover:underline">
                            Login
                        </a>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
