# crosstalk.js

crosstalk.js is a tiny (2kb minified) library that makes cross-domain and even cross-protocol communication extremely clean and easy.

Why use it? Maybe you distribute an HTML file that will be opened locally (from the file:// protocol), but it needs to talk to an API server. crosstalk will let you load up a frame from any domain and communicate through it with ease. The need doesn't come up often, but when it does, this will make your life very easy.

### Using crosstalk

Using crosstalk.js is very easy. You just need to include the library in each page that you're going to communicate between.

In your main window, do something like this:

```
var channel = new Crosstalk({
    // Optional; defaults to '*'
    origin: 'http://mysite.com',
    // Required
    source: 'http://mysite.com/frame.html',
    // Optional; defaults to 50
    connectionTimeout: 150,
    // Optional: defaults to null
    onConnectionFail: function() {
        console.log('Uh oh. We couldn\'t connect...');
    }
});
```

In the window you're communicating with, all you need is this:

```
var channel = new Crosstalk();
```

### Methods

crosstalk doesn't have many methods. You'll pretty much only interact with `on` and `emit`.

##### #on
```
channel.on('someEvent', function() {
    console.log('someEvent fired');
});

// or, use an object...

channel.on({
    'someOtherEvent': function() {},
    'yetAnotherEvent': function() {},
    'anyEventNameYouWant': function() {}
});

// and, you can accept some data

channel.on('awesomeEvent', function(data) {
    console.log(data); // do something with your data
});
```

##### #emit
```
channel.emit('someEvent');

// and, you can pass some data

channel.emit('awesomeEvent', {
    firstName: 'Sue',
    lastName: 'Perman'
});
```

## Browser Support

Until further testing, unknown...

## Coming soon

- Tests