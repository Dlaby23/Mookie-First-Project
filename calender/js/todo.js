/**
 * Todo Manager
 * Handles todo CRUD operations, form management, and todo rendering
 */

class TodoManager {
    constructor(app) {
        this.app = app;
        this.setupFormSubmission();
    }
    
    setupFormSubmission() {
        const todoForm = document.getElementById('todoForm');
        if (todoForm) {
            todoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTodo();
            });
        }
    }
    
    // CRUD Operations
    saveTodo() {
        const formData = this.getFormData();
        
        if (!this.validateTodoData(formData)) {
            return;
        }
        
        if (this.app.currentEditingTodo) {
            // Update existing todo
            this.updateTodo(this.app.currentEditingTodo.id, formData);
        } else {
            // Create new todo
            this.createTodo(formData);
        }
        
        this.app.closeTodoModal();
        this.app.calendar.render();
        this.app.updateTodoPanel();
        this.app.showNotification(
            this.app.currentEditingTodo ? 'Todo updated successfully!' : 'Todo created successfully!',
            'success'
        );
    }
    
    createTodo(todoData) {
        const todo = {
            id: this.generateId(),
            ...todoData,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.app.todos.push(todo);
        this.app.filteredTodos.push(todo);
        this.app.saveTodos();
        
        // Handle recurring todos
        if (todo.recurring) {
            this.createRecurringTodos(todo);
        }
    }
    
    updateTodo(todoId, todoData) {
        const todoIndex = this.app.todos.findIndex(t => t.id === todoId);
        if (todoIndex === -1) return;
        
        // Update the todo
        this.app.todos[todoIndex] = {
            ...this.app.todos[todoIndex],
            ...todoData,
            updatedAt: new Date().toISOString()
        };
        
        // Update filtered todos
        const filteredIndex = this.app.filteredTodos.findIndex(t => t.id === todoId);
        if (filteredIndex !== -1) {
            this.app.filteredTodos[filteredIndex] = this.app.todos[todoIndex];
        }
        
        this.app.saveTodos();
    }
    
    deleteTodo(todoId) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }
        
        // Remove from main array
        this.app.todos = this.app.todos.filter(t => t.id !== todoId);
        
        // Remove from filtered array
        this.app.filteredTodos = this.app.filteredTodos.filter(t => t.id !== todoId);
        
        this.app.saveTodos();
        this.app.calendar.render();
        this.app.updateTodoPanel();
        this.app.showNotification('Todo deleted successfully!', 'success');
    }
    
    toggleTodoComplete(todoId) {
        const todo = this.app.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        todo.completed = !todo.completed;
        todo.updatedAt = new Date().toISOString();
        
        // Update filtered todos
        const filteredTodo = this.app.filteredTodos.find(t => t.id === todoId);
        if (filteredTodo) {
            filteredTodo.completed = todo.completed;
            filteredTodo.updatedAt = todo.updatedAt;
        }
        
        this.app.saveTodos();
        this.app.calendar.updateTodoIndicators();
        this.app.updateTodoPanel();
        
        this.app.showNotification(
            todo.completed ? 'Todo marked as complete!' : 'Todo marked as incomplete!',
            'success'
        );
    }
    
    // Form Management
    getFormData() {
        return {
            title: document.getElementById('todoTitle').value.trim(),
            description: document.getElementById('todoDescription').value.trim(),
            date: document.getElementById('todoDate').value,
            time: document.getElementById('todoTime').value,
            priority: document.getElementById('todoPriority').value,
            category: document.getElementById('todoCategory').value,
            recurring: document.getElementById('todoRecurring').checked
        };
    }
    
    validateTodoData(data) {
        if (!data.title) {
            this.app.showNotification('Please enter a title for your todo', 'error');
            document.getElementById('todoTitle').focus();
            return false;
        }
        
        if (!data.date) {
            this.app.showNotification('Please select a date for your todo', 'error');
            document.getElementById('todoDate').focus();
            return false;
        }
        
        // Validate date is not in the past (unless editing)
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today && !this.app.currentEditingTodo) {
            this.app.showNotification('Please select a future date', 'error');
            document.getElementById('todoDate').focus();
            return false;
        }
        
        return true;
    }
    
    // Rendering Methods
    renderTodoItem(todo) {
        const timeDisplay = todo.time ? 
            `<div class="todo-time">
                <i class="fas fa-clock"></i>
                ${this.formatTime(todo.time)}
             </div>` : '';
        
        const categoryDisplay = todo.category ? 
            `<span class="todo-category ${todo.category}">${this.formatCategory(todo.category)}</span>` : '';
            
        const priorityDisplay = todo.priority ? 
            `<span class="todo-priority ${todo.priority}">${todo.priority}</span>` : '';
        
        const descriptionDisplay = todo.description ? 
            `<div class="todo-description">${this.escapeHtml(todo.description)}</div>` : '';
        
        return `
            <div class="todo-item ${todo.completed ? 'completed' : ''}" data-todo-id="${todo.id}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="window.calendarApp.todoManager.toggleTodoComplete('${todo.id}')">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="todo-content">
                    <div class="todo-title ${todo.completed ? 'completed' : ''}">
                        ${this.escapeHtml(todo.title)}
                    </div>
                    ${descriptionDisplay}
                    <div class="todo-meta">
                        ${timeDisplay}
                        ${priorityDisplay}
                        ${categoryDisplay}
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="edit-todo" onclick="window.calendarApp.todoManager.editTodo('${todo.id}')" 
                            title="Edit todo">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-todo" onclick="window.calendarApp.todoManager.deleteTodo('${todo.id}')" 
                            title="Delete todo">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
    
    attachTodoEventListeners(container) {
        // Event listeners are now handled via onclick attributes in the HTML
        // for better reliability with dynamic content
        
        // Add keyboard support for todo items
        const todoItems = container.querySelectorAll('.todo-item');
        todoItems.forEach((item, index) => {
            item.setAttribute('tabindex', '0');
            item.addEventListener('keydown', (e) => {
                const todoId = item.dataset.todoId;
                
                switch (e.key) {
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        this.toggleTodoComplete(todoId);
                        break;
                    case 'Delete':
                    case 'Backspace':
                        e.preventDefault();
                        this.deleteTodo(todoId);
                        break;
                    case 'e':
                    case 'E':
                        e.preventDefault();
                        this.editTodo(todoId);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextItem = todoItems[index + 1];
                        if (nextItem) nextItem.focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevItem = todoItems[index - 1];
                        if (prevItem) prevItem.focus();
                        break;
                }
            });
        });
    }
    
    editTodo(todoId) {
        const todo = this.app.todos.find(t => t.id === todoId);
        if (todo) {
            this.app.openTodoModal(todo);
        }
    }
    
    // Recurring Todos
    createRecurringTodos(originalTodo) {
        const recurringCount = 10; // Create 10 recurring instances
        const baseDate = new Date(originalTodo.date);
        
        for (let i = 1; i <= recurringCount; i++) {
            const newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() + (7 * i)); // Weekly recurrence
            
            const recurringTodo = {
                ...originalTodo,
                id: this.generateId(),
                date: this.app.formatDateForStorage(newDate),
                recurring: false, // Prevent infinite recursion
                parentId: originalTodo.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            this.app.todos.push(recurringTodo);
            this.app.filteredTodos.push(recurringTodo);
        }
        
        this.app.saveTodos();
    }
    
    // Utility Methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    formatTime(timeString) {
        if (!timeString) return '';
        
        const [hours, minutes] = timeString.split(':');
        const hour12 = hours % 12 || 12;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        return `${hour12}:${minutes} ${ampm}`;
    }
    
    formatCategory(category) {
        const categories = {
            work: 'Work',
            personal: 'Personal',
            health: 'Health',
            shopping: 'Shopping',
            other: 'Other'
        };
        return categories[category] || category;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Drag and Drop Support
    setupDragAndDrop() {
        // Make todo items draggable
        this.app.todos.forEach(todo => {
            const todoEl = document.querySelector(`[data-todo-id="${todo.id}"]`);
            if (todoEl) {
                todoEl.setAttribute('draggable', true);
                
                todoEl.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', todo.id);
                    e.dataTransfer.effectAllowed = 'move';
                });
            }
        });
        
        // Make calendar days droppable
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(dayEl => {
            dayEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                dayEl.classList.add('drag-over');
            });
            
            dayEl.addEventListener('dragleave', () => {
                dayEl.classList.remove('drag-over');
            });
            
            dayEl.addEventListener('drop', (e) => {
                e.preventDefault();
                dayEl.classList.remove('drag-over');
                
                const todoId = e.dataTransfer.getData('text/plain');
                const newDate = dayEl.dataset.date;
                
                this.moveTodoToDate(todoId, newDate);
            });
        });
    }
    
    moveTodoToDate(todoId, newDate) {
        const todo = this.app.todos.find(t => t.id === todoId);
        if (!todo) return;
        
        const oldDate = todo.date;
        todo.date = newDate;
        todo.updatedAt = new Date().toISOString();
        
        // Update filtered todos
        const filteredTodo = this.app.filteredTodos.find(t => t.id === todoId);
        if (filteredTodo) {
            filteredTodo.date = newDate;
            filteredTodo.updatedAt = todo.updatedAt;
        }
        
        this.app.saveTodos();
        this.app.calendar.updateTodoIndicators();
        this.app.updateTodoPanel();
        
        this.app.showNotification('Todo moved successfully!', 'success');
    }
    
    // Import/Export Functions
    exportTodos() {
        const data = {
            todos: this.app.todos,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `calender-todos-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.app.showNotification('Todos exported successfully!', 'success');
    }
    
    importTodos(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.todos && Array.isArray(data.todos)) {
                    // Merge with existing todos (avoid duplicates)
                    const existingIds = new Set(this.app.todos.map(t => t.id));
                    const newTodos = data.todos.filter(t => !existingIds.has(t.id));
                    
                    this.app.todos.push(...newTodos);
                    this.app.filteredTodos = [...this.app.todos];
                    this.app.saveTodos();
                    this.app.calendar.render();
                    this.app.updateTodoPanel();
                    
                    this.app.showNotification(`Imported ${newTodos.length} todos successfully!`, 'success');
                } else {
                    throw new Error('Invalid file format');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.app.showNotification('Error importing todos. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
    }
    
    // Statistics and Analytics
    getTodoStats() {
        const stats = {
            total: this.app.todos.length,
            completed: this.app.todos.filter(t => t.completed).length,
            pending: this.app.todos.filter(t => !t.completed).length,
            overdue: this.getOverdueTodos().length,
            byPriority: {
                high: this.app.todos.filter(t => t.priority === 'high').length,
                medium: this.app.todos.filter(t => t.priority === 'medium').length,
                low: this.app.todos.filter(t => t.priority === 'low').length
            },
            byCategory: {}
        };
        
        // Calculate category stats
        const categories = ['work', 'personal', 'health', 'shopping', 'other'];
        categories.forEach(cat => {
            stats.byCategory[cat] = this.app.todos.filter(t => t.category === cat).length;
        });
        
        return stats;
    }
    
    getOverdueTodos() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return this.app.todos.filter(todo => {
            if (todo.completed) return false;
            
            const todoDate = new Date(todo.date);
            todoDate.setHours(0, 0, 0, 0);
            
            return todoDate < today;
        });
    }
    
    // Batch Operations
    markAllComplete(date) {
        const dateTodos = this.app.getTodosForDate(date);
        let updatedCount = 0;
        
        dateTodos.forEach(todo => {
            if (!todo.completed) {
                todo.completed = true;
                todo.updatedAt = new Date().toISOString();
                updatedCount++;
            }
        });
        
        if (updatedCount > 0) {
            this.app.saveTodos();
            this.app.calendar.updateTodoIndicators();
            this.app.updateTodoPanel();
            this.app.showNotification(`Marked ${updatedCount} todos as complete!`, 'success');
        }
    }
    
    deleteAllCompleted() {
        if (!confirm('Are you sure you want to delete all completed todos?')) {
            return;
        }
        
        const initialCount = this.app.todos.length;
        this.app.todos = this.app.todos.filter(t => !t.completed);
        this.app.filteredTodos = this.app.filteredTodos.filter(t => !t.completed);
        
        const deletedCount = initialCount - this.app.todos.length;
        
        if (deletedCount > 0) {
            this.app.saveTodos();
            this.app.calendar.render();
            this.app.updateTodoPanel();
            this.app.showNotification(`Deleted ${deletedCount} completed todos!`, 'success');
        } else {
            this.app.showNotification('No completed todos to delete', 'info');
        }
    }
}