import { useRef, useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import VehicleCard from '../Components/VehicleCard';




export default function Home() {
    const carouselRef = useRef(null);
    const [showArrows, setShowArrows] = useState({
        left: false,
        right: true
    });

    const vehicles = [
        {
            id: 1,
            name: 'Tesla Model S',
            price: '$99/day',
            image: 'https://placehold.co/600x400?text=Tesla+Model+S',
        },
        {
            id: 2,
            name: 'BMW M5',
            price: '$120/day',
            image: 'https://placehold.co/600x400?text=BMW+M5',
        },
        {
            id: 3,
            name: 'Audi A6',
            price: '$110/day',
            image: 'https://placehold.co/600x400?text=Audi+A6',
        },
        {
            id: 4,
            name: 'Lamborghini Huracan',
            price: '$500/day',
            image: 'https://placehold.co/600x400?text=Lamborghini+Huracan',
        },
    ];
    const vehicles2 = [
        {
            id: 1,
            name: 'Tesla Model S',
            price: '$99/day',
            image: 'https://placehold.co/600x400?text=Tesla+Model+S',
            transmission: 'Automatic',
            fuelType: 'Electric',
            seats: 5,
            mileage: 'Unlimited',
            ac: true,
            isPopular: true
        },
        {
            id: 2,
            name: 'BMW M5',
            price: '$120/day',
            image: 'https://placehold.co/600x400?text=BMW+M5',
            transmission: 'Automatic',
            fuelType: 'Petrol',
            seats: 5,
            mileage: '300 mi',
            ac: true,
            isPopular: false
        },
        {
            id: 3,
            name: 'Audi A6',
            price: '$110/day',
            image: 'https://placehold.co/600x400?text=Audi+A6',
            transmission: 'Automatic',
            fuelType: 'Diesel',
            seats: 5,
            mileage: '250 mi',
            ac: true,
            isPopular: true
        },
        {
            id: 4,
            name: 'Lamborghini Huracan',
            price: '$500/day',
            image: 'https://placehold.co/600x400?text=Lamborghini+Huracan',
            transmission: 'Automatic',
            fuelType: 'Petrol',
            seats: 2,
            mileage: '150 mi',
            ac: true,
            isPopular: false
        },
        {
            id: 5,
            name: 'Toyota Camry',
            price: '$75/day',
            image: 'https://placehold.co/600x400?text=Toyota+Camry',
            transmission: 'Automatic',
            fuelType: 'Hybrid',
            seats: 5,
            mileage: '350 mi',
            ac: true,
            isPopular: true
        },
        {
            id: 6,
            name: 'Ford Mustang',
            price: '$150/day',
            image: 'https://placehold.co/600x400?text=Ford+Mustang',
            transmission: 'Manual',
            fuelType: 'Petrol',
            seats: 4,
            mileage: '200 mi',
            ac: true,
            isPopular: false
        }
    ];
    const updateArrowVisibility = () => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            const tolerance = 1; // To account for fractional pixel differences

            setShowArrows({
                left: scrollLeft > tolerance,
                right: scrollLeft < scrollWidth - clientWidth - tolerance
            });
        }
    };

    const scroll = (direction) => {
        if (carouselRef.current) {
            const { scrollLeft, clientWidth } = carouselRef.current;
            const scrollAmount = clientWidth * 0.9;

            carouselRef.current.scrollTo({
                left: direction === 'left'
                    ? scrollLeft - scrollAmount
                    : scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Initialize and update arrow visibility on scroll and resize
    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        // Initial check
        updateArrowVisibility();

        // Set up event listeners
        carousel.addEventListener('scroll', updateArrowVisibility);
        window.addEventListener('resize', updateArrowVisibility);

        return () => {
            carousel.removeEventListener('scroll', updateArrowVisibility);
            window.removeEventListener('resize', updateArrowVisibility);
        };
    }, []);

    return (

        <>

            <section className="relative flex flex-col lg:flex-row items-center justify-between px-4 md:px-6 py-10 md:py-16 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
                {/* Left Content */}
                <div className="w-full lg:w-1/2 mb-10 lg:mb-0 text-center lg:text-left">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 leading-tight">
                        Rent Your <span className="text-blue-600">Dream Car</span> Today
                    </h1>
                    <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto lg:mx-0">
                        Explore our premium collection of luxury and performance vehicles.
                        Simple booking, competitive prices, unforgettable experiences.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg">
                            Browse Cars
                        </button>
                        <button className="px-6 py-3 bg-white border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition shadow-sm">
                            View Special Offers
                        </button>
                    </div>
                </div>

                {/* Carousel Container */}
                <div className="relative w-full lg:w-1/2 max-w-2xl">
                    <div
                        ref={carouselRef}
                        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth rounded-xl shadow-xl hide-scrollbar"
                    >
                        {vehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className="flex-shrink-0 w-full snap-start p-2"
                            >
                                <div className="bg-white rounded-xl overflow-hidden shadow-lg h-full flex flex-col border border-gray-200">
                                    <img
                                        src={vehicle.image}
                                        alt={vehicle.name}
                                        className="w-full h-52 md:h-64 object-cover"
                                    />
                                    <div className="p-5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">{vehicle.name}</h3>
                                                <p className="text-blue-600 font-bold mt-1">{vehicle.price}</p>
                                            </div>
                                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                                Popular
                                            </span>
                                        </div>
                                        <button className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                                            Rent Now
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation Arrows - Conditionally Rendered */}
                    {showArrows.left && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-300"
                            aria-label="Previous"
                        >
                            <FaArrowLeft className="text-xl" />
                        </button>
                    )}
                    {showArrows.right && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all duration-300"
                            aria-label="Next"
                        >
                            <FaArrowRight className="text-xl" />
                        </button>
                    )}
                </div>
            </section>


            <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Vehicle Collection</h2>
                        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                            Choose from our premium selection of vehicles
                        </p>
                    </div>
                    <div className='flex flex-col space-y-12 '>
                        <div>
                            <div className='w-full bg-yellow-400 p-2 mb-4 rounded'>
                                <h3 className='home-cards-titles'>Vehicles near you</h3>
                            </div>

                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {vehicles2.map(vehicle => (
                                        <VehicleCard key={vehicle.id} vehicle={vehicle} />
                                    ))}
                                </div>

                                <div className="flex justify-center mt-8">
                                    <button className="explore-more-btn group">
                                        Explore more vehicles
                                        <FaArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className='w-full bg-cyan-200 p-2 mb-4 rounded'>
                                <h3 className='home-cards-titles'>Top rated vehicles</h3>
                            </div>
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {vehicles2.map(vehicle => (
                                        <VehicleCard key={vehicle.id} vehicle={vehicle} />
                                    ))}
                                </div>

                                <div className="flex justify-center mt-8">
                                    <button className="explore-more-btn group">
                                        Explore more vehicles
                                        <FaArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className='w-full bg-emerald-200 p-2 mb-4 rounded'>
                                <h3 className='home-cards-titles'>Most rented vehicles</h3>
                            </div>
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {vehicles2.map(vehicle => (
                                        <VehicleCard key={vehicle.id} vehicle={vehicle} />
                                    ))}
                                </div>
                                <div className="flex justify-center mt-8">
                                    <button className="explore-more-btn group">
                                        Explore more vehicles
                                        <FaArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className='w-full bg-indigo-200 p-2 mb-4 rounded'>
                                <h3 className='home-cards-titles'>Recommanded for you</h3>
                            </div>



                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {vehicles2.map(vehicle => (
                                        <VehicleCard key={vehicle.id} vehicle={vehicle} />
                                    ))}
                                </div>

                                <div className="flex justify-center mt-8">
                                    <button className="explore-more-btn group">
                                        Explore more vehicles
                                        <FaArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>

                        </div>

                        <div>
                            <div className='w-full bg-slate-200 p-2 mb-4 rounded'>
                                <h3 className='home-cards-titles'>Recently Viewed Vehicles</h3>
                            </div>
                            <div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {vehicles2.map(vehicle => (
                                        <VehicleCard key={vehicle.id} vehicle={vehicle} />
                                    ))}
                                </div>
                                <div className="flex justify-center mt-8">
                                    <button className="explore-more-btn group">
                                        Explore more vehicles
                                        <FaArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>


                    </div>

                </div>
            </div>




        </>

















    );
}