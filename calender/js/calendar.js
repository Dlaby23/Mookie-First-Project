/**
 * Calendar Manager
 * Handles calendar rendering, date logic, and visual interactions
 */

class CalendarManager {
    constructor(app) {
        this.app = app;
        this.calendarGrid = document.getElementById('calendarGrid');
        this.currentMonthEl = document.getElementById('currentMonth');
        
        if (!this.calendarGrid || !this.currentMonthEl) {
            throw new Error('Calendar elements not found');
        }
    }
    
    render() {
        this.renderHeader();
        this.renderDays();
        this.updateTodoIndicators();
    }
    
    renderHeader() {
        if (this.currentMonthEl) {
            this.currentMonthEl.textContent = this.app.formatMonthYear(this.app.currentDate);
        }
    }
    
    renderDays() {
        if (!this.calendarGrid) return;
        
        // Clear existing days
        this.calendarGrid.innerHTML = '';
        
        const year = this.app.currentDate.getFullYear();
        const month = this.app.currentDate.getMonth();
        
        // Get first day of month and how many days in month
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Get days from previous month
        const prevMonth = new Date(year, month - 1, 0);
        const daysInPrevMonth = prevMonth.getDate();
        
        // Calculate total cells needed (6 rows x 7 days = 42)
        const totalCells = 42;
        
        // Render all days
        for (let i = 0; i < totalCells; i++) {
            const dayElement = this.createDayElement();
            
            if (i < startDay) {
                // Previous month days
                const day = daysInPrevMonth - startDay + i + 1;
                const date = new Date(year, month - 1, day);
                this.setupDayElement(dayElement, date, day, true);
            } else if (i < startDay + daysInMonth) {
                // Current month days
                const day = i - startDay + 1;
                const date = new Date(year, month, day);
                this.setupDayElement(dayElement, date, day, false);
            } else {
                // Next month days
                const day = i - startDay - daysInMonth + 1;
                const date = new Date(year, month + 1, day);
                this.setupDayElement(dayElement, date, day, true);
            }
            
            this.calendarGrid.appendChild(dayElement);
        }
        
        // Update selection after rendering
        this.updateSelection();
    }
    
    createDayElement() {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        return dayElement;
    }
    
    setupDayElement(dayElement, date, dayNumber, isOtherMonth) {
        // Store date data
        dayElement.dataset.date = this.app.formatDateForStorage(date);
        dayElement.dataset.fullDate = date.toISOString();
        
        // Add appropriate classes
        const dayOfWeek = date.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayElement.classList.add(dayNames[dayOfWeek]);
        
        if (isOtherMonth) {
            dayElement.classList.add('other-month');
        }
        
        if (this.app.isToday(date)) {
            dayElement.classList.add('today');
        }
        
        // Check for Thai special dates
        const thaiSpecialDate = this.app.isThaiSpecialDate(date);
        if (thaiSpecialDate) {
            dayElement.classList.add('thai-special');
            dayElement.setAttribute('data-thai-holiday', thaiSpecialDate.name);
            dayElement.setAttribute('data-thai-type', thaiSpecialDate.type);
        }
        
        // Create day number element
        const dayNumberEl = document.createElement('div');
        dayNumberEl.className = 'day-number';
        dayNumberEl.textContent = dayNumber;
        dayElement.appendChild(dayNumberEl);
        
        // Add Thai special date indicator
        if (thaiSpecialDate) {
            const thaiIndicator = document.createElement('div');
            thaiIndicator.className = 'thai-indicator';
            thaiIndicator.style.backgroundColor = thaiSpecialDate.color;
            thaiIndicator.setAttribute('title', thaiSpecialDate.name);
            dayElement.appendChild(thaiIndicator);
            
            // Add holiday name text on calendar
            const holidayNameEl = document.createElement('div');
            holidayNameEl.className = 'holiday-name-text';
            holidayNameEl.textContent = thaiSpecialDate.name;
            dayElement.appendChild(holidayNameEl);
        }
        
        // Create todo indicators container
        const indicatorsEl = document.createElement('div');
        indicatorsEl.className = 'todo-indicators';
        dayElement.appendChild(indicatorsEl);
        
        // Add click event listener
        dayElement.addEventListener('click', (e) => {
            e.preventDefault();
            this.app.selectDate(date);
        });
        
        // Add hover effects for better UX
        dayElement.addEventListener('mouseenter', () => {
            if (!dayElement.classList.contains('selected')) {
                dayElement.style.transform = 'translateY(-2px)';
            }
        });
        
        dayElement.addEventListener('mouseleave', () => {
            if (!dayElement.classList.contains('selected')) {
                dayElement.style.transform = '';
            }
        });
    }
    
    updateSelection() {
        // Remove previous selection
        const prevSelected = this.calendarGrid.querySelectorAll('.calendar-day.selected');
        prevSelected.forEach(el => {
            el.classList.remove('selected');
            el.style.transform = '';
        });
        
        // Add selection to current date
        if (this.app.selectedDate) {
            const dateStr = this.app.formatDateForStorage(this.app.selectedDate);
            const selectedEl = this.calendarGrid.querySelector(`[data-date="${dateStr}"]`);
            if (selectedEl) {
                selectedEl.classList.add('selected');
                selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
    
    updateTodoIndicators() {
        // Clear all existing indicators
        const allIndicators = this.calendarGrid.querySelectorAll('.todo-indicators');
        allIndicators.forEach(el => el.innerHTML = '');
        
        // Add indicators for each date with todos
        this.app.filteredTodos.forEach(todo => {
            const dateEl = this.calendarGrid.querySelector(`[data-date="${todo.date}"]`);
            if (dateEl) {
                const indicatorsEl = dateEl.querySelector('.todo-indicators');
                if (indicatorsEl) {
                    const dot = this.createTodoDot(todo);
                    indicatorsEl.appendChild(dot);
                }
            }
        });
        
        // Limit visible dots to prevent overcrowding
        allIndicators.forEach(container => {
            const dots = container.querySelectorAll('.todo-dot');
            if (dots.length > 3) {
                // Hide excess dots and show count
                for (let i = 3; i < dots.length; i++) {
                    dots[i].style.display = 'none';
                }
                
                // Add "more" indicator
                const moreDot = document.createElement('div');
                moreDot.className = 'todo-dot more';
                moreDot.textContent = '+' + (dots.length - 3);
                moreDot.style.backgroundColor = 'var(--gray-400)';
                moreDot.style.color = 'white';
                moreDot.style.fontSize = '0.5rem';
                moreDot.style.width = 'auto';
                moreDot.style.minWidth = '12px';
                moreDot.style.height = '6px';
                moreDot.style.borderRadius = '3px';
                moreDot.style.padding = '0 2px';
                moreDot.style.display = 'flex';
                moreDot.style.alignItems = 'center';
                moreDot.style.justifyContent = 'center';
                container.appendChild(moreDot);
            }
        });
    }
    
    createTodoDot(todo) {
        const dot = document.createElement('div');
        dot.className = 'todo-dot';
        
        // Add priority class
        if (todo.priority) {
            dot.classList.add(`${todo.priority}-priority`);
        }
        
        // Add completed class
        if (todo.completed) {
            dot.classList.add('completed');
        }
        
        // Add tooltip with todo title
        dot.title = todo.title;
        
        // Add category-based styling if no priority color
        if (!todo.priority || todo.priority === 'medium') {
            const categoryColors = {
                work: 'var(--work-color)',
                personal: 'var(--personal-color)',
                health: 'var(--health-color)',
                shopping: 'var(--shopping-color)',
                other: 'var(--other-color)'
            };
            
            if (categoryColors[todo.category]) {
                dot.style.backgroundColor = categoryColors[todo.category];
            }
        }
        
        return dot;
    }
    
    // Navigation Methods
    navigateToDate(date) {
        this.app.currentDate = new Date(date.getFullYear(), date.getMonth(), 1);
        this.app.selectDate(date);
        this.render();
    }
    
    // Utility Methods
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }
    
    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }
    
    getLastDayOfMonth(year, month) {
        return new Date(year, month + 1, 0).getDay();
    }
    
    // Animation Methods
    animateMonthTransition(direction = 'next') {
        if (!this.calendarGrid) return;
        
        const currentGrid = this.calendarGrid.cloneNode(true);
        const parent = this.calendarGrid.parentNode;
        
        // Create animation container
        const animContainer = document.createElement('div');
        animContainer.style.position = 'relative';
        animContainer.style.overflow = 'hidden';
        animContainer.style.height = this.calendarGrid.offsetHeight + 'px';
        
        // Position current grid
        currentGrid.style.position = 'absolute';
        currentGrid.style.top = '0';
        currentGrid.style.left = '0';
        currentGrid.style.width = '100%';
        currentGrid.style.transition = 'transform 0.3s ease';
        
        // Position new grid
        this.calendarGrid.style.position = 'absolute';
        this.calendarGrid.style.top = '0';
        this.calendarGrid.style.left = direction === 'next' ? '100%' : '-100%';
        this.calendarGrid.style.width = '100%';
        this.calendarGrid.style.transition = 'transform 0.3s ease';
        
        // Setup animation container
        animContainer.appendChild(currentGrid);
        animContainer.appendChild(this.calendarGrid);
        parent.appendChild(animContainer);
        
        // Trigger animation
        requestAnimationFrame(() => {
            currentGrid.style.transform = `translateX(${direction === 'next' ? '-100%' : '100%'})`;
            this.calendarGrid.style.transform = 'translateX(0)';
        });
        
        // Cleanup after animation
        setTimeout(() => {
            this.calendarGrid.style.position = '';
            this.calendarGrid.style.left = '';
            this.calendarGrid.style.transition = '';
            parent.appendChild(this.calendarGrid);
            parent.removeChild(animContainer);
        }, 300);
    }
    
    // Touch/Swipe Support for Mobile
    setupTouchEvents() {
        let startX = 0;
        let endX = 0;
        
        this.calendarGrid.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        this.calendarGrid.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            this.handleSwipe();
        }, { passive: true });
        
        this.handleSwipe = () => {
            const difference = startX - endX;
            const threshold = 50; // Minimum swipe distance
            
            if (Math.abs(difference) > threshold) {
                if (difference > 0) {
                    // Swiped left - next month
                    this.app.nextMonth();
                } else {
                    // Swiped right - previous month
                    this.app.previousMonth();
                }
            }
        };
    }
    
    // Accessibility Methods
    setupKeyboardNavigation() {
        this.calendarGrid.addEventListener('keydown', (e) => {
            if (!this.app.selectedDate) return;
            
            let newDate = new Date(this.app.selectedDate);
            
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    newDate.setDate(newDate.getDate() - 7);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    newDate.setDate(newDate.getDate() + 7);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    newDate.setDate(newDate.getDate() - 1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    newDate.setDate(newDate.getDate() + 1);
                    break;
                case 'Home':
                    e.preventDefault();
                    newDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
                    break;
                case 'End':
                    e.preventDefault();
                    newDate = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);
                    break;
                case 'PageUp':
                    e.preventDefault();
                    newDate = new Date(newDate.getFullYear(), newDate.getMonth() - 1, newDate.getDate());
                    break;
                case 'PageDown':
                    e.preventDefault();
                    newDate = new Date(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate());
                    break;
                default:
                    return;
            }
            
            this.app.selectDate(newDate);
            
            // Navigate to different month if needed
            if (newDate.getMonth() !== this.app.currentDate.getMonth() || 
                newDate.getFullYear() !== this.app.currentDate.getFullYear()) {
                this.navigateToDate(newDate);
            }
        });
    }
}