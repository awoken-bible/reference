"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const { formatBibleVerse, formatBibleRange, formatBibleRefList } = require('../src/printer.ts');
const v = require('../src/Versification.ts').default;


describe("printer", () => {

  describe('formatBibleVerse', () => {
    it('Default Options', () => {
      // Standard
      expect(formatBibleVerse(v, { book: 'GEN', chapter: 3, verse: 8 }))
        .is.deep.equal('Genesis 3:8');
      expect(formatBibleVerse(v, { book: '1JN', chapter: 10, verse: 2 }))
        .is.deep.equal('1 John 10:2');
      expect(formatBibleVerse(v, { book: 'SNG', chapter: 3, verse: 4 }))
        .is.deep.equal('Song of Solomon 3:4');
    });

    it('Custom Verse Separator', () => {
      expect(formatBibleVerse(v,
                              { book: 'GEN', chapter: 3, verse: 8 },
                              { verse_separator: 'v' }))
        .is.deep.equal('Genesis 3v8');
      expect(formatBibleVerse(v,
                              { book: '1JN', chapter: 10, verse: 2 },
                              { verse_separator: '.' }))
        .is.deep.equal('1 John 10.2');
    });

    it('Strip Whitespace', () => {
      expect(formatBibleVerse(v,
                              { book: 'GEN', chapter: 3, verse: 8 },
                              { strip_whitespace: true }))
        .is.deep.equal('Genesis3:8');
      expect(formatBibleVerse(v,
                              { book: '1JN', chapter: 10, verse: 2 },
                              { strip_whitespace: true }))
        .is.deep.equal('1John10:2');
      expect(formatBibleVerse(v,
                              { book: 'SNG', chapter: 3, verse: 4 },
                              { strip_whitespace: true }))
        .is.deep.equal('SongofSolomon3:4');
    });

    it('Book Ids', () => {
      expect(formatBibleVerse(v,
                              { book: 'GEN', chapter: 3, verse: 8 },
                              { book_format: 'usfm' }))
        .is.deep.equal('GEN 3:8');
      expect(formatBibleVerse(v,
                              { book: '1JN', chapter: 10, verse: 2 },
                              { book_format: 'usfm' }))
        .is.deep.equal('1JN 10:2');
      expect(formatBibleVerse(v,
                              { book: 'SNG', chapter: 3, verse: 4 },
                              { book_format: 'usfm' }))
        .is.deep.equal('SNG 3:4');
    });

    it('Mixed Options', () => {
      expect(formatBibleVerse(v,
                              { book: 'GEN', chapter: 3, verse: 8 },
                              { strip_whitespace: true, verse_separator: '.' }))
        .is.deep.equal('Genesis3.8');
      expect(formatBibleVerse(v,
                              { book: '1JN', chapter: 10, verse: 2 },
                              { verse_separator: ' v ', book_format: 'usfm' }))
        .is.deep.equal('1JN 10 v 2');
      expect(formatBibleVerse(v,
                              { book: 'SNG', chapter: 3, verse: 4 },
                              { book_format: 'usfm', strip_whitespace: true }))
        .is.deep.equal('SNG3:4');
    });

    it('Exception Tests', () => {
      expect(() => formatBibleVerse(v,{ book: 'BAD', chapter: 1, verse: 1 })).to.throw();
    });

    it('Lowercase', () => {
      expect(formatBibleVerse(v, { book: 'GEN', chapter: 1, verse: 1 }, { lowercase: true }))
        .is.deep.equal('genesis 1:1');
      expect(formatBibleVerse(v, { book: 'GEN', chapter: 1, verse: 1 }, { lowercase: true, book_format: 'usfm' }))
        .is.deep.equal('gen 1:1');
    });
  });

  describe('formatBibleRange', () => {
    it('Default Options', () => {
      // Verse range
      expect(formatBibleRange(v, { is_range: true,
                                   start: { book: 'GEN', chapter: 3, verse:  8 },
                                   end  : { book: 'GEN', chapter: 3, verse: 10 },
                                 }
                             ))
        .is.deep.equal('Genesis 3:8-10');

			// Single Verse range (make sure we don't output the invalid "Genesis 3:8-8"
			// which the parser will error on
      expect(formatBibleRange(v, { is_range: true,
                                   start: { book: 'GEN', chapter: 3, verse: 8 },
                                   end  : { book: 'GEN', chapter: 3, verse: 8 },
                                 }
                             ))
        .is.deep.equal('Genesis 3:8');

      // Cross Chapter Range
      expect(formatBibleRange(v, { is_range: true,
                                   start: { book: 'GEN', chapter: 3, verse:  8 },
                                   end  : { book: 'GEN', chapter: 4, verse: 10 },
                                 }))
        .is.deep.equal('Genesis 3:8 - 4:10');

      // Cross Book Range
      expect(formatBibleRange(v, { is_range: true,
                                   start: { book: 'GEN', chapter: 3, verse:  8 },
                                   end  : { book: 'EXO', chapter: 3, verse: 10 },
                                 }
                             ))
        .is.deep.equal('Genesis 3:8 - Exodus 3:10');

      // Start == End should appear as single BibleVerse
      expect(formatBibleRange(v, { is_range: true,
                                   start: { book: 'GEN', chapter: 3, verse:  8 },
                                   end  : { book: 'GEN', chapter: 3, verse:  8 },
                                 }
                             ))
        .is.deep.equal('Genesis 3:8');
    });

    it('Strip Whitespace and book id', () => {
      let opts = { strip_whitespace: true, book_format: 'usfm' };
      // Verse range
      expect(formatBibleRange(v, { is_range: true,
                                   start: { book: 'GEN', chapter: 3, verse:  8 },
                                   end  : { book: 'GEN', chapter: 3, verse: 10 },
                                 }, opts
                             ))
        .is.deep.equal('GEN3:8-10');

      // Cross Chapter Range
      expect(formatBibleRange(v, { is_range: true,
                                   start: { book: 'GEN', chapter: 3, verse:  8 },
                                   end  : { book: 'GEN', chapter: 4, verse: 10 },
                                 }, opts
                             ))
        .is.deep.equal('GEN3:8-4:10');

      // Cross Book Range
      expect(formatBibleRange(v, { is_range: true,
                                   start: { book: 'GEN', chapter: 3, verse:  8 },
                                   end  : { book: 'EXO', chapter: 3, verse: 10 },
                                 }, opts
                             ))
        .is.deep.equal('GEN3:8-EXO3:10');
    });

    it('Compact', () => {
      let r;

      r = { is_range: true,
            start: { book: 'GEN', chapter:  1, verse:  1 },
            end  : { book: 'GEN', chapter: 50, verse: 26 },
          };
      expect(formatBibleRange(v, r, { compact: true }))
        .is.deep.equal('Genesis');
      expect(formatBibleRange(v, r, { compact: false }))
        .is.deep.equal('Genesis 1:1 - 50:26');


      r = { is_range: true,
            start: { book: 'NAM', chapter:  1, verse:  1 },
            end  : { book: 'NAM', chapter:  3, verse: 19 },
          };
      expect(formatBibleRange(v, r, { compact: true }))
        .is.deep.equal('Nahum');
      expect(formatBibleRange(v, r, { compact: false }))
        .is.deep.equal('Nahum 1:1 - 3:19');


      r = { is_range: true,
            start: { book: 'GEN', chapter:  1, verse:  1 },
            end  : { book: 'GEN', chapter: 50, verse: 26 },
          };
      expect(formatBibleRange(v, r, { compact: true }))
        .is.deep.equal('Genesis');
      expect(formatBibleRange(v, r, { compact: false }))
        .is.deep.equal('Genesis 1:1 - 50:26');


      r = { is_range: true,
            start: { book: 'NAM', chapter:  1, verse:  1 },
            end  : { book: 'NAM', chapter:  3, verse: 18 },
          };
      expect(formatBibleRange(v, r, { compact: true }))
        .is.deep.equal('Nahum 1:1 - 3:18');
      expect(formatBibleRange(v, r, { compact: false }))
        .is.deep.equal('Nahum 1:1 - 3:18');


      r = { is_range: true,
            start: { book: 'NAM', chapter:  1, verse:  1 },
            end  : { book: 'NAM', chapter:  2, verse: 13 },
          };
      expect(formatBibleRange(v, r, { compact: true }))
        .is.deep.equal('Nahum 1 - 2');
      expect(formatBibleRange(v, r, { compact: false }))
        .is.deep.equal('Nahum 1:1 - 2:13');


      r = { is_range: true,
            start: { book: 'NAM', chapter:  1, verse:  1 },
            end  : { book: 'NAM', chapter:  2, verse: 12 },
          };
      expect(formatBibleRange(v, r, { compact: true }))
        .is.deep.equal('Nahum 1:1 - 2:12');
      expect(formatBibleRange(v, r, { compact: false }))
        .is.deep.equal('Nahum 1:1 - 2:12');


      r = { is_range: true,
            start: { book: 'NAM', chapter:  1, verse:  1 },
            end  : { book: 'NAM', chapter:  1, verse: 15 },
          };
      expect(formatBibleRange(v, r, { compact: true }))
        .is.deep.equal('Nahum 1');
      expect(formatBibleRange(v, r, { compact: false }))
        .is.deep.equal('Nahum 1:1-15');


      r = { is_range: true,
            start: { book: 'NAM', chapter:  1, verse:  1 },
            end  : { book: 'NAM', chapter:  1, verse: 14 },
          };
      expect(formatBibleRange(v, r, { compact: true }))
        .is.deep.equal('Nahum 1:1-14');
      expect(formatBibleRange(v, r, { compact: false }))
        .is.deep.equal('Nahum 1:1-14');
    });
  });

  describe('formatBibleRefList', () => {
    it('Edge cases', () => {
      expect(formatBibleRefList(v, [])).is.deep.equal('');
    });


    it('Non-connected list', () => {
      expect(formatBibleRefList(v, [{ book: 'GEN', chapter: 3, verse:  8 }]))
        .is.deep.equal('Genesis 3:8');

      expect(formatBibleRefList(v, [{ book: 'GEN', chapter: 3, verse:  8 },
                                    { book: 'EXO', chapter: 6, verse:  7 }]))
        .is.deep.equal('Genesis 3:8; Exodus 6:7');

      expect(formatBibleRefList(v, [{ book: 'GEN', chapter: 3, verse:  8 },
                                    { book: 'EXO', chapter: 6, verse:  7 },
                                    { book: 'LEV', chapter: 2, verse:  4 }]))
        .is.deep.equal('Genesis 3:8; Exodus 6:7; Leviticus 2:4');
    });

    it('Common chapter and book', () => {
      expect(formatBibleRefList(v, [{ book: 'GEN', chapter: 3, verse:  2 },
                                    { book: 'GEN', chapter: 3, verse:  8 }]))
        .is.deep.equal('Genesis 3:2,8');

      expect(formatBibleRefList(v, [{ is_range: true,
                                      start: { book: 'GEN', chapter: 3, verse:  2 },
                                      end  : { book: 'GEN', chapter: 3, verse:  8 },
                                    },
                                    { book: 'GEN', chapter: 3, verse:  12 },
                                    { is_range: true,
                                      start: { book: 'GEN', chapter: 3, verse:  15 },
                                      end  : { book: 'GEN', chapter: 3, verse:  17 },
                                    },
                                   ]
                               ))
        .is.deep.equal('Genesis 3:2-8,12,15-17');
    });

    it('Common book', () => {
      expect(formatBibleRefList(v, [{ book: 'GEN', chapter: 3, verse:  2 },
                                    { book: 'GEN', chapter: 4, verse:  8 }]))
        .is.deep.equal('Genesis 3:2, 4:8');
      expect(formatBibleRefList(v, [{ book: 'GEN', chapter: 3, verse:  2 },
                                    { book: 'GEN', chapter: 4, verse:  8 }],
                                { strip_whitespace: true }))
        .is.deep.equal('Genesis3:2,4:8');

      let reflist = [{ book: 'GEN', chapter: 3, verse:  2 },
                     { is_range: true,
                       start: { book: 'GEN', chapter: 3, verse:  5 },
                       end  : { book: 'GEN', chapter: 3, verse:  7 },
                     },
                     { is_range: true,
                       start: { book: 'GEN', chapter: 5, verse: 20 },
                       end  : { book: 'GEN', chapter: 6, verse:  3 },
                     },
                     { book: 'GEN', chapter: 6, verse:  10 },
                     { book: 'GEN', chapter: 6, verse:  12 }
                    ];
      expect(formatBibleRefList(v, reflist))
        .is.deep.equal('Genesis 3:2,5-7, 5:20 - 6:3, 6:10,12');
      expect(formatBibleRefList(v, reflist, { strip_whitespace: true, book_format: 'usfm' }))
        .is.deep.equal('GEN3:2,5-7,5:20-6:3,6:10,12');
    });

    it('Complex Mix', () => {
      let reflist = [{ book: 'GEN', chapter: 3, verse:  2 },
                     { is_range: true,
                       start: { book: 'GEN', chapter: 3, verse:  5 },
                       end  : { book: 'GEN', chapter: 3, verse:  7 },
                     },
                     { is_range: true,
                       start: { book: 'EXO', chapter: 5, verse: 20 },
                       end  : { book: 'EXO', chapter: 6, verse:  3 },
                     },
                     { book: 'LEV', chapter: 6, verse:  10 },
                     { book: 'LEV', chapter: 6, verse:  12 }
                    ];

      expect(formatBibleRefList(v, reflist))
        .is.deep.equal('Genesis 3:2,5-7; Exodus 5:20 - 6:3; Leviticus 6:10,12');
    });
  });

  it('Combine ranges', () => {
    expect(formatBibleRefList(v, [
      { book: 'GEN', chapter: 3, verse:  2 },
      { book: 'GEN', chapter: 3, verse:  3 },
      { book: 'GEN', chapter: 3, verse:  4 },
    ], {})).to.deep.equal('Genesis 3:2,3,4');

    expect(formatBibleRefList(v, [
      { book: 'GEN', chapter: 3, verse:  2 },
      { book: 'GEN', chapter: 3, verse:  3 },
      { book: 'GEN', chapter: 3, verse:  4 },
    ], { combine_ranges: true })).to.deep.equal('Genesis 3:2-4');
  });

  it('URL', () => {
    expect(formatBibleRefList(v, [
      { book: 'GEN', chapter: 3, verse:  2 },
      { book: 'GEN', chapter: 3, verse:  3 },
      { book: 'GEN', chapter: 3, verse:  4 },
    ], 'url' )).to.deep.equal('gen3v2,3,4');

    expect(formatBibleRefList(v, [
      { book: 'GEN', chapter: 3, verse:  2 },
      { book: 'GEN', chapter: 3, verse:  3 },
      { book: 'GEN', chapter: 3, verse:  4 },
    ], 'url:combined')).to.deep.equal('gen3v2-4');

    expect(formatBibleRefList(v, [
      { is_range : true,
        start    : { book: 'GEN', chapter: 1, verse:  2 },
        end      : { book: 'GEN', chapter: 1, verse: 10 },
      },
      { is_range : true,
        start    : { book: 'EXO', chapter: 5, verse:  3 },
        end      : { book: 'EXO', chapter: 6, verse:  4 },
      },
    ], 'url:combined')).to.deep.equal('gen1v2-10_exo5v3-6v4');

	});

	it('OSIS', () => {
    expect(formatBibleRefList(v, [
      { book: 'GEN', chapter: 3, verse:  2 },
      { book: 'GEN', chapter: 3, verse:  3 },
      { book: 'GEN', chapter: 3, verse:  4 },
    ], 'osis' )).to.deep.equal('Gen.3.2, Gen.3.3, Gen.3.4');

    expect(formatBibleRefList(v, [
      { book: 'GEN', chapter: 3, verse:  2 },
      { book: 'GEN', chapter: 3, verse:  3 },
      { book: 'GEN', chapter: 3, verse:  4 },
    ], 'osis:combined')).to.deep.equal('Gen.3.2-Gen.3.4');

    expect(formatBibleRefList(v, [
      { is_range : true,
        start    : { book: 'GEN', chapter: 1, verse:  2 },
        end      : { book: 'GEN', chapter: 1, verse: 10 },
      },
      { is_range : true,
        start    : { book: 'EXO', chapter: 5, verse:  3 },
        end      : { book: 'EXO', chapter: 6, verse:  4 },
      },
    ], 'osis')).to.deep.equal('Gen.1.2-Gen.1.10, Exod.5.3-Exod.6.4');
  });

  it('Errors', () => {
    expect(
      () => formatBibleRefList(v, [ { book: 'ABC', chapter: 1, verse:  1 } ])
    ).to.throw();

    expect(
      () => formatBibleRefList(v, [ { book: 'GEN', chapter: 1, verse:  1 } ], 'bad_preset')
    ).to.throw();

    expect(
      () => formatBibleRefList(v, [ { book: 'GEN', chapter: 1, verse:  1 } ], { book_format: 'bad_format' })
    ).to.throw();
  });
});
