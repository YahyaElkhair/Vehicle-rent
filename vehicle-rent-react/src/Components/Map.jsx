// src/components/Map.jsx
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FaCarAlt } from 'react-icons/fa';
import { createRoot } from 'react-dom/client';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export default function Map({
    agencyCoords,
    deliveryOption,
    userLocation,
    deliveryLocation,
    onDeliveryLocationChange,
    onRouteCalculated,
    className = '',
}) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [currentUserLocation, setCurrentUserLocation] = useState(null);
    const [routeLoading, setRouteLoading] = useState(false);

    // Get user's location
    useEffect(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = [pos.coords.longitude, pos.coords.latitude];
                setCurrentUserLocation(coords);
                if (deliveryOption === 'home delivery') {
                    onDeliveryLocationChange(coords);
                }
            },
            (err) => {
                console.warn('⚠️ Location error, using fallback.', err);
                const fallback = [-7.62, 33.59];
                setCurrentUserLocation(fallback);
                if (deliveryOption === 'home delivery') {
                    onDeliveryLocationChange(fallback);
                }
            }
        );
    }, [deliveryOption, onDeliveryLocationChange]);

    // Initialize map
    useEffect(() => {
        if (mapRef.current) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: agencyCoords || [-7.0926, 31.7917],
            zoom: 13,
        });

        mapRef.current = map;
        map.addControl(new mapboxgl.NavigationControl());
    }, [agencyCoords]);

    // Add agency marker (custom styled)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || !agencyCoords) return;

        const agencyMarkerEl = document.createElement('div');
        agencyMarkerEl.className = 'group w-10 h-10';

        const root = createRoot(agencyMarkerEl);
        root.render(
            <div className="relative w-full h-full">
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-red-500 opacity-70 animate-ping" />
                </div>
                <div className="w-6 h-6 bg-white rounded-full shadow-md ring-2 ring-red-500 flex items-center justify-center z-10 transition-transform duration-300 group-hover:scale-110">
                    <FaCarAlt className="text-red-600 text-xs" />
                </div>
            </div>
        );

        new mapboxgl.Marker(agencyMarkerEl)
            .setLngLat(agencyCoords)
            .setPopup(new mapboxgl.Popup().setText('Agency Location'))
            .addTo(map);
    }, [agencyCoords]);

    // Add delivery marker (draggable)
    useEffect(() => {
        const map = mapRef.current;
        if (!map || deliveryOption !== 'home delivery' || !deliveryLocation) return;

        if (markerRef.current) markerRef.current.remove();

        const userMarkerEl = document.createElement('div');
        userMarkerEl.innerHTML = `
            <div class="relative flex items-center justify-center">
                <span class="absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-75 animate-ping"></span>
                <span class="relative inline-flex rounded-full h-4 w-4 bg-blue-600 shadow-md"></span>
            </div>
        `;

        markerRef.current = new mapboxgl.Marker(userMarkerEl, { draggable: true })
            .setLngLat(deliveryLocation)
            .addTo(map);

        markerRef.current.on('dragend', () => {
            const lngLat = markerRef.current.getLngLat();
            const newCoords = [lngLat.lng, lngLat.lat];
            onDeliveryLocationChange(newCoords);
        });
    }, [deliveryLocation, deliveryOption, onDeliveryLocationChange]);

    // Draw route
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const rawOrigin = deliveryOption === 'home delivery'
            ? agencyCoords
            : currentUserLocation || userLocation;

        const rawDestination = deliveryOption === 'home delivery'
            ? deliveryLocation
            : agencyCoords;

        const origin = rawOrigin?.map(Number);
        const destination = rawDestination?.map(Number);


        if (
            !origin || !destination ||
            origin.length !== 2 || destination.length !== 2 ||
            origin.some(isNaN) || destination.some(isNaN)
        ) {
            console.warn('⚠️ Invalid coordinates.', { origin, destination });
            return;
        }

        const getRoute = async () => {
            setRouteLoading(true);
            try {
                const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;

                const response = await fetch(url);
                const data = await response.json();

                if (!data.routes?.[0]?.geometry) {
                    console.error('❌ No valid route found:', data);
                    return;
                }

                const route = data.routes[0].geometry;
                const distance = data.routes[0].distance / 1000;

                if (map.getLayer('route')) map.removeLayer('route');
                if (map.getSource('route')) map.removeSource('route');

                map.addSource('route', {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: route },
                });

                map.addLayer({
                    id: 'route',
                    type: 'line',
                    source: 'route',
                    layout: { 'line-join': 'round', 'line-cap': 'round' },
                    paint: {
                        'line-color': '#3b82f6',
                        'line-width': 6,
                        'line-opacity': 0.9,
                    },
                });

                const bounds = new mapboxgl.LngLatBounds();
                route.coordinates.forEach(coord => bounds.extend(coord));
                map.fitBounds(bounds, { padding: 60 });

                onRouteCalculated({ distance });
            } catch (err) {
                console.error('🔥 Error fetching route from Mapbox:', err);
            } finally {
                setRouteLoading(false);
            }
        };

        getRoute();
    }, [
        deliveryOption,
        agencyCoords,
        currentUserLocation,
        userLocation,
        deliveryLocation,
        onRouteCalculated,
    ]);

    return (
        <div className="relative w-full h-full">
            {/* Map container */}
            <div ref={mapContainerRef} className={`rounded-xl shadow-lg ${className}`} />

            {/* Loading Spinner Overlay */}
            {routeLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-50">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
                </div>
            )}
        </div>
    );
}
