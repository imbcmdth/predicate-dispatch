/**
 * Predicate Dispatch... with Promises!
 * @module predicate-dispatch
 */
const B = require('bluebird');
const R = require('../utils/ramdap');
const {identity, lens, view, set, is, isNil, curry, zip} = R;
const errors = require('./errors')['en-us'];

const identityLens = lens(identity, identity);

const getUnique = () => (Math.random() * Math.pow(2, 52)).toString(36) + (Math.random() * Math.pow(2, 52)).toString(36);
const handleError = curry((uuid, defineTrace, dispatchMessage, error) => {
  // The first time this error is thrown:
  // We create a number of tracking properties and set the "dispatchMessage"
  // which contains detailed information about the error
  if (!error.uuid_pd) {
    error.uuid_pd = [uuid];
    error.defineTraces = [defineTrace];

    if (dispatchMessage) {
      error.dispatchMessage = dispatchMessage;
    } else {
      error.dispatchMessage = error.message;
    }
  }

  // Subsequent times the errror is caught, we ignore the error and rethrow
  // but only if the uuid for the predicate-dispatcher has been seen before
  // Otherwise, we add the defineTrace for the new predicate-dispatch so that
  // we can trace execution between nested predicate-dispatch functions
  if (error.uuid_pd.indexOf(uuid) === -1) {
    error.uuid_pd.push(uuid);
    error.defineTraces.push(defineTrace);
  }

  throw error;
});

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
  dispatch: (predicateFn, getDispatchFn, valueLens = identityLens) => {
    // Lets get a define-time stack trace (it's hacky but helpful!)
    let defineTrace = new Error('predicate-dispatch originally defined at:');
    // This will only work in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(defineTrace);
    }
    const handleErrorLocal = handleError(getUnique(), defineTrace);
    /**
     * @function dispatcher
     * @inner
     * @param {(T|Promise<T>)} [value] - The value to consider for dispatching
     * @returns {Promise<T, Error>}
     */
    return (value) =>
      // Step 1: Wait for the arguments to resolve in case they are promises
      B.all([predicateFn, getDispatchFn, valueLens, value])
        // Step 2: Everything is resolved, compose the evaluate the predicateFn
        .then(([predicateFn, getDispatchFn, valueLens, value]) => {
          const areFunctions = [predicateFn, getDispatchFn, valueLens].map(is(Function));
          const failedParams = zip(areFunctions, ['predicateFn', 'getDispatchFn', 'valueLens'])
            // Filter any that are of type function
            .filter(e => !e[0])
            // Extract only the function name
            .map(e => e[1]);

          if (failedParams.length) {
            const error = new TypeError(errors.INVALID_FN_PARAMS(failedParams));
            return handleErrorLocal(null, error);
          }
          if (isNil(value)) {
            const error = new TypeError(errors.VALUE_NIL());
            return handleErrorLocal(null, error);
          }

          return B.resolve(value)
            .then(predicateFn)
            .catch(handleErrorLocal(errors.PREDICATE_FN(value)))
            .then((predicateValue) => [valueLens, getDispatchFn, predicateValue, value]);
        })
        // Step 3: Retrieve the dispatch function
        .then(([valueLens, getDispatchFn, predicateValue, value]) => {
          return B.resolve(predicateValue)
            .then(getDispatchFn)
            .catch(handleErrorLocal(errors.DISPATCH_FN(predicateValue)))
            .then((dispatcher) => {
              if (!is(Function, dispatcher)) {
                const error = new TypeError(errors.DISPATCH_FN_RETURN_VALUE(predicateValue));
                return handleErrorLocal(null, error);
              }

              return B.resolve(value)
                .then(view(valueLens))
                .catch(handleErrorLocal(errors.GET_LENS()))
                .then((focus) => [valueLens, dispatcher, value, focus]);
            });
        })
        // Step 4: Execute the actual dispatch over the data-structure with the provided lens
        .then(([valueLens, dispatcher, value, focus]) => B.all([valueLens, dispatcher(focus), value]))
        .catch(handleErrorLocal(errors.DISPATCHER_FN()))
        // Step 5: Use the return value of the dispatch and the lens to create the real return value
        .then(([valueLens, returnValue, value]) => set(valueLens, returnValue, value))
        .catch(handleErrorLocal(errors.SET_LENS()));
  }
};
