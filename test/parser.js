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
    expect(      pBookName.tryParse("song of solomon")).to.equal("SNG");

    expect(() => pBookName.tryParse(""     )).to.throw();
    expect(() => pBookName.tryParse("exod" )).to.throw();
    expect(() => pBookName.tryParse("hello")).to.throw();
  });
});
