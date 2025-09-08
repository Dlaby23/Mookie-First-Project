# Calender - Modern To-Do Calendar App

A beautiful, modern calendar application with comprehensive to-do management features. Built with vanilla HTML, CSS, and JavaScript for optimal performance and simplicity.

## ✨ Features

### 🎨 Design
- Clean, modern white background with black text
- **Colorful cartoon-style date numbers** with unique colors for each day:
  - 🟡 **Monday**: Yellow
  - 🩷 **Tuesday**: Pink  
  - 🟢 **Wednesday**: Green
  - 🟠 **Thursday**: Orange
  - 🔵 **Friday**: Blue
  - 🟣 **Saturday**: Purple
  - 🔴 **Sunday**: Red
- Fully responsive design for all devices
- Smooth animations and transitions

### 📅 Calendar Features
- Month, week, and day navigation
- Today highlighting
- Visual todo indicators on dates
- Click dates to view/manage todos
- Keyboard navigation support
- Touch/swipe support for mobile

### ✅ Todo Management
- **Add new todos** with detailed information
- **Edit existing todos** inline
- **Delete todos** with confirmation
- **Mark as complete/incomplete** with visual feedback
- **Priority levels**: High, Medium, Low (color-coded)
- **Categories**: Work, Personal, Health, Shopping, Other
- **Time scheduling** with AM/PM format
- **Recurring todos** (weekly recurrence)
- **Drag & drop** to move todos between dates

### 🔍 Advanced Features
- **Search todos** by title and description
- **Filter by status** (All, Pending, Completed)
- **Filter by priority** (All, High, Medium, Low)
- **Data persistence** using localStorage
- **Export/Import** todos as JSON
- **Batch operations** (mark all complete, delete completed)
- **Statistics and analytics**
- **Keyboard shortcuts**

### 📱 Mobile Optimization
- Touch-friendly interface
- Floating action button for quick todo creation
- Swipe navigation between months
- Full-screen todo panel overlay
- Optimized for all screen sizes

## 🚀 Getting Started

1. **Clone or download** the project files
2. **Open `index.html`** in any modern web browser
3. **Start organizing** your tasks and schedule!

No installation or setup required - it's a pure client-side application.

## 📖 Usage Guide

### Creating Todos
1. Click the **"Add Todo"** button or use the floating action button (mobile)
2. Fill in the todo details:
   - **Title** (required)
   - **Description** (optional)
   - **Date** (required)
   - **Time** (optional)
   - **Priority** (Low/Medium/High)
   - **Category** (Work/Personal/Health/Shopping/Other)
   - **Recurring** checkbox for weekly repetition
3. Click **"Save Todo"**

### Managing Todos
- **View todos**: Click on any calendar date
- **Edit**: Click the edit icon on any todo item
- **Delete**: Click the trash icon with confirmation
- **Complete**: Click the checkbox to mark as done
- **Move**: Drag and drop todos between dates

### Navigation
- **Previous/Next Month**: Use arrow buttons or keyboard arrows
- **Go to Today**: Click the "Today" button
- **Select Date**: Click any date on the calendar

### Search & Filter
- **Search**: Type in the search box to find todos by title/description
- **Status Filter**: Show all, pending, or completed todos
- **Priority Filter**: Filter by High, Medium, or Low priority

### Keyboard Shortcuts
- **Ctrl/Cmd + N**: Create new todo
- **Escape**: Close modal/panel
- **Arrow Keys**: Navigate between dates
- **Enter/Space**: Toggle todo completion (when focused)
- **Delete**: Delete selected todo

## 🛠 Technical Details

### Technologies Used
- **HTML5**: Semantic structure
- **CSS3**: Modern styling with custom properties
- **Vanilla JavaScript**: No frameworks for optimal performance
- **LocalStorage**: Client-side data persistence
- **Font Awesome**: Icons
- **Google Fonts**: Poppins font family

### File Structure
```
calender/
├── index.html              # Main HTML file
├── css/
│   ├── style.css          # Main styles with cartoon date styling
│   └── responsive.css     # Mobile and responsive styles
├── js/
│   ├── app.js            # Main application controller
│   ├── calendar.js       # Calendar rendering and date logic
│   └── todo.js           # Todo CRUD operations and management
├── assets/
│   └── icons/            # Custom icons (if needed)
└── README.md             # This file
```

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Key Features Highlights

### Colorful Cartoon-Style Dates
Each day of the week has its own vibrant color with 3D gradient effects and subtle animations, making the calendar visually appealing and easy to navigate.

### Smart Todo Indicators
Visual dots appear on dates with todos, color-coded by priority and showing completion status. Multiple todos are elegantly handled with a count indicator.

### Responsive Design
Seamlessly adapts from desktop to mobile with touch-optimized interactions, floating action buttons, and full-screen overlays for the best user experience.

### Data Persistence
All your todos are automatically saved to your browser's local storage, ensuring your data persists between sessions without requiring any server.

## 🔮 Future Enhancements
- Dark mode toggle
- Calendar sharing and collaboration
- Calendar integrations (Google Calendar, iCal)
- Email reminders and notifications
- Advanced recurring patterns
- Todo templates and quick actions
- Calendar themes and customization

## 🎨 Customization

You can easily customize the app by modifying the CSS variables in `style.css`:

```css
:root {
    /* Day Colors */
    --sunday-color: #ff4757;
    --monday-color: #ffd700;
    --tuesday-color: #ff6b9d;
    /* ... etc */
}
```

## 📄 License

This project is open source and available for personal and educational use.

---

**Enjoy organizing your life with Calender!** 🎉