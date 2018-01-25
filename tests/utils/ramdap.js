const B = require('bluebird');
const expect = require('chai').expect;
const R = require('../../utils/ramdap');

describe('ramdap', function() {
  describe('propsP', function() {
    it('acts as multiple prop arrays of non-Promise keys in, array of Promise values out', function() {
      const x = 1;
      const y = 2;
      return R.propsP(['x', 'y'], { x, y })
        .then(result => expect(result).to.deep.equal([1, 2]));
    });

    it('acts as multiple prop arrays of Promise keys in, array of Promise values out', function() {
      const x = B.resolve(1);
      const y = B.delay(1000).then(() => 2);
      return R.propsP(['x', 'y'], { x, y })
        .then(result => expect(result).to.deep.equal([1, 2]));
    });
  });
});
