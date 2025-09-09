// Currency conversion functionality
class CurrencyManager {
    constructor(tracker) {
        this.tracker = tracker;
        this.exchangeRates = {};
        this.lastUpdate = null;
        this.apiKey = null; // Will use free tier without API key
        this.baseUrl = 'https://api.exchangerate-api.com/v4/latest/';
        
        this.init();
    }

    async init() {
        // Load cached rates from localStorage
        const cachedRates = localStorage.getItem('exchangeRates');
        const lastUpdate = localStorage.getItem('ratesLastUpdate');
        
        if (cachedRates && lastUpdate) {
            this.exchangeRates = JSON.parse(cachedRates);
            this.lastUpdate = new Date(lastUpdate);
        }

        // Update rates if they're old or if auto-update is enabled
        if (this.tracker.settings.autoUpdateRates) {
            await this.updateExchangeRates();
        }
    }

    async updateExchangeRates() {
        try {
            const now = new Date();
            const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
            
            // Only update if rates are more than 1 day old
            if (this.lastUpdate && this.lastUpdate > oneDayAgo) {
                return;
            }

            const response = await fetch(`${this.baseUrl}${this.tracker.settings.baseCurrency}`);
            const data = await response.json();
            
            if (data.rates) {
                this.exchangeRates = data.rates;
                this.lastUpdate = new Date();
                
                // Cache the rates
                localStorage.setItem('exchangeRates', JSON.stringify(this.exchangeRates));
                localStorage.setItem('ratesLastUpdate', this.lastUpdate.toISOString());
                
                console.log('Exchange rates updated successfully');
                this.showRateUpdateNotification();
            }
        } catch (error) {
            console.warn('Failed to update exchange rates:', error);
            // Use fallback rates if API fails
            this.useFallbackRates();
        }
    }

    useFallbackRates() {
        // Fallback exchange rates (approximate)
        const fallbackRates = {
            USD: { EUR: 0.85, GBP: 0.73, THB: 33.5, JPY: 110, CAD: 1.25, AUD: 1.35, CHF: 0.92 },
            EUR: { USD: 1.18, GBP: 0.86, THB: 39.4, JPY: 129.5, CAD: 1.47, AUD: 1.59, CHF: 1.08 },
            GBP: { USD: 1.37, EUR: 1.16, THB: 45.9, JPY: 150.8, CAD: 1.71, AUD: 1.85, CHF: 1.26 },
            THB: { USD: 0.030, EUR: 0.025, GBP: 0.022, JPY: 3.28, CAD: 0.037, AUD: 0.040, CHF: 0.027 },
            JPY: { USD: 0.0091, EUR: 0.0077, GBP: 0.0066, THB: 0.30, CAD: 0.011, AUD: 0.012, CHF: 0.0084 },
            CAD: { USD: 0.80, EUR: 0.68, GBP: 0.58, THB: 26.8, JPY: 88, AUD: 1.08, CHF: 0.74 },
            AUD: { USD: 0.74, EUR: 0.63, GBP: 0.54, THB: 24.8, JPY: 81.5, CAD: 0.93, CHF: 0.68 },
            CHF: { USD: 1.09, EUR: 0.93, GBP: 0.79, THB: 36.5, JPY: 119.6, CAD: 1.36, AUD: 1.47 }
        };

        const baseCurrency = this.tracker.settings.baseCurrency;
        if (fallbackRates[baseCurrency]) {
            this.exchangeRates = { ...fallbackRates[baseCurrency] };
            this.exchangeRates[baseCurrency] = 1; // Base currency rate is always 1
        }
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return amount;
        }

        // If we don't have rates or the currencies aren't supported, use fallback
        if (!this.exchangeRates || Object.keys(this.exchangeRates).length === 0) {
            this.useFallbackRates();
        }

        const baseCurrency = this.tracker.settings.baseCurrency;
        
        let convertedAmount;
        
        if (fromCurrency === baseCurrency) {
            // Converting from base currency to target currency
            const rate = this.exchangeRates[toCurrency] || 1;
            convertedAmount = amount * rate;
        } else if (toCurrency === baseCurrency) {
            // Converting from source currency to base currency
            const rate = this.exchangeRates[fromCurrency] || 1;
            convertedAmount = amount / rate;
        } else {
            // Converting between two non-base currencies
            const fromRate = this.exchangeRates[fromCurrency] || 1;
            const toRate = this.exchangeRates[toCurrency] || 1;
            const baseAmount = amount / fromRate;
            convertedAmount = baseAmount * toRate;
        }

        return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
    }

    getExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return 1;
        }

        const baseCurrency = this.tracker.settings.baseCurrency;
        
        if (fromCurrency === baseCurrency) {
            return this.exchangeRates[toCurrency] || 1;
        } else if (toCurrency === baseCurrency) {
            return 1 / (this.exchangeRates[fromCurrency] || 1);
        } else {
            const fromRate = this.exchangeRates[fromCurrency] || 1;
            const toRate = this.exchangeRates[toCurrency] || 1;
            return toRate / fromRate;
        }
    }

    formatCurrencyWithRate(amount, currency, showOriginal = false) {
        const baseCurrency = this.tracker.settings.baseCurrency;
        
        if (currency === baseCurrency || !showOriginal) {
            return this.tracker.formatCurrency(amount, currency);
        }

        const convertedAmount = this.convertCurrency(amount, currency, baseCurrency);
        const rate = this.getExchangeRate(currency, baseCurrency);
        
        return `${this.tracker.formatCurrency(convertedAmount)} (${this.tracker.formatCurrency(amount, currency)} @ ${rate.toFixed(4)})`;
    }

    showRateUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'rate-notification';
        notification.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            Exchange rates updated
            <small>${this.lastUpdate.toLocaleTimeString()}</small>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async forceUpdateRates() {
        this.lastUpdate = null; // Force update regardless of cache
        await this.updateExchangeRates();
    }

    getSupportedCurrencies() {
        return ['USD', 'EUR', 'GBP', 'THB', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW', 'MXN', 'SGD', 'HKD', 'NOK', 'SEK'];
    }

    getCurrencySymbol(currency) {
        const symbols = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            THB: '฿',
            JPY: '¥',
            CAD: 'C$',
            AUD: 'A$',
            CHF: 'CHF',
            CNY: '¥',
            INR: '₹',
            KRW: '₩',
            MXN: '$',
            SGD: 'S$',
            HKD: 'HK$',
            NOK: 'kr',
            SEK: 'kr'
        };
        return symbols[currency] || currency;
    }

    getCurrencyInfo(currency) {
        const info = {
            USD: { name: 'US Dollar', country: 'United States' },
            EUR: { name: 'Euro', country: 'European Union' },
            GBP: { name: 'British Pound', country: 'United Kingdom' },
            THB: { name: 'Thai Baht', country: 'Thailand' },
            JPY: { name: 'Japanese Yen', country: 'Japan' },
            CAD: { name: 'Canadian Dollar', country: 'Canada' },
            AUD: { name: 'Australian Dollar', country: 'Australia' },
            CHF: { name: 'Swiss Franc', country: 'Switzerland' },
            CNY: { name: 'Chinese Yuan', country: 'China' },
            INR: { name: 'Indian Rupee', country: 'India' },
            KRW: { name: 'South Korean Won', country: 'South Korea' },
            MXN: { name: 'Mexican Peso', country: 'Mexico' },
            SGD: { name: 'Singapore Dollar', country: 'Singapore' },
            HKD: { name: 'Hong Kong Dollar', country: 'Hong Kong' },
            NOK: { name: 'Norwegian Krone', country: 'Norway' },
            SEK: { name: 'Swedish Krona', country: 'Sweden' }
        };
        return info[currency] || { name: currency, country: 'Unknown' };
    }
}

// Extend ExpenseTracker prototype with currency management methods
ExpenseTracker.prototype.initCurrency = async function() {
    if (!this.currencyManager) {
        this.currencyManager = new CurrencyManager(this);
    }
};

ExpenseTracker.prototype.convertCurrency = function(amount, fromCurrency, toCurrency) {
    if (!this.currencyManager) {
        this.currencyManager = new CurrencyManager(this);
    }
    return this.currencyManager.convertCurrency(amount, fromCurrency, toCurrency);
};

ExpenseTracker.prototype.updateExchangeRates = async function() {
    if (!this.currencyManager) {
        this.currencyManager = new CurrencyManager(this);
    }
    await this.currencyManager.forceUpdateRates();
};

// Initialize currency manager when app starts
document.addEventListener('DOMContentLoaded', () => {
    if (window.expenseTracker) {
        window.expenseTracker.initCurrency();
    }
});