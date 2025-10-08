import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AppContext } from "../Context/AppContext";
import { FaSearch, FaTimes } from 'react-icons/fa';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchData, setSearchData] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const searchRef = useRef(null);
    const currentPathName = useLocation().pathname;

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Vehicles list', href: '/vehicles' },
        { name: 'Contact', href: '#' },
    ];

    const { user, token, setUser, setToken } = useContext(AppContext);
    const navigate = useNavigate();

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchData(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchRef]);

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

    const handleVehiclesSearch = async (e) => {
        const searchTerm = e.target.value;

        if (!searchTerm.trim()) {
            setSearchData(null);
            return;
        }

        try {
            setIsSearching(true);
            const resp = await fetch(`/api/posts?search=${searchTerm}`);

            if (!resp.ok) throw new Error('Search failed');
            const data = await resp.json();
            setSearchData(data.data);
        } catch (error) {
            console.error(error);
            setSearchData([]);
        } finally {
            setIsSearching(false);
        }
    };

    const clearSearch = () => {
        setSearchData(null);
        if (searchRef.current) searchRef.current.value = '';
    };

    const navigateToVehicle = (id) => {
        navigate(`/posts/${id}`);
        setSearchData(null);
        setIsMenuOpen(false);
    };

    // Search result component to avoid duplication
    const SearchResults = ({ results, onSelect }) => (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 z-50 max-h-96 overflow-y-auto">
            {isSearching ? (
                <div className="p-4 text-center text-gray-500">Searching...</div>
            ) : results.length === 0 ? (
                <div className="p-4 text-gray-500">No vehicles found</div>
            ) : (
                results.map((post) => (
                    <div
                        key={post.id}
                        className="flex items-center p-4 hover:bg-gray-100 cursor-pointer"
                        onClick={() => onSelect(post.id)}
                    >
                        {post.vehicle.images?.length > 0 && (
                            <img
                                src={post.vehicle.images[0]}
                                alt={post.vehicle.model}
                                className="w-16 h-16 object-cover rounded mr-4"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                                {post.title}
                            </h3>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{post.vehicle.type}</span>
                                <span>${post.vehicle.price_per_day}/day</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    return (
        <nav className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left section - Brand */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-indigo-600 font-bold text-xl tracking-tight">AppName</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:ml-8 md:flex md:space-x-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className={`nav-link ${currentPathName === link.href ? 'text-indigo-600' : 'text-gray-700'}`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Desktop Search */}
                    <div className="hidden lg:flex items-center ml-6">
                        <div className="relative w-96" ref={searchRef}>
                            <div className="relative">
                                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    placeholder="Search vehicles..."
                                    className="w-full pl-11 pr-10 py-2 text-sm border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                    onInput={handleVehiclesSearch}
                                />
                                {searchData && (
                                    <FaTimes
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                        onClick={clearSearch}
                                    />
                                )}
                            </div>

                            {/* Search Results */}
                            {searchData && (
                                <SearchResults
                                    results={searchData}
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
                                className="text-gray-700 hover:text-indigo-600"
                            >
                                <FaSearch className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="hidden relative md:flex md:items-center md:space-x-4 p-2 group min-w-fit">
                            {user ? (
                                <div>
                                    <p className="text-slate-400 text-base">{user.name}</p>
                                    <div className="hidden group-hover:block text-center absolute top-7 right-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                                        <div className="flex flex-col justify-center items-center space-y-5 p-2 text-sm">
                                            <Link className="nav-link">Profile</Link>
                                            <Link className="nav-link">My rents</Link>
                                            <form onSubmit={handleLogout}>
                                                <button className="nav-link">Logout</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-x-4">
                                    <Link to="/register" className={`nav-link ${currentPathName === '/register' ? 'text-indigo-600' : 'text-gray-700'}`}>
                                        Register
                                    </Link>
                                    <Link to="/login" className={`nav-link ${currentPathName === '/login' ? 'text-indigo-600' : 'text-gray-700'}`}>
                                        Login
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-700 hover:text-indigo-600 focus:outline-none ml-2"
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
                                className="w-full pl-11 pr-10 py-2 text-sm border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                onInput={handleVehiclesSearch}
                                autoFocus
                            />
                            <FaTimes
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                                onClick={() => {
                                    setMobileSearchOpen(false);
                                    clearSearch();
                                }}
                            />
                        </div>

                        {/* Mobile Search Results */}
                        {searchData && (
                            <SearchResults
                                results={searchData}
                                onSelect={(id) => {
                                    navigateToVehicle(id);
                                    setMobileSearchOpen(false);
                                }}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.href}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="border-t border-gray-200 pt-4 pb-2">
                            {user ? (
                                <div className="flex flex-col space-y-3">
                                    <p className="text-slate-400 px-3">Welcome back {user.name}</p>
                                    <Link to="/profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                                        Profile
                                    </Link>
                                    <Link to="/rents" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                                        My rents
                                    </Link>
                                    <form onSubmit={handleLogout}>
                                        <button className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50">
                                            Logout
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="flex flex-col space-y-3">
                                    <Link
                                        to="/register"
                                        className="nav-link"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Register
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="nav-link"
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