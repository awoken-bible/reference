"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const BibleRef = require('../src/index.ts').default;

const bref = new BibleRef();

describe("index", () => {
  it('Parser / Printer Round Trips', () => {

    let str  = 'Genesis 1:10';
    let data = { book: 'GEN', chapter: 1, verse: 10 };
    expect(bref.parseOrThrow(str )).is.deep.equal([data]);
    expect(bref.format      (data)).is.deep.equal(str);
    expect(bref.format      ([data])).is.deep.equal(str);

  });
});
