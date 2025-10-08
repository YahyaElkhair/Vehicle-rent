import React, { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../Context/AppContext";
import Map, { Marker, NavigationControl } from "react-map-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const CreateAgency = () => {
  const navigate = useNavigate();
  const { token } = useContext(AppContext);
  const mapRef = useRef(null);
  const geocoderContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    registration_number: "",
    email: "",
    phone: "",
    agency_coordinates: { lat: 33.5731, lng: -7.5898 },
    description: "",
    logo_path: null,
    is_active: true,
  });

  const [viewState, setViewState] = useState({
    longitude: -7.5898,
    latitude: 33.5731,
    zoom: 12,
  });

  const [markerPlaced, setMarkerPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Initialize Geocoder
  useEffect(() => {
    if (!geocoderContainerRef.current || !mapRef.current) return;

    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl: mapRef.current.getMap(),
      marker: false,
      placeholder: "Search for a location...",
      proximity: {
        longitude: viewState.longitude,
        latitude: viewState.latitude,
      },
    });

    geocoderContainerRef.current.appendChild(
      geocoder.onAdd(mapRef.current.getMap())
    );

    geocoder.on("result", (e) => {
      const [lng, lat] = e.result.center;
      updateCoordinates(lat, lng);
      setViewState((prev) => ({
        ...prev,
        longitude: lng,
        latitude: lat,
        zoom: 14,
      }));
      setMarkerPlaced(true);
    });

    return () => {
      geocoder.onRemove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const updateCoordinates = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      agency_coordinates: {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
      },
    }));
    setErrors((prev) => ({ ...prev, coordinates: "" }));
  };

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    updateCoordinates(lat, lng);
    setMarkerPlaced(true);
  };

  const handleMarkerDragEnd = (event) => {
    const { lng, lat } = event.lngLat;
    updateCoordinates(lat, lng);
  };

  const validateImageFile = (file) => {
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        logo_path: "Please select a valid image file",
      }));
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        logo_path: "Image size must be less than 5MB",
      }));
      return false;
    }

    return true;
  };

  const processImageFile = (file) => {
    if (!validateImageFile(file)) return;

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setFormData((prev) => ({ ...prev, logo_path: file }));
    setErrors((prev) => ({ ...prev, logo_path: "" }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "logo_path" && files && files[0]) {
      processImageFile(files[0]);
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, logo_path: null }));
    setErrors((prev) => ({ ...prev, logo_path: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdateImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processImageFile(files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.registration_number.trim())
      newErrors.registration_number = "Registration number is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^\+?[\d\s-]{7,15}$/.test(formData.phone))
      newErrors.phone = "Invalid phone number";
    if (!markerPlaced)
      newErrors.coordinates = "Please select a location on the map";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("registration_number", formData.registration_number);
    payload.append("email", formData.email);
    payload.append("phone", formData.phone);
    payload.append("description", formData.description || "");
    payload.append("is_active", formData.is_active ? "1" : "0");
    payload.append(
      "agency_coordinates",
      JSON.stringify(formData.agency_coordinates)
    );

    if (formData.logo_path) {
      payload.append("logo_path", formData.logo_path);
    }

    try {
      const response = await fetch("/api/agencies", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors((prev) => ({
          ...prev,
          ...result.errors,
          form: result.message || "Validation failed",
        }));
        return;
      }

      navigate("/manager");
    } catch (error) {
      console.error("Submission error:", error);
      setErrors((prev) => ({ ...prev, form: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-bold">Create New Agency</h1>
          <p className="opacity-80">Fill in your agency details below</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 md:p-8 space-y-6"
          encType="multipart/form-data"
        >
          {errors.form && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
              {errors.form}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Agency Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
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
                    value={formData.registration_number}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border ${errors.registration_number
                        ? "border-red-500"
                        : "border-gray-300"
                      } focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
                    placeholder="123-456-789"
                  />
                  {errors.registration_number && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.registration_number}
                    </p>
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
                    value={formData.email}
                    onChange={handleChange}
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
                    value={formData.phone}
                    onChange={handleChange}
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
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Describe your agency services and specialties..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">
                    Agency Logo
                  </label>

                  {imagePreview ? (
                    /* Image Preview */
                    <div className="relative rounded-lg overflow-hidden border-2 border-indigo-500 bg-white shadow-md">
                      <img
                        src={imagePreview}
                        alt="Agency Logo Preview"
                        className="w-full h-48 object-contain p-2"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center gap-3 opacity-0 hover:opacity-100">
                        <button
                          type="button"
                          onClick={handleUpdateImage}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                          title="Update Image"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-full shadow-lg transform hover:scale-110 transition-all duration-200"
                          title="Remove Image"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-95 rounded px-2 py-1">
                        <p className="text-xs text-gray-700 truncate font-medium">
                          {formData.logo_path?.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Upload Area with Drag & Drop */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDragEnter}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${isDragging
                          ? "border-indigo-600 bg-indigo-50 scale-105"
                          : "border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-indigo-400"
                        }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                        {isDragging ? (
                          <svg
                            className="w-12 h-12 text-indigo-600 mb-3 animate-bounce"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-10 h-10 text-gray-400 mb-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                        )}
                        <p
                          className={`text-sm font-medium mb-1 ${isDragging ? "text-indigo-700" : "text-gray-700"
                            }`}
                        >
                          {isDragging
                            ? "Drop your image here"
                            : "Click to upload or drag and drop"}
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or WEBP (Max 5MB)
                        </p>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    name="logo_path"
                    onChange={handleChange}
                    accept="image/*"
                    className="hidden"
                  />

                  {errors.logo_path && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.logo_path}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center">
                  <div className="flex items-center">
                    <div className="relative inline-block w-12 h-6 mr-3">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="absolute w-12 h-6 transition-colors duration-300 rounded-full appearance-none cursor-pointer peer bg-gray-300 checked:bg-indigo-600"
                      />
                      <span className="absolute w-5 h-5 transition-transform duration-300 bg-white rounded-full left-1 top-0.5 peer-checked:translate-x-6 shadow-md"></span>
                    </div>
                    <label className="text-gray-700 font-medium">
                      Active Agency
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Map */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Select Location on Map *
                </label>
                {errors.coordinates && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                    <p className="text-sm text-red-700">
                      {errors.coordinates}
                    </p>
                  </div>
                )}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-blue-800">
                    💡 Click on the map or search for a location to place your
                    agency marker
                  </p>
                </div>
                <div
                  ref={geocoderContainerRef}
                  className="mb-2 mapboxgl-ctrl-geocoder-container"
                ></div>
                <div className="rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
                  <Map
                    ref={mapRef}
                    {...viewState}
                    onMove={(evt) => setViewState(evt.viewState)}
                    onClick={handleMapClick}
                    mapboxAccessToken={MAPBOX_TOKEN}
                    style={{ width: "100%", height: "500px" }}
                    mapStyle="mapbox://styles/mapbox/streets-v12"
                  >
                    <NavigationControl position="top-right" />

                    {markerPlaced && (
                      <Marker
                        longitude={formData.agency_coordinates.lng}
                        latitude={formData.agency_coordinates.lat}
                        anchor="bottom"
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                      >
                        <div className="flex flex-col items-center">
                          {formData.name && (
                            <div className="mb-2 bg-white px-3 py-2 rounded-lg shadow-lg border-2 border-indigo-500 whitespace-nowrap">
                              <p className="text-sm font-bold text-indigo-600">
                                {formData.name}
                              </p>
                            </div>
                          )}

                          <div className="relative">
                            <svg
                              height="40"
                              width="40"
                              viewBox="0 0 24 24"
                              className="drop-shadow-lg"
                            >
                              <path
                                fill="#4F46E5"
                                d="M12 0C7.802 0 4 3.403 4 7.602C4 11.8 7.469 16.812 12 24C16.531 16.812 20 11.8 20 7.602C20 3.403 16.199 0 12 0ZM12 11C10.343 11 9 9.657 9 8C9 6.343 10.343 5 12 5C13.657 5 15 6.343 15 8C15 9.657 13.657 11 12 11Z"
                              />
                              <circle cx="12" cy="8" r="2" fill="white" />
                            </svg>
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                          </div>
                        </div>
                      </Marker>
                    )}
                  </Map>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  📍{" "}
                  {markerPlaced
                    ? "Drag the marker to adjust the location"
                    : "Click anywhere on the map to place your agency marker"}
                </p>
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
                  <svg
                    className="animate-spin h-5 w-5 mr-3 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Agency...
                </div>
              ) : (
                "Create Agency"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAgency;