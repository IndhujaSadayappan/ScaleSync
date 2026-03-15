import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { stockService, productService } from '../services/api';

const StockScreen = () => {
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editStock, setEditStock] = useState('');

    const fetchData = async () => {
        try {
            const response = await stockService.getStock();
            setStockItems(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleEdit = (item) => {
        setEditingId(item.product_id);
        setEditStock(item.available_stock ? item.available_stock.toString() : '0');
    };

    const handleSave = async (id) => {
        if (!editStock || isNaN(editStock)) {
            Alert.alert('Error', 'Please enter a valid stock amount');
            return;
        }

        try {
            await stockService.updateStock(id, parseFloat(editStock));
            setEditingId(null);
            fetchData();
            Alert.alert('Success', 'Stock updated successfully');
        } catch (error) {
            console.error('Error updating stock:', error);
            Alert.alert('Error', 'Failed to update stock');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditStock('');
    };

    const handleDelete = (id, name) => {
        Alert.alert(
            'Delete Stock',
            `Are you sure you want to delete ${name}? This will also remove the product and its sales history.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await productService.deleteProduct(id);
                            fetchData();
                            Alert.alert('Success', 'Stock deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete stock');
                        }
                    }
                }
            ]
        );
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
            {stockItems && stockItems.length > 0 ? (
                stockItems.map((item) => (
                    <View key={item.product_id} style={styles.productCard}>
                        <Text style={styles.productName}>{item.product_name}</Text>

                        {editingId === item.product_id ? (
                            <View style={styles.editContainer}>
                                <TextInput
                                    style={styles.stockInput}
                                    value={editStock}
                                    onChangeText={setEditStock}
                                    placeholder="Enter total stock (L)"
                                    keyboardType="decimal-pad"
                                    placeholderTextColor="#999"
                                />
                                <View style={styles.buttonGroup}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.saveButton]}
                                        onPress={() => handleSave(item.product_id)}
                                    >
                                        <Text style={styles.buttonText}>Save</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={handleCancel}
                                    >
                                        <Text style={styles.buttonText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.stockContainer}>
                                <Text style={styles.stockText}>
                                    {item.available_stock ? parseFloat(item.available_stock).toFixed(2) : '0.00'} L
                                </Text>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={styles.editButton}
                                        onPress={() => handleEdit(item)}
                                    >
                                        <Text style={styles.editButtonText}>Update Stock</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDelete(item.product_id, item.product_name)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                ))
            ) : (
                <Text style={styles.emptyText}>No stock records found</Text>
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
    productCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    productName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    stockContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stockText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#0B0F2F',
    },
    editButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0B0F2F',
    },
    editButtonText: {
        color: '#0B0F2F',
        fontWeight: 'bold',
    },
    editContainer: {
        marginTop: 10,
    },
    stockInput: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    buttonGroup: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    saveButton: {
        backgroundColor: '#fbfcffff',
        borderColor: '#0B0F2F',
        borderWidth: 1,
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    buttonText: {
        color: '#4e11dcff',
        fontWeight: 'bold',
    },
    emptyText: {
        textAlign: 'center',
        color: '#9CA3AF',
        fontSize: 16,
        marginTop: 50,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    deleteButton: {
        padding: 8,
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
    },
});

export default StockScreen;
