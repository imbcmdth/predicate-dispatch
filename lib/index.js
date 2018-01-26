/**
 * Predicate Dispatch... with Promises!
 * @module predicate-dispatch
 */
const B = require('bluebird');
const R = require('../utils/ramdap');
const {identity, lens, view, set, is, isNil, curry, zip} = R;
const errors = require('./errors')['en-us'];

const identityLens = lens(identity, identity);


const handleError = curry((defineTrace, dispatchMessage, error) => {
  if (!error.defineTrace) {
    error.defineTrace = defineTrace;

    if (dispatchMessage) {
      error.dispatchMessage = dispatchMessage;
    }
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
    if (Error.captureStackTrace) {
      Error.captureStackTrace(defineTrace);
    } else {
      try {
        // An error needs to be thrown to get the stack trace on some VMs
        throw defineTrace;
      } catch(e) {
        defineTrace = e;
      }
    }

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
            .filter(e => !e[0])
            .map(e => e[1]);

          if (failedParams.length) {
            const error = new TypeError(errors.INVALID_FN_PARAMS(failedParams));
            return handleError(defineTrace, null, error);
          }
          if (isNil(value)) {
            const error = new TypeError(errors.VALUE_NIL());
            return handleError(defineTrace, null, error);
          }

          return B.resolve(value)
            .then(predicateFn)
            .then((predicateValue) => [valueLens, getDispatchFn, predicateValue, value],
              handleError(defineTrace, errors.PREDICATE_FN(value)));
        })
        // Step 3: Retrieve the dispatch function
        .then(([valueLens, getDispatchFn, predicateValue, value]) => {
          return B.resolve(predicateValue)
            .then(getDispatchFn)
            .then((dispatcher) => {
              if (!is(Function, dispatcher)) {
                const error = new TypeError(errors.DISPATCH_FN_RETURN_VALUE(predicateValue));
                return handleError(defineTrace, null, error);
              }

              return B.resolve(value)
                .then(view(valueLens))
                .then((focus) => [valueLens, dispatcher, value, focus],
                  handleError(defineTrace, errors.GET_LENS()));
            }, handleError(defineTrace, errors.DISPATCH_FN(predicateValue)));
        })
        // Step 4: Execute the actual dispatch over the data-structure with the provided lens
        .then(([valueLens, dispatcher, value, focus]) => B.all([valueLens, dispatcher(focus), value]))
        // Step 5: Use the return value of the dispatch and the lens to create the real return value
        .then(([valueLens, returnValue, value]) => set(valueLens, returnValue, value),
          handleError(defineTrace, errors.DISPATCHER_FN()))
        .catch(handleError(defineTrace, errors.SET_LENS()));
  }
};
