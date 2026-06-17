/* ==========================================================================
   DATABASE SERVICE (localStorage & Cross-Tab Real-time Sync)
   ========================================================================== */
const DB_PREFIX = 'spendy_';
const STORAGE_KEYS = {
  TRIPS: DB_PREFIX + 'trips',
  INDIVIDUAL: DB_PREFIX + 'ind_expenses',
  THEME: DB_PREFIX + 'theme'
};

const DB = {
  // Sync listeners
  _onSyncCallbacks: [],

  init() {
    // Check if initial storage exists, if not initialize with mock data for a polished first look
    if (!localStorage.getItem(STORAGE_KEYS.TRIPS)) {
      this._seedMockData();
    }
    if (!localStorage.getItem(STORAGE_KEYS.INDIVIDUAL)) {
      localStorage.setItem(STORAGE_KEYS.INDIVIDUAL, JSON.stringify([]));
    }

    // Set up storage event listener for cross-tab sync
    window.addEventListener('storage', (e) => {
      if (Object.values(STORAGE_KEYS).includes(e.key)) {
        this._onSyncCallbacks.forEach(cb => cb({
          key: e.key,
          newValue: e.newValue,
          oldValue: e.oldValue
        }));
      }
    });
  },

  onSync(callback) {
    if (typeof callback === 'function') {
      this._onSyncCallbacks.push(callback);
    }
  },

  // --- TRIPS CRUD ---
  getTrips() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRIPS)) || [];
    } catch (e) {
      console.error('Error parsing trips data', e);
      return [];
    }
  },

  saveTrips(trips) {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  },

  createTrip(name, budget, members) {
    const trips = this.getTrips();
    const newTrip = {
      id: 'trip_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      budget: parseFloat(budget) || 0,
      members: members.map(m => m.trim()).filter(m => m !== ''),
      expenses: [],
      createdAt: new Date().toISOString()
    };
    trips.unshift(newTrip);
    this.saveTrips(trips);
    return newTrip;
  },

  getTrip(id) {
    const trips = this.getTrips();
    return trips.find(t => t.id === id) || null;
  },

  updateTrip(tripId, updatedFields) {
    const trips = this.getTrips();
    const idx = trips.findIndex(t => t.id === tripId);
    if (idx !== -1) {
      trips[idx] = { ...trips[idx], ...updatedFields };
      this.saveTrips(trips);
      return trips[idx];
    }
    return null;
  },

  deleteTrip(tripId) {
    let trips = this.getTrips();
    trips = trips.filter(t => t.id !== tripId);
    this.saveTrips(trips);
  },

  addTripExpense(tripId, expenseData) {
    const trips = this.getTrips();
    const tripIdx = trips.findIndex(t => t.id === tripId);
    if (tripIdx === -1) return null;

    const newExpense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      amount: parseFloat(expenseData.amount),
      description: expenseData.description.trim(),
      category: expenseData.category || 'Misc',
      paidBy: expenseData.paidBy,
      splitType: expenseData.splitType, // 'equal' or 'custom'
      splits: expenseData.splits, // Object mapping member name to split amount or check state
      date: expenseData.date || new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: expenseData.location || null,
      createdAt: new Date().toISOString()
    };

    trips[tripIdx].expenses.unshift(newExpense);
    this.saveTrips(trips);
    return newExpense;
  },

  deleteTripExpense(tripId, expenseId) {
    const trips = this.getTrips();
    const tripIdx = trips.findIndex(t => t.id === tripId);
    if (tripIdx === -1) return false;

    const initialLen = trips[tripIdx].expenses.length;
    trips[tripIdx].expenses = trips[tripIdx].expenses.filter(e => e.id !== expenseId);
    
    if (trips[tripIdx].expenses.length < initialLen) {
      this.saveTrips(trips);
      return true;
    }
    return false;
  },

  // --- INDIVIDUAL EXPENSES CRUD ---
  getIndExpenses() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.INDIVIDUAL)) || [];
    } catch (e) {
      console.error('Error parsing individual expenses', e);
      return [];
    }
  },

  saveIndExpenses(expenses) {
    localStorage.setItem(STORAGE_KEYS.INDIVIDUAL, JSON.stringify(expenses));
  },

  addIndExpense(amount, category, description) {
    const expenses = this.getIndExpenses();
    const newExpense = {
      id: 'ind_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      amount: parseFloat(amount),
      category: category,
      description: description.trim(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString()
    };
    expenses.unshift(newExpense);
    this.saveIndExpenses(expenses);
    return newExpense;
  },

  deleteIndExpense(expenseId) {
    let expenses = this.getIndExpenses();
    const initialLen = expenses.length;
    expenses = expenses.filter(e => e.id !== expenseId);
    if (expenses.length < initialLen) {
      this.saveIndExpenses(expenses);
      return true;
    }
    return false;
  },

  // --- THEME ---
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  // --- MOCK SEEDING FOR PREMIUM USER EXPERIENCE ---
  _seedMockData() {
    const mockTrips = [
      {
        id: 'trip_mock_goa',
        name: 'Road Trip to Goa 🌴',
        budget: 40000,
        members: ['Aman', 'Kabir', 'Rhea', 'Zara'],
        expenses: [
          {
            id: 'exp_mock_1',
            amount: 12000,
            description: 'Airbnb Villa Stay',
            category: 'Stay',
            paidBy: 'Rhea',
            splitType: 'equal',
            splits: { 'Aman': 3000, 'Kabir': 3000, 'Rhea': 3000, 'Zara': 3000 },
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '14:30',
            location: 'Anjuna, Goa',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'exp_mock_2',
            amount: 4800,
            description: 'Highway Petrol & Tolls',
            category: 'Travel',
            paidBy: 'Kabir',
            splitType: 'equal',
            splits: { 'Aman': 1200, 'Kabir': 1200, 'Rhea': 1200, 'Zara': 1200 },
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '09:15',
            location: 'Kolhapur Highway',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'exp_mock_3',
            amount: 6500,
            description: 'Beach Shack Seafood Dinner',
            category: 'Food',
            paidBy: 'Aman',
            splitType: 'custom',
            splits: { 'Aman': 2000, 'Kabir': 1500, 'Rhea': 1500, 'Zara': 1500 },
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            time: '21:45',
            location: 'Curlies Beach Shack, Goa',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'exp_mock_4',
            amount: 2400,
            description: 'Scuba Diving Deposit',
            category: 'Activity',
            paidBy: 'Zara',
            splitType: 'equal',
            splits: { 'Kabir': 800, 'Rhea': 800, 'Zara': 800 }, // Aman didn't split (did not dive)
            date: new Date().toISOString().split('T')[0],
            time: '11:00',
            location: 'Grand Island, Goa',
            createdAt: new Date().toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    this.saveTrips(mockTrips);
  }
};

// Initialize DB immediately
DB.init();
window.DB = DB; // expose to other modules
