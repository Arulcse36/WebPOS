import { useState, useEffect } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/users`;

const Users = () => {
    const [form, setForm] = useState({
        name: "",
        password: ""
    });

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showResetModal, setShowResetModal] = useState(null);
    
    // Get companyId from localStorage
    const companyId = localStorage.getItem("companyId");

    useEffect(() => {
        if (companyId) {
            loadData();
        }
    }, [companyId]);

    // 🔹 Load Users
    const loadData = async () => {
        if (!companyId) return;
        
        setLoading(true);
        try {
            const res = await axios.get(`${API}?companyId=${companyId}`);
            console.log('Loaded users:', res.data);
            setList(res.data);
        } catch (err) {
            console.error(err);
            alert("Error loading users");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Save User (Add)
    const saveUser = async () => {
        if (!form.name || !form.password) {
            alert("Name and Password are required");
            return;
        }

        if (!companyId) {
            alert("No company associated. Please login again.");
            return;
        }

        try {
            const res = await axios.post(API, {
                companyId: companyId,
                name: form.name,
                password: form.password
            });
            console.log('User created:', res.data);
            setList([res.data, ...list]);
            alert("User created successfully!");
            
            // Reset form
            setForm({
                name: "",
                password: ""
            });
        } catch (err) {
            console.error('Error:', err.response?.data);
            alert(err.response?.data?.error || "Error saving user");
        }
    };

    // 🔹 Reset Password
    const resetPassword = async (userId, newPassword) => {
        try {
            await axios.put(`${API}/${userId}?companyId=${companyId}`, {
                password: newPassword
            });
            alert("Password reset successfully!");
            setShowResetModal(null);
            loadData();
        } catch (err) {
            console.error('Error:', err.response?.data);
            alert(err.response?.data?.error || "Error resetting password");
        }
    };

    // 🔹 Toggle User Status
    const toggleStatus = async (userId, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
        
        try {
            await axios.put(`${API}/${userId}?companyId=${companyId}`, {
                isActive: !currentStatus
            });
            alert(`User ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
            loadData();
        } catch (err) {
            console.error('Error:', err.response?.data);
            alert(err.response?.data?.error || "Error updating user status");
        }
    };

    // 🔹 Delete User
    const deleteUser = async (userId) => {
        if (!window.confirm("Delete this user permanently?")) return;

        try {
            await axios.delete(`${API}/${userId}?companyId=${companyId}`);
            setList(list.filter(x => x._id !== userId));
            alert("User deleted successfully!");
        } catch (err) {
            console.error('Error:', err.response?.data);
            alert(err.response?.data?.error || "Error deleting user");
        }
    };

    // Reset Password Modal
    const ResetPasswordModal = ({ user, onClose }) => {
        const [newPassword, setNewPassword] = useState("");
        const [confirmPassword, setConfirmPassword] = useState("");
        const [showNewPassword, setShowNewPassword] = useState(false);
        const [showConfirmPassword, setShowConfirmPassword] = useState(false);

        const handleReset = () => {
            if (!newPassword) {
                alert("Please enter a new password");
                return;
            }
            if (newPassword !== confirmPassword) {
                alert("Passwords do not match");
                return;
            }
            if (newPassword.length < 4) {
                alert("Password must be at least 4 characters");
                return;
            }
            resetPassword(user._id, newPassword);
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">Reset Password</h3>
                    <p className="mb-4 text-gray-600">
                        Reset password for: <strong>{user.name}</strong>
                        <br />
                        <span className="text-xs text-gray-500">Username: {user.username}</span>
                    </p>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                                placeholder="Enter new password"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                                {showNewPassword ? "👁️" : "🔒"}
                            </button>
                        </div>
                    </div>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg pr-10"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            >
                                {showConfirmPassword ? "👁️" : "🔒"}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Reset Password
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (!companyId) {
        return (
            <div className="w-full flex justify-center">
                <div className="bg-white w-full max-w-xl p-4 sm:p-6 rounded-2xl shadow-xl text-center">
                    <p className="text-red-500">No company associated. Please login again.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex justify-center">
            <div className="bg-white w-full max-w-xl p-4 sm:p-6 rounded-2xl shadow-xl text-black">
                <h1 className="text-xl sm:text-2xl font-bold mb-4">
                    👥 User Management
                </h1>

                {/* Add User Form */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h3 className="font-semibold mb-3">Add New User</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <div>
                            <label className="text-sm font-medium">Full Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="w-full px-3 h-11 border rounded-lg mt-1"
                                placeholder="Enter user's full name"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Username will be auto-generated as: company.user.name
                            </p>
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium">Password *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full px-3 h-11 border rounded-lg mt-1 pr-10"
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? "👁️" : "🔒"}
                                </button>
                            </div>
                        </div>
                        
                        <button
                            onClick={saveUser}
                            className="px-4 h-11 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            + Add User
                        </button>
                    </div>
                </div>

                {/* Users List */}
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : (
                    <ul className="space-y-2">
                        {list.map((user) => (
                            <li
                                key={user._id}
                                className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                                    user.isActive ? 'bg-slate-100' : 'bg-red-50 border-l-4 border-red-500'
                                }`}
                            >
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">
                                            {user.name}
                                        </span>
                                        {!user.isActive && (
                                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        Username: {user.username}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        Created: {new Date(user.createdAt).toLocaleDateString()}
                                    </span>
                                    {user.lastLogin && (
                                        <span className="text-xs text-gray-400">
                                            Last login: {new Date(user.lastLogin).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowResetModal(user)}
                                        className="text-blue-600 hover:text-blue-800 text-xl"
                                        title="Reset Password"
                                    >
                                        🔑
                                    </button>
                                    <button 
                                        onClick={() => toggleStatus(user._id, user.isActive)}
                                        className={`text-xl ${user.isActive ? 'text-orange-600' : 'text-green-600'}`}
                                        title={user.isActive ? "Deactivate" : "Activate"}
                                    >
                                        {user.isActive ? '🔴' : '✅'}
                                    </button>
                                    <button 
                                        onClick={() => deleteUser(user._id)}
                                        className="text-red-600 hover:text-red-800 text-xl"
                                        title="Delete"
                                    >
                                        ❌
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {!loading && list.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No users found. Add your first user!
                    </div>
                )}
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <ResetPasswordModal 
                    user={showResetModal}
                    onClose={() => setShowResetModal(null)}
                />
            )}
        </div>
    );
};

export default Users;