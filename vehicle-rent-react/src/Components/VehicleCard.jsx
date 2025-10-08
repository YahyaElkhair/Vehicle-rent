import { FaCar, FaGasPump, FaSnowflake, FaTachometerAlt, FaUserFriends } from 'react-icons/fa';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';

function VehicleCard({ vehicle }) {

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Image Section */}
            <div className="relative">
                <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {vehicle.isPopular && 'POPULAR'}
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5">
                {/* Title and Price */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{vehicle.name}</h3>
                    <p className="text-blue-600 font-bold">{vehicle.price}</p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="flex flex-col items-center text-center">
                        <FaCar className="text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600">{vehicle.transmission}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <FaGasPump className="text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600">{vehicle.fuelType}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <FaUserFriends className="text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600">{vehicle.seats} seats</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <FaTachometerAlt className="text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600">{vehicle.mileage}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                        <FaSnowflake className="text-gray-500 mb-1" />
                        <span className="text-xs text-gray-600">{vehicle.ac ? 'AC' : 'No AC'}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                    <button
                        className="relative flex items-center justify-center w-full py-3 px-6 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-900 text-white font-semibold shadow-lg transition-all duration-300 group overflow-hidden hover:scale-[1.04]"
                    >
                        {/* New Arrow icon */}
                        <span
                            className="absolute left-[-40px] group-hover:left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out group-hover:translate-x-1 group-hover:scale-110"
                        >
                            <HiOutlineArrowNarrowRight className="text-white text-2xl animate-[zoomIn_0.6s_ease-out]" />
                        </span>

                        {/* Text */}
                        <span className="transition-all duration-500 transform group-hover:translate-x-3 group-hover:font-bold tracking-wide">
                            Start Your Ride
                        </span>

                        {/* Shimmer */}
                        <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-all duration-1000 blur-md animate-[pulse_2s_infinite]" />
                    </button>

                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-300 group">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-600 group-hover:text-red-500 transition-colors duration-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VehicleCard;