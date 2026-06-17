/* ==========================================================================
   CHARTS & VISUALIZATIONS WRAPPER (CHART.JS)
   ========================================================================== */

const Charts = {
  distributionChartInstance: null,
  trendChartInstance: null,

  // Color mapping matching our CSS design system
  categoryColors: {
    Food: '#3b82f6',     // Blue
    Travel: '#10b981',   // Green
    Stay: '#ec4899',     // Pink
    Activity: '#8b5cf6', // Violet
    Misc: '#f59e0b'      // Orange
  },

  // Base font configuration
  _getFontConfig() {
    const isLightTheme = document.body.classList.contains('light-theme');
    return {
      family: "'Plus Jakarta Sans', sans-serif",
      size: 11,
      weight: '600',
      color: isLightTheme ? '#475569' : '#94a3b8'
    };
  },

  // Chart grid line colors
  _getGridColor() {
    const isLightTheme = document.body.classList.contains('light-theme');
    return isLightTheme ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
  },

  /**
   * Renders/Updates the category-wise donut chart
   */
  updateDistributionChart(expenses) {
    const ctx = document.getElementById('chart-distribution');
    if (!ctx) return;

    // Aggregate category-wise expenses
    const categoryTotals = { Food: 0, Travel: 0, Stay: 0, Activity: 0, Misc: 0 };
    let hasData = false;

    expenses.forEach(exp => {
      const cat = exp.category || 'Misc';
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += exp.amount;
        hasData = true;
      }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map(label => this.categoryColors[label]);

    // If no expenses, show a mock neutral empty state in the chart
    const chartData = hasData ? data : [1];
    const chartLabels = hasData ? labels : ['No Expenses'];
    const chartColors = hasData ? backgroundColors : ['rgba(148, 163, 184, 0.15)'];

    if (this.distributionChartInstance) {
      this.distributionChartInstance.destroy();
    }

    const font = this._getFontConfig();
    const isLightTheme = document.body.classList.contains('light-theme');

    this.distributionChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: chartLabels,
        datasets: [{
          data: chartData,
          backgroundColor: chartColors,
          borderWidth: isLightTheme ? 2 : 1,
          borderColor: isLightTheme ? '#ffffff' : '#1e1d29',
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              boxWidth: 8,
              boxHeight: 8,
              usePointStyle: true,
              padding: 12,
              font: {
                family: font.family,
                size: 10,
                weight: '600'
              },
              color: font.color
            }
          },
          tooltip: {
            enabled: hasData,
            backgroundColor: isLightTheme ? 'rgba(255,255,255,0.95)' : 'rgba(15, 23, 42, 0.95)',
            titleColor: isLightTheme ? '#0f172a' : '#ffffff',
            bodyColor: isLightTheme ? '#475569' : '#cbd5e1',
            borderColor: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return ` ₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        cutout: '68%',
        layout: {
          padding: 4
        }
      }
    });
  },

  /**
   * Renders/Updates the daily spending trend area line chart
   */
  updateTrendChart(expenses) {
    const ctx = document.getElementById('chart-trend');
    if (!ctx) return;

    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
    }

    if (!expenses || expenses.length === 0) {
      // Draw empty placeholder chart
      this._renderEmptyTrendChart(ctx);
      return;
    }

    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group expenses by date
    const dailyTotals = {};
    sortedExpenses.forEach(exp => {
      const dateStr = exp.date;
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + exp.amount;
    });

    const dates = Object.keys(dailyTotals);
    const amounts = Object.values(dailyTotals);

    // Calculate cumulative sum
    const cumulativeAmounts = [];
    let sum = 0;
    amounts.forEach(amount => {
      sum += amount;
      cumulativeAmounts.push(Math.round(sum * 100) / 100);
    });

    // Format dates for display (e.g. "17 Jun")
    const formattedLabels = dates.map(dateStr => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    });

    const font = this._getFontConfig();
    const gridColor = this._getGridColor();
    const isLightTheme = document.body.classList.contains('light-theme');

    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedLabels,
        datasets: [{
          label: 'Total Spent',
          data: cumulativeAmounts,
          fill: true,
          backgroundColor: function(context) {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
            return gradient;
          },
          borderColor: '#6366f1',
          borderWidth: 2,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: isLightTheme ? '#ffffff' : '#090a0f',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isLightTheme ? 'rgba(255,255,255,0.95)' : 'rgba(15, 23, 42, 0.95)',
            titleColor: isLightTheme ? '#0f172a' : '#ffffff',
            bodyColor: isLightTheme ? '#475569' : '#cbd5e1',
            borderColor: isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const value = context.raw;
                return ` Cumulative: ₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: font.family,
                size: 9
              },
              color: font.color,
              maxTicksLimit: 5
            }
          },
          y: {
            grid: {
              color: gridColor,
              drawTicks: false
            },
            ticks: {
              font: {
                family: font.family,
                size: 9
              },
              color: font.color,
              maxTicksLimit: 4,
              callback: function(value) {
                if (value >= 1000) {
                  return '₹' + (value / 1000) + 'k';
                }
                return '₹' + value;
              }
            },
            border: {
              dash: [4, 4]
            }
          }
        }
      }
    });
  },

  _renderEmptyTrendChart(ctx) {
    const font = this._getFontConfig();
    const gridColor = this._getGridColor();

    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Day 1', 'Day 2', 'Day 3'],
        datasets: [{
          data: [0, 0, 0],
          fill: false,
          borderColor: 'rgba(148, 163, 184, 0.2)',
          borderWidth: 1,
          borderDash: [5, 5],
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: font.family, size: 9 }, color: 'rgba(148, 163, 184, 0.4)' }
          },
          y: {
            grid: { color: gridColor },
            ticks: { font: { family: font.family, size: 9 }, color: 'rgba(148, 163, 184, 0.4)', maxTicksLimit: 3 }
          }
        }
      }
    });
  },

  // Destroy all active chart instances (useful when themes change)
  destroyAll() {
    if (this.distributionChartInstance) {
      this.distributionChartInstance.destroy();
      this.distributionChartInstance = null;
    }
    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
      this.trendChartInstance = null;
    }
  }
};

window.Charts = Charts; // Expose to window
