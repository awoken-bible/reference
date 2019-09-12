"use strict";

const rewire   = require('rewire');
const chai     = require('chai');
const expect   = chai.expect;

const p = rewire('../src/parser.ts');
const { parse } = require('../src/parser.ts').default;

describe("parser internals", () => {
  it("pBookId", () => {
    let pBookId = p.__get__("pBookId");
    expect(      pBookId.tryParse("GEN")).to.equal("GEN");
    expect(      pBookId.tryParse("Gen")).to.equal("GEN");
    expect(      pBookId.tryParse("gen")).to.equal("GEN");
    expect(      pBookId.tryParse("REV")).to.equal("REV");
    expect(() => pBookId.tryParse("123")).to.throw();
  });

  it("pBookPrefixNumber", () => {
    let pBookId = p.__get__("pBookPrefixNumber");
    expect(      pBookId.tryParse(  "1")).to.equal(1);
    expect(      pBookId.tryParse(  "2")).to.equal(2);
    expect(      pBookId.tryParse(  "3")).to.equal(3);
    expect(      pBookId.tryParse(  "I")).to.equal(1);
    expect(      pBookId.tryParse( "II")).to.equal(2);
    expect(      pBookId.tryParse("III")).to.equal(3);

    expect(() => pBookId.tryParse("" )).to.throw();
    expect(() => pBookId.tryParse("a")).to.throw();
    expect(() => pBookId.tryParse("4")).to.throw();
  });

  it("pBookName", () => {
    let pBookName = p.__get__("pBookName");
    expect(      pBookName.tryParse("Genesis"        )).to.equal("GEN");
    expect(      pBookName.tryParse("genesis"        )).to.equal("GEN");
    expect(      pBookName.tryParse("GENESIS"        )).to.equal("GEN");
    expect(      pBookName.tryParse("Exodus"         )).to.equal("EXO");
    expect(      pBookName.tryParse("Mark"           )).to.equal("MRK");
    expect(      pBookName.tryParse("Psalm"          )).to.equal("PSA");
    expect(      pBookName.tryParse("2 Kings"        )).to.equal("2KI");
    expect(      pBookName.tryParse("John"           )).to.equal("JHN");
    expect(      pBookName.tryParse("I John"         )).to.equal("1JN");
    expect(      pBookName.tryParse("1 John"         )).to.equal("1JN");
    expect(      pBookName.tryParse("II John"        )).to.equal("2JN");
    expect(      pBookName.tryParse("2 John"         )).to.equal("2JN");
    expect(      pBookName.tryParse("III John"       )).to.equal("3JN");
    expect(      pBookName.tryParse("3 John"         )).to.equal("3JN");
    expect(      pBookName.tryParse("2nd Samuel"     )).to.equal("2SA");
    expect(      pBookName.tryParse("song of solomon")).to.equal("SNG");

    expect(() => pBookName.tryParse(""       )).to.throw();
    expect(() => pBookName.tryParse("exod"   )).to.throw();
    expect(() => pBookName.tryParse("hello"  )).to.throw();
    expect(() => pBookName.tryParse("3 Kings")).to.throw();
  });
});


describe("parse", () => {

  it("Single Verse", () => {
    expect(parse('Malachi 10:8')).to.deep.equal({
      status: true,
      value: [
        { book: 'MAL', chapter: 10, verse:  8 },
      ]
    });
  });

  it("Full Chapters", () => {
    expect(parse('Mark 8')).to.deep.equal({
      status: true,
      value: [
        {
          is_range: true,
          start : { book: 'MRK', chapter:  8, verse:  1 },
          end   : { book: 'MRK', chapter:  8, verse: 38 },
        }
      ]
    });
  });

  it("Full Books", () => {
    expect(parse('Genesis')).to.deep.equal({
      status: true,
      value: [
        {
          is_range: true,
          start: { book: 'GEN', chapter:  1, verse:  1 },
          end  : { book: 'GEN', chapter: 50, verse: 26 },
        }
      ]
    });

    expect(parse('Ruth')).to.deep.equal({
      status: true,
      value: [{
        is_range: true,
        start: { book: 'RUT', chapter:  1, verse:  1 },
        end  : { book: 'RUT', chapter:  4, verse: 22 },
      }]
    });
  });



  /*
    it("Comma seperated", () => {
    expect(parse('GEN 3:12,15')).to.deep.equal({
      status: true,
      value: [
        { book: 'GEN', chapter: 3, verse: 12 },
        { book: 'GEN', chapter: 3, verse: 15 },
      ],
    });

    expect(parse('GEN 3:12,4:15')).to.deep.equal({
      status: true,
      value: [
        { book: 'GEN', chapter: 3, verse: 12 },
        { book: 'GEN', chapter: 4, verse: 15 },
      ],
    });
  });
  */
});
