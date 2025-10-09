// src/components/PostView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    FiArrowLeft, FiStar, FiTruck, FiCalendar, FiUser,
    FiMapPin, FiEdit, FiAlertCircle, FiEye, FiMessageCircle
} from 'react-icons/fi';
import { FaGasPump, FaCarSide, FaSnowflake } from 'react-icons/fa';
import { GiGearStickPattern, GiCarDoor } from 'react-icons/gi';
import { IoMdSpeedometer } from 'react-icons/io';
import { TbAirConditioning } from 'react-icons/tb';

const PostView = () => {
    const { id } = useParams();
    // const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch post details');
            }

            const data = await response.json();

            // Check if response is successful and has data
            if (!data.success || !data.data) {
                throw new Error(data.message || 'Post not found');
            }

            // The data is already processed by backend, just set it
            setPost(data.data);

        } catch (err) {
            setError(err.message);
            console.error('Error fetching post:', err);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <FiStar
                        key={i}
                        className={`${i < Math.floor(rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'} text-lg`}
                    />
                ))}
                <span className="ml-2 text-gray-600 font-medium">
                    {rating ? rating : '0.0'} ({post?.total_reviews || 0} reviews)
                </span>
            </div>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading post details...</p>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 rounded-2xl p-8 text-center border border-red-100">
                    <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Post</h2>
                    <p className="text-gray-600 mb-6">{error || 'Post not found'}</p>
                    <div className="flex justify-center space-x-3">
                        <Link
                            to="/manager/posts"
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <FiArrowLeft className="mr-2" />
                            Back to Posts
                        </Link>
                        <button
                            onClick={fetchPost}
                            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Safe access to vehicle data
    const vehicle = post.vehicle || {};
    const vehicleImages = vehicle.images || [];
    // const agency = post.agency || {};

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <Link
                        to="/manager/posts"
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                        <FiArrowLeft className="mr-2" />
                        Back to Posts
                    </Link>
                    <Link
                        to={`/manager/post/edit/${post.id}`}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                        <FiEdit className="mr-2" />
                        Edit Post
                    </Link>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    {/* Image Gallery */}
                    <div className="relative bg-gray-900">
                        {vehicleImages.length > 0 ? (
                            <>
                                <img
                                    src={vehicleImages[imageIndex]}
                                    alt={vehicle.model || 'Vehicle'}
                                    className="w-full h-96 md:h-[500px] object-cover"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://via.placeholder.com/800x500?text=Image+Not+Available';
                                    }}
                                />
                                {vehicleImages.length > 1 && (
                                    <>
                                        {/* Navigation Arrows */}
                                        <button
                                            onClick={() => setImageIndex((imageIndex - 1 + vehicleImages.length) % vehicleImages.length)}
                                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 transition-all"
                                        >
                                            <FiArrowLeft className="text-gray-800" />
                                        </button>
                                        <button
                                            onClick={() => setImageIndex((imageIndex + 1) % vehicleImages.length)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-3 transition-all rotate-180"
                                        >
                                            <FiArrowLeft className="text-gray-800" />
                                        </button>
                                        {/* Dots Navigation */}
                                        <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2">
                                            {vehicleImages.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setImageIndex(index)}
                                                    className={`w-3 h-3 rounded-full transition-all ${index === imageIndex
                                                        ? 'bg-white w-8'
                                                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-full h-96 md:h-[500px] flex flex-col items-center justify-center">
                                <FiTruck className="text-gray-400 text-6xl mb-4" />
                                <p className="text-gray-500 font-medium">No images available</p>
                            </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg ${post.status === 'published'
                                ? 'bg-green-500 text-white'
                                : post.status === 'draft'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-gray-500 text-white'
                                }`}>
                                {post.status?.charAt(0).toUpperCase() + post.status?.slice(1) || 'Unknown'}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                        {/* Title and Rating */}
                        <div className="mb-8">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                                {post.title || 'Untitled Post'}
                            </h1>
                            <div className="flex flex-wrap items-center gap-6">
                                {renderStars(post.average_rating)}
                                <div className="flex items-center text-gray-600">
                                    <FiEye className="mr-2" />
                                    <span>{post.view_count || 0} views</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <FiMessageCircle className="mr-2" />
                                    <span>{post.total_reviews || 0} comments</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Vehicle Info */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Vehicle Details */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                        <FiTruck className="mr-3 text-indigo-600" />
                                        Vehicle Details
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex items-center mb-2">
                                                <FiTruck className="text-indigo-600 text-xl mr-2" />
                                                <span className="text-gray-500 text-sm font-medium">Brand</span>
                                            </div>
                                            <div className="text-lg font-semibold">{vehicle.brand || 'N/A'}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex items-center mb-2">
                                                <FaCarSide className="text-indigo-600 text-xl mr-2" />
                                                <span className="text-gray-500 text-sm font-medium">Model</span>
                                            </div>
                                            <div className="text-lg font-semibold">{vehicle.model || 'N/A'}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex items-center mb-2">
                                                <FiCalendar className="text-indigo-600 text-xl mr-2" />
                                                <span className="text-gray-500 text-sm font-medium">Year</span>
                                            </div>
                                            <div className="text-lg font-semibold">{vehicle.year || 'N/A'}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex items-center mb-2">
                                                <GiGearStickPattern className="text-indigo-600 text-xl mr-2" />
                                                <span className="text-gray-500 text-sm font-medium">Transmission</span>
                                            </div>
                                            <div className="text-lg font-semibold">{vehicle.transmission_type || 'N/A'}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex items-center mb-2">
                                                <FaGasPump className="text-indigo-600 text-xl mr-2" />
                                                <span className="text-gray-500 text-sm font-medium">Fuel Type</span>
                                            </div>
                                            <div className="text-lg font-semibold">{vehicle.fuel_type || 'N/A'}</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex items-center mb-2">
                                                <IoMdSpeedometer className="text-indigo-600 text-xl mr-2" />
                                                <span className="text-gray-500 text-sm font-medium">Mileage</span>
                                            </div>
                                            <div className="text-lg font-semibold">{vehicle.mileage || '0'} km</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Features */}
                                {vehicle.features && vehicle.features.length > 0 && (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Features & Amenities</h2>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {vehicle.features.map((feature, index) => (
                                                <div key={index} className="flex items-center bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                                                        {feature.toLowerCase().includes('air') && <TbAirConditioning className="text-indigo-600 text-xl" />}
                                                        {feature.toLowerCase().includes('automatic') && <GiGearStickPattern className="text-indigo-600 text-xl" />}
                                                        {feature.toLowerCase().includes('4x4') && <FaCarSide className="text-indigo-600 text-xl" />}
                                                        {feature.toLowerCase().includes('heated') && <FaSnowflake className="text-indigo-600 text-xl" />}
                                                        {!feature.toLowerCase().match(/air|automatic|4x4|heated/) && <FiTruck className="text-indigo-600 text-xl" />}
                                                    </div>
                                                    <span className="font-medium text-gray-700">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Description</h2>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                        {post.description || 'No description available.'}
                                    </p>
                                </div>

                                {/* Post Metadata */}
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Post Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-500 text-sm">Created:</span>
                                            <p className="font-medium">{formatDate(post.created_at)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">Last Updated:</span>
                                            <p className="font-medium">{formatDate(post.updated_at)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">Rental Count:</span>
                                            <p className="font-medium">{post.rental_count || 0} rentals</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-sm">Status:</span>
                                            <p className="font-medium capitalize">{post.status || 'unknown'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Pricing and Actions */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* Pricing Card */}
                                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-xl sticky top-6">
                                    <h3 className="text-2xl font-bold mb-6">Pricing</h3>
                                    <div className="text-center mb-6">
                                        <div className="text-5xl font-bold mb-2">
                                            ${vehicle.price_per_day || 0}
                                        </div>
                                        <div className="text-indigo-200">per day</div>
                                    </div>

                                    <div className="space-y-4 bg-white bg-opacity-10 rounded-lg p-4 mb-6">
                                        <div className="flex justify-between items-center">
                                            <span className="text-indigo-100">Security Deposit</span>
                                            <span className="font-semibold">${vehicle.security_deposit || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-indigo-100">Insurance</span>
                                            <span className="font-semibold text-green-300">Included</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-indigo-100">Mileage Limit</span>
                                            <span className="font-semibold">
                                                {vehicle.mileage_limit || 'Unlimited'} km
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/manager/post/edit/${post.id}`}
                                        className="w-full flex items-center justify-center px-6 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold shadow-lg"
                                    >
                                        <FiEdit className="mr-2" />
                                        Edit Post
                                    </Link>
                                </div>

                                {/* Requirements Card */}
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <FiUser className="mr-2 text-indigo-600" />
                                        Requirements
                                    </h3>
                                    <ul className="space-y-4">
                                        <li className="flex items-start">
                                            <div className="bg-indigo-100 p-2 rounded-lg mr-3 mt-1">
                                                <FiUser className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-700">Minimum Driver Age</div>
                                                <div className="text-2xl font-bold text-indigo-600">
                                                    {post.min_driver_age || 21} years
                                                </div>
                                            </div>
                                        </li>
                                        <li className="flex items-start">
                                            <div className="bg-indigo-100 p-2 rounded-lg mr-3 mt-1">
                                                <FiCalendar className="text-indigo-600" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-700">Minimum License Years</div>
                                                <div className="text-2xl font-bold text-indigo-600">
                                                    {post.min_license_years || 1} years
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                {/* Delivery Options */}
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <FiMapPin className="mr-2 text-indigo-600" />
                                        Delivery Options
                                    </h3>
                                    <ul className="space-y-3">
                                        {(post.delivery_options || []).map((option, index) => (
                                            <li key={index} className="flex items-center bg-gray-50 p-3 rounded-lg">
                                                <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                                    <FiMapPin className="text-indigo-600" />
                                                </div>
                                                <span className="capitalize font-medium">{option}</span>
                                            </li>
                                        ))}
                                        {(!post.delivery_options || post.delivery_options.length === 0) && (
                                            <li className="text-gray-500 text-center py-2">No delivery options available</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostView;