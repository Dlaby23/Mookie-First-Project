class ExpenseTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.settings = JSON.parse(localStorage.getItem('settings')) || {
            baseCurrency: 'USD',
            autoUpdateRates: true,
            theme: 'light'
        };
        this.currentTab = 'dashboard';
        this.editingExpense = null;
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupEventListeners();
        this.updateDashboard();
        this.loadRecentExpenses();
        this.setCurrentDate();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Quick add form
        document.getElementById('quickAddForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addQuickExpense();
        });

        // Expense modal
        document.getElementById('addExpenseBtn').addEventListener('click', () => {
            this.openExpenseModal();
        });

        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeExpenseModal();
        });

        document.getElementById('cancelExpense').addEventListener('click', () => {
            this.closeExpenseModal();
        });

        document.getElementById('fabAdd').addEventListener('click', () => {
            this.openExpenseModal();
        });

        // Expense form
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });

        // Settings
        document.getElementById('baseCurrency').addEventListener('change', (e) => {
            this.updateBaseCurrency(e.target.value);
        });

        document.getElementById('updateRates').addEventListener('change', (e) => {
            this.settings.autoUpdateRates = e.target.checked;
            this.saveSettings();
        });

        // Search and filters
        document.getElementById('expenseSearch').addEventListener('input', (e) => {
            this.filterExpenses();
        });

        document.getElementById('categoryFilter').addEventListener('change', () => {
            this.filterExpenses();
        });

        document.getElementById('dateFilter').addEventListener('change', () => {
            this.filterExpenses();
        });

        // Data management
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('clearData').addEventListener('click', () => {
            this.clearData();
        });

        // Modal overlay click
        document.getElementById('expenseModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeExpenseModal();
            }
        });
    }

    switchTab(tab) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tab).classList.add('active');

        this.currentTab = tab;

        // Load tab-specific content
        switch(tab) {
            case 'dashboard':
                this.updateDashboard();
                this.loadRecentExpenses();
                break;
            case 'expenses':
                this.loadAllExpenses();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'calendar':
                this.loadCalendar();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    toggleTheme() {
        const currentTheme = document.body.dataset.theme || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.dataset.theme = newTheme;
        this.settings.theme = newTheme;
        this.saveSettings();

        // Update theme icon
        const icon = document.querySelector('#themeToggle i');
        icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expenseDate').value = today;
    }

    addQuickExpense() {
        const item = document.getElementById('quickItem').value;
        const amount = parseFloat(document.getElementById('quickAmount').value);
        const currency = document.getElementById('quickCurrency').value;
        const category = document.getElementById('quickCategory').value;

        if (!item || !amount) return;

        const expense = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            item: item,
            amount: amount,
            currency: currency,
            category: category,
            notes: '',
            timestamp: new Date().toISOString()
        };

        this.expenses.unshift(expense);
        this.saveExpenses();
        this.updateDashboard();
        this.loadRecentExpenses();

        // Reset form
        document.getElementById('quickAddForm').reset();

        // Show success message
        this.showNotification('Expense added successfully!');
    }

    openExpenseModal(expense = null) {
        this.editingExpense = expense;
        
        if (expense) {
            document.getElementById('modalTitle').textContent = 'Edit Expense';
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseItem').value = expense.item;
            document.getElementById('expenseAmount').value = expense.amount;
            document.getElementById('expenseCurrency').value = expense.currency;
            document.getElementById('expenseCategory').value = expense.category;
            document.getElementById('expenseNotes').value = expense.notes || '';
        } else {
            document.getElementById('modalTitle').textContent = 'Add Expense';
            document.getElementById('expenseForm').reset();
            this.setCurrentDate();
        }

        document.getElementById('expenseModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeExpenseModal() {
        document.getElementById('expenseModal').classList.remove('active');
        document.body.style.overflow = '';
        this.editingExpense = null;
    }

    saveExpense() {
        const expense = {
            id: this.editingExpense ? this.editingExpense.id : Date.now().toString(),
            date: document.getElementById('expenseDate').value,
            item: document.getElementById('expenseItem').value,
            amount: parseFloat(document.getElementById('expenseAmount').value),
            currency: document.getElementById('expenseCurrency').value,
            category: document.getElementById('expenseCategory').value,
            notes: document.getElementById('expenseNotes').value,
            timestamp: this.editingExpense ? this.editingExpense.timestamp : new Date().toISOString()
        };

        if (this.editingExpense) {
            const index = this.expenses.findIndex(e => e.id === this.editingExpense.id);
            this.expenses[index] = expense;
        } else {
            this.expenses.unshift(expense);
        }

        this.saveExpenses();
        this.closeExpenseModal();
        this.updateDashboard();
        this.loadRecentExpenses();
        
        if (this.currentTab === 'expenses') {
            this.loadAllExpenses();
        }

        this.showNotification(this.editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(e => e.id !== id);
            this.saveExpenses();
            this.updateDashboard();
            this.loadRecentExpenses();
            
            if (this.currentTab === 'expenses') {
                this.loadAllExpenses();
            }
            
            this.showNotification('Expense deleted successfully!');
        }
    }

    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    updateBaseCurrency(currency) {
        this.settings.baseCurrency = currency;
        this.saveSettings();
        document.getElementById('currentBaseCurrency').textContent = currency;
        this.updateDashboard();
        this.loadRecentExpenses();
        
        if (this.currentTab === 'expenses') {
            this.loadAllExpenses();
        }
    }

    loadSettings() {
        document.getElementById('baseCurrency').value = this.settings.baseCurrency;
        document.getElementById('updateRates').checked = this.settings.autoUpdateRates;
        document.getElementById('currentBaseCurrency').textContent = this.settings.baseCurrency;
        document.body.dataset.theme = this.settings.theme;

        const icon = document.querySelector('#themeToggle i');
        icon.className = this.settings.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';

        // Populate currency selects
        this.populateCurrencySelects();
    }

    populateCurrencySelects() {
        const currencies = ['USD', 'EUR', 'GBP', 'THB', 'JPY', 'CAD', 'AUD', 'CHF'];
        const selects = ['quickCurrency', 'expenseCurrency'];

        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            select.innerHTML = '';
            currencies.forEach(currency => {
                const option = document.createElement('option');
                option.value = currency;
                option.textContent = currency;
                if (currency === this.settings.baseCurrency) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        });
    }

    exportData() {
        const data = {
            expenses: this.expenses,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `expense-tracker-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            if (confirm('This will delete all your expenses and reset settings. Are you absolutely sure?')) {
                localStorage.removeItem('expenses');
                localStorage.removeItem('settings');
                location.reload();
            }
        }
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    formatCurrency(amount, currency = this.settings.baseCurrency) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    getCategoryIcon(category) {
        const icons = {
            food: '🍽️',
            transport: '🚗',
            entertainment: '🎬',
            shopping: '🛒',
            bills: '📄',
            health: '🏥',
            other: '📋'
        };
        return icons[category] || '📋';
    }

    getCategoryName(category) {
        const names = {
            food: 'Food & Dining',
            transport: 'Transport',
            entertainment: 'Entertainment',
            shopping: 'Shopping',
            bills: 'Bills & Utilities',
            health: 'Healthcare',
            other: 'Other'
        };
        return names[category] || 'Other';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTracker();
});