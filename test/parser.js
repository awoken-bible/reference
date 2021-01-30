"use strict";

const rewire    = require('rewire');
const chai      = require('chai');
const expect    = chai.expect;

const Parser    = require('../src/parser.ts').default;
const p         = rewire('../src/parser.ts');
const AwokenRef = require('../src/index.ts').default;

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
    expect(      pBookName.tryParse("1Kings"         )).to.equal("1KI");
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
    expect(      pBookName.tryParse("Song of Solomon")).to.equal("SNG");
    expect(      pBookName.tryParse("song of songs"  )).to.equal("SNG");
    expect(      pBookName.tryParse("Song of Songs"  )).to.equal("SNG");
    expect(      pBookName.tryParse("SongofSolomon"  )).to.equal("SNG");
    expect(      pBookName.tryParse("sos"            )).to.equal("SNG");

    expect(() => pBookName.tryParse(""       )).to.throw();
    expect(() => pBookName.tryParse("hello"  )).to.throw();
    expect(() => pBookName.tryParse("3 Kings")).to.throw();
  });
});


describe("parse", () => {
  function parse(str){ return AwokenRef.parse(str); }
	function parseErr(str){
		let out = AwokenRef.parse(str);
		delete out.expected;
		return out;
	}


  it("Single Verse", () => {
    expect(parse('Malachi 10:8')).to.deep.equal({
      status: true,
      value: [{ book: 'MAL', chapter: 10, verse:  8 }]
    });
  });

  it("Error Objects", () => {
    expect(parseErr('XYZ 1:1')).to.deep.equal({
      status : false,
      input  : 'XYZ 1:1',
      index  : { column: 4, line: 1, offset: 3 },
    });

    expect(parseErr('GEN a:1')).to.deep.equal({
      status : false,
      input  : 'GEN a:1',
      index  : { column: 5, line: 1, offset: 4 },
    });

    expect(parseErr('GEN 1a1')).to.deep.equal({
      status : false,
      input  : 'GEN 1a1',
      index  : { column: 6, line: 1, offset: 5 },
    });

    expect(parseErr('GEN 1:a')).to.deep.equal({
      status : false,
      input  : 'GEN 1:a',
      index  : { column: 7, line: 1, offset: 6 },
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

  it("Book Range", () => {
    expect(parse('Genesis - Leviticus')).to.deep.equal({
      status: true,
      value: [
        {
          is_range: true,
          start: { book: 'GEN', chapter:  1, verse:  1 },
          end  : { book: 'LEV', chapter: 27, verse: 34 },
        }
      ]
    });

    expect(parse('Genesis - Leviticus 2:3')).to.deep.equal({
      status: true,
      value: [
        {
          is_range: true,
          start: { book: 'GEN', chapter:  1, verse:  1 },
          end  : { book: 'LEV', chapter:  2, verse:  3 },
        }
      ]
    });

    expect(parse('Mat 5:10 - Mk.')).to.deep.equal({
      status: true,
      value: [
        {
          is_range: true,
          start: { book: 'MAT', chapter:  5, verse: 10 },
          end  : { book: 'MRK', chapter: 16, verse: 20 },
        }
      ]
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

    expect(parse('GEN3:8-EXO3:10')).to.deep.equal({
      status: true,
      value: [
        { is_range: true,
          start: { book: 'GEN', chapter:  3, verse:  8 },
          end  : { book: 'EXO', chapter:  3, verse: 10 },
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

  it("John edge cases", () => {
    // This nasty since the "1-2" could be a range of verses inside
    // 1 john, and then the second part could be a new bible referenmce
    // to "John 4:5" - however since there is no ; seperator we should
    // be parsing this in its entirety
    let res_a = {
      status: true,
      value: [
        { is_range: true,
          start: { book: '1JN', chapter: 10, verse:  1 },
          end  : { book: '2JN', chapter:  4, verse:  5 },
        },
      ],
    };
    expect(parse('1 John 10:1 - 2 John 4:5')).to.deep.equal(res_a);

    let res_b = {
      status: true,
      value: [
        { is_range: true,
          start: { book: '1JN', chapter: 10, verse:  1 },
          end  : { book: '1JN', chapter: 10, verse:  2 },
        },
        { book: 'JHN', chapter: 4, verse: 5 }
      ],
    };
    expect(parse('1 John 10:1 - 2 ; John 4:5')).to.deep.equal(res_b);

    // We also want to be able to parse this without whitespace if it were
    // included in a URL
    expect(parse('1JN 10:1 - 2JN 4:5')).to.deep.equal(res_a);
    expect(parse('1JN10:1-2JN4:5')).to.deep.equal(res_a);

    expect(parse('1JN 10:1-2 ; JHN 4:5')).to.deep.equal(res_b);
    expect(parse('1JN10:1-2;JHN4:5')).to.deep.equal(res_b);
  });

  it("Invalid look alikes", () => {
    expect(parse("Gen 1-2-3" ).status).to.deep.equal(false);
    expect(parse("Gen 1:2:3" ).status).to.deep.equal(false);
    expect(parse("Gen 1:2,3,").status).to.deep.equal(false);
    expect(parse("Gen 1 a"   ).status).to.deep.equal(false);
    expect(parse("Gen 1 -"   ).status).to.deep.equal(false); // incomplete
    expect(parse("Gen 1:"    ).status).to.deep.equal(false); // incomplete
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

  it("Out of range values don't crash", () => {
    // The numbers in these strings are higher than really exist, but these
    // shouldn't crash - user is expected to call validate() to ensure its
    // a valid reference
    expect(parse('Ruth 12'  ).value)
      .to.deep.equal([ { is_range: true,
                         start: { book: 'RUT', chapter: 12, verse: 1 },
                         end  : { book: 'RUT', chapter: 12, verse: 1 }
                       } ]);
    expect(parse('Ruth 2:50').value)
      .to.deep.equal([ { book: 'RUT', chapter: 2, verse: 50 } ]);
  });

  // These are the sorts of strings produced by formatter with url: true option
  it("URL", () => {

    expect(parse('gen3v2,3,4').value)
      .to.deep.equal([ { book: 'GEN', chapter: 3, verse: 2 },
                       { book: 'GEN', chapter: 3, verse: 3 },
                       { book: 'GEN', chapter: 3, verse: 4 },
                     ]);

    expect(parse('gen3v2-4').value)
      .to.deep.equal([ { is_range: true,
                         start: { book: 'GEN', chapter: 3, verse: 2 },
                         end  : { book: 'GEN', chapter: 3, verse: 4 },
                       }
                     ]);

    expect(parse('gen1v2-10_exo5v3-6v4').value)
      .to.deep.equal([ { is_range: true,
                         start: { book: 'GEN', chapter: 1, verse:  2 },
                         end  : { book: 'GEN', chapter: 1, verse: 10 },
                       },
                       { is_range: true,
                         start: { book: 'EXO', chapter: 5, verse: 3 },
                         end  : { book: 'EXO', chapter: 6, verse: 4 },
                       }
                     ]);
  });

  // I've seen this "dots only" style in various places online, so we should make sure we can parse
  it("Dotted Style", () => {
    expect(parse('Luke 1.1').value).to.deep.equal([{
      book: 'LUK', chapter: 1, verse: 1
    }]);
    expect(parse('Luke.1.1').value).to.deep.equal([{
      book: 'LUK', chapter: 1, verse: 1
    }]);
    expect(parse('Luke.1.1-Luke.1.5').value).to.deep.equal([{
      is_range : true,
      start    : { book: 'LUK', chapter: 1, verse: 1 },
      end      : { book: 'LUK', chapter: 1, verse: 5 },
    }]);
    expect(parse('Luke.1.1-1.5').value).to.deep.equal([{
      is_range : true,
      start    : { book: 'LUK', chapter: 1, verse: 1 },
      end      : { book: 'LUK', chapter: 1, verse: 5 },
    }]);
    expect(parse('Luke.1').value).to.deep.equal([{
      is_range : true,
      start    : { book: 'LUK', chapter: 1, verse:  1 },
      end      : { book: 'LUK', chapter: 1, verse: 80 },
    }]);
    expect(parse('Luke.').value).to.deep.equal([{
      is_range : true,
      start    : { book: 'LUK', chapter:  1, verse:  1 },
      end      : { book: 'LUK', chapter: 24, verse: 53 },
    }]);
    expect(parse('Lk.1.1').value).to.deep.equal([{
      book: 'LUK', chapter: 1, verse: 1
    }]);
  });

  it("Chicago Book Abbreviation", () => {
    // Old testemant: https://hbl.gcc.libguides.com/ld.php?content_id=13822328
    expect(parse('Am       1:1').value).to.deep.equal([ { book: 'AMO', chapter: 1, verse: 1 } ]);
    expect(parse('1 Chron. 1:1').value).to.deep.equal([ { book: '1CH', chapter: 1, verse: 1 } ]);
    expect(parse('1 Chr    1:1').value).to.deep.equal([ { book: '1CH', chapter: 1, verse: 1 } ]);
    expect(parse('2 Chron. 1:1').value).to.deep.equal([ { book: '2CH', chapter: 1, verse: 1 } ]);
    expect(parse('2 Chr    1:1').value).to.deep.equal([ { book: '2CH', chapter: 1, verse: 1 } ]);
    expect(parse('Dan.     1:1').value).to.deep.equal([ { book: 'DAN', chapter: 1, verse: 1 } ]);
    expect(parse('Dn       1:1').value).to.deep.equal([ { book: 'DAN', chapter: 1, verse: 1 } ]);
    expect(parse('Deut.    1:1').value).to.deep.equal([ { book: 'DEU', chapter: 1, verse: 1 } ]);
    expect(parse('Dt       1:1').value).to.deep.equal([ { book: 'DEU', chapter: 1, verse: 1 } ]);
    expect(parse('Eccles.  1:1').value).to.deep.equal([ { book: 'ECC', chapter: 1, verse: 1 } ]);
    expect(parse('Eccl     1:1').value).to.deep.equal([ { book: 'ECC', chapter: 1, verse: 1 } ]);
    expect(parse('Est      1:1').value).to.deep.equal([ { book: 'EST', chapter: 1, verse: 1 } ]);
    expect(parse('Exod.    1:1').value).to.deep.equal([ { book: 'EXO', chapter: 1, verse: 1 } ]);
    expect(parse('Ex       1:1').value).to.deep.equal([ { book: 'EXO', chapter: 1, verse: 1 } ]);
    expect(parse('Ezek.    1:1').value).to.deep.equal([ { book: 'EZK', chapter: 1, verse: 1 } ]);
    expect(parse('Ez       1:1').value).to.deep.equal([ { book: 'EZK', chapter: 1, verse: 1 } ]);
    expect(parse('Ezr      1:1').value).to.deep.equal([ { book: 'EZR', chapter: 1, verse: 1 } ]);
    expect(parse('Gen.     1:1').value).to.deep.equal([ { book: 'GEN', chapter: 1, verse: 1 } ]);
    expect(parse('Gn       1:1').value).to.deep.equal([ { book: 'GEN', chapter: 1, verse: 1 } ]);
    expect(parse('Hab.     1:1').value).to.deep.equal([ { book: 'HAB', chapter: 1, verse: 1 } ]);
    expect(parse('Hb       1:1').value).to.deep.equal([ { book: 'HAB', chapter: 1, verse: 1 } ]);
    expect(parse('Hag.     1:1').value).to.deep.equal([ { book: 'HAG', chapter: 1, verse: 1 } ]);
    expect(parse('Hg       1:1').value).to.deep.equal([ { book: 'HAG', chapter: 1, verse: 1 } ]);
    expect(parse('Hos      1:1').value).to.deep.equal([ { book: 'HOS', chapter: 1, verse: 1 } ]);
    expect(parse('Isa.     1:1').value).to.deep.equal([ { book: 'ISA', chapter: 1, verse: 1 } ]);
    expect(parse('Is       1:1').value).to.deep.equal([ { book: 'ISA', chapter: 1, verse: 1 } ]);
    expect(parse('Jer.     1:1').value).to.deep.equal([ { book: 'JER', chapter: 1, verse: 1 } ]);
    expect(parse('Jer      1:1').value).to.deep.equal([ { book: 'JER', chapter: 1, verse: 1 } ]);
    expect(parse('Job      1:1').value).to.deep.equal([ { book: 'JOB', chapter: 1, verse: 1 } ]);
    expect(parse('Jb       1:1').value).to.deep.equal([ { book: 'JOB', chapter: 1, verse: 1 } ]);
    expect(parse('Jl       1:1').value).to.deep.equal([ { book: 'JOL', chapter: 1, verse: 1 } ]);
    expect(parse('Jon.     1:1').value).to.deep.equal([ { book: 'JON', chapter: 1, verse: 1 } ]);
    expect(parse('Jon      1:1').value).to.deep.equal([ { book: 'JON', chapter: 1, verse: 1 } ]);
    expect(parse('Josh.    1:1').value).to.deep.equal([ { book: 'JOS', chapter: 1, verse: 1 } ]);
    expect(parse('Jo       1:1').value).to.deep.equal([ { book: 'JOS', chapter: 1, verse: 1 } ]);
    expect(parse('Judg.    1:1').value).to.deep.equal([ { book: 'JDG', chapter: 1, verse: 1 } ]);
    expect(parse('Jgs      1:1').value).to.deep.equal([ { book: 'JDG', chapter: 1, verse: 1 } ]);
    expect(parse('1 Kgs    1:1').value).to.deep.equal([ { book: '1KI', chapter: 1, verse: 1 } ]);
    expect(parse('2 Kgs    1:1').value).to.deep.equal([ { book: '2KI', chapter: 1, verse: 1 } ]);
    expect(parse('Lam.     1:1').value).to.deep.equal([ { book: 'LAM', chapter: 1, verse: 1 } ]);
    expect(parse('Lam      1:1').value).to.deep.equal([ { book: 'LAM', chapter: 1, verse: 1 } ]);
    expect(parse('Lev.     1:1').value).to.deep.equal([ { book: 'LEV', chapter: 1, verse: 1 } ]);
    expect(parse('Lv       1:1').value).to.deep.equal([ { book: 'LEV', chapter: 1, verse: 1 } ]);
    expect(parse('Mal.     1:1').value).to.deep.equal([ { book: 'MAL', chapter: 1, verse: 1 } ]);
    expect(parse('Mal      1:1').value).to.deep.equal([ { book: 'MAL', chapter: 1, verse: 1 } ]);
    expect(parse('Mic.     1:1').value).to.deep.equal([ { book: 'MIC', chapter: 1, verse: 1 } ]);
    expect(parse('Mi       1:1').value).to.deep.equal([ { book: 'MIC', chapter: 1, verse: 1 } ]);
    expect(parse('Nah.     1:1').value).to.deep.equal([ { book: 'NAM', chapter: 1, verse: 1 } ]);
    expect(parse('Na       1:1').value).to.deep.equal([ { book: 'NAM', chapter: 1, verse: 1 } ]);
    expect(parse('Neh.     1:1').value).to.deep.equal([ { book: 'NEH', chapter: 1, verse: 1 } ]);
    expect(parse('Neh      1:1').value).to.deep.equal([ { book: 'NEH', chapter: 1, verse: 1 } ]);
    expect(parse('Num.     1:1').value).to.deep.equal([ { book: 'NUM', chapter: 1, verse: 1 } ]);
    expect(parse('Nm       1:1').value).to.deep.equal([ { book: 'NUM', chapter: 1, verse: 1 } ]);
    expect(parse('Obad.    1:1').value).to.deep.equal([ { book: 'OBA', chapter: 1, verse: 1 } ]);
    expect(parse('Ob       1:1').value).to.deep.equal([ { book: 'OBA', chapter: 1, verse: 1 } ]);
    expect(parse('Prov.    1:1').value).to.deep.equal([ { book: 'PRO', chapter: 1, verse: 1 } ]);
    expect(parse('Prv      1:1').value).to.deep.equal([ { book: 'PRO', chapter: 1, verse: 1 } ]);
    expect(parse('Ps.      1:1').value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
    expect(parse('Pss.     1:1').value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
    expect(parse('Ps       1:1').value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
    expect(parse('Pss      1:1').value).to.deep.equal([ { book: 'PSA', chapter: 1, verse: 1 } ]);
    expect(parse('Ru       1:1').value).to.deep.equal([ { book: 'RUT', chapter: 1, verse: 1 } ]);
    expect(parse('1 Sam.   1:1').value).to.deep.equal([ { book: '1SA', chapter: 1, verse: 1 } ]);
    expect(parse('1 Sm     1:1').value).to.deep.equal([ { book: '1SA', chapter: 1, verse: 1 } ]);
    expect(parse('2 Sam.   1:1').value).to.deep.equal([ { book: '2SA', chapter: 1, verse: 1 } ]);
    expect(parse('2 Sm     1:1').value).to.deep.equal([ { book: '2SA', chapter: 1, verse: 1 } ]);
    expect(parse('Song of Sol. 1:1').value).to.deep.equal([ { book: 'SNG', chapter: 1, verse: 1 } ]);
    expect(parse('Sg       1:1').value).to.deep.equal([ { book: 'SNG', chapter: 1, verse: 1 } ]);
    expect(parse('Zech.    1:1').value).to.deep.equal([ { book: 'ZEC', chapter: 1, verse: 1 } ]);
    expect(parse('Zec      1:1').value).to.deep.equal([ { book: 'ZEC', chapter: 1, verse: 1 } ]);
    expect(parse('Zeph.    1:1').value).to.deep.equal([ { book: 'ZEP', chapter: 1, verse: 1 } ]);
    expect(parse('Zep      1:1').value).to.deep.equal([ { book: 'ZEP', chapter: 1, verse: 1 } ]);


    // New testemant: http://hbl.gcc.libguides.com/ld.php?content_id=13822330
    expect(parse('Acts     1:1').value).to.deep.equal([ { book: 'ACT', chapter: 1, verse: 1 } ]);
    expect(parse('Apoc.    1:1').value).to.deep.equal([ { book: 'REV', chapter: 1, verse: 1 } ]);
    expect(parse('Col.     1:1').value).to.deep.equal([ { book: 'COL', chapter: 1, verse: 1 } ]);
    expect(parse('Col      1:1').value).to.deep.equal([ { book: 'COL', chapter: 1, verse: 1 } ]);
    expect(parse('1 Cor.   1:1').value).to.deep.equal([ { book: '1CO', chapter: 1, verse: 1 } ]);
    expect(parse('1 Cor    1:1').value).to.deep.equal([ { book: '1CO', chapter: 1, verse: 1 } ]);
    expect(parse('2 Cor.   1:1').value).to.deep.equal([ { book: '2CO', chapter: 1, verse: 1 } ]);
    expect(parse('2 Cor    1:1').value).to.deep.equal([ { book: '2CO', chapter: 1, verse: 1 } ]);
    expect(parse('Eph.     1:1').value).to.deep.equal([ { book: 'EPH', chapter: 1, verse: 1 } ]);
    expect(parse('Eph      1:1').value).to.deep.equal([ { book: 'EPH', chapter: 1, verse: 1 } ]);
    expect(parse('Gal.     1:1').value).to.deep.equal([ { book: 'GAL', chapter: 1, verse: 1 } ]);
    expect(parse('Gal      1:1').value).to.deep.equal([ { book: 'GAL', chapter: 1, verse: 1 } ]);
    expect(parse('Heb.     1:1').value).to.deep.equal([ { book: 'HEB', chapter: 1, verse: 1 } ]);
    expect(parse('Heb      1:1').value).to.deep.equal([ { book: 'HEB', chapter: 1, verse: 1 } ]);
    expect(parse('Jas      1:1').value).to.deep.equal([ { book: 'JAS', chapter: 1, verse: 1 } ]);
    expect(parse('Jn       1:1').value).to.deep.equal([ { book: 'JHN', chapter: 1, verse: 1 } ]);
    expect(parse('1 Jn     1:1').value).to.deep.equal([ { book: '1JN', chapter: 1, verse: 1 } ]);
    expect(parse('2 Jn     1:1').value).to.deep.equal([ { book: '2JN', chapter: 1, verse: 1 } ]);
    expect(parse('3 Jn     1:1').value).to.deep.equal([ { book: '3JN', chapter: 1, verse: 1 } ]);
    expect(parse('Lk       1:1').value).to.deep.equal([ { book: 'LUK', chapter: 1, verse: 1 } ]);
    expect(parse('Mk       1:1').value).to.deep.equal([ { book: 'MRK', chapter: 1, verse: 1 } ]);
    expect(parse('Mt       1:1').value).to.deep.equal([ { book: 'MAT', chapter: 1, verse: 1 } ]);
    expect(parse('1 Pet.   1:1').value).to.deep.equal([ { book: '1PE', chapter: 1, verse: 1 } ]);
    expect(parse('1 Pt     1:1').value).to.deep.equal([ { book: '1PE', chapter: 1, verse: 1 } ]);
    expect(parse('2 Pet.   1:1').value).to.deep.equal([ { book: '2PE', chapter: 1, verse: 1 } ]);
    expect(parse('2 Pt     1:1').value).to.deep.equal([ { book: '2PE', chapter: 1, verse: 1 } ]);
    expect(parse('Philem.  1:1').value).to.deep.equal([ { book: 'PHM', chapter: 1, verse: 1 } ]);
    expect(parse('Phlm.    1:1').value).to.deep.equal([ { book: 'PHM', chapter: 1, verse: 1 } ]);
    expect(parse('Phil.    1:1').value).to.deep.equal([ { book: 'PHP', chapter: 1, verse: 1 } ]);
    expect(parse('Phil     1:1').value).to.deep.equal([ { book: 'PHP', chapter: 1, verse: 1 } ]);
    expect(parse('Rev.     1:1').value).to.deep.equal([ { book: 'REV', chapter: 1, verse: 1 } ]);
    expect(parse('Rv       1:1').value).to.deep.equal([ { book: 'REV', chapter: 1, verse: 1 } ]);
    expect(parse('Rom.     1:1').value).to.deep.equal([ { book: 'ROM', chapter: 1, verse: 1 } ]);
    expect(parse('Rom      1:1').value).to.deep.equal([ { book: 'ROM', chapter: 1, verse: 1 } ]);
    expect(parse('1 Thess. 1:1').value).to.deep.equal([ { book: '1TH', chapter: 1, verse: 1 } ]);
    expect(parse('1 Thes   1:1').value).to.deep.equal([ { book: '1TH', chapter: 1, verse: 1 } ]);
    expect(parse('2 Thess. 1:1').value).to.deep.equal([ { book: '2TH', chapter: 1, verse: 1 } ]);
    expect(parse('2 Thes   1:1').value).to.deep.equal([ { book: '2TH', chapter: 1, verse: 1 } ]);
    expect(parse('1 Tim.   1:1').value).to.deep.equal([ { book: '1TI', chapter: 1, verse: 1 } ]);
    expect(parse('1 Tm     1:1').value).to.deep.equal([ { book: '1TI', chapter: 1, verse: 1 } ]);
    expect(parse('2 Tim.   1:1').value).to.deep.equal([ { book: '2TI', chapter: 1, verse: 1 } ]);
    expect(parse('2 Tm     1:1').value).to.deep.equal([ { book: '2TI', chapter: 1, verse: 1 } ]);
    expect(parse('Ti       1:1').value).to.deep.equal([ { book: 'TIT', chapter: 1, verse: 1 } ]);
  });
});
