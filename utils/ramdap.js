const {assoc, curry, curryN, compose, merge, over} = require('ramda');
const Promise = require('bluebird');

// Add a couple of promise-handling extensions to Ramda functions

// Like Ramda.prop except it accepts promises OR values for every argument and _always_ returns a promise
const propP = curry((prop, obj) => Promise.all([prop, obj]).then(([prop, obj]) => Promise.resolve(obj[prop])));

// Like Ramda.assoc except it accepts promises OR values for every argument and _always_ returns a promise
const assocP = curry((prop, val, obj) => Promise.all([prop, val, obj]).then(([prop, val, obj]) => assoc(prop, val, obj)));

// Like Ramda.assoc except it sets the `prop` property to the return value of a function
// and accepts promises OR values for every argument and _always_ returns a promise
const assocFnP = curry((prop, fn, obj) => assocP(prop, fn(obj), obj));

// Make sure the result of calling these functions is a promise
// This is necessary because Ramda.composeP is a little dumb if
// a function in the pipeline does not return a promise
const asPromise = (fn) => compose(Promise.resolve, fn);

module.exports = merge(require('ramda'), {
  propP,
  assocP,
  assocFnP,
  asPromise
});
