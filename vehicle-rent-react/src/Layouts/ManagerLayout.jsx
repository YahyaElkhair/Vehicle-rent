import React from 'react';
import ManagerLeftBar from '../Components/ManagerLeftBar';
import { FiMenu } from 'react-icons/fi';
import { Outlet } from 'react-router-dom';

const ManagerLayout = () => {
    return (
        <div className="flex min-h-screen bg-gray-50">
            
            {/* Desktop Sidebar - Fixed position */}
            <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-64 z-30">
                <ManagerLeftBar />
            </div>

            {/* Mobile Sidebar */}
            <div className="lg:hidden">
                <ManagerLeftBar />
            </div>

            {/* Main Content - With offset for desktop sidebar */}
            <div className="flex-1 flex flex-col overflow-hidden lg:ml-64">
                {/* Mobile Header */}
                <header className="lg:hidden bg-white shadow-sm sticky top-0 z-20">
                    <div className="flex items-center justify-between p-4">
                        <button
                            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
                            onClick={() => document.querySelector('.lg\\:hidden button')?.click()}
                        >
                            <FiMenu size={24} />
                        </button>
                        <div className="flex items-center space-x-4">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
                            <span className="font-medium">Manager</span>
                        </div>
                    </div>
                </header>

                {/* Content Area - Scrollable */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
                    <Outlet/>
                </main>
            </div>
        </div>
    );
};

export default ManagerLayout;