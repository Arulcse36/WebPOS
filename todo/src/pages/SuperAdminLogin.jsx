import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = `${import.meta.env.VITE_API_URL}/admin`;

const SuperAdminLogin = ({ onLogin }) => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({
        username: "",
        password: ""
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!credentials.username || !credentials.password) {
            setError("Please enter username and password");
            return;
        }
        
        setLoading(true);
        setError("");
        
        try {
            // Calling /admin endpoint (matches your auth route)
            const response = await axios.post(`${API}`, {
                username: credentials.username,
                password: credentials.password
            });
            
            console.log('Login response:', response.data);
            
            if (response.data.success) {
                localStorage.setItem("user", JSON.stringify(response.data.user));
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("isSuperAdmin", "true");
                localStorage.setItem("userType", "super_admin");
                
                if (onLogin) {
                    onLogin(response.data.user);
                }
                
                navigate("/admin/dashboard");
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">👑</div>
                    <h1 className="text-2xl font-bold text-gray-800">Super Admin Login</h1>
                    <p className="text-gray-600 mt-2">Enter your super admin credentials</p>
                </div>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={credentials.username}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Enter username"
                            autoFocus
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                                placeholder="Enter password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? "👁️" : "🔒"}
                            </button>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Logging in..." : "Login as Super Admin"}
                    </button>
                </form>
                
                <div className="mt-6 p-3 bg-gray-100 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                        🔐 Super Admin Access Only<br />
                        Username: Admin<br />
                        Password: admin
                    </p>
                </div>
                
                <div className="mt-4 text-center">
                    <a href="/login" className="text-sm text-blue-600 hover:text-blue-800">
                        Company Login →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLogin;