// frontend/src/pages/SeedDatabase.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const API = `${import.meta.env.VITE_API_URL}`;

const SeedDatabase = () => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [seeding, setSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState(null);
    const [error, setError] = useState(null);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    
    // State for existing data
    const [existingData, setExistingData] = useState({
        brands: [],
        categories: [],
        products: [],
        loading: false
    });
    const [showExistingData, setShowExistingData] = useState(false);
    const [loadingExistingData, setLoadingExistingData] = useState(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompany) {
            fetchExistingData();
        } else {
            setExistingData({ brands: [], categories: [], products: [], loading: false });
            setShowExistingData(false);
        }
    }, [selectedCompany]);

    const fetchCompanies = async () => {
        setLoadingCompanies(true);
        try {
            const res = await axios.get(`${API}/companies`);
            setCompanies(res.data);
        } catch (error) {
            console.error("Error loading companies:", error);
            setError("Failed to load companies");
        } finally {
            setLoadingCompanies(false);
        }
    };

    const fetchExistingData = async () => {
        if (!selectedCompany) return;
        
        setLoadingExistingData(true);
        try {
            // Fetch existing data for the selected company
            const [brandsRes, categoriesRes, productsRes] = await Promise.all([
                axios.get(`${API}/brands?companyId=${selectedCompany}`),
                axios.get(`${API}/categories?companyId=${selectedCompany}`),
                axios.get(`${API}/products?companyId=${selectedCompany}`)
            ]);
            
            setExistingData({
                brands: brandsRes.data,
                categories: categoriesRes.data,
                products: productsRes.data,
                loading: false
            });
            setShowExistingData(true);
        } catch (error) {
            console.error("Error fetching existing data:", error);
            setExistingData({
                brands: [],
                categories: [],
                products: [],
                loading: false
            });
        } finally {
            setLoadingExistingData(false);
        }
    };

    const handleSeedDatabase = async () => {
        if (!selectedCompany) {
            setError("Please select a company");
            return;
        }

        const selectedCompanyData = companies.find(c => c._id === selectedCompany);
        
        // Create detailed confirmation message with existing data counts
        const confirmationMessage = 
            `⚠️ WARNING: This will OVERRIDE ALL existing grocery data for "${selectedCompanyData?.companyName}"!\n\n` +
            `Current Data:\n` +
            `📊 ${existingData.brands.length} Brand(s)\n` +
            `📂 ${existingData.categories.length} Categorie(s)\n` +
            `🛒 ${existingData.products.length} Product(s)\n\n` +
            `This action will:\n` +
            `• DELETE all ${existingData.brands.length} existing brand(s)\n` +
            `• DELETE all ${existingData.categories.length} existing categorie(s)\n` +
            `• DELETE all ${existingData.products.length} existing product(s)\n\n` +
            `Then it will ADD:\n` +
            `• 25+ New Brands\n` +
            `• 18+ New Categories\n` +
            `• 25+ New Products with variants\n\n` +
            `⚠️ This action CANNOT be undone!\n\n` +
            `Are you ABSOLUTELY sure you want to continue?`;
        
        if (!window.confirm(confirmationMessage)) {
            return;
        }

        setSeeding(true);
        setSeedResult(null);
        setError(null);

        try {
            const res = await axios.post(`${API}/seed-database`, {
                companyId: selectedCompany
            });

            setSeedResult({
                success: true,
                message: res.data.message,
                data: res.data.data
            });
            
            // Refresh existing data after seeding
            await fetchExistingData();
            
        } catch (error) {
            console.error("Error seeding database:", error);
            const errorMessage = error.response?.data?.error || "Failed to seed database";
            setError(errorMessage);
            setSeedResult({
                success: false,
                message: errorMessage
            });
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        🌾 Database Seeder
                    </h1>
                    <p className="text-gray-600 mt-2">Populate your database with sample grocery data</p>
                </div>

                {/* Main Seeding Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-green-600 to-teal-700 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            🚀 Seed Grocery Database
                        </h2>
                        <p className="text-green-100 text-sm mt-1">
                            Populate with pre-configured products, brands, categories, and UOMs
                        </p>
                    </div>
                    
                    <div className="p-6 md:p-8">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Company Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-900">
                                    Select Company <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedCompany}
                                    onChange={(e) => {
                                        setSelectedCompany(e.target.value);
                                        setError(null);
                                        setSeedResult(null);
                                        setShowExistingData(false);
                                    }}
                                    className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-gray-900 bg-white border-gray-300"
                                    disabled={seeding || loadingCompanies}
                                >
                                    <option value="">-- Select a Company --</option>
                                    {companies.map((company) => (
                                        <option key={company._id} value={company._id}>
                                            {company.companyName} {!company.isActive && '(Inactive)'}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Select the company you want to seed data for
                                </p>
                            </div>

                            {/* Existing Data Section */}
                            {selectedCompany && (
                                <div className="border rounded-lg overflow-hidden">
                                    <div 
                                        className="bg-gray-100 px-4 py-3 cursor-pointer flex justify-between items-center hover:bg-gray-200 transition-colors"
                                        onClick={() => setShowExistingData(!showExistingData)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">📊</span>
                                            <span className="font-medium text-gray-900">Existing Data Overview</span>
                                            {loadingExistingData && (
                                                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent ml-2"></span>
                                            )}
                                        </div>
                                        <span className="text-gray-500">
                                            {showExistingData ? '▼' : '▶'}
                                        </span>
                                    </div>
                                    
                                    {showExistingData && !loadingExistingData && (
                                        <div className="p-4 bg-gray-50">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Total Brands</p>
                                                            <p className="text-2xl font-bold text-gray-900">
                                                                {existingData.brands.length}
                                                            </p>
                                                        </div>
                                                        <span className="text-3xl">🏷️</span>
                                                    </div>
                                                    {existingData.brands.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-xs text-gray-500">Recent brands:</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {existingData.brands.slice(0, 3).map(brand => (
                                                                    <span key={brand._id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {brand.name}
                                                                    </span>
                                                                ))}
                                                                {existingData.brands.length > 3 && (
                                                                    <span className="text-xs text-gray-500">+{existingData.brands.length - 3} more</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Total Categories</p>
                                                            <p className="text-2xl font-bold text-gray-900">
                                                                {existingData.categories.length}
                                                            </p>
                                                        </div>
                                                        <span className="text-3xl">📂</span>
                                                    </div>
                                                    {existingData.categories.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-xs text-gray-500">Recent categories:</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {existingData.categories.slice(0, 3).map(cat => (
                                                                    <span key={cat._id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                                        {cat.name}
                                                                    </span>
                                                                ))}
                                                                {existingData.categories.length > 3 && (
                                                                    <span className="text-xs text-gray-500">+{existingData.categories.length - 3} more</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-gray-600">Total Products</p>
                                                            <p className="text-2xl font-bold text-gray-900">
                                                                {existingData.products.length}
                                                            </p>
                                                        </div>
                                                        <span className="text-3xl">🛒</span>
                                                    </div>
                                                    {existingData.products.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-xs text-gray-500">Sample products:</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {existingData.products.slice(0, 2).map(prod => (
                                                                    <span key={prod._id} className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-full">
                                                                        {prod.name}
                                                                    </span>
                                                                ))}
                                                                {existingData.products.length > 2 && (
                                                                    <span className="text-xs text-gray-500">+{existingData.products.length - 2} more</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {(existingData.brands.length > 0 || existingData.categories.length > 0 || existingData.products.length > 0) && (
                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                                    <p className="text-sm text-yellow-800">
                                                        ⚠️ This company already has data. Seeding will OVERRIDE all existing data!
                                                    </p>
                                                </div>
                                            )}

                                            {(existingData.brands.length === 0 && existingData.categories.length === 0 && existingData.products.length === 0) && (
                                                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded">
                                                    <p className="text-sm text-green-800">
                                                        ✅ This company has no existing data. Ready to seed!
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {showExistingData && loadingExistingData && (
                                        <div className="p-8 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-200 border-t-green-600"></div>
                                            <p className="text-gray-600 mt-2">Loading existing data...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Warning Message */}
                            {selectedCompany && existingData.products.length > 0 && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <span className="text-red-600 text-lg">⚠️</span>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Data Override Warning</h3>
                                            <p className="text-xs text-red-700 mt-1">
                                                This company already has {existingData.brands.length} brand(s), {existingData.categories.length} categorie(s), and {existingData.products.length} product(s).
                                                Seeding will DELETE all this data and replace it with sample data!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-start gap-4 mt-8 pt-4 border-t border-gray-200">
                            <button
                                onClick={handleSeedDatabase}
                                disabled={seeding || !selectedCompany || loadingCompanies}
                                className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${
                                    existingData.products.length > 0
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white'
                                }`}
                            >
                                {seeding ? (
                                    <span className="flex items-center gap-2">
                                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                        Seeding Database...
                                    </span>
                                ) : (
                                    existingData.products.length > 0 ? "⚠️ Override Existing Data" : "🚀 Start Seeding"
                                )}
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <span className="text-red-600">❌</span>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                                        <p className="text-xs text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Success Result */}
                        {seedResult && seedResult.success && (
                            <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <span className="text-green-600">✅</span>
                                    </div>
                                    <div className="ml-3 flex-1">
                                        <h3 className="text-sm font-medium text-green-800">
                                            {seedResult.message}
                                        </h3>
                                        <div className="mt-3">
                                            <h4 className="text-sm font-semibold text-green-900 mb-2">
                                                Seeding Summary for {seedResult.data.companyName}:
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                                <div className="bg-green-100 p-3 rounded-lg">
                                                    <div className="text-lg">🏢</div>
                                                    <div className="text-xs text-green-700 mt-1">Company ID</div>
                                                    <div className="text-xs font-mono text-green-800 mt-1">
                                                        {seedResult.data.companyId.slice(-6)}
                                                    </div>
                                                </div>
                                                <div className="bg-green-100 p-3 rounded-lg">
                                                    <div className="text-lg">🏷️</div>
                                                    <div className="text-xs text-green-700 mt-1">Brands Added</div>
                                                    <div className="text-sm font-bold text-green-900">
                                                        {seedResult.data.brands}
                                                    </div>
                                                </div>
                                                <div className="bg-green-100 p-3 rounded-lg">
                                                    <div className="text-lg">📂</div>
                                                    <div className="text-xs text-green-700 mt-1">Categories Added</div>
                                                    <div className="text-sm font-bold text-green-900">
                                                        {seedResult.data.categories}
                                                    </div>
                                                </div>
                                                <div className="bg-green-100 p-3 rounded-lg">
                                                    <div className="text-lg">📏</div>
                                                    <div className="text-xs text-green-700 mt-1">UOMs Used</div>
                                                    <div className="text-sm font-bold text-green-900">
                                                        {seedResult.data.uoms}
                                                    </div>
                                                </div>
                                                <div className="bg-green-100 p-3 rounded-lg">
                                                    <div className="text-lg">🛒</div>
                                                    <div className="text-xs text-green-700 mt-1">Products Added</div>
                                                    <div className="text-sm font-bold text-green-900">
                                                        {seedResult.data.products}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* What Will Be Seeded Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            📋 What Will Be Seeded?
                        </h2>
                        <p className="text-gray-300 text-sm mt-1">
                            Complete grocery dataset for Tamil Nadu retail stores
                        </p>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">🏷️</span>
                                    <h3 className="font-semibold text-gray-900">Popular Brands (25+)</h3>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex flex-wrap gap-2">
                                        {["MTR", "Aashirvaad", "Britannia", "Parle", "Amul", "Patanjali", "Maggi", "MDH", "Everest", "Fortune", "Dabur", "Haldiram's"].map(brand => (
                                            <span key={brand} className="inline-block bg-white px-2 py-1 rounded text-xs text-gray-700 border border-gray-200">
                                                {brand}
                                            </span>
                                        ))}
                                        <span className="inline-block bg-gray-200 px-2 py-1 rounded text-xs text-gray-600">+13 more</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">📂</span>
                                    <h3 className="font-semibold text-gray-900">Categories (18+)</h3>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex flex-wrap gap-2">
                                        {["Rice & Grains", "Spices", "Dairy Products", "Beverages", "Snacks", "Oils", "Flours", "Personal Care"].map(cat => (
                                            <span key={cat} className="inline-block bg-white px-2 py-1 rounded text-xs text-gray-700 border border-gray-200">
                                                {cat}
                                            </span>
                                        ))}
                                        <span className="inline-block bg-gray-200 px-2 py-1 rounded text-xs text-gray-600">+10 more</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">🛒</span>
                                    <h3 className="font-semibold text-gray-900">Sample Products</h3>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <ul className="space-y-1 text-sm text-gray-700">
                                        <li>• Raw Rice - Ponni (1kg, 5kg, 10kg variants)</li>
                                        <li>• Wheat Flour - Aashirvaad (1kg, 5kg)</li>
                                        <li>• Turmeric Powder (100g, 200g packs)</li>
                                        <li>• Sunflower Oil (1L, 2L, 5L bottles)</li>
                                        <li>• Parle-G Biscuits (50g, 100g, 500g packs)</li>
                                        <li>• Maggi Noodles (70g, 140g packs)</li>
                                        <li>• Amul Milk, Curd, Paneer, Butter</li>
                                        <li>• Coca-Cola, Pepsi, Sprite beverages</li>
                                    </ul>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-xl">📏</span>
                                    <h3 className="font-semibold text-gray-900">Units of Measurement</h3>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex flex-wrap gap-2">
                                        {["Kg", "Gram", "Liter", "Ml", "Piece", "Pack", "Dozen", "Box", "Bottle", "Packet", "Bag", "Tin"].map(uom => (
                                            <span key={uom} className="inline-block bg-white px-2 py-1 rounded text-xs text-gray-700 border border-gray-200">
                                                {uom}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-3">
                                <span className="text-blue-600 text-xl">✨</span>
                                <div>
                                    <p className="text-sm text-blue-900 font-medium">Tamil Language Support</p>
                                    <p className="text-xs text-blue-700 mt-1">
                                        All products include Tamil names for better accessibility in Tamil Nadu stores.
                                        Example: "பொன்னி அரிசி", "கோதுமை மாவு", "மஞ்சள் தூள்"
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                            <p>✅ This will create 25+ products with multiple variants, 25+ brands, 18+ categories, and 12+ UOMs</p>
                            <p className="mt-1">📊 Perfect for getting started with grocery business in Tamil Nadu</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SeedDatabase;