// src/Pages/VehicleDetailPage.jsx
import { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    FaStar, FaStarHalfAlt, FaRegStar, FaCar, FaGasPump,
    FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaTachometerAlt,
    FaCarSide, FaCogs, FaCreditCard, FaShieldAlt, FaUser,
    FaClock, FaHeart, FaShare, FaEye, FaChevronLeft,
    FaTag, FaCheckCircle, FaRoad, FaDollarSign, FaTrash,
    FaUserCircle
} from 'react-icons/fa';
import { AppContext } from "../context/AppContext";

import RentModal from '../Components/RentModal';


export default function VehicleDetailPage() {
    const { user, token } = useContext(AppContext);
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mainImage, setMainImage] = useState(0);
    const [activeTab, setActiveTab] = useState('description');
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [isFavorite, setIsFavorite] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [showRentModal, setShowRentModal] = useState(false);
    const fetchPost = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/posts/${id}`);

            if (!response.ok) {
                throw new Error('Vehicle not found');
            }

            const data = await response.json();
            setPost(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPost();
    }, [fetchPost, refreshCount]);

    const renderRating = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<FaStar key={i} className="text-yellow-500" />);
        }

        if (hasHalfStar) {
            stars.push(<FaStarHalfAlt key="half" className="text-yellow-500" />);
        }

        const emptyStars = 5 - stars.length;
        for (let i = 0; i < emptyStars; i++) {
            stars.push(<FaRegStar key={`empty-${i}`} className="text-yellow-500" />);
        }

        return stars;
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!token) return;

        try {
            setSubmitting(true);

            const response = await fetch('/api/comment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    post_id: id,
                    content: newReview.comment,
                    rating: newReview.rating
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit rating');
            }

            // Refresh data
            setRefreshCount(prev => prev + 1);
            setNewReview({ rating: 5, comment: '' });
        } catch (err) {
            console.error('Rating submission error:', err);
            alert(err.message || 'Failed to submit rating. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this rating?")) return;

        try {
            setDeletingCommentId(commentId);
            const response = await fetch(`/api/comment/${commentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete rating');
            }

            // Refresh data
            setRefreshCount(prev => prev + 1);
        } catch (err) {
            console.error('Rating deletion error:', err);
            alert(err.message || 'Failed to delete rating. Please try again.');
        } finally {
            setDeletingCommentId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                <strong>Error: </strong> {error}
                                <Link to="/vehicles" className="ml-4 text-blue-600 hover:text-blue-800 flex items-center mt-2">
                                    <FaChevronLeft className="mr-1" /> Back to Vehicles
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="text-center py-20">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                        <FaCar className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-4">Vehicle not found</h2>
                    <Link to="/vehicles" className="text-blue-600 hover:text-blue-800 flex items-center justify-center">
                        <FaChevronLeft className="mr-2" /> Back to Vehicles
                    </Link>
                </div>
            </div>
        );
    }

    const vehicle = post.vehicle || {};
    const agency = post.agency || {};
    const images = vehicle.images || [];
    const features = vehicle.features || [];
    const comments = post.comments || [];
    const deliveryOptions = post.delivery_options || [];

    // Calculate discounted prices
    const originalDailyPrice = vehicle.price_per_day ?
        parseFloat(vehicle.price_per_day) / (1 - parseFloat(vehicle.discount_rate || 0) / 100) :
        null;

    const weeklySavings = vehicle.price_per_week && vehicle.price_per_day ?
        (parseFloat(vehicle.price_per_day) * 7) - parseFloat(vehicle.price_per_week) :
        null;

    const monthlySavings = vehicle.price_per_month && vehicle.price_per_day ?
        (parseFloat(vehicle.price_per_day) * 30) - parseFloat(vehicle.price_per_month) :
        null;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <div className="mb-6">
                <Link to="/vehicles" className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
                    <FaChevronLeft className="mr-2" /> Back to Vehicles
                </Link>
            </div>

            {/* Vehicle Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                {/* Vehicle Header */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
                    <div className="absolute top-4 right-4 flex space-x-2">
                        <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className={`p-2.5 rounded-full ${isFavorite ? 'text-red-500 bg-red-50' : 'text-gray-400 bg-white'} hover:bg-gray-100 transition shadow-md`}
                        >
                            <FaHeart className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 rounded-full text-gray-400 bg-white hover:bg-gray-100 transition shadow-md">
                            <FaShare className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                        <div>
                            <div className="flex items-center mb-2">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full mr-2 ${vehicle.status === 'available' ? 'bg-green-100 text-green-800' :
                                    vehicle.status === 'rented' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {vehicle.status || 'Available'}
                                </span>
                                <span className="text-sm text-gray-600">
                                    {vehicle.year || 'N/A'} • {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{post.title}</h1>
                            <div className="flex items-center mt-3">
                                <div className="flex items-center text-yellow-500 mr-4">
                                    {renderRating(post.average_rating || 0)}
                                    <span className="ml-2 text-gray-600">({post.total_reviews || 0} ratings)</span>
                                </div>
                                <div className="flex items-center text-gray-500">
                                    <FaEye className="mr-1" />
                                    <span>{post.view_count?.toLocaleString() || 0} views</span>
                                </div>
                                <div className="flex items-center text-gray-500 ml-4">
                                    <FaCar className="mr-1" />
                                    <span>{post.rental_count?.toLocaleString() || 0} rentals</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row">
                    {/* Left Column - Images */}
                    <div className="w-full lg:w-1/2 p-6">
                        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-md">
                            {images.length > 0 ? (
                                <img
                                    src={images[mainImage]}
                                    alt={`${vehicle.brand} ${vehicle.model}`}
                                    className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <FaCar className="w-16 h-16 opacity-30" />
                                </div>
                            )}

                            {vehicle.discount_rate > 0 && (
                                <div className="absolute top-4 left-4 bg-red-600 text-white font-bold px-3 py-1 rounded-lg shadow-lg">
                                    {vehicle.discount_rate}% OFF
                                </div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        <div className="flex mt-4  space-x-3 overflow-x-auto py-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={() => setMainImage(index)}
                                    className={`ml-2 flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${mainImage === index ?
                                        'border-blue-500 scale-105 shadow-md' :
                                        'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <img
                                        src={img}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="w-full lg:w-1/2 p-6">
                        {/* Pricing Section */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <div className="text-sm text-gray-600">Daily Rate</div>
                                    {vehicle.discount_rate > 0 ? (
                                        <div className="flex items-baseline">
                                            <span className="text-3xl font-bold text-blue-600">
                                                ${vehicle.price_per_day}
                                            </span>
                                            <span className="ml-2 text-gray-500 line-through text-lg">
                                                ${originalDailyPrice?.toFixed(2)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-3xl font-bold text-blue-600">
                                            ${vehicle.price_per_day}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Weekly Rate</div>
                                    <div className="text-xl font-bold text-blue-600">
                                        ${vehicle.price_per_week}
                                    </div>
                                    {weeklySavings > 0 && (
                                        <div className="text-xs text-green-600 mt-1">
                                            Save ${weeklySavings.toFixed(2)} vs daily rate
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between mt-3 pt-3 border-t border-blue-100">
                                <div>
                                    <div className="text-sm text-gray-600">Monthly Rate</div>
                                    <div className="text-xl font-bold text-blue-600">
                                        ${vehicle.price_per_month}
                                    </div>
                                    {monthlySavings > 0 && (
                                        <div className="text-xs text-green-600 mt-1">
                                            Save ${monthlySavings.toFixed(2)} vs daily rate
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-600">Delivery Fee</div>
                                    <div className="text-lg font-bold text-blue-600">
                                        ${vehicle.delivery_fee_per_km}/km
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Agency Info */}
                        <div className="flex items-start mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                            {agency.logo_path ? (
                                <img
                                    src={agency.logo_path}
                                    alt={agency.name}
                                    className="w-14 h-14 rounded-lg object-contain mr-4 border"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 mr-4 border">
                                    {agency.name?.charAt(0) || 'A'}
                                </div>
                            )}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{agency.name}</h3>
                                        <div className="flex items-center text-gray-600 mt-1">
                                            <FaMapMarkerAlt className="mr-2 text-blue-500" />
                                            <span>Morocco</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-yellow-500">
                                        {renderRating(4.7)}
                                        <span className="ml-1 text-gray-600 text-sm">4.7</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex space-x-2">
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-md">
                                        Contact Agency
                                    </button>
                                    <button className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Specs */}
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800 border-b pb-2">Vehicle Specifications</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <FaCar className="text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-gray-500 text-xs">Brand</div>
                                        <div className="font-medium text-gray-800">{vehicle.brand || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <FaGasPump className="text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-gray-500 text-xs">Fuel Type</div>
                                        <div className="font-medium text-gray-800">{vehicle.fuel_type || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <FaUsers className="text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-gray-500 text-xs">Seats</div>
                                        <div className="font-medium text-gray-800">{vehicle.seats || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <FaCalendarAlt className="text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-gray-500 text-xs">Year</div>
                                        <div className="font-medium text-gray-800">{vehicle.year || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <FaRoad className="text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-gray-500 text-xs">Mileage</div>
                                        <div className="font-medium text-gray-800">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <FaCarSide className="text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-gray-500 text-xs">Transmission</div>
                                        <div className="font-medium text-gray-800">{vehicle.transmission || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <FaCogs className="text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-gray-500 text-xs">Engine</div>
                                        <div className="font-medium text-gray-800">{vehicle.engine_type || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <FaTag className="text-blue-500 mr-3" />
                                    <div>
                                        <div className="text-gray-500 text-xs">Type</div>
                                        <div className="font-medium text-gray-800">{vehicle.type || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-3 text-gray-800 border-b pb-2">Features & Amenities</h3>
                            <div className="flex flex-wrap gap-2">
                                {features.map((feature, index) => (
                                    <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center">
                                        <FaCheckCircle className="mr-1 text-blue-500" /> {feature}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Requirements */}
                        <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                            <h3 className="text-lg font-semibold mb-3 text-gray-800">Rental Requirements</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center">
                                    <FaUser className="text-blue-500 mr-2" />
                                    <span className="text-gray-700">Min. Age: <span className="font-semibold">{post.min_driver_age || 21} years</span></span>
                                </div>
                                <div className="flex items-center">
                                    <FaCalendarAlt className="text-blue-500 mr-2" />
                                    <span className="text-gray-700">Min. License: <span className="font-semibold">{post.min_license_years || 2} years</span></span>
                                </div>
                                <div className="flex items-center">
                                    <FaClock className="text-blue-500 mr-2" />
                                    <span className="text-gray-700">Min. Rental: <span className="font-semibold">{vehicle.minimum_rental_days || 3} days</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Rent Button */}
                        <button
                            onClick={() => setShowRentModal(true)}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-xl hover:opacity-90 transition font-bold text-lg shadow-lg transform hover:-translate-y-0.5"
                        >
                            Rent Now - ${vehicle.price_per_day || '0.00'} / day
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-t border-gray-200">
                    <div className="flex overflow-x-auto bg-gray-50">
                        <button
                            className={`px-6 py-4 font-medium text-sm md:text-base whitespace-nowrap ${activeTab === 'description' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'}`}
                            onClick={() => setActiveTab('description')}
                        >
                            Description
                        </button>
                        <button
                            className={`px-6 py-4 font-medium text-sm md:text-base whitespace-nowrap ${activeTab === 'specifications' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'}`}
                            onClick={() => setActiveTab('specifications')}
                        >
                            Technical Details
                        </button>
                        <button
                            className={`px-6 py-4 font-medium text-sm md:text-base whitespace-nowrap ${activeTab === 'delivery' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-600 hover:text-gray-900'}`}
                            onClick={() => setActiveTab('delivery')}
                        >
                            Delivery Options
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 bg-white">
                        {activeTab === 'description' && (
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Vehicle Description</h3>
                                <p className="text-gray-700 leading-relaxed text-lg">
                                    {post.description || "No description available for this vehicle."}
                                </p>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <h4 className="font-semibold text-blue-800 mb-2">Vehicle Description</h4>
                                        <p className="text-gray-700">{vehicle.description || "No additional description available."}</p>
                                    </div>
                                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                        <h4 className="font-semibold text-indigo-800 mb-2">Tags</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {post.tags && post.tags.split(',').map((tag, index) => (
                                                <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                                                    {tag.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'specifications' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-lg font-semibold mb-3 text-gray-800">Identification</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">VIN</span>
                                            <span className="font-medium text-gray-800">{vehicle.vin || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">License Plate</span>
                                            <span className="font-medium text-gray-800">{vehicle.license_plate || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Color</span>
                                            <span className="font-medium text-gray-800">{vehicle.color || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Doors</span>
                                            <span className="font-medium text-gray-800">{vehicle.doors || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-lg font-semibold mb-3 text-gray-800">Availability</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Available From</span>
                                            <span className="font-medium text-gray-800">
                                                {vehicle.available_from ? new Date(vehicle.available_from).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Available To</span>
                                            <span className="font-medium text-gray-800">
                                                {vehicle.available_to ? new Date(vehicle.available_to).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-600">Blackout Dates</span>
                                            <span className="font-medium text-gray-800">
                                                {vehicle.blackout_dates ? JSON.parse(vehicle.blackout_dates).join(', ') : 'None'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'delivery' && (
                            <div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-800">Delivery & Pickup Options</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {deliveryOptions.includes('agency pickup') && (
                                        <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                                            <div className="flex items-start mb-4">
                                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                                    <FaMapMarkerAlt className="text-blue-600 text-xl" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-lg text-gray-800">Agency Pickup</h4>
                                                    <p className="text-gray-600 mt-2">Pickup Location: {agency.name}</p>
                                                    <p className="text-gray-600">Address: Morocco</p>
                                                </div>
                                            </div>
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <p className="text-blue-700">You can pick up the vehicle directly from our agency location during business hours.</p>
                                            </div>
                                        </div>
                                    )}

                                    {deliveryOptions.includes('home delivery') && (
                                        <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                                            <div className="flex items-start mb-4">
                                                <div className="bg-green-100 p-2 rounded-lg mr-3">
                                                    <FaCar className="text-green-600 text-xl" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-lg text-gray-800">Home Delivery</h4>
                                                    <p className="text-gray-600 mt-2">Delivery fee: ${vehicle.delivery_fee_per_km || '0.00'} per km</p>
                                                </div>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <p className="text-green-700">We can deliver the vehicle to your specified location. Delivery fee will be calculated based on distance from our agency.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <h4 className="font-semibold text-lg mb-3 text-gray-800">Delivery Terms</h4>
                                    <ul className="space-y-3 text-gray-700">
                                        <li className="flex items-start">
                                            <FaShieldAlt className="text-blue-500 mr-2 mt-1" />
                                            <span>Vehicle must be returned in the same condition as received</span>
                                        </li>
                                        <li className="flex items-start">
                                            <FaUser className="text-blue-500 mr-2 mt-1" />
                                            <span>Driver must be present at delivery time with valid license</span>
                                        </li>
                                        <li className="flex items-start">
                                            <FaCreditCard className="text-blue-500 mr-2 mt-1" />
                                            <span>Credit card required for security deposit</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ratings Section */}
            <div className="bg-white rounded-2xl shadow-xl mt-8 overflow-hidden border border-gray-200">
                {/* Add Rating Form */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800">
                        {user ? 'Rate This Vehicle' : 'Login to Rate'}
                    </h3>

                    {user ? (
                        <form onSubmit={handleReviewSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2 font-medium">Your Rating</label>
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview({ ...newReview, rating: star })}
                                            className="text-2xl mr-1 focus:outline-none transition-transform hover:scale-110"
                                        >
                                            {star <= newReview.rating ? (
                                                <FaStar className="text-yellow-500" />
                                            ) : (
                                                <FaRegStar className="text-gray-300" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <label htmlFor="comment" className="block text-gray-700 mb-2 font-medium">
                                    Optional Comment
                                </label>
                                <textarea
                                    id="comment"
                                    rows="3"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Add a comment (optional)..."
                                    value={newReview.comment}
                                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                    disabled={submitting}
                                ></textarea>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md disabled:opacity-50"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Rating'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-gray-600 mb-4">
                                Please login to rate this vehicle
                            </p>
                            <Link
                                to="/login"
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md inline-block"
                            >
                                Login Now
                            </Link>
                        </div>
                    )}
                </div>

                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-800">Customer Ratings</h2>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4">
                        <div className="flex items-center mb-4 md:mb-0">
                            <div className="text-4xl font-bold text-gray-900 mr-4">
                                {post.average_rating || 0}<span className="text-gray-400 text-2xl">/5</span>
                            </div>
                            <div>
                                <div className="flex items-center text-yellow-500 text-xl">
                                    {renderRating(post.average_rating || 0)}
                                </div>
                                <p className="text-gray-600 mt-1">{post.total_reviews || 0} ratings</p>
                            </div>
                        </div>

                        <div className="w-full md:w-auto">
                            <div className="space-y-2">
                                {[5, 4, 3, 2, 1].map((star) => (
                                    <div key={star} className="flex items-center">
                                        <div className='flex items-center text-gray-600 text-sm mr-2'>
                                            <span className="w-10">{star} star</span>
                                        </div>

                                        <div className="w-40 h-2 bg-gray-200 rounded-full mx-2 overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-500"
                                                style={{
                                                    width: `${(post[`${star}_star_count`] / (post.total_reviews || 1)) * 100 || 0}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-gray-600 text-sm w-10">
                                            {post[`${star}_star_count`] || 0}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ratings List */}
                <div className="p-6">
                    {comments.length > 0 ? (
                        <div className="space-y-6">
                            {comments.map((comment) => (
                                <div key={comment.id} className="pb-6 border-b border-gray-100 last:border-0">
                                    <div className="flex items-start mb-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                                            {comment.user?.name?.charAt(0) || <FaUserCircle className="text-xl" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-gray-800">{comment.user?.name || 'Anonymous'}</h4>
                                                    <div className="flex items-center my-2">
                                                        <div className="flex text-yellow-500">
                                                            {renderRating(comment.rating)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <FaClock className="mr-1" />
                                                        <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    {user && (user.id === comment.user_id || user.role === 'admin') && (
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            disabled={deletingCommentId === comment.id}
                                                            className="text-red-500 hover:text-red-700 transition ml-2"
                                                            title="Delete rating"
                                                        >
                                                            {deletingCommentId === comment.id ? (
                                                                <span className="animate-pulse text-sm">Deleting...</span>
                                                            ) : (
                                                                <FaTrash />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {comment.content && (
                                                <p className="text-gray-700 mt-2 bg-gray-50 p-3 rounded-lg">
                                                    {comment.content}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <FaStar className="w-8 h-8 text-yellow-400" />
                            </div>
                            <p className="text-gray-600">No ratings yet. Be the first to rate this vehicle!</p>
                        </div>
                    )}
                </div>
            </div>
            {showRentModal && (
                <RentModal
                    post={post}
                    vehicle={vehicle}
                    agency={agency}
                    deliveryOptions={deliveryOptions}
                    onClose={() => setShowRentModal(false)}
                    onConfirm={(rentalData) => {
                        console.log('Rental confirmed:', rentalData);
                        setShowRentModal(false);
                    }}
                />
            )}
        </div>


    );
}