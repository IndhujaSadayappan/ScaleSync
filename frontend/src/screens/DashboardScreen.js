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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Today's Performance</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total Earnings</Text>
        <Text style={styles.cardValue}>${sales?.totalEarnings || '0.00'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Total Transactions</Text>
        <Text style={styles.cardValue}>{sales?.totalTransactions || 0}</Text>
      </View>

      <Text style={styles.subtitle}>Earnings by Product</Text>
      {sales?.earningsByCategory &&
        Object.entries(sales.earningsByCategory).map(([category, amount]) => (
          <View key={category} style={styles.categoryCard}>
            <Text style={styles.categoryName}>{category}</Text>
            <Text style={styles.categoryAmount}>${parseFloat(amount).toFixed(2)}</Text>
          </View>
        ))}

      <Text style={styles.subtitle}>Recent Sales</Text>
      {sales?.sales && sales.sales.length > 0 ? (
        sales.sales.slice(0, 10).map((sale) => (
          <View key={sale.id} style={styles.saleCard}>
            <View style={styles.saleInfo}>
              <Text style={styles.saleProduct}>{sale.product_name}</Text>
              <Text style={styles.saleDetail}>{parseFloat(sale.weight).toFixed(2)}kg</Text>
            </View>
            <Text style={styles.saleAmount}>${parseFloat(sale.total_amount).toFixed(2)}</Text>
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
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: '#333',
  },
  categoryCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  saleCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleInfo: {
    flex: 1,
  },
  saleProduct: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  saleDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  saleAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
  },
});

export default DashboardScreen;
