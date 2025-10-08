import React, { useState , useContext} from 'react';
import {
    FiGrid,
    FiFileText,
    FiTruck,
    FiUser,
    FiLogOut,
    FiMenu,
    FiX
} from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import { AppContext } from "../Context/AppContext";




const ManagerLeftBar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const { token, setUser, setToken } = useContext(AppContext);

    async function handleLogout(e) {
        e.preventDefault();
        const res = await fetch("/api/logout", {
            method: "post",
            headers: {
                Authorization: `Bearer ${token}`,

            },
        });

        if (res.ok) {
            setUser(null);
            setToken(null);
            localStorage.removeItem("token");
            navigate("/");
        }
    }
    
    const navItems = [
        { path: "/manager/dashboard", icon: <FiGrid size={20} />, label: "Dashboard" },
        { path: "/manager/posts", icon: <FiFileText size={20} />, label: "Posts" },
        { path: "/manager/vehicles", icon: <FiTruck size={20} />, label: "Vehicles" },
        { path: "/manager/profile", icon: <FiUser size={20} />, label: "Profile" },
    ];

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-indigo-600 text-white lg:hidden"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>

            {/* Sidebar - Fixed position with scrollable content */}
            <div
                className={`fixed inset-y-0 left-0 z-40 w-64 h-screen bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-6 border-b">
                        <h1 className="text-xl font-bold text-indigo-700">Agency Manager</h1>
                    </div>

                    {/* Navigation - Scrollable area */}
                    <div className="flex-1 overflow-y-auto">
                        <nav className="px-4 py-6">
                            <ul className="space-y-2">
                                {navItems.map((item) => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) =>
                                                `flex items-center p-3 rounded-lg transition-colors ${isActive
                                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`
                                            }
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className="mr-3">{item.icon}</span>
                                            <span>{item.label}</span>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    {/* Logout - Fixed at bottom */}
                    <div className="p-4 border-t">
                        <button
                            onClick={handleLogout}
                            className="flex items-center w-full p-3 text-gray-700 rounded-lg hover:bg-gray-100"
                        >
                            <FiLogOut size={20} className="mr-3" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default ManagerLeftBar;