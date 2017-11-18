const expect = require('chai').expect;
const {dispatch, ramdap: R} = require('../');

describe('predicate function', function () {
  const nestedObj = {
    sub: {
      sub: 'inner_value'
    }
  };

  it('can be a promise', function () {
    const testCase = dispatch(Promise.resolve(R.prop('sub')), (p) => (v) => {
      expect(p).to.eql(nestedObj.sub);
      expect(v).to.eql(nestedObj);
      return 'ok';
    });

    return testCase(nestedObj).then((retVal) => {
      expect(retVal).to.equal('ok');
    });
  });

  it('can return a promise', function () {
    const testCase = dispatch((v) => {
        expect(v).to.eql(nestedObj);
        return Promise.resolve('foo');
      }, (p) => (v) => {
        expect(p).to.equal('foo');
        expect(v).to.eql(nestedObj);
        return 'ok';
      });

    return testCase(nestedObj).then((retVal) => {
      expect(retVal).to.equal('ok');
    });
  });

});
