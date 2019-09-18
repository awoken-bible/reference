"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const { validate } = require('../src/validate.ts');
const v = require('../src/Versification.ts').default;

describe('validate', () => {
  it('Valid references return empty error sets', () => {
    expect(validate(v, { book: 'GEN', chapter: 3, verse: 10})).to.deep.equal([]);

    expect(validate(v, { is_range: true,
                         start: { book: 'GEN', chapter: 3, verse: 10 },
                         end:   { book: 'GEN', chapter: 4, verse: 12 },
                       })).to.deep.equal([]);
    expect(validate(v, { is_range: true,
                         start: { book: 'GEN', chapter: 3, verse: 10 },
                         end:   { book: 'GEN', chapter: 4, verse:  6 },
                       })).to.deep.equal([]);
    expect(validate(v, { is_range: true,
                         start: { book: 'GEN', chapter: 3, verse: 10 },
                         end:   { book: 'EXO', chapter: 1, verse:  1 },
                       })).to.deep.equal([]);

  });

  it('Bad Book', () => {
    let errs;

    errs = validate(v, { book: 'XYZ', chapter: 3, verse: 10});
    expect(errs.length).to.deep.equal(1);
    expect(errs[0].kind).to.deep.equal("BADBOOK");
    expect(errs[0].got ).to.deep.equal("XYZ");

    errs = validate(v, { is_range: true,
                         start : { book: 'GEN', chapter: 1, verse: 1 },
                         end   : { book: 'ABC', chapter: 1, verse: 1 },
                       });
    expect(errs.length).to.deep.equal(1);
    expect(errs[0].kind).to.deep.equal("BADBOOK");
    expect(errs[0].got ).to.deep.equal("ABC");

    errs = validate(v, { is_range: true,
                         start : { book: '123', chapter: 1, verse: 1 },
                         end   : { book: 'EXO', chapter: 1, verse: 1 },
                       });
    expect(errs.length).to.deep.equal(1);
    expect(errs[0].kind).to.deep.equal("BADBOOK");
    expect(errs[0].got ).to.deep.equal("123");

    errs = validate(v, { is_range: true,
                         start : { book: '123', chapter: 1, verse: 1 },
                         end   : { book: '987', chapter: 1, verse: 1 },
                       });
    expect(errs.length).to.deep.equal(2);
    expect(errs[0].kind).to.deep.equal("BADBOOK");
    expect(errs[0].got ).to.deep.equal("123");
    expect(errs[1].kind).to.deep.equal("BADBOOK");
    expect(errs[1].got ).to.deep.equal("987");
  });

  it('Bad Chapter', () => {
    let errs;

    errs = validate(v, { book: 'GEN', chapter:  5, verse: 26});
    expect(errs.length).to.deep.equal(0);

    errs = validate(v, { book: 'GEN', chapter: 50, verse: 26});
    expect(errs.length).to.deep.equal(0);

    errs = validate(v, { book: 'GEN', chapter: 51, verse:  1});
    expect(errs.length).to.deep.equal(1);
    expect(errs[0]).to.deep.equal({
      kind       : "BADCHPT",
      is_warning : false,
      message    : "Genesis has only 50 chapters",
      max_value  : 50,
      got        : 51,
    });

    errs = validate(v, { is_range: true,
                         start: { book: 'PRO', chapter:  1, verse:  1 },
                         end  : { book: 'ECC', chapter: 13, verse:  1 },
                       });
    expect(errs.length).to.deep.equal(1);
    expect(errs[0]).to.deep.equal({
      kind       : "BADCHPT",
      is_warning : false,
      message    : "Ecclesiastes has only 12 chapters",
      max_value  : 12,
      got        : 13,
    });

    errs = validate(v, { is_range: true,
                         start: { book: 'PRO', chapter: 32, verse:  1 },
                         end  : { book: 'ECC', chapter: 13, verse:  1 },
                       });
    expect(errs.length).to.deep.equal(2);
    expect(errs[0]).to.deep.equal({
      kind       : "BADCHPT",
      is_warning : false,
      message    : "Proverbs has only 31 chapters",
      max_value  : 31,
      got        : 32,
    });
    expect(errs[1]).to.deep.equal({
      kind       : "BADCHPT",
      is_warning : false,
      message    : "Ecclesiastes has only 12 chapters",
      max_value  : 12,
      got        : 13,
    });
  });

  it('Bad Verse', () => {
    let errs;

    errs = validate(v, { book: 'GEN', chapter: 50, verse: 27});
    expect(errs.length).to.deep.equal(1);
    expect(errs[0]).to.deep.equal({
      kind       : "BADVERSE",
      is_warning : false,
      message    : "Genesis 50 has only 26 verses",
      max_value  : 26,
      got        : 27,
    });

    errs = validate(v, { is_range: true,
                         start: { book: 'DEU', chapter: 27, verse: 22 },
                         end  : { book: 'DEU', chapter: 27, verse: 29 },
                       });
    expect(errs.length).to.deep.equal(1);
    expect(errs[0]).to.deep.equal({
      kind       : "BADVERSE",
      is_warning : false,
      message    : "Deuteronomy 27 has only 26 verses",
      max_value  : 26,
      got        : 29,
    });

    errs = validate(v, { is_range: true,
                         start: { book: '2SA', chapter: 12, verse:  32 },
                         end  : { book: '2SA', chapter: 13, verse: 100 },
                       });
    expect(errs.length).to.deep.equal(2);
    expect(errs[0]).to.deep.equal({
      kind       : "BADVERSE",
      is_warning : false,
      message    : "2 Samuel 12 has only 31 verses",
      max_value  : 31,
      got        : 32,
    });
    expect(errs[1]).to.deep.equal({
      kind       : "BADVERSE",
      is_warning : false,
      message    : "2 Samuel 13 has only 39 verses",
      max_value  :  39,
      got        : 100,
    });
  });

  it('Bad Range', () => {
    let errs;

    errs = validate(v, { is_range: true,
                         start : { book: 'EXO', chapter: 3, verse: 5 },
                         end   : { book: 'GEN', chapter: 2, verse: 3 }
                       });
    expect(errs.length).to.deep.equal(1);
    expect(errs[0]    ).to.deep.equal({
      kind       : "INVERTEDRANGE",
      is_warning : false,
      message    : "Range is backwards (Genesis comes before Exodus)",
      component  : "book",
    });


    errs = validate(v, { is_range: true,
                         start : { book: 'GEN', chapter: 3, verse: 5 },
                         end   : { book: 'EXO', chapter: 2, verse: 3 }
                       });
    expect(errs.length).to.deep.equal(0);


    errs = validate(v, { is_range: true,
                         start : { book: 'GEN', chapter: 3, verse: 5 },
                         end   : { book: 'GEN', chapter: 2, verse: 3 }
                       });
    expect(errs.length).to.deep.equal(1);
    expect(errs[0]    ).to.deep.equal({
      kind       : "INVERTEDRANGE",
      is_warning : false,
      message    : "Chapter range is backwards",
      component  : "chapter",
    });


    errs = validate(v, { is_range: true,
                         start : { book: 'GEN', chapter: 2, verse: 5 },
                         end   : { book: 'GEN', chapter: 3, verse: 3 }
                       });
    expect(errs.length).to.deep.equal(0);

    errs = validate(v, { is_range: true,
                         start : { book: 'GEN', chapter: 3, verse: 5 },
                         end   : { book: 'GEN', chapter: 3, verse: 3 }
                       });
    expect(errs.length).to.deep.equal(1);
    expect(errs[0]    ).to.deep.equal({
      kind       : "INVERTEDRANGE",
      is_warning : false,
      message    : "Verse range is backwards",
      component  : "verse",
    });


    errs = validate(v, { is_range: true,
                         start : { book: 'GEN', chapter: 3, verse: 3 },
                         end   : { book: 'GEN', chapter: 3, verse: 5 }
                       });
    expect(errs.length).to.deep.equal(0);


    errs = validate(v, { is_range: true,
                         start : { book: 'GEN', chapter: 3, verse: 3 },
                         end   : { book: 'GEN', chapter: 3, verse: 3 }
                       });
    expect(errs.length).to.deep.equal(1);
    expect(errs[0]    ).to.deep.equal({
      kind       : "USELESSRANGE",
      is_warning : true,
      message    : "Range contains only a single verse",
    });

    errs = validate(v, { is_range: true,
                         start : { book: 'GEN', chapter: 3, verse: 3 },
                         end   : { book: 'GEN', chapter: 3, verse: 3 }
                       }, false); // ignore warnings
    expect(errs.length).to.deep.equal(0);
  });
});
