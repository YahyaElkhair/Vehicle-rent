import { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../../Context/AppContext';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const AgencyManagerProfile = () => {
    const { token, user, setUser } = useContext(AppContext); // Added setUser

    const [managerData, setManagerData] = useState({
        id: '',
        name: '',
        email: ''
    });

    const [agencyData, setAgencyData] = useState(null);
    const [password, setPassword] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('profile');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            const { id, name, email } = user;
            setManagerData({ id, name, email });

            // Parse agency coordinates if needed
            if (user.agency) {
                const agency = {
                    ...user.agency,
                    agency_coordinates: typeof user.agency.agency_coordinates === 'string'
                        ? JSON.parse(user.agency.agency_coordinates)
                        : user.agency.agency_coordinates
                };
                setAgencyData(agency);
            }
        }
    }, [user]);

    const MapBoxSelector = () => {
        const mapContainerRef = useRef(null);
        const mapRef = useRef(null);
        const markerRef = useRef(null);

        // Initialize map only once
        useEffect(() => {
            if (!mapContainerRef.current || !agencyData) return;

            const initialLng = agencyData.agency_coordinates?.long ?? -7.0926;
            const initialLat = agencyData.agency_coordinates?.lat ?? 31.7917;

            const mapInstance = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                center: [initialLng, initialLat],
                zoom: 13,
            });

            mapRef.current = mapInstance;
            mapInstance.addControl(new mapboxgl.NavigationControl());

            // Add initial marker
            markerRef.current = new mapboxgl.Marker({ draggable: true })
                .setLngLat([initialLng, initialLat])
                .addTo(mapInstance);

            // Handle drag end
            markerRef.current.on('dragend', () => {
                const { lng, lat } = markerRef.current.getLngLat();
                setAgencyData(prev => ({
                    ...prev,
                    agency_coordinates: { lat, long: lng }
                }));
            });

            // Handle map click to move marker
            mapInstance.on('click', (e) => {
                const { lng, lat } = e.lngLat;
                markerRef.current.setLngLat([lng, lat]);
                setAgencyData(prev => ({
                    ...prev,
                    agency_coordinates: { lat, long: lng }
                }));
            });

            return () => {
                if (mapRef.current) mapRef.current.remove();
                if (markerRef.current) markerRef.current.remove();
            };
        }, []);

        // Update marker position when agencyCoords change
        useEffect(() => {
            if (
                markerRef.current &&
                agencyData?.agency_coordinates?.lat &&
                agencyData?.agency_coordinates?.long
            ) {
                markerRef.current.setLngLat([
                    agencyData.agency_coordinates.long,
                    agencyData.agency_coordinates.lat
                ]);

                if (mapRef.current) {
                    mapRef.current.setCenter([
                        agencyData.agency_coordinates.long,
                        agencyData.agency_coordinates.lat
                    ]);
                }
            }
        }, [agencyData?.agency_coordinates?.lat, agencyData?.agency_coordinates?.long]);

        return (
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agency Location (Move marker to change)
                </label>
                <div
                    ref={mapContainerRef}
                    className="w-full h-72 rounded-xl border shadow-md"
                />
            </div>
        );
    };

    const handleUserChange = (e) => {
        const { name, value } = e.target;
        setManagerData(prev => ({ ...prev, [name]: value }));
    };

    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`/api/users/${managerData.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(managerData)
            });

            if (!response.ok) {
                throw new Error('Error updating profile');
            }

            const updatedUser = await response.json();
            setManagerData(updatedUser);
            setUser(prev => ({ ...prev, ...updatedUser })); // Update context user
            setSuccess('Profile updated successfully');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message || 'Error updating profile');
        }
    };

    const handleAgencyChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        setErrors(prev => ({ ...prev, [name]: "" }));

        if (name === "logo_path") {
            setAgencyData(prev => ({ ...prev, logo_path: files[0] }));
        }
        else if (type === "checkbox") {
            setAgencyData(prev => ({ ...prev, [name]: checked }));
        }
        else {
            setAgencyData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAgencySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const payload = new FormData();
            payload.append("name", agencyData.name);
            payload.append("registration_number", agencyData.registration_number);
            payload.append("email", agencyData.email);
            payload.append("phone", agencyData.phone);
            payload.append("description", agencyData.description || "");
            payload.append("is_active", agencyData.is_active ? "1" : "0");

            // Serialize coordinates
            payload.append("agency_coordinates", JSON.stringify(agencyData.agency_coordinates));
            payload.append("_method", "PUT");

            // Add logo if it's a file
            if (agencyData.logo_path instanceof File) {
                payload.append("logo_path", agencyData.logo_path);
            }

            const response = await fetch(`/api/agencies/${agencyData.id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: payload,
            });

            const result = await response.json();

            if (!response.ok) {
                setErrors(prev => ({
                    ...prev,
                    ...result.errors,
                    form: result.message || "Validation failed.",
                }));
                return;
            }

            // Update context with new agency data
            setUser(prevUser => ({
                ...prevUser,
                agency: {
                    ...prevUser.agency,
                    ...result,
                    logo_path: result.logo_path // Ensure logo path is updated
                }
            }));

            // Also update local agencyData state
            setAgencyData(prev => ({
                ...prev,
                ...result
            }));

            setSuccess('Agency updated successfully');
            setTimeout(() => setSuccess(''), 3000);

        } catch (error) {
            console.error("Submission error:", error);
            setError(error.message || "Submission error");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPassword(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        try {
            // Password validation
            if (password.new_password.length < 8) {
                throw new Error('Password must be at least 8 characters');
            }

            if (password.new_password !== password.new_password_confirmation) {
                throw new Error('Passwords do not match');
            }

            const response = await fetch(`/api/users/${managerData.id}/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(password)
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const errorMessages = Object.values(data.errors).flat().join(', ');
                    throw new Error(errorMessages);
                }
                throw new Error(data.message || 'Error updating password');
            }

            setSuccess('Password updated successfully');
            setPassword({
                current_password: '',
                new_password: '',
                new_password_confirmation: ''
            });
            setTimeout(() => setSuccess(''), 2000);
        } catch (err) {
            setError(err.message || 'Error updating password');
        }
    };

    if (!user || !agencyData) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 py-10 px-6 text-white">
                        <div className="flex flex-col md:flex-row items-center">
                            <div className="relative mb-6 md:mb-0 md:mr-8">
                                <div className="bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-2xl w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
                                    {user.agency?.logo_path ? (
                                        <img
                                            src={typeof user.agency.logo_path === 'string'
                                                ? user.agency.logo_path
                                                : URL.createObjectURL(user.agency.logo_path)}
                                            alt="Agency logo"
                                            className="w-full h-full object-cover rounded-2xl"
                                        />
                                    ) : (
                                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-20 h-20 md:w-28 md:h-28" />
                                    )}
                                </div>
                            </div>
                            <div className="text-center md:text-left">
                                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{managerData.name}</h1>
                                <div className="inline-flex items-center mt-2 px-3 py-1 bg-blue-500/20 rounded-full">
                                    <span className="text-blue-100 text-sm font-medium">Agency Manager</span>
                                </div>
                                <p className="mt-3 flex items-center justify-center md:justify-start">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                    </svg>
                                    {managerData.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 bg-gray-50">
                        <nav className="flex flex-wrap">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 px-6 text-center font-medium text-sm transition-colors duration-300 ${activeTab === 'profile'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm'
                                    : 'text-gray-600 hover:text-blue-500'
                                    }`}
                            >
                                <div className="flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    Personal Profile
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('agency')}
                                className={`py-4 px-6 text-center font-medium text-sm transition-colors duration-300 ${activeTab === 'agency'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm'
                                    : 'text-gray-600 hover:text-blue-500'
                                    }`}
                            >
                                <div className="flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                                    </svg>
                                    Agency Information
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`py-4 px-6 text-center font-medium text-sm transition-colors duration-300 ${activeTab === 'security'
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white shadow-sm'
                                    : 'text-gray-600 hover:text-blue-500'
                                    }`}
                            >
                                <div className="flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    Security
                                </div>
                            </button>
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="p-6 md:p-8">
                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </div>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
                                <div className="flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    {success}
                                </div>
                            </div>
                        )}

                        {/* Personal Profile Tab */}
                        {activeTab === 'profile' && (
                            <form onSubmit={handleUserSubmit} className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Personal Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={managerData.name}
                                            onChange={handleUserChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={managerData.email}
                                            onChange={handleUserChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-md"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Agency Information Tab */}
                        {activeTab === 'agency' && (
                            <form
                                onSubmit={handleAgencySubmit}
                                className="p-6 md:p-8 space-y-6"
                                encType="multipart/form-data"
                            >
                                {errors.form && (
                                    <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                                        {errors.form}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-700 mb-2 font-medium">
                                            Agency Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={agencyData.name}
                                            onChange={handleAgencyChange}
                                            className={`w-full px-4 py-3 rounded-lg border ${errors.name ? "border-red-500" : "border-gray-300"
                                                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                            placeholder="Acme Travel Agency"
                                        />
                                        {errors.name && (
                                            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 mb-2 font-medium">
                                            Registration Number *
                                        </label>
                                        <input
                                            type="text"
                                            name="registration_number"
                                            value={agencyData.registration_number}
                                            onChange={handleAgencyChange}
                                            className={`w-full px-4 py-3 rounded-lg border ${errors.registration_number ? "border-red-500" : "border-gray-300"
                                                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                            placeholder="123-456-789"
                                        />
                                        {errors.registration_number && (
                                            <p className="text-red-500 text-sm mt-1">{errors.registration_number}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-700 mb-2 font-medium">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={agencyData.email}
                                            onChange={handleAgencyChange}
                                            className={`w-full px-4 py-3 rounded-lg border ${errors.email ? "border-red-500" : "border-gray-300"
                                                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                            placeholder="contact@agency.com"
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-gray-700 mb-2 font-medium">
                                            Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={agencyData.phone}
                                            onChange={handleAgencyChange}
                                            className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? "border-red-500" : "border-gray-300"
                                                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                        {errors.phone && (
                                            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2 font-medium">
                                        Location Coordinates
                                    </label>
                                    <div className="md:col-span-2">
                                        <MapBoxSelector />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-700 mb-2 font-medium">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={agencyData.description}
                                        onChange={handleAgencyChange}
                                        rows="3"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Describe your agency services and specialties..."
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-gray-700 mb-2 font-medium">
                                            Agency Logo
                                        </label>
                                        <div className="flex items-center">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                                    </svg>
                                                    <p className="text-sm text-gray-500">
                                                        {agencyData.logo_path
                                                            ? (typeof agencyData.logo_path === 'string'
                                                                ? 'Current logo'
                                                                : agencyData.logo_path.name)
                                                            : "Click to upload logo"}
                                                    </p>
                                                </div>
                                                <input
                                                    type="file"
                                                    name="logo_path"
                                                    onChange={handleAgencyChange}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center">
                                        <div className="flex items-center">
                                            <div className="relative inline-block w-12 h-6 mr-3">
                                                <input
                                                    type="checkbox"
                                                    name="is_active"
                                                    checked={agencyData.is_active}
                                                    onChange={handleAgencyChange}
                                                    className="absolute w-12 h-6 transition-colors duration-300 rounded-full appearance-none cursor-pointer peer bg-gray-300 checked:bg-indigo-600"
                                                />
                                                <span className="absolute w-5 h-5 transition-transform duration-300 bg-white rounded-full left-1 top-0.5 peer-checked:translate-x-6"></span>
                                            </div>
                                            <label className="text-gray-700 font-medium">
                                                Active Agency
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Updating Agency...
                                            </div>
                                        ) : (
                                            "Update Agency"
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Password Settings</h2>

                                <div className="space-y-6 max-w-2xl">
                                    <div>
                                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            name="current_password"
                                            id="current-password"
                                            value={password.current_password}
                                            onChange={handlePasswordChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            placeholder="Enter your current password"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="new_password"
                                            id="new-password"
                                            value={password.new_password}
                                            onChange={handlePasswordChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            placeholder="Create a new password"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="new_password_confirmation"
                                            id="confirm-password"
                                            value={password.new_password_confirmation}
                                            onChange={handlePasswordChange}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                            placeholder="Confirm your new password"
                                        />
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-medium rounded-xl hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-md"
                                    >
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgencyManagerProfile;