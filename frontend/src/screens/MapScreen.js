import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { calculateRoute } from '../redux/slices/routeSlice';

const MapScreen = ({ route }) => {
  const dispatch = useDispatch();
  const { currentTrip } = useSelector((state) => state.trip);
  const { currentRoute, loading } = useSelector((state) => state.route);
  const [selectedMode, setSelectedMode] = useState('driving');

  const transportModes = [
    { value: 'driving', label: 'Car', icon: '🚗' },
    { value: 'walking', label: 'Walk', icon: '🚶' },
    { value: 'bus', label: 'Bus', icon: '🚌' },
    { value: 'train', label: 'Train', icon: '🚆' }
  ];

  useEffect(() => {
    if (currentTrip?.origin && currentTrip?.destination) {
      dispatch(calculateRoute({
        origin: currentTrip.origin,
        destination: currentTrip.destination,
        mode: selectedMode.toUpperCase()
      }));
    }
  }, [currentTrip, selectedMode]);

  const getRegion = () => {
    if (!currentTrip?.origin || !currentTrip?.destination) {
      return {
        latitude: 37.5665,
        longitude: 126.9780,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5
      };
    }

    const minLat = Math.min(currentTrip.origin.lat, currentTrip.destination.lat);
    const maxLat = Math.max(currentTrip.origin.lat, currentTrip.destination.lat);
    const minLng = Math.min(currentTrip.origin.lng, currentTrip.destination.lng);
    const maxLng = Math.max(currentTrip.origin.lng, currentTrip.destination.lng);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5,
      longitudeDelta: (maxLng - minLng) * 1.5
    };
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={getRegion()}
      >
        {currentTrip?.origin && (
          <Marker
            coordinate={{
              latitude: currentTrip.origin.lat,
              longitude: currentTrip.origin.lng
            }}
            title={currentTrip.origin.name || 'Origin'}
            description={currentTrip.origin.address}
            pinColor="green"
          />
        )}

        {currentTrip?.destination && (
          <Marker
            coordinate={{
              latitude: currentTrip.destination.lat,
              longitude: currentTrip.destination.lng
            }}
            title={currentTrip.destination.name || 'Destination'}
            description={currentTrip.destination.address}
            pinColor="red"
          />
        )}

        {currentRoute && currentTrip?.origin && currentTrip?.destination && (
          <Polyline
            coordinates={[
              {
                latitude: currentTrip.origin.lat,
                longitude: currentTrip.origin.lng
              },
              {
                latitude: currentTrip.destination.lat,
                longitude: currentTrip.destination.lng
              }
            ]}
            strokeColor="#007AFF"
            strokeWidth={4}
          />
        )}
      </MapView>

      <View style={styles.modesContainer}>
        {transportModes.map((mode) => (
          <TouchableOpacity
            key={mode.value}
            style={[
              styles.modeButton,
              selectedMode === mode.value && styles.modeButtonActive
            ]}
            onPress={() => setSelectedMode(mode.value)}
          >
            <Text style={styles.modeIcon}>{mode.icon}</Text>
            <Text style={[
              styles.modeLabel,
              selectedMode === mode.value && styles.modeLabelActive
            ]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {currentRoute && (
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>{currentRoute.distance_km} km</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>
              {Math.floor(currentRoute.duration_minutes / 60)}h {currentRoute.duration_minutes % 60}m
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Est. Cost:</Text>
            <Text style={styles.infoValue}>
              ₩{currentRoute.estimated_cost?.toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  modesContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  modeButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minWidth: 60
  },
  modeButtonActive: {
    backgroundColor: '#007AFF'
  },
  modeIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  modeLabel: {
    fontSize: 12,
    color: '#666666'
  },
  modeLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600'
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666'
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333'
  }
});

export default MapScreen;
