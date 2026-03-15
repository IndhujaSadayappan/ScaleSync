import React, { useState, useEffect } from 'react';
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
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stockService, productService } from '../services/api';

const StockScreen = () => {
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editStock, setEditStock] = useState('');
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [newStock, setNewStock] = useState('');

    const fetchData = async () => {
        try {
            const [stockRes, productsRes] = await Promise.all([
                stockService.getStock(),
                productService.getProducts()
            ]);
            setStockItems(stockRes.data);
            setAvailableProducts(productsRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleAdd = async () => {
        if (!selectedProduct || !newStock) {
            Alert.alert('Error', 'Please select a product and enter initial stock');
            return;
        }
        try {
            // Set initial stock for the selected product
            await stockService.updateStock(selectedProduct.id, parseFloat(newStock));
            setAddModalVisible(false);
            setSelectedProduct(null);
            setShowProductDropdown(false);
            setNewStock('');
            fetchData();
            Alert.alert('Success', 'Stock added successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add stock');
        }
    };

    const dropdownProducts = availableProducts;

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
            <TouchableOpacity style={styles.topAddBtn} onPress={() => setAddModalVisible(true)}>
                <Ionicons name="add-circle-outline" size={24} color="#FFF" />
                <Text style={styles.topAddBtnText}>Add New Stock</Text>
            </TouchableOpacity>

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
                                    placeholder="Enter total stock (kg)"
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
                                    {item.available_stock ? parseFloat(item.available_stock).toFixed(2) : '0.00'} kg
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

            <Modal visible={addModalVisible} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Stock for Product</Text>

                        <TouchableOpacity
                            style={styles.modalDropdown}
                            onPress={() => setShowProductDropdown(!showProductDropdown)}
                        >
                            <Text style={{ color: selectedProduct ? '#1F2937' : '#9CA3AF' }}>
                                {selectedProduct ? selectedProduct.name : 'Select Product'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {showProductDropdown && (
                            <View style={styles.dropdownContainer}>
                                {dropdownProducts.length > 0 ? (
                                    <ScrollView style={{ maxHeight: 150 }}>
                                        {dropdownProducts.map(p => (
                                            <TouchableOpacity
                                                key={p.id}
                                                style={styles.dropdownItem}
                                                onPress={() => {
                                                    setSelectedProduct(p);
                                                    setShowProductDropdown(false);
                                                }}
                                            >
                                                <Text style={styles.dropdownItemText}>{p.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                ) : (
                                    <Text style={styles.noProductText}>No products available. Add in Prices tab.</Text>
                                )}
                            </View>
                        )}

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Initial Stock (kg)"
                            placeholderTextColor="#9CA3AF"
                            value={newStock}
                            onChangeText={setNewStock}
                            keyboardType="decimal-pad"
                        />

                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.modalBtnCancel} onPress={() => {
                                setAddModalVisible(false);
                                setShowProductDropdown(false);
                            }}>
                                <Text style={styles.modalBtnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalBtnSave} onPress={handleAdd}>
                                <Text style={styles.modalBtnSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    topAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0F2F',
        marginHorizontal: 20,
        marginTop: 20,
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    topAddBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0B0F2F',
        marginBottom: 15,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        marginBottom: 15,
        color: '#1F2937',
    },
    modalDropdown: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 12,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalBtns: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
    },
    modalBtnCancel: {
        padding: 10,
    },
    modalBtnCancelText: {
        color: '#6B7280',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalBtnSave: {
        backgroundColor: '#0B0F2F',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    modalBtnSaveText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    dropdownContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        marginBottom: 15,
        backgroundColor: '#F9FAFB',
        marginTop: -10,
        overflow: 'hidden',
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dropdownItemText: {
        fontSize: 16,
        color: '#374151',
    },
    noProductText: {
        padding: 12,
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});

export default StockScreen;
