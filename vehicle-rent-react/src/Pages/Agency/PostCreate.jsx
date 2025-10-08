// src/components/PostCreate.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiArrowLeft, FiPlus, FiCheck, FiTruck,
    FiEdit, FiInfo, FiSearch, FiCalendar,
    FiUser, FiMapPin, FiAward, FiTag
} from 'react-icons/fi';
import { FaGasPump, FaCar, FaSnowflake } from 'react-icons/fa';
import { GiGearStickPattern, GiCarDoor } from 'react-icons/gi';
import { TbAirConditioning } from 'react-icons/tb';
import { AppContext } from "../../Context/AppContext";

const PostCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'draft',
        delivery_options: ['agency pickup'],
        min_driver_age: 21,
        min_license_years: 1,
        vehicle_id: '',
        meta_title: '',
        meta_description: ''
    });
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('all');
    const [activeSection, setActiveSection] = useState('details');
    const [validationError, setValidationError] = useState('');
    const { token } = useContext(AppContext);


    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await fetch('/api/agency/vehicles', {
                    headers: { Authorization: `Bearer ${token}` }

                });
                if (!response.ok) throw new Error('Failed to fetch vehicles');
                const data = await response.json();
                console.log("🚀 ~ fetchVehicles ~ data.data:", data.data)

                setVehicles(data.data);
                setFilteredVehicles(data.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                console.error('Error fetching vehicles:', err);
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    useEffect(() => {
        let result = vehicles;

        if (searchTerm) {
            result = result.filter(vehicle =>
                vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedBrand !== 'all') {
            result = result.filter(vehicle => vehicle.brand === selectedBrand);
        }

        setFilteredVehicles(result);
    }, [searchTerm, selectedBrand, vehicles]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            if (name === 'delivery_options') {
                const newOptions = [...formData.delivery_options];
                if (checked) {
                    newOptions.push(value);
                } else {
                    const index = newOptions.indexOf(value);
                    if (index > -1) {
                        newOptions.splice(index, 1);
                    }
                }
                setFormData({ ...formData, delivery_options: newOptions });
            } else {
                setFormData({ ...formData, [name]: checked });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleVehicleSelect = (vehicle) => {
        setFormData({ ...formData, vehicle_id: vehicle.id });
        setSelectedVehicle(vehicle);
        setValidationError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.vehicle_id) {
            setValidationError('Please select a vehicle');
            return;
        }
        if (!formData.title.trim()) {
            setValidationError('Title is required');
            return;
        }
        if (!formData.description.trim()) {
            setValidationError('Description is required');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setValidationError('');

        try {
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",

                },
                body: JSON.stringify({
                    ...formData,
                })
            });
            console.log(response);

            var responseData = await response.json();

            if (!response.ok) {
                // Handle validation errors
                if (responseData.errors) {
                    const errorMessages = Object.values(responseData.errors)
                        .flat()
                        .join(', ');
                    throw new Error(`Validation failed: ${errorMessages}`);
                }
                throw new Error(responseData.error || responseData.message || 'Failed to create post');
            }
            navigate('/manager/posts');
        } catch (err) {
            setError(err.message);
            console.error('Error creating post:', err, responseData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getBrands = () => {
        return [...new Set(vehicles.map(v => v.brand))];
    };

    const renderFeatureIcon = (feature) => {
        switch (feature) {
            case 'Air Conditioning': return <TbAirConditioning className="text-indigo-600 mr-2" />;
            case 'Automatic Transmission': return <GiGearStickPattern className="text-indigo-600 mr-2" />;
            case '4x4': return <FaCar className="text-indigo-600 mr-2" />;
            case 'Heated Seats': return <FaSnowflake className="text-indigo-600 mr-2" />;
            default: return <FiInfo className="text-indigo-600 mr-2" />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <Link to="/manager/posts" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
                    <FiArrowLeft className="mr-2" />
                    Back to Posts
                </Link>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl overflow-hidden border border-gray-200 mb-8">
                <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <h1 className="text-2xl font-bold flex items-center">
                        <FiPlus className="mr-3" />
                        Create New Vehicle Post
                    </h1>
                    <p className="opacity-90 mt-2">Fill in the details to list your vehicle for rental</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Vehicle Selection */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <FiTruck className="mr-3 text-indigo-600" />
                        Select Vehicle
                    </h2>

                    {/* Search and Filter */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search vehicles..."
                                className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Brand</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedBrand('all')}
                                className={`px-3 py-1 rounded-full text-xs font-medium ${selectedBrand === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                All Brands
                            </button>
                            {getBrands().map(brand => (
                                <button
                                    key={brand}
                                    onClick={() => setSelectedBrand(brand)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${selectedBrand === brand
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 h-[90vh] overflow-y-auto pr-2">
                        {filteredVehicles.length > 0 ? (
                            filteredVehicles.map(vehicle => (
                                <div
                                    key={vehicle.id}
                                    onClick={() => handleVehicleSelect(vehicle)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${formData.vehicle_id === vehicle.id
                                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                        : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="flex">
                                        <div className="flex-shrink-0 mr-4">
                                            {vehicle.images && vehicle.images.length > 0 ? (
                                                <div className="relative">
                                                    <div className="flex overflow-x-auto w-20 h-20 rounded-lg shadow snap-x snap-mandatory hide-scrollbar">
                                                        {vehicle.images.map((image, index) => (
                                                            <img
                                                                key={index}
                                                                src={image}
                                                                alt={`${vehicle.brand} ${vehicle.model} ${index + 1}`}
                                                                className="w-20 h-20 flex-shrink-0 object-cover snap-start"
                                                            />
                                                        ))}
                                                    </div>
                                                    {vehicle.images.length > 1 && (
                                                        <div className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                            +{vehicle.images.length - 1}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-20 h-20 flex items-center justify-center shadow">
                                                    <FiTruck className="text-gray-400 text-xl" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800">
                                                {vehicle.brand} {vehicle.model}
                                            </h3>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {vehicle.year} • ${vehicle.price_per_day}/day
                                            </div>
                                            <div className="mt-2 flex items-center text-xs text-gray-500">
                                                <span className="mr-3 flex items-center">
                                                    <GiGearStickPattern className="mr-1" />
                                                    {vehicle.transmission}
                                                </span>
                                                <span className="flex items-center">
                                                    <FaGasPump className="mr-1" />
                                                    {vehicle.fuel_type}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            {formData.vehicle_id === vehicle.id ? (
                                                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                                    <FiCheck className="text-white text-sm" />
                                                </div>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <FiTruck className="text-gray-400 text-2xl" />
                                </div>
                                <p className="text-gray-600 mb-3">No vehicles found</p>
                                <Link
                                    to="/manager/vehicles"
                                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                >
                                    <FiPlus className="mr-1" />
                                    Add a vehicle
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Post Form */}
                <div>
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 mb-6">
                        <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
                            <button
                                onClick={() => setActiveSection('details')}
                                className={`px-4 py-3 font-medium text-sm whitespace-nowrap relative ${activeSection === 'details'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Post Details
                            </button>
                            <button
                                onClick={() => setActiveSection('requirements')}
                                className={`px-4 py-3 font-medium text-sm whitespace-nowrap relative ${activeSection === 'requirements'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Requirements
                            </button>
                            <button
                                onClick={() => setActiveSection('seo')}
                                className={`px-4 py-3 font-medium text-sm whitespace-nowrap relative ${activeSection === 'seo'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                SEO Settings
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {validationError && (
                                <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg">
                                    <p className="font-medium">Validation Error:</p>
                                    <p>{validationError}</p>
                                </div>
                            )}

                            {activeSection === 'details' && (
                                <div className="space-y-6">
                                    {selectedVehicle && (
                                        <div className="bg-indigo-50 rounded-xl p-4 mb-6">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 mr-4">
                                                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                                                        <FiTruck className="text-gray-400 text-xl" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800">
                                                        {selectedVehicle.brand} {selectedVehicle.model}
                                                    </h3>
                                                    <div className="text-sm text-gray-600">
                                                        {selectedVehicle.year} • ${selectedVehicle.price_per_day}/day
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Post Title <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Luxury Sedan - Perfect for Business Trips"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Description <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="5"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Describe the vehicle, its features, and why it's perfect for renters..."
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
                                                { value: 'published', label: 'Publish', color: 'bg-green-100 text-green-800' },
                                                { value: 'archived', label: 'Archive', color: 'bg-gray-100 text-gray-800' }
                                            ].map(status => (
                                                <label
                                                    key={status.value}
                                                    className={`flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-colors ${formData.status === status.value
                                                        ? 'border-indigo-500 shadow-sm'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="status"
                                                        value={status.value}
                                                        checked={formData.status === status.value}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                        {status.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'requirements' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-5 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                <FiUser className="mr-2 text-indigo-600" />
                                                Minimum Driver Age
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="range"
                                                    name="min_driver_age"
                                                    min="18"
                                                    max="99"
                                                    value={formData.min_driver_age}
                                                    onChange={handleChange}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                                <span className="ml-4 text-lg font-bold text-indigo-700 min-w-[40px]">
                                                    {formData.min_driver_age}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-5 rounded-xl">
                                            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                                <FiCalendar className="mr-2 text-indigo-600" />
                                                Minimum License Years
                                            </label>
                                            <div className="flex items-center">
                                                <input
                                                    type="range"
                                                    name="min_license_years"
                                                    min="1"
                                                    max="50"
                                                    value={formData.min_license_years}
                                                    onChange={handleChange}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                />
                                                <span className="ml-4 text-lg font-bold text-indigo-700 min-w-[40px]">
                                                    {formData.min_license_years}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <FiMapPin className="mr-2 text-indigo-600" />
                                            Delivery Options
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {['agency pickup', 'delivery'].map(option => (
                                                <label
                                                    key={option}
                                                    className={`flex items-center p-4 rounded-xl border cursor-pointer transition-colors ${formData.delivery_options.includes(option)
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="delivery_options"
                                                        value={option}
                                                        checked={formData.delivery_options.includes(option)}
                                                        onChange={handleChange}
                                                        className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                                                    />
                                                    <div className="ml-4">
                                                        <span className="block font-medium text-gray-800 capitalize">
                                                            {option}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'seo' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <FiAward className="mr-2 text-indigo-600" />
                                            Meta Title
                                        </label>
                                        <input
                                            type="text"
                                            name="meta_title"
                                            value={formData.meta_title}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Luxury Sedan Rental | Best Prices | [Your City]"
                                        />
                                        <div className="mt-2 flex justify-between">
                                            <p className="text-xs text-gray-500">
                                                Recommended: 50-60 characters
                                            </p>
                                            <p className={`text-xs ${formData.meta_title.length > 60 ? 'text-red-500' : 'text-gray-500'
                                                }`}>
                                                {formData.meta_title.length}/60
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                                            <FiTag className="mr-2 text-indigo-600" />
                                            Meta Description
                                        </label>
                                        <textarea
                                            name="meta_description"
                                            value={formData.meta_description}
                                            onChange={handleChange}
                                            rows="3"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="Rent our premium luxury sedan for your business trips. Comfortable, reliable, and affordable..."
                                        />
                                        <div className="mt-2 flex justify-between">
                                            <p className="text-xs text-gray-500">
                                                Recommended: 150-160 characters
                                            </p>
                                            <p className={`text-xs ${formData.meta_description.length > 160 ? 'text-red-500' : 'text-gray-500'
                                                }`}>
                                                {formData.meta_description.length}/160
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-6 bg-red-50 text-red-700 p-4 rounded-lg">
                                    <p className="font-medium">Error:</p>
                                    <p>{error}</p>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus className="mr-2" />
                                            Create Post
                                        </>
                                    )}
                                </button>

                                <Link
                                    to="/manager/posts"
                                    className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </Link>
                            </div>
                        </form>
                    </div>

                    {/* Features Section */}
                    {selectedVehicle && selectedVehicle.features?.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <FiInfo className="mr-3 text-indigo-600" />
                                Vehicle Features
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                {selectedVehicle.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center p-3 rounded-lg bg-indigo-50 border border-indigo-200"
                                    >
                                        {renderFeatureIcon(feature)}
                                        <span className="text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCreate;