"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const BibleRef = require('../src/index.ts').default;

describe("index", () => {

  it('Parse and Format', () => {

    expect(BibleRef.parse('John 3:16')).to.deep.equal({ status: true, value: [{ book: 'JHN', chapter: 3, verse: 16 }]});
    expect(BibleRef.parseOrThrow('John 3:16')).to.deep.equal([{ book: 'JHN', chapter: 3, verse: 16 }]);
    expect(() => BibleRef.parseOrThrow('hello')).to.throw();

    expect(BibleRef.format({ is_range: true,
                         start: { book: 'MAL', chapter: 3, verse: 6 },
                         end: { book: 'MAL', chapter: 4, verse: 2 },
                       })).is.deep.equal('Malachi 3:6 - 4:2');
  });

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

  it('sort', () => {
    expect(BibleRef.sort(
      [{ book: 'MAL', chapter: 1, verse: 12 },
       { book: 'GEN', chapter: 5, verse:  9 },
       { book: 'MAL', chapter: 1, verse: 11 },
       { book: 'GEN', chapter: 4, verse: 10 },
       { book: 'REV', chapter: 1, verse:  1 },
       { book: 'MAL', chapter: 1, verse: 10 },
       { book: 'GEN', chapter: 4, verse: 11 },
      ])).to.deep.equal([
        { book: 'GEN', chapter: 4, verse: 10 },
        { book: 'GEN', chapter: 4, verse: 11 },
        { book: 'GEN', chapter: 5, verse:  9 },
        { book: 'MAL', chapter: 1, verse: 10 },
        { book: 'MAL', chapter: 1, verse: 11 },
        { book: 'MAL', chapter: 1, verse: 12 },
        { book: 'REV', chapter: 1, verse:  1 },
      ]);

    expect(BibleRef.sort(
      [{ book: 'EXO', chapter: 4, verse:  5 },
       { book: 'GEN', chapter: 4, verse: 11 },
       { book: 'DEU', chapter: 1, verse:  1 },
       { is_range: true,
         start: { book: 'GEN', chapter: 4, verse: 10 },
         end  : { book: 'EXO', chapter: 3, verse:  6 },
       },
       { book: 'REV', chapter: 1, verse:  1 },
       { book: 'EXO', chapter: 4, verse:  6 },
       { book: 'GEN', chapter: 4, verse:  9 },
       { is_range: true,
         start: { book: 'EXO', chapter: 4, verse:  6 },
         end  : { book: 'EXO', chapter: 4, verse: 10 },
       },
       { book: 'EXO', chapter: 4, verse:  7 },
       { book: 'DEU', chapter: 1, verse:  1 },
       { book: 'GEN', chapter: 4, verse: 10 },
      ])).to.deep.equal([
        { book: 'GEN', chapter: 4, verse:  9 },
        { book: 'GEN', chapter: 4, verse: 10 },
        { is_range: true,
          start: { book: 'GEN', chapter: 4, verse: 10 },
          end  : { book: 'EXO', chapter: 3, verse:  6 },
        },
        { book: 'GEN', chapter: 4, verse: 11 },
        { book: 'EXO', chapter: 4, verse:  5 },
        { book: 'EXO', chapter: 4, verse:  6 },
        { is_range: true,
          start: { book: 'EXO', chapter: 4, verse:  6 },
          end  : { book: 'EXO', chapter: 4, verse: 10 },
        },
        { book: 'EXO', chapter: 4, verse:  7 },
        { book: 'DEU', chapter: 1, verse:  1 },
        { book: 'DEU', chapter: 1, verse:  1 },
        { book: 'REV', chapter: 1, verse:  1 },
      ]);
  });

  it('Vidx round trip', () => {
    for(let i = 0; i < 33102; ++i){
      expect(BibleRef.toVidx(BibleRef.fromVidx(i))).to.deep.equal(i);
    }
  });

  it('countVerses', () => {
    expect(BibleRef.countVerses( { book: 'GEN', chapter: 10, verse:  8 } )).to.deep.equal(1);
    expect(BibleRef.countVerses([{ book: 'GEN', chapter: 10, verse:  8 },
                                 { book: 'GEN', chapter: 10, verse: 10 }])).to.deep.equal(2);
    expect(BibleRef.countVerses([{ is_range: true,
                                   start: { book: 'GEN', chapter: 10, verse:  8 },
                                   end:   { book: 'GEN', chapter: 10, verse: 10 }}])).to.deep.equal(3);

  });

  it('firstNVerses', () => {
    expect(BibleRef.firstNVerses(
      [{ is_range: true,
         start   : { book: 'GEN', chapter: 2, verse:  6 },
         end     : { book: 'GEN', chapter: 2, verse:  9 }
       },
       { is_range: true,
         start   : { book: 'GEN', chapter: 4, verse: 12 },
         end     : { book: 'GEN', chapter: 4, verse: 16 }
       },
      ], 6)).to.deep.equal([{ is_range: true,
                              start   : { book: 'GEN', chapter: 2, verse:  6 },
                              end     : { book: 'GEN', chapter: 2, verse:  9 }
                            },
                            { is_range: true,
                              start   : { book: 'GEN', chapter: 4, verse: 12 },
                              end     : { book: 'GEN', chapter: 4, verse: 13 }
                            },
                           ]);

    expect(BibleRef.firstNVerses({ book: 'MRK', chapter: 10, verse: 2}, 10))
      .is.deep.equal([{ book: 'MRK', chapter: 10, verse: 2}]);
  });

  it('Validate and Repair', () => {
    let errs;

    errs = BibleRef.validate([
      { book: 'GEN', chapter: 100, verse: 1 },
      { book: 'XYZ', chapter:   1, verse: 1 },
    ]);
    expect(errs.length).to.deep.equal(2);
    expect(errs[0].kind).to.deep.equal("BADCHPT");
    expect(errs[1].kind).to.deep.equal("BADBOOK");

    errs = BibleRef.validate(
      { is_range: true,
        start : { book: 'GEN', chapter: 1, verse: 100 },
        end   : { book: 'GEN', chapter: 1, verse: 100 },
      }
    );
    expect(errs.length).to.deep.equal(3);
    expect(errs[0].kind).to.deep.equal("BADVERSE");
		expect(errs[1].kind).to.deep.equal("BADVERSE");
    expect(errs[2].kind).to.deep.equal("RANGEOFONE");

    expect(BibleRef.repair(
      { is_range: true,
        start : { book: 'GEN', chapter: 100, verse: 1 },
        end   : { book: 'GEN', chapter: 100, verse: 1 },
      }
    )).to.deep.equal({
      book: 'GEN', chapter: 50, verse: 26
    });

    expect(BibleRef.repair(
      { is_range: true,
        start : { book: 'GEN', chapter: 100, verse: 1 },
        end   : { book: 'GEN', chapter: 100, verse: 1 },
      }, false
    )).to.deep.equal(
      { is_range: true,
        start : { book: 'GEN', chapter: 50, verse: 26 },
        end   : { book: 'GEN', chapter: 50, verse: 26 },
      }
    );
  });
});
