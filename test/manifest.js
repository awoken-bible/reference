"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const MANIFEST = require('../src/manifest.ts').default;

describe("manifest", () => {

  it('Basic Stats', () => {
    expect(MANIFEST.order.length).to.equal(66);
  });

  it('All Defined', () => {
    for(let book_ref of MANIFEST.order){
      expect(MANIFEST.book_names).have.property(book_ref);
    }
  });


});
