/**
 * Predicate Dispatch... with Promises!
 * @module predicate-dispatch
 */
const B = require('bluebird');
const R = require('../utils/ramdap');
const {composeP, identity, lens, asPromise, view, set} = R;

const identityLens = lens(identity, identity);

module.exports = {
  ramdap: R,
  /**
   * Predicate Dispatch... with Promises! Every argument and all data are allowed to be promises.
   * For more information about predicate dispatch, see: {@link https://en.wikipedia.org/wiki/Predicate_dispatch}
   * @function dispatch
   * @async
   * @param {(function|Promise<function>)} [predicateFn] - Takes the `value` and returns a value representing a predicate
   * @param {(function|Promise<function>)} [getDispatchFn] - Takes the results of predicateFn and returns a function to execute
   * @param {(Lens|Promise<Lens>)} [valueLens=identityLens] - The lens to apply to the value (getter) and return (setter) of the dispatch
   * @returns {dispatcher}
   */
  dispatch: (predicateFn, getDispatchFn, valueLens = identityLens) =>
    /**
     * @function dispatcher
     * @inner
     * @param {(T|Promise<T>)} [value] - The value to consider for dispatching
     * @returns {Promise<T, Error>}
     */
    (value) =>
      // Step 1: Wait for the arguments to resolve in case they are promises
      B.all([predicateFn, getDispatchFn, valueLens, value])
        // Step 2: Everything is resolved, compose the two getter-type functions together
        .then(([predicateFn, getDispatchFn, valueLens, value]) => [
          valueLens,
          composeP(asPromise(getDispatchFn), asPromise(predicateFn)),
          value])
        // Step 4: Retrieve the dispatch function
        .then(([valueLens, getDispatch, value]) => B.all([valueLens, getDispatch(value), value, view(valueLens, value)]))
        // Step 4: Execute the actual dispatch over the data-structure with the provided lens
        .then(([valueLens, dispatch, value, focus]) => B.resolve(dispatch(focus))
          .catch((errValue) => set(valueLens, errValue, value))
          // Step 5: Use the return value of the dispatch and the lens to create the real return value
          .then((returnValue) => set(valueLens, returnValue, value)))
};
