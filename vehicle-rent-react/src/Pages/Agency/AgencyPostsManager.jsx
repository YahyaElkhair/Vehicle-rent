// src/components/AgencyPostsManager.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FiPlus, FiEdit, FiTrash2, FiEye, FiStar,
    FiTruck, FiFilter, FiChevronDown, FiChevronUp,
    FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';

const AgencyPostsManager = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedPost, setExpandedPost] = useState(null);
    const [filter, setFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [showFilters, setShowFilters] = useState(false);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/agency/posts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch posts');
            }

            const data = await response.json();
            if (data.success) {
                // Process vehicle images to full URLs
                const processedPosts = data.data.map(post => {
                    if (post.vehicle?.images) {
                        return {
                            ...post,
                            vehicle: {
                                ...post.vehicle,
                                images: post.vehicle.images.map(img =>
                                    img.startsWith('http') ? img : `${window.location.origin}/storage/${img}`
                                )
                            }
                        };
                    }
                    return post;
                });
                setPosts(processedPosts);
            } else {
                throw new Error(data.message || 'Failed to fetch posts');
            }
        } catch (err) {
            setError(err.message);
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleDelete = async (postId) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/posts/${postId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    setPosts(posts.filter(post => post.id !== postId));
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete post');
                }
            } catch (err) {
                setError(err.message);
                console.error('Error deleting post:', err);
            }
        }
    };

    const toggleExpand = (postId) => {
        if (expandedPost === postId) {
            setExpandedPost(null);
        } else {
            setExpandedPost(postId);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedPosts = [...posts].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const filteredPosts = filter === 'all'
        ? sortedPosts
        : sortedPosts.filter(post => post.status === filter);

    const renderStars = (rating) => {
        return (
            <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                    <FiStar
                        key={i}
                        className={`${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-1 text-gray-600">{rating}</span>
            </div>
        );
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
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
                    <FiAlertCircle className="text-red-500 text-4xl mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Posts</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={fetchPosts}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <FiRefreshCw className="mr-2" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                        <FiTruck className="mr-3 text-indigo-600" />
                        Vehicle Posts Management
                    </h1>
                    <p className="text-gray-600 mt-2">Manage all your agency's vehicle listings in one place</p>
                </div>

                <div className="mt-4 md:mt-0 flex space-x-3">
                    <button
                        onClick={fetchPosts}
                        className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        title="Refresh posts"
                    >
                        <FiRefreshCw />
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <FiFilter className="mr-2" />
                        Filters
                        {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="all">All Posts</option>
                                <option value="draft">Drafts</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                            <select
                                value={sortConfig.key}
                                onChange={(e) => handleSort(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="created_at">Creation Date</option>
                                <option value="view_count">Views</option>
                                <option value="rental_count">Rentals</option>
                                <option value="average_rating">Rating</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Sort Direction</label>
                            <select
                                value={sortConfig.direction}
                                onChange={(e) => setSortConfig({ ...sortConfig, direction: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-5 border border-blue-100">
                    <div className="text-xl md:text-3xl font-bold text-indigo-700">{posts.length}</div>
                    <div className="text-xs md:text-sm text-gray-600">Total Posts</div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 md:p-5 border border-green-100">
                    <div className="text-xl md:text-3xl font-bold text-green-700">
                        {posts.filter(p => p.status === 'published').length}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Published</div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-4 md:p-5 border border-yellow-100">
                    <div className="text-xl md:text-3xl font-bold text-amber-700">
                        {posts.filter(p => p.status === 'draft').length}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Drafts</div>
                </div>

                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 md:p-5 border border-gray-200">
                    <div className="text-xl md:text-3xl font-bold text-gray-700">
                        {posts.reduce((sum, post) => sum + post.view_count, 0)}
                    </div>
                    <div className="text-xs md:text-sm text-gray-600">Total Views</div>
                </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 gap-4 md:gap-6">
                {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <div
                            key={post.id}
                            className={`bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 border-l-4 ${post.status === 'published' ? 'border-green-500' :
                                post.status === 'draft' ? 'border-yellow-500' :
                                    'border-gray-400'
                                }`}
                        >
                            <div
                                className="p-4 md:p-5 cursor-pointer"
                                onClick={() => toggleExpand(post.id)}
                            >
                                <div className="flex flex-col md:flex-row md:items-center">
                                    <div className="flex-shrink-0 mb-3 md:mb-0 md:mr-4">
                                        {post.vehicle?.images?.length > 0 ? (
                                            <img
                                                src={post.vehicle.images[0]}
                                                alt={post.vehicle.brand}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                                                <FiTruck className="text-gray-400 text-xl" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center justify-between">
                                            <h3 className="text-lg md:text-xl font-bold text-gray-800">{post.title}</h3>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.status === 'published'
                                                ? 'bg-green-100 text-green-800'
                                                : post.status === 'draft'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                            </span>
                                        </div>

                                        <p className="text-gray-600 mt-1 line-clamp-1 text-sm md:text-base">{post.description}</p>

                                        <div className="flex flex-wrap items-center mt-3 gap-2 md:gap-4 text-xs md:text-sm">
                                            <div className="flex items-center text-gray-600">
                                                <span className="font-medium mr-1">Vehicle:</span>
                                                {post.vehicle.brand} {post.vehicle.model}
                                            </div>

                                            <div className="flex items-center text-gray-600">
                                                <span className="font-medium mr-1">Created:</span>
                                                {formatDate(post.created_at)}
                                            </div>

                                            <div className="flex items-center text-gray-600">
                                                <span className="font-medium mr-1">Views:</span>
                                                {post.view_count}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-3 md:mt-0 flex justify-end">
                                        {expandedPost === post.id ? (
                                            <FiChevronUp className="text-gray-500 text-xl" />
                                        ) : (
                                            <FiChevronDown className="text-gray-500 text-xl" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedPost === post.id && (
                                <div className="border-t border-gray-100 px-4 md:px-5 py-4 md:py-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-2">Details</h4>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex flex-col md:flex-row">
                                                    <span className="w-40 font-medium">Delivery Options:</span>
                                                    <span>{post.delivery_options.join(', ')}</span>
                                                </li>
                                                <li className="flex flex-col md:flex-row">
                                                    <span className="w-40 font-medium">Min Driver Age:</span>
                                                    <span>{post.min_driver_age} years</span>
                                                </li>
                                                <li className="flex flex-col md:flex-row">
                                                    <span className="w-40 font-medium">Min License Years:</span>
                                                    <span>{post.min_license_years} years</span>
                                                </li>
                                                <li className="flex flex-col md:flex-row">
                                                    <span className="w-40 font-medium">Daily Price:</span>
                                                    <span className="font-bold">${post.vehicle.price_per_day}/day</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div>
                                            <h4 className="font-medium text-gray-700 mb-2">Statistics</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-lg md:text-2xl font-bold text-indigo-700">{post.rental_count}</div>
                                                    <div className="text-gray-600 text-xs md:text-sm">Total Rentals</div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-lg md:text-2xl font-bold text-indigo-700">{post.total_reviews}</div>
                                                    <div className="text-gray-600 text-xs md:text-sm">Reviews</div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-center">
                                                        {renderStars(post.average_rating)}
                                                    </div>
                                                    <div className="text-gray-600 text-xs md:text-sm">Average Rating</div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-lg md:text-2xl font-bold text-indigo-700">{post.view_count}</div>
                                                    <div className="text-gray-600 text-xs md:text-sm">Views</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-2 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100">
                                        <Link
                                            to={`/manager/post/${post.id}`}
                                            className="flex items-center px-3 py-1 md:px-4 md:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                                        >
                                            <FiEye className="mr-1 md:mr-2" />
                                            View
                                        </Link>

                                        <Link
                                            to={`/manager/post/edit/${post.id}`}
                                            className="flex items-center px-3 py-1 md:px-4 md:py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                                        >
                                            <FiEdit className="mr-1 md:mr-2" />
                                            Edit
                                        </Link>

                                        <button
                                            onClick={() => handleDelete(post.id)}
                                            className="flex items-center px-3 py-1 md:px-4 md:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                                        >
                                            <FiTrash2 className="mr-1 md:mr-2" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 md:py-16 bg-white rounded-xl shadow">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                            <FiTruck className="text-gray-400 text-2xl" />
                        </div>
                        <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-1">No posts found</h3>
                        <p className="text-gray-500 mb-4 md:mb-6 text-sm md:text-base">
                            {filter === 'all'
                                ? "You haven't created any posts yet"
                                : `No ${filter} posts found`}
                        </p>
                        <Link
                            to="/manager/post/create"
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm md:text-base"
                        >
                            <FiPlus className="mr-2" />
                            Create First Post
                        </Link>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            <Link
                to="/manager/post/create"
                className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-110"
            >
                <FiPlus size={20} />
            </Link>
        </div>
    );
};

export default AgencyPostsManager;