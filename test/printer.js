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

    it('Custom Verse Seperator', () => {
      expect(formatBibleVerse(v,
                              { book: 'GEN', chapter: 3, verse: 8 },
                              { verse_seperator: 'v' }))
        .is.deep.equal('Genesis 3v8');
      expect(formatBibleVerse(v,
                              { book: '1JN', chapter: 10, verse: 2 },
                              { verse_seperator: '.' }))
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
                              { use_book_id: true }))
        .is.deep.equal('GEN 3:8');
      expect(formatBibleVerse(v,
                              { book: '1JH', chapter: 10, verse: 2 },
                              { use_book_id: true }))
        .is.deep.equal('1JH 10:2');
      expect(formatBibleVerse(v,
                              { book: 'SNG', chapter: 3, verse: 4 },
                              { use_book_id: true }))
        .is.deep.equal('SNG 3:4');
    });

    it('Mixed Options', () => {
      expect(formatBibleVerse(v,
                              { book: 'GEN', chapter: 3, verse: 8 },
                              { strip_whitespace: true, verse_seperator: '.' }))
        .is.deep.equal('Genesis3.8');
      expect(formatBibleVerse(v,
                              { book: '1JH', chapter: 10, verse: 2 },
                              { verse_seperator: ' v ', use_book_id: true }))
        .is.deep.equal('1JH 10 v 2');
      expect(formatBibleVerse(v,
                              { book: 'SNG', chapter: 3, verse: 4 },
                              { use_book_id: true, strip_whitespace: true }))
        .is.deep.equal('SNG3:4');
    });

    it('Exception Tests', () => {
      expect(() => formatBibleVerse(v,{ book: 'BAD', chapter: 1, verse: 1 })).to.throw();
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
      let opts = { strip_whitespace: true, use_book_id: true };
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
      expect(formatBibleVerse(v, [])).is.deep.equal('');
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
      expect(formatBibleRefList(v, reflist, { strip_whitespace: true, use_book_id: true }))
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
});
