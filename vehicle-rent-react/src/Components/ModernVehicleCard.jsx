import { useState, useRef, useEffect } from 'react';
import {
    FaStar, FaMapMarkerAlt, FaGasPump, FaChevronLeft,
    FaChevronRight, FaHeart
} from 'react-icons/fa';
import { GiGearStickPattern } from 'react-icons/gi';
import { BsPeopleFill } from 'react-icons/bs';
import { Link } from 'react-router-dom';

function ModernVehicleCard({ post }) {
    const vehicle = post?.vehicle || {};
    const agency = post?.agency || {};
    const images = vehicle?.images || [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(true);
    const [isInView, setIsInView] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const cardRef = useRef(null);

    // Extract values
    const brand = vehicle.brand || 'Unknown';
    const model = vehicle.model || 'Model';
    const year = vehicle.year || 'N/A';
    const pricePerDay = vehicle.price_per_day || 0;
    const rating = parseFloat(post.average_rating) || 0;
    const reviewCount = post.total_reviews || 0;
    const transmission = vehicle.transmission_type || 'Auto';
    const fuelType = vehicle.fuel_type || 'Gasoline';
    const seats = vehicle.seats || 5;
    const agencyName = agency.name || 'Agency';
    const postTitle = post.title || `${brand} ${model} ${year}`;

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { rootMargin: '100px', threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, []);

    const prevImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        setIsImageLoading(true);
    };

    const nextImage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        setIsImageLoading(true);
    };

    const toggleFavorite = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFavorite(!isFavorite);
    };

    const currentImage = images[currentIndex];

    return (
        <div ref={cardRef} className="w-full">
            <Link to={`/posts/${post.id}`} className="group block">
                <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100">
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        {/* Loading State */}
                        {(!isInView || isImageLoading) && !imageError && (
                            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}

                        {/* Image */}
                        {isInView && images.length > 0 && !imageError ? (
                            <img
                                src={currentImage}
                                alt={postTitle}
                                loading="lazy"
                                className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isImageLoading ? 'opacity-0' : 'opacity-100'
                                    }`}
                                onLoad={() => setIsImageLoading(false)}
                                onError={() => {
                                    setImageError(true);
                                    setIsImageLoading(false);
                                }}
                            />
                        ) : isInView && (imageError || images.length === 0) ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <div className="text-center">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm text-gray-400 font-medium">No image</p>
                                </div>
                            </div>
                        ) : null}

                        {/* Navigation Arrows */}
                        {images.length > 1 && isInView && !imageError && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    aria-label="Previous"
                                >
                                    <FaChevronLeft className="text-gray-700 text-sm" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    aria-label="Next"
                                >
                                    <FaChevronRight className="text-gray-700 text-sm" />
                                </button>
                            </>
                        )}

                        {/* Dots Indicator */}
                        {images.length > 1 && isInView && !imageError && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                                {images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1 rounded-full transition-all ${idx === currentIndex
                                                ? 'w-4 bg-white'
                                                : 'w-1 bg-white/60'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Favorite Button */}
                        <button
                            onClick={toggleFavorite}
                            className="absolute top-3 right-3 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all"
                            aria-label="Add to favorites"
                        >
                            <FaHeart className={`text-sm ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        {/* Location & Rating */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center text-sm text-gray-600 min-w-0 flex-1">
                                <FaMapMarkerAlt className="flex-shrink-0 mr-1 text-gray-400" />
                                <span className="truncate font-medium">{agencyName}</span>
                            </div>
                            {reviewCount > 0 && (
                                <div className="flex items-center ml-2 flex-shrink-0">
                                    <FaStar className="text-yellow-400 text-sm mr-1" />
                                    <span className="text-sm font-semibold text-gray-900">
                                        {rating}
                                    </span>
                                    <span className="text-sm text-gray-500 ml-1">
                                        ({reviewCount})
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Post Title */}
                        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
                            {postTitle}
                        </h3>

                        {/* Brand, Model & Year */}
                        <p className="text-xs text-gray-500 mb-3">
                            {brand} {model} • {year}
                        </p>

                        {/* Specs */}
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-3 pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-1">
                                <GiGearStickPattern className="text-gray-400" />
                                <span>{transmission}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <FaGasPump className="text-gray-400" />
                                <span>{fuelType}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <BsPeopleFill className="text-gray-400" />
                                <span>{seats}</span>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-xl font-bold text-gray-900">
                                    ${pricePerDay}
                                </span>
                                <span className="text-sm text-gray-500 ml-1">
                                    /day
                                </span>
                            </div>
                            <div className="text-sm font-semibold text-indigo-600 underline">
                                View details
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}

export default ModernVehicleCard;