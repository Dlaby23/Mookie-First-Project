// Google Calendar integration functionality
class CalendarManager {
    constructor(tracker) {
        this.tracker = tracker;
        this.gapi = null;
        this.isSignedIn = false;
        this.calendarEvents = {};
        
        // Google Calendar API configuration
        this.CLIENT_ID = ''; // Add your Google Client ID here
        this.API_KEY = ''; // Add your Google API key here
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
        this.SCOPES = 'https://www.googleapis.com/auth/calendar.events';
        
        this.init();
    }

    async init() {
        this.loadCalendarView();
        this.setupCalendarEventListeners();
        
        // Initialize Google API if credentials are provided
        if (this.CLIENT_ID && this.API_KEY) {
            await this.initializeGoogleAPI();
        }
    }

    setupCalendarEventListeners() {
        const connectBtn = document.getElementById('connectGoogle');
        const syncBtn = document.getElementById('syncCalendar');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.handleGoogleAuth());
        }
        
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.syncExpensesToCalendar());
        }
    }

    loadCalendarView() {
        this.renderCalendar();
    }

    renderCalendar() {
        const container = document.getElementById('expenseCalendar');
        if (!container) return;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        container.innerHTML = `
            <div class="calendar-view">
                <div class="calendar-header">
                    <button class="calendar-nav" id="prevMonth">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h3 class="calendar-title">
                        ${today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button class="calendar-nav" id="nextMonth">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="calendar-grid">
                    ${this.generateCalendarHTML(currentYear, currentMonth)}
                </div>
                
                <div class="calendar-legend">
                    <div class="legend-item">
                        <div class="legend-dot low"></div>
                        <span>Low spending (< $50)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot medium"></div>
                        <span>Medium spending ($50 - $200)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot high"></div>
                        <span>High spending (> $200)</span>
                    </div>
                </div>
            </div>
        `;

        this.setupCalendarNavigation(currentYear, currentMonth);
    }

    generateCalendarHTML(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        let html = `
            <div class="calendar-days-header">
                <div class="day-header">Sun</div>
                <div class="day-header">Mon</div>
                <div class="day-header">Tue</div>
                <div class="day-header">Wed</div>
                <div class="day-header">Thu</div>
                <div class="day-header">Fri</div>
                <div class="day-header">Sat</div>
            </div>
            <div class="calendar-days">
        `;

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day empty"></div>';
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayExpenses = this.getExpensesForDate(dateStr);
            const totalAmount = this.calculateDayTotal(dayExpenses);
            const spendingLevel = this.getSpendingLevel(totalAmount);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            html += `
                <div class="calendar-day ${spendingLevel} ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    ${totalAmount > 0 ? `
                        <div class="day-amount">${this.tracker.formatCurrency(totalAmount)}</div>
                        <div class="day-count">${dayExpenses.length} expense${dayExpenses.length !== 1 ? 's' : ''}</div>
                    ` : ''}
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    getExpensesForDate(dateStr) {
        return this.tracker.expenses.filter(expense => expense.date === dateStr);
    }

    calculateDayTotal(expenses) {
        return expenses.reduce((sum, expense) => {
            return sum + this.tracker.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
        }, 0);
    }

    getSpendingLevel(amount) {
        if (amount === 0) return '';
        if (amount < 50) return 'low';
        if (amount < 200) return 'medium';
        return 'high';
    }

    setupCalendarNavigation(currentYear, currentMonth) {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                const newDate = new Date(currentYear, currentMonth - 1, 1);
                this.updateCalendar(newDate.getFullYear(), newDate.getMonth());
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const newDate = new Date(currentYear, currentMonth + 1, 1);
                this.updateCalendar(newDate.getFullYear(), newDate.getMonth());
            });
        }

        // Add click handlers for calendar days
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                const date = e.currentTarget.dataset.date;
                if (date) {
                    this.showDayDetails(date);
                }
            });
        });
    }

    updateCalendar(year, month) {
        const container = document.querySelector('.calendar-grid');
        const title = document.querySelector('.calendar-title');
        
        if (container) {
            container.innerHTML = this.generateCalendarHTML(year, month);
            this.setupCalendarNavigation(year, month);
        }
        
        if (title) {
            const date = new Date(year, month, 1);
            title.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
    }

    showDayDetails(dateStr) {
        const expenses = this.getExpensesForDate(dateStr);
        const total = this.calculateDayTotal(expenses);
        const date = new Date(dateStr);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay day-details-modal';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <button class="close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="day-summary">
                        <h4>Total Spent: ${this.tracker.formatCurrency(total)}</h4>
                        <p>${expenses.length} expense${expenses.length !== 1 ? 's' : ''}</p>
                    </div>
                    
                    ${expenses.length > 0 ? `
                        <div class="day-expenses">
                            ${expenses.map(expense => {
                                const convertedAmount = this.tracker.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
                                return `
                                    <div class="expense-item">
                                        <div class="expense-info">
                                            <span class="expense-category">${this.tracker.getCategoryIcon(expense.category)}</span>
                                            <div class="expense-text">
                                                <span class="expense-item-name">${expense.item}</span>
                                                <span class="expense-category-name">${this.tracker.getCategoryName(expense.category)}</span>
                                            </div>
                                        </div>
                                        <div class="expense-amount">
                                            <span class="expense-converted">${this.tracker.formatCurrency(convertedAmount)}</span>
                                            ${expense.currency !== this.tracker.settings.baseCurrency ? 
                                                `<span class="expense-original">${expense.amount} ${expense.currency}</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : '<p class="no-expenses">No expenses for this day.</p>'}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="expenseTracker.openExpenseModal(); document.body.removeChild(this.closest('.modal-overlay'));">
                        <i class="fas fa-plus"></i>
                        Add Expense
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Close modal handlers
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.style.overflow = '';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                document.body.style.overflow = '';
            }
        });
    }

    // Google Calendar Integration Methods
    async initializeGoogleAPI() {
        try {
            if (typeof gapi === 'undefined') {
                await this.loadGoogleAPI();
            }
            
            await gapi.load('auth2', () => {
                gapi.auth2.init({
                    client_id: this.CLIENT_ID
                });
            });
            
            await gapi.load('client', () => {
                gapi.client.init({
                    apiKey: this.API_KEY,
                    clientId: this.CLIENT_ID,
                    discoveryDocs: [this.DISCOVERY_DOC],
                    scope: this.SCOPES
                });
            });
            
            this.gapi = gapi;
            this.updateAuthStatus();
            
        } catch (error) {
            console.error('Error initializing Google API:', error);
        }
    }

    loadGoogleAPI() {
        return new Promise((resolve, reject) => {
            if (document.getElementById('google-api-script')) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.id = 'google-api-script';
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    updateAuthStatus() {
        if (!this.gapi) return;
        
        const authInstance = this.gapi.auth2.getAuthInstance();
        this.isSignedIn = authInstance.isSignedIn.get();
        
        const connectBtn = document.getElementById('connectGoogle');
        const syncBtn = document.getElementById('syncCalendar');
        
        if (connectBtn) {
            if (this.isSignedIn) {
                connectBtn.innerHTML = '<i class="fab fa-google"></i> Disconnect Google Account';
                connectBtn.classList.remove('btn-primary');
                connectBtn.classList.add('btn-secondary');
            } else {
                connectBtn.innerHTML = '<i class="fab fa-google"></i> Connect Google Account';
                connectBtn.classList.remove('btn-secondary');
                connectBtn.classList.add('btn-primary');
            }
        }
        
        if (syncBtn) {
            syncBtn.style.display = this.isSignedIn ? 'inline-flex' : 'none';
        }
    }

    async handleGoogleAuth() {
        if (!this.gapi) {
            this.tracker.showNotification('Google Calendar integration not configured.');
            return;
        }
        
        const authInstance = this.gapi.auth2.getAuthInstance();
        
        try {
            if (this.isSignedIn) {
                await authInstance.signOut();
                this.tracker.showNotification('Disconnected from Google Calendar');
            } else {
                await authInstance.signIn();
                this.tracker.showNotification('Connected to Google Calendar');
            }
            this.updateAuthStatus();
        } catch (error) {
            console.error('Authentication error:', error);
            this.tracker.showNotification('Authentication failed. Please try again.');
        }
    }

    async syncExpensesToCalendar() {
        if (!this.isSignedIn) {
            this.tracker.showNotification('Please connect to Google Calendar first.');
            return;
        }

        try {
            const recentExpenses = this.tracker.expenses.slice(0, 10); // Sync last 10 expenses
            let syncedCount = 0;
            
            for (const expense of recentExpenses) {
                await this.createCalendarEvent(expense);
                syncedCount++;
            }
            
            this.tracker.showNotification(`Synced ${syncedCount} expenses to Google Calendar`);
        } catch (error) {
            console.error('Sync error:', error);
            this.tracker.showNotification('Failed to sync expenses to calendar.');
        }
    }

    async createCalendarEvent(expense) {
        if (!this.gapi) return;
        
        const convertedAmount = this.tracker.convertCurrency(expense.amount, expense.currency, this.tracker.settings.baseCurrency);
        const eventDate = new Date(expense.date);
        
        const event = {
            summary: `💰 ${expense.item} - ${this.tracker.formatCurrency(convertedAmount)}`,
            description: `Expense: ${expense.item}\nCategory: ${this.tracker.getCategoryName(expense.category)}\nAmount: ${this.tracker.formatCurrency(convertedAmount)}\n${expense.notes ? `Notes: ${expense.notes}` : ''}`,
            start: {
                date: expense.date
            },
            end: {
                date: expense.date
            },
            colorId: this.getCategoryColor(expense.category)
        };
        
        try {
            const response = await this.gapi.client.calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });
            return response;
        } catch (error) {
            console.error('Error creating calendar event:', error);
            throw error;
        }
    }

    getCategoryColor(category) {
        const colors = {
            food: '11', // Red
            transport: '9', // Blue
            entertainment: '5', // Yellow
            shopping: '6', // Orange
            bills: '8', // Gray
            health: '2', // Green
            other: '1' // Lavender
        };
        return colors[category] || '1';
    }
}

// Extend ExpenseTracker prototype with calendar functionality
ExpenseTracker.prototype.loadCalendar = function() {
    if (!this.calendarManager) {
        this.calendarManager = new CalendarManager(this);
    }
    this.calendarManager.loadCalendarView();
};

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add calendar-specific CSS if not already present
    if (!document.getElementById('calendar-styles')) {
        const style = document.createElement('style');
        style.id = 'calendar-styles';
        style.textContent = `
            .calendar-view {
                background: var(--bg-secondary);
                border-radius: var(--border-radius-lg);
                overflow: hidden;
            }
            
            .calendar-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--spacing-lg);
                background: var(--primary-color);
                color: white;
            }
            
            .calendar-nav {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: var(--border-radius);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }
            
            .calendar-nav:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            
            .calendar-days-header {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                background: var(--bg-tertiary);
            }
            
            .day-header {
                padding: var(--spacing-md);
                text-align: center;
                font-weight: 600;
                color: var(--text-secondary);
                font-size: var(--text-sm);
            }
            
            .calendar-days {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                gap: 1px;
                background: var(--border-color);
            }
            
            .calendar-day {
                background: var(--bg-primary);
                min-height: 100px;
                padding: var(--spacing-sm);
                cursor: pointer;
                transition: background-color 0.2s;
                position: relative;
            }
            
            .calendar-day:hover {
                background: var(--bg-tertiary);
            }
            
            .calendar-day.empty {
                cursor: default;
                background: var(--bg-secondary);
            }
            
            .calendar-day.today {
                background: var(--primary-light);
            }
            
            .calendar-day.low::after {
                content: '';
                position: absolute;
                top: 4px;
                right: 4px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--success-color);
            }
            
            .calendar-day.medium::after {
                content: '';
                position: absolute;
                top: 4px;
                right: 4px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--warning-color);
            }
            
            .calendar-day.high::after {
                content: '';
                position: absolute;
                top: 4px;
                right: 4px;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--danger-color);
            }
            
            .day-number {
                font-weight: 600;
                margin-bottom: var(--spacing-xs);
            }
            
            .day-amount {
                font-size: var(--text-xs);
                font-weight: 600;
                color: var(--primary-color);
                margin-bottom: 2px;
            }
            
            .day-count {
                font-size: var(--text-xs);
                color: var(--text-secondary);
            }
            
            .calendar-legend {
                display: flex;
                gap: var(--spacing-lg);
                padding: var(--spacing-lg);
                background: var(--bg-tertiary);
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: var(--spacing-sm);
                font-size: var(--text-sm);
            }
            
            .legend-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
            }
            
            .legend-dot.low { background: var(--success-color); }
            .legend-dot.medium { background: var(--warning-color); }
            .legend-dot.high { background: var(--danger-color); }
            
            .day-details-modal .day-summary {
                text-align: center;
                padding: var(--spacing-lg);
                border-bottom: 1px solid var(--border-color);
                margin-bottom: var(--spacing-lg);
            }
            
            .day-expenses {
                max-height: 300px;
                overflow-y: auto;
            }
            
            @media (max-width: 768px) {
                .calendar-day {
                    min-height: 80px;
                    font-size: var(--text-sm);
                }
                
                .calendar-legend {
                    flex-direction: column;
                    gap: var(--spacing-sm);
                }
            }
        `;
        document.head.appendChild(style);
    }
});