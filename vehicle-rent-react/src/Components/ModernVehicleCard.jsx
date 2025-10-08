import { useState } from 'react';
import {
    FaCarSide, FaMapMarkerAlt, FaStar, FaUserFriends,
    FaGasPump, FaChevronLeft, FaChevronRight, FaEye
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

function ModernVehicleCard({ post }) {
    const vehicle = post.vehicle || {};
    const agency = vehicle.agency || {};
    const images = vehicle.images || [];

    const [currentIndex, setCurrentIndex] = useState(0);

    const prevImage = () => {
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    };

    const nextImage = () => {
        setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
    };

    return (
        <Link to={`/posts/${post.id}`} >
            <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full">
                <div className="relative w-full aspect-video overflow-hidden">
                    {images.length > 0 ? (
                        <img
                            src={images[currentIndex]}
                            alt={post.title || `${vehicle.brand} ${vehicle.model}`}
                            className="w-full h-full object-cover transition-all duration-500"
                        />
                    ) : (
                        <img
                            src="https://placehold.co/600x400?text=No+Image"
                            alt="No image"
                            className="w-full h-full object-cover"
                        />
                    )}

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 p-1 rounded-full shadow"
                            >
                                <FaChevronLeft className="text-gray-700" />
                            </button>
                            <button
                                onClick={nextImage}
                                className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white bg-opacity-70 hover:bg-opacity-100 p-1 rounded-full shadow"
                            >
                                <FaChevronRight className="text-gray-700" />
                            </button>
                        </>
                    )}

                    {/* Popular badge */}
                    {post.view_count > 100 && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs px-3 py-1 rounded-full">
                            Popular
                        </div>
                    )}

                    {/* View count */}
                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center">
                        <FaEye className="mr-1" />
                        <span>{post.view_count || 0}</span>
                    </div>
                </div>

                <div className="p-4 flex flex-col flex-grow">
                    {/* Brand and title section */}
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-blue-600 truncate" title={`${vehicle.brand || 'Unknown Brand'} - Model ${vehicle.year || 'Unknown Year'}`}>
                                {vehicle.brand || 'Unknown Brand'} - Model {vehicle.year}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 truncate" title={post.title || `${vehicle.brand} ${vehicle.model}`}>
                                {post.title || `${vehicle.brand} ${vehicle.model}`}
                            </h3>
                        </div>
                        <div className="flex-shrink-0 ml-2">
                            <div className="flex items-center gap-1 text-yellow-500">
                                <FaStar className="text-sm" />
                                <span className="text-sm font-medium">{post.average_rating || '0.0'}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 mb-2 truncate">by {agency.name || 'Unknown Agency'}</p>

                    <div className="flex items-center text-sm text-gray-600 mb-3 space-x-2">
                        <FaMapMarkerAlt className="text-blue-500 flex-shrink-0" />
                        <span className="truncate">Morocco</span>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-gray-700 mb-4">
                        <div className="flex items-center gap-1"><FaCarSide /> {vehicle.transmission || 'Automatic'}</div>
                        <div className="flex items-center gap-1"><FaGasPump /> {vehicle.fuel_type || 'Gasoline'}</div>
                        <div className="flex items-center gap-1"><FaUserFriends /> {vehicle.seats || 5} Seats</div>
                        <div className="flex items-center gap-1">AC: {vehicle.features?.includes('AC') ? 'Yes' : 'No'}</div>
                    </div>

                    <div className="mt-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-blue-600 font-bold text-lg">
                                ${vehicle.price_per_day || '0.00'}/day
                            </div>
                        </div>


                    </div>
                </div>
            </div >

        </Link>

    );
}

export default ModernVehicleCard;