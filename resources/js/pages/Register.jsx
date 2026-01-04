import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GuestLayout from '../layouts/GuestLayout';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = async (e) => {
        e.preventDefault();
        await register(form);
        navigate('/');
    };

    return (
        <GuestLayout>
            <h1>Register</h1>
            <form onSubmit={submit}>
                {Object.keys(form).map(key => (
                    <input
                        key={key}
                        type={key.includes('password') ? 'password' : 'text'}
                        placeholder={key.replace('_', ' ')}
                        value={form[key]}
                        onChange={e => setForm({ ...form, [key]: e.target.value })}
                    />
                ))}
                <button type="submit">Register</button>
            </form>
        </GuestLayout>
    );
}
