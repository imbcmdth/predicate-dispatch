module.exports = {
  'en-us': {
    INVALID_FN_PARAMS: (nonFunctions) => `The following parameters were not functions: ${nonFunctions.join(', ')}`,
    VALUE_NIL: () => 'The "value" parameter must not be null or undefined',
    PREDICATE_FN: (value) => `An unknown error occurred when calling "predicateFn" with "${value}"`,
    DISPATCH_FN: (predicateValue) => `An unknown error occurred when calling "dispatchFn" with "${predicateValue}"`,
    DISPATCH_FN_RETURN_VALUE: (predicateValue) => `The result of calling "getDispatchFn" with "${predicateValue}" is not a function`,
    GET_LENS: () => 'An unknown error occurred when using "valueLens" to focus on the object provided',
    SET_LENS: () => 'An unknown error occurred when attempting to modify "value" the lens provided',
    DISPATCHER_FN: () => 'An unknown error occurred while executing the function received from "dispatchFn"'
  }
};
