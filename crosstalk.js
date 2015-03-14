function Crosstalk(options) {
    this.options = options || {origin: '*', source: null};
    this.id = Crosstalk.generateId();
    this.routes = {};

    if (this.options.source) {
        this._createTransport();
    }

    window.addEventListener('message', this._onMessage, false);
}

Crosstalk.generateId = function() {
    var LENGTH = 32;
    var CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
    
    var result = '';

    for (var i = LENGTH; i > 0; --i) {
        result += CHARS[Math.round(Math.random() * (CHARS.length - 1))];
    }

    return 'ct_' + result;
};

Crosstalk.prototype._createTransport = function() {
    var _this = this;

    this_.el = document.createElement('iframe');
    this_.el.src = this.options.source;
    this_.el.style.display = 'none';

    this_.el.onload = function() {
        _this.emit('ping', {
            id: _this.id
        });
    };

    document.body.appendChild(this_.el);

    setTimeout(function() {
        // TODO: need bulletproof way to
        // determine whether or not we've
        // got bi-directional communication
    }, 50);
};

Crosstalk.prototype._onMessage = function(e) {
    if (!e || !e.source) {return false;}

    // TODO: is this required?
    this._contentWindow = e.source;

    var data = JSON.parse(e.data);

    if (this.routes[data.event]) {
        var callback = this.routes[data.event];

        delete data.event;

        return callback(data);
    } else {
        return false;
    }
};

Crosstalk.prototype.on = function(evt, callback) {
    if (typeof evt === 'string') {
        return this.routes[evt] = callback;
    }

    if (typeof evt === 'object') {
        for (var route in config) {
            if (config.hasOwnProperty(route)) {
                this.routes[route] = config[route];
            }
        }
    }
};

Crosstalk.prototype.emit = function(evt, data) {
    // TODO: is this required?
    this._contentWindow = this_.el.contentWindow;

    data = data || {};
    data.event = evt;

    data = JSON.stringify(data);

    this._contentWindow.postMessage(data, this.options.origin);

    // TODO: is this required?
    return data;
};