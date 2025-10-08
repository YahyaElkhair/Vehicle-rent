// src/components/RentalModal.jsx
import { useState, useEffect, useCallback, useContext } from 'react';
import { FaTimes, FaCalendarAlt, FaMapMarkerAlt, FaCar, FaRoute } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Map from './Map';
import PayPalPayment from './PayPalPayment';
import { AppContext } from '../context/AppContext';

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

    const { token } = useContext(AppContext);


    // Parse agency coordinates
    const parseCoords = (coords) => {
        if (!coords) return [-7.0926, 31.7917]; // Default to Marrakech [lng, lat]

        if (Array.isArray(coords)) {
            return coords.length === 2 ? coords : [coords[0], coords[1]];
        }

        if (typeof coords === 'string') {
            const parts = coords.split(',');
            if (parts.length === 2) {
                const lat = parseFloat(parts[0]);
                const lng = parseFloat(parts[1]);
                return isNaN(lat) || isNaN(lng) ? [-7.0926, 31.7917] : [lng, lat];
            }
        }

        return [-7.0926, 31.7917]; // [lng, lat]
    };

    const agencyCoords = parseCoords(agency.agency_coordinates);

    // Calculate rental days
    const rentalDays = startDate && endDate
        ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
        : 0;

    // Base price calculation
    const basePrice = rentalDays * vehicle.price_per_day;

    // Delivery fee calculation
    const deliveryFee = deliveryOption === 'home delivery'
        ? distance * vehicle.delivery_fee_per_km
        : 0;

    // Total price
    useEffect(() => {
        setTotalPrice(basePrice + deliveryFee);
    }, [basePrice, deliveryFee]);

    // Get user location
    const getUserLocation = useCallback(() => {
        setLoadingLocation(true);
        setLocationError('');

        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            setLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newLocation = [longitude, latitude];
                setUserLocation(newLocation);
                setDeliveryLocation(newLocation);
                setLoadingLocation(false);
            },
            (error) => {
                setLocationError('Unable to retrieve your location. Please enable location services.');
                setLoadingLocation(false);
                console.error('Geolocation error:', error);
            }
        );
    }, []);

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = useCallback((point1, point2) => {
        const [lng1, lat1] = point1;
        const [lng2, lat2] = point2;

        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) *
            Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        setDistance(parseFloat(distance.toFixed(1)));
    }, []);

    // Handle delivery location change
    const handleDeliveryLocationChange = useCallback((newLocation) => {
        setDeliveryLocation(newLocation);
        if (deliveryOption === 'home delivery' && agencyCoords) {
            calculateDistance(agencyCoords, newLocation);
        }
    }, [deliveryOption, agencyCoords, calculateDistance]);

    // Handle route calculation
    const handleRouteCalculated = useCallback((routeInfo) => {
        if (deliveryOption === 'home delivery') {
            setDistance(routeInfo.distance);
        }
    }, [deliveryOption]);

    // Handle delivery option change
    const handleDeliveryOptionChange = useCallback((option) => {
        setDeliveryOption(option);
        if (option === 'home delivery' && !userLocation) {
            getUserLocation();
        }
    }, [getUserLocation, userLocation]);


    // Check if home delivery is available
    const isHomeDeliveryAvailable = deliveryOptions.includes('home delivery');

    // Custom date picker input component with Tailwind styling
    const CustomDateInput = ({ value, onClick, placeholder, disabled }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                w-full px-4 py-2.5 text-left border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all
                ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : 'bg-white'}
            `}
        >
            {value || placeholder}
        </button>
    );



    // Function to create reservation
    const createReservation = async () => {
        setIsCreatingReservation(true);

        try {
            const reservationData = {
                agency_id: agency.id,
                vehicle_id: vehicle.id,
                pickup_date: startDate.toISOString(),
                return_date: endDate.toISOString(),
                pickup_type: deliveryOption === 'agency pickup' ? 'self pickup' : 'delivery',
                delevry_coordinations: deliveryOption === 'home delivery'
                    ? JSON.stringify(deliveryLocation)
                    : null,
                daily_rate: vehicle.price_per_day,
                total_amount: basePrice,
                delivery_fee: deliveryFee,
                final_amount: totalPrice,
                discount_amount: 0,
                equipment_cost: 0
            };

            const response = await fetch('/api/reservation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reservationData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create reservation');
            }

            const data = await response.json();
            setReservation(data.data);

        } catch (err) {
            console.error('Reservation creation failed:', err);
            alert(`Reservation failed: ${err.message}`);
        } finally {
            setIsCreatingReservation(false);
        }
    };

    // Handle payment success
    const handlePaymentSuccess = (data) => {
        console.log('Payment successful!', data);
        onClose();
        // Show success message or redirect
    };







    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Rent {vehicle.brand} {vehicle.model}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Start Date
                                </label>
                                <DatePicker
                                    selected={startDate}
                                    onChange={(date) => setStartDate(date)}
                                    minDate={new Date()}
                                    value={startDate}
                                    customInput={<CustomDateInput placeholder="Select start date" />}
                                    popperClassName="z-[100]"
                                    dateFormat="MMMM d, yyyy"
                                    wrapperClassName="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                            <div className="mt-3 text-sm text-gray-600">
                                {rentalDays} day{rentalDays > 1 ? 's' : ''} rental
                            </div>
                        )}
                    </div>

                    {/* Delivery Options */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <FaMapMarkerAlt className="mr-2 text-blue-500" />
                            Delivery Options
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <button
                                onClick={() => handleDeliveryOptionChange('agency pickup')}
                                className={`p-4 rounded-xl border-2 transition-all ${deliveryOption === 'agency pickup'
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className="mr-3 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <FaCar className="text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-semibold">Agency Pickup</h4>
                                        <p className="text-sm text-gray-600">Pick up at {agency.name}</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleDeliveryOptionChange('home delivery')}
                                className={`p-4 rounded-xl border-2 transition-all ${deliveryOption === 'home delivery'
                                    ? 'border-blue-500 bg-blue-50 shadow-md'
                                    : 'border-gray-200 hover:border-gray-300'
                                    } ${!isHomeDeliveryAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={!isHomeDeliveryAvailable}
                            >
                                <div className="flex items-center">
                                    <div className="mr-3 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <FaRoute className="text-green-600" />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-semibold">Home Delivery</h4>
                                        <p className="text-sm text-gray-600">
                                            ${vehicle.delivery_fee_per_km}/km
                                            {!isHomeDeliveryAvailable &&
                                                ' (Not available for this vehicle)'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Map Section */}
                        <div className="relative">
                            {loadingLocation && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 rounded-xl">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                                    <span className="ml-3">Getting your location...</span>
                                </div>
                            )}

                            {locationError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 p-4 rounded-xl">
                                    <div className="text-center">
                                        <p className="text-red-500 mb-3">{locationError}</p>
                                        <button
                                            onClick={getUserLocation}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
                                className="w-full h-80"
                            />
                        </div>

                        {deliveryOption === 'home delivery' && deliveryLocation && (
                            <div className="mt-4 flex items-center text-sm text-gray-700">
                                <FaRoute className="mr-2 text-green-500" />
                                <span>
                                    Delivery distance: {distance.toFixed(1)} km •
                                    Fee: ${(distance * vehicle.delivery_fee_per_km).toFixed(2)}
                                </span>
                                <button
                                    onClick={getUserLocation}
                                    className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Use Current Location
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Price Summary */}
                    <div className="bg-blue-50 rounded-xl p-5 mb-6">
                        <h3 className="text-lg font-semibold mb-3">Price Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Base Price ({rentalDays} days × ${vehicle.price_per_day}/day):</span>
                                <span>${basePrice.toFixed(2)}</span>
                            </div>

                            {deliveryOption === 'home delivery' && (
                                <div className="flex justify-between">
                                    <span>Delivery Fee ({distance.toFixed(1)} km × ${vehicle.delivery_fee_per_km}/km):</span>
                                    <span>${deliveryFee.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between pt-2 border-t border-blue-100 font-bold text-lg">
                                <span>Total:</span>
                                <span>${totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Section */}
                    {reservation ? (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Complete Payment</h3>
                            <div className="bg-blue-50 rounded-xl p-5 mb-4">
                                <h4 className="font-semibold mb-2">Reservation Details</h4>
                                <p>Reservation #: {reservation.reservation_number}</p>
                                <p>Total Amount: ${totalPrice.toFixed(2)}</p>
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
                                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={createReservation}
                                disabled={isCreatingReservation}
                                className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl hover:opacity-90 font-bold shadow-lg transition-opacity
                                    ${isCreatingReservation ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isCreatingReservation ? 'Creating Reservation...' : 'Continue to Payment'}
                            </button>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
}