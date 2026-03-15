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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { salesService } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

const { width } = Dimensions.get('window');

const AnalyticsScreen = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterType, setFilterType] = useState('daily'); // 'daily', 'monthly'
    const [analyticsData, setAnalyticsData] = useState({
        totalEarnings: 0,
        totalTransactions: 0,
        categoryData: [],
        sales: [],
    });

    const fetchAnalytics = async () => {
        try {
            const now = new Date();
            let start, end;

            if (filterType === 'daily') {
                start = format(startOfDay(now), 'yyyy-MM-dd');
                end = format(endOfDay(now), 'yyyy-MM-dd');
            } else {
                start = format(startOfMonth(now), 'yyyy-MM-dd');
                end = format(endOfMonth(now), 'yyyy-MM-dd');
            }

            const response = await salesService.getSales({
                startDate: start,
                endDate: end,
            });

            const { sales, totalEarnings, totalTransactions, earningsByCategory } = response.data;

            // Process category data
            const categoryData = Object.entries(earningsByCategory).map(([name, value]) => ({
                name,
                value: parseFloat(value),
                color: getRandomColor(name),
            })).sort((a, b) => b.value - a.value);

            setAnalyticsData({
                totalEarnings,
                totalTransactions,
                categoryData,
                sales: sales || [],
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
        }, [filterType])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchAnalytics();
    };

    if (loading && !refreshing) {
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
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterBtn, filterType === 'daily' && styles.activeFilterBtn]}
                    onPress={() => setFilterType('daily')}
                >
                    <Text style={[styles.filterText, filterType === 'daily' && styles.activeFilterText]}>{t('today')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterBtn, filterType === 'monthly' && styles.activeFilterBtn]}
                    onPress={() => setFilterType('monthly')}
                >
                    <Text style={[styles.filterText, filterType === 'monthly' && styles.activeFilterText]}>{t('thisMonth')}</Text>
                </TouchableOpacity>
            </View>

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

            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
                        <Ionicons name="wallet-outline" size={24} color="#4338CA" />
                    </View>
                    <Text style={styles.statLabel}>{t('revenue')}</Text>
                    <Text style={styles.statValue}>₹{parseFloat(analyticsData.totalEarnings).toLocaleString('en-IN')}</Text>
                </View>

                <View style={styles.statCard}>
                    <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons name="cart-outline" size={24} color="#15803D" />
                    </View>
                    <Text style={styles.statLabel}>{t('orders')}</Text>
                    <Text style={styles.statValue}>{analyticsData.totalTransactions}</Text>
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
    filterContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        marginTop: 10,
    },
    filterBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
    },
    activeFilterBtn: {
        backgroundColor: '#0B0F2F',
        borderColor: '#0B0F2F',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        elevation: 3,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0B0F2F',
        marginTop: 4,
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
