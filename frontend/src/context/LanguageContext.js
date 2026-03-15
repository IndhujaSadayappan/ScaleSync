import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
    en: {
        dashboard: 'Dashboard',
        notifications: 'Notifications',
        prices: 'Update Prices',
        stock: 'Stock Management',
        analytics: 'Sales Analytics',
        logout: 'Logout',
        revenue: 'Total Revenue',
        orders: 'Total Orders',
        today: 'Today',
        thisMonth: 'This Month',
        categoryBreakdown: 'Sales by Category',
        lowStock: 'Low Stock',
        recentInsights: 'Recent Insights',
        totalEarnings: 'TOTAL EARNINGS',
        transactions: 'TRANSACTIONS',
        currentStock: 'Current Stock Levels',
        categoryBreakdownTitle: 'Category Breakdown',
        pdfReport: 'PDF Report',
        noSales: 'No sales found for selected criteria.',
        selectCategories: 'Select Categories',
        done: 'Done',
        updateStock: 'Update Stock',
        deleteStock: 'Delete Stock',
        stockMismatch: 'Stock Mismatch!',
        weight: 'Weight',
        amount: 'Amount',
        pricePerLitre: 'Price per Litre',
        update: 'Update',
        save: 'Save',
        cancel: 'Cancel',
        noNotifications: 'No notifications yet',
        enterPrice: 'Enter price per L',
        stockLevels: 'Stock Levels',
        zeroStockAlert: 'CRITICAL: Zero Stock detected!',
        from: 'From',
        to: 'To',
        selectDate: 'Select Date'
    },
    ta: {
        dashboard: 'முகப்பு',
        notifications: 'அறிவிப்புகள்',
        prices: 'விலை மாற்றம்',
        stock: 'இருப்பு மேலாண்மை',
        analytics: 'விற்பனை பகுப்பாய்வு',
        logout: 'வெளியேறு',
        revenue: 'மொத்த வருவாய்',
        orders: 'மொத்த ஆர்டர்கள்',
        today: 'இன்று',
        thisMonth: 'இந்த மாதம்',
        categoryBreakdown: 'வகை வாரியாக விற்பனை',
        lowStock: 'குறைந்த இருப்பு',
        recentInsights: 'சமீபத்திய தகவல்கள்',
        totalEarnings: 'மொத்த வருவாய்',
        transactions: 'பரிவர்த்தனைகள்',
        currentStock: 'தற்போதைய இருப்பு அளவுகள்',
        categoryBreakdownTitle: 'வகை வாரியாக விவரம்',
        pdfReport: 'அறிக்கை தரவிறக்கம்',
        noSales: 'விற்பனை ஏதும் இல்லை.',
        selectCategories: 'வகைகளைத் தேர்ந்தெடுக்கவும்',
        done: 'சரி',
        updateStock: 'இருப்பை புதுப்பி',
        deleteStock: 'இருப்பை நீக்கு',
        stockMismatch: 'இருப்பு முரண்பாடு!',
        weight: 'அளவு',
        amount: 'தொகை',
        pricePerLitre: 'லிட்டர் விலை',
        update: 'புதுப்பி',
        save: 'சேமி',
        cancel: 'ரத்து செய்',
        noNotifications: 'அறிவிப்புகள் ஏதும் இல்லை',
        enterPrice: 'லிட்டர் விலையை உள்ளிடவும்',
        stockLevels: 'இருப்பு நிலைகள்',
        zeroStockAlert: 'மிகவும் முக்கியம்: இருப்பு பூஜ்ஜியம்!',
        from: 'தொடக்கம்',
        to: 'முடிவு',
        selectDate: 'தேதியைத் தேர்ந்தெடு'
    }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    useEffect(() => {
        loadLanguage();
    }, []);

    const loadLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('userLanguage');
            if (savedLanguage) {
                setLanguage(savedLanguage);
            }
        } catch (error) {
            console.error('Error loading language:', error);
        }
    };

    const changeLanguage = async (lang) => {
        try {
            setLanguage(lang);
            await AsyncStorage.getItem('userLanguage', lang);
        } catch (error) {
            console.error('Error saving language:', error);
        }
    };

    const t = (key) => {
        return translations[language][key] || translations['en'][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
