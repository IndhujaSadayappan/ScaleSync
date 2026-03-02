import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { salesService } from '../services/api';

const DashboardScreen = () => {
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSales = async () => {
    try {
      const response = await salesService.getSales('today');
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      Alert.alert('Error', 'Failed to fetch sales data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
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
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B0F2F" />
      }
    >


      {/* Total Earnings */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total Earnings</Text>
        <Text style={styles.cardValue}>
          ₹{sales?.totalEarnings ? parseFloat(sales.totalEarnings).toFixed(2) : '0.00'}
        </Text>
      </View>

      {/* Total Transactions */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total Transactions</Text>
        <Text style={styles.cardValue}>
          {sales?.totalTransactions ?? 0}
        </Text>
      </View>

      {/* Earnings by Product */}
      <Text style={styles.subtitle}>Earnings by Product</Text>
      {sales?.earningsByCategory &&
        Object.entries(sales.earningsByCategory).map(([category, amount]) => (
          <View key={category} style={styles.categoryCard}>
            <Text style={styles.categoryName}>{category}</Text>
            <Text style={styles.categoryAmount}>
              ₹{parseFloat(amount).toFixed(2)}
            </Text>
          </View>
        ))}

      {/* Recent Sales */}
      <Text style={styles.subtitle}>Recent Sales</Text>
      {sales?.sales && sales.sales.length > 0 ? (
        sales.sales.slice(0, 10).map((sale) => (
          <View key={sale.id} style={styles.saleCard}>
            <View style={styles.saleInfo}>
              <Text style={styles.saleProduct}>
                {sale.product_name}
              </Text>
              <Text style={styles.saleDetail}>
                {parseFloat(sale.weight).toFixed(2)} L
              </Text>
            </View>
            <Text style={styles.saleAmount}>
              ₹{sale.total_amount ? parseFloat(sale.total_amount).toFixed(2) : '0.00'}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No sales today</Text>
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

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  cardLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },

  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B0F2F',
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
    marginHorizontal: 20,
    color: '#0B0F2F',
  },

  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  categoryName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },

  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B0F2F',
  },

  saleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  saleInfo: {
    flex: 1,
  },

  saleProduct: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  saleDetail: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B0F2F',
  },

  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 15,
    marginTop: 20,
  },
});

export default DashboardScreen;