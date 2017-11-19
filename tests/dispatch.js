const B = require('bluebird');
const expect = require('chai').expect;
const {dispatch, ramdap: R} = require('../');

describe('dispatch function', function () {
  const nestedObj = {
    sub: {
      sub: 'inner_value'
    }
  };

  it('can be a promise', function () {
    const testCase = dispatch(R.identity, B.resolve(() => (v) => {
      expect(v).to.eql(nestedObj);
      return 'ok';
    }));

    return testCase(nestedObj).then((retVal) => {
      expect(retVal).to.equal('ok');
    });
  });


  it('can return a promise', function () {
    const testCase = dispatch(R.identity, () => (v) => {
      expect(v).to.eql(nestedObj);
      return B.resolve('ok');
    });

    return testCase(nestedObj).then((retVal) => {
      expect(retVal).to.equal('ok');
    });
  });
});
