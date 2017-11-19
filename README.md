# predicate-dispatch

A nice little function for creating [predicate dispatching](https://en.wikipedia.org/wiki/Predicate_dispatch) with the added bonus of supported promises for every parameter, return value, and object that they work with!

## Install
```bash
npm install predicate-dispatch
```

## Usage
```javascript
const B = require('bluebird');
const {dispatch, ramdap: R} = require('predicate-dispatch');
// `dispatch` is the main function
// `ramdap` is the Ramda library with some convenience functions included for working with promises

const exampleObject = [{
    type: 'good',
    value: 'hello'
  }, {
    type: 'bad',
    value: 'goodbye'
  }];

const worldly = dispatch(
  // Property whose value to use as the `dispatch value`
  R.prop('type'),
  // Map the `dispatch value` to a function
  R.prop(R.__, {
    good: (s) => s + ' world',
    bad: (s) => s + ' cruel world'
  }),
  // Lens to focus on the property `value` and pass that to the dispatchee
  R.lensProp('value'));

B.all(exampleObject.map(worldly)).then(console.log);

/* Logs:
  [{
    type: 'good',
    value: 'hello world'
  }, {
    type: 'bad',
    value: 'goodbye cruel world'
  }]
*/
```

So there is a lot going on here under the covers. The key thing above is that the `lens` insures that the return value of the dipatched function is isolated to the part of the original input that the `lens` focused onto. Another thing to keep in mind is that the function will always return a promise. The function returned from `dispatch` is pervasively asynchronous.

So this type of dispatch is nice but the power of `lenses` and predicate-dispatching comes when you chain dispatchers together. We can see this with a very similar setup to above but with a nested object:

```javascript
const B = require('bluebird');
const {dispatch, ramdap: R} = require('predicate-dispatch');
// `dispatch` is the main function
// `ramdap` is the Ramda library with some convenience functions included for working with promises

const exampleObject = {
  type: 'foo',
  child: {
    type: 'good',
    value: 'hello'
  }
};

const worldly = dispatch(
  // Property whose value to use as the `dispatch value`
  R.prop('type'),
  // Map the `dispatch value` to a function
  R.prop(R.__, {
    good: (s) => s + ' world',
    bad: (s) => s + ' cruel world'
  }),
  // Lens to focus on the property `value` and pass that to the dispatchee
  R.lensProp('value'));

const router = dispatch(
  R.prop('type'),
  // Map the `dispatch value` to a function
  R.prop(R.__, {
    foo: worldly
  }),
  // Lens to focus on the property `child` and pass the value of `child` to the dispatchee
  R.lensProp('child'));

router(exampleObject).then(console.log);

/* Logs:
  {
    type: 'foo',
    child: {
      type: 'good',
      value: 'hello world'
    }
  }
*/
```
