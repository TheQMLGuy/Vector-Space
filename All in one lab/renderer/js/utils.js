/**
 * QAGI Lab - Utility Functions
 * Common utilities used across all tabs
 */

const QAGIUtils = {
    /**
     * Format a number for display with appropriate precision
     */
    formatNumber(num, precision = 4) {
        if (typeof num !== 'number' || isNaN(num)) return 'NaN';
        if (!isFinite(num)) return num > 0 ? '∞' : '-∞';

        // Handle very small numbers
        if (Math.abs(num) < 1e-10 && num !== 0) {
            return num.toExponential(precision);
        }

        // Handle very large numbers
        if (Math.abs(num) > 1e10) {
            return num.toExponential(precision);
        }

        // Regular formatting
        const rounded = Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
        return rounded.toString();
    },

    /**
     * Format a complex number for display
     */
    formatComplex(real, imag, precision = 4) {
        const r = this.formatNumber(real, precision);
        const i = this.formatNumber(Math.abs(imag), precision);

        if (imag === 0) return r;
        if (real === 0) return imag > 0 ? `${i}i` : `-${i}i`;

        const sign = imag > 0 ? '+' : '-';
        return `${r} ${sign} ${i}i`;
    },

    /**
     * Parse a mathematical expression safely
     */
    parseExpression(expr) {
        try {
            return math.parse(expr);
        } catch (e) {
            console.error('Parse error:', e);
            return null;
        }
    },

    /**
     * Evaluate a mathematical expression
     */
    evaluate(expr, scope = {}) {
        try {
            return math.evaluate(expr, scope);
        } catch (e) {
            console.error('Evaluation error:', e);
            return null;
        }
    },

    /**
     * Generate a range of numbers
     */
    range(start, end, step = 1) {
        const result = [];
        for (let i = start; i <= end; i += step) {
            result.push(i);
        }
        return result;
    },

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Clamp a value between min and max
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    /**
     * Map a value from one range to another
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    },

    /**
     * Degrees to radians
     */
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    },

    /**
     * Radians to degrees
     */
    toDegrees(radians) {
        return radians * 180 / Math.PI;
    },

    /**
     * Generate a unique ID
     */
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Create an element with attributes
     */
    createElement(tag, attrs = {}, children = []) {
        const el = document.createElement(tag);
        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'innerHTML') {
                el.innerHTML = value;
            } else if (key === 'textContent') {
                el.textContent = value;
            } else if (key.startsWith('on')) {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else {
                el.appendChild(child);
            }
        });
        return el;
    },

    /**
     * Show a notification toast
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = this.createElement('div', {
            className: `toast toast-${type}`,
            textContent: message
        });

        // Add toast styles if not present
        if (!document.querySelector('.toast-container')) {
            const container = this.createElement('div', { className: 'toast-container' });
            container.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;';
            document.body.appendChild(container);
        }

        toast.style.cssText = `
            padding: 12px 20px;
            margin-top: 8px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-size: 14px;
            animation: slideIn 0.3s ease;
        `;

        document.querySelector('.toast-container').appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('Copied to clipboard!', 'success');
            return true;
        } catch (e) {
            console.error('Copy failed:', e);
            return false;
        }
    },

    /**
     * Download data as file
     */
    downloadFile(filename, content, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Color utilities
     */
    colors: {
        cyan: '#00d4ff',
        magenta: '#ff00aa',
        yellow: '#ffdd00',
        green: '#00ff88',
        purple: '#8b5cf6',
        orange: '#ff6b35',

        // Generate color with alpha
        withAlpha(color, alpha) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },

        // Generate gradient
        gradient(color1, color2, angle = 135) {
            return `linear-gradient(${angle}deg, ${color1}, ${color2})`;
        }
    },

    /**
     * Chart.js default options
     */
    getChartDefaults() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { family: 'Inter' }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                }
            }
        };
    },

    /**
     * Plotly default layout
     */
    getPlotlyLayout(title = '') {
        return {
            title: {
                text: title,
                font: { color: '#ffffff', family: 'Inter' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(26, 26, 37, 0.8)',
            font: { color: '#ffffff', family: 'Inter' },
            xaxis: {
                gridcolor: 'rgba(255, 255, 255, 0.05)',
                zerolinecolor: 'rgba(255, 255, 255, 0.1)'
            },
            yaxis: {
                gridcolor: 'rgba(255, 255, 255, 0.05)',
                zerolinecolor: 'rgba(255, 255, 255, 0.1)'
            },
            margin: { l: 50, r: 30, t: 50, b: 50 }
        };
    }
};

// Freeze the utils object
Object.freeze(QAGIUtils);
