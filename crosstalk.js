
/**
 * Crosstalk - constructor. Automatically creates
 * a transport window.
 *
 * @param  {Object} options Configuration options
 * @return {Crosstalk}         Crosstalk instance
 */
function Crosstalk(options) {
    var _this = this;

    // Default options
    this.options = {
        // The target origin domain
        origin: '*',
        // The source URL for the remote window
        source: null,
        // The amount of time to wait before
        // failing the bi-directional connection
        connectionTimeout: 50,
        // An optional callback to execute if
        // the bi-directional connection fails
        onConnectionFail: null
    };

    // Override defaults with user options
    for (var option in options) {
        this.options[option] = options[option];
    }

    // Create an object to hold events
    this.events = {};

    // If a source is provided,
    // create a new transport window
    if (this.options.source) {
        this._createTransport();
    }

    // Listen for message events
    window.addEventListener('message', function(e) {
        _this._onMessage.call(_this, e);
    }, false);
}


/**
 * Crosstalk.prototype._createTransport - creates a hidden iframe using the
 * source property as the `src` attribute.
 *
 * @return {Crosstalk}  Crosstalk instance
 */
Crosstalk.prototype._createTransport = function() {
    var _this = this;

    // Create the hidden iframe
    this.el = document.createElement('iframe');
    this.el.src = this.options.source;
    this.el.style.display = 'none';

    // Listen for the load event
    this.el.onload = function() {
        // Save the contentWindow as a private property.
        // We'll reuse it when we send messages.
        _this._contentWindow = _this.el.contentWindow;

        // Start the process to confirm bi-directional
        // communication between the two windows.
        _this.emit('ct_ping');
    };

    // Append the iframe to the body
    document.body.appendChild(this.el);

    setTimeout(function() {
        // If we haven't established a connection
        // with the other window within the specified
        // amount of time (connectionTimeout), we should
        // throw an error, or fire the onConnectionFail
        // callback if one was given.
        if (!_this._connected) {
            // Set a property that explicitly says the
            // connection failed
            _this._connectionFailed = true;

            // Throw an error or execute onConnectionFail
            if (!_this.onConnectionFail) {
                throw new Error('Unable to connect to remote transport. Try increasing connectionTimeout.');
            } else {
                _this.onConnectionFail.call(_this);
            }
        }
    }, this.options.connectionTimeout);

    return this;
};


/**
 * Crosstalk.prototype._onMessage - postMessage handler
 *
 * @param  {MessageEvent} e The postMessage event received from
 * the remote window
 */
Crosstalk.prototype._onMessage = function(e) {
    if (!e || !e.source) {return false;}

    // Save the contentWindow as a private property.
    // We'll reuse it when we send messages.
    // If this is not the window that initiated,
    // this would be the only way to communicate
    // back to the initiating window.
    this._contentWindow = e.source;

    // Parse the stringified object
    var data = JSON.parse(e.data);

    // If we haven't confirmed bi-directional
    // communication, we need to listen for
    // some special events
    if (!this._connected) {
        if (data.event === 'ct_ping') {
            this._connected = true;
            return this.emit('ct_pong');
        }

        if (data.event === 'ct_pong') {
            this._connected = true;
        }
    }

    // If there is a registered callback
    // for the event, execute it with the
    // data that was passed.
    if (this.events[data.event]) {
        var callback = this.events[data.event];

        // Remove the event name property, since
        // it's only used for routing purposes.
        delete data.event;

        callback(data);
    }
};


/**
 * Crosstalk.prototype.on - listen for events and execute a callback
 *
 * @param  {String|Object} evt      A string that represents and event
 * name, or, and object that consists of keys as events names, and values
 * as callbacks.
 * @param  {Function} callback If a string is passed for evt, this is
 * the callback function associated with the event.
 */
Crosstalk.prototype.on = function(evt, callback) {
    if (typeof evt === 'string') {
        return this.events[evt] = callback;
    }

    if (typeof evt === 'object') {
        for (var e in evt) {
            if (evt.hasOwnProperty(e)) {
                this.events[e] = evt[e];
            }
        }
    }
};


/**
 * Crosstalk.prototype.emit - trigger events with optional data
 *
 * @param  {String} evt  The event name to trigger
 * @param  {Object} data Optionally passed data
 */
Crosstalk.prototype.emit = function(evt, data) {
    var _this = this;

    // If there is no contentWindow yet, but
    // we haven't explicitly failed the connection,
    // retry the same event emission after the
    // timeout interval.
    if (!this._contentWindow && !_this._connectionFailed) {
        return setTimeout(function() {
            _this.emit.call(_this, evt, data);
        }, this.options.connectionTimeout);
    }

    data = data || {};

    // We need to decorate the data with the event name,
    // since the postMessage protocol only allows us to
    // send strings, and we need to route the event
    // properly.
    data.event = evt;

    data = JSON.stringify(data);

    this._contentWindow.postMessage(data, this.options.origin);
};