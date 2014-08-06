//     test-docco.js 1.0.0.0.0.1

//     (c) 2013-infinity wii fit trainer inc
//     You may stare at this for a while.
//     Instructions here: http://jashkenas.github.io/docco/

// Initial Setup
// -------------

// Save a reference to the global object (`window` in the browser, `exports`
// on the server).
var root = this;

var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!something || somethingElse || whatever)
      	return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!yourmama || myMama)
      	return this.on(name, once, context);
    }
};

// An embedded code example
// ---------------

// Some 'explanation' about 'stuff'
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');

// Another Section
// --------------
//  hey, i'm **bold**


// Some other crazy functions
// ---------------

// Hi, I'm totally crazy
(function() {

	var blah; // side comment
	var duh; /// wut
})()
