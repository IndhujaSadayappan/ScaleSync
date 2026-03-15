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
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { salesService, productService, stockService } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../context/LanguageContext';

// For Web date picking
const WebDatePicker = ({ label, value, onChange }) => (
  <View style={styles.webDatePickerContainer}>
    <Text style={styles.dateLabel}>{label}</Text>
    <input
      type="date"
      value={format(value, 'yyyy-MM-dd')}
      onChange={(e) => onChange(new Date(e.target.value))}
      style={{
        padding: '8px',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#F8FAFC',
        fontSize: '14px',
        color: '#0B0F2F',
        outline: 'none',
      }}
    />
  </View>
);

const DashboardScreen = () => {
  const { t } = useLanguage();
  const [sales, setSales] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRange, setIsRange] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  // Fetch products for category filtering
  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      setAvailableProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSales = async () => {
    try {
      const params = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: isRange ? format(endDate, 'yyyy-MM-dd') : format(startDate, 'yyyy-MM-dd'),
        categories: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
      };

      const [response, stockResponse] = await Promise.all([
        salesService.getSales(params),
        stockService.getStock()
      ]);
      setSales(response.data);
      setStockItems(stockResponse.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      Alert.alert('Error', 'Failed to fetch sales data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onDateChange = (event, selectedDate, target) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      setShowEndPicker(false);
    }

    if (selectedDate) {
      if (target === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchProducts();
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true); // Set loading to true whenever filters change
      fetchSales();
    }, [startDate, endDate, selectedCategories, isRange])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const toggleCategory = (categoryName) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
    setLoading(true);
  };

  const downloadReceipt = async () => {
    if (!sales || sales.sales.length === 0) {
      Alert.alert('No Data', 'No sales records found for the selected filter.');
      return;
    }

    try {
      const dateString = isRange
        ? `${format(startDate, 'dd MMM yyyy')} to ${format(endDate, 'dd MMM yyyy')}`
        : format(startDate, 'dd MMM yyyy');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0B0F2F; padding-bottom: 15px; margin-bottom: 25px; }
            .logo { font-size: 24px; font-weight: bold; color: #0B0F2F; }
            .title { font-size: 18px; color: #64748b; text-align: right; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background: #F8FAFC; padding: 20px; border-radius: 10px; }
            .info-box h4 { margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; }
            .info-box p { margin: 4px 0 0; font-size: 18px; font-weight: bold; color: #0B0F2F; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; background: #0B0F2F; color: white; padding: 12px; font-size: 12px; }
            td { padding: 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ScaleSync</div>
            <div class="title">Sales Report<br><small>${dateString}</small></div>
          </div>
          <div class="info-grid">
            <div class="info-box"><h4>Total Earnings</h4><p>₹${parseFloat(sales.totalEarnings).toFixed(2)}</p></div>
            <div class="info-box"><h4>Transactions</h4><p>${sales.totalTransactions}</p></div>
          </div>
          <table>
            <thead>
              <tr><th>Date & Time</th><th>Product</th><th>Qty</th><th>Amount</th></tr>
            </thead>
            <tbody>
              ${sales.sales.map(s => `
                <tr>
                  <td>${format(new Date(s.created_at), 'dd MMM, hh:mm a')}</td>
                  <td>${s.product_name}</td>
                  <td>${parseFloat(s.weight).toFixed(2)} L</td>
                  <td>₹${parseFloat(s.total_amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">ScaleSync IoT Weighing System • Generated on ${format(new Date(), 'dd MMM yyyy')}</div>
        </body>
        </html>
      `;

      const result = await Print.printToFileAsync({ html: htmlContent });
      if (Platform.OS === 'web') {
        const windowProxy = window.open();
        if (windowProxy) windowProxy.location.href = result.uri;
      } else {
        await Sharing.shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (error) {
      console.error('Receipt Error:', error);
      Alert.alert('Error', 'Failed to create report.');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0B0F2F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerPane}>
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.miniTab, !isRange && styles.activeMiniTab]}
            onPress={() => setIsRange(false)}
          >
            <Text style={[styles.miniTabText, !isRange && styles.activeMiniTabText]}>{t('today')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.miniTab, isRange && styles.activeMiniTab]}
            onPress={() => setIsRange(true)}
          >
            <Text style={[styles.miniTabText, isRange && styles.activeMiniTabText]}>Range</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateSelectorRow}>
          {Platform.OS === 'web' ? (
            <View style={styles.webRow}>
              <WebDatePicker label={isRange ? "From" : "Select Date"} value={startDate} onChange={setStartDate} />
              {isRange && <WebDatePicker label="To" value={endDate} onChange={setEndDate} />}
            </View>
          ) : (
            <View style={styles.mobileDateRow}>
              <TouchableOpacity style={styles.dateBox} onPress={() => setShowStartPicker(true)}>
                <Text style={styles.dateLabel}>{isRange ? "From" : t('today')}</Text>
                <Text style={styles.dateValue}>{format(startDate, 'dd MMM')}</Text>
              </TouchableOpacity>

              {isRange && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="arrow-forward" size={14} color="#94A3B8" style={{ marginHorizontal: 8 }} />
                  <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndPicker(true)}>
                    <Text style={styles.dateLabel}>To</Text>
                    <Text style={styles.dateValue}>{format(endDate, 'dd MMM')}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showStartPicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(e, d) => onDateChange(e, d, 'start')}
                />
              )}
              {showEndPicker && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(e, d) => onDateChange(e, d, 'end')}
                />
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.filterBtn, selectedCategories.length > 0 && styles.activeFilterBtn]}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Ionicons name="filter" size={20} color={selectedCategories.length > 0 ? '#FFFFFF' : '#0B0F2F'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.mainArea}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B0F2F" />}
      >
        <View style={styles.summaryGrid}>
          <View style={styles.simpleCard}>
            <Text style={styles.cardInfoLabel}>{t('totalEarnings')}</Text>
            <Text style={styles.cardInfoValue}>₹{sales?.totalEarnings || '0.00'}</Text>
          </View>
          <View style={styles.simpleCard}>
            <Text style={styles.cardInfoLabel}>{t('transactions')}</Text>
            <Text style={styles.cardInfoValue}>{sales?.totalTransactions || 0}</Text>
          </View>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('currentStock')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stockScroll}>
          {stockItems && stockItems.length > 0 ? (
            stockItems.map((item) => (
              <View key={item.product_id} style={styles.stockCard}>
                <Text style={styles.stockCardName}>{item.product_name}</Text>
                <Text style={[styles.stockCardValue, parseFloat(item.available_stock) < 10 ? styles.stockLow : null]}>
                  {item.available_stock ? parseFloat(item.available_stock).toFixed(2) : '0.00'} L
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No stock data available</Text>
          )}
        </ScrollView>

        {selectedCategories.length > 0 && (
          <View style={styles.activeFilters}>
            {selectedCategories.map(cat => (
              <View key={cat} style={styles.tag}>
                <Text style={styles.tagText}>{cat}</Text>
                <TouchableOpacity onPress={() => toggleCategory(cat)}>
                  <Ionicons name="close-circle" size={16} color="#0B0F2F" style={{ marginLeft: 5 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{t('categoryBreakdownTitle')}</Text>
          <TouchableOpacity onPress={downloadReceipt} style={styles.reportBtn}>
            <Ionicons name="document-text-outline" size={18} color="#0B0F2F" />
            <Text style={styles.reportBtnText}>{t('pdfReport')}</Text>
          </TouchableOpacity>
        </View>

        {sales?.earningsByCategory && Object.entries(sales.earningsByCategory).map(([category, amount]) => (
          <View key={category} style={styles.listItem}>
            <Text style={styles.listItemName}>{category}</Text>
            <Text style={styles.listItemPrice}>₹{parseFloat(amount).toFixed(2)}</Text>
          </View>
        ))}

        {(!sales?.sales || sales.sales.length === 0) && (
          <Text style={styles.noDataText}>No sales found for selected criteria.</Text>
        )}
      </ScrollView>

      <Modal visible={isCategoryModalVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalT}>Select Categories</Text>
            {availableProducts.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.opt, selectedCategories.includes(p.name) && styles.optA]}
                onPress={() => toggleCategory(p.name)}
              >
                <Text style={[styles.optT, selectedCategories.includes(p.name) && styles.optTA]}>{p.name}</Text>
                {selectedCategories.includes(p.name) && <Ionicons name="checkmark" size={18} color="#0B0F2F" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.closeB} onPress={() => setCategoryModalVisible(false)}>
              <Text style={styles.closeBT}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerPane: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tabToggle: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 3, marginBottom: 15 },
  miniTab: { flex: 1, padding: 8, alignItems: 'center', borderRadius: 6 },
  activeMiniTab: { backgroundColor: '#FFFFFF', shadowOpacity: 0.1 },
  miniTabText: { fontSize: 12, color: '#94A3B8', fontWeight: 'bold' },
  activeMiniTabText: { color: '#0B0F2F' },

  dateSelectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  webRow: { flexDirection: 'row', gap: 10 },
  webDatePickerContainer: { gap: 4 },
  dateLabel: { fontSize: 10, color: '#64748B', fontWeight: 'bold' },
  mobileDateRow: { flexDirection: 'row', alignItems: 'center' },
  dateBox: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  dateValue: { fontSize: 14, fontWeight: 'bold', color: '#0B0F2F' },
  mobileNotice: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },

  filterBtn: { padding: 10, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  activeFilterBtn: { backgroundColor: '#0B0F2F' },

  mainArea: { flex: 1 },
  summaryGrid: { flexDirection: 'row', padding: 20, gap: 12, flexWrap: 'wrap' },
  simpleCard: { flex: 1, minWidth: 140, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#0B0F2F' },
  cardInfoLabel: { fontSize: 10, color: '#64748B', fontWeight: 'bold', marginBottom: 5 },
  cardInfoValue: { fontSize: 20, fontWeight: 'bold', color: '#0B0F2F' },

  activeFilters: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', padding: 6, paddingHorizontal: 12, borderRadius: 20 },
  tagText: { fontSize: 12, color: '#0B0F2F', fontWeight: 'bold' },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#0B0F2F' },
  stockScroll: { marginHorizontal: 20, marginBottom: 20 },
  stockCard: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginRight: 15, minWidth: 120, borderTopWidth: 3, borderTopColor: '#0B0F2F', elevation: 1 },
  stockCardName: { fontSize: 13, color: '#64748B', fontWeight: 'bold', marginBottom: 5 },
  stockCardValue: { fontSize: 18, fontWeight: '700', color: '#0B0F2F' },
  stockLow: { color: '#EF4444' },
  reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reportBtnText: { fontSize: 12, fontWeight: 'bold', color: '#0B0F2F' },

  listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, marginHorizontal: 20, marginBottom: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  listItemName: { fontSize: 14, color: '#334155' },
  listItemPrice: { fontSize: 14, fontWeight: 'bold', color: '#0B0F2F' },
  noDataText: { textAlign: 'center', color: '#94A3B8', marginTop: 40 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: '#FFF', borderRadius: 15, padding: 20 },
  modalT: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  opt: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderRadius: 8, marginBottom: 5 },
  optA: { backgroundColor: '#F8FAFC' },
  optT: { color: '#64748B' },
  optTA: { color: '#0B0F2F', fontWeight: 'bold' },
  closeB: { marginTop: 15, padding: 12, backgroundColor: '#0B0F2F', borderRadius: 8, alignItems: 'center' },
  closeBT: { color: '#FFF', fontWeight: 'bold' }
});

export default DashboardScreen;