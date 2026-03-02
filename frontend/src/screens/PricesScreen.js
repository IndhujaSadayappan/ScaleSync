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
} from 'react-native';
import { productService } from '../services/api';

const PricesScreen = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditPrice(product.price_per_litre.toString());
  };

  const handleSave = async (id) => {
    if (!editPrice || isNaN(editPrice)) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      await productService.updateProduct(id, parseFloat(editPrice));
      setEditingId(null);
      fetchProducts();
      Alert.alert('Success', 'Price updated successfully');
    } catch (error) {
      console.error('Error updating price:', error);
      Alert.alert('Error', 'Failed to update price');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditPrice('');
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


      {products && products.length > 0 ? (
        products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            <Text style={styles.productName}>{product.name}</Text>

            {editingId === product.id ? (
              <View style={styles.editContainer}>
                <TextInput
                  style={styles.priceInput}
                  value={editPrice}
                  onChangeText={setEditPrice}
                  placeholder="Enter price per litre"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={() => handleSave(product.id)}
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
              <View style={styles.priceContainer}>
                <Text style={styles.price}>₹{product.price_per_litre ? parseFloat(product.price_per_litre).toFixed(2) : '0.00'}/litre</Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEdit(product)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No products found</Text>
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
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
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
  priceInput: {
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
});

export default PricesScreen;
