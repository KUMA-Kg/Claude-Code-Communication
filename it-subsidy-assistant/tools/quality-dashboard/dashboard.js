/**
 * Quality Dashboard JavaScript
 * Real-time monitoring and visualization for subsidy application system
 */

class QualityDashboard {
    constructor() {
        this.charts = {};
        this.intervals = [];
        this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001/v1';
        this.init();
    }

    init() {
        this.initCharts();
        this.loadInitialData();
        this.startRealTimeUpdates();
        this.setupEventListeners();
    }

    initCharts() {
        // Test History Chart
        const testHistoryCtx = document.getElementById('testHistoryChart').getContext('2d');
        this.charts.testHistory = new Chart(testHistoryCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '合格',
                        data: [],
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: '失敗',
                        data: [],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

        // Accuracy Chart
        const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
        this.charts.accuracy = new Chart(accuracyCtx, {
            type: 'doughnut',
            data: {
                labels: ['IT導入補助金', 'ものづくり補助金', '小規模事業者持続化'],
                datasets: [{
                    data: [98, 96, 89],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.updateMetrics(),
                this.updateTestHistory(),
                this.updateSystemStatus(),
                this.updatePerformanceMetrics()
            ]);
        } catch (error) {
            this.showAlert('データの初期読み込みに失敗しました', 'error');
            console.error('Initial data load failed:', error);
        }
    }

    async updateMetrics() {
        try {
            // Simulate API call - replace with actual API endpoint
            const mockData = {
                passRate: this.generateRandomMetric(95, 99),
                coverage: this.generateRandomMetric(85, 95),
                responseTime: this.generateRandomMetric(800, 1500),
                errorRate: this.generateRandomMetric(0.1, 2.0)
            };

            // Update DOM elements
            document.getElementById('passRate').textContent = `${mockData.passRate.toFixed(1)}%`;
            document.getElementById('coverage').textContent = `${mockData.coverage.toFixed(1)}%`;
            document.getElementById('responseTime').textContent = `${mockData.responseTime.toFixed(0)}ms`;
            document.getElementById('errorRate').textContent = `${mockData.errorRate.toFixed(2)}%`;

            // Update change indicators
            this.updateChangeIndicator('passRateChange', '+2.1%', 'positive');
            this.updateChangeIndicator('coverageChange', '+0.8%', 'positive');
            this.updateChangeIndicator('responseTimeChange', '-50ms', 'positive');
            this.updateChangeIndicator('errorRateChange', '+0.1%', 'negative');

        } catch (error) {
            console.error('Failed to update metrics:', error);
        }
    }

    async updateTestHistory() {
        try {
            const now = new Date();
            const labels = [];
            const passedData = [];
            const failedData = [];

            // Generate last 12 hours of data
            for (let i = 11; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 60 * 60 * 1000);
                labels.push(time.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }));
                passedData.push(Math.floor(Math.random() * 20) + 80);
                failedData.push(Math.floor(Math.random() * 5) + 1);
            }

            this.charts.testHistory.data.labels = labels;
            this.charts.testHistory.data.datasets[0].data = passedData;
            this.charts.testHistory.data.datasets[1].data = failedData;
            this.charts.testHistory.update('none');

        } catch (error) {
            console.error('Failed to update test history:', error);
        }
    }

    async updateSystemStatus() {
        try {
            // Simulate system health check
            const services = [
                { name: 'バックエンドAPI', status: 'green', message: '正常' },
                { name: 'データベース', status: 'green', message: '正常' },
                { name: '外部API', status: 'yellow', message: '一部遅延' }
            ];

            const systemStatusEl = document.getElementById('systemStatus');
            systemStatusEl.innerHTML = services.map(service => `
                <div class="status-item">
                    <div style="display: flex; align-items: center;">
                        <div class="status-indicator ${service.status}"></div>
                        <span>${service.name}</span>
                    </div>
                    <span>${service.message}</span>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to update system status:', error);
        }
    }

    async updatePerformanceMetrics() {
        try {
            const metrics = {
                avgJudgmentTime: (Math.random() * 0.5 + 0.8).toFixed(1) + 's',
                memoryUsage: Math.floor(Math.random() * 20 + 40) + 'MB',
                cpuUsage: Math.floor(Math.random() * 10 + 10) + '%'
            };

            document.getElementById('avgJudgmentTime').textContent = metrics.avgJudgmentTime;
            document.getElementById('memoryUsage').textContent = metrics.memoryUsage;
            document.getElementById('cpuUsage').textContent = metrics.cpuUsage;

        } catch (error) {
            console.error('Failed to update performance metrics:', error);
        }
    }

    updateChangeIndicator(elementId, value, type) {
        const element = document.getElementById(elementId);
        element.textContent = value;
        element.className = `metric-change ${type}`;
    }

    generateRandomMetric(min, max) {
        return Math.random() * (max - min) + min;
    }

    startRealTimeUpdates() {
        // Update metrics every 30 seconds
        this.intervals.push(setInterval(() => {
            this.updateMetrics();
        }, 30000));

        // Update test history every 5 minutes
        this.intervals.push(setInterval(() => {
            this.updateTestHistory();
        }, 300000));

        // Update system status every 1 minute
        this.intervals.push(setInterval(() => {
            this.updateSystemStatus();
        }, 60000));

        // Update performance metrics every 15 seconds
        this.intervals.push(setInterval(() => {
            this.updatePerformanceMetrics();
        }, 15000));
    }

    setupEventListeners() {
        // Refresh button
        window.refreshData = () => {
            this.showLoading(true);
            this.loadInitialData().then(() => {
                this.showLoading(false);
                this.showAlert('データが更新されました', 'success');
            });
        };

        // Handle window visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible, refresh data
                this.loadInitialData();
            }
        });

        // Handle connection errors
        window.addEventListener('online', () => {
            this.showAlert('接続が復旧しました', 'success');
            this.loadInitialData();
        });

        window.addEventListener('offline', () => {
            this.showAlert('インターネット接続が切断されました', 'error');
        });
    }

    showAlert(message, type = 'info') {
        const alertsContainer = document.getElementById('alerts');
        const alertId = 'alert-' + Date.now();
        
        const alertClass = {
            success: 'alert-success',
            error: 'alert-error',
            warning: 'alert-warning',
            info: 'alert-info'
        }[type] || 'alert-info';

        const alertHTML = `
            <div id="${alertId}" class="alert ${alertClass}" style="margin-bottom: 1rem;">
                ${message}
                <button onclick="document.getElementById('${alertId}').remove()" style="float: right; background: none; border: none; cursor: pointer;">&times;</button>
            </div>
        `;

        alertsContainer.insertAdjacentHTML('beforeend', alertHTML);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const alertElement = document.getElementById(alertId);
            if (alertElement) {
                alertElement.remove();
            }
        }, 5000);
    }

    showLoading(show) {
        const container = document.querySelector('.container');
        if (show) {
            container.classList.add('loading');
        } else {
            container.classList.remove('loading');
        }
    }

    // API Integration methods
    async fetchMetrics() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/metrics/quality`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch metrics:', error);
            throw error;
        }
    }

    async fetchTestResults() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/test-results`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch test results:', error);
            throw error;
        }
    }

    async fetchSystemHealth() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/health`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch system health:', error);
            throw error;
        }
    }

    // Cleanup
    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        Object.values(this.charts).forEach(chart => chart.destroy());
    }
}

// Advanced Quality Metrics Calculator
class QualityMetricsCalculator {
    static calculateTestReliability(testResults) {
        const totalTests = testResults.length;
        const passedTests = testResults.filter(r => r.status === 'passed').length;
        return (passedTests / totalTests) * 100;
    }

    static calculateCoverage(coverageData) {
        const weights = { statements: 0.4, branches: 0.3, functions: 0.2, lines: 0.1 };
        return Object.entries(weights).reduce((total, [key, weight]) => {
            return total + (coverageData[key] || 0) * weight;
        }, 0);
    }

    static calculatePerformanceScore(metrics) {
        const scoreFactors = {
            responseTime: (time) => Math.max(0, 100 - (time - 500) / 10), // Optimal at 500ms
            errorRate: (rate) => Math.max(0, 100 - rate * 10),
            throughput: (tps) => Math.min(100, tps / 10) // Transactions per second
        };

        return Object.entries(scoreFactors).reduce((total, [key, calculator]) => {
            return total + (calculator(metrics[key] || 0) / Object.keys(scoreFactors).length);
        }, 0);
    }

    static generateQualityReport(data) {
        return {
            overall: this.calculateOverallQuality(data),
            reliability: this.calculateTestReliability(data.testResults),
            coverage: this.calculateCoverage(data.coverage),
            performance: this.calculatePerformanceScore(data.performance),
            recommendations: this.generateRecommendations(data)
        };
    }

    static calculateOverallQuality(data) {
        const weights = { reliability: 0.4, coverage: 0.3, performance: 0.3 };
        const reliability = this.calculateTestReliability(data.testResults);
        const coverage = this.calculateCoverage(data.coverage);
        const performance = this.calculatePerformanceScore(data.performance);

        return reliability * weights.reliability + 
               coverage * weights.coverage + 
               performance * weights.performance;
    }

    static generateRecommendations(data) {
        const recommendations = [];
        
        const reliability = this.calculateTestReliability(data.testResults);
        if (reliability < 95) {
            recommendations.push('テスト信頼性が95%を下回っています。失敗テストの原因調査が必要です。');
        }

        const coverage = this.calculateCoverage(data.coverage);
        if (coverage < 80) {
            recommendations.push('コードカバレッジが80%を下回っています。テストケースの追加を検討してください。');
        }

        const performance = this.calculatePerformanceScore(data.performance);
        if (performance < 70) {
            recommendations.push('パフォーマンススコアが低下しています。応答時間の最適化が必要です。');
        }

        return recommendations;
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new QualityDashboard();
    
    // Make dashboard globally accessible for debugging
    window.qualityDashboard = dashboard;
    window.QualityMetricsCalculator = QualityMetricsCalculator;
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        dashboard.destroy();
    });
});