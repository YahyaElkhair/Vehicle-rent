// src/components/RentalModal.jsx
import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaCar, FaRoute } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Map from './Map';
import PayPalPayment from './PayPalPayment';
import { AppContext } from '../Context/AppContext';

export default function RentalModal({
    vehicle,
    agency,
    deliveryOptions,
    onClose,
}) {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(null);
    const [deliveryOption, setDeliveryOption] = useState('agency pickup');
    const [userLocation, setUserLocation] = useState(null);
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [distance, setDistance] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [reservation, setReservation] = useState(null);
    const [isCreatingReservation, setIsCreatingReservation] = useState(false);
    const [calculatingDistance, setCalculatingDistance] = useState(false);

    const { token } = useContext(AppContext);

    // Use refs to avoid dependency loops
    const fallbackTimeoutRef = useRef(null);
    const hasCalculatedFallbackRef = useRef(false);

    // Parse agency coordinates - STABLE function
    const parseCoords = (coords) => {
        const defaultCoords = [-7.0926, 31.7917];

        if (!coords) return defaultCoords;

        if (typeof coords === 'string') {
            if (coords.trim().startsWith('{') || coords.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(coords);
                    return parseCoords(parsed);
                } catch (e) {
                    console.error('❌ Failed to parse JSON string:', e);
                }
            }

            const cleanCoords = coords.replace(/[[\]]/g, '').trim();
            const parts = cleanCoords.split(',').map(p => p.trim());

            if (parts.length === 2) {
                const first = parseFloat(parts[0]);
                const second = parseFloat(parts[1]);
                if (!isNaN(first) && !isNaN(second)) {
                    // Swap [lat, lng] to [lng, lat]
                    return [second, first];
                }
            }
            return defaultCoords;
        }

        if (Array.isArray(coords) && coords.length === 2) {
            const [first, second] = coords.map(c => parseFloat(c));
            if (isNaN(first) || isNaN(second)) return defaultCoords;

            // If first looks like lat (within -90 to 90), swap to [lng, lat]
            if (Math.abs(first) <= 90 && Math.abs(second) > 90) {
                return [second, first];
            }
            if (Math.abs(first) > 90) {
                return [first, second];
            }
            // Both in lat range, assume [lat, lng] and swap
            return [second, first];
        }

        if (typeof coords === 'object' && coords !== null) {
            const lat = coords.lat || coords.latitude;
            const lng = coords.lng || coords.lon || coords.longitude;
            if (lat !== undefined && lng !== undefined) {
                const latNum = parseFloat(lat);
                const lngNum = parseFloat(lng);
                if (!isNaN(latNum) && !isNaN(lngNum)) {
                    return [lngNum, latNum];
                }
            }
        }

        return defaultCoords;
    };

    // Parse agency coordinates once
    const agencyCoords = parseCoords(agency?.agency_coordinates);

    // Haversine distance calculation - STABLE function
    const calculateHaversineDistance = (coords1, coords2) => {
        if (!coords1 || !coords2 || coords1.length !== 2 || coords2.length !== 2) {
            return 0;
        }

        const [lng1, lat1] = coords1;
        const [lng2, lat2] = coords2;

        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Calculate rental days
    const rentalDays = startDate && endDate
        ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        : 0;

    // Calculate prices
    const basePrice = rentalDays > 0 ? rentalDays * (vehicle?.price_per_day || 0) : 0;
    const deliveryFee = deliveryOption === 'home delivery' && distance > 0
        ? distance * (vehicle?.delivery_fee_per_km || 0)
        : 0;

    // Update total price when dependencies change
    useEffect(() => {
        setTotalPrice(basePrice + deliveryFee);
    }, [basePrice, deliveryFee]);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
            }
        };
    }, []);

    // Get user location - NO dependencies that cause loops
    const getUserLocation = () => {
        setLoadingLocation(true);
        setLocationError('');
        setCalculatingDistance(true);
        hasCalculatedFallbackRef.current = false;

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            setLoadingLocation(false);
            setCalculatingDistance(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = [longitude, latitude];

                console.log('📍 User location:', newLocation);

                setUserLocation(newLocation);
                setDeliveryLocation(newLocation);
                setLoadingLocation(false);

                // Calculate Haversine distance
                const haversineDistance = calculateHaversineDistance(agencyCoords, newLocation);
                console.log('📏 Haversine distance:', haversineDistance.toFixed(2), 'km');

                // Clear any existing timeout
                if (fallbackTimeoutRef.current) {
                    clearTimeout(fallbackTimeoutRef.current);
                }

                // Set fallback timeout - only if not already calculated
                fallbackTimeoutRef.current = setTimeout(() => {
                    if (!hasCalculatedFallbackRef.current) {
                        console.log('⚠️ Using Haversine fallback distance');
                        setDistance(parseFloat(haversineDistance.toFixed(1)));
                        setCalculatingDistance(false);
                        hasCalculatedFallbackRef.current = true;
                    }
                }, 3000);
            },
            (error) => {
                console.error('❌ Geolocation error:', error);
                setLocationError('Unable to retrieve your location');
                setLoadingLocation(false);
                setCalculatingDistance(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    // Handle route calculation from Map - FIXED: Distance is already in KM
    const handleRouteCalculated = useCallback((routeInfo) => {
        console.log('🗺️ Route calculated:', routeInfo);

        if (routeInfo?.distance && deliveryOption === 'home delivery') {
            // Clear fallback timeout since we got a route
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
            }
            hasCalculatedFallbackRef.current = true;

            // FIXED: The distance from Map component is already in kilometers
            // Previously: const distanceInKm = routeInfo.distance / 1000;
            const distanceInKm = routeInfo.distance; // Already in KM!
            const roundedDistance = parseFloat(distanceInKm.toFixed(1));

            console.log('📏 Route distance (raw):', routeInfo.distance, 'km');
            console.log('📏 Route distance (rounded):', roundedDistance, 'km');

            if (roundedDistance > 0 && roundedDistance < 10000) {
                setDistance(roundedDistance);
                setCalculatingDistance(false);
                console.log('✅ Distance set to:', roundedDistance, 'km');
            } else {
                console.error('❌ Invalid distance:', roundedDistance, 'km');
                setCalculatingDistance(false);
            }
        }
    }, [deliveryOption]);

    // Handle delivery location change - STABLE function
    const handleDeliveryLocationChange = useCallback((newLocation) => {
        console.log('📍 Delivery location updated:', newLocation);
        setDeliveryLocation(newLocation);
        setCalculatingDistance(true);
        hasCalculatedFallbackRef.current = false;
    }, []);

    // Handle delivery option change
    const handleDeliveryOptionChange = (option) => {
        console.log('🚚 Delivery option:', option);
        setDeliveryOption(option);

        if (option === 'home delivery') {
            if (!userLocation) {
                getUserLocation();
            } else {
                // Already have location, just recalculate
                setCalculatingDistance(true);
                hasCalculatedFallbackRef.current = false;
            }
        } else {
            // Reset for agency pickup
            setDistance(0);
            setDeliveryLocation(null);
            setCalculatingDistance(false);
            if (fallbackTimeoutRef.current) {
                clearTimeout(fallbackTimeoutRef.current);
            }
        }
    };

    // Normalize delivery options
    const normalizedDeliveryOptions = Array.isArray(deliveryOptions)
        ? deliveryOptions.map(opt => opt.toLowerCase().trim())
        : [];

    const isHomeDeliveryAvailable = normalizedDeliveryOptions.some(opt =>
        opt.includes('delivery') || opt.includes('home')
    );

    // Custom date picker input
    const CustomDateInput = ({ value, onClick, placeholder, disabled }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full px-4 py-2.5 text-left border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white hover:border-blue-400'}
            `}
        >
            {value || <span className="text-gray-400">{placeholder}</span>}
        </button>
    );

    // Validation
    const canCreateReservation = () => {
        if (!startDate || !endDate) {
            return { valid: false, message: 'Please select rental dates' };
        }

        if (rentalDays <= 0) {
            return { valid: false, message: 'End date must be after start date' };
        }

        if (deliveryOption === 'home delivery' && !deliveryLocation) {
            return { valid: false, message: 'Please select a delivery location' };
        }

        if (deliveryOption === 'home delivery' && (distance === 0 || calculatingDistance)) {
            return { valid: false, message: 'Calculating delivery distance...' };
        }

        return { valid: true, message: '' };
    };

    // Create reservation
    const createReservation = async () => {
        const validation = canCreateReservation();

        if (!validation.valid) {
            alert(validation.message);
            return;
        }

        setIsCreatingReservation(true);

        try {
            const reservationData = {
                agency_id: agency?.id,
                vehicle_id: vehicle?.id,
                pickup_date: startDate.toISOString(),
                return_date: endDate.toISOString(),
                pickup_type: deliveryOption === 'agency pickup' ? 'self pickup' : 'delivery',
                delevry_coordinations: deliveryOption === 'home delivery' && deliveryLocation
                    ? JSON.stringify(deliveryLocation)
                    : null,
                daily_rate: vehicle?.price_per_day || 0,
                total_amount: basePrice,
                delivery_fee: deliveryFee,
                final_amount: totalPrice,
                discount_amount: 0,
                equipment_cost: 0
            };

            console.log('📤 Creating reservation:', reservationData);

            const response = await fetch('/api/reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reservationData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create reservation');
            }

            console.log('✅ Reservation created:', data);
            setReservation(data.data);

        } catch (err) {
            console.error('❌ Reservation failed:', err);
            alert(`Reservation failed: ${err.message}`);
        } finally {
            setIsCreatingReservation(false);
        }
    };

    // Handle payment success
    const handlePaymentSuccess = (paymentData) => {
        console.log('✅ Payment successful!', paymentData);
        alert('Payment completed successfully! Your reservation is confirmed.');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Rent {vehicle?.brand} {vehicle?.model}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label="Close modal"
                        >
                            <FaTimes className="text-xl" />
                        </button>
                    </div>
                    
                    {/* Rental Period */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <FaCalendarAlt className="mr-2 text-blue-500" />
                            Select Rental Period
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    minDate={new Date()}
                                    customInput={<CustomDateInput placeholder="Select start date" />}
                                    popperClassName="z-[100]"
                                    dateFormat="MMMM d, yyyy"
                                    wrapperClassName="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <DatePicker
                                    selected={endDate}
                                    onChange={(date) => setEndDate(date)}
                                    minDate={startDate || new Date()}
                                    customInput={<CustomDateInput
                                        placeholder="Select end date"
                                        disabled={!startDate}
                                    />}
                                    popperClassName="z-[100]"
                                    dateFormat="MMMM d, yyyy"
                                    wrapperClassName="w-full"
                                    disabled={!startDate}
                                />
                            </div>
                        </div>
                        {rentalDays > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm font-medium text-blue-800">
                                    📅 {rentalDays} day{rentalDays > 1 ? 's' : ''} rental period
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Delivery Options */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-blue-500" />
                            Pickup & Delivery Options
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Agency Pickup */}
                            <button
                                onClick={() => handleDeliveryOptionChange('agency pickup')}
                                className={`p-4 rounded-xl border-2 transition-all ${deliveryOption === 'agency pickup'
                                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`mr-3 w-12 h-12 rounded-full flex items-center justify-center ${deliveryOption === 'agency pickup' ? 'bg-blue-500' : 'bg-blue-100'
                                        }`}>
                                        <FaCar className={`text-xl ${deliveryOption === 'agency pickup' ? 'text-white' : 'text-blue-600'
                                            }`} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-semibold text-gray-900">Agency Pickup</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Pick up at {agency?.name || 'agency'}
                                        </p>
                                        <p className="text-xs text-green-600 font-medium mt-1">
                                            Free • No delivery fee
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Home Delivery */}
                            <button
                                onClick={() => handleDeliveryOptionChange('home delivery')}
                                disabled={!isHomeDeliveryAvailable}
                                className={`p-4 rounded-xl border-2 transition-all ${deliveryOption === 'home delivery'
                                    ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200'
                                    : 'border-gray-200 hover:border-green-300 hover:shadow-sm'
                                    } ${!isHomeDeliveryAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex items-center">
                                    <div className={`mr-3 w-12 h-12 rounded-full flex items-center justify-center ${deliveryOption === 'home delivery' ? 'bg-green-500' : 'bg-green-100'
                                        }`}>
                                        <FaRoute className={`text-xl ${deliveryOption === 'home delivery' ? 'text-white' : 'text-green-600'
                                            }`} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-semibold text-gray-900">Home Delivery</h4>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {isHomeDeliveryAvailable
                                                ? `$${vehicle?.delivery_fee_per_km || 0}/km delivery fee`
                                                : 'Not available for this vehicle'
                                            }
                                        </p>
                                        {isHomeDeliveryAvailable && distance > 0 && (
                                            <p className="text-xs text-blue-600 font-medium mt-1">
                                                {distance.toFixed(1)} km • ${(distance * (vehicle?.delivery_fee_per_km || 0)).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Map */}
                        <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
                            {loadingLocation && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                                        <p className="text-gray-700 font-medium">Getting your location...</p>
                                    </div>
                                </div>
                            )}

                            {locationError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20 p-4">
                                    <div className="text-center max-w-sm">
                                        <div className="text-red-500 text-4xl mb-3">⚠️</div>
                                        <p className="text-red-600 mb-4 font-medium">{locationError}</p>
                                        <button
                                            onClick={getUserLocation}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            )}

                            <Map
                                agencyCoords={agencyCoords}
                                deliveryOption={deliveryOption}
                                userLocation={userLocation}
                                deliveryLocation={deliveryLocation}
                                onDeliveryLocationChange={handleDeliveryLocationChange}
                                onRouteCalculated={handleRouteCalculated}
                                vehicle={vehicle}
                                agency={agency}
                                className="w-full h-96"
                            />
                        </div>

                        {deliveryOption === 'home delivery' && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center text-sm">
                                        <FaRoute className="mr-2 text-green-600 text-lg" />
                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                {calculatingDistance ? (
                                                    <span className="animate-pulse">Calculating distance...</span>
                                                ) : distance > 0 ? (
                                                    `Distance: ${distance.toFixed(1)} km`
                                                ) : (
                                                    'Click "Use My Location"'
                                                )}
                                            </p>
                                            {distance > 0 && !calculatingDistance && (
                                                <p className="text-gray-600">
                                                    Fee: ${(distance * (vehicle?.delivery_fee_per_km || 0)).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={getUserLocation}
                                        disabled={loadingLocation}
                                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-md ${loadingLocation ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        📍 Use My Location
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Price Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Price Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-700">
                                    Base Price ({rentalDays} day{rentalDays !== 1 ? 's' : ''} × ${vehicle?.price_per_day || 0}/day)
                                </span>
                                <span className="font-semibold text-gray-900">
                                    ${basePrice.toFixed(2)}
                                </span>
                            </div>

                            {deliveryOption === 'home delivery' && (
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-700">
                                        {distance > 0 && !calculatingDistance
                                            ? `Delivery Fee (${distance.toFixed(1)} km × $${vehicle?.delivery_fee_per_km || 0}/km)`
                                            : 'Delivery Fee'
                                        }
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        ${deliveryFee.toFixed(2)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center pt-3 border-t-2 border-blue-300">
                                <span className="text-lg font-bold text-gray-900">Total Amount</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    ${totalPrice.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Section */}
                    {reservation ? (
                        <div className="mt-8">
                            <h3 className="text-xl font-bold mb-4 text-gray-800">Complete Payment</h3>
                            <div className="bg-blue-50 rounded-xl p-5 mb-6 border border-blue-200">
                                <h4 className="font-semibold mb-3 text-gray-800">Reservation Details</h4>
                                <div className="space-y-2 text-sm">
                                    <p className="flex justify-between">
                                        <span className="text-gray-600">Reservation #:</span>
                                        <span className="font-semibold text-gray-900">
                                            {reservation.reservation_number}
                                        </span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-gray-600">Total Amount:</span>
                                        <span className="font-bold text-blue-600 text-lg">
                                            ${totalPrice.toFixed(2)}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <PayPalPayment
                                totalPayment={totalPrice.toFixed(2)}
                                reservation={reservation}
                                onPaymentSuccess={handlePaymentSuccess}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createReservation}
                                disabled={isCreatingReservation || !canCreateReservation().valid}
                                className={`px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold shadow-lg transition-all
                                    ${isCreatingReservation || !canCreateReservation().valid
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:shadow-xl hover:scale-105'
                                    }`}
                            >
                                {isCreatingReservation ? (
                                    <span className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                                        Creating...
                                    </span>
                                ) : (
                                    'Continue to Payment'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}