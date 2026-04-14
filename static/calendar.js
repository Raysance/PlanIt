let calendarPlans = [];

window.openCalendarModal = function() {
    console.log("Opening calendar");
    document.getElementById('calendar-modal').classList.add('active');
    document.body.classList.add('no-scroll');
    
    // Auto scroll to current month after a slight delay for DOM to settle
    setTimeout(() => {
        const todayStr = new Date().toISOString().split('T')[0].substring(0, 7);
        const block = document.getElementById(`month-block-${todayStr}`);
        if(block) {
            block.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
};

window.closeCalendarModal = function() {
    document.getElementById('calendar-modal').classList.remove('active');
    let hasOtherModal = false;
    ['plan-modal', 'plan-detail-modal', 'settings-modal'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.classList.contains('active')) hasOtherModal = true;
    });
    if (!hasOtherModal) {
        document.body.classList.remove('no-scroll');
    }
};

window.updateCalendarData = function(plans) {
    calendarPlans = plans;
    renderCalendar();
};

function renderCalendar() {
    const scrollArea = document.getElementById('calendar-scroll-area');
    if (!scrollArea) return;
    
    let earliest = new Date();
    let latest = new Date();
    
    // Determine the range of months to display
    const dateStats = {};
    const now = new Date();

    if (calendarPlans.length > 0) {
        calendarPlans.forEach(p => {
            // Using time_end as the primary calendar reference date (fallback to time_start or created_at)
            let dayLevel = null;
            if (p.time_end) {
                dayLevel = p.time_end.split(' ')[0].split('T')[0];
            } else if (p.time_start) {
                dayLevel = p.time_start.split(' ')[0].split('T')[0];
            } else if (p.created_at) {
                dayLevel = p.created_at.split(' ')[0];
            }
            
            if (!dayLevel || dayLevel.length !== 10) return;
            
            const dateObj = new Date(dayLevel);
            if (!isNaN(dateObj.getTime())) {
                if (dateObj < earliest) earliest = dateObj;
                if (dateObj > latest) latest = dateObj;
            }
            
            if (!dateStats[dayLevel]) {
                dateStats[dayLevel] = { total: 0, completed: 0, overdue: 0 };
            }
            
            dateStats[dayLevel].total++;
            if (p.completed) {
                dateStats[dayLevel].completed++;
            } else if (p.time_end) {
                const endDate = new Date(p.time_end);
                if (endDate < now) {
                    dateStats[dayLevel].overdue++;
                }
            }
        });
    }

    // Add 3 months padding
    earliest.setMonth(earliest.getMonth() - 2);
    latest.setMonth(latest.getMonth() + 2);
    
    let currentMonth = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    let html = '';

    while (currentMonth <= latest) {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth(); // 0-based
        const monthIdStr = `${year}-${String(month + 1).padStart(2, '0')}`;
        const monthName = currentLang === 'en' ? 
            new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentMonth) : 
            `${month + 1}月`;
        
        html += `<div class="calendar-month-block" id="month-block-${monthIdStr}">`;
        html += `<div class="calendar-month-title">${currentLang === 'en' ? monthName + ' ' + year : year + '年' + monthName}</div>`;
        html += `<div class="calendar-grid">`;
        
        // Calculate days
        const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Empty cells for first row offset
        for (let i = 0; i < firstDay; i++) {
            html += `<div class="calendar-day empty"></div>`;
        }
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const stats = dateStats[dateStr];
            let bgColor = 'transparent';
            let extraClass = '';
            let styleStr = `color: var(--text-main);`;
            
            if (stats && stats.total > 0) {
                extraClass = 'has-tasks';
                if (stats.overdue > 0) {
                    const ratio = Math.max(0.4, Math.min(1, stats.overdue / stats.total));
                    bgColor = `rgba(229, 62, 62, ${ratio})`; // Red base var(--error-color)
                } else if (stats.completed > 0 && stats.completed === stats.total) { // All completed
                    bgColor = `#38a169`; // solid clean green
                } else if (stats.completed > 0) {
                    const ratio = Math.max(0.4, Math.min(1, stats.completed / stats.total));
                    bgColor = `rgba(56, 161, 105, ${ratio})`; // green base var(--accent-color)
                } else {
                    bgColor = `#718096`; // dark gray var(--text-secondary)
                }
                styleStr = `background-color: ${bgColor}; color: #fff; border: 1px solid rgba(0,0,0,0.05);`;
            } else if (dateStr === now.toISOString().split('T')[0]) {
                // Today indicator if empty
                styleStr = `color: var(--accent-color); font-weight: bold; border: 1px dashed var(--accent-color);`;
            }
            
            html += `<div class="calendar-day ${extraClass}" style="${styleStr}" onclick="jumpToDateAnchor('${dateStr}')">${d}</div>`;
        }
        
        html += `</div></div>`;
        currentMonth.setMonth(currentMonth.getMonth() + 1);
    }
    
    scrollArea.innerHTML = html;
}

window.jumpToDateAnchor = function(dateStr) {
    const safeDateId = `date-${dateStr.replace(/-/g, '')}`;
    const anchor = document.getElementById(safeDateId);
    if (anchor) {
        closeCalendarModal();
        anchor.scrollIntoView({ behavior: 'smooth' });
    } else {
        const toast = document.getElementById('toast');
        const msg = i18n[currentLang].msg_no_tasks_date;
        if (toast) {
            toast.textContent = msg;
            toast.style.backgroundColor = 'var(--text-main)';
            toast.style.opacity = '1';
            setTimeout(() => { toast.style.opacity = '0'; }, 3000);
        } else {
            alert(msg);
        }
    }
};