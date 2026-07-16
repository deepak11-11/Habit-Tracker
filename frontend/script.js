// ====== DOM Elements ======
const habitInput = document.getElementById('habit-input');
const addBtn = document.getElementById('add-btn');
const habitList = document.getElementById('habit-list');
const emptyState = document.getElementById('empty-state');
const monthlyProgress = document.getElementById('monthly-progress');
const yearlyProgress = document.getElementById('yearly-progress');
const dailyProgressText = document.getElementById('daily-progress-text');
const dailyProgressBar = document.getElementById('daily-progress-bar');
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('sun-icon');
const moonIcon = document.getElementById('moon-icon');

// ====== Global State ======
let habits = [];
let currentFilter = 'all';

// ====== Constants ======
const API_URL = 'http://localhost:5000/api/habits';

// ====== Core Functions ======

function getTodayDateString() {
    const now = new Date();
    // Ensure accurate local YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth()+1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function calculateStreaks(completions) {
    if (!completions || completions.length === 0) {
        return { current: 0, best: 0 };
    }

    const sortedDates = [...completions].sort();
    
    // Create Date objects at midnight local time to avoid timezone shifts
    const today = getTodayDateString();
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    const parseLocalDate = (dateStr) => {
        const [y, m, d] = dateStr.split('-');
        return new Date(y, m - 1, d);
    };

    let lastDateStr = sortedDates[sortedDates.length - 1];
    const todayDate = parseLocalDate(today);
    const lastDate = parseLocalDate(lastDateStr);
    
    const diffDaysFromToday = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

    // Calculate best streak globally
    for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
            tempStreak = 1;
        } else {
            const current = parseLocalDate(sortedDates[i]);
            const prev = parseLocalDate(sortedDates[i - 1]);
            const diffDays = Math.floor((current - prev) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else if (diffDays > 1) {
                tempStreak = 1; // broken streak
            }
        }
        if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
        }
    }

    // Current streak logic
    if (diffDaysFromToday <= 1) {
        let tempCurStreak = 1;
        for (let i = sortedDates.length - 1; i > 0; i--) {
            const current = parseLocalDate(sortedDates[i]);
            const prev = parseLocalDate(sortedDates[i - 1]);
            const diffDays = Math.floor((current - prev) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                tempCurStreak++;
            } else {
                break;
            }
        }
        currentStreak = tempCurStreak;
    } else {
        currentStreak = 0;
    }

    return { current: currentStreak, best: bestStreak };
}

async function handleAddHabit() {
    const text = habitInput.value.trim();
    if (!text) return;

    const newHabit = {
        id: String(Date.now()),
        text: text,
        createdAt: getTodayDateString(),
        completions: []
    };

    habits.push(newHabit);
    habitInput.value = '';
    habitInput.focus();

    await saveHabits(); // Persist all via POST
    renderHabits();
}

async function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const today = getTodayDateString();
    const index = habit.completions.indexOf(today);

    if (index > -1) {
        // Uncomplete
        habit.completions.splice(index, 1);
    } else {
        // Complete
        habit.completions.push(today);
    }

    // Call API specifically for this update if implemented via PUT
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completions: habit.completions })
        });
        if (!response.ok) {
            // Fallback to bulk save
            await saveHabits();
        }
    } catch (err) {
        await saveHabits();
    }
    
    renderHabits();
}

async function deleteHabit(id) {
    habits = habits.filter(h => h.id !== id);
    
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            await saveHabits();
        }
    } catch(err) {
        await saveHabits();
    }
    
    renderHabits();
}

function renderHabits() {
    // Process filtering
    const today = getTodayDateString();
    let filteredHabits = habits;

    if (currentFilter === 'pending') {
        filteredHabits = habits.filter(h => !h.completions.includes(today));
    } else if (currentFilter === 'completed') {
        filteredHabits = habits.filter(h => h.completions.includes(today));
    }

    // Update Empty State
    if (habits.length === 0) {
        emptyState.style.display = 'flex';
        habitList.style.display = 'none';
        habitList.innerHTML = '';
    } else if (filteredHabits.length === 0) {
        emptyState.style.display = 'none';
        habitList.style.display = 'flex';
        habitList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); width: 100%; padding: 2rem;">No habits match this filter.</p>';
    } else {
        emptyState.style.display = 'none';
        habitList.style.display = 'flex';
        habitList.innerHTML = '';

        // Display newest first
        [...filteredHabits].reverse().forEach(habit => {
            const isCompletedToday = habit.completions.includes(today);
            const streaks = calculateStreaks(habit.completions);
            
            const li = document.createElement('li');
            li.className = 'habit-item';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'habit-content';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'habit-checkbox';
            checkbox.checked = isCompletedToday;
            checkbox.addEventListener('change', () => toggleHabit(habit.id));

            const textDiv = document.createElement('div');
            
            const titleSpan = document.createElement('span');
            titleSpan.className = `habit-text ${isCompletedToday ? 'completed' : ''}`;
            titleSpan.textContent = habit.text;
            
            const statsDiv = document.createElement('div');
            statsDiv.className = 'habit-stats';
            statsDiv.innerHTML = `
                <span class="streak ${streaks.current > 0 ? 'hot' : ''}">🔥 ${streaks.current}</span>
                <span class="streak">⭐ Best: ${streaks.best}</span>
            `;

            textDiv.appendChild(titleSpan);
            textDiv.appendChild(statsDiv);
            
            contentDiv.appendChild(checkbox);
            contentDiv.appendChild(textDiv);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
            deleteButton.addEventListener('click', () => deleteHabit(habit.id));

            li.appendChild(contentDiv);
            li.appendChild(deleteButton);
            habitList.appendChild(li);
        });
    }

    updateStatistics();
}

function updateStatistics() {
    const today = getTodayDateString();
    const currentMonth = today.substring(0, 7); // YYYY-MM
    const currentYear = today.substring(0, 4);  // YYYY

    let todayCompletedCount = 0;
    let monthlyCount = 0;
    let yearlyCount = 0;

    habits.forEach(habit => {
        if (habit.completions.includes(today)) {
            todayCompletedCount++;
        }
        
        habit.completions.forEach(dateStr => {
            if (dateStr.startsWith(currentMonth)) monthlyCount++;
            if (dateStr.startsWith(currentYear)) yearlyCount++;
        });
    });

    const totalHabits = habits.length;
    const completionPercentage = totalHabits === 0 ? 0 : Math.round((todayCompletedCount / totalHabits) * 100);

    dailyProgressBar.style.width = `${completionPercentage}%`;
    dailyProgressText.textContent = `${completionPercentage}% Completed`;
    
    monthlyProgress.textContent = monthlyCount;
    yearlyProgress.textContent = yearlyCount;
}

// ====== API Integration ======

async function saveHabits() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(habits)
        });
        if (!response.ok) {
            console.error('Failed to post habits', await response.text());
        }
    } catch (error) {
        console.error('Error saving habits to API:', error);
    }
}

async function loadHabits() {
    try {
        const response = await fetch(API_URL);
        if (response.ok) {
            const data = await response.json();
            habits = data || [];
            renderHabits();
        } else {
            console.error('Failed to load habits from API');
        }
    } catch (error) {
        console.error('Error fetching habits:', error);
    }
}

// ====== Event Listeners & Init ======

addBtn.addEventListener('click', handleAddHabit);
habitInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddHabit();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderHabits();
    });
});

// Theme setup (localStorage for persistence only for theme as requested)
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    
    // Icon toggle
    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        localStorage.setItem('theme', 'dark');
    } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
        localStorage.setItem('theme', 'light');
    }
}

themeToggle.addEventListener('click', toggleTheme);

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    } else {
        // Default to dark or match system
        document.body.classList.add('dark-theme');
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
        localStorage.setItem('theme', 'dark');
    }
}

// Initialize
initTheme();
loadHabits();
