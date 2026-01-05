import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestLayout from '../layouts/GuestLayout';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
    const [errors, setErrors] = useState({});

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        setErrors({});
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            }
        }
    };

    return (
        <GuestLayout>
            <h1>Register</h1>
            <form onSubmit={submit}>
                <div>
                    <input name="name" placeholder="Name" value={form.name} onChange={handleChange} />
                    {errors.name && <p style={{ color: 'red' }}>{errors.name[0]}</p>}
                </div>
                <div>
                    <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
                    {errors.email && <p style={{ color: 'red' }}>{errors.email[0]}</p>}
                </div>
                <div>
                    <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
                    {errors.password && <p style={{ color: 'red' }}>{errors.password[0]}</p>}
                </div>
                <div>
                    <input name="password_confirmation" type="password" placeholder="Confirm Password" value={form.password_confirmation} onChange={handleChange} />
                </div>
                <button type="submit">Register</button>
            </form>
        </GuestLayout>
    );
}
