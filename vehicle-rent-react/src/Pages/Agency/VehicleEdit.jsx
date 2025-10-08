// src/pages/manager/VehicleEdit.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { FiArrowLeft, FiPlus, FiX, FiCamera, FiInfo } from 'react-icons/fi';
import { FaGasPump, FaCar, FaDollarSign } from 'react-icons/fa';
import { GiGearStickPattern, GiCarDoor, GiCarSeat } from 'react-icons/gi';
import { AppContext } from '../../Context/AppContext';

const VehicleEdit = ({ vehicle, onCancel, onUpdate }) => {
  const { token } = useContext(AppContext);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: '',
    color: '',
    license_plate: '',
    vin: '',
    mileage: '',
    engine_type: '',
    transmission: '',
    fuel_type: '',
    seats: '',
    doors: '',
    price_per_day: '',
    price_per_week: '',
    price_per_month: '',
    discount_rate: '',
    minimum_rental_days: '',
    status: 'available',
    description: '',
    images: [],
    features: [],
    delivery_fee_per_km: '',
    available_from: '',
    available_to: '',
    blackout_dates: [],
    type: 'car'
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newFeature, setNewFeature] = useState('');
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (vehicle) {
      // Initialize form data with vehicle properties
      setFormData({
        ...vehicle,
        features: vehicle.features || [],
        blackout_dates: vehicle.blackout_dates || [],
        images: vehicle.images || []
      });

      // Create image previews
      setImagePreviews(vehicle.images.map(img => ({
        url: img,
        name: 'Existing image',
        size: 'Existing'
      })));

    }
  }, [vehicle]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = (files) => {
    const validFiles = [];
    const invalidFiles = [];

    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        invalidFiles.push(`${file.name}: Not an image file`);
      } else if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name}: Exceeds 5MB limit`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        images: [...(prev.images || []), ...invalidFiles]
      }));
    }

    if (validFiles.length === 0) return;

    const previews = validFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB'
    }));

    setImagePreviews(prev => [...prev, ...previews]);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles]
    }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === 'file') {
      const files = Array.from(e.target.files);
      processFiles(files);
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseFloat(value) || '' : value
      });
    }
  };

  const handleAddFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (feature) => {
    setFormData({
      ...formData,
      features: formData.features.filter(f => f !== feature)
    });
  };

  const handleAddBlackoutDate = () => {
    if (newBlackoutDate && !formData.blackout_dates.includes(newBlackoutDate)) {
      setFormData({
        ...formData,
        blackout_dates: [...formData.blackout_dates, newBlackoutDate]
      });
      setNewBlackoutDate('');
    }
  };

  const handleRemoveBlackoutDate = (date) => {
    setFormData({
      ...formData,
      blackout_dates: formData.blackout_dates.filter(d => d !== date)
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];

    newImages.splice(index, 1);
    newPreviews.splice(index, 1);

    setFormData({ ...formData, images: newImages });
    setImagePreviews(newPreviews);

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const form = new FormData();

      // Append all non-array fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'images') return;

        if (Array.isArray(value)) {
          // Append array fields with [] syntax
          value.forEach(item => {
            if (item !== null && item !== undefined) {
              form.append(`${key}[]`, item);
            }
          });
        } else if (value !== null && value !== undefined) {
          form.append(key, value);
        }
      });

      // Append new images as files
      formData.images.forEach(image => {
        if (image instanceof File) {
          form.append('new_images[]', image);
        }
      });

      formData.images.forEach(image => {
        form.append('images[]', image);
      });

      // console.log('Form data before submission:', formData.images);
      console.log('Form data before submission:', formData.images);


      form.append('_method', 'PUT');

      // Send the request
      const response = await fetch(`/api/vehicle/${vehicle.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form
      });

      const responseData = await response.json();
      console.log('Response data:', responseData);


      if (!response.ok) {
        if (responseData.errors) {
          setErrors(responseData.errors);
        } else {
          throw new Error(responseData.message || 'Failed to update vehicle');
        }
      } else {
        onUpdate(responseData.vehicle);
      }
    } catch (error) {
      setErrors({ general: error.message || 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={onCancel}
          className="flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <FiArrowLeft className="mr-2" /> Back to Vehicle
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Vehicle</h1>
      </div>

      {errors.general && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center">
          <FiInfo className="mr-2 text-xl" />
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6">
          {/* Basic Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.brand ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Toyota, Honda, etc."
                />
                {errors.brand && <p className="mt-1 text-sm text-red-600">{errors.brand[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.model ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Camry, Civic, etc."
                />
                {errors.model && <p className="mt-1 text-sm text-red-600">{errors.model[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  min="1900"
                  max={new Date().getFullYear()}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.year ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.year && <p className="mt-1 text-sm text-red-600">{errors.year[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.color ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Red, Blue, etc."
                />
                {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Plate <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="license_plate"
                  value={formData.license_plate}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.license_plate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="ABC-123"
                />
                {errors.license_plate && <p className="mt-1 text-sm text-red-600">{errors.license_plate[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VIN <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="vin"
                  value={formData.vin}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.vin ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Vehicle Identification Number"
                />
                {errors.vin && <p className="mt-1 text-sm text-red-600">{errors.vin[0]}</p>}
              </div>
            </div>
          </div>

          {/* Specifications Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transmission <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <GiGearStickPattern className="text-indigo-500 text-xl mr-3" />
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.transmission ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="automatic">Automatic</option>
                    <option value="manual">Manual</option>
                    <option value="semi-automatic">Semi-Automatic</option>
                  </select>
                </div>
                {errors.transmission && <p className="mt-1 text-sm text-red-600">{errors.transmission[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Type <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <FaGasPump className="text-indigo-500 text-xl mr-3" />
                  <select
                    name="fuel_type"
                    value={formData.fuel_type}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.fuel_type ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Electric</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                {errors.fuel_type && <p className="mt-1 text-sm text-red-600">{errors.fuel_type[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seats <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <GiCarSeat className="text-indigo-500 text-xl mr-3" />
                  <input
                    type="number"
                    name="seats"
                    value={formData.seats}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.seats ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.seats && <p className="mt-1 text-sm text-red-600">{errors.seats[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doors <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <GiCarDoor className="text-indigo-500 text-xl mr-3" />
                  <input
                    type="number"
                    name="doors"
                    value={formData.doors}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.doors ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.doors && <p className="mt-1 text-sm text-red-600">{errors.doors[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mileage (miles) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  min="0"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.mileage ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.mileage && <p className="mt-1 text-sm text-red-600">{errors.mileage[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Engine Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="engine_type"
                  value={formData.engine_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.engine_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="V6, V8, etc."
                />
                {errors.engine_type && <p className="mt-1 text-sm text-red-600">{errors.engine_type[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.type ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="car">Car</option>
                  <option value="motorcycle">Motorcycle</option>
                  <option value="truck">Truck</option>
                </select>
                {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type[0]}</p>}
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Pricing
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Per Day ($) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center">
                  <FaDollarSign className="text-indigo-500 mr-3" />
                  <input
                    type="number"
                    name="price_per_day"
                    value={formData.price_per_day}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.price_per_day ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.price_per_day && <p className="mt-1 text-sm text-red-600">{errors.price_per_day[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Per Week ($)
                </label>
                <div className="flex items-center">
                  <FaDollarSign className="text-indigo-500 mr-3" />
                  <input
                    type="number"
                    name="price_per_week"
                    value={formData.price_per_week}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.price_per_week ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.price_per_week && <p className="mt-1 text-sm text-red-600">{errors.price_per_week[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Per Month ($)
                </label>
                <div className="flex items-center">
                  <FaDollarSign className="text-indigo-500 mr-3" />
                  <input
                    type="number"
                    name="price_per_month"
                    value={formData.price_per_month}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.price_per_month ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.price_per_month && <p className="mt-1 text-sm text-red-600">{errors.price_per_month[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Rate (%)
                </label>
                <input
                  type="number"
                  name="discount_rate"
                  value={formData.discount_rate}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.discount_rate ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.discount_rate && <p className="mt-1 text-sm text-red-600">{errors.discount_rate[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Rental Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="minimum_rental_days"
                  value={formData.minimum_rental_days}
                  onChange={handleChange}
                  min="1"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.minimum_rental_days ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.minimum_rental_days && <p className="mt-1 text-sm text-red-600">{errors.minimum_rental_days[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Fee per km ($)
                </label>
                <div className="flex items-center">
                  <FaDollarSign className="text-indigo-500 mr-3" />
                  <input
                    type="number"
                    name="delivery_fee_per_km"
                    value={formData.delivery_fee_per_km}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.delivery_fee_per_km ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                </div>
                {errors.delivery_fee_per_km && <p className="mt-1 text-sm text-red-600">{errors.delivery_fee_per_km[0]}</p>}
              </div>
            </div>
          </div>

          {/* Availability Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Availability
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="available_from"
                  value={formData.available_from}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.available_from ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.available_from && <p className="mt-1 text-sm text-red-600">{errors.available_from[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available To
                </label>
                <input
                  type="date"
                  name="available_to"
                  value={formData.available_to}
                  onChange={handleChange}
                  min={formData.available_from}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.available_to ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.available_to && <p className="mt-1 text-sm text-red-600">{errors.available_to[0]}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blackout Dates
                </label>
                <div className="flex">
                  <input
                    type="date"
                    value={newBlackoutDate}
                    onChange={(e) => setNewBlackoutDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlackoutDate}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
                  >
                    <FiPlus />
                  </button>
                </div>

                {formData.blackout_dates && formData.blackout_dates.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.blackout_dates.map((date, index) => (
                      <div key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-lg text-sm flex items-center">
                        {date}
                        <button
                          type="button"
                          onClick={() => handleRemoveBlackoutDate(date)}
                          className="ml-2 text-gray-500 hover:text-red-500"
                        >
                          <FiX size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.status ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="available">Available</option>
                  <option value="not_available">Not Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                </select>
                {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status[0]}</p>}
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Features
            </h2>

            <div className="mb-4">
              <div className="flex mb-3">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Add feature (AC, GPS, Bluetooth, etc.)"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700"
                >
                  <FiPlus />
                </button>
              </div>

              {formData.features && formData.features.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg text-sm flex items-center">
                      {feature}
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(feature)}
                        className="ml-2 text-indigo-500 hover:text-red-500"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Images Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Images
            </h2>

            <div
              className={`border-2 rounded-lg p-4 ${isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : errors.images
                  ? 'border-red-500'
                  : 'border-dashed border-gray-300'
                }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              aria-label="Image drop area"
            >
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FiCamera className="text-gray-400 text-4xl mb-3" />
                <p className="text-gray-600 mb-3">
                  {isDragging
                    ? 'Drop images here'
                    : 'Drag & drop images here or click to browse'
                  }
                </p>
                <input
                  type="file"
                  name="images"
                  onChange={handleChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  Select Images
                </label>
                <p className="text-xs text-gray-500 mt-2">JPG, PNG, WEBP up to 5MB each</p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="mt-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview.url}
                          alt={`Preview ${index}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images[0]}</p>}
          </div>

          {/* Description Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
              Description
            </h2>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500 ${errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Describe the vehicle, its condition, special features, etc."
            ></textarea>
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description[0]}</p>}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
            >
              {isSubmitting ? 'Updating Vehicle...' : 'Update Vehicle'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VehicleEdit;