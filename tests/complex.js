const B = require('bluebird');
const {dispatch, ramdap: R} = require('../');
const expect = require('chai').expect;

// Return eiher the `foo_new` or `bar_new` property depending on the 'type_b'
const typeBHandlers = {
  foo: R.propP('foo_new'),
  bar: R.propP('bar_new')
};

const translateV1ToV2 = R.composeP(
  R.assocFnP('foo_oops', R.propP('foo')),
  R.assocFnP('bar_oops', R.propP('bar')));

const translateV2ToV3 = R.composeP(
  R.assocFnP('foo_new', R.propP('foo_oops')),
  R.assocFnP('bar_new', R.propP('bar_oops')));

const versionBRouter = dispatch(R.propP('version_b'), R.getP(R.__, new Map([
  [undefined, dispatch(R.propP('type_b'), R.propP(R.__, typeBHandlers), R.lens(R.composeP(translateV2ToV3, translateV1ToV2), R.identity))],
  // Route with property 'type_b' transforming the object format (v1 -> v2 -> v3)
  [1, dispatch(R.propP('type_b'), R.propP(R.__, typeBHandlers), R.lens(R.composeP(translateV2ToV3, translateV1ToV2), R.identity))],
  // Route with property 'type_b' passing the property 'body' after transforming that object format (v2 -> v3)
  [2, dispatch(R.propP('type_b'), R.propP(R.__, typeBHandlers), R.lens(R.composeP(translateV2ToV3, R.propP('body')), R.identity))],
  // Route with property 'type_b' passing the property 'body' down the rest of the pipeline
  [3, dispatch(R.propP('type_b'), R.propP(R.__, typeBHandlers), R.lens(R.propP('body'), R.identity))]
])));

// There is only one type of `type_a` object in this test
// The difference between the versions is in the name of the property that
// denotes the type of the object (type vs type_a)
const typeAHandlers = {
  quux: B.resolve(versionBRouter)
};

const versionARouter = dispatch(R.propP('version_a'), B.resolve(R.propP(R.__, B.resolve({
  // Route with property 'type' passing the entire object down the rest of the pipeline
  '1': dispatch(R.propP('type'), R.propP(R.__, typeAHandlers)),
  // Route with property 'type_a' passing the property 'body' down the rest of the pipeline
  '2': dispatch(R.propP('type_a'), R.propP(R.__, typeAHandlers), R.lens(R.propP('body'), R.identity))
}))));

let testCases = [
  // CASE 1 - Flat object since it's all version 1
  {
    version_a: 1,
    type: 'quux',
    // version_b is undefined but we have a route for that case too!
    //version_b: 1,
    type_b: 'foo',
    foo: 'case_1a_foo',
    bar: 'case_1a_bar'
  },
  // CASE 2 - New type_a but old type_b so it's only partially nested
  {
    version_a: 2,
    type_a: 'quux',
    body: {
      version_b: 1,
      type_b: 'foo',
      foo: 'case_2a_foo',
      bar: 'case_2a_bar'
    }
  },
  // CASE 3 - Old type but new type_b so it's only partially nested
  {
    version_a: 1,
    type: 'quux',
    version_b: 2,
    type_b: 'foo',
    body: {
      foo_oops: 'case_3a_foo',
      bar_oops: 'case_3a_bar'
    }
  },
  // CASE 4 - ALL NEW types so it's completely nested
  {
    version_a: 2,
    type_a: 'quux',
    body: {
      version_b: 2,
      type_b: 'foo',
      body: {
        foo_oops: 'case_4a_foo',
        bar_oops: 'case_4a_bar'
      }
    }
  },
  // CASE 5 - We used the wrong name for the properties in v2 of the type_b lets correct in v3
  {
    version_a: 2,
    type_a: 'quux',
    body: {
      version_b: 3,
      type_b: 'foo',
      body: {
        foo_new: 'case_5a_foo',
        bar_new: 'case_5a_bar'
      }
    }
  },
  // CASE 1p - Flat object since it's all version 1
  //         - The entire object is a promise
  B.resolve({
    version_a: 1,
    type: 'quux',
    version_b: 1,
    type_b: 'foo',
    foo: 'case_1p_foo',
    bar: 'case_1p_bar'
  }),
  // CASE 2p - New type but old type_b so it's only partially nested
  //         - The entire object and the nested body are promises
  B.resolve({
    version_a: 2,
    type_a: 'quux',
    body: B.resolve({
      version_b: 1,
      type_b: 'foo',
      foo: 'case_2p_foo',
      bar: 'case_2p_bar'
    })
  }),
  // CASE 3p - Old type but new type_b so it's only partially nested
  //         - The entire object and the nested body are promises
  B.resolve({
    version_a: 1,
    type: 'quux',
    version_b: 2,
    type_b: 'foo',
    body: B.resolve({
      foo_oops: 'case_3p_foo',
      bar_oops: 'case_3p_bar'
    })
  }),
  // CASE 4p - ALL NEW types so it's completely nested
  //         - The entire object and both nested body(s) are promises
  B.resolve({
    version_a: 2,
    type_a: 'quux',
    body: B.resolve({
      version_b: 2,
      type_b: 'foo',
      body: B.resolve({
        foo_oops: 'case_4p_foo',
        bar_oops: 'case_4p_bar'
      })
    })
  }),
  // CASE 5p - We used the wrong name for the properties in v2 of the type_b!
  //         - The entire object and both nested body(s) are promises
  B.resolve({
    version_a: 2,
    type_a: 'quux',
    body: B.resolve({
      version_b: 3,
      type_b: 'foo',
      body: B.resolve({
        foo_new: 'case_5p_foo',
        bar_new: 'case_5p_bar'
      })
    })
  }),
  // CASE 6p - EVERYTHING IS A PROMISE!!!1! WTFLOL!!!
  B.resolve({
    version_a: B.resolve(2),
    type_a: B.resolve('quux'),
    body: B.resolve({
      version_b: B.resolve(3),
      type_b: B.resolve('foo'),
      body: B.resolve({
        foo_new: B.resolve('case_6p_foo'),
        bar_new: B.resolve('case_6p_bar')
      })
    })
  })
];

const expected = [
  'case_1a_foo',
  'case_2a_foo',
  'case_3a_foo',
  'case_4a_foo',
  'case_5a_foo',
  'case_1p_foo',
  'case_2p_foo',
  'case_3p_foo',
  'case_4p_foo',
  'case_5p_foo',
  'case_6p_foo'
];

describe('complex test', function () {
  it('should work', function () {
    B.all(testCases.map(versionARouter)).then((result) => {
      expect(result).to.eql(expected);
    });
  });
});
