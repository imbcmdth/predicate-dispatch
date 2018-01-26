const expect = require('chai').expect;
const {dispatch, ramdap: R} = require('../');
const errors = require('../lib/errors')['en-us'];

const obj = {};
const noop = () => {};
const retFn = () => noop;
const thrower = () => { throw new Error('oops!'); };
const retFnThrower = () => thrower;
const testThrower = () => {
  throw new Error('A rejection was expected but the test case resulted in a successfully resolved promise');
};

describe('parameter exception handling', function () {
  it('getDispatchFn is not a function', function () {
    const testCase = dispatch(noop, 'not a function');

    return testCase(obj)
      .then(testThrower)
      .catch((err) => {
        expect(err.message).to.equal(errors.INVALID_FN_PARAMS(['getDispatchFn']));
      });
  });

  it('predicateFn is not a function', function () {
    const testCase = dispatch('not a function', noop);

    return testCase(obj)
      .then(testThrower)
      .catch((err) => {
        expect(err.message).to.equal(errors.INVALID_FN_PARAMS(['predicateFn']));
      });
  });

  it('valueLens is not a function', function () {
    const testCase = dispatch(noop, noop, 'not a function');

    return testCase(obj)
      .then(testThrower)
      .catch((err) => {
        expect(err.message).to.equal(errors.INVALID_FN_PARAMS(['valueLens']));
      });
  });

  it('predicateFn is not a function', function () {
    const testCase = dispatch(noop, noop);

    return testCase()
      .then(testThrower)
      .catch((err) => {
        expect(err.message).to.equal(errors.VALUE_NIL());
      });
  });
});

describe('result of function exception handling', function () {
  const obj = {};
  const noop = () => {};

  it('getDispatchFn does not return a function', function () {
    const testCase = dispatch(noop, noop);

    return testCase(obj).catch((err) => {
      expect(err.message).to.equal(errors.DISPATCH_FN_RETURN_VALUE());
    });
  });
});

describe('function thrown exception handling', function () {
  it('getDispatchFn throws', function () {
    const testCase = dispatch(noop, thrower);

    return testCase(obj)
      .then(testThrower)
      .catch((err) => {
        expect(err.dispatchMessage).to.equal(errors.DISPATCH_FN(undefined));
      });
  });

  it('predicateFn throws', function () {
    const testCase = dispatch(thrower, noop);

    return testCase(obj)
      .then(testThrower)
      .catch((err) => {
        expect(err.dispatchMessage).to.equal(errors.PREDICATE_FN(obj));
      });
  });

  it('dispatcher throws', function () {
    const testCase = dispatch(noop, retFnThrower);

    return testCase(obj)
      .then(testThrower)
      .catch((err) => {
        expect(err.dispatchMessage).to.equal(errors.DISPATCHER_FN());
      });
  });

  it('lens getter throws', function () {
    const lensThrower = R.lens(thrower, R.identity);
    const testCase = dispatch(noop, retFn, lensThrower);

    return testCase(obj)
      .then(testThrower)
      .catch((err) => {
        expect(err.dispatchMessage).to.equal(errors.GET_LENS());
      });
  });

  it('lens setter throws', function () {
    const lensThrower = R.lens( R.identity, thrower);
    const testCase = dispatch(noop, retFn, lensThrower);

    return testCase(obj)
      .then(testThrower)
      .catch((err) => {
        expect(err.dispatchMessage).to.equal(errors.SET_LENS());
      });
  });

});
