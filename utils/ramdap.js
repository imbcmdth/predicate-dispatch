const {__, assoc, curry, curryN, compose, merge, map, set, view} = require('ramda');
const B = require('bluebird');

// Add a couple of promise-handling extensions to Ramda functions

// Like Ramda.prop except it accepts promises OR values for every argument and _always_ returns a promise
const propP = curry((prop, obj) => B.all([prop, obj]).then(([prop, obj]) => B.resolve(obj[prop])));

// Like Ramda.path except it accepts promises OR values for every argument and _always_ returns a promise
const pathP = curry((pathArr, obj) => B.all([pathArr, obj]).then(([pathArr, obj]) => B.reduce(pathArr, (subObj, pathSpec) => propP(pathSpec, subObj), obj)));

// Like Ramda.props except it accepts promises OR values for every argument and _always_ returns a promise
const propsP = curry((props, obj) => B.all([props, obj]).then(([props, obj]) => B.all(props.map(propP(__, obj)))));

// Like Ramda.assoc except it accepts promises OR values for every argument and _always_ returns a promise
const assocP = curry((prop, val, obj) => B.all([prop, val, obj]).then(([prop, val, obj]) => assoc(prop, val, obj)));

// Like Ramda.assoc except it sets the `prop` property to the return value of `fn`
const assocFn = curry((prop, fn, obj) => assoc(prop, fn(obj), obj));

// Like Ramda.assoc except it sets the `prop` property to the return value of  `fn`
// and accepts promises OR values for every argument and _always_ returns a promise
const assocFnP = curry((prop, fn, obj) => assocP(prop, fn(obj), obj));

// Make sure the result of calling these functions is a promise
// This is necessary because Ramda.composeP is a little dumb if
// a function in the pipeline does not return a promise
const asPromise = (fn) => compose(B.resolve, fn);

const get = curry((prop, map) => map.get(prop));

const getP = curry((prop, map) => B.all([prop, map]).then(([prop, map]) => B.resolve(map.get(prop))));

const lensP = curryN(2, function lens(getter, setter) {
  return function (toFunctorFn) {
    return function (target) {
      return map(function (focus) {
        return B.resolve(focus)
          .catch((error) => setter(error, target))
          .then((focus) => setter(focus, target));
      }, toFunctorFn(getter(target)));
    };
  };
});

const overP = curry((lens, fn, obj) => Promise.all([lens, fn, obj])
    .then(([lens, fn, obj]) => Promise.all([lens, fn, obj, view(lens, obj)]))
    .then(([lens, fn, obj, view]) => Promise.all([lens, obj, fn(view)]))
    .then(([lens, obj, retVal]) => set(lens, retVal, obj)));

const propSatisfiesP = curry((fn, prop, obj) => B.all([fn, propP(prop, obj)]).then(([fn, val]) => fn(val)));

module.exports = merge(require('ramda'), {
  propP,
  propsP,
  pathP,
  get,
  getP,
  assocP,
  lensP,
  overP,
  propSatisfiesP,
  assocFn,
  assocFnP,
  asPromise
});
