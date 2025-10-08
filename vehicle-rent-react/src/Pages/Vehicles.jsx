import { useState, useEffect } from 'react';
import ModernVehicleCard from '../Components/ModernVehicleCard';
import {
    FaSearch, FaDollarSign, FaCheckCircle, FaCalendarAlt,
    FaIdCard, FaTruck, FaSort, FaTimes, FaFire, FaFilter
} from 'react-icons/fa';

export default function VehiclesPage() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPosts, setTotalPosts] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // eslint-disable-next-line no-unused-vars
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

    // Filter states - min default set to 0
    const [filters, setFilters] = useState({
        status: '',
        vehicle_age: '',
        license: '',
        delivery: '',
        search: '',
        min: '0',
        max: '',
        page: 1,
        popular: false,
        agency_name: '',
        brand: '',
        sort_by: '',
        order: ''
    });

    useEffect(() => {
        // Fetch vehicles data
        const fetchVehicles = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();

                // Add all filters
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== '' && value !== false && value !== null) {
                        // Send vehicle_status instead of status
                        if (key === 'status') {
                            params.append('vehicle_status', value);
                        } else {
                            params.append(key, value);
                        }
                    }
                });


                const response = await fetch(`/api/posts?${params.toString()}`);


                if (!response.ok) {
                    console.error("HTTP error:", response.status, response.statusText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                // console.log("🚀 ~ fetchVehicles ~ data:", data)
                setPosts(data.data);
                setTotalPosts(data.total);
                setError(null);

            } catch (err) {
                setError(err.message);
                console.error("Error fetching vehicles:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVehicles();
        console.log("🚀 ~ VehiclesPage ~ filters:", filters.status)

    }, [filters]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    // Handle price range filter - ensure min is always at least 0
    const handlePriceRange = (min, max) => {
        // Ensure min is never below 0
        const safeMin = Math.max(0, min === '' ? 0 : Number(min));
        const safeMax = max === '' ? '' : Number(max);

        // Validate and swap if min > max
        let newMin = safeMin;
        let newMax = safeMax;

        if (safeMax !== '' && safeMin > safeMax) {
            // Swap values
            [newMin, newMax] = [safeMax, safeMin];
        }

        setFilters(prev => ({
            ...prev,
            min: newMin.toString(),
            max: newMax === '' ? '' : newMax.toString(),
            page: 1
        }));
    };

    // Reset all filters - ensure min is reset to 0
    const resetFilters = () => {
        setFilters({
            status: '',
            vehicle_age: '',
            license: '',
            delivery: '',
            search: '',
            min: '0',
            max: '',
            page: 1,
            popular: false,
            agency_name: '',
            brand: '',
            sort_by: '',
            order: ''
        });
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        setFilters(prev => ({
            ...prev,
            page: newPage
        }));
    };

    // Calculate best deal prices (0 to 25th percentile)
    const calculateBestDealPrices = () => {
        const range = priceRange.max - priceRange.min;
        const min = 0;  // Always start from 0
        const max = Math.round(priceRange.min + range * 0.25);
        return { min, max };
    };

    const bestDealPrices = calculateBestDealPrices();

    return (
        <div className="container px-4 py-8">
            {/* Mobile Filter Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden mb-4 flex items-center justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg w-full"
            >
                <FaFilter className="mr-2" />
                {isSidebarOpen ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Special Filter Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    onClick={resetFilters}
                    className={`px-4 py-2 rounded-full flex items-center ${!filters.popular && filters.min === '0' && !filters.max
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    <FaSort className="mr-2" />
                    All Vehicles
                </button>
                <button
                    onClick={() => {
                        resetFilters();
                        setFilters(prev => ({ ...prev, popular: true }));
                    }}
                    className={`px-4 py-2 rounded-full flex items-center ${filters.popular
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    <FaFire className="mr-2" />
                    Popular Vehicles
                </button>
                <button
                    onClick={() => {
                        resetFilters();
                        setFilters(prev => ({
                            ...prev,
                            min: bestDealPrices.min.toString(),
                            max: bestDealPrices.max.toString()
                        }));
                    }}
                    className={`px-4 py-2 rounded-full flex items-center ${filters.min === bestDealPrices.min.toString() && filters.max === bestDealPrices.max.toString()
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    <FaDollarSign className="mr-2" />
                    Best Deals
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Modern Filter Sidebar */}
                <div className={`w-full md:max-w-xs bg-white p-6 rounded-2xl shadow-lg border border-gray-100 h-fit transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden md:block'}`}>
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <FaSort className="w-5 h-5 mr-2 text-indigo-600" />
                            Filters
                        </h2>
                        <button
                            onClick={resetFilters}
                            className="flex items-center text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                            <FaTimes className="w-4 h-4 mr-1" />
                            Reset All
                        </button>
                    </div>
                    {/* Brand Filter */}
                    <div className="mb-7 relative">
                        <div className="flex items-center mb-3">
                            <FaTruck className="w-5 h-5 text-gray-500 mr-2" />
                            <label className="block text-sm font-medium text-gray-700">
                                Vehicle Brand
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                name="brand"
                                value={filters.brand}
                                onChange={handleFilterChange}
                                placeholder="Enter vehicle brand..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>


                    {/* Agency Filter */}
                    <div className="mb-7 relative">
                        <div className="flex items-center mb-3">
                            <FaIdCard className="w-5 h-5 text-gray-500 mr-2" />
                            <label className="block text-sm font-medium text-gray-700">
                                Agency
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                name="agency_name"
                                value={filters.agency_name}
                                onChange={handleFilterChange}
                                placeholder="Enter agency name..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Search Filter */}
                    <div className="mb-7 relative">
                        <div className="flex items-center mb-3">
                            <FaSearch className="w-5 h-5 text-gray-500 mr-2" />
                            <label className="block text-sm font-medium text-gray-700">
                                Search by post title
                            </label>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Find your perfect vehicle..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 transition-all"
                            />
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="mb-7">
                        <div className="flex items-center mb-3">
                            <FaDollarSign className="w-5 h-5 text-gray-500 mr-2" />
                            <label className="block text-sm font-medium text-gray-700">
                                Price Range ($0 - ${priceRange.max})
                            </label>
                        </div>
                        <div className="px-2">
                            <input
                                type="range"
                                min={0}
                                max={priceRange.max}
                                value={filters.max || priceRange.max}
                                onChange={(e) => handlePriceRange(filters.min, e.target.value)}
                                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>$0</span>
                                <span>${filters.max || priceRange.max}</span>
                                <span>${priceRange.max}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1">Min</label>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    min="0"
                                    max={priceRange.max}
                                    value={filters.min}
                                    onChange={(e) => handlePriceRange(e.target.value, filters.max)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-200 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 block mb-1">Max</label>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    min="0"
                                    max={priceRange.max}
                                    value={filters.max}
                                    onChange={(e) => handlePriceRange(filters.min, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-200 focus:border-indigo-500"
                                />
                            </div>
                        </div>
                        {(filters.min || filters.max) && (
                            <div className="mt-2 text-sm text-indigo-600">
                                Selected: ${filters.min} - ${filters.max || priceRange.max}
                            </div>
                        )}
                    </div>
                    {/* Vehicle Age Filter */}
                    <div className="mb-7">
                        <div className="flex items-center mb-3">
                            <FaCalendarAlt className="w-5 h-5 text-gray-500 mr-2" />
                            <label className="block text-sm font-medium text-gray-700">
                                Vehicle Age
                            </label>
                        </div>

                        {/* Specific Age Input */}
                        <div className="mb-4">
                            <label className="text-xs text-gray-500 block mb-1">
                                Specific Age (years old)
                            </label>
                            <input
                                type="number"
                                name="vehicle_age"
                                min="0"
                                value={filters.vehicle_age}
                                onChange={handleFilterChange}
                                placeholder="Enter exact age..."
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-indigo-200 focus:border-indigo-500"
                            />
                        </div>

                        {/* Age Categories */}
                        <div className="space-y-2">
                            <div className="text-xs text-gray-500 mb-1">
                                Or select category:
                            </div>
                            {[
                                { value: '1', label: 'New (0-1 year old)' },
                                { value: '3', label: 'Young (1-3 years old)' },
                                { value: '5', label: 'Mature (3-5 years old)' },
                                { value: '5+', label: 'Classic (5+ years old)' }
                            ].map((age) => (
                                <div key={age.value} className="flex items-center">
                                    <input
                                        type="radio"
                                        id={`age-${age.value}`}
                                        name="vehicle_age"
                                        value={age.value}
                                        checked={filters.vehicle_age === age.value}
                                        onChange={handleFilterChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={`age-${age.value}`} className="ml-2 text-sm text-gray-700">
                                        {age.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Status Filter */}
                    <div className="mb-7">
                        <div className="flex items-center mb-3">
                            <FaCheckCircle className="w-5 h-5 text-gray-500 mr-2" />
                            <label className="block text-sm font-medium text-gray-700">
                                Availability
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {['available', 'rented', 'maintenance'].map((status) => (
                                <button
                                    key={status}
                                    name="status"
                                    value={status}
                                    onClick={handleFilterChange}
                                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${filters.status === status
                                        ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>



                    {/* Sorting Options */}
                    <div className="mt-6 p-3 bg-indigo-50 rounded-xl">
                        <div className="flex items-center mb-2">
                            <FaSort className="w-5 h-5 text-indigo-600 mr-2" />
                            <label className="block text-sm font-medium text-indigo-700">
                                Sort Results
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <select
                                name="sort_by"
                                value={filters.sort_by}
                                onChange={handleFilterChange}
                                className="col-span-1 p-2 border border-indigo-200 bg-white text-indigo-700 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="created_at">Date Added</option>
                                <option value="price">Price</option>
                                <option value="mileage">Mileage</option>
                                <option value="year">Vehicle Age</option>
                            </select>
                            <select
                                name="order"
                                value={filters.order}
                                onChange={handleFilterChange}
                                className="col-span-1 p-2 border border-indigo-200 bg-white text-indigo-700 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Vehicle Grid */}
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">
                            {totalPosts} Available Vehicles
                        </h1>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            <strong>Error: </strong> {error}
                        </div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaSearch className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No vehicles match your criteria</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-6">
                                Try adjusting your filters or search terms to find what you're looking for.
                            </p>
                            <button
                                onClick={resetFilters}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Reset All Filters
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {posts.map(post => (
                                    <ModernVehicleCard
                                        key={post.id}
                                        post={post}
                                    />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPosts > 10 && (
                                <div className="flex justify-center mt-8">
                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.ceil(totalPosts / 10) }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-3 py-1 rounded-md ${filters.page === page
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'bg-gray-200 hover:bg-gray-300'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}