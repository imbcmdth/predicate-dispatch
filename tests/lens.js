const B = require('bluebird');
const expect = require('chai').expect;
const {dispatch, ramdap: R} = require('../');

describe('lenses', function () {
  describe('basic', function () {
    const noPred = R.partial(dispatch, [R.identity]);
    const nestedObj = {
      sub: {
        sub: {
          sub: 'inner_value'
        }
      }
    };
    const expectedObject = {
      sub: {
        sub: {
          sub: 'ok'
        }
      }
    };

    // The default lens will not descend the passed in object and
    // will set the return value of the dispatch chain to the return
    // value of the last dispatch handler
    it('using the default lens', function () {
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.eql(nestedObj);
        return 'ok';
      })));

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.equal('ok');
      });
    });

    // Using a getter the dispatcher will desend the object but
    // will still set the return value of the dispatch chain to the
    // return value of the last dispatch handler
    it('using a getter lens only', function () {
      const lens = R.lensP(R.prop('sub'), R.identity);
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.equal('inner_value');
        return 'ok';
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.equal('ok');
      });
    });

    // The default lens will not descend the passed in object but
    // will still set the return value of the dispatch chain to a new
    // object with the final level equal to the return type of the last
    // dispatch handler
    it('using a setter lens only', function () {
      const lens = R.lensP(R.identity, R.assoc('sub'));
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.eql(nestedObj);
        return 'ok';
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.eql(expectedObject);
      });
    });

    // Using both getter/setter the dispatcher will desend the object
    // and will set the return value of the dispatch chain to a new
    // object with the final level equal to the return type of the
    // last dispatch handler
    it('using both a getter/setter lens', function () {
      const lens = R.lensP(R.prop('sub'), R.assoc('sub'));
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.equal('inner_value');
        return 'ok';
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.eql(expectedObject);
      });
    });
  });

  describe('promises', function () {
    const noPred = R.partial(dispatch, [R.identity]);
    const nestedObj = {
      sub: {
        sub: {
          sub: 'inner_value'
        }
      }
    };
    const expectedObject = {
      sub: {
        sub: {
          sub: 'ok'
        }
      }
    };

    it('lens itself is a promise', function () {
      const lens = B.resolve(R.lensP(R.prop('sub'), R.assoc('sub')));
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.equal('inner_value');
        return 'ok';
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.eql(expectedObject);
      });
    });

    it('last dispatch returns a promise', function () {
      const lens = R.lensP(R.prop('sub'), R.assoc('sub'));
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.equal('inner_value');
        return B.resolve('ok');
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.eql(expectedObject);
      });
    });

    it('lens works with promise values', function () {
      const nestedObj = B.resolve({
        sub: B.resolve({
          sub: B.resolve({
            sub: B.resolve('inner_value')
          })
        })
      });
      const lens = R.lensP(R.prop('sub'), R.assoc('sub'));
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.equal('inner_value');
        return B.resolve('ok');
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.eql(expectedObject);
      });
    });
  });

  describe('exceptions', function () {
    const noPred = R.partial(dispatch, [R.identity]);
    const nestedObj = {
      sub: {
        sub: {
          sub: 'inner_value'
        }
      }
    };

    it('using the default lens', function () {
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.eql(nestedObj);
        throw new Error('fail');
      })));

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.be.a('error');
      });
    });

    it('using a getter lens only', function () {
      const lens = R.lensP(R.prop('sub'), R.identity);
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.equal('inner_value');
        throw new Error('fail');
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal).to.be.a('error');
      });
    });

    it('using a setter lens only', function () {
      const lens = R.lensP(R.identity, R.assoc('sub'));
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.eql(nestedObj);
        throw new Error('fail');
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal.sub.sub.sub).to.be.a('error');
      });
    });

    it('using both a getter/setter lens', function () {
      const lens = R.lensP(R.prop('sub'), R.assoc('sub'));
      const testCase = noPred(() => noPred(() => noPred(() => (v) => {
        expect(v).to.equal('inner_value');
        throw new Error('fail');
      }, lens), lens), lens);

      return testCase(nestedObj).then((retVal) => {
        expect(retVal.sub.sub.sub).to.be.a('error');
      });
    });
  });
});
