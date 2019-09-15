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
    expect(      pBookName.tryParse("exod"           )).to.equal("EXO");
    expect(      pBookName.tryParse("Mark"           )).to.equal("MRK");
    expect(      pBookName.tryParse("Psalm"          )).to.equal("PSA");
    expect(      pBookName.tryParse("Psalms"         )).to.equal("PSA");
    expect(      pBookName.tryParse("Ps"             )).to.equal("PSA");
    expect(      pBookName.tryParse("2 Kgs"          )).to.equal("2KI");
    expect(      pBookName.tryParse("2 Kings"        )).to.equal("2KI");
    expect(      pBookName.tryParse("John"           )).to.equal("JHN");
    expect(      pBookName.tryParse("I John"         )).to.equal("1JN");
    expect(      pBookName.tryParse("1 John"         )).to.equal("1JN");
    expect(      pBookName.tryParse("1st John"       )).to.equal("1JN");
    expect(      pBookName.tryParse("II John"        )).to.equal("2JN");
    expect(      pBookName.tryParse("2 John"         )).to.equal("2JN");
    expect(      pBookName.tryParse("III John"       )).to.equal("3JN");
    expect(      pBookName.tryParse("2 THESS"        )).to.equal("2TH");
    expect(      pBookName.tryParse("II THESS"       )).to.equal("2TH");
    expect(      pBookName.tryParse("3 John"         )).to.equal("3JN");
    expect(      pBookName.tryParse("3rd John"       )).to.equal("3JN");
    expect(      pBookName.tryParse("2nd Samuel"     )).to.equal("2SA");
    expect(      pBookName.tryParse("2nd Sam"        )).to.equal("2SA");
    expect(      pBookName.tryParse("song of solomon")).to.equal("SNG");
    expect(      pBookName.tryParse("song of songs"  )).to.equal("SNG");
    expect(      pBookName.tryParse("sos"            )).to.equal("SNG");

    expect(() => pBookName.tryParse(""       )).to.throw();
    expect(() => pBookName.tryParse("hello"  )).to.throw();
    expect(() => pBookName.tryParse("3 Kings")).to.throw();
  });
});


describe("parse", () => {
  it("Single Verse", () => {
    expect(parse('Malachi 10:8')).to.deep.equal({
      status: true,
      value: [{ book: 'MAL', chapter: 10, verse:  8 }]
    });
  });

  it("Verse Range", () => {
    expect(parse('Job 8:3-6')).to.deep.equal({
      status: true,
      value: [{ is_range: true,
                start : { book: 'JOB', chapter: 8, verse:  3 },
                end   : { book: 'JOB', chapter: 8, verse:  6 },
              }
             ]
    });

    expect(parse('Esther 7 v 5 - 10')).to.deep.equal({
      status: true,
      value: [{ is_range: true,
                start : { book: 'EST', chapter: 7, verse:  5 },
                end   : { book: 'EST', chapter: 7, verse: 10 },
              }
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

  it("Chapter Range", () => {
    expect(parse('Mark 8-10')).to.deep.equal({
      status: true,
      value: [
        {
          is_range: true,
          start : { book: 'MRK', chapter:  8, verse:  1 },
          end   : { book: 'MRK', chapter: 10, verse: 52 },
        }
      ]
    });

    expect(parse('Mark 8:5-10:15')).to.deep.equal({
      status: true,
      value: [
        {
          is_range: true,
          start : { book: 'MRK', chapter:  8, verse:  5 },
          end   : { book: 'MRK', chapter: 10, verse: 15 },
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

  it("Comma seperated", () => {
    expect(parse('GEN 3:12,15')).to.deep.equal({
      status: true,
      value: [
        { book: 'GEN', chapter: 3, verse: 12 },
        { book: 'GEN', chapter: 3, verse: 15 },
      ],
    });

    expect(parse('GEN 3:12-15,18')).to.deep.equal({
      status: true,
      value: [
        { is_range: true,
          start: { book: 'GEN', chapter: 3, verse: 12 },
          end  : { book: 'GEN', chapter: 3, verse: 15 },
        },
        { book: 'GEN', chapter: 3, verse: 18 },
      ],
    });

    expect(parse('GEN 3:12,4:15')).to.deep.equal({
      status: true,
      value: [
        { book: 'GEN', chapter: 3, verse: 12 },
        { book: 'GEN', chapter: 4, verse: 15 },
      ],
    });

    expect(parse('GEN 2,6')).to.deep.equal({
      status: true,
      value: [
        { is_range: true,
          start: { book: 'GEN', chapter: 2, verse:  1 },
          end  : { book: 'GEN', chapter: 2, verse: 25 },
        },
        { is_range: true,
          start: { book: 'GEN', chapter: 6, verse:  1 },
          end  : { book: 'GEN', chapter: 6, verse: 22 },
        }
      ],
    });
  });


  it("Cross Book Range", () => {
    expect(parse('Exo 39:10 - Lev 2:6')).to.deep.equal({
      status: true,
      value: [
        { is_range: true,
          start: { book: 'EXO', chapter: 39, verse: 10 },
          end  : { book: 'LEV', chapter:  2, verse:  6 },
        },
      ],
    });

    expect(parse('Exo 39 - Lev 2')).to.deep.equal({
      status: true,
      value: [
        { is_range: true,
          start: { book: 'EXO', chapter: 39, verse:  1 },
          end  : { book: 'LEV', chapter:  2, verse: 16 },
        },
      ],
    });

    expect(parse('Exo 39:10 - Lev 2')).to.deep.equal({
      status: true,
      value: [
        { is_range: true,
          start: { book: 'EXO', chapter: 39, verse: 10 },
          end  : { book: 'LEV', chapter:  2, verse: 16 },
        },
      ],
    });
  });

  it("Seperated by ;", () => {
    expect(parse('Matthew 1:1; John 3:16')).to.deep.equal({
      status: true,
      value: [{ book: 'MAT', chapter: 1, verse:  1 },
              { book: 'JHN', chapter: 3, verse: 16 }]
    });
  });

  it("All features simultaniosuly", () => {
    expect(parse('Genesis 2, 4:3,8, 6:9-12,18-20,27 ; ECC 7')).to.deep.equal({
      status: true,
      value: [{ is_range: true,
                start: { book: 'GEN', chapter: 2, verse:  1 },
                end  : { book: 'GEN', chapter: 2, verse: 25 },
              },
              { book: 'GEN', chapter: 4, verse:  3 },
              { book: 'GEN', chapter: 4, verse:  8 },
              { is_range: true,
                start: { book: 'GEN', chapter: 6, verse:  9 },
                end  : { book: 'GEN', chapter: 6, verse: 12 },
              },
              { is_range: true,
                start: { book: 'GEN', chapter: 6, verse: 18 },
                end  : { book: 'GEN', chapter: 6, verse: 20 },
              },
              { book: 'GEN', chapter: 6, verse: 27 },
              { is_range: true,
                start: { book: 'ECC', chapter: 7, verse:  1 },
                end  : { book: 'ECC', chapter: 7, verse: 29 },
              },
             ]
    });
  });

  it("Invalid look alikes", () => {
    expect(parse("Gen 1-2-3" ).status).to.deep.equal(false);
    expect(parse("Gen 1:2:3" ).status).to.deep.equal(false);
    expect(parse("Gen 1:2,3,").status).to.deep.equal(false);
    expect(parse("Gen 1 a"   ).status).to.deep.equal(false);
    expect(parse("Gen 1 -"   ).status).to.deep.equal(false);
    expect(parse("Gen\n1"    ).status).to.deep.equal(false); // dont allow \n
    expect(parse("Gen 9 - 9" ).status).to.deep.equal(false); // invalid range
    expect(parse("Gen 9 - 5" ).status).to.deep.equal(false); // invalid range

    // We could choose to parse these:
    // 1 - 2:3 :: Chapter 1 verse 1 --- Chapter 2 verse 3
    // 1:2 - 3 :: Chapter 1 verse 2 --- end of chapter 3
    // However the second is already used to mean "chapter 1 verse 2 - 3"
    // Hence the first option should fail to parse as it makes the language
    // semantics confusingly ambiogious
    expect(parse("Gen 1 - 2:3" ).status).to.deep.equal(false);
  });
});
