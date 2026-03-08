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
  TouchableOpacity,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { salesService } from '../services/api';

const DashboardScreen = () => {
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const fetchSales = async (date = selectedDate) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      // If it's today, we can use 'today' or the date. Let's just use the date.
      const response = await salesService.getSales(formattedDate);
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
  }, [selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    hideDatePicker();
    setSelectedDate(date);
    setLoading(true);
  };

  const downloadReceipt = async () => {
    if (!sales || sales.sales.length === 0) {
      Alert.alert('No Data', 'No sales data to download for this date.');
      return;
    }

    try {
      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #0B0F2F; padding-bottom: 10px; margin-bottom: 20px; }
              .header h1 { color: #0B0F2F; margin: 0; }
              .receipt-info { margin-bottom: 20px; }
              .summary { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
              .summary-label { font-weight: bold; }
              .table { width: 100%; border-collapse: collapse; }
              .table th, .table td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; }
              .table th { background-color: #0B0F2F; color: white; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>SaleSync - Sale Receipt</h1>
              <p>Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
            </div>
            <div class="receipt-info">
              <p><strong>Date:</strong> ${format(selectedDate, 'dd MMMM yyyy')}</p>
            </div>
            <div class="summary">
              <div class="summary-item">
                <span class="summary-label">Total Earnings:</span>
                <span>₹${parseFloat(sales.totalEarnings).toFixed(2)}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Total Transactions:</span>
                <span>${sales.totalTransactions}</span>
              </div>
            </div>
            <h3>Earnings by Category</h3>
            <ul>
              ${Object.entries(sales.earningsByCategory).map(([cat, amt]) => `
                <li><strong>${cat}:</strong> ₹${parseFloat(amt).toFixed(2)}</li>
              `).join('')}
            </ul>
            <h3>Sales Details</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                ${sales.sales.map(sale => `
                  <tr>
                    <td>${sale.product_name}</td>
                    <td>${parseFloat(sale.weight).toFixed(2)} L</td>
                    <td>₹${parseFloat(sale.total_amount).toFixed(2)}</td>
                    <td>${format(new Date(sale.created_at), 'HH:mm')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Powered by SaleSync</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate receipt');
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0B0F2F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Date Selector Header */}
      <View style={styles.dateHeader}>
        <TouchableOpacity style={styles.datePickerButton} onPress={showDatePicker}>
          <Ionicons name="calendar-outline" size={20} color="#0B0F2F" style={{ marginRight: 8 }} />
          <Text style={styles.dateText}>{format(selectedDate, 'dd MMM yyyy')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.downloadButton} onPress={downloadReceipt}>
          <Ionicons name="download-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.downloadText}>Receipt</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
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
        {sales?.earningsByCategory && Object.keys(sales.earningsByCategory).length > 0 ? (
          Object.entries(sales.earningsByCategory).map(([category, amount]) => (
            <View key={category} style={styles.categoryCard}>
              <Text style={styles.categoryName}>{category}</Text>
              <Text style={styles.categoryAmount}>
                ₹{parseFloat(amount).toFixed(2)}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No earnings from products</Text>
        )}

        {/* Recent Sales */}
        <Text style={styles.subtitle}>Sales Details</Text>
        {sales?.sales && sales.sales.length > 0 ? (
          sales.sales.map((sale) => (
            <View key={sale.id} style={styles.saleCard}>
              <View style={styles.saleInfo}>
                <Text style={styles.saleProduct}>{sale.product_name}</Text>
                <Text style={styles.saleDetail}>
                  {parseFloat(sale.weight).toFixed(2)} L • {format(new Date(sale.created_at), 'hh:mm a')}
                </Text>
              </View>
              <Text style={styles.saleAmount}>
                ₹{sale.total_amount ? parseFloat(sale.total_amount).toFixed(2) : '0.00'}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No sales recorded for this date</Text>
        )}
      </ScrollView>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        date={selectedDate}
        maximumDate={new Date()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },

  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B0F2F',
  },

  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F2F',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  downloadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  scrollContent: {
    flex: 1,
  },

  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  cardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  cardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0B0F2F',
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 12,
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
    borderColor: '#E2E8F0',
  },

  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },

  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
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
    borderColor: '#E2E8F0',
  },

  saleInfo: {
    flex: 1,
  },

  saleProduct: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  saleDetail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },

  saleAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669', // Green for amount
  },

  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 30,
    marginBottom: 40,
    fontStyle: 'italic',
  },
});

export default DashboardScreen;