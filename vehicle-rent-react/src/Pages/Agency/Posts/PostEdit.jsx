// src/components/PostEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    FiArrowLeft, FiSave, FiTrash2, FiAlertCircle,
    FiTruck, FiCalendar, FiUser, FiCheckCircle,
    FiPackage, FiTag, FiFileText
} from 'react-icons/fi';

const PostEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'published',
        delivery_options: [],
        min_driver_age: 21,
        min_license_years: 1,
        vehicle_id: '',
        meta_title: '',
        meta_description: ''
    });
    const [vehicles, setVehicles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');

            // Fetch post data
            const postResponse = await fetch(`/api/posts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!postResponse.ok) {
                throw new Error('Failed to fetch post details');
            }

            const postData = await postResponse.json();

            if (!postData.success) {
                throw new Error(postData.message || 'Failed to fetch post');
            }

            setPost(postData.data);

            // Set form data
            setFormData({
                title: postData.data.title,
                description: postData.data.description,
                status: postData.data.status,
                delivery_options: postData.data.delivery_options || [],
                min_driver_age: postData.data.min_driver_age,
                min_license_years: postData.data.min_license_years,
                vehicle_id: postData.data.vehicle_id,
                meta_title: postData.data.meta_title || '',
                meta_description: postData.data.meta_description || ''
            });

            // Fetch agency vehicles
            const vehiclesResponse = await fetch('/api/agency/vehicles', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!vehiclesResponse.ok) {
                throw new Error('Failed to fetch vehicles');
            }

            const vehiclesData = await vehiclesResponse.json();
            if (vehiclesData.success) {
                setVehicles(vehiclesData.data);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
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
            } else {
                setFormData({ ...formData, [name]: checked });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setValidationErrors({});
        setSuccessMessage('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage('Post updated successfully!');
                setTimeout(() => {
                    navigate(`/manager/post/${id}`);
                }, 1500);
            } else {
                if (data.errors) {
                    setValidationErrors(data.errors);
                    setError('Please fix the validation errors');
                } else {
                    throw new Error(data.message || 'Failed to update post');
                }
            }
        } catch (err) {
            setError(err.message);
            console.error('Error updating post:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                navigate('/manager/posts');
            } else {
                throw new Error(data.message || 'Failed to delete post');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error deleting post:', err);
            alert(`Error: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading post data...</p>
            </div>
        );
    }

    if (error && !post) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-red-50 rounded-2xl p-8 text-center border border-red-100">
                    <FiAlertCircle className="text-red-500 text-5xl mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Post</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex justify-center space-x-3">
                        <Link
                            to="/manager/posts"
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                            <FiArrowLeft className="mr-2" />
                            Back to Posts
                        </Link>
                        <button
                            onClick={fetchData}
                            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        to={`/manager/post/${id}`}
                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                        <FiArrowLeft className="mr-2" />
                        Back to Post
                    </Link>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center animate-fadeIn">
                        <FiCheckCircle className="text-green-600 text-2xl mr-3" />
                        <span className="text-green-800 font-medium">{successMessage}</span>
                    </div>
                )}

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start animate-fadeIn">
                        <FiAlertCircle className="text-red-600 text-2xl mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-800 font-medium">{error}</p>
                            {Object.keys(validationErrors).length > 0 && (
                                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                                    {Object.entries(validationErrors).map(([field, errors]) => (
                                        <li key={field}>{Array.isArray(errors) ? errors[0] : errors}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 border-b border-gray-200">
                        <div className="flex items-center">
                            <div className="bg-white bg-opacity-20 p-3 rounded-lg mr-4">
                                <FiFileText className="text-white text-2xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Edit Post</h1>
                                <p className="text-indigo-100">Update your vehicle listing details</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 md:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Title */}
                                <div>
                                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                        <FiTag className="mr-2 text-indigo-600" />
                                        Post Title *
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 border ${validationErrors.title ? 'border-red-300' : 'border-gray-300'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                                        placeholder="e.g., Luxury BMW X5 2023 - Premium SUV"
                                        required
                                    />
                                    {validationErrors.title && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.title[0]}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                        <FiFileText className="mr-2 text-indigo-600" />
                                        Description *
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="6"
                                        className={`w-full px-4 py-3 border ${validationErrors.description ? 'border-red-300' : 'border-gray-300'
                                            } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none`}
                                        placeholder="Describe the vehicle, features, and rental conditions..."
                                        required
                                    />
                                    {validationErrors.description && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.description[0]}</p>
                                    )}
                                </div>

                                {/* Status & Vehicle */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Status *
                                        </label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                                            <FiTruck className="mr-2 text-indigo-600" />
                                            Vehicle *
                                        </label>
                                        <select
                                            name="vehicle_id"
                                            value={formData.vehicle_id}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 border ${validationErrors.vehicle_id ? 'border-red-300' : 'border-gray-300'
                                                } rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                                            required
                                        >
                                            <option value="">Select Vehicle</option>
                                            {vehicles.map(vehicle => (
                                                <option key={vehicle.id} value={vehicle.id}>
                                                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                                                </option>
                                            ))}
                                        </select>
                                        {validationErrors.vehicle_id && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.vehicle_id[0]}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Delivery Options */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                                        <FiPackage className="mr-2 text-indigo-600" />
                                        Delivery Options *
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                name="delivery_options"
                                                value="agency pickup"
                                                checked={formData.delivery_options.includes('agency pickup')}
                                                onChange={handleChange}
                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-3 text-gray-700 font-medium">Agency Pickup</span>
                                        </label>
                                        <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-indigo-50 transition-colors">
                                            <input
                                                type="checkbox"
                                                name="delivery_options"
                                                value="delivery"
                                                checked={formData.delivery_options.includes('delivery')}
                                                onChange={handleChange}
                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-3 text-gray-700 font-medium">Delivery to Location</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Requirements */}
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                    <h3 className="flex items-center text-sm font-semibold text-gray-700 mb-4">
                                        <FiUser className="mr-2 text-indigo-600" />
                                        Driver Requirements
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Min Age *
                                            </label>
                                            <input
                                                type="number"
                                                name="min_driver_age"
                                                value={formData.min_driver_age}
                                                onChange={handleChange}
                                                min="18"
                                                max="99"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Min License Years *
                                            </label>
                                            <input
                                                type="number"
                                                name="min_license_years"
                                                value={formData.min_license_years}
                                                onChange={handleChange}
                                                min="1"
                                                max="50"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* SEO Section */}
                                <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4">SEO Optimization</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Meta Title
                                            </label>
                                            <input
                                                type="text"
                                                name="meta_title"
                                                value={formData.meta_title}
                                                onChange={handleChange}
                                                maxLength="60"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                                                placeholder="SEO title (max 60 chars)"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                {formData.meta_title.length}/60 characters
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Meta Description
                                            </label>
                                            <textarea
                                                name="meta_description"
                                                value={formData.meta_description}
                                                onChange={handleChange}
                                                maxLength="160"
                                                rows="3"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
                                                placeholder="SEO description (max 160 chars)"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                {formData.meta_description.length}/160 characters
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving Changes...
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex items-center px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                            >
                                <FiTrash2 className="mr-2" />
                                Delete Post
                            </button>

                            <Link
                                to={`/manager/posts/${id}`}
                                className="flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                        <FiAlertCircle className="text-blue-600 text-xl mr-3 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Important Notes:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Changes will be visible immediately after saving</li>
                                <li>Changing the status to "Draft" will hide the post from public view</li>
                                <li>You cannot delete posts with active reservations</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostEdit;