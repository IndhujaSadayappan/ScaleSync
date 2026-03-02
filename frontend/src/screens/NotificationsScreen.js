import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { salesService } from '../services/api';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await salesService.getSales();
      setNotifications(response.data.sales || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to fetch notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0B0F2F" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B0F2F" />}
    >


      {notifications && notifications.length > 0 ? (
        notifications.map((notification) => (
          <View key={notification.id} style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Text style={styles.productName}>{notification.product_name}</Text>
              <Text style={styles.timestamp}>
                {new Date(notification.created_at).toLocaleTimeString()}
              </Text>
            </View>
            <View style={styles.notificationDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Weight:</Text>
                <Text style={styles.value}>{parseFloat(notification.weight).toFixed(2)} L</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.label}>Amount:</Text>
                <Text style={styles.value}>
                  ₹{parseFloat(notification.total_amount).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No notifications yet</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0B0F2F',
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    marginTop: 12,
    marginHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0B0F2F',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  productName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  notificationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  detailItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B0F2F',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 16,
    marginTop: 50,
  },
});

export default NotificationsScreen;
