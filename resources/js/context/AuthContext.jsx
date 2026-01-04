import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

import axios from '../lib/axios';

/*
|--------------------------------------------------------------------------
| Create Context
|--------------------------------------------------------------------------
*/

const AuthContext = createContext(null);

/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
*/

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /*
    |--------------------------------------------------------------------------
    | Load authenticated user from backend
    |--------------------------------------------------------------------------
    */
    const fetchUser = async () => {
        try {
            const response = await axios.get('/api/user');
            setUser(response.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */
    const login = async ({ email, password }) => {
        await axios.get('/sanctum/csrf-cookie');

        await axios.post('/login', {
            email,
            password,
        });

        await fetchUser();
    };

    /*
    |--------------------------------------------------------------------------
    | Register
    |--------------------------------------------------------------------------
    */
    const register = async (data) => {
        await axios.get('/sanctum/csrf-cookie');

        await axios.post('/register', data);

        await fetchUser();
    };

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */
    const logout = async () => {
        await axios.post('/logout');
        setUser(null);
    };

    /*
    |--------------------------------------------------------------------------
    | Initial Load (Persist Auth on Refresh)
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export function useAuth() {
    return useContext(AuthContext);
}
