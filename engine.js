/* ==========================================================================
   EXPENSE SPLITTING & DEBT SIMPLIFICATION ENGINE
   ========================================================================== */

const Engine = {
  /**
   * Calculates penny-accurate equal splits among a list of members.
   * Ensures that sum(splits) is exactly equal to the total amount.
   * Any rounding remainders are distributed to the first members.
   */
  calculateEqualSplits(amount, members) {
    const total = parseFloat(amount);
    if (isNaN(total) || total <= 0 || !members || members.length === 0) {
      return {};
    }

    const count = members.length;
    const baseShare = Math.floor((total / count) * 100) / 100;
    // Calculate remainder in cents
    const remainderCents = Math.round((total - (baseShare * count)) * 100);

    const splits = {};
    members.forEach((member, index) => {
      // Add one cent to the first 'remainderCents' members to absorb the remainder
      const extraCent = index < remainderCents ? 0.01 : 0;
      splits[member] = Math.round((baseShare + extraCent) * 100) / 100;
    });

    return splits;
  },

  /**
   * Validates if a custom split configuration sums up exactly to the total amount.
   * Returns { isValid: boolean, sum: number, difference: number }
   */
  validateCustomSplits(amount, splits) {
    const total = parseFloat(amount);
    const splitSum = Object.values(splits).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const roundedSum = Math.round(splitSum * 100) / 100;
    const diff = Math.round((total - roundedSum) * 100) / 100;
    
    return {
      isValid: Math.abs(diff) < 0.01,
      sum: roundedSum,
      difference: diff
    };
  },

  /**
   * Aggregates total paid, total owed, and net balance for all members of a trip.
   * Also computes the simplified debt resolution list.
   */
  calculateTripBalances(trip) {
    if (!trip) return null;

    const totalSpent = trip.expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const balances = {};

    // Initialize balances for all members
    trip.members.forEach(member => {
      balances[member] = {
        paid: 0,
        owed: 0,
        net: 0,
        contributionPercent: 0
      };
    });

    // Aggregate values
    trip.expenses.forEach(expense => {
      const payer = expense.paidBy;
      const amount = expense.amount;

      // Add to payer's paid total
      if (balances[payer]) {
        balances[payer].paid += amount;
      }

      // Add to each member's owed total based on their split share
      if (expense.splits) {
        Object.entries(expense.splits).forEach(([member, share]) => {
          if (balances[member]) {
            balances[member].owed += parseFloat(share) || 0;
          }
        });
      }
    });

    // Compute net balances and round values
    Object.keys(balances).forEach(member => {
      const paid = Math.round(balances[member].paid * 100) / 100;
      const owed = Math.round(balances[member].owed * 100) / 100;
      
      balances[member].paid = paid;
      balances[member].owed = owed;
      balances[member].net = Math.round((paid - owed) * 100) / 100;
      balances[member].contributionPercent = totalSpent > 0 ? (paid / totalSpent) * 100 : 0;
    });

    // Calculate simplified settlements
    const settlements = this.simplifyDebts(balances);

    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      memberBalances: balances,
      settlements: settlements
    };
  },

  /**
   * Debt Simplification Algorithm (Greedy Flow Matcher)
   * Minimizes the number of transactions required to settle debts.
   */
  simplifyDebts(balances) {
    const debtors = [];  // Negative balances (needs to pay)
    const creditors = []; // Positive balances (needs to receive)

    // Separate members into debtors and creditors
    Object.entries(balances).forEach(([name, balInfo]) => {
      const net = balInfo.net;
      if (net < -0.01) {
        debtors.push({ name, balance: -net }); // keep positive for easy math
      } else if (net > 0.01) {
        creditors.push({ name, balance: net });
      }
    });

    // Sort descending by amount to settle largest items first (Greedy choice)
    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const transactions = [];
    let dIdx = 0;
    let cIdx = 0;

    // Settle debts
    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      // Handle floating point remainders
      if (debtor.balance < 0.01) {
        dIdx++;
        continue;
      }
      if (creditor.balance < 0.01) {
        cIdx++;
        continue;
      }

      // Settle the minimum of the two balances
      const amountToSettle = Math.min(debtor.balance, creditor.balance);
      const roundedAmount = Math.round(amountToSettle * 100) / 100;

      if (roundedAmount > 0.01) {
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount: roundedAmount
        });
      }

      debtor.balance -= amountToSettle;
      creditor.balance -= amountToSettle;

      if (debtor.balance < 0.01) {
        dIdx++;
      }
      if (creditor.balance < 0.01) {
        cIdx++;
      }
    }

    return transactions;
  }
};

window.Engine = Engine; // Expose to window
