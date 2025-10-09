// src/components/PostCreate.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FiArrowLeft, FiPlus, FiCheck, FiTruck,
    FiInfo, FiSearch, FiCalendar, FiArrowRight,
    FiUser, FiMapPin, FiAward, FiTag, FiAlertCircle
} from 'react-icons/fi';
import { FaGasPump, FaCar, FaSnowflake } from 'react-icons/fa';
import { GiGearStickPattern } from 'react-icons/gi';
import { TbAirConditioning } from 'react-icons/tb';
import { AppContext } from "../../../Context/AppContext";

const PostCreate = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'published',
        delivery_options: ['agency pickup', 'delivery'],
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
    const [fieldErrors, setFieldErrors] = useState({});
    const { token } = useContext(AppContext);
    const isButtonClick = useRef(false);
    const sections = [
        { id: 'details', label: 'Post Details', icon: FiInfo },
        { id: 'requirements', label: 'Requirements', icon: FiUser },
        { id: 'seo', label: 'SEO Settings', icon: FiAward }
    ];

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await fetch('/api/agency/vehicles', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch vehicles');
                const data = await response.json();
                console.log("🚀 ~ fetchVehicles ~ data.data:", data.data);

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
    }, [token]);

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

        // Clear error for this field when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }

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
                // Clear delivery options error
                if (fieldErrors.delivery_options) {
                    setFieldErrors(prev => ({ ...prev, delivery_options: '' }));
                }
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
        // Clear vehicle error
        if (fieldErrors.vehicle_id) {
            setFieldErrors(prev => ({ ...prev, vehicle_id: '' }));
        }
    };

    const validateCurrentSection = () => {
        const errors = {};

        switch (activeSection) {
            case 'details':
                if (!formData.vehicle_id) {
                    errors.vehicle_id = 'Please select a vehicle';
                }
                if (!formData.title.trim()) {
                    errors.title = 'Title is required';
                }
                if (!formData.description.trim()) {
                    errors.description = 'Description is required';
                }
                break;

            case 'requirements':
                if (formData.delivery_options.length === 0) {
                    errors.delivery_options = 'Please select at least one delivery option';
                }
                break;

            case 'seo':
                // SEO fields are optional
                break;

            default:
                break;
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (!validateCurrentSection()) {
            return;
        }

        const currentIndex = sections.findIndex(s => s.id === activeSection);
        if (currentIndex < sections.length - 1) {
            setActiveSection(sections[currentIndex + 1].id);
            setFieldErrors({});
        }
    };

    const handlePrevious = () => {
        const currentIndex = sections.findIndex(s => s.id === activeSection);
        if (currentIndex > 0) {
            setActiveSection(sections[currentIndex - 1].id);
            setFieldErrors({});
        }
    };


    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent submission on ALL sections

            const currentIndex = getCurrentSectionIndex();

            // If not on last section, move to next
            if (currentIndex < sections.length - 1) {
                // Only move to next if current section validates
                if (validateCurrentSection()) {
                    handleNext();
                }
            }
            // On last section, do nothing - force user to click button
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // CRITICAL: Only allow submission if it came from button click
        if (!isButtonClick.current) {
            console.warn('Form submission blocked - must use Create Post button');
            return;
        }

        // Reset the flag
        isButtonClick.current = false;

        // Extra safety check - only submit on last section
        if (getCurrentSectionIndex() !== sections.length - 1) {
            console.warn('Attempting to submit before final section');
            return;
        }

        if (!validateCurrentSection()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setFieldErrors({});

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

            var responseData = await response.json();

            if (!response.ok) {
                if (responseData.errors) {
                    const backendErrors = {};
                    Object.keys(responseData.errors).forEach(key => {
                        backendErrors[key] = responseData.errors[key][0];
                    });
                    setFieldErrors(backendErrors);
                    return;
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

    const getCurrentSectionIndex = () => {
        return sections.findIndex(s => s.id === activeSection);
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

                {/* Progress Bar */}
                <div className="px-6 py-4 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        {sections.map((section, index) => {
                            const Icon = section.icon;
                            const isActive = section.id === activeSection;
                            const isCompleted = getCurrentSectionIndex() > index;

                            return (
                                <React.Fragment key={section.id}>
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive
                                                ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                                : isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : 'bg-gray-200 text-gray-500'
                                                }`}
                                        >
                                            {isCompleted ? <FiCheck className="text-lg" /> : <Icon className="text-lg" />}
                                        </div>
                                        <span
                                            className={`mt-2 text-xs font-medium ${isActive ? 'text-indigo-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                                                }`}
                                        >
                                            {section.label}
                                        </span>
                                    </div>
                                    {index < sections.length - 1 && (
                                        <div className="flex-1 h-0.5 bg-gray-200 mx-2 relative" style={{ top: '-20px' }}>
                                            <div
                                                className={`h-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'
                                                    }`}
                                                style={{ width: isCompleted ? '100%' : '0%' }}
                                            ></div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Vehicle Selection */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <FiTruck className="mr-3 text-indigo-600" />
                            Select Vehicle
                        </h2>
                        {fieldErrors.vehicle_id && (
                            <div className="mt-2 flex items-center text-red-600 text-sm">
                                <FiAlertCircle className="mr-1 flex-shrink-0" />
                                <span>{fieldErrors.vehicle_id}</span>
                            </div>
                        )}
                    </div>

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
                                type="button"
                                onClick={() => setSelectedBrand('all')}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedBrand === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                All Brands
                            </button>
                            {getBrands().map(brand => (
                                <button
                                    type="button"
                                    key={brand}
                                    onClick={() => setSelectedBrand(brand)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${selectedBrand === brand
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {brand}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={`space-y-4 h-[90vh] overflow-y-auto pr-2 ${fieldErrors.vehicle_id ? 'border-2 border-red-300 rounded-xl p-2' : ''}`}>
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
                        {/* UPDATED: Added onKeyDown to form */}
                        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
                            {activeSection === 'details' && (
                                <div className="space-y-6">
                                    {selectedVehicle && (
                                        <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-200">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 mr-4">
                                                    {selectedVehicle.images && selectedVehicle.images.length > 0 ? (
                                                        <img
                                                            src={selectedVehicle.images[0]}
                                                            alt={`${selectedVehicle.brand} ${selectedVehicle.model}`}
                                                            className="w-16 h-16 object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                                                            <FiTruck className="text-gray-400 text-xl" />
                                                        </div>
                                                    )}
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
                                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${fieldErrors.title
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:border-transparent'
                                                }`}
                                            placeholder="Luxury Sedan - Perfect for Business Trips"
                                        />
                                        {fieldErrors.title && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <FiAlertCircle className="mr-1 flex-shrink-0" />
                                                {fieldErrors.title}
                                            </p>
                                        )}
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
                                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors ${fieldErrors.description
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:border-transparent'
                                                }`}
                                            placeholder="Describe the vehicle, its features, and why it's perfect for renters..."
                                        />
                                        {fieldErrors.description && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <FiAlertCircle className="mr-1 flex-shrink-0" />
                                                {fieldErrors.description}
                                            </p>
                                        )}
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
                                                    className={`flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${formData.status === status.value
                                                        ? 'border-indigo-500 shadow-sm ring-2 ring-indigo-100'
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
                                            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
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
                                            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                                            <FiMapPin className="mr-2 text-indigo-600" />
                                            Delivery Options <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${fieldErrors.delivery_options ? 'border-2 border-red-300 rounded-xl p-3' : ''}`}>
                                            {['agency pickup', 'delivery'].map(option => (
                                                <label
                                                    key={option}
                                                    className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${formData.delivery_options.includes(option)
                                                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100'
                                                        : 'border-gray-300 hover:border-gray-400'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        name="delivery_options"
                                                        value={option}
                                                        checked={formData.delivery_options.includes(option)}
                                                        onChange={handleChange}
                                                        className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                                    />
                                                    <div className="ml-4">
                                                        <span className="block font-medium text-gray-800 capitalize">
                                                            {option}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {option === 'agency pickup' ? 'Customer picks up from agency' : 'Deliver to customer location'}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {fieldErrors.delivery_options && (
                                            <p className="mt-2 text-sm text-red-600 flex items-center">
                                                <FiAlertCircle className="mr-1 flex-shrink-0" />
                                                {fieldErrors.delivery_options}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeSection === 'seo' && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-blue-800">
                                            💡 SEO fields are optional but recommended for better search engine visibility
                                        </p>
                                    </div>

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
                                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${fieldErrors.meta_title
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:border-transparent'
                                                }`}
                                            placeholder="Luxury Sedan Rental | Best Prices | [Your City]"
                                        />
                                        {fieldErrors.meta_title && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <FiAlertCircle className="mr-1 flex-shrink-0" />
                                                {fieldErrors.meta_title}
                                            </p>
                                        )}
                                        <div className="mt-2 flex justify-between">
                                            <p className="text-xs text-gray-500">
                                                Recommended: 50-60 characters
                                            </p>
                                            <p className={`text-xs font-medium ${formData.meta_title.length > 60 ? 'text-red-500' : formData.meta_title.length > 0 ? 'text-green-600' : 'text-gray-500'
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
                                            rows="4"
                                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-colors ${fieldErrors.meta_description
                                                ? 'border-red-500 bg-red-50'
                                                : 'border-gray-300 focus:border-transparent'
                                                }`}
                                            placeholder="Rent our premium luxury sedan for your business trips. Comfortable, reliable, and affordable. Book now and enjoy special discounts..."
                                        />
                                        {fieldErrors.meta_description && (
                                            <p className="mt-1 text-sm text-red-600 flex items-center">
                                                <FiAlertCircle className="mr-1 flex-shrink-0" />
                                                {fieldErrors.meta_description}
                                            </p>
                                        )}
                                        <div className="mt-2 flex justify-between">
                                            <p className="text-xs text-gray-500">
                                                Recommended: 150-160 characters
                                            </p>
                                            <p className={`text-xs font-medium ${formData.meta_description.length > 160 ? 'text-red-500' : formData.meta_description.length > 0 ? 'text-green-600' : 'text-gray-500'
                                                }`}>
                                                {formData.meta_description.length}/160
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-green-800 mb-2">✓ Ready to Create</h4>
                                        <p className="text-sm text-gray-700">
                                            Review your information and click "Create Post" to publish your vehicle listing
                                        </p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mt-6 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                                    <p className="font-medium flex items-center">
                                        <FiAlertCircle className="mr-2" />
                                        Error:
                                    </p>
                                    <p className="mt-1">{error}</p>
                                </div>
                            )}

                            {/* Navigation Buttons */}
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                                <div>
                                    {getCurrentSectionIndex() > 0 && (
                                        <button
                                            type="button"
                                            onClick={handlePrevious}
                                            className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                        >
                                            <FiArrowLeft className="mr-2" />
                                            Previous
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Link
                                        to="/manager/posts"
                                        className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        Cancel
                                    </Link>

                                    {getCurrentSectionIndex() < sections.length - 1 ? (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg font-medium"
                                        >
                                            Next
                                            <FiArrowRight className="ml-2" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            onClick={() => isButtonClick.current = true} // ADD THIS LINE
                                            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-70 font-medium"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <FiCheck className="mr-2" />
                                                    Create Post
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedVehicle.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center p-3 rounded-lg bg-indigo-50 border border-indigo-200"
                                    >
                                        {renderFeatureIcon(feature)}
                                        <span className="text-sm font-medium">{feature}</span>
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