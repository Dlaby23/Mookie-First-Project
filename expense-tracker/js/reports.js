// Reports and analytics functionality
class ReportsManager {
    constructor(tracker) {
        this.tracker = tracker;
        this.charts = {};
        this.reportData = {};
    }

    loadReports() {
        const period = document.getElementById('reportPeriod').value;
        this.generateReportData(period);
        this.updateReportCharts();
        this.updateReportSummary();
        this.setupExportReport();
    }

    generateReportData(period) {
        const now = new Date();
        let startDate, endDate = new Date();

        switch(period) {
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                startDate = new Date(now.getFullYear(), quarterStart, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        this.reportData = {
            period: period,
            startDate: startDate,
            endDate: endDate,
            expenses: this.getExpensesByDateRange(startDate, endDate),
            totalAmount: 0,
            categoryBreakdown: {},
            dailyTrends: {},
            monthlyComparison: {}
        };

        // Calculate totals and breakdowns
        this.calculateReportMetrics();
    }

    getExpensesByDateRange(startDate, endDate) {
        return this.tracker.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
    }

    calculateReportMetrics() {
        const { expenses } = this.reportData;
        
        // Calculate total amount
        this.reportData.totalAmount = expenses.reduce((sum, expense) => {
            return sum + this.tracker.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
        }, 0);

        // Category breakdown
        expenses.forEach(expense => {
            const convertedAmount = this.tracker.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
            const category = expense.category;
            
            if (!this.reportData.categoryBreakdown[category]) {
                this.reportData.categoryBreakdown[category] = {
                    total: 0,
                    count: 0,
                    percentage: 0,
                    name: this.tracker.getCategoryName(category),
                    icon: this.tracker.getCategoryIcon(category)
                };
            }
            
            this.reportData.categoryBreakdown[category].total += convertedAmount;
            this.reportData.categoryBreakdown[category].count += 1;
        });

        // Calculate percentages
        Object.values(this.reportData.categoryBreakdown).forEach(category => {
            category.percentage = this.reportData.totalAmount > 0 ? 
                (category.total / this.reportData.totalAmount) * 100 : 0;
        });

        // Daily trends
        this.calculateDailyTrends();
        
        // Monthly comparison
        this.calculateMonthlyComparison();
    }

    calculateDailyTrends() {
        const { expenses, startDate, endDate } = this.reportData;
        const dailyTotals = {};

        // Initialize all days in range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            dailyTotals[dateStr] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Populate with actual expenses
        expenses.forEach(expense => {
            const convertedAmount = this.tracker.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
            dailyTotals[expense.date] = (dailyTotals[expense.date] || 0) + convertedAmount;
        });

        this.reportData.dailyTrends = dailyTotals;
    }

    calculateMonthlyComparison() {
        const now = new Date();
        const monthlyTotals = {};

        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyTotals[monthKey] = 0;
        }

        // Calculate totals for each month
        this.tracker.expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyTotals.hasOwnProperty(monthKey)) {
                const convertedAmount = this.tracker.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
                monthlyTotals[monthKey] += convertedAmount;
            }
        });

        this.reportData.monthlyComparison = monthlyTotals;
    }

    updateReportCharts() {
        this.updateTrendsChart();
        this.updateCategoryReportChart();
        this.updateMonthlyChart();
    }

    updateTrendsChart() {
        const ctx = document.getElementById('trendsChart');
        if (!ctx) return;

        const { dailyTrends } = this.reportData;
        const dates = Object.keys(dailyTrends).sort();
        const amounts = dates.map(date => dailyTrends[date]);

        // Destroy existing chart
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        this.charts.trends = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: dates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Daily Spending',
                    data: amounts,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: window.expenseTracker.settings.baseCurrency
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    updateCategoryReportChart() {
        const ctx = document.getElementById('categoryReportChart');
        if (!ctx) return;

        const { categoryBreakdown } = this.reportData;
        const categories = Object.keys(categoryBreakdown);
        const amounts = categories.map(cat => categoryBreakdown[cat].total);
        const colors = {
            food: '#FF6384',
            transport: '#36A2EB',
            entertainment: '#FFCE56',
            shopping: '#4BC0C0',
            bills: '#9966FF',
            health: '#FF9F40',
            other: '#FF6384'
        };

        // Destroy existing chart
        if (this.charts.categoryReport) {
            this.charts.categoryReport.destroy();
        }

        this.charts.categoryReport = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: categories.map(cat => categoryBreakdown[cat].name),
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

    updateMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;

        const { monthlyComparison } = this.reportData;
        const months = Object.keys(monthlyComparison);
        const amounts = Object.values(monthlyComparison);

        // Destroy existing chart
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }

        this.charts.monthly = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: months.map(month => {
                    const [year, monthNum] = month.split('-');
                    const date = new Date(year, monthNum - 1);
                    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }),
                datasets: [{
                    label: 'Monthly Spending',
                    data: amounts,
                    backgroundColor: '#007bff',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: window.expenseTracker.settings.baseCurrency
                                }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }

    updateReportSummary() {
        const container = document.getElementById('reportSummary');
        if (!container) return;

        const { totalAmount, categoryBreakdown, expenses, period } = this.reportData;
        const expenseCount = expenses.length;
        const averagePerExpense = expenseCount > 0 ? totalAmount / expenseCount : 0;
        
        // Calculate period-specific metrics
        let periodDays = 1;
        const now = new Date();
        const { startDate } = this.reportData;
        
        switch(period) {
            case 'week':
                periodDays = 7;
                break;
            case 'month':
                periodDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                break;
            case 'quarter':
                periodDays = 90; // Approximate
                break;
            case 'year':
                periodDays = 365;
                break;
        }

        const dailyAverage = totalAmount / periodDays;

        // Get top category
        const topCategory = Object.entries(categoryBreakdown)
            .sort(([,a], [,b]) => b.total - a.total)[0];

        container.innerHTML = `
            <div class="summary-grid">
                <div class="summary-item">
                    <div class="summary-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="summary-details">
                        <h4>Total Spent</h4>
                        <p class="summary-value">${this.tracker.formatCurrency(totalAmount)}</p>
                    </div>
                </div>

                <div class="summary-item">
                    <div class="summary-icon">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <div class="summary-details">
                        <h4>Total Expenses</h4>
                        <p class="summary-value">${expenseCount}</p>
                    </div>
                </div>

                <div class="summary-item">
                    <div class="summary-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="summary-details">
                        <h4>Daily Average</h4>
                        <p class="summary-value">${this.tracker.formatCurrency(dailyAverage)}</p>
                    </div>
                </div>

                <div class="summary-item">
                    <div class="summary-icon">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <div class="summary-details">
                        <h4>Average per Expense</h4>
                        <p class="summary-value">${this.tracker.formatCurrency(averagePerExpense)}</p>
                    </div>
                </div>

                ${topCategory ? `
                <div class="summary-item">
                    <div class="summary-icon">
                        ${topCategory[1].icon}
                    </div>
                    <div class="summary-details">
                        <h4>Top Category</h4>
                        <p class="summary-value">${topCategory[1].name}</p>
                        <p class="summary-subtitle">${this.tracker.formatCurrency(topCategory[1].total)} (${topCategory[1].percentage.toFixed(1)}%)</p>
                    </div>
                </div>
                ` : ''}

                <div class="category-breakdown">
                    <h4>Category Breakdown</h4>
                    <div class="category-list">
                        ${Object.entries(categoryBreakdown)
                            .sort(([,a], [,b]) => b.total - a.total)
                            .map(([category, data]) => `
                                <div class="category-item">
                                    <div class="category-info">
                                        <span class="category-icon">${data.icon}</span>
                                        <span class="category-name">${data.name}</span>
                                    </div>
                                    <div class="category-stats">
                                        <span class="category-amount">${this.tracker.formatCurrency(data.total)}</span>
                                        <span class="category-percentage">${data.percentage.toFixed(1)}%</span>
                                        <span class="category-count">${data.count} items</span>
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    setupExportReport() {
        const exportBtn = document.getElementById('exportReport');
        if (!exportBtn) return;

        exportBtn.onclick = () => this.exportReport();
    }

    exportReport() {
        const { period, startDate, endDate, totalAmount, categoryBreakdown, expenses } = this.reportData;
        
        const reportData = {
            reportGenerated: new Date().toISOString(),
            period: period,
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            },
            summary: {
                totalAmount: totalAmount,
                expenseCount: expenses.length,
                dailyAverage: totalAmount / Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
                averagePerExpense: expenses.length > 0 ? totalAmount / expenses.length : 0
            },
            categoryBreakdown: categoryBreakdown,
            expenses: expenses.map(expense => ({
                ...expense,
                convertedAmount: this.tracker.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency)
            }))
        };

        // Create CSV format
        const csvContent = this.generateCSV(reportData);
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `expense-report-${period}-${startDate.toISOString().split('T')[0]}.csv`;
        link.click();

        this.tracker.showNotification('Report exported successfully!');
    }

    generateCSV(reportData) {
        let csv = 'Expense Report\n';
        csv += `Period: ${reportData.period}\n`;
        csv += `Date Range: ${reportData.dateRange.start} to ${reportData.dateRange.end}\n`;
        csv += `Generated: ${new Date(reportData.reportGenerated).toLocaleString()}\n\n`;
        
        csv += 'SUMMARY\n';
        csv += `Total Amount: ${this.tracker.formatCurrency(reportData.summary.totalAmount)}\n`;
        csv += `Total Expenses: ${reportData.summary.expenseCount}\n`;
        csv += `Daily Average: ${this.tracker.formatCurrency(reportData.summary.dailyAverage)}\n`;
        csv += `Average per Expense: ${this.tracker.formatCurrency(reportData.summary.averagePerExpense)}\n\n`;
        
        csv += 'CATEGORY BREAKDOWN\n';
        csv += 'Category,Amount,Percentage,Count\n';
        Object.entries(reportData.categoryBreakdown).forEach(([category, data]) => {
            csv += `"${data.name}",${data.total.toFixed(2)},${data.percentage.toFixed(1)}%,${data.count}\n`;
        });
        
        csv += '\nDETAILED EXPENSES\n';
        csv += 'Date,Item,Category,Original Amount,Currency,Converted Amount,Notes\n';
        reportData.expenses.forEach(expense => {
            csv += `"${expense.date}","${expense.item}","${this.tracker.getCategoryName(expense.category)}",${expense.amount},"${expense.currency}",${expense.convertedAmount.toFixed(2)},"${expense.notes || ''}"\n`;
        });
        
        return csv;
    }
}

// Extend ExpenseTracker prototype with reports functionality
ExpenseTracker.prototype.loadReports = function() {
    if (!this.reportsManager) {
        this.reportsManager = new ReportsManager(this);
    }
    this.reportsManager.loadReports();
};

// Setup report period change handler
document.addEventListener('DOMContentLoaded', () => {
    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', () => {
            if (window.expenseTracker && window.expenseTracker.currentTab === 'reports') {
                window.expenseTracker.loadReports();
            }
        });
    }
});