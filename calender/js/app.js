/**
 * Main Application Controller
 * Handles overall app initialization and coordination between modules
 */

class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.todos = [];
        this.filteredTodos = [];
        
        // Thai Special Dates (2024-2025)
        this.thaiSpecialDates = this.initThaiSpecialDates();
        
        // Initialize the application
        this.init();
    }
    
    async init() {
        try {
            // Load todos from localStorage
            this.loadTodos();
            
            // Initialize calendar
            this.calendar = new CalendarManager(this);
            this.todoManager = new TodoManager(this);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Render initial calendar
            this.calendar.render();
            
            // Don't auto-select today's date - let user select manually
            
            console.log('Calendar app initialized successfully');
        } catch (error) {
            console.error('Error initializing calendar app:', error);
            this.showNotification('Error initializing app', 'error');
        }
    }
    
    setupEventListeners() {
        // Header buttons
        const addTodoBtn = document.getElementById('addTodoBtn');
        const todayBtn = document.getElementById('todayBtn');
        const fabAddTodo = document.getElementById('fabAddTodo');
        
        if (addTodoBtn) {
            addTodoBtn.addEventListener('click', () => this.openTodoModal());
        }
        
        if (todayBtn) {
            todayBtn.addEventListener('click', () => this.goToToday());
        }
        
        if (fabAddTodo) {
            fabAddTodo.addEventListener('click', () => this.openTodoModal());
        }
        
        // Calendar navigation
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousMonth());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextMonth());
        }
        
        // Search and filters
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const priorityFilter = document.getElementById('priorityFilter');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => this.handleStatusFilter(e.target.value));
        }
        
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => this.handlePriorityFilter(e.target.value));
        }
        
        // Todo panel
        const closePanelBtn = document.getElementById('closePanelBtn');
        const addTodoFromPanel = document.getElementById('addTodoFromPanel');
        
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', () => this.closeTodoPanel());
        }
        
        if (addTodoFromPanel) {
            addTodoFromPanel.addEventListener('click', () => this.openTodoModal());
        }
        
        // Modal
        const todoModal = document.getElementById('todoModal');
        const closeModal = document.getElementById('closeModal');
        const cancelTodo = document.getElementById('cancelTodo');
        
        if (todoModal) {
            todoModal.addEventListener('click', (e) => {
                if (e.target === todoModal) {
                    this.closeTodoModal();
                }
            });
        }
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeTodoModal());
        }
        
        if (cancelTodo) {
            cancelTodo.addEventListener('click', () => this.closeTodoModal());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    // Calendar Navigation Methods
    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.calendar.render();
    }
    
    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.calendar.render();
    }
    
    goToToday() {
        this.currentDate = new Date();
        this.selectDate(new Date());
        this.calendar.render();
    }
    
    selectDate(date) {
        this.selectedDate = new Date(date);
        
        // Update calendar visual selection
        this.calendar.updateSelection();
        
        // Update todo panel
        this.updateTodoPanel();
        
        // Show todo panel on mobile
        if (window.innerWidth <= 768) {
            this.showTodoPanel();
        }
    }
    
    // Todo Panel Methods
    updateTodoPanel() {
        const panel = document.getElementById('todoPanel');
        const titleEl = document.getElementById('selectedDateTitle');
        const todoListEl = document.getElementById('todoList');
        const holidayInfoEl = document.getElementById('holidayInfo');
        
        if (!this.selectedDate || !panel || !titleEl || !todoListEl) return;
        
        // Update panel title
        const dateStr = this.formatDate(this.selectedDate);
        titleEl.textContent = dateStr;
        
        // Check for holiday information
        const holidayInfo = this.isThaiSpecialDate(this.selectedDate);
        if (holidayInfo && holidayInfoEl) {
            this.displayHolidayInfo(holidayInfo);
        } else if (holidayInfoEl) {
            holidayInfoEl.style.display = 'none';
        }
        
        // Get todos for selected date
        const dateTodos = this.getTodosForDate(this.selectedDate);
        
        // Render todos
        if (dateTodos.length === 0) {
            todoListEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <p>No todos for this date</p>
                    <button class="btn btn-primary" id="addTodoFromPanel">
                        Add your first todo
                    </button>
                </div>
            `;
            
            // Re-attach event listener
            const addBtn = todoListEl.querySelector('#addTodoFromPanel');
            if (addBtn) {
                addBtn.addEventListener('click', () => this.openTodoModal());
            }
        } else {
            todoListEl.innerHTML = dateTodos.map(todo => this.todoManager.renderTodoItem(todo)).join('');
            
            // Attach event listeners to todo items
            this.todoManager.attachTodoEventListeners(todoListEl);
        }
    }
    
    showTodoPanel() {
        const panel = document.getElementById('todoPanel');
        if (panel) {
            panel.classList.add('active');
        }
    }
    
    closeTodoPanel() {
        const panel = document.getElementById('todoPanel');
        if (panel) {
            panel.classList.remove('active');
        }
    }
    
    // Holiday Display Methods
    displayHolidayInfo(holidayInfo) {
        const holidayInfoEl = document.getElementById('holidayInfo');
        const holidayBannerEl = document.getElementById('holidayBanner');
        const holidayIconEl = document.getElementById('holidayIcon');
        const holidayNameEl = document.getElementById('holidayName');
        const holidayTypeEl = document.getElementById('holidayType');
        
        if (!holidayInfoEl || !holidayBannerEl) return;
        
        // Set holiday details
        if (holidayNameEl) holidayNameEl.textContent = holidayInfo.name;
        if (holidayTypeEl) holidayTypeEl.textContent = this.getHolidayTypeDisplay(holidayInfo.type);
        
        // Set icon based on holiday type
        if (holidayIconEl) {
            holidayIconEl.textContent = this.getHolidayIcon(holidayInfo.name, holidayInfo.type);
        }
        
        // Set banner style based on type
        holidayBannerEl.className = `holiday-banner ${holidayInfo.type}`;
        
        // Show the holiday info section
        holidayInfoEl.style.display = 'block';
    }
    
    getHolidayTypeDisplay(type) {
        const typeDisplayMap = {
            'national': 'Thai National Holiday',
            'royal': 'Thai Royal Holiday',
            'buddhist': 'Buddhist Holiday',
            'festival': 'Thai Festival',
            'international': 'International Holiday'
        };
        return typeDisplayMap[type] || type;
    }
    
    getHolidayIcon(name, type) {
        // Specific holiday icons
        const holidayIcons = {
            'New Year\'s Day': '🎊',
            'New Year\'s Eve': '🎊',
            'Valentine\'s Day': '💖',
            'St. Patrick\'s Day': '🍀',
            'Easter Sunday': '🐰',
            'April Fool\'s Day': '😄',
            'Mother\'s Day': '💐',
            'Father\'s Day': '👔',
            'Independence Day (US)': '🇺🇸',
            'Halloween': '🎃',
            'Thanksgiving (US)': '🦃',
            'Christmas Eve': '🎄',
            'Christmas Day': '🎅',
            'Songkran Festival': '💧',
            'Makha Bucha Day': '🙏',
            'Visakha Bucha Day': '🙏',
            'Buddhist Lent Day': '🙏'
        };
        
        // Check for specific holiday first
        if (holidayIcons[name]) {
            return holidayIcons[name];
        }
        
        // Fallback to type-based icons
        const typeIcons = {
            'national': '🇹🇭',
            'royal': '👑',
            'buddhist': '🙏',
            'festival': '🎉',
            'international': '🌍'
        };
        
        return typeIcons[type] || '🎉';
    }
    
    // Modal Methods
    openTodoModal(todo = null) {
        const modal = document.getElementById('todoModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('todoForm');
        
        if (!modal || !modalTitle || !form) return;
        
        // Setup custom date picker
        this.setupCustomDatePicker();
        
        // Set modal title and form data
        if (todo) {
            modalTitle.textContent = 'Edit Todo';
            this.populateFormWithTodo(todo);
        } else {
            modalTitle.textContent = 'Add Todo';
            this.clearForm();
            
            // Pre-fill date if a date is selected
            if (this.selectedDate) {
                const dateInput = document.getElementById('todoDate');
                if (dateInput) {
                    dateInput.value = this.formatDate(this.selectedDate);
                }
            }
        }
        
        // Show modal
        modal.classList.add('active');
        
        // Focus on title input
        const titleInput = document.getElementById('todoTitle');
        if (titleInput) {
            setTimeout(() => titleInput.focus(), 100);
        }
        
        // Store current todo for editing
        this.currentEditingTodo = todo;
    }
    
    closeTodoModal() {
        const modal = document.getElementById('todoModal');
        if (modal) {
            modal.classList.remove('active');
            this.currentEditingTodo = null;
            this.clearForm();
        }
    }
    
    populateFormWithTodo(todo) {
        document.getElementById('todoTitle').value = todo.title || '';
        document.getElementById('todoDescription').value = todo.description || '';
        document.getElementById('todoDate').value = this.formatDateForInput(new Date(todo.date));
        document.getElementById('todoTime').value = todo.time || '';
        document.getElementById('todoPriority').value = todo.priority || 'medium';
        document.getElementById('todoCategory').value = todo.category || 'other';
        document.getElementById('todoRecurring').checked = todo.recurring || false;
    }
    
    clearForm() {
        document.getElementById('todoTitle').value = '';
        document.getElementById('todoDescription').value = '';
        document.getElementById('todoDate').value = '';
        document.getElementById('todoTime').value = '';
        document.getElementById('todoPriority').value = 'medium';
        document.getElementById('todoCategory').value = 'other';
        document.getElementById('todoRecurring').checked = false;
    }
    
    // Search and Filter Methods
    handleSearch(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase();
        this.applyFilters();
    }
    
    handleStatusFilter(status) {
        this.statusFilter = status;
        this.applyFilters();
    }
    
    handlePriorityFilter(priority) {
        this.priorityFilter = priority;
        this.applyFilters();
    }
    
    applyFilters() {
        this.filteredTodos = this.todos.filter(todo => {
            // Search filter
            if (this.searchTerm) {
                const searchMatch = todo.title.toLowerCase().includes(this.searchTerm) ||
                                  (todo.description && todo.description.toLowerCase().includes(this.searchTerm));
                if (!searchMatch) return false;
            }
            
            // Status filter
            if (this.statusFilter && this.statusFilter !== 'all') {
                if (this.statusFilter === 'completed' && !todo.completed) return false;
                if (this.statusFilter === 'pending' && todo.completed) return false;
            }
            
            // Priority filter
            if (this.priorityFilter && this.priorityFilter !== 'all') {
                if (todo.priority !== this.priorityFilter) return false;
            }
            
            return true;
        });
        
        // Update calendar indicators
        this.calendar.updateTodoIndicators();
        
        // Update todo panel if showing filtered todos
        if (this.selectedDate) {
            this.updateTodoPanel();
        }
    }
    
    // Data Methods
    getTodosForDate(date) {
        const dateStr = this.formatDateForStorage(date);
        return this.filteredTodos.filter(todo => todo.date === dateStr);
    }
    
    loadTodos() {
        try {
            const stored = localStorage.getItem('calender_todos');
            this.todos = stored ? JSON.parse(stored) : [];
            this.filteredTodos = [...this.todos];
        } catch (error) {
            console.error('Error loading todos:', error);
            this.todos = [];
            this.filteredTodos = [];
        }
    }
    
    saveTodos() {
        try {
            localStorage.setItem('calender_todos', JSON.stringify(this.todos));
        } catch (error) {
            console.error('Error saving todos:', error);
            this.showNotification('Error saving todos', 'error');
        }
    }
    
    // Utility Methods
    formatDate(date) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('en-US', options);
    }
    
    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }
    
    formatDateForStorage(date) {
        return date.toISOString().split('T')[0];
    }
    
    formatMonthYear(date) {
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('en-US', options);
    }
    
    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }
    
    isToday(date) {
        return this.isSameDate(date, new Date());
    }
    
    // Event Handlers
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: New todo
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.openTodoModal();
        }
        
        // Escape: Close modal/panel
        if (e.key === 'Escape') {
            this.closeTodoModal();
            if (window.innerWidth <= 768) {
                this.closeTodoPanel();
            }
        }
        
        // Arrow keys: Navigate dates
        if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            if (this.selectedDate) {
                const newDate = new Date(this.selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                this.selectDate(newDate);
            }
        }
        
        if (e.key === 'ArrowRight' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            if (this.selectedDate) {
                const newDate = new Date(this.selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                this.selectDate(newDate);
            }
        }
    }
    
    handleResize() {
        // Handle responsive behavior
        if (window.innerWidth > 768) {
            // Desktop: ensure panel is visible
            const panel = document.getElementById('todoPanel');
            if (panel) {
                panel.classList.remove('active');
            }
        }
    }
    
    // Notification System
    showNotification(message, type = 'info') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1001',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        // Set color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                break;
            default:
                notification.style.backgroundColor = '#3b82f6';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Thai Special Dates
    initThaiSpecialDates() {
        return {
            // 2024 Thai Holidays and Special Days
            '2024-01-01': { name: 'New Year\'s Day', type: 'national', color: '#ef4444' },
            '2024-02-24': { name: 'Makha Bucha Day', type: 'buddhist', color: '#f59e0b' },
            '2024-04-06': { name: 'Chakri Dynasty Day', type: 'national', color: '#ef4444' },
            '2024-04-13': { name: 'Songkran Festival (Day 1)', type: 'festival', color: '#06b6d4' },
            '2024-04-14': { name: 'Songkran Festival (Day 2)', type: 'festival', color: '#06b6d4' },
            '2024-04-15': { name: 'Songkran Festival (Day 3)', type: 'festival', color: '#06b6d4' },
            '2024-05-01': { name: 'National Labour Day', type: 'national', color: '#ef4444' },
            '2024-05-04': { name: 'Coronation Day', type: 'royal', color: '#7c3aed' },
            '2024-05-22': { name: 'Visakha Bucha Day', type: 'buddhist', color: '#f59e0b' },
            '2024-06-03': { name: 'Queen Suthida\'s Birthday', type: 'royal', color: '#7c3aed' },
            '2024-07-20': { name: 'Buddhist Lent Day', type: 'buddhist', color: '#f59e0b' },
            '2024-07-28': { name: 'King Vajiralongkorn\'s Birthday', type: 'royal', color: '#7c3aed' },
            '2024-08-12': { name: 'Queen Sirikit\'s Birthday', type: 'royal', color: '#7c3aed' },
            '2024-10-13': { name: 'King Bhumibol Memorial Day', type: 'royal', color: '#7c3aed' },
            '2024-10-23': { name: 'Chulalongkorn Day', type: 'royal', color: '#7c3aed' },
            '2024-12-05': { name: 'King Bhumibol\'s Birthday', type: 'royal', color: '#7c3aed' },
            '2024-12-10': { name: 'Constitution Day', type: 'national', color: '#ef4444' },
            '2024-12-31': { name: 'New Year\'s Eve', type: 'festival', color: '#06b6d4' },
            
            // 2025 Thai Holidays and Special Days
            '2025-01-01': { name: 'New Year\'s Day', type: 'national', color: '#ef4444' },
            '2025-02-12': { name: 'Makha Bucha Day', type: 'buddhist', color: '#f59e0b' },
            '2025-04-06': { name: 'Chakri Dynasty Day', type: 'national', color: '#ef4444' },
            '2025-04-13': { name: 'Songkran Festival (Day 1)', type: 'festival', color: '#06b6d4' },
            '2025-04-14': { name: 'Songkran Festival (Day 2)', type: 'festival', color: '#06b6d4' },
            '2025-04-15': { name: 'Songkran Festival (Day 3)', type: 'festival', color: '#06b6d4' },
            '2025-05-01': { name: 'National Labour Day', type: 'national', color: '#ef4444' },
            '2025-05-04': { name: 'Coronation Day', type: 'royal', color: '#7c3aed' },
            '2025-05-11': { name: 'Visakha Bucha Day', type: 'buddhist', color: '#f59e0b' },
            '2025-06-03': { name: 'Queen Suthida\'s Birthday', type: 'royal', color: '#7c3aed' },
            '2025-07-09': { name: 'Buddhist Lent Day', type: 'buddhist', color: '#f59e0b' },
            '2025-07-28': { name: 'King Vajiralongkorn\'s Birthday', type: 'royal', color: '#7c3aed' },
            '2025-08-12': { name: 'Queen Sirikit\'s Birthday', type: 'royal', color: '#7c3aed' },
            '2025-10-13': { name: 'King Bhumibol Memorial Day', type: 'royal', color: '#7c3aed' },
            '2025-10-23': { name: 'Chulalongkorn Day', type: 'royal', color: '#7c3aed' },
            '2025-12-05': { name: 'King Bhumibol\'s Birthday', type: 'royal', color: '#7c3aed' },
            '2025-12-10': { name: 'Constitution Day', type: 'national', color: '#ef4444' },
            '2025-12-31': { name: 'New Year\'s Eve', type: 'festival', color: '#06b6d4' },
            
            // International Special Dates (2024)
            '2024-02-14': { name: 'Valentine\'s Day', type: 'international', color: '#ec4899' },
            '2024-03-17': { name: 'St. Patrick\'s Day', type: 'international', color: '#10b981' },
            '2024-03-31': { name: 'Easter Sunday', type: 'international', color: '#a855f7' },
            '2024-04-01': { name: 'April Fool\'s Day', type: 'international', color: '#f97316' },
            '2024-05-12': { name: 'Mother\'s Day', type: 'international', color: '#ec4899' },
            '2024-06-16': { name: 'Father\'s Day', type: 'international', color: '#3b82f6' },
            '2024-07-04': { name: 'Independence Day (US)', type: 'international', color: '#ef4444' },
            '2024-10-31': { name: 'Halloween', type: 'international', color: '#f97316' },
            '2024-11-28': { name: 'Thanksgiving (US)', type: 'international', color: '#f59e0b' },
            '2024-12-24': { name: 'Christmas Eve', type: 'international', color: '#10b981' },
            '2024-12-25': { name: 'Christmas Day', type: 'international', color: '#ef4444' },
            
            // International Special Dates (2025)
            '2025-02-14': { name: 'Valentine\'s Day', type: 'international', color: '#ec4899' },
            '2025-03-17': { name: 'St. Patrick\'s Day', type: 'international', color: '#10b981' },
            '2025-04-01': { name: 'April Fool\'s Day', type: 'international', color: '#f97316' },
            '2025-04-20': { name: 'Easter Sunday', type: 'international', color: '#a855f7' },
            '2025-05-11': { name: 'Mother\'s Day', type: 'international', color: '#ec4899' },
            '2025-06-15': { name: 'Father\'s Day', type: 'international', color: '#3b82f6' },
            '2025-07-04': { name: 'Independence Day (US)', type: 'international', color: '#ef4444' },
            '2025-10-31': { name: 'Halloween', type: 'international', color: '#f97316' },
            '2025-11-27': { name: 'Thanksgiving (US)', type: 'international', color: '#f59e0b' },
            '2025-12-24': { name: 'Christmas Eve', type: 'international', color: '#10b981' },
            '2025-12-25': { name: 'Christmas Day', type: 'international', color: '#ef4444' }
        };
    }
    
    // Check if a date is a Thai special date
    isThaiSpecialDate(date) {
        const dateStr = this.formatDateForStorage(date);
        return this.thaiSpecialDates[dateStr] || null;
    }
    
    // Get ordinal suffix for day numbers (1st, 2nd, 3rd, etc.)
    getOrdinalSuffix(day) {
        if (day >= 11 && day <= 13) {
            return 'th';
        }
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    }
    
    // Setup custom date picker
    setupCustomDatePicker() {
        const openBtn = document.getElementById('openDatePicker');
        const closeBtn = document.getElementById('closeDatePicker');
        const prevBtn = document.getElementById('datePickerPrev');
        const nextBtn = document.getElementById('datePickerNext');
        const overlay = document.getElementById('datePickerOverlay');
        const dateInput = document.getElementById('todoDate');
        
        // Open date picker
        if (openBtn) {
            openBtn.onclick = () => this.openDatePickerPopup();
        }
        
        // Also open when clicking the input
        if (dateInput) {
            dateInput.onclick = () => this.openDatePickerPopup();
        }
        
        // Close date picker
        if (closeBtn) {
            closeBtn.onclick = () => this.closeDatePickerPopup();
        }
        
        // Navigation buttons
        if (prevBtn) {
            prevBtn.onclick = () => this.navigateDatePicker(-1);
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => this.navigateDatePicker(1);
        }
        
        // Close when clicking overlay
        if (overlay) {
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    this.closeDatePickerPopup();
                }
            };
        }
    }
    
    // Open date picker popup
    openDatePickerPopup() {
        const overlay = document.getElementById('datePickerOverlay');
        const monthTitle = document.getElementById('datePickerMonth');
        const grid = document.getElementById('datePickerGrid');
        
        if (!overlay || !grid) return;
        
        // Set month title
        if (monthTitle) {
            monthTitle.textContent = this.formatMonthYear(this.currentDate);
        }
        
        // Generate date grid
        this.generateDateGrid(grid);
        
        // Show overlay
        overlay.classList.add('active');
    }
    
    // Close date picker popup
    closeDatePickerPopup() {
        const overlay = document.getElementById('datePickerOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    // Navigate date picker to previous/next month
    navigateDatePicker(direction) {
        // Update currentDate for date picker
        const newDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + direction, 1);
        this.currentDate = newDate;
        
        // Update month title
        const monthTitle = document.getElementById('datePickerMonth');
        if (monthTitle) {
            monthTitle.textContent = this.formatMonthYear(this.currentDate);
        }
        
        // Regenerate date grid
        const grid = document.getElementById('datePickerGrid');
        if (grid) {
            this.generateDateGrid(grid);
        }
    }
    
    // Generate date grid for current month
    generateDateGrid(grid) {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1);
        const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Clear existing grid
        grid.innerHTML = '';
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'date-picker-day empty';
            grid.appendChild(emptyCell);
        }
        
        // Generate day buttons for current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayBtn = document.createElement('button');
            dayBtn.type = 'button';
            dayBtn.className = 'date-picker-day';
            dayBtn.textContent = day;
            
            // Add today class if it's today
            if (this.isToday(date)) {
                dayBtn.classList.add('today');
            }
            
            // Add click handler
            dayBtn.onclick = () => {
                // Remove previous selection
                grid.querySelectorAll('.date-picker-day.selected').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Add selection to clicked day
                dayBtn.classList.add('selected');
                
                // Update input value
                const dateInput = document.getElementById('todoDate');
                if (dateInput) {
                    dateInput.value = this.formatDate(date);
                }
                
                // Close popup after a short delay for visual feedback
                setTimeout(() => {
                    this.closeDatePickerPopup();
                }, 150);
            };
            
            grid.appendChild(dayBtn);
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.calendarApp = new CalendarApp();
});