import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrips } from '../redux/slices/tripSlice';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { trips, loading } = useSelector((state) => state.trip);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchTrips(user.id));
    }
  }, [user?.id]);

  const renderTripItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigation.navigate('TripDetails', { tripId: item.id })}
    >
      <View style={styles.tripHeader}>
        <Text style={styles.tripTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.tripInfo}>
        <Text style={styles.infoLabel}>From:</Text>
        <Text style={styles.infoText}>{item.origin.name || item.origin.address}</Text>
      </View>
      <View style={styles.tripInfo}>
        <Text style={styles.infoLabel}>To:</Text>
        <Text style={styles.infoText}>{item.destination.name || item.destination.address}</Text>
      </View>
      <View style={styles.tripFooter}>
        <Text style={styles.dateText}>
          {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
        </Text>
        <Text style={styles.budgetText}>
          {item.budget.toLocaleString()} {item.budget_currency}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Trips</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateTrip')}
        >
          <Text style={styles.addButtonText}>+ New Trip</Text>
        </TouchableOpacity>
      </View>

      {trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No trips yet</Text>
          <Text style={styles.emptySubtext}>Create your first trip to get started!</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333'
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16
  },
  listContainer: {
    padding: 15
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  status_planning: {
    backgroundColor: '#FFF3CD'
  },
  status_confirmed: {
    backgroundColor: '#D1ECF1'
  },
  status_ongoing: {
    backgroundColor: '#D4EDDA'
  },
  status_completed: {
    backgroundColor: '#E0E0E0'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  tripInfo: {
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2
  },
  infoText: {
    fontSize: 14,
    color: '#333333'
  },
  tripFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  dateText: {
    fontSize: 13,
    color: '#666666'
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999999',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBBBBB',
    textAlign: 'center'
  }
});

export default HomeScreen;
