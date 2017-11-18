/**
 * Predicate Dispatch... with Promises!
 * @module predicate-dispatch
 */
const Promise = require('bluebird');
const RP = require('../utils/ramdap');
const {compose, composeP, identity, lens, propP, asPromise, overP, view, set} = RP;

const identityLens = lens(identity, identity);

/**
 * Predicate Dispatch... with Promises! Every argument and all data are allowed to be promises.
 * For more information about predicate dispatch, see: {@link https://en.wikipedia.org/wiki/Predicate_dispatch}
 *
 * @param {function} predicateFn - Takes the `value` and returns a value representing a predicate
 * @param {function} getDispatchFn - Takes the results of predicateFn and returns a function to execute
 * @param {Lens} [valueLens=identity] - The lens to apply to the value (getter) and return (setter) of the dispatch
 * @returns {function}
 */
const dispatch = (predicateFn, getDispatchFn, valueLens = identityLens) =>
  /**
   * Dispatcher
   * @inner
   * @function dispatcher
   * @param value {!*} A value to dispatch
   */
  (value) =>
    // Step 1: Wait for the arguments to resolve in case they are promises
    Promise.all([predicateFn, getDispatchFn, valueLens, value])
    // Step 2: Everything is resolved, compose the two getter-type functions together
    .then(([predicateFn, getDispatchFn, valueLens, value]) => [
      valueLens,
      composeP(asPromise(getDispatchFn), asPromise(predicateFn)),
      value])
    // Step 4: Retrieve the dispatch function
    .then(([valueLens, getDispatch, value]) => Promise.all([valueLens, getDispatch(value), value, view(valueLens, value)]))
    // Step 4: Execute the actual dispatch over the data-structure with the provided lens
    .then(([valueLens, dispatch, value, focus]) => {
      return Promise.resolve(dispatch(focus))
        .catch((errValue) => set(valueLens, errValue, value))
        // Step 5: Use the return value of the dispatch and the lens to create the real return value
        .then((returnValue) => set(valueLens, returnValue, value))
    });

module.exports = {
  dispatch,
  ramdap: RP
};
