// Expense management functionality
class ExpenseManager {
    constructor(tracker) {
        this.tracker = tracker;
    }

    updateDashboard() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Get date ranges
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Calculate totals
        const todayExpenses = this.tracker.expenses.filter(e => e.date === todayStr);
        const weekExpenses = this.tracker.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= weekStart && expenseDate <= today;
        });
        const monthExpenses = this.tracker.expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate.getMonth() === today.getMonth() && 
                   expenseDate.getFullYear() === today.getFullYear();
        });

        // Convert to base currency and sum
        const todayTotal = this.convertAndSum(todayExpenses);
        const weekTotal = this.convertAndSum(weekExpenses);
        const monthTotal = this.convertAndSum(monthExpenses);
        
        // Calculate daily average for the month
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dailyAverage = monthTotal / daysInMonth;

        // Update UI
        document.getElementById('todayTotal').textContent = this.tracker.formatCurrency(todayTotal);
        document.getElementById('weekTotal').textContent = this.tracker.formatCurrency(weekTotal);
        document.getElementById('monthTotal').textContent = this.tracker.formatCurrency(monthTotal);
        document.getElementById('dailyAverage').textContent = this.tracker.formatCurrency(dailyAverage);

        // Update category chart
        this.updateCategoryChart(monthExpenses);
    }

    convertAndSum(expenses) {
        // For now, assume 1:1 conversion rate
        // This will be replaced with actual currency conversion
        return expenses.reduce((sum, expense) => {
            const convertedAmount = this.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
            return sum + convertedAmount;
        }, 0);
    }

    convertCurrency(amount, fromCurrency, toCurrency) {
        // Placeholder conversion - will be replaced with actual API
        const rates = {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            THB: 33.5,
            JPY: 110,
            CAD: 1.25,
            AUD: 1.35,
            CHF: 0.92
        };

        const usdAmount = amount / (rates[fromCurrency] || 1);
        return usdAmount * (rates[toCurrency] || 1);
    }

    loadRecentExpenses() {
        const recentExpenses = this.tracker.expenses.slice(0, 5);
        const container = document.getElementById('recentExpensesList');
        
        if (recentExpenses.length === 0) {
            container.innerHTML = '<p class="no-expenses">No expenses yet. Add your first expense!</p>';
            return;
        }

        container.innerHTML = recentExpenses.map(expense => {
            const convertedAmount = this.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
            return `
                <div class="expense-item recent-expense">
                    <div class="expense-details">
                        <div class="expense-info">
                            <span class="expense-category">${this.tracker.getCategoryIcon(expense.category)}</span>
                            <div class="expense-text">
                                <span class="expense-item-name">${expense.item}</span>
                                <span class="expense-date">${this.formatDate(expense.date)}</span>
                            </div>
                        </div>
                        <div class="expense-amount">
                            <span class="expense-converted">${this.tracker.formatCurrency(convertedAmount)}</span>
                            ${expense.currency !== this.tracker.settings.baseCurrency ? 
                                `<span class="expense-original">${expense.amount} ${expense.currency}</span>` : ''}
                        </div>
                    </div>
                    <div class="expense-actions">
                        <button class="action-btn edit-btn" onclick="expenseTracker.openExpenseModal(expenseTracker.expenses.find(e => e.id === '${expense.id}'))">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="expenseTracker.deleteExpense('${expense.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadAllExpenses() {
        const container = document.getElementById('expensesList');
        let expenses = [...this.tracker.expenses];

        // Apply filters
        const searchTerm = document.getElementById('expenseSearch').value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        if (searchTerm) {
            expenses = expenses.filter(expense => 
                expense.item.toLowerCase().includes(searchTerm) ||
                expense.notes.toLowerCase().includes(searchTerm)
            );
        }

        if (categoryFilter !== 'all') {
            expenses = expenses.filter(expense => expense.category === categoryFilter);
        }

        if (dateFilter) {
            expenses = expenses.filter(expense => expense.date === dateFilter);
        }

        if (expenses.length === 0) {
            container.innerHTML = '<p class="no-expenses">No expenses found matching your criteria.</p>';
            return;
        }

        // Create table structure
        container.innerHTML = `
            <div class="expenses-table-header">
                <div class="expense-header-item">Date</div>
                <div class="expense-header-item">Item</div>
                <div class="expense-header-item">Category</div>
                <div class="expense-header-item">Amount</div>
                <div class="expense-header-item">Converted</div>
                <div class="expense-header-item">Actions</div>
            </div>
            <div class="expenses-table-body">
                ${expenses.map(expense => {
                    const convertedAmount = this.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
                    return `
                        <div class="expense-item">
                            <div class="expense-date">${this.formatDate(expense.date)}</div>
                            <div class="expense-item-details">
                                <div class="expense-item-name">${expense.item}</div>
                                ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
                            </div>
                            <div class="expense-category-display">
                                <span class="category-icon">${this.tracker.getCategoryIcon(expense.category)}</span>
                                <span class="category-name">${this.tracker.getCategoryName(expense.category)}</span>
                            </div>
                            <div class="expense-original-amount">
                                ${this.tracker.formatCurrency(expense.amount, expense.currency)}
                            </div>
                            <div class="expense-converted ${expense.currency === this.tracker.settings.baseCurrency ? 'same-currency' : ''}">
                                ${this.tracker.formatCurrency(convertedAmount)}
                            </div>
                            <div class="expense-actions">
                                <button class="action-btn edit-btn" onclick="expenseTracker.openExpenseModal(expenseTracker.expenses.find(e => e.id === '${expense.id}'))">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn" onclick="expenseTracker.deleteExpense('${expense.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Mobile view -->
                        <div class="expense-item-mobile">
                            <div class="expense-header-mobile">
                                <div class="expense-main-info">
                                    <span class="category-icon">${this.tracker.getCategoryIcon(expense.category)}</span>
                                    <span class="expense-item-name">${expense.item}</span>
                                </div>
                                <div class="expense-amount">${this.tracker.formatCurrency(convertedAmount)}</div>
                            </div>
                            <div class="expense-details-mobile">
                                <span class="expense-date">${this.formatDate(expense.date)}</span>
                                <span class="expense-original">${expense.amount} ${expense.currency}</span>
                                <div class="expense-actions">
                                    <button class="action-btn edit-btn" onclick="expenseTracker.openExpenseModal(expenseTracker.expenses.find(e => e.id === '${expense.id}'))">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn delete-btn" onclick="expenseTracker.deleteExpense('${expense.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    filterExpenses() {
        this.loadAllExpenses();
    }

    updateCategoryChart(expenses) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        // Group expenses by category
        const categoryTotals = {};
        expenses.forEach(expense => {
            const convertedAmount = this.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + convertedAmount;
        });

        // Prepare chart data
        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);
        const colors = {
            food: '#FF6384',
            transport: '#36A2EB',
            entertainment: '#FFCE56',
            shopping: '#4BC0C0',
            bills: '#9966FF',
            health: '#FF9F40',
            other: '#FF6384'
        };

        // Destroy existing chart if it exists
        if (this.categoryChart) {
            this.categoryChart.destroy();
        }

        // Create new chart
        this.categoryChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: categories.map(cat => this.tracker.getCategoryName(cat)),
                datasets: [{
                    data: amounts,
                    backgroundColor: categories.map(cat => colors[cat] || '#FF6384'),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) {
            return 'Today';
        } else if (dateStr === yesterday.toISOString().split('T')[0]) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    getExpensesByDateRange(startDate, endDate) {
        return this.tracker.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
    }

    getCategoryStats(expenses) {
        const stats = {};
        expenses.forEach(expense => {
            const convertedAmount = this.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
            if (!stats[expense.category]) {
                stats[expense.category] = {
                    total: 0,
                    count: 0,
                    name: this.tracker.getCategoryName(expense.category),
                    icon: this.tracker.getCategoryIcon(expense.category)
                };
            }
            stats[expense.category].total += convertedAmount;
            stats[expense.category].count += 1;
        });
        return stats;
    }
}

// Extend ExpenseTracker prototype with expense management methods
ExpenseTracker.prototype.updateDashboard = function() {
    if (!this.expenseManager) {
        this.expenseManager = new ExpenseManager(this);
    }
    this.expenseManager.updateDashboard();
};

ExpenseTracker.prototype.loadRecentExpenses = function() {
    if (!this.expenseManager) {
        this.expenseManager = new ExpenseManager(this);
    }
    this.expenseManager.loadRecentExpenses();
};

ExpenseTracker.prototype.loadAllExpenses = function() {
    if (!this.expenseManager) {
        this.expenseManager = new ExpenseManager(this);
    }
    this.expenseManager.loadAllExpenses();
};

ExpenseTracker.prototype.filterExpenses = function() {
    if (!this.expenseManager) {
        this.expenseManager = new ExpenseManager(this);
    }
    this.expenseManager.filterExpenses();
};