/* eslint-disable no-unused-vars */
// src/components/dashboard/AgencyDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../Context/AppContext';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { format, parseISO, isSameYear, isThisWeek, startOfWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import {
    FiDollarSign,
    FiTruck,
    FiFileText,
    FiCalendar,
    FiUsers,
    FiTrendingUp,
    FiRefreshCw,
    FiCreditCard,
    FiCheckCircle
} from 'react-icons/fi';
import VehicleView from "../Agency/VehicleView"

Chart.register(...registerables);

const Dashboard = () => {
    const { token } = useContext(AppContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month');
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null); // State for selected vehicle
    const [vehicles, setVehicles] = useState([]); // Store vehicles for vehicle view

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const agencyRes = await fetch('/api/agency/dashboard-data', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (!agencyRes.ok) {
                const errorData = await agencyRes.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${agencyRes.status}`);
            }

            const responseData = await agencyRes.json();

            // Process the data directly from the API response
            const processedData = processDashboardData(responseData);
            console.log(processedData)
            setDashboardData(processedData);
            setVehicles(responseData.data.vehicles); // Store vehicles for vehicle view
            setLoading(false);
        } catch (error) {
            console.log("Failed to fetch dashboard data:", error.message);
            setError(error.message || 'An unexpected error occurred');
            setDashboardData(null);
            setLoading(false);
        }
    };

    const processDashboardData = (apiData) => {
        const { vehicles = [], reservations = [], agency } = apiData.data;
        const now = new Date();
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Initialize revenue arrays
        const monthlyRevenue = Array(12).fill(0);
        const weeklyRevenue = Array(7).fill(0);
        const yearlyRevenue = [0, 0, 0]; // Last 3 years

        // Extract payments from reservations
        const payments = reservations
            .filter(res => res.payment)
            .map(res => res.payment);

        // Process reservations for revenue
        reservations.forEach(reservation => {
            if (!reservation.pickup_date || !reservation.final_amount) return;

            try {
                const pickupDate = parseISO(reservation.pickup_date);
                const pickupYear = pickupDate.getFullYear();
                const pickupMonth = pickupDate.getMonth();
                const pickupDay = pickupDate.getDay();

                // Monthly revenue (current year)
                if (isSameYear(pickupDate, now)) {
                    monthlyRevenue[pickupMonth] += parseFloat(reservation.final_amount);
                }

                // Weekly revenue (current week)
                const weekStart = startOfWeek(now, { weekStartsOn: 1 });
                if (isThisWeek(pickupDate, { weekStartsOn: 1 })) {
                    const adjustedIndex = pickupDay === 0 ? 6 : pickupDay - 1;
                    weeklyRevenue[adjustedIndex] += parseFloat(reservation.final_amount);
                }

                // Yearly revenue (last 3 years)
                const currentYear = now.getFullYear();
                if (pickupYear === currentYear - 2) yearlyRevenue[0] += parseFloat(reservation.final_amount);
                if (pickupYear === currentYear - 1) yearlyRevenue[1] += parseFloat(reservation.final_amount);
                if (pickupYear === currentYear) yearlyRevenue[2] += parseFloat(reservation.final_amount);
            } catch (e) {
                console.warn('Invalid reservation date format:', reservation.pickup_date);
            }
        });

        // Calculate vehicle status counts
        const vehicleStatusCounts = vehicles.reduce((acc, vehicle) => {
            const status = vehicle.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // Get top vehicles by revenue
        const vehicleRevenue = {};
        reservations.forEach(reservation => {
            if (!reservation.vehicle_id || !reservation.final_amount) return;

            const vehicleId = reservation.vehicle_id;
            if (!vehicleRevenue[vehicleId]) {
                vehicleRevenue[vehicleId] = 0;
            }
            vehicleRevenue[vehicleId] += parseFloat(reservation.final_amount);
        });

        const topVehicles = Object.entries(vehicleRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([vehicleId, revenue]) => {
                const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
                return {
                    id: vehicleId,
                    name: vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : `Vehicle ${vehicleId}`,
                    revenue
                };
            });

        // Get recent reservations
        const recentReservations = [...reservations]
            .sort((a, b) => {
                const dateA = a.pickup_date ? new Date(a.pickup_date) : new Date(0);
                const dateB = b.pickup_date ? new Date(b.pickup_date) : new Date(0);
                return dateB - dateA;
            })
            .slice(0, 5)
            .map(reservation => ({
                id: reservation.id,
                reservation_number: reservation.reservation_number,
                customer: `Client #${reservation.client_id}`,
                vehicle: reservation.vehicle,
                pickup: reservation.pickup_date,
                return: reservation.return_date,
                amount: reservation.final_amount || 0,
                status: reservation.status || 'pending',
                payment: reservation.payment?.status || 'unpaid'
            }));
        console.log(reservations);
        // Process payments
        const paymentStatusCounts = payments.reduce((acc, payment) => {
            const status = payment.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // Recent payments
        const recentPayments = [...payments]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5)
            .map(payment => ({
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: payment.payment_method,
                date: payment.created_at,
                reservation: payment.reservation_id
                    ? `RES-${reservations.find(r => r.id === payment.reservation_id)?.reservation_number || payment.reservation_id}`
                    : 'N/A'
            }));

        // Calculate statistics
        const currentMonthRevenue = monthlyRevenue[now.getMonth()];
        const previousMonthRevenue = monthlyRevenue[(now.getMonth() - 1 + 12) % 12];
        const revenueChange = previousMonthRevenue && currentMonthRevenue
            ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
            : 0;

        const stats = {
            total_vehicles: vehicles.length,
            available_vehicles: vehicles.filter(v => v.status === 'available').length,
            rented_vehicles: vehicles.filter(v => v.status === 'rented').length,
            total_posts: 0, // Not available in API
            active_posts: 0, // Not available in API
            total_reservations: reservations.length,
            active_reservations: reservations.filter(r => r.status === 'active').length,
            total_payments: payments.length,
            revenue: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0),
            revenue_change: revenueChange,
            top_vehicle: topVehicles[0]?.name || 'N/A',
            payment_status: paymentStatusCounts,
            recent_payments: recentPayments
        };

        return {
            agency: {
                name: agency.name,
                registration_number: agency.registration_number,
                is_active: agency.is_active,
                created_at: agency.created_at,
                logo_path: agency.logo_path
            }, // Default agency data
            stats,
            revenueData: {
                month: monthlyRevenue,
                week: weeklyRevenue,
                year: yearlyRevenue
            },
            vehicleStatus: vehicleStatusCounts,
            topVehicles: topVehicles.length > 0 ? topVehicles : [],
            recentReservations
        };
    };

    useEffect(() => {
        if (token) {
            fetchDashboardData();
        }
    }, [token]);


    useEffect(() => {
        console.log("dh :", dashboardData);

    }, [dashboardData]);

    // Handle back from vehicle view
    const handleBackFromVehicle = () => {
        setSelectedVehicle(null);
    };

    // Revenue chart data
    const revenueChartData = {
        labels: timeRange === 'week'
            ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            : timeRange === 'month'
                ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                : dashboardData?.revenueData.year.map((_, i) => `${new Date().getFullYear() - 2 + i}`) || [],
        datasets: [
            {
                label: 'Revenue ($)',
                data: dashboardData?.revenueData[timeRange] || [],
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }
        ]
    };

    // Vehicle status chart data
    const vehicleStatusData = {
        labels: dashboardData?.vehicleStatus ? Object.keys(dashboardData.vehicleStatus) : [],
        datasets: [
            {
                data: dashboardData?.vehicleStatus ? Object.values(dashboardData.vehicleStatus) : [],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 99, 132, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 1
            }
        ]
    };

    // Top vehicles chart data
    const topVehiclesData = {
        labels: dashboardData?.topVehicles.map(v => v.name) || [],
        datasets: [
            {
                label: 'Revenue ($)',
                data: dashboardData?.topVehicles.map(v => v.revenue) || [],
                backgroundColor: 'rgba(79, 70, 229, 0.7)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 1
            }
        ]
    };

    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    const getStatusColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'completed':
            case 'paid':
            case 'success':
            case 'available':
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'active':
            case 'pending':
            case 'reserved':
            case 'created':
                return 'bg-blue-100 text-blue-800';
            case 'processing':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
            case 'failed':
            case 'declined':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        const statusLower = (status || '').toLowerCase();
        switch (statusLower) {
            case 'completed':
            case 'paid':
            case 'success':
                return <FiCheckCircle className="text-green-500 mr-1" />;
            case 'active':
            case 'pending':
            case 'reserved':
            case 'created':
                return <FiCreditCard className="text-blue-500 mr-1" />;
            case 'confirmed':
            case 'processing':
                return <FiCalendar className="text-yellow-500 mr-1" />;
            case 'cancelled':
            case 'failed':
            case 'declined':
                return <FiCreditCard className="text-red-500 mr-1" />;
            default:
                return <FiCreditCard className="text-gray-500 mr-1" />;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-4">Error: {error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center mx-auto"
                    >
                        <FiRefreshCw className="mr-2" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">No dashboard data found</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center mx-auto"
                    >
                        <FiRefreshCw className="mr-2" />
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Render VehicleView if a vehicle is selected
    if (selectedVehicle) {
        return (
            <VehicleView
                vehicle={selectedVehicle}
                onBack={handleBackFromVehicle}
                onEdit={() => { }} // Not implemented in dashboard
                onDelete={() => { }} // Not implemented in dashboard
            />
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center">
                        {/* <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" /> */}
                        <img src={dashboardData.agency.logo_path} alt="Agency logo" className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                        <div className="ml-4">
                            <h1 className="text-2xl font-bold text-gray-900">{dashboardData.agency.name}</h1>
                            <p className="text-gray-600">Registration: {dashboardData.agency.registration_number}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${dashboardData.agency.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {dashboardData.agency.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <p className="ml-4 text-gray-600">Member since {format(parseISO(dashboardData.agency.created_at), 'MMM yyyy')}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Overview
                        </button>
                        <Link
                            to='/manager/vehicles'
                            onClick={() => setActiveTab('vehicles')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vehicles'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Vehicles
                        </Link>

                        <Link
                            to='/manager/posts'
                            onClick={() => setActiveTab('vehicles')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'vehicles'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Posts
                        </Link>

                        
                        <button
                            onClick={() => setActiveTab('reservations')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reservations'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Reservations
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'payments'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            Payments
                        </button>
                    </nav>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-3">
                                    <FiDollarSign className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="ml-5">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                                        {formatCurrency(dashboardData.stats.revenue)}
                                    </dd>
                                </div>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-green-600">
                                <FiTrendingUp className="mr-1" />
                                <span>{dashboardData.stats.revenue_change}% from last month</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                                    <FiTruck className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-5">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Vehicles</dt>
                                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                                        {dashboardData.stats.total_vehicles}
                                    </dd>
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="flex text-sm text-gray-500">
                                    <span className="mr-3">{dashboardData.stats.available_vehicles} available</span>
                                    <span>{dashboardData.stats.rented_vehicles} rented</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                                    <FiCalendar className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="ml-5">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Reservations</dt>
                                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                                        {dashboardData.stats.total_reservations}
                                    </dd>
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="flex text-sm text-gray-500">
                                    <span>{dashboardData.stats.active_reservations} active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                                    <FiCreditCard className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="ml-5">
                                    <dt className="text-sm font-medium text-gray-500 truncate">Payments</dt>
                                    <dd className="mt-1 text-2xl font-semibold text-gray-900">
                                        {dashboardData.stats.total_payments}
                                    </dd>
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="flex text-sm text-gray-500">
                                    <span className="mr-3">
                                        {dashboardData.stats.payment_status?.completed || 0} completed
                                    </span>
                                    <span>
                                        {dashboardData.stats.payment_status?.pending || 0} pending
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Revenue Chart */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-medium text-gray-900">Revenue Overview</h2>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setTimeRange('week')}
                                    className={`px-3 py-1 text-sm rounded-md ${timeRange === 'week'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Week
                                </button>
                                <button
                                    onClick={() => setTimeRange('month')}
                                    className={`px-3 py-1 text-sm rounded-md ${timeRange === 'month'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Month
                                </button>
                                <button
                                    onClick={() => setTimeRange('year')}
                                    className={`px-3 py-1 text-sm rounded-md ${timeRange === 'year'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Year
                                </button>
                            </div>
                        </div>
                        <Line
                            data={revenueChartData}
                            options={{
                                responsive: true,
                                plugins: {
                                    legend: {
                                        display: false
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => `$${context.parsed.y.toFixed(2)}`
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: (value) => `$${value}`
                                        }
                                    }
                                }
                            }}
                        />
                    </div>

                    {/* Vehicle Status Chart */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-6">Vehicle Status Distribution</h2>
                        <div className="h-64 flex items-center justify-center">
                            {Object.keys(dashboardData.vehicleStatus).length > 0 ? (
                                <Pie
                                    data={vehicleStatusData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right',
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <p className="text-gray-500 text-center">
                                    No vehicle status data available
                                </p>
                            )}
                        </div>
                    </div>



                </div>



                {/* Top Vehicles */}
                <div className="bg-white shadow rounded-lg p-6 mt-10">
                    <h2 className="text-lg font-medium text-gray-900 mb-6">Top Performing Vehicles</h2>
                    {dashboardData.topVehicles.length > 0 ? (
                        <>
                            <div className="h-64 ">
                                <Bar
                                    data={topVehiclesData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                display: true
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: (context) => `$${context.parsed.y.toFixed(2)}`
                                                }
                                            }
                                        },
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: (value) => `$${value}`
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                            <div className="mt-4">
                                <ul className="divide-y divide-gray-200">
                                    {dashboardData.topVehicles.map((vehicle, index) => {
                                        // Find the full vehicle details
                                        const fullVehicle = vehicles.find(v => v.id === parseInt(vehicle.id));

                                        return (
                                            <li key={index} className="py-3 flex justify-between items-center hover:bg-gray-50 rounded-lg px-2 transition-colors">
                                                <button
                                                    onClick={() => fullVehicle && setSelectedVehicle(fullVehicle)}
                                                    className="text-left flex-1 group"
                                                    disabled={!fullVehicle}
                                                >
                                                    <span className="text-gray-600 group-hover:text-indigo-600 transition-colors">
                                                        {index + 1}. {vehicle.name}
                                                    </span>
                                                    {fullVehicle && (
                                                        <span className="block text-xs text-gray-400 mt-1">
                                                            Click to view details
                                                        </span>
                                                    )}
                                                </button>
                                                <span className="font-medium text-indigo-600">{formatCurrency(vehicle.revenue)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-500 text-center py-8">
                            No vehicle revenue data available
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-12">


                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


                    {/* Recent Reservations */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-6">Recent Reservations</h2>
                        {dashboardData.recentReservations.length > 0 ? (
                            <>
                                <div className="overflow-x-auto rounded-lg border border-gray-200 no-scrollbar">
                                    <table className="min-w-full divide-y divide-gray-200 " >
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Reservation #
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Vehicle
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Dates
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {dashboardData.recentReservations.map((res) => (
                                                <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {res.reservation_number}
                                                    </td>




                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        <button
                                                            onClick={() => setSelectedVehicle(res.vehicle)}
                                                            className="hover:text-purple-500"
                                                        >
                                                            {res.vehicle ? `${res.vehicle.brand}` : 'N/A'}
                                                        </button>

                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {res.pickup ? format(parseISO(res.pickup), 'MMM dd') : 'N/A'} - {' '}
                                                        {res.return ? format(parseISO(res.return), 'MMM dd') : 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {formatCurrency(res.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(res.status)}`}>
                                                            {res.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 text-center">
                                    <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                                        View all reservations →
                                    </button>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 text-center py-8">
                                No reservations found
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Payments Section */}
            {activeTab === 'payments' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-12">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-6">Recent Payments</h2>
                        {dashboardData.stats.recent_payments.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Reservation
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Method
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData.stats.recent_payments.map((payment) => (
                                            <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {payment.reservation}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(payment.amount, payment.currency)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                    {payment.method}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {format(parseISO(payment.date), 'MMM dd, yyyy')}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-8">
                                No payments found
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;