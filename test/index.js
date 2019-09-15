"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const BibleRef = require('../src/index.ts').default;

describe("index", () => {
  it('Can use static methods or new() interface', () => {
    const bref = new BibleRef();

    let str  = 'Genesis 1:10';
    let data = { book: 'GEN', chapter: 1, verse: 10 };
    expect(bref.parseOrThrow(str )).is.deep.equal([data]);
    expect(bref.parse       (str )).is.deep.equal({ status: true, value: [data] });
    expect(bref.format      (data)).is.deep.equal(str);
    expect(bref.format      ([data])).is.deep.equal(str);

    expect(BibleRef.parseOrThrow(str )).is.deep.equal([data]);
    expect(BibleRef.parse       (str )).is.deep.equal({ status: true, value: [data] });
    expect(BibleRef.format      (data)).is.deep.equal(str);
    expect(BibleRef.format      ([data])).is.deep.equal(str);
  });
});
