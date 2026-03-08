import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigation.replace('Home');
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.title}>ScaleSync</Text>
        <Text style={styles.subtitle}>Smarter Business Starts Here</Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
          keyboardType="email-address"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
          placeholderTextColor="#999"
        />

        {loading ? (
          <ActivityIndicator size="large" color="#0B0F2F" style={styles.loader} />
        ) : (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.registerButton]} onPress={handleRegister}>
              <Text style={styles.registerButtonText}>Join ScaleSync</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0B0F2F',
    backgroundColor: '#FFF',
    marginBottom: 20,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0B0F2F',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#F9FAFB',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 10,
    borderRadius: 10,
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonGroup: {
    marginTop: 10,
  },
  button: {
    backgroundColor: '#0B0F2F',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  registerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#0B0F2F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButtonText: {
    color: '#0B0F2F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
});

export default LoginScreen;
