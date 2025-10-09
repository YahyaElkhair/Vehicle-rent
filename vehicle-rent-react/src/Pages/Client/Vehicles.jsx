import { useState, useEffect } from 'react';
import ModernVehicleCard from '../../Components/ModernVehicleCard';
import {
    FaSearch, FaDollarSign, FaCheckCircle, FaCalendarAlt,
    FaIdCard, FaTruck, FaSort, FaTimes, FaFire, FaFilter,
    FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

export default function VehiclesList() {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPosts, setTotalPosts] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        status: '',
        vehicle_age: '',
        license: '',
        delivery: '',
        search: '',
        min: '',
        max: '',
        page: 1,
        popular: false,
        agency_name: '',
        brand: '',
        sort_by: 'created_at',
        order: 'desc'
    });

    // Dynamic price range based on actual data
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

    // Calculate price range from posts data
    useEffect(() => {
        if (posts.length > 0) {
            const prices = posts
                .map(post => post.vehicle?.price_per_day)
                .filter(price => price !== null && price !== undefined);

            if (prices.length > 0) {
                const minPrice = Math.floor(Math.min(...prices));
                const maxPrice = Math.ceil(Math.max(...prices));
                setPriceRange({ min: minPrice, max: maxPrice });
            }
        }
    }, [posts]);

    useEffect(() => {
        fetchVehicles();
    }, [filters]);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            // Add all filters
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== false && value !== null) {
                    if (key === 'status') {
                        params.append('vehicle_status', value);
                    } else {
                        params.append(key, value);
                    }
                }
            });

            const response = await fetch(`/api/posts?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPosts(data.data || []);
            setTotalPosts(data.total || 0);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setError(null);

        } catch (err) {
            setError(err.message);
            console.error("Error fetching vehicles:", err);
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value,
            page: 1
        }));
    };

    // Handle status button click
    const handleStatusClick = (status) => {
        setFilters(prev => ({
            ...prev,
            status: prev.status === status ? '' : status,
            page: 1
        }));
    };

    // Handle price range filter
    const handlePriceRange = (min, max) => {
        const safeMin = min === '' ? '' : Math.max(0, Number(min));
        const safeMax = max === '' ? '' : Number(max);

        let newMin = safeMin;
        let newMax = safeMax;

        if (safeMin !== '' && safeMax !== '' && safeMin > safeMax) {
            [newMin, newMax] = [safeMax, safeMin];
        }

        setFilters(prev => ({
            ...prev,
            min: newMin === '' ? '' : newMin.toString(),
            max: newMax === '' ? '' : newMax.toString(),
            page: 1
        }));
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            status: '',
            vehicle_age: '',
            license: '',
            delivery: '',
            search: '',
            min: '',
            max: '',
            page: 1,
            popular: false,
            agency_name: '',
            brand: '',
            sort_by: 'created_at',
            order: 'desc'
        });
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= lastPage) {
            setFilters(prev => ({
                ...prev,
                page: newPage
            }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Calculate best deal prices
    const calculateBestDealPrices = () => {
        const range = priceRange.max - priceRange.min;
        const min = 0;
        const max = Math.round(priceRange.min + range * 0.25);
        return { min, max };
    };

    const bestDealPrices = calculateBestDealPrices();

    // Get active filters count
    const getActiveFiltersCount = () => {
        let count = 0;
        if (filters.status) count++;
        if (filters.vehicle_age) count++;
        if (filters.search) count++;
        if (filters.min || filters.max) count++;
        if (filters.agency_name) count++;
        if (filters.brand) count++;
        if (filters.popular) count++;
        return count;
    };

    // Pagination helper
    const getPaginationRange = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= lastPage; i++) {
            if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        range.forEach((i) => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        return rangeWithDots;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="md:hidden mb-4 flex items-center justify-center bg-indigo-600 text-white px-4 py-3 rounded-xl w-full shadow-lg hover:bg-indigo-700 transition-colors"
                >
                    <FaFilter className="mr-2" />
                    {isSidebarOpen ? 'Hide Filters' : 'Show Filters'}
                    {getActiveFiltersCount() > 0 && (
                        <span className="ml-2 bg-white text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {getActiveFiltersCount()}
                        </span>
                    )}
                </button>

                {/* Quick Filter Buttons */}
                <div className="flex flex-wrap gap-3 mb-8">
                    <button
                        onClick={resetFilters}
                        className={`px-5 py-2.5 rounded-full flex items-center font-medium shadow-md transition-all hover:shadow-lg ${getActiveFiltersCount() === 0
                                ? 'bg-indigo-600 text-white scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
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
                        className={`px-5 py-2.5 rounded-full flex items-center font-medium shadow-md transition-all hover:shadow-lg ${filters.popular
                                ? 'bg-orange-500 text-white scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FaFire className="mr-2" />
                        Popular
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
                        className={`px-5 py-2.5 rounded-full flex items-center font-medium shadow-md transition-all hover:shadow-lg ${filters.min === bestDealPrices.min.toString() &&
                                filters.max === bestDealPrices.max.toString()
                                ? 'bg-green-600 text-white scale-105'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FaDollarSign className="mr-2" />
                        Best Deals
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filter Sidebar */}
                    <aside className={`w-full lg:w-80 bg-white rounded-2xl shadow-lg border border-gray-200 h-fit transition-all duration-300 ${isSidebarOpen ? 'block' : 'hidden lg:block'
                        }`}>
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                    <FaFilter className="w-5 h-5 mr-2 text-indigo-600" />
                                    Filters
                                </h2>
                                {getActiveFiltersCount() > 0 && (
                                    <button
                                        onClick={resetFilters}
                                        className="flex items-center text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium"
                                    >
                                        <FaTimes className="w-3 h-3 mr-1" />
                                        Clear ({getActiveFiltersCount()})
                                    </button>
                                )}
                            </div>

                            {/* Search Filter */}
                            <div className="mb-6">
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <FaSearch className="w-4 h-4 mr-2 text-indigo-600" />
                                    Search
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder="Search vehicles..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    />
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Brand Filter */}
                            <div className="mb-6">
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <FaTruck className="w-4 h-4 mr-2 text-indigo-600" />
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={filters.brand}
                                    onChange={handleFilterChange}
                                    placeholder="e.g., Toyota, BMW..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Agency Filter */}
                            <div className="mb-6">
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                    <FaIdCard className="w-4 h-4 mr-2 text-indigo-600" />
                                    Agency
                                </label>
                                <input
                                    type="text"
                                    name="agency_name"
                                    value={filters.agency_name}
                                    onChange={handleFilterChange}
                                    placeholder="Agency name..."
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Price Range */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                    <FaDollarSign className="w-4 h-4 mr-2 text-indigo-600" />
                                    Price Range
                                </label>
                                <div className="px-2 mb-3">
                                    <input
                                        type="range"
                                        min={priceRange.min}
                                        max={priceRange.max}
                                        value={filters.max || priceRange.max}
                                        onChange={(e) => handlePriceRange(filters.min || priceRange.min, e.target.value)}
                                        className="w-full h-2 bg-indigo-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                        <span>${priceRange.min}</span>
                                        <span className="font-semibold text-indigo-600">
                                            ${filters.max || priceRange.max}
                                        </span>
                                        <span>${priceRange.max}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Min Price</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            min={priceRange.min}
                                            max={priceRange.max}
                                            value={filters.min}
                                            onChange={(e) => handlePriceRange(e.target.value, filters.max)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 block mb-1">Max Price</label>
                                        <input
                                            type="number"
                                            placeholder={priceRange.max}
                                            min={priceRange.min}
                                            max={priceRange.max}
                                            value={filters.max}
                                            onChange={(e) => handlePriceRange(filters.min, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Age */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                    <FaCalendarAlt className="w-4 h-4 mr-2 text-indigo-600" />
                                    Vehicle Age
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { value: '1', label: 'New (0-1 year)' },
                                        { value: '3', label: 'Young (1-3 years)' },
                                        { value: '5', label: 'Mature (3-5 years)' },
                                        { value: '5+', label: 'Classic (5+ years)' }
                                    ].map((age) => (
                                        <label
                                            key={age.value}
                                            className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-all ${filters.vehicle_age === age.value
                                                    ? 'bg-indigo-50 border-2 border-indigo-500'
                                                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="vehicle_age"
                                                value={age.value}
                                                checked={filters.vehicle_age === age.value}
                                                onChange={handleFilterChange}
                                                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-700">
                                                {age.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Availability Status */}
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                    <FaCheckCircle className="w-4 h-4 mr-2 text-indigo-600" />
                                    Availability
                                </label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { value: 'available', label: 'Available' },
                                        { value: 'rented', label: 'Rented' },
                                        { value: 'maintenance', label: 'Maintenance' }
                                    ].map((status) => (
                                        <button
                                            key={status.value}
                                            onClick={() => handleStatusClick(status.value)}
                                            className={`p-2.5 rounded-lg font-medium text-sm transition-all ${filters.status === status.value
                                                    ? 'bg-indigo-100 border-2 border-indigo-500 text-indigo-700'
                                                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {status.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sort Options */}
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border-2 border-indigo-100">
                                <label className="flex items-center text-sm font-bold text-indigo-900 mb-3">
                                    <FaSort className="w-4 h-4 mr-2" />
                                    Sort Results
                                </label>
                                <div className="space-y-2">
                                    <select
                                        name="sort_by"
                                        value={filters.sort_by}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-2.5 border-2 border-indigo-200 bg-white text-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer"
                                    >
                                        <option value="created_at">📅 Newest First</option>
                                        <option value="price">💰 Price</option>
                                        <option value="rating">⭐ Rating</option>
                                        <option value="popularity">🔥 Popularity</option>
                                    </select>
                                    <select
                                        name="order"
                                        value={filters.order}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-2.5 border-2 border-indigo-200 bg-white text-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium cursor-pointer"
                                    >
                                        <option value="desc">↓ High to Low</option>
                                        <option value="asc">↑ Low to High</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Results Header */}
                        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {totalPosts} {totalPosts === 1 ? 'Vehicle' : 'Vehicles'} Found
                                    </h1>
                                    {getActiveFiltersCount() > 0 && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            {getActiveFiltersCount()} active filter{getActiveFiltersCount() > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Page {currentPage} of {lastPage}
                                </div>
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="flex flex-col justify-center items-center py-20">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
                                <p className="text-gray-600 font-medium">Loading vehicles...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
                                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                                <h3 className="text-xl font-bold text-red-900 mb-2">Error Loading Vehicles</h3>
                                <p className="text-red-700 mb-4">{error}</p>
                                <button
                                    onClick={fetchVehicles}
                                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
                                <div className="bg-gray-100 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaSearch className="w-16 h-16 text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">No vehicles found</h3>
                                <p className="text-gray-600 max-w-md mx-auto mb-6">
                                    Try adjusting your filters to find more vehicles.
                                </p>
                                <button
                                    onClick={resetFilters}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Vehicle Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                                    {posts.map(post => (
                                        <ModernVehicleCard key={post.id} post={post} />
                                    ))}
                                </div>

                                {/* Pagination */}
                                {lastPage > 1 && (
                                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="flex items-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                            >
                                                <FaChevronLeft className="mr-2" />
                                                Previous
                                            </button>

                                            <div className="flex flex-wrap justify-center gap-2">
                                                {getPaginationRange().map((page, index) => (
                                                    page === '...' ? (
                                                        <span key={`dots-${index}`} className="px-3 py-2 text-gray-500">
                                                            ...
                                                        </span>
                                                    ) : (
                                                        <button
                                                            key={page}
                                                            onClick={() => handlePageChange(page)}
                                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === page
                                                                    ? 'bg-indigo-600 text-white shadow-lg scale-110'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                }`}
                                                        >
                                                            {page}
                                                        </button>
                                                    )
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === lastPage}
                                                className="flex items-center px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                                            >
                                                Next
                                                <FaChevronRight className="ml-2" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}