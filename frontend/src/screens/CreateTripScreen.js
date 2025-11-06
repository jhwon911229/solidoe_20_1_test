import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { createTrip } from '../redux/slices/tripSlice';

const CreateTripScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.trip);

  const [formData, setFormData] = useState({
    title: '',
    origin: {
      address: '',
      lat: 37.5665,
      lng: 126.9780,
      name: 'Seoul'
    },
    destination: {
      address: '',
      lat: 35.1796,
      lng: 129.0756,
      name: 'Busan'
    },
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    budget: '',
    budget_currency: 'KRW',
    travelers_count: '1'
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.budget) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await dispatch(createTrip({
        ...formData,
        budget: parseFloat(formData.budget),
        travelers_count: parseInt(formData.travelers_count)
      })).unwrap();

      Alert.alert('Success', 'Trip created successfully!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error || 'Failed to create trip');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trip Information</Text>

        <Text style={styles.label}>Trip Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Summer Vacation to Busan"
          value={formData.title}
          onChangeText={(text) => setFormData({ ...formData, title: text })}
        />

        <Text style={styles.label}>Number of Travelers</Text>
        <TextInput
          style={styles.input}
          placeholder="1"
          keyboardType="numeric"
          value={formData.travelers_count}
          onChangeText={(text) => setFormData({ ...formData, travelers_count: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locations</Text>

        <Text style={styles.label}>Origin City</Text>
        <TextInput
          style={styles.input}
          placeholder="Seoul"
          value={formData.origin.name}
          onChangeText={(text) => setFormData({
            ...formData,
            origin: { ...formData.origin, name: text, address: text }
          })}
        />

        <Text style={styles.label}>Destination City</Text>
        <TextInput
          style={styles.input}
          placeholder="Busan"
          value={formData.destination.name}
          onChangeText={(text) => setFormData({
            ...formData,
            destination: { ...formData.destination, name: text, address: text }
          })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dates</Text>

        <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2024-01-01"
          value={formData.start_date}
          onChangeText={(text) => setFormData({ ...formData, start_date: text })}
        />

        <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2024-01-07"
          value={formData.end_date}
          onChangeText={(text) => setFormData({ ...formData, end_date: text })}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget</Text>

        <Text style={styles.label}>Budget Amount (KRW) *</Text>
        <TextInput
          style={styles.input}
          placeholder="1000000"
          keyboardType="numeric"
          value={formData.budget}
          onChangeText={(text) => setFormData({ ...formData, budget: text })}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Creating...' : 'Create Trip'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA'
  },
  submitButton: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC'
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default CreateTripScreen;
