import { useState, useEffect } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}/companies`;

const Company = () => {
    const [form, setForm] = useState({
        companyName: "",
        companyPrintOutName: "",
        headerLine1: "",
        headerLine2: "",
        headerLine3: "",
        footer: "Thank You for Shopping With Us\nPlease Visit Again\nGoods once sold cannot be returned\nPowered by Bill Mate POS System",
        adminUsername: "",
        adminPassword: ""
    });

    const [list, setList] = useState([]);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        loadData();
    }, [showInactive]);

    // 🔹 Generate admin username from company name
    const generateAdminUsername = (companyName) => {
        if (!companyName) return "";
        // Convert to lowercase, replace spaces with dots, remove special characters
        const username = companyName.toLowerCase().replace(/\s+/g, '.') + '.admin';
        return username;
    };

    // 🔹 Update admin username when company name changes
    const handleCompanyNameChange = (e) => {
        const newCompanyName = e.target.value;
        const newAdminUsername = generateAdminUsername(newCompanyName);
        setForm({ 
            ...form, 
            companyName: newCompanyName,
            adminUsername: newAdminUsername
        });
    };

    // 🔹 Load Companies
    const loadData = async () => {
        setLoading(true);
        try {
            const url = showInactive ? `${API}?showInactive=true` : API;
            const res = await axios.get(url);
            setList(res.data);
        } catch (err) {
            console.error(err);
            alert("Error loading companies");
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Save (Add / Update)
    const saveCompany = async () => {
        if (!form.companyName || !form.companyPrintOutName || 
            !form.headerLine1 || !form.headerLine2 || !form.headerLine3) {
            alert("All header fields are required");
            return;
        }
        
        // For new company, admin password is required (username is auto-generated)
        if (!editId && !form.adminPassword) {
            alert("Company admin password is required");
            return;
        }

        try {
            if (editId) {
                const updateData = {
                    companyName: form.companyName,
                    companyPrintOutName: form.companyPrintOutName,
                    headerLine1: form.headerLine1,
                    headerLine2: form.headerLine2,
                    headerLine3: form.headerLine3,
                    footer: form.footer
                };
                
                // Only send password if it's changed
                if (form.adminPassword) {
                    updateData.adminPassword = form.adminPassword;
                }
                // Username is auto-generated based on company name
                updateData.adminUsername = generateAdminUsername(form.companyName);
                
                const res = await axios.put(`${API}/${editId}`, updateData);
                setList(list.map(x => x._id === editId ? res.data : x));
                setEditId(null);
                alert("Company updated successfully!");
            } else {
                const res = await axios.post(API, {
                    companyName: form.companyName,
                    companyPrintOutName: form.companyPrintOutName,
                    headerLine1: form.headerLine1,
                    headerLine2: form.headerLine2,
                    headerLine3: form.headerLine3,
                    footer: form.footer,
                    adminUsername: generateAdminUsername(form.companyName),
                    adminPassword: form.adminPassword
                });
                setList([res.data, ...list]);
                alert("Company added successfully!");
            }

            // Reset form with default footer
            setForm({
                companyName: "",
                companyPrintOutName: "",
                headerLine1: "",
                headerLine2: "",
                headerLine3: "",
                footer: "Thank You for Shopping With Us\nPlease Visit Again\nGoods once sold cannot be returned\nPowered by Bill Mate POS System",
                adminUsername: "",
                adminPassword: ""
            });

        } catch (err) {
            alert(err.response?.data?.error || "Error saving company");
        }
    };

    // 🔹 Deactivate Company
    const deactivateCompany = async (id, reason) => {
        try {
            const res = await axios.patch(`${API}/${id}/deactivate`, { reason });
            setList(list.map(x => x._id === id ? res.data.company : x));
            alert("Company deactivated successfully!");
            setShowDeactivateModal(null);
        } catch (err) {
            alert(err.response?.data?.error || "Error deactivating company");
        }
    };

    // 🔹 Reactivate Company
    const reactivateCompany = async (id) => {
        if (!window.confirm("Reactivate this company?")) return;
        
        try {
            const res = await axios.patch(`${API}/${id}/reactivate`);
            setList(list.map(x => x._id === id ? res.data.company : x));
            alert("Company reactivated successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Error reactivating company");
        }
    };

    // 🔹 Edit
    const editItem = (item) => {
        if (!item.isActive) {
            alert("Cannot edit deactivated company. Please reactivate it first.");
            return;
        }
        
        setForm({
            companyName: item.companyName,
            companyPrintOutName: item.companyPrintOutName,
            headerLine1: item.headerLine1,
            headerLine2: item.headerLine2,
            headerLine3: item.headerLine3,
            footer: item.footer || "Thank You for Shopping With Us\nPlease Visit Again\nGoods once sold cannot be returned\nPowered by Bill Mate POS System",
            adminUsername: item.adminUser?.username || generateAdminUsername(item.companyName),
            adminPassword: "" // Don't load password for security
        });
        setEditId(item._id);
    };

    // 🔹 Delete
    const deleteItem = async (id) => {
        if (!window.confirm("Delete this company permanently?")) return;

        try {
            await axios.delete(`${API}/${id}`);
            setList(list.filter(x => x._id !== id));
            alert("Company deleted successfully!");
        } catch (err) {
            alert(err.response?.data?.error || "Error deleting company");
        }
    };

    // 🔹 Cancel Edit
    const cancelEdit = () => {
        setEditId(null);
        setForm({
            companyName: "",
            companyPrintOutName: "",
            headerLine1: "",
            headerLine2: "",
            headerLine3: "",
            footer: "Thank You for Shopping With Us\nPlease Visit Again\nGoods once sold cannot be returned\nPowered by Bill Mate POS System",
            adminUsername: "",
            adminPassword: ""
        });
    };

    // Deactivate Modal
    const DeactivateModal = ({ company, onClose }) => {
        const [reason, setReason] = useState("");
        
        const handleDeactivate = () => {
            deactivateCompany(company._id, reason);
        };
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">Deactivate Company</h3>
                    <p className="mb-4 text-gray-800">
                        Are you sure you want to deactivate <strong className="text-gray-900">{company.companyName}</strong>?
                    </p>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-800 mb-2">
                            Reason (Optional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white resize-none"
                            rows="3"
                            placeholder="Enter reason for deactivation..."
                            autoFocus
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            ℹ️ This reason will be stored for reference
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleDeactivate}
                            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                        >
                            Deactivate
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full flex justify-center">
            <div className="bg-white w-full max-w-xl p-4 sm:p-6 rounded-2xl shadow-xl text-black">
                <h1 className="text-xl sm:text-2xl font-bold mb-4">
                    🏢 Company Management
                </h1>

                {/* Toggle for showing inactive companies */}
                <div className="mb-4 flex items-center justify-end gap-2">
                    <label className="text-sm text-gray-600">Show Inactive:</label>
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            showInactive ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                showInactive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {/* FORM */}
                <div className="grid grid-cols-1 gap-3 mb-4">
                    {/* Company Name */}
                    <div>
                        <label className="text-sm font-medium">Company Name *</label>
                        <input
                            value={form.companyName}
                            onChange={handleCompanyNameChange}
                            className="w-full px-3 h-11 border rounded-lg mt-1"
                            placeholder="Enter company name"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            ℹ️ Admin username will be automatically generated as: <strong>{generateAdminUsername(form.companyName) || "companyname.admin"}</strong>
                        </p>
                    </div>

                    {/* Company Print Out Name */}
                    <div>
                        <label className="text-sm font-medium">Company Print Out Name *</label>
                        <input
                            value={form.companyPrintOutName}
                            onChange={(e) => setForm({ ...form, companyPrintOutName: e.target.value })}
                            className="w-full px-3 h-11 border rounded-lg mt-1"
                            placeholder="Enter print out name"
                        />
                    </div>

                    {/* Header Line 1 */}
                    <div>
                        <label className="text-sm font-medium">Header Line 1 *</label>
                        <input
                            value={form.headerLine1}
                            onChange={(e) => setForm({ ...form, headerLine1: e.target.value })}
                            className="w-full px-3 h-11 border rounded-lg mt-1"
                            placeholder="Enter header line 1"
                        />
                    </div>

                    {/* Header Line 2 */}
                    <div>
                        <label className="text-sm font-medium">Header Line 2 *</label>
                        <input
                            value={form.headerLine2}
                            onChange={(e) => setForm({ ...form, headerLine2: e.target.value })}
                            className="w-full px-3 h-11 border rounded-lg mt-1"
                            placeholder="Enter header line 2"
                        />
                    </div>

                    {/* Header Line 3 */}
                    <div>
                        <label className="text-sm font-medium">Header Line 3 *</label>
                        <input
                            value={form.headerLine3}
                            onChange={(e) => setForm({ ...form, headerLine3: e.target.value })}
                            className="w-full px-3 h-11 border rounded-lg mt-1"
                            placeholder="Enter header line 3"
                        />
                    </div>

                    {/* Company Admin Credentials */}
                    <div className="border-t pt-3 mt-2">
                        <h3 className="text-md font-semibold mb-2 text-gray-700">👨‍💼 Company Admin Credentials</h3>
                        <p className="text-xs text-gray-500 mb-3">
                            Admin username is auto-generated from company name. Set a secure password below.
                        </p>
                        
                        {/* Admin Username - Read Only */}
                        <div className="mb-3">
                            <label className="text-sm font-medium">
                                Admin Username (Auto-generated)
                            </label>
                            <input
                                type="text"
                                value={form.adminUsername || generateAdminUsername(form.companyName)}
                                readOnly
                                disabled
                                className="w-full px-3 h-11 border rounded-lg mt-1 bg-gray-100 text-gray-600 cursor-not-allowed"
                                placeholder="Username will be auto-generated"
                            />
                            <p className="text-xs text-blue-500 mt-1">
                                🔒 Username is auto-generated and cannot be changed
                            </p>
                        </div>
                        
                        {/* Admin Password */}
                        <div>
                            <label className="text-sm font-medium">
                                Admin Password {!editId && '*'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={form.adminPassword}
                                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                                    className="w-full px-3 h-11 border rounded-lg mt-1 pr-10"
                                    placeholder={editId ? "Enter new password (optional)" : "Enter company admin password"}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? "👁️" : "🔒"}
                                </button>
                            </div>
                            {editId && (
                                <p className="text-xs text-blue-500 mt-1">
                                    Leave empty to keep current password
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer - Multi-line Text Area */}
                    <div className="mt-2">
                        <label className="text-sm font-medium">Footer Text</label>
                        <textarea
                            value={form.footer}
                            onChange={(e) => setForm({ ...form, footer: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg mt-1"
                            rows="6"
                            placeholder="Enter footer text (one line per message)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            💡 Tip: Press Enter for new line. Each line will appear on a separate line in the bill.
                        </p>
                    </div>

                    {/* Preview Section */}
                    {form.footer && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="text-sm font-medium text-gray-700">Preview:</label>
                            <div className="mt-2 text-sm text-gray-600 whitespace-pre-line">
                                {form.footer}
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={saveCompany}
                            className="flex-1 px-4 h-11 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            {editId ? "Update Company" : "Add Company"}
                        </button>
                        {editId && (
                            <button
                                onClick={cancelEdit}
                                className="px-4 h-11 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* LIST */}
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : (
                    <ul className="space-y-2">
                        {list.map((item) => (
                            <li
                                key={item._id}
                                className={`flex justify-between items-start px-3 py-2 rounded-lg ${
                                    item.isActive ? 'bg-slate-100' : 'bg-red-50 border-l-4 border-red-500'
                                }`}
                            >
                                {/* LEFT */}
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-lg">
                                            {item.companyName}
                                        </span>
                                        {!item.isActive && (
                                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                                Deactivated
                                            </span>
                                        )}
                                    </div>

                                    <span className="text-sm text-gray-600">
                                        🏷️ Print Name: {item.companyPrintOutName}
                                    </span>

                                    <span className="text-sm text-gray-500 mt-1">
                                        📄 {item.headerLine1}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        📄 {item.headerLine2}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        📄 {item.headerLine3}
                                    </span>

                                    {/* Company Admin Info - Safe check */}
                                    {item.adminUser && item.adminUser.username && (
                                        <div className="mt-1">
                                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                                👨‍💼 Admin: {item.adminUser.username}
                                            </span>
                                        </div>
                                    )}

                                    {/* Footer Preview */}
                                    {item.footer && (
                                        <div className="mt-2 p-2 bg-gray-200 rounded text-xs">
                                            <span className="font-medium">Footer:</span>
                                            <div className="whitespace-pre-line text-gray-600 mt-1">
                                                {item.footer.length > 100 
                                                    ? item.footer.substring(0, 100) + "..." 
                                                    : item.footer}
                                            </div>
                                        </div>
                                    )}

                                    {!item.isActive && item.deactivatedReason && (
                                        <span className="text-xs text-red-600 mt-1">
                                            Reason: {item.deactivatedReason}
                                        </span>
                                    )}

                                    <span className="text-xs text-gray-400 mt-1">
                                        📅 Created: {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* RIGHT - Action Buttons */}
                                <div className="flex gap-2 ml-2">
                                    {item.isActive ? (
                                        <>
                                            <button 
                                                onClick={() => editItem(item)}
                                                className="text-blue-600 hover:text-blue-800 text-xl"
                                                title="Edit Company"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={() => setShowDeactivateModal(item)}
                                                className="text-orange-600 hover:text-orange-800 text-xl"
                                                title="Deactivate Company"
                                            >
                                                🔴
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => reactivateCompany(item._id)}
                                                className="text-green-600 hover:text-green-800 text-xl"
                                                title="Reactivate Company"
                                            >
                                                ✅
                                            </button>
                                            <button 
                                                onClick={() => deleteItem(item._id)}
                                                className="text-red-600 hover:text-red-800 text-xl"
                                                title="Delete Permanently"
                                            >
                                                ❌
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {!loading && list.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                        No companies found. Create your first company!
                    </div>
                )}
            </div>

            {/* Deactivate Modal */}
            {showDeactivateModal && (
                <DeactivateModal 
                    company={showDeactivateModal}
                    onClose={() => setShowDeactivateModal(null)}
                />
            )}
        </div>
    );
};

export default Company;