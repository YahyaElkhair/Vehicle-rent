// src/pages/manager/VehicleView.jsx
import React, { useState } from 'react';
import { FiArrowLeft, FiEdit, FiTrash2, FiNavigation, FiBluetooth, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaGasPump, FaCar, FaFire, FaCalendarAlt } from 'react-icons/fa';
import { GiGearStickPattern, GiCarDoor, GiCarSeat, GiSteeringWheel } from 'react-icons/gi';
import { TbAirConditioning } from 'react-icons/tb';

const VehicleView = ({ vehicle, onBack, onDelete, onEdit }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const images = vehicle.images || [];

    const handlePrevImage = () => {
        setCurrentImageIndex(prevIndex =>
            prevIndex === 0 ? images.length - 1 : prevIndex - 1
        );
    };

    const handleNextImage = () => {
        setCurrentImageIndex(prevIndex =>
            prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
    };

    const renderFeatureIcon = (feature) => {
        const normalizedFeature = feature.toLowerCase();

        if (normalizedFeature.includes('ac') || normalizedFeature.includes('air conditioning')) {
            return <TbAirConditioning className="text-indigo-500 mr-1" />;
        }
        if (normalizedFeature.includes('gps') || normalizedFeature.includes('navigation')) {
            return <FiNavigation className="text-indigo-500 mr-1" />;
        }
        if (normalizedFeature.includes('bluetooth')) {
            return <FiBluetooth className="text-indigo-500 mr-1" />;
        }
        if (normalizedFeature.includes('heated') || normalizedFeature.includes('seat warm')) {
            return <FaFire className="text-indigo-500 mr-1" />;
        }
        return null;
    };

    const handleDelete = () => {
        onDelete(vehicle.id);

    };

    // Format date fields to show only date part
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString; // Return original if parsing fails
        }
    };
    const statusBgColor = vehicle.status === 'available' ? 'bg-green-100' : vehicle.status === 'rented' ? 'bg-yellow-100' : 'bg-red-100';

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <button
                onClick={onBack}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
            >
                <FiArrowLeft className="mr-2" /> Back to Fleet
            </button>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                {/* Image Gallery */}
                <div className="relative bg-gray-100">


                    <div className={`p-2 text-xs rounded absolute top-2 right-5 h-fit w-fit flex items-center justify-center z-50 ${statusBgColor}`}  >
                        {vehicle.status?.replace(/_/g, ' ')}

                    </div>
                    {/* Main Image */}
                    <div className="relative h-64 md:h-96 w-full flex items-center justify-center overflow-hidden">
                        {images.length > 0 ? (
                            <>
                                <img
                                    src={images[currentImageIndex]}
                                    alt={`${vehicle.brand} ${vehicle.model}`}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />

                                {/* Navigation Arrows */}
                                {images.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePrevImage}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                                            aria-label="Previous image"
                                        >
                                            <FiChevronLeft size={24} />
                                        </button>
                                        <button
                                            onClick={handleNextImage}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-all"
                                            aria-label="Next image"
                                        >
                                            <FiChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                            </>
                        ) : (
                            <FaCar className="text-gray-300 text-6xl" />
                        )}
                    </div>

                    {/* Thumbnail Gallery */}
                    {images.length > 1 && (
                        <div className="flex overflow-x-auto py-3 px-2 space-x-2 border-t border-gray-200">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-16 h-14 rounded-md overflow-hidden border-2 transition-all ${currentImageIndex === index
                                        ? 'border-indigo-500 ring-2 ring-indigo-300'
                                        : 'border-transparent opacity-70 hover:opacity-100'
                                        }`}
                                    aria-label={`View image ${index + 1}`}
                                >
                                    <img
                                        src={img}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {vehicle.brand} {vehicle.model} {vehicle.year}
                            </h1>
                            <p className="text-gray-600">{vehicle.color}</p>
                        </div>
                        <div className="text-2xl font-bold text-indigo-600">
                            ${vehicle.price_per_day} <span className="text-base font-normal">/day</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <GiGearStickPattern className="text-indigo-500 text-xl mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Transmission</p>
                                <p className="font-medium capitalize">{vehicle.transmission}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <FaGasPump className="text-indigo-500 text-xl mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Fuel Type</p>
                                <p className="font-medium capitalize">{vehicle.fuel_type}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <GiCarSeat className="text-indigo-500 text-xl mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Seats</p>
                                <p className="font-medium">{vehicle.seats}</p>
                            </div>
                        </div>
                        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <GiCarDoor className="text-indigo-500 text-xl mr-3" />
                            <div>
                                <p className="text-sm text-gray-500">Doors</p>
                                <p className="font-medium">{vehicle.doors}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Vehicle Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">License Plate</div>
                                <div className="w-full sm:w-1/2 font-medium">{vehicle.license_plate}</div>
                            </div>
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">VIN</div>
                                <div className="w-full sm:w-1/2 font-medium">{vehicle.vin}</div>
                            </div>
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">Mileage</div>
                                <div className="w-full sm:w-1/2 font-medium">
                                    {vehicle.mileage?.toLocaleString() || '0'} miles
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">Engine Type</div>
                                <div className="w-full sm:w-1/2 font-medium">{vehicle.engine_type}</div>
                            </div>
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">Minimum Rental Days</div>
                                <div className="w-full sm:w-1/2 font-medium">{vehicle.minimum_rental_days} days</div>
                            </div>
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">Discount Rate</div>
                                <div className="w-full sm:w-1/2 font-medium">
                                    {vehicle.discount_rate > 0 ? `${vehicle.discount_rate}%` : 'None'}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">Delivery Fee (per km)</div>
                                <div className="w-full sm:w-1/2 font-medium">
                                    ${vehicle.delivery_fee_per_km || '0.00'}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">Type</div>
                                <div className="w-full sm:w-1/2 font-medium">{vehicle.type}</div>
                            </div>
                            {/* <div className="flex flex-col sm:flex-row">
                                <div className="w-full sm:w-1/2 text-gray-500">Status</div>
                                <div className="w-full sm:w-1/2 font-medium capitalize">
                                    {vehicle.status?.replace(/_/g, ' ') || 'available'}
                                </div>
                            </div> */}

                            {/* Date Fields */}
                            {vehicle.available_from && (
                                <div className="flex flex-col sm:flex-row">
                                    <div className="w-full sm:w-1/2 text-gray-500 flex items-center">
                                        <FaCalendarAlt className="mr-2 text-indigo-500" /> Available From
                                    </div>
                                    <div className="w-full sm:w-1/2 font-medium">
                                        {formatDate(vehicle.available_from)}
                                    </div>
                                </div>
                            )}

                            {vehicle.available_to && (
                                <div className="flex flex-col sm:flex-row">
                                    <div className="w-full sm:w-1/2 text-gray-500 flex items-center">
                                        <FaCalendarAlt className="mr-2 text-indigo-500" /> Available To
                                    </div>
                                    <div className="w-full sm:w-1/2 font-medium">
                                        {formatDate(vehicle.available_to)}
                                    </div>
                                </div>
                            )}

                            {vehicle.registration_date && (
                                <div className="flex flex-col sm:flex-row">
                                    <div className="w-full sm:w-1/2 text-gray-500 flex items-center">
                                        <FaCalendarAlt className="mr-2 text-indigo-500" /> Registration Date
                                    </div>
                                    <div className="w-full sm:w-1/2 font-medium">
                                        {formatDate(vehicle.registration_date)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {vehicle.features && vehicle.features.length > 0 && (
                        <div className="mt-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-3">Features</h2>
                            <div className="flex flex-wrap gap-2">
                                {vehicle.features.map((feature, index) => (
                                    <div
                                        key={index}
                                        className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm flex items-center"
                                    >
                                        {renderFeatureIcon(feature)}
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">Description</h2>
                        <p className="text-gray-600 whitespace-pre-line">
                            {vehicle.description || 'No description provided.'}
                        </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            onClick={() => onEdit(vehicle)}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <FiEdit className="mr-2" /> Edit Vehicle
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            <FiTrash2 className="mr-2" /> Delete Vehicle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleView;