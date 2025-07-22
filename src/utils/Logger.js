const Logger = new (function () {
    this.debug = import.meta.env.DEV;

    this.prefix = function (type, color, ...args) {
        const style = `color: ${color}; font-weight: bold`;
        const label = `%c[${type}]`;
        console.log(label, style, ...args);
    };

    this.error = function (...args) {
        this.prefix('ERROR', 'red', ...args);
    };

    this.info = function (...args) {
        if (!this.debug) return;
        this.prefix('INFO', 'dodgerblue', ...args);
    };

    this.warning = function (...args) {
        if (!this.debug) return;
        this.prefix('WARN', 'orange', ...args);
    };
})();

export default Logger;
