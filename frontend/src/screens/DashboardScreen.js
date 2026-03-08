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
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { salesService, productService } from '../services/api';

const DashboardScreen = () => {
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isRange, setIsRange] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('start'); // 'start' or 'end'

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

      const response = await salesService.getSales(params);
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
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, selectedCategories, isRange]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const showPicker = (target) => {
    setPickerTarget(target);
    setPickerVisible(true);
  };

  const handleDateConfirm = (date) => {
    setPickerVisible(false);
    if (pickerTarget === 'start') {
      setStartDate(date);
      if (date > endDate) setEndDate(date);
    } else {
      setEndDate(date);
      if (date < startDate) setStartDate(date);
    }
    setLoading(true);
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

      const logoSvg = `<svg width="80" height="80" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="#0B0F2F" />
        <path d="M30 70 L50 30 L70 70" stroke="white" stroke-width="5" fill="none" />
        <rect x="40" y="55" width="20" height="15" fill="#059669" />
      </svg>`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .logo-section { width: 100px; }
            .company-info h1 { margin: 0; color: #0B0F2F; font-size: 28px; letter-spacing: 1px; }
            .company-info p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
            .receipt-summary { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; border: 1px solid #e2e8f0; }
            .summary-item label { display: block; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 5px; font-weight: bold; }
            .summary-item span { font-size: 20px; font-weight: 800; color: #0f172a; }
            .sales-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .sales-table th { background: #0f172a; color: white; text-align: left; padding: 12px 15px; font-size: 13px; text-transform: uppercase; }
            .sales-table td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .sales-table tr:nth-child(even) { background-color: #f9fafb; }
            .category-list { margin-top: 25px; padding: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; }
            .category-list h3 { margin: 0 0 10px; font-size: 16px; color: #0f172a; }
            .category-grid { display: flex; flex-wrap: wrap; gap: 15px; }
            .cat-pill { font-size: 13px; color: #475569; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="company-info">
              <h1>SCALERSYNC</h1>
              <p>Generated Report • ${dateString}</p>
            </div>
            <div class="logo-section">${logoSvg}</div>
          </div>

          <div class="receipt-summary">
            <div class="summary-item">
              <label>Total Earnings</label>
              <span>₹${parseFloat(sales.totalEarnings).toFixed(2)}</span>
            </div>
            <div class="summary-item">
              <label>Total Sales</label>
              <span>${sales.totalTransactions} Items</span>
            </div>
          </div>

          <h3>Detailed Sales Log</h3>
          <table class="sales-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Product Category</th>
                <th>Qty (L)</th>
                <th>Total Amt</th>
              </tr>
            </thead>
            <tbody>
              ${sales.sales.map(s => `
                <tr>
                  <td>${format(new Date(s.created_at), 'dd MMM, hh:mm a')}</td>
                  <td><strong>${s.product_name}</strong></td>
                  <td>${parseFloat(s.weight).toFixed(2)} L</td>
                  <td>₹${parseFloat(s.total_amount).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="category-list">
            <h3>Earnings Breakdown</h3>
            <div class="category-grid">
              ${Object.entries(sales.earningsByCategory).map(([cat, amt]) => `
                <div class="cat-pill"><strong>${cat}:</strong> ₹${parseFloat(amt).toFixed(2)}</div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>ScaleSync IoT Weighing System • This is a computer generated report</p>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Receipt Error:', error);
      Alert.alert('Error', 'Failed to create report');
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
      {/* Search Header */}
      <View style={styles.searchPane}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, !isRange && styles.activeTab]}
            onPress={() => { setIsRange(false); setLoading(true); }}
          >
            <Text style={[styles.tabText, !isRange && styles.activeTabText]}>Single Date</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, isRange && styles.activeTab]}
            onPress={() => { setIsRange(true); setLoading(true); }}
          >
            <Text style={[styles.tabText, isRange && styles.activeTabText]}>Date Range</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <View style={styles.dateControls}>
            <TouchableOpacity style={styles.dateBox} onPress={() => showPicker('start')}>
              <Text style={styles.dateBoxLabel}>{isRange ? 'From' : 'Date'}</Text>
              <Text style={styles.dateBoxValue}>{format(startDate, 'dd MMM')}</Text>
            </TouchableOpacity>

            {isRange && (
              <>
                <Ionicons name="arrow-forward" size={16} color="#94A3B8" style={{ marginHorizontal: 8 }} />
                <TouchableOpacity style={styles.dateBox} onPress={() => showPicker('end')}>
                  <Text style={styles.dateBoxLabel}>To</Text>
                  <Text style={styles.dateBoxValue}>{format(endDate, 'dd MMM')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.catBtn, selectedCategories.length > 0 && styles.activeCatBtn]}
            onPress={() => setCategoryModalVisible(true)}
          >
            <Ionicons name="options-outline" size={20} color={selectedCategories.length > 0 ? '#FFFFFF' : '#0B0F2F'} />
            {selectedCategories.length > 0 && (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{selectedCategories.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B0F2F" />}
      >
        {/* Analytics Summary */}
        <View style={styles.statCards}>
          <View style={[styles.statCard, { backgroundColor: '#0B0F2F' }]}>
            <Text style={[styles.statLabel, { color: '#94A3B8' }]}>NET EARNINGS</Text>
            <Text style={[styles.statValue, { color: '#FFFFFF' }]}>₹{sales?.totalEarnings || '0.00'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL ITEMS</Text>
            <Text style={[styles.statValue, { color: '#0B0F2F' }]}>{sales?.totalTransactions || 0}</Text>
          </View>
        </View>

        {/* Categories Chip Row (Scrollable) */}
        {selectedCategories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {selectedCategories.map(cat => (
              <TouchableOpacity key={cat} style={styles.activeChip} onPress={() => toggleCategory(cat)}>
                <Text style={styles.activeChipText}>{cat}</Text>
                <Ionicons name="close-circle" size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <TouchableOpacity onPress={downloadReceipt} style={styles.actionIcon}>
            <Ionicons name="cloud-download-outline" size={22} color="#0B0F2F" />
            <Text style={styles.actionText}>Report</Text>
          </TouchableOpacity>
        </View>

        {/* Category Breakdown */}
        {sales?.earningsByCategory && Object.keys(sales.earningsByCategory).length > 0 ? (
          Object.entries(sales.earningsByCategory).map(([category, amount]) => (
            <View key={category} style={styles.dataCard}>
              <View style={styles.dataCardInfo}>
                <Text style={styles.dataCardName}>{category}</Text>
                <Text style={styles.dataCardAmount}>₹{parseFloat(amount).toFixed(2)}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '70%', backgroundColor: '#0B0F2F' }]} />
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No sales data found</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal visible={isCategoryModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Categories</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {availableProducts.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={[styles.catOption, selectedCategories.includes(product.name) && styles.catOptionActive]}
                  onPress={() => toggleCategory(product.name)}
                >
                  <Text style={[styles.catOptionText, selectedCategories.includes(product.name) && styles.catOptionTextActive]}>
                    {product.name}
                  </Text>
                  {selectedCategories.includes(product.name) && (
                    <Ionicons name="checkmark-circle" size={20} color="#0B0F2F" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={styles.modalBtnText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode="date"
        date={pickerTarget === 'start' ? startDate : endDate}
        maximumDate={new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },

  // Search Pane
  searchPane: { backgroundColor: '#FFFFFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabBar: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginBottom: 15 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFFFFF', elevation: 2, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  activeTabText: { color: '#0B0F2F' },

  filterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateControls: { flexDirection: 'row', alignItems: 'center' },
  dateBox: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  dateBoxLabel: { fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 2 },
  dateBoxValue: { fontSize: 13, fontWeight: '700', color: '#0B0F2F' },

  catBtn: { width: 44, height: 44, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  activeCatBtn: { backgroundColor: '#0B0F2F', borderColor: '#0B0F2F' },
  catBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#EF4444', minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FFF' },
  catBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  // Content Area
  scrollArea: { flex: 1 },
  statCards: { flexDirection: 'row', padding: 20, gap: 15 },
  statCard: { flex: 1, padding: 20, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { fontSize: 11, fontWeight: '800', marginBottom: 8, color: '#64748B', letterSpacing: 1 },
  statValue: { fontSize: 28, fontWeight: '900' },

  chipScroll: { paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row' },
  activeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B0F2F', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  activeChipText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  actionIcon: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#0B0F2F' },

  dataCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 12, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  dataCardInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dataCardName: { fontSize: 15, fontWeight: '700', color: '#334155' },
  dataCardAmount: { fontSize: 16, fontWeight: '800', color: '#0B0F2F' },
  progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#94A3B8', marginTop: 12, fontSize: 15, fontWeight: '500' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  catOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  catOptionActive: { backgroundColor: '#F1F5F9', borderColor: '#0B0F2F' },
  catOptionText: { fontSize: 15, color: '#475569', fontWeight: '600' },
  catOptionTextActive: { color: '#0B0F2F', fontWeight: '800' },
  modalBtn: { backgroundColor: '#0B0F2F', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 20 },
  modalBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});

export default DashboardScreen;