// src/components/PostView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiStar, FiTruck, FiCalendar, FiUser, FiMapPin, FiEdit } from 'react-icons/fi';
import { FaGasPump, FaCarSide, FaSnowflake } from 'react-icons/fa';
import { GiGearStickPattern, GiCarDoor } from 'react-icons/gi';
import { IoMdSpeedometer } from 'react-icons/io';
import { TbAirConditioning } from 'react-icons/tb';

const PostView = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
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
                if (data) {
                    // Process images to full URLs
                    const processedPost = {
                        ...data,
                        vehicle: {
                            ...data.vehicle,
                            images: data.vehicle.images.map(img =>
                                img.startsWith('http') ? img : `${window.location.origin}/storage/${img}`
                            )
                        }
                    };
                    setPost(processedPost);
                } else {
                    throw new Error('Post not found');
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching post:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPost();
    }, [id]);

    const renderStars = (rating) => {
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <FiStar
                        key={i}
                        className={`${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-1 text-gray-600">{rating} ({post.total_reviews} reviews)</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 rounded-xl p-6 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Post</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        to="/manager/posts"
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <FiArrowLeft className="mr-2" />
                        Back to Posts
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6">
                <Link to="/manager/posts" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
                    <FiArrowLeft className="mr-2" />
                    Back to Posts
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Image Gallery */}
                <div className="relative">
                    {post.vehicle.images.length > 0 ? (
                        <>
                            <img
                                src={post.vehicle.images[imageIndex]}
                                alt={post.vehicle.model}
                                className="w-full h-96 object-cover"
                            />
                            {post.vehicle.images.length > 1 && (
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                                    {post.vehicle.images.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setImageIndex(index)}
                                            className={`w-3 h-3 rounded-full ${index === imageIndex ? 'bg-indigo-600' : 'bg-white'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
                            <FiTruck className="text-gray-400 text-5xl" />
                        </div>
                    )}
                </div>

                <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{post.title}</h1>
                            <div className="flex items-center mt-2">
                                {renderStars(post.average_rating)}
                            </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${post.status === 'published'
                                ? 'bg-green-100 text-green-800'
                                : post.status === 'draft'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'}`}
                            >
                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Left Column - Vehicle Info */}
                        <div className="md:col-span-2">
                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Vehicle Details</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                                        <FiTruck className="text-indigo-600 text-xl mr-3" />
                                        <div>
                                            <div className="text-gray-500 text-sm">Brand</div>
                                            <div className="font-medium">{post.vehicle.brand}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                                        <FaCarSide className="text-indigo-600 text-xl mr-3" />
                                        <div>
                                            <div className="text-gray-500 text-sm">Model</div>
                                            <div className="font-medium">{post.vehicle.model}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                                        <FiCalendar className="text-indigo-600 text-xl mr-3" />
                                        <div>
                                            <div className="text-gray-500 text-sm">Year</div>
                                            <div className="font-medium">{post.vehicle.year}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                                        <GiGearStickPattern className="text-indigo-600 text-xl mr-3" />
                                        <div>
                                            <div className="text-gray-500 text-sm">Transmission</div>
                                            <div className="font-medium">{post.vehicle.transmission_type}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                                        <FaGasPump className="text-indigo-600 text-xl mr-3" />
                                        <div>
                                            <div className="text-gray-500 text-sm">Fuel Type</div>
                                            <div className="font-medium">{post.vehicle.fuel_type}</div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                                        <IoMdSpeedometer className="text-indigo-600 text-xl mr-3" />
                                        <div>
                                            <div className="text-gray-500 text-sm">Mileage</div>
                                            <div className="font-medium">{post.vehicle.mileage} km</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Features</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {post.vehicle.features?.map((feature, index) => (
                                        <div key={index} className="flex items-center bg-gray-50 p-3 rounded-lg">
                                            {feature === 'Air Conditioning' && <TbAirConditioning className="text-indigo-600 mr-2" />}
                                            {feature === 'Automatic' && <GiGearStickPattern className="text-indigo-600 mr-2" />}
                                            {feature === '4x4' && <FaCarSide className="text-indigo-600 mr-2" />}
                                            {feature === 'Heated Seats' && <FaSnowflake className="text-indigo-600 mr-2" />}
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Description</h2>
                                <p className="text-gray-600 whitespace-pre-line">{post.description}</p>
                            </div>
                        </div>

                        {/* Right Column - Pricing and Actions */}
                        <div className="md:col-span-1">
                            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 mb-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">Pricing</h3>
                                    <div className="text-2xl font-bold text-indigo-700">${post.vehicle.price_per_day}<span className="text-lg font-normal">/day</span></div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Security deposit</span>
                                        <span className="font-medium">${post.vehicle.security_deposit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Insurance included</span>
                                        <span className="font-medium text-green-600">Yes</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Mileage limit</span>
                                        <span className="font-medium">{post.vehicle.mileage_limit || 'Unlimited'} km</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Requirements</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center">
                                        <FiUser className="text-indigo-600 mr-3" />
                                        <span>Minimum driver age: <span className="font-medium">{post.min_driver_age} years</span></span>
                                    </li>
                                    <li className="flex items-center">
                                        <FiCalendar className="text-indigo-600 mr-3" />
                                        <span>Minimum license years: <span className="font-medium">{post.min_license_years} years</span></span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Delivery Options</h3>
                                <ul className="space-y-3">
                                    {post.delivery_options.map((option, index) => (
                                        <li key={index} className="flex items-center">
                                            <FiMapPin className="text-indigo-600 mr-3" />
                                            <span className="capitalize">{option}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-6">
                                <Link
                                    to={`/manager/posts/edit/${post.id}`}
                                    className="w-full flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <FiEdit className="mr-2" />
                                    Edit Post
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostView;