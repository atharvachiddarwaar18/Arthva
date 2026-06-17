/* ==========================================================================
   MAIN APPLICATION ORCHESTRATION & DOM INTERACTIONS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE MANAGEMENT ---
  let currentScreen = 'screen-home';
  let activeTripId = null;
  let newTripMembers = []; // Temporary storage for trip creation members list
  let activeTheme = DB.getTheme();
  
  // --- DOM ELEMENT REFERENCES ---
  const el = {
    // Screens
    screenHome: document.getElementById('screen-home'),
    screenIndividual: document.getElementById('screen-individual'),
    screenTripDashboard: document.getElementById('screen-trip-dashboard'),
    
    // Theme
    themeToggle: document.getElementById('theme-toggle'),
    
    // Home screen buttons
    btnGotoIndividual: document.getElementById('btn-goto-individual'),
    btnGotoTrips: document.getElementById('btn-goto-trips'),
    homePersonalTotal: document.getElementById('home-personal-total'),
    tripList: document.getElementById('trip-list'),
    btnOpenCreateTrip: document.getElementById('btn-open-create-trip'),
    
    // Individual Screen elements
    btnBackFromInd: document.getElementById('btn-back-from-ind'),
    indTotalSpent: document.getElementById('ind-total-spent'),
    indBreakdownBar: document.getElementById('ind-breakdown-bar'),
    indLegend: document.getElementById('ind-legend'),
    formAddIndExpense: document.getElementById('form-add-ind-expense'),
    indAmountInput: document.getElementById('ind-amount'),
    indCategorySelect: document.getElementById('ind-category'),
    indDescInput: document.getElementById('ind-desc'),
    indExpenseList: document.getElementById('ind-expense-list'),
    
    // Trip Dashboard elements
    btnBackFromTrip: document.getElementById('btn-back-from-trip'),
    tripHeaderName: document.getElementById('trip-header-name'),
    tripHeaderSubtitle: document.getElementById('trip-header-subtitle'),
    btnTripSettings: document.getElementById('btn-trip-settings'),
    
    // Hero Section elements
    heroTotalSpent: document.getElementById('hero-total-spent'),
    heroBudgetLimit: document.getElementById('hero-budget-limit'),
    heroHealthIndicator: document.getElementById('hero-health-indicator'),
    budgetProgressFill: document.getElementById('budget-progress-fill'),
    budgetRemainingText: document.getElementById('budget-remaining-text'),
    budgetPercentText: document.getElementById('budget-percent-text'),
    
    // Tabs
    tabButtons: document.querySelectorAll('.trip-tab-btn'),
    tabContents: document.querySelectorAll('.trip-tab-content'),
    tripMemberStandings: document.getElementById('trip-member-standings'),
    settlementList: document.getElementById('settlement-list'),
    tripExpenseFeed: document.getElementById('trip-expense-feed'),
    
    // Expense filters
    filterMember: document.getElementById('filter-member'),
    filterCategory: document.getElementById('filter-category'),
    filterDate: document.getElementById('filter-date'),
    btnClearFilters: document.getElementById('btn-clear-filters'),
    
    // FAB & Add Expense Sheet
    fabAddExpense: document.getElementById('fab-add-expense'),
    modalAddExpense: document.getElementById('modal-add-expense'),
    addExpenseBackdrop: document.getElementById('add-expense-backdrop'),
    btnCloseAddExpense: document.getElementById('btn-close-add-expense'),
    formAddTripExpense: document.getElementById('form-add-trip-expense'),
    tripExpenseAmount: document.getElementById('trip-expense-amount'),
    tripExpenseDesc: document.getElementById('trip-expense-desc'),
    tripExpensePayer: document.getElementById('trip-expense-payer'),
    splitMembersList: document.getElementById('split-members-list'),
    customSplitContainer: document.getElementById('custom-split-container'),
    customSplitTotalLabel: document.getElementById('custom-split-total-label'),
    customSplitInputs: document.getElementById('custom-split-inputs'),
    customSplitError: document.getElementById('custom-split-error'),
    expenseGpsStatus: document.getElementById('expense-gps-status'),
    expenseGpsValue: document.getElementById('expense-gps-value'),
    expenseDateInput: document.getElementById('expense-date-input'),
    
    // Create Trip Modal elements
    modalCreateTrip: document.getElementById('modal-create-trip'),
    btnCloseCreateTrip: document.getElementById('btn-close-create-trip'),
    formCreateTrip: document.getElementById('form-create-trip'),
    newTripName: document.getElementById('new-trip-name'),
    newTripBudget: document.getElementById('new-trip-budget'),
    newMemberName: document.getElementById('new-member-name'),
    btnAddMemberInput: document.getElementById('btn-add-member-input'),
    addedMembersChips: document.getElementById('added-members-chips'),
    
    // Trip Settings Modal elements
    modalTripSettings: document.getElementById('modal-trip-settings'),
    btnCloseTripSettings: document.getElementById('btn-close-trip-settings'),
    formTripSettings: document.getElementById('form-trip-settings'),
    settingsTripName: document.getElementById('settings-trip-name'),
    settingsTripBudget: document.getElementById('settings-trip-budget'),
    settingsMembersList: document.getElementById('settings-members-list'),
    settingsNewMember: document.getElementById('settings-new-member'),
    btnSettingsAddMember: document.getElementById('btn-settings-add-member'),
    btnDeleteTrip: document.getElementById('btn-delete-trip'),
    
    // Notifications
    toastContainer: document.getElementById('toast-container')
  };

  // --- THEME INITIALIZATION & TOGGLE ---
  if (activeTheme === 'light') {
    document.body.classList.add('light-theme');
    updateThemeIcon('light');
  } else {
    document.body.classList.remove('light-theme');
    updateThemeIcon('dark');
  }

  el.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    activeTheme = isLight ? 'light' : 'dark';
    DB.setTheme(activeTheme);
    updateThemeIcon(activeTheme);
    
    // Re-render and rebuild active charts with theme-specific variables
    Charts.destroyAll();
    if (currentScreen === 'screen-trip-dashboard') {
      renderTripDashboard();
    } else if (currentScreen === 'screen-individual') {
      renderIndividualTracker();
    }
    showToast(`Switched to ${activeTheme} mode`, 'info');
  });

  function updateThemeIcon(theme) {
    const icon = el.themeToggle.querySelector('i');
    if (theme === 'light') {
      icon.setAttribute('data-lucide', 'moon');
    } else {
      icon.setAttribute('data-lucide', 'sun');
    }
    lucide.createIcons();
  }

  // --- NAVIGATION SYSTEM ---
  function navigateTo(screenId) {
    const screens = [el.screenHome, el.screenIndividual, el.screenTripDashboard];
    screens.forEach(screen => {
      if (screen.id === screenId) {
        screen.classList.add('active');
      } else {
        screen.classList.remove('active');
      }
    });
    currentScreen = screenId;
    
    // Trigger initial render of specific screens
    if (screenId === 'screen-home') {
      activeTripId = null;
      renderHomeScreen();
    }
  }

  el.btnGotoIndividual.addEventListener('click', () => {
    navigateTo('screen-individual');
    renderIndividualTracker();
  });
  
  el.btnGotoTrips.addEventListener('click', () => {
    // Smooth scroll down to Trips section
    const tripsSection = el.tripList.closest('.home-section');
    tripsSection.scrollIntoView({ behavior: 'smooth' });
    showToast('Select a trip or create a new one below', 'info');
  });

  el.btnBackFromInd.addEventListener('click', () => navigateTo('screen-home'));
  el.btnBackFromTrip.addEventListener('click', () => navigateTo('screen-home'));

  // Tab Selection inside Trip Dashboard
  el.tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabTarget = e.target.getAttribute('data-tab');
      
      // Update buttons
      el.tabButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Update contents
      el.tabContents.forEach(content => {
        if (content.id === tabTarget) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    });
  });

  // --- TOAST NOTIFICATIONS ---
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'warning') iconName = 'alert-triangle';
    
    toast.innerHTML = `
      <i data-lucide="${iconName}"></i>
      <span>${message}</span>
    `;
    
    el.toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Auto remove from DOM after CSS animation completes
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // --- GEOLOCATION HELPER ---
  function fetchLocation() {
    el.expenseGpsStatus.textContent = 'Fetching GPS...';
    el.expenseGpsValue.value = '';

    if (!navigator.geolocation) {
      el.expenseGpsStatus.textContent = 'GPS not supported';
      el.expenseGpsValue.value = 'Offline Mode';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(4);
        const lon = position.coords.longitude.toFixed(4);
        const coordsStr = `${lat}° N, ${lon}° E`;
        
        // Reverse-geocoding simulation for premium touch
        const simulatedLocations = [
          'Baga Beach Road, Goa', 
          'Main Market, Panaji', 
          'Colva Beach, South Goa',
          'Vagator Cliff View, Goa',
          'Tito\'s Lane, Calangute'
        ];
        // Select a simulated location or coordinates
        const locationText = simulatedLocations[Math.floor(Math.random() * simulatedLocations.length)] + ` (${coordsStr})`;
        
        el.expenseGpsStatus.textContent = locationText;
        el.expenseGpsValue.value = locationText;
      },
      (error) => {
        console.warn('GPS Fetch Error', error);
        el.expenseGpsStatus.textContent = 'No GPS Access';
        el.expenseGpsValue.value = 'Unknown Location';
      },
      { timeout: 6000, enableHighAccuracy: false }
    );
  }

  // --- HOME SCREEN LOGIC ---
  function renderHomeScreen() {
    // 1. Render Personal Total spent
    const indExpenses = DB.getIndExpenses();
    const indTotal = indExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    el.homePersonalTotal.textContent = `₹${indTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // 2. Render Trips List
    const trips = DB.getTrips();
    el.tripList.innerHTML = '';

    if (trips.length === 0) {
      el.tripList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="map-pin"></i>
          <p>No active trips. Start a new trip to track group expenses!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    trips.forEach(trip => {
      const summary = Engine.calculateTripBalances(trip);
      const totalSpent = summary.totalSpent;
      const budget = trip.budget;
      
      const tripCard = document.createElement('div');
      tripCard.className = 'trip-item-card';
      tripCard.dataset.id = trip.id;
      
      let budgetStatusText = '';
      if (budget > 0) {
        const percent = Math.round((totalSpent / budget) * 100);
        budgetStatusText = `${percent}% of budget`;
      } else {
        budgetStatusText = 'No budget limit';
      }

      tripCard.innerHTML = `
        <div class="trip-item-info">
          <h3>${trip.name}</h3>
          <div class="trip-item-meta">
            <span class="trip-meta-item"><i data-lucide="users"></i> ${trip.members.length} members</span>
            <span class="trip-meta-item"><i data-lucide="calendar"></i> ${new Date(trip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
          </div>
        </div>
        <div class="trip-item-right">
          <span class="trip-item-spend">₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <span class="trip-item-budget">${budgetStatusText}</span>
        </div>
      `;

      tripCard.addEventListener('click', () => {
        activeTripId = trip.id;
        navigateTo('screen-trip-dashboard');
        renderTripDashboard();
      });

      el.tripList.appendChild(tripCard);
    });

    lucide.createIcons();
  }

  // --- TRIP CREATION MODAL ---
  el.btnOpenCreateTrip.addEventListener('click', () => {
    newTripMembers = [];
    el.addedMembersChips.innerHTML = '';
    el.formCreateTrip.reset();
    el.modalCreateTrip.classList.add('active');
  });

  el.btnCloseCreateTrip.addEventListener('click', () => {
    el.modalCreateTrip.classList.remove('active');
  });

  // Adding a member name input
  function addMemberFromInput() {
    const mName = el.newMemberName.value.trim();
    if (!mName) return;

    if (newTripMembers.includes(mName)) {
      showToast('Member name already added', 'warning');
      return;
    }

    newTripMembers.push(mName);
    renderMemberChips();
    el.newMemberName.value = '';
    el.newMemberName.focus();
  }

  el.btnAddMemberInput.addEventListener('click', addMemberFromInput);
  el.newMemberName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMemberFromInput();
    }
  });

  function renderMemberChips() {
    el.addedMembersChips.innerHTML = '';
    newTripMembers.forEach((member, index) => {
      const chip = document.createElement('div');
      chip.className = 'member-chip';
      chip.innerHTML = `
        <span>${member}</span>
        <button type="button" data-index="${index}"><i data-lucide="x"></i></button>
      `;
      chip.querySelector('button').addEventListener('click', () => {
        newTripMembers.splice(index, 1);
        renderMemberChips();
      });
      el.addedMembersChips.appendChild(chip);
    });
    lucide.createIcons();
  }

  el.formCreateTrip.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = el.newTripName.value.trim();
    const budget = parseFloat(el.newTripBudget.value) || 0;

    if (!name) return;
    if (newTripMembers.length === 0) {
      showToast('Please add at least one member to the trip', 'warning');
      return;
    }

    // Create the trip in local db
    const newTrip = DB.createTrip(name, budget, newTripMembers);
    el.modalCreateTrip.classList.remove('active');
    
    // Auto-open the newly created trip dashboard
    activeTripId = newTrip.id;
    navigateTo('screen-trip-dashboard');
    renderTripDashboard();
    
    showToast(`Trip "${name}" launched!`, 'success');
  });

  // --- INDIVIDUAL TRACKER MODULE (BASIC ONLY) ---
  function renderIndividualTracker() {
    const expenses = DB.getIndExpenses();
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    el.indTotalSpent.textContent = `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // 1. Categorized Breakdown
    const categories = { Food: 0, Travel: 0, Misc: 0 };
    expenses.forEach(exp => {
      if (categories[exp.category] !== undefined) {
        categories[exp.category] += exp.amount;
      } else {
        categories.Misc += exp.amount;
      }
    });

    // Render category bar segments
    el.indBreakdownBar.innerHTML = '';
    el.indLegend.innerHTML = '';

    const catColors = { Food: '#3b82f6', Travel: '#10b981', Misc: '#f59e0b' };

    Object.entries(categories).forEach(([cat, val]) => {
      const pct = totalSpent > 0 ? (val / totalSpent) * 100 : 0;
      
      // Bar segment
      if (pct > 0) {
        const seg = document.createElement('div');
        seg.className = `breakdown-segment`;
        seg.style.width = `${pct}%`;
        seg.style.backgroundColor = catColors[cat];
        el.indBreakdownBar.appendChild(seg);
      }

      // Legend Item
      const leg = document.createElement('div');
      leg.className = 'legend-item';
      leg.innerHTML = `
        <span class="legend-color" style="background-color: ${catColors[cat]};"></span>
        <span>${cat}: ₹${val.toLocaleString('en-IN')} (${Math.round(pct)}%)</span>
      `;
      el.indLegend.appendChild(leg);
    });

    // 2. Render Expense Log
    el.indExpenseList.innerHTML = '';
    if (expenses.length === 0) {
      el.indExpenseList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="receipt"></i>
          <p>No personal expenses recorded yet.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    expenses.forEach(exp => {
      const log = document.createElement('div');
      log.className = 'expense-log-card';
      
      let icon = 'package';
      if (exp.category === 'Food') icon = 'shopping-bag';
      if (exp.category === 'Travel') icon = 'car';

      log.innerHTML = `
        <div class="log-left">
          <div class="log-cat-icon" style="background-color: ${catColors[exp.category] || '#64748b'}; color: #fff;">
            <i data-lucide="${icon}"></i>
          </div>
          <div class="log-details">
            <h4>${exp.description}</h4>
            <span>${new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${exp.time}</span>
          </div>
        </div>
        <div class="log-right">
          <span class="log-amount">₹${exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <button class="delete-log-btn" data-id="${exp.id}"><i data-lucide="trash-2"></i></button>
        </div>
      `;

      log.querySelector('.delete-log-btn').addEventListener('click', (e) => {
        const expId = e.currentTarget.getAttribute('data-id');
        DB.deleteIndExpense(expId);
        renderIndividualTracker();
        showToast('Expense removed', 'warning');
      });

      el.indExpenseList.appendChild(log);
    });

    lucide.createIcons();
  }

  el.formAddIndExpense.addEventListener('submit', (e) => {
    e.preventDefault();
    const amt = parseFloat(el.indAmountInput.value);
    const cat = el.indCategorySelect.value;
    const desc = el.indDescInput.value.trim();

    if (!amt || !desc) return;

    DB.addIndExpense(amt, cat, desc);
    el.formAddIndExpense.reset();
    renderIndividualTracker();
    showToast('Personal expense added', 'success');
  });

  // --- TRIP DASHBOARD (CORE ENGINE VISUAL) ---
  function renderTripDashboard() {
    const trip = DB.getTrip(activeTripId);
    if (!trip) {
      navigateTo('screen-home');
      return;
    }

    // 1. Compute splitting math
    const report = Engine.calculateTripBalances(trip);
    const totalSpent = report.totalSpent;
    const budget = trip.budget;

    // 2. Set Trip Header Titles
    el.tripHeaderName.textContent = trip.name;
    const dateFormatted = new Date(trip.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    el.tripHeaderSubtitle.textContent = `Launched ${dateFormatted}`;

    // 3. Render Hero Section Stats
    el.heroTotalSpent.textContent = `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    
    if (budget > 0) {
      el.heroBudgetLimit.textContent = `/ ₹${budget.toLocaleString('en-IN')}`;
      
      const ratio = totalSpent / budget;
      const pct = Math.min(Math.round(ratio * 100), 100);
      
      // Update linear progress bar width
      el.budgetProgressFill.style.width = `${pct}%`;
      el.budgetPercentText.textContent = `${pct}%`;

      const remaining = budget - totalSpent;
      if (remaining >= 0) {
        el.budgetRemainingText.textContent = `₹${remaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining`;
      } else {
        el.budgetRemainingText.textContent = `₹${Math.abs(remaining).toLocaleString('en-IN', { minimumFractionDigits: 2 })} over budget`;
      }

      // Update color and Health Badge status
      el.budgetProgressFill.className = 'progress-bar-fill';
      el.heroHealthIndicator.className = 'health-badge';
      
      if (ratio < 0.7) {
        el.budgetProgressFill.classList.add('safe');
        el.heroHealthIndicator.textContent = 'On Track';
        el.heroHealthIndicator.classList.add('status-safe');
      } else if (ratio <= 1.0) {
        el.budgetProgressFill.classList.add('warning');
        el.heroHealthIndicator.textContent = 'Near Limit';
        el.heroHealthIndicator.classList.add('status-warning');
      } else {
        el.budgetProgressFill.classList.add('danger');
        el.heroHealthIndicator.textContent = 'Overspending';
        el.heroHealthIndicator.classList.add('status-danger');
      }
    } else {
      el.heroBudgetLimit.textContent = '';
      el.budgetProgressFill.style.width = '0%';
      el.budgetPercentText.textContent = '0%';
      el.budgetRemainingText.textContent = 'No budget cap configured';
      el.budgetProgressFill.className = 'progress-bar-fill safe';
      el.heroHealthIndicator.className = 'health-badge status-safe';
      el.heroHealthIndicator.textContent = 'Active';
    }

    // 4. Trigger Charts Render
    Charts.updateDistributionChart(trip.expenses);
    Charts.updateTrendChart(trip.expenses);

    // 5. Populate Feed Filter Select options
    populateFilterSelects(trip);

    // 6. Render Sub-Tabs (Balances, Settlements, Feed)
    renderBalancesTab(report.memberBalances);
    renderSettlementsTab(report.settlements);
    renderFeedTab(trip.expenses);
  }

  function populateFilterSelects(trip) {
    // Member filter options
    const prevSelected = el.filterMember.value;
    el.filterMember.innerHTML = '<option value="">All Members</option>';
    trip.members.forEach(member => {
      const opt = document.createElement('option');
      opt.value = member;
      opt.textContent = member;
      if (member === prevSelected) opt.selected = true;
      el.filterMember.appendChild(opt);
    });
  }

  // Render Balances Tab content
  function renderBalancesTab(memberBalances) {
    el.tripMemberStandings.innerHTML = '';
    
    // Find maximum paid contribution for scaled mini indicators
    const maxPaid = Math.max(...Object.values(memberBalances).map(b => b.paid), 1);

    Object.entries(memberBalances).forEach(([name, balance]) => {
      const card = document.createElement('div');
      card.className = 'member-standing-card';

      let statusClass = 'neutral';
      let balancePrefix = '';
      if (balance.net > 0.01) {
        statusClass = 'positive';
        balancePrefix = '+';
      } else if (balance.net < -0.01) {
        statusClass = 'negative';
      }

      // Calculate contribution line percentage (relative to highest payer)
      const contributionBarWidth = (balance.paid / maxPaid) * 100;

      card.innerHTML = `
        <div class="member-standing-header">
          <span class="member-standing-name">${name}</span>
          <span class="member-standing-amount ${statusClass}">
            ${balancePrefix}₹${balance.net.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div class="member-mini-progress">
          <div class="member-mini-fill" style="width: ${contributionBarWidth}%;"></div>
        </div>
        <div class="member-standing-details">
          <span>Paid <strong style="color: var(--success);">₹${balance.paid.toLocaleString('en-IN')}</strong></span>
          <span>Owed Share <strong style="color: var(--danger);">₹${balance.owed.toLocaleString('en-IN')}</strong></span>
        </div>
      `;

      el.tripMemberStandings.appendChild(card);
    });
  }

  // Render Settlement Simplified transactions
  function renderSettlementsTab(settlements) {
    el.settlementList.innerHTML = '';

    if (settlements.length === 0) {
      el.settlementList.innerHTML = `
        <div class="empty-state">
          <i data-lucide="check-circle-2" style="color: var(--success);"></i>
          <p>Group is fully settled. No debts remaining!</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    settlements.forEach(tx => {
      const row = document.createElement('div');
      row.className = 'settlement-item';
      
      row.innerHTML = `
        <div class="settlement-flow">
          <span class="settlement-party debtor">${tx.from}</span>
          <div class="settlement-arrow"><i data-lucide="arrow-right"></i></div>
          <span class="settlement-party creditor">${tx.to}</span>
        </div>
        <div class="settlement-amount-box">
          <span class="settlement-value">₹${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          <button class="secondary-btn small-btn btn-settle-debt" 
            data-from="${tx.from}" data-to="${tx.to}" data-amount="${tx.amount}">
            Settle
          </button>
        </div>
      `;

      // Quick debt settlement builder
      row.querySelector('.btn-settle-debt').addEventListener('click', (e) => {
        const debtor = e.currentTarget.getAttribute('data-from');
        const creditor = e.currentTarget.getAttribute('data-to');
        const amount = parseFloat(e.currentTarget.getAttribute('data-amount'));

        // Settle by automatically creating a direct settlement transaction
        const settlementExpense = {
          amount: amount,
          description: `Settlement: ${debtor} ➔ ${creditor}`,
          category: 'Misc',
          paidBy: debtor,
          splitType: 'custom',
          splits: { [creditor]: amount }, // splitting only to the creditor (clears debt)
          date: new Date().toISOString().split('T')[0],
          location: 'Direct Settle'
        };

        DB.addTripExpense(activeTripId, settlementExpense);
        renderTripDashboard();
        showToast(`Settle: ₹${amount} logged from ${debtor} to ${creditor}`, 'success');
      });

      el.settlementList.appendChild(row);
    });

    lucide.createIcons();
  }

  // Render Filters & Expense Feed
  function renderFeedTab(expenses) {
    el.tripExpenseFeed.innerHTML = '';
    
    // Extract filter variables
    const filterMem = el.filterMember.value;
    const filterCat = el.filterCategory.value;
    const filterDt = el.filterDate.value;

    let filtered = expenses;

    // Apply Filters
    if (filterMem) {
      filtered = filtered.filter(exp => {
        // Either they paid it, or they are part of the splits list
        const involvedInSplits = exp.splits && Object.keys(exp.splits).includes(filterMem);
        return exp.paidBy === filterMem || involvedInSplits;
      });
    }

    if (filterCat) {
      filtered = filtered.filter(exp => exp.category === filterCat);
    }

    if (filterDt) {
      filtered = filtered.filter(exp => exp.date === filterDt);
    }

    if (filtered.length === 0) {
      el.tripExpenseFeed.innerHTML = `
        <div class="empty-state">
          <i data-lucide="receipt"></i>
          <p>No matching expenses found. Try resetting the filters.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    const catEmoji = { Food: '🍔', Travel: '🚗', Stay: '🏠', Activity: '🎟️', Misc: '📦' };

    filtered.forEach(exp => {
      const card = document.createElement('div');
      card.className = 'expense-feed-card';
      
      // Calculate how many members are splitting
      const splitKeys = exp.splits ? Object.keys(exp.splits) : [];
      const splitSummaryText = exp.splitType === 'equal' 
        ? `Split equally between ${splitKeys.length} members` 
        : `Custom split between ${splitKeys.length} members`;

      // Build splitting breakdown lines within card
      let splitBreakdownHtml = '';
      if (exp.splits) {
        splitBreakdownHtml = `<div class="feed-card-split-details">`;
        Object.entries(exp.splits).forEach(([name, share]) => {
          let shareClass = '';
          let shareText = `₹${share.toFixed(2)}`;
          
          if (name === exp.paidBy) {
            // Net balance for payer on this specific bill: (Payer paid - Payer share)
            const netForBill = exp.amount - share;
            shareClass = 'positive';
            shareText = `Paid & lent ₹${netForBill.toFixed(2)}`;
          } else {
            shareClass = 'negative';
            shareText = `Owes ₹${share.toFixed(2)}`;
          }

          splitBreakdownHtml += `
            <div class="feed-split-row">
              <span class="feed-split-name">${name}</span>
              <span class="feed-split-share ${shareClass}">${shareText}</span>
            </div>
          `;
        });
        splitBreakdownHtml += `</div>`;
      }

      const locText = exp.location ? exp.location : 'GPS Captured';

      card.innerHTML = `
        <div class="feed-card-header">
          <div class="feed-card-main-info">
            <div class="feed-cat-icon">
              <span>${catEmoji[exp.category] || '📦'}</span>
            </div>
            <div class="feed-text-details">
              <h4>${exp.description}</h4>
              <p>Paid by <strong class="feed-payer-highlight">${exp.paidBy}</strong></p>
            </div>
          </div>
          <div class="feed-amount-block">
            <div class="feed-amount">₹${exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div class="feed-split-summary">${splitSummaryText}</div>
          </div>
        </div>
        
        ${splitBreakdownHtml}

        <div class="feed-card-footer">
          <div class="feed-meta-left">
            <span class="feed-meta-item"><i data-lucide="calendar"></i> ${new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • ${exp.time}</span>
            <span class="feed-meta-item"><i data-lucide="map-pin"></i> ${locText}</span>
          </div>
          <button class="delete-log-btn btn-delete-expense" data-id="${exp.id}"><i data-lucide="trash-2"></i></button>
        </div>
      `;

      card.querySelector('.btn-delete-expense').addEventListener('click', (e) => {
        const expId = e.currentTarget.getAttribute('data-id');
        if (confirm('Delete this expense from the trip?')) {
          DB.deleteTripExpense(activeTripId, expId);
          renderTripDashboard();
          showToast('Expense deleted', 'warning');
        }
      });

      el.tripExpenseFeed.appendChild(card);
    });

    lucide.createIcons();
  }

  // Filter triggers
  el.filterMember.addEventListener('change', () => renderTripDashboard());
  el.filterCategory.addEventListener('change', () => renderTripDashboard());
  el.filterDate.addEventListener('change', () => renderTripDashboard());
  
  el.btnClearFilters.addEventListener('click', () => {
    el.filterMember.value = '';
    el.filterCategory.value = '';
    el.filterDate.value = '';
    renderTripDashboard();
    showToast('Filters cleared', 'info');
  });

  // --- ADD TRIP EXPENSE SHEET MODAL ---
  el.fabAddExpense.addEventListener('click', () => {
    const trip = DB.getTrip(activeTripId);
    if (!trip) return;

    // Reset Form
    el.formAddTripExpense.reset();
    el.customSplitContainer.classList.add('hidden');
    el.customSplitInputs.innerHTML = '';
    el.customSplitError.className = 'split-validation-msg';
    el.customSplitError.textContent = 'Sum matches target!';

    // Default Date to today
    el.expenseDateInput.value = new Date().toISOString().split('T')[0];

    // Get Geolocation automatically
    fetchLocation();

    // Populate Payer Select dropdown
    el.tripExpensePayer.innerHTML = '';
    trip.members.forEach(member => {
      const opt = document.createElement('option');
      opt.value = member;
      opt.textContent = member;
      el.tripExpensePayer.appendChild(opt);
    });

    // Populate split checklist (select all by default)
    el.splitMembersList.innerHTML = '';
    trip.members.forEach(member => {
      const row = document.createElement('div');
      row.className = 'split-member-check-row';
      row.innerHTML = `
        <span class="split-member-check-label">${member}</span>
        <input type="checkbox" name="split-member" value="${member}" checked>
      `;
      
      // Toggle listener on checkbox change
      row.querySelector('input').addEventListener('change', () => {
        handleSplitConfigChange();
      });

      // Clicking row toggles the checkbox
      row.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const chk = row.querySelector('input');
          chk.checked = !chk.checked;
          handleSplitConfigChange();
        }
      });

      el.splitMembersList.appendChild(row);
    });

    // Toggle Tab option listeners for equal vs custom split
    document.querySelectorAll('input[name="split-type"]').forEach(radio => {
      radio.addEventListener('change', () => {
        handleSplitConfigChange();
      });
    });

    // Amount listener
    el.tripExpenseAmount.addEventListener('input', () => {
      handleSplitConfigChange();
    });

    el.modalAddExpense.classList.add('active');
  });

  // Close sheet
  el.btnCloseAddExpense.addEventListener('click', () => {
    el.modalAddExpense.classList.remove('active');
  });
  el.addExpenseBackdrop.addEventListener('click', () => {
    el.modalAddExpense.classList.remove('active');
  });

  // Handle configuration changes inside the add expense slide panel
  function handleSplitConfigChange() {
    const totalAmount = parseFloat(el.tripExpenseAmount.value) || 0;
    const splitType = document.querySelector('input[name="split-type"]:checked').value;
    
    // Get all checked split members
    const checkedCheckboxes = document.querySelectorAll('input[name="split-member"]:checked');
    const selectedMembers = Array.from(checkedCheckboxes).map(c => c.value);

    const submitBtn = el.formAddTripExpense.querySelector('button[type="submit"]');
    submitBtn.disabled = false; // enable by default

    if (splitType === 'equal') {
      el.customSplitContainer.classList.add('hidden');
      el.customSplitInputs.innerHTML = '';
      el.customSplitError.className = 'split-validation-msg';
      el.customSplitError.textContent = 'Amount will be divided equally.';
    } else {
      // Custom splits mode
      el.customSplitContainer.classList.remove('hidden');
      el.customSplitTotalLabel.textContent = `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

      // Generate input rows for selected members only
      const prevShares = {};
      el.customSplitInputs.querySelectorAll('input').forEach(inp => {
        prevShares[inp.dataset.member] = inp.value;
      });

      el.customSplitInputs.innerHTML = '';
      
      if (selectedMembers.length === 0) {
        el.customSplitError.textContent = 'Please select at least one member to split.';
        el.customSplitError.className = 'split-validation-msg error';
        submitBtn.disabled = true;
        return;
      }

      // Proportional starting suggestion to help user
      const suggestedBase = Math.floor((totalAmount / selectedMembers.length) * 100) / 100;

      selectedMembers.forEach((member, index) => {
        const row = document.createElement('div');
        row.className = 'custom-split-row';
        
        let startVal = prevShares[member] || '';
        // If empty amount list, prefill suggestions
        if (!startVal && totalAmount > 0) {
          const extra = index === 0 ? Math.round((totalAmount - suggestedBase * selectedMembers.length) * 100) / 100 : 0;
          startVal = (suggestedBase + extra).toFixed(2);
        }

        row.innerHTML = `
          <span class="custom-split-name">${member}</span>
          <div class="custom-split-input-wrapper">
            <span>₹</span>
            <input type="number" data-member="${member}" value="${startVal}" step="0.01" min="0" placeholder="0.00">
          </div>
        `;

        row.querySelector('input').addEventListener('input', () => {
          validateCustomSplitValues();
        });

        el.customSplitInputs.appendChild(row);
      });

      validateCustomSplitValues();
    }
  }

  function validateCustomSplitValues() {
    const totalAmount = parseFloat(el.tripExpenseAmount.value) || 0;
    const shareInputs = el.customSplitInputs.querySelectorAll('input');
    const submitBtn = el.formAddTripExpense.querySelector('button[type="submit"]');

    const splitsObj = {};
    shareInputs.forEach(inp => {
      splitsObj[inp.dataset.member] = parseFloat(inp.value) || 0;
    });

    const validation = Engine.validateCustomSplits(totalAmount, splitsObj);
    
    if (validation.isValid) {
      el.customSplitError.textContent = 'Sum matches target!';
      el.customSplitError.className = 'split-validation-msg';
      submitBtn.disabled = false;
    } else {
      const absDiff = Math.abs(validation.difference);
      const isOver = validation.difference < 0;
      const statusText = isOver ? `over budget by ₹${absDiff.toFixed(2)}` : `remaining ₹${absDiff.toFixed(2)}`;
      
      el.customSplitError.textContent = `Total custom shares sum: ₹${validation.sum.toFixed(2)} (${statusText})`;
      el.customSplitError.className = 'split-validation-msg error';
      submitBtn.disabled = true;
    }
  }

  // Add Trip Expense Submit Form
  el.formAddTripExpense.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(el.tripExpenseAmount.value);
    const description = el.tripExpenseDesc.value.trim();
    const category = document.querySelector('input[name="trip-expense-category"]:checked').value;
    const paidBy = el.tripExpensePayer.value;
    const splitType = document.querySelector('input[name="split-type"]:checked').value;
    const date = el.expenseDateInput.value;
    const location = el.expenseGpsValue.value || 'GPS Offline';

    // Get checked members
    const checkedCheckboxes = document.querySelectorAll('input[name="split-member"]:checked');
    const selectedMembers = Array.from(checkedCheckboxes).map(c => c.value);

    if (!amount || !description || selectedMembers.length === 0) {
      showToast('Please check all input details', 'warning');
      return;
    }

    let finalSplits = {};
    if (splitType === 'equal') {
      finalSplits = Engine.calculateEqualSplits(amount, selectedMembers);
    } else {
      // Gather inputs
      const shareInputs = el.customSplitInputs.querySelectorAll('input');
      shareInputs.forEach(inp => {
        finalSplits[inp.dataset.member] = Math.round((parseFloat(inp.value) || 0) * 100) / 100;
      });
      
      const validation = Engine.validateCustomSplits(amount, finalSplits);
      if (!validation.isValid) {
        showToast('Custom split amounts must sum exactly to bill total', 'warning');
        return;
      }
    }

    const expenseData = {
      amount,
      description,
      category,
      paidBy,
      splitType,
      splits: finalSplits,
      date,
      location
    };

    DB.addTripExpense(activeTripId, expenseData);
    el.modalAddExpense.classList.remove('active');
    
    renderTripDashboard();
    showToast('Expense logged successfully', 'success');
  });

  // --- TRIP SETTINGS / EDIT MODAL ---
  el.btnTripSettings.addEventListener('click', () => {
    const trip = DB.getTrip(activeTripId);
    if (!trip) return;

    el.settingsTripName.value = trip.name;
    el.settingsTripBudget.value = trip.budget || '';
    
    renderSettingsMembersList(trip);
    el.modalTripSettings.classList.add('active');
  });

  el.btnCloseTripSettings.addEventListener('click', () => {
    el.modalTripSettings.classList.remove('active');
  });

  function renderSettingsMembersList(trip) {
    el.settingsMembersList.innerHTML = '';
    trip.members.forEach(member => {
      const row = document.createElement('div');
      row.className = 'settings-member-row';
      row.innerHTML = `
        <span class="settings-member-name">${member}</span>
        <button type="button" class="settings-remove-member-btn" data-name="${member}">
          <i data-lucide="user-minus"></i>
        </button>
      `;

      row.querySelector('.settings-remove-member-btn').addEventListener('click', (e) => {
        const nameToRemove = e.currentTarget.getAttribute('data-name');
        
        // Validation: cannot remove if they are the only member
        if (trip.members.length <= 1) {
          showToast('A trip must have at least 1 member', 'warning');
          return;
        }

        // Warning/Check: did they pay or owe anything?
        const hasExpenses = trip.expenses.some(exp => {
          const inSplits = exp.splits && Object.keys(exp.splits).includes(nameToRemove);
          return exp.paidBy === nameToRemove || inSplits;
        });

        if (hasExpenses) {
          if (!confirm(`${nameToRemove} has existing expenses recorded in this trip. Removing them will alter splitting balances. Proceed?`)) {
            return;
          }
        }

        const updatedMembers = trip.members.filter(m => m !== nameToRemove);
        DB.updateTrip(activeTripId, { members: updatedMembers });
        
        // Remove their specific split listings in all existing expenses if desired, 
        // or let the user resolve balance. Let's keep it simple: updates member list.
        const freshTrip = DB.getTrip(activeTripId);
        renderSettingsMembersList(freshTrip);
        renderTripDashboard();
        showToast(`Removed member ${nameToRemove}`, 'warning');
      });

      el.settingsMembersList.appendChild(row);
    });
    lucide.createIcons();
  }

  // Adding a member via settings
  el.btnSettingsAddMember.addEventListener('click', () => {
    const trip = DB.getTrip(activeTripId);
    if (!trip) return;

    const newMName = el.settingsNewMember.value.trim();
    if (!newMName) return;

    if (trip.members.includes(newMName)) {
      showToast('Member name already exists', 'warning');
      return;
    }

    const updatedMembers = [...trip.members, newMName];
    DB.updateTrip(activeTripId, { members: updatedMembers });
    
    el.settingsNewMember.value = '';
    
    const freshTrip = DB.getTrip(activeTripId);
    renderSettingsMembersList(freshTrip);
    renderTripDashboard();
    showToast(`Added member ${newMName}`, 'success');
  });

  // Submit Settings Edit
  el.formTripSettings.addEventListener('submit', (e) => {
    e.preventDefault();
    const updatedName = el.settingsTripName.value.trim();
    const updatedBudget = parseFloat(el.settingsTripBudget.value) || 0;

    if (!updatedName) return;

    DB.updateTrip(activeTripId, {
      name: updatedName,
      budget: updatedBudget
    });

    el.modalTripSettings.classList.remove('active');
    renderTripDashboard();
    showToast('Trip settings updated', 'success');
  });

  // Delete Trip Action
  el.btnDeleteTrip.addEventListener('click', () => {
    if (confirm('Are you absolutely sure you want to delete this trip and all its expense data? This action cannot be undone.')) {
      DB.deleteTrip(activeTripId);
      el.modalTripSettings.classList.remove('active');
      navigateTo('screen-home');
      showToast('Trip deleted successfully', 'warning');
    }
  });

  // --- REAL-TIME TAB SYNC LOGIC ---
  DB.onSync((change) => {
    console.log('Tab sync detected local update:', change.key);
    
    // Check screen context and re-draw
    if (currentScreen === 'screen-home') {
      renderHomeScreen();
    } else if (currentScreen === 'screen-trip-dashboard') {
      // Verify if the active trip still exists
      const trip = DB.getTrip(activeTripId);
      if (!trip) {
        navigateTo('screen-home');
        showToast('Active trip was deleted in another tab', 'warning');
      } else {
        renderTripDashboard();
        showToast('Refreshed trip data (real-time sync)', 'info');
      }
    } else if (currentScreen === 'screen-individual') {
      renderIndividualTracker();
      showToast('Refreshed personal data (real-time sync)', 'info');
    }
  });

  // --- APP STARTUP ---
  // Default launch
  navigateTo('screen-home');
});
