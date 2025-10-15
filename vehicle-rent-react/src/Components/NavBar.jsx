import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../Context/AppContext";
import { FaSearch, FaTimes, FaClock, FaCar, FaMapMarkerAlt } from 'react-icons/fa';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchHistory, setSearchHistory] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const searchInputRef = useRef(null);
    const searchTimeoutRef = useRef(null);
    const currentPathName = useLocation().pathname;

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Vehicles list', href: '/vehicles' },
        { name: 'Contact', href: '#' },
    ];

    const { user, token, setUser, setToken } = useContext(AppContext);
    const navigate = useNavigate();

    // Load search history from localStorage on mount
    useEffect(() => {
        const savedHistory = localStorage.getItem('searchHistory');
        if (savedHistory) {
            try {
                setSearchHistory(JSON.parse(savedHistory));
            } catch (e) {
                console.error('Failed to parse search history', e);
                localStorage.removeItem('searchHistory');
            }
        }
    }, []);

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    async function handleLogout(e) {
        e.preventDefault();
        const res = await fetch("/api/logout", {
            method: "post",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            setUser(null);
            setToken(null);
            localStorage.removeItem("token");
            navigate("/");
        }
    }

    // Save search to history
    const saveSearchToHistory = (searchTerm) => {
        if (!searchTerm.trim()) return;

        const newHistory = [
            searchTerm,
            ...searchHistory.filter(item => item !== searchTerm)
        ].slice(0, 10); // Keep only last 10 searches

        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    };

    // Handle search with debouncing
    const handleVehiclesSearch = (e) => {
        const searchTerm = e.target.value;
        setSearchQuery(searchTerm);
        setShowResults(true);

        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!searchTerm.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        // Debounce search by 300ms
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const resp = await fetch(`/api/posts?search=${encodeURIComponent(searchTerm)}`);

                if (!resp.ok) throw new Error('Search failed');

                const data = await resp.json();
                setSearchResults(data.data || []);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    // Clear search
    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
        if (searchInputRef.current) {
            searchInputRef.current.value = '';
        }
    };

    // Navigate to vehicle
    const navigateToVehicle = (post) => {
        saveSearchToHistory(searchQuery || post.title);
        navigate(`/posts/${post.id}`);
        clearSearch();
        setIsMenuOpen(false);
        setMobileSearchOpen(false);
    };

    // FIXED: Renamed from useHistorySearch to searchFromHistory
    const searchFromHistory = (term) => {
        setSearchQuery(term);
        if (searchInputRef.current) {
            searchInputRef.current.value = term;
        }
        handleVehiclesSearch({ target: { value: term } });
    };

    // Clear search history
    const clearSearchHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };

    // Search results component
    const SearchResults = ({ results, query, onSelect, isMobile = false }) => {
        const showHistory = !query && searchHistory.length > 0;
        const hasResults = results && results.length > 0;

        return (
            <div className={`absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-2xl mt-2 z-50 overflow-hidden ${isMobile ? 'max-h-[70vh]' : 'max-h-96'}`}>
                {/* Search History */}
                {showHistory && (
                    <div className="border-b border-gray-100">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                            <div className="flex items-center text-sm font-semibold text-gray-700">
                                <FaClock className="mr-2 text-gray-400" />
                                Recent Searches
                            </div>
                            <button
                                onClick={clearSearchHistory}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                            {searchHistory.map((term, index) => (
                                <div
                                    key={index}
                                    className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors group"
                                    onClick={() => searchFromHistory(term)}
                                >
                                    <FaClock className="text-gray-400 mr-3 text-sm" />
                                    <span className="flex-1 text-sm text-gray-700 group-hover:text-blue-600">
                                        {term}
                                    </span>
                                    <FaSearch className="text-gray-300 group-hover:text-blue-500 text-xs" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search Results */}
                {query && (
                    <div className="overflow-y-auto" style={{ maxHeight: showHistory ? 'calc(100% - 200px)' : '100%' }}>
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
                                <p className="text-sm text-gray-500">Searching vehicles...</p>
                            </div>
                        ) : hasResults ? (
                            <>
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                                    <p className="text-xs font-semibold text-gray-600">
                                        Found {results.length} vehicle{results.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                {results.map((post) => (
                                    <div
                                        key={post.id}
                                        className="flex items-center px-4 py-3 hover:bg-blue-50 cursor-pointer transition-all duration-200 border-b border-gray-50 last:border-b-0 group"
                                        onClick={() => onSelect(post)}
                                    >
                                        {/* Vehicle Image */}
                                        <div className="flex-shrink-0 mr-4">
                                            {post.vehicle?.images?.length > 0 ? (
                                                <img
                                                    src={post.vehicle.images[0]}
                                                    alt={post.vehicle.model}
                                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                                                    <FaCar className="text-blue-600 text-2xl" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Vehicle Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-blue-600 transition-colors">
                                                {post.title}
                                            </h3>

                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-1">
                                                <span className="flex items-center">
                                                    <FaCar className="mr-1" />
                                                    {post.vehicle?.brand} {post.vehicle?.model}
                                                </span>
                                                {post.vehicle?.type && (
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                                                        {post.vehicle.type}
                                                    </span>
                                                )}
                                            </div>

                                            {post.agency?.name && (
                                                <div className="flex items-center text-xs text-gray-400">
                                                    <FaMapMarkerAlt className="mr-1" />
                                                    {post.agency.name}
                                                </div>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="flex-shrink-0 text-right ml-4">
                                            <div className="text-lg font-bold text-blue-600">
                                                ${post.vehicle?.price_per_day}
                                            </div>
                                            <div className="text-xs text-gray-500">per day</div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 px-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FaSearch className="text-gray-400 text-2xl" />
                                </div>
                                <p className="text-gray-600 font-medium mb-1">No vehicles found</p>
                                <p className="text-sm text-gray-400 text-center">
                                    Try adjusting your search terms
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Empty State - No history, no search */}
                {!query && searchHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                            <FaSearch className="text-blue-500 text-2xl" />
                        </div>
                        <p className="text-gray-600 font-medium mb-1">Start searching</p>
                        <p className="text-sm text-gray-400 text-center">
                            Search for vehicles by brand, model, or type
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left section - Brand */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-indigo-600 font-bold text-xl tracking-tight">
                                AppName
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:ml-8 md:flex md:space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${currentPathName === link.href
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Search */}
                    <div className="hidden lg:flex items-center ml-6 flex-1 max-w-md">
                        <div className="relative w-full" ref={searchRef}>
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search vehicles by brand, model..."
                                    className="w-full pl-11 pr-10 py-2.5 text-sm border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    onChange={handleVehiclesSearch}
                                    onFocus={() => setShowResults(true)}
                                    value={searchQuery}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <FaTimes />
                                    </button>
                                )}
                            </div>

                            {/* Search Results */}
                            {showResults && (
                                <SearchResults
                                    results={searchResults}
                                    query={searchQuery}
                                    onSelect={navigateToVehicle}
                                />
                            )}
                        </div>
                    </div>

                    {/* Right section - Auth Links */}
                    <div className="flex items-center">
                        {/* Mobile Search Toggle */}
                        <div className="lg:hidden mr-4">
                            <button
                                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                                className="text-gray-700 hover:text-indigo-600 transition-colors p-2"
                            >
                                <FaSearch className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="hidden relative md:flex md:items-center md:space-x-4 p-2 group min-w-fit">
                            {user ? (
                                <div>
                                    <p className="text-slate-400 text-base cursor-pointer">{user.name}</p>
                                    <div className="hidden group-hover:block text-center absolute top-7 right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                                        <div className="flex flex-col justify-center items-center space-y-2 p-2 text-sm">
                                            <Link
                                                to="/profile"
                                                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                            >
                                                Profile
                                            </Link>
                                            <Link
                                                to="/rents"
                                                className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                            >
                                                My rents
                                            </Link>
                                            <form onSubmit={handleLogout} className="w-full">
                                                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                                    Logout
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <Link
                                        to="/register"
                                        className={`text-sm font-medium transition-colors ${currentPathName === '/register'
                                                ? 'text-indigo-600'
                                                : 'text-gray-700 hover:text-indigo-600'
                                            }`}
                                    >
                                        Register
                                    </Link>
                                    <Link
                                        to="/login"
                                        className={`text-sm font-medium transition-colors ${currentPathName === '/login'
                                                ? 'text-indigo-600'
                                                : 'text-gray-700 hover:text-indigo-600'
                                            }`}
                                    >
                                        Login
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-700 hover:text-indigo-600 focus:outline-none ml-2 p-2"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Search Bar */}
                {mobileSearchOpen && (
                    <div className="lg:hidden py-3 relative" ref={searchRef}>
                        <div className="relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search vehicles..."
                                className="w-full pl-11 pr-10 py-2.5 text-sm border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                onChange={handleVehiclesSearch}
                                onFocus={() => setShowResults(true)}
                                value={searchQuery}
                                autoFocus
                            />
                            <button
                                onClick={() => {
                                    setMobileSearchOpen(false);
                                    clearSearch();
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Mobile Search Results */}
                        {showResults && (
                            <SearchResults
                                results={searchResults}
                                query={searchQuery}
                                onSelect={navigateToVehicle}
                                isMobile={true}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${currentPathName === link.href
                                        ? 'text-indigo-600 bg-indigo-50'
                                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                                    }`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="border-t border-gray-200 pt-4 pb-2">
                            {user ? (
                                <div className="flex flex-col space-y-2">
                                    <p className="text-slate-400 px-3 mb-2">Welcome, {user.name}</p>
                                    <Link
                                        to="/profile"
                                        className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        to="/rents"
                                        className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        My rents
                                    </Link>
                                    <form onSubmit={handleLogout}>
                                        <button className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50 transition-colors">
                                            Logout
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-2">
                                    <Link
                                        to="/register"
                                        className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${currentPathName === '/register'
                                                ? 'text-indigo-600 bg-indigo-50'
                                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Register
                                    </Link>
                                    <Link
                                        to="/login"
                                        className={`px-3 py-2 rounded-md text-base font-medium transition-colors ${currentPathName === '/login'
                                                ? 'text-indigo-600 bg-indigo-50'
                                                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                                            }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Login
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;