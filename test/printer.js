"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const { formatBibleVerse } = require('../src/printer.ts');


describe("printer", () => {
  describe('formatBibleVerse', () => {
    it('Default Options', () => {
      // Standard
      expect(formatBibleVerse({ book: 'GEN', chapter: 3, verse: 8 }))
        .is.deep.equal('Genesis 3:8');
      expect(formatBibleVerse({ book: '1JN', chapter: 10, verse: 2 }))
        .is.deep.equal('1 John 10:2');
      expect(formatBibleVerse({ book: 'SNG', chapter: 3, verse: 4 }))
        .is.deep.equal('Song of Solomon 3:4');
    });

    it('Custom Verse Seperator', () => {
      expect(formatBibleVerse({ book: 'GEN', chapter: 3, verse: 8 },
                              { verse_seperator: 'v' }))
        .is.deep.equal('Genesis 3v8');
      expect(formatBibleVerse({ book: '1JN', chapter: 10, verse: 2 },
                              { verse_seperator: '.' }))
        .is.deep.equal('1 John 10.2');
    });

    it('Strip Whitespace', () => {
      expect(formatBibleVerse({ book: 'GEN', chapter: 3, verse: 8 },
                              { strip_whitespace: true }))
        .is.deep.equal('Genesis3:8');
      expect(formatBibleVerse({ book: '1JN', chapter: 10, verse: 2 },
                              { strip_whitespace: true }))
        .is.deep.equal('1John10:2');
      expect(formatBibleVerse({ book: 'SNG', chapter: 3, verse: 4 },
                              { strip_whitespace: true }))
        .is.deep.equal('SongofSolomon3:4');
    });

    it('Book Ids', () => {
      expect(formatBibleVerse({ book: 'GEN', chapter: 3, verse: 8 },
                              { use_book_id: true }))
        .is.deep.equal('GEN 3:8');
      expect(formatBibleVerse({ book: '1JH', chapter: 10, verse: 2 },
                              { use_book_id: true }))
        .is.deep.equal('1JH 10:2');
      expect(formatBibleVerse({ book: 'SNG', chapter: 3, verse: 4 },
                              { use_book_id: true }))
        .is.deep.equal('SNG 3:4');
    });

    it('Mixed Options', () => {
      expect(formatBibleVerse({ book: 'GEN', chapter: 3, verse: 8 },
                              { strip_whitespace: true, verse_seperator: '.' }))
        .is.deep.equal('Genesis3.8');
      expect(formatBibleVerse({ book: '1JH', chapter: 10, verse: 2 },
                              { verse_seperator: ' v ', use_book_id: true }))
        .is.deep.equal('1JH 10 v 2');
      expect(formatBibleVerse({ book: 'SNG', chapter: 3, verse: 4 },
                              { use_book_id: true, strip_whitespace: true }))
        .is.deep.equal('SNG3:4');
    });


    it('Exception Tests', () => {
      expect(() => formatBibleVerse({ book: 'BAD', chapter: 1, verse: 1 })).to.throw();
    });
  });
});
