import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
    Platform,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { salesService, stockService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

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
                marginTop: 4,
            }}
        />
    </View>
);

const AnalyticsScreen = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Date Filtering State
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [isRange, setIsRange] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [analyticsData, setAnalyticsData] = useState({
        totalEarnings: 0,
        categoryData: [],
        stockData: [],
    });

    const fetchAnalytics = async () => {
        try {
            const params = {
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: isRange ? format(endDate, 'yyyy-MM-dd') : format(startDate, 'yyyy-MM-dd'),
            };

            const [salesRes, stockRes] = await Promise.all([
                salesService.getSales(params),
                stockService.getStock()
            ]);

            const { totalEarnings, earningsByCategory } = salesRes.data;
            const stockItems = stockRes.data;

            // Process category sales data
            const categoryData = Object.entries(earningsByCategory).map(([name, value]) => ({
                name,
                value: parseFloat(value),
                color: getRandomColor(name),
            })).sort((a, b) => b.value - a.value);

            // Process stock data
            const stockData = stockItems.map(item => ({
                name: item.product_name,
                value: parseFloat(item.available_stock || 0),
                color: parseFloat(item.available_stock || 0) <= 0 ? '#EF4444' : '#10B981',
            }));

            // Check for zero stock
            const zeroStockItems = stockItems.filter(item => parseFloat(item.available_stock || 0) <= 0);
            if (zeroStockItems.length > 0) {
                // We show a notice in the UI, but can also do a one-time alert
                console.log("Zero stock detected:", zeroStockItems.map(i => i.product_name));
            }

            setAnalyticsData({
                totalEarnings,
                categoryData,
                stockData,
            });
        } catch (error) {
            console.error('Analytics Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getRandomColor = (name) => {
        const colors = ['#0B0F2F', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchAnalytics();
        }, [startDate, endDate, isRange])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
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

    if (loading && !refreshing) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0B0F2F" />
            </View>
        );
    }

    const zeroStockItems = analyticsData.stockData.filter(i => i.value <= 0);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B0F2F" />}
        >
            {/* Date Filter Selection */}
            <View style={styles.filterPane}>
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
                            <WebDatePicker label={isRange ? t('from') : t('selectDate')} value={startDate} onChange={setStartDate} />
                            {isRange && <WebDatePicker label={t('to')} value={endDate} onChange={setEndDate} />}
                        </View>
                    ) : (
                        <View style={styles.mobileDateRow}>
                            <TouchableOpacity style={styles.dateBox} onPress={() => setShowStartPicker(true)}>
                                <Text style={styles.dateLabel}>{isRange ? t('from') : t('selectDate')}</Text>
                                <Text style={styles.dateValue}>{format(startDate, 'dd MMM')}</Text>
                            </TouchableOpacity>

                            {isRange && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="arrow-forward" size={14} color="#94A3B8" style={{ marginHorizontal: 8 }} />
                                    <TouchableOpacity style={styles.dateBox} onPress={() => setShowEndPicker(true)}>
                                        <Text style={styles.dateLabel}>{t('to')}</Text>
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
                </View>
            </View>

            {/* Zero Stock Alert Banner */}
            {zeroStockItems.length > 0 && (
                <View style={styles.alertBanner}>
                    <Ionicons name="warning" size={20} color="#FFF" />
                    <Text style={styles.alertText}>
                        {t('zeroStockAlert')} ({zeroStockItems.map(i => i.name).join(', ')})
                    </Text>
                </View>
            )}

            {/* Sales Category Bar Chart */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('categoryBreakdown')}</Text>
                <View style={styles.chartArea}>
                    {analyticsData.categoryData.length > 0 ? (
                        analyticsData.categoryData.map((item) => (
                            <View key={item.name} style={styles.barItem}>
                                <View style={styles.barHeader}>
                                    <Text style={styles.barName}>{item.name}</Text>
                                    <Text style={styles.barValue}>₹{item.value.toFixed(0)}</Text>
                                </View>
                                <View style={styles.barTrack}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            {
                                                width: `${(item.value / (analyticsData.totalEarnings || 1)) * 100}%`,
                                                backgroundColor: item.color
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>{t('noSales')}</Text>
                    )}
                </View>
            </View>

            {/* Stock Levels Column/Bar Chart */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('stockLevels')}</Text>
                <View style={styles.chartArea}>
                    {analyticsData.stockData.length > 0 ? (
                        analyticsData.stockData.map((item) => (
                            <View key={item.name} style={styles.barItem}>
                                <View style={styles.barHeader}>
                                    <Text style={styles.barName}>{item.name}</Text>
                                    <Text style={[styles.barValue, item.value <= 0 && { color: '#EF4444' }]}>
                                        {item.value.toFixed(2)} L
                                    </Text>
                                </View>
                                <View style={styles.barTrack}>
                                    <View
                                        style={[
                                            styles.barFill,
                                            {
                                                width: `${Math.min((item.value / 200) * 100, 100)}%`, // Capped at 200L for visual reference
                                                backgroundColor: item.color
                                            }
                                        ]}
                                    />
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No stock data</Text>
                    )}
                </View>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
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
    },
    filterPane: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        marginBottom: 15,
    },
    tabToggle: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    miniTab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10,
    },
    activeMiniTab: {
        backgroundColor: '#FFFFFF',
        elevation: 2,
    },
    miniTabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748B',
    },
    activeMiniTabText: {
        color: '#0B0F2F',
    },
    dateSelectorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mobileDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    dateBox: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    dateLabel: {
        fontSize: 11,
        color: '#94A3B8',
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    dateValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#0B0F2F',
        marginTop: 2,
    },
    webRow: {
        flexDirection: 'row',
        gap: 15,
        flex: 1,
    },
    webDatePickerContainer: {
        flex: 1,
    },
    alertBanner: {
        backgroundColor: '#EF4444',
        marginHorizontal: 20,
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
    },
    alertText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
        flex: 1,
    },
    section: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0B0F2F',
        marginBottom: 20,
    },
    chartArea: {
        minHeight: 100,
    },
    barItem: {
        marginBottom: 18,
    },
    barHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    barName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    barValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0B0F2F',
    },
    barTrack: {
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        paddingVertical: 20,
    }
});

export default AnalyticsScreen;
