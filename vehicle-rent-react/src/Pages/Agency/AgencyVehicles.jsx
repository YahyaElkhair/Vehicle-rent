// src/pages/manager/AgencyVehicles.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter,
  FiRefreshCw, FiChevronDown, FiChevronUp, FiPercent,
  FiBluetooth, FiCheck, FiNavigation, FiArrowLeft
} from 'react-icons/fi';
import {
  FaGasPump, FaCar, FaTachometerAlt,
  FaDollarSign, FaRegSnowflake
} from 'react-icons/fa';
import {
  GiGearStickPattern, GiCarDoor, GiSteeringWheel,
  GiCarSeat
} from 'react-icons/gi';
import { TbAirConditioning } from 'react-icons/tb';

import { AppContext } from '../../Context/AppContext';
import VehicleEdit from './VehicleEdit';
import VehicleView from './VehicleView'; // Import the updated VehicleView

const AgencyVehicles = () => {
  const { token, user } = useContext(AppContext);
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    minPrice: '',
    maxPrice: '',
    transmission: 'all',
    fuelType: 'all'
  });
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agency/vehicles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch vehicles');

      const data = await response.json();
      setVehicles(data.data);
      setFilteredVehicles(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [token, user]);

  useEffect(() => {
    let result = [...vehicles];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(vehicle =>
        vehicle.brand.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term) ||
        vehicle.license_plate.toLowerCase().includes(term)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(vehicle => vehicle.status === filters.status);
    }

    if (filters.minPrice) {
      result = result.filter(vehicle => vehicle.price_per_day >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      result = result.filter(vehicle => vehicle.price_per_day <= parseFloat(filters.maxPrice));
    }

    if (filters.transmission !== 'all') {
      result = result.filter(vehicle => vehicle.transmission === filters.transmission);
    }

    if (filters.fuelType !== 'all') {
      result = result.filter(vehicle => vehicle.fuel_type === filters.fuelType);
    }

    setFilteredVehicles(result);
  }, [vehicles, searchTerm, filters]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      const response = await fetch(`/api/vehicle/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete vehicle');

      setVehicles(prev => prev.filter(v => v.id !== id));
      if (selectedVehicle?.id === id) setSelectedVehicle(null);
      if (editingVehicle?.id === id) setEditingVehicle(null);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting vehicle:', err);
    }
  };

  const handleUpdateVehicle = (updatedVehicle) => {
    setVehicles(prev =>
      prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v)
    );
    setSelectedVehicle(updatedVehicle);
    setEditingVehicle(null);
  };

  const renderStatusBadge = (status) => {
    const statusMap = {
      available: 'bg-green-100 text-green-800 border-green-200',
      not_available: 'bg-gray-100 text-gray-800 border-gray-200',
      rented: 'bg-blue-100 text-blue-800 border-blue-200',
      maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusMap[status] || 'bg-gray-100'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const renderFeatureIcon = (feature) => {
    const normalizedFeature = feature.toLowerCase();
    
    if (normalizedFeature.includes('ac') || normalizedFeature.includes('air conditioning')) {
      return <TbAirConditioning className="text-indigo-500 mr-1" />;
    }
    if (normalizedFeature.includes('gps') || normalizedFeature.includes('navigation')) {
      return <FiNavigation className="text-indigo-500 mr-1" />;
    }
    if (normalizedFeature.includes('bluetooth')) {
      return <FiBluetooth className="text-indigo-500 mr-1" />;
    }
    if (normalizedFeature.includes('heated') || normalizedFeature.includes('seat warm')) {
      return <FaRegSnowflake className="text-indigo-500 mr-1" />;
    }
    return <FiCheck className="text-indigo-500 mr-1" />;
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl text-center">
          <h2 className="text-xl font-bold mb-2">Error Loading Vehicles</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={fetchVehicles}
            className="flex items-center justify-center mx-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <FiRefreshCw className="mr-2" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render edit form if editing a vehicle
  if (editingVehicle) {
    return (
      <VehicleEdit
        vehicle={editingVehicle}
        onCancel={() => {
          setEditingVehicle(null);
          setSelectedVehicle(editingVehicle);
        }}
        onUpdate={handleUpdateVehicle}
      />
    );
  }

  // Render vehicle details using VehicleView component
  if (selectedVehicle) {
    return (
      <VehicleView
        vehicle={selectedVehicle}
        onBack={() => setSelectedVehicle(null)}
        onDelete={handleDelete}
        onEdit={(vehicle) => setEditingVehicle(vehicle)}
      />
    );
  }

  // Main fleet view
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Your Fleet</h1>
          <p className="text-gray-600">
            Manage your agency's vehicle inventory
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchVehicles}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>

          <Link
            to="/manager/vehicle/create"
            className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 shadow-md"
          >
            <FiPlus className="mr-2" /> Add Vehicle
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search vehicles by brand, model or license plate..."
              className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
          >
            <FiFilter className="mr-2" />
            Filters {filtersOpen ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />}
          </button>
        </div>

        {/* Expanded Filters */}
        {filtersOpen && (
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="not_available">Not Available</option>
                <option value="rented">Rented</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transmission</label>
              <select
                value={filters.transmission}
                onChange={(e) => setFilters({ ...filters, transmission: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Transmissions</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
              <select
                value={filters.fuelType}
                onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Fuel Types</option>
                <option value="gasoline">Gasoline</option>
                <option value="diesel">Diesel</option>
                <option value="hybrid">Hybrid</option>
                <option value="electric">Electric</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price ($/day)</label>
              <input
                type="number"
                placeholder="Min"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price ($/day)</label>
              <input
                type="number"
                placeholder="Max"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-indigo-700">{vehicles.length}</div>
          <div className="text-gray-600">Total Vehicles</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-700">
            {vehicles.filter(v => v.status === 'available').length}
          </div>
          <div className="text-gray-600">Available Now</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-blue-700">
            {vehicles.filter(v => v.status === 'rented').length}
          </div>
          <div className="text-gray-600">Currently Rented</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-700">
            {vehicles.filter(v => v.status === 'maintenance').length}
          </div>
          <div className="text-gray-600">In Maintenance</div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-xl cursor-pointer"
              onClick={() => setSelectedVehicle(vehicle)}
            >
              {/* Image Header */}
              <div className="relative">
                {vehicle.images && vehicle.images.length > 0 ? (
                  <div className="h-48 relative">
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    {vehicle.images.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                        +{vehicle.images.length - 1}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <FaCar className="text-gray-300 text-4xl" />
                  </div>
                )}

                <div className="absolute top-2 right-2">
                  {renderStatusBadge(vehicle.status)}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="font-bold text-xl text-white">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-gray-200 text-sm">
                    {vehicle.year} · {vehicle.color}
                  </p>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-gray-600 text-sm flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                      {vehicle.license_plate}
                    </p>
                    <p className="text-gray-600 text-sm flex items-center">
                      <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                      {vehicle.vin}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-600 flex items-center justify-end">
                      <FaDollarSign className="text-lg" />
                      {vehicle.price_per_day}
                      <span className="text-sm font-normal ml-1">/day</span>
                    </p>
                    {vehicle.discount_rate > 0 && (
                      <p className="text-sm text-green-600 flex items-center justify-end">
                        <FiPercent className="mr-1" />
                        {vehicle.discount_rate}% off
                      </p>
                    )}
                  </div>
                </div>

                {/* Specifications */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <GiGearStickPattern className="text-indigo-500 text-xl mb-1" />
                    <span className="text-xs text-gray-700 capitalize">{vehicle.transmission}</span>
                    <span className="text-xs text-gray-500">Transmission</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <FaGasPump className="text-indigo-500 text-xl mb-1" />
                    <span className="text-xs text-gray-700 capitalize">{vehicle.fuel_type}</span>
                    <span className="text-xs text-gray-500">Fuel</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
                    <GiCarSeat className="text-indigo-500 text-xl mb-1" />
                    <span className="text-xs text-gray-700">{vehicle.seats}</span>
                    <span className="text-xs text-gray-500">Seats</span>
                  </div>
                </div>

                {/* Features */}
                {vehicle.features?.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.features.slice(0, 4).map((feature, index) => (
                        <div key={index} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs flex items-center">
                          {renderFeatureIcon(feature)}
                          {feature}
                        </div>
                      ))}
                      {vehicle.features.length > 4 && (
                        <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          +{vehicle.features.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center">
                    <FaTachometerAlt className="mr-2 text-indigo-500" />
                    {vehicle.mileage.toLocaleString()} mi
                  </div>
                  <div className="flex items-center">
                    <GiCarDoor className="mr-2 text-indigo-500" />
                    {vehicle.doors} doors
                  </div>
                  <div className="flex items-center">
                    <GiSteeringWheel className="mr-2 text-indigo-500" />
                    {vehicle.engine_type}
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVehicle(vehicle);
                  }}
                  className="flex items-center text-indigo-600 hover:text-indigo-800"
                >
                  <FiEdit className="mr-1" /> View Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(vehicle.id);
                  }}
                  className="flex items-center text-red-600 hover:text-red-800"
                >
                  <FiTrash2 className="mr-1" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-300">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed rounded-xl w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <FaCar className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No vehicles found</h3>
          <p className="text-gray-600 mb-6">
            {vehicles.length === 0
              ? "Your agency doesn't have any vehicles yet. Add your first vehicle to get started."
              : "No vehicles match your search and filter criteria."}
          </p>
          <Link
            to="/manager/vehicle/create"
            className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:opacity-90 shadow-md"
          >
            <FiPlus className="mr-2" /> Add Your First Vehicle
          </Link>
        </div>
      )}

      {/* Floating Add Button */}
      <Link
        to="/manager/vehicle/create"
        className="fixed bottom-8 right-8 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:opacity-90 transition-opacity transform hover:scale-110"
      >
        <FiPlus className="text-2xl" />
      </Link>
    </div>
  );
};

export default AgencyVehicles;