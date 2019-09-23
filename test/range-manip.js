"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const { iterateBookRanges, iterateChapterRanges } = require('../src/range-manip.ts');
const v = require('../src/Versification.ts').default;

describe('range-manip', () => {
  let input = [ { is_range: true,
                  start: { book: 'GEN', chapter: 1, verse: 8 },
                  end  : { book: 'GEN', chapter: 4, verse: 9 },
                }
              ];

  it('iterateBookRanges', () => {
    // single verse is no-op
    expect(Array.from(iterateBookRanges(v, [
      { book: 'GEN', chapter: 4, verse: 9 },
    ]))).is.deep.equal([
      { book: 'GEN', chapter: 4, verse: 9 },
    ]);

    // single verse is expanded to range of 1, if flag is set
    expect(Array.from(iterateBookRanges(v, [
      { book: 'GEN', chapter: 4, verse: 9 },
    ], true))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 4, verse: 9 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ]);

    // in book range is not split
    expect(Array.from(iterateBookRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse: 8 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ]))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse: 8 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ]);

    // cross book range is split
    expect(Array.from(iterateBookRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'EXO', chapter:  2, verse:  6 },
      }
    ]))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'GEN', chapter: 50, verse: 26 },
      },
      { is_range: true,
        start: { book: 'EXO', chapter:  1, verse:  1 },
        end  : { book: 'EXO', chapter:  2, verse:  6 },
      },
    ]);

    // long cross book range is split
    expect(Array.from(iterateBookRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'LEV', chapter: 17, verse:  9 },
      }
    ]))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'GEN', chapter: 50, verse: 26 },
      },
      { is_range: true,
        start: { book: 'EXO', chapter:  1, verse:  1 },
        end  : { book: 'EXO', chapter: 40, verse: 38 },
      },
      { is_range: true,
        start: { book: 'LEV', chapter:  1, verse:  1 },
        end  : { book: 'LEV', chapter: 17, verse:  9 },
      },
    ]);


    // multi input is iterated fully
    expect(Array.from(iterateBookRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'LEV', chapter: 17, verse:  9 },
      },
      { book: 'JOS', chapter: 12, verse: 11 },
      { is_range: true,
        start: { book: 'RUT', chapter:  2, verse:  3 },
        end  : { book: 'RUT', chapter:  3, verse:  5 },
      },
    ]))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'GEN', chapter: 50, verse: 26 },
      },
      { is_range: true,
        start: { book: 'EXO', chapter:  1, verse:  1 },
        end  : { book: 'EXO', chapter: 40, verse: 38 },
      },
      { is_range: true,
        start: { book: 'LEV', chapter:  1, verse:  1 },
        end  : { book: 'LEV', chapter: 17, verse:  9 },
      },
      { book: 'JOS', chapter: 12, verse: 11 },
      { is_range: true,
        start: { book: 'RUT', chapter:  2, verse:  3 },
        end  : { book: 'RUT', chapter:  3, verse:  5 },
      },
    ]);
  }); // end of iterateBookRanges


    it('iterateChapterkRanges', () => {
    // single verse is no-op
    expect(Array.from(iterateChapterRanges(v, [
      { book: 'GEN', chapter: 4, verse: 9 },
    ]))).is.deep.equal([
      { book: 'GEN', chapter: 4, verse: 9 },
    ]);

    // single verse is expanded to range of 1, if flag is set
    expect(Array.from(iterateChapterRanges(v, [
      { book: 'GEN', chapter: 4, verse: 9 },
    ], true))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 4, verse: 9 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ]);

    // in-chapter range is not split
    expect(Array.from(iterateChapterRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse:  8 },
        end  : { book: 'GEN', chapter: 1, verse: 13 },
      }
    ]))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse:  8 },
        end  : { book: 'GEN', chapter: 1, verse: 13 },
      }
    ]);

    // cross chapter range is split
    expect(Array.from(iterateChapterRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse: 8 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ]))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse:  8 },
        end  : { book: 'GEN', chapter: 1, verse: 31 },
      },
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  1 },
        end  : { book: 'GEN', chapter: 2, verse: 25 },
      },
      { is_range: true,
        start: { book: 'GEN', chapter: 3, verse:  1 },
        end  : { book: 'GEN', chapter: 3, verse: 24 },
      },
      { is_range: true,
        start: { book: 'GEN', chapter: 4, verse:  1 },
        end  : { book: 'GEN', chapter: 4, verse:  9 },
      }
    ]);

    // cross book range is split into chapters
    expect(Array.from(iterateChapterRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'EXO', chapter:  2, verse:  6 },
      }
    ]))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'GEN', chapter: 49, verse: 33 },
      },
      { is_range: true,
        start: { book: 'GEN', chapter: 50, verse:  1 },
        end  : { book: 'GEN', chapter: 50, verse: 26 },
      },
      { is_range: true,
        start: { book: 'EXO', chapter: 1, verse:  1 },
        end  : { book: 'EXO', chapter: 1, verse: 22 },
      },
      { is_range: true,
        start: { book: 'EXO', chapter: 2, verse:  1 },
        end  : { book: 'EXO', chapter: 2, verse:  6 },
      }
    ]);

    // multi input is iterated fully
    expect(Array.from(iterateChapterRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'EXO', chapter:  2, verse:  6 },
      },
      { book: 'JOS', chapter: 12, verse: 11 },
      { is_range: true,
        start: { book: 'RUT', chapter:  2, verse:  3 },
        end  : { book: 'RUT', chapter:  3, verse:  5 },
      },
    ]))).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'GEN', chapter: 49, verse: 33 },
      },
      { is_range: true,
        start: { book: 'GEN', chapter: 50, verse:  1 },
        end  : { book: 'GEN', chapter: 50, verse: 26 },
      },
      { is_range: true,
        start: { book: 'EXO', chapter: 1, verse:  1 },
        end  : { book: 'EXO', chapter: 1, verse: 22 },
      },
      { is_range: true,
        start: { book: 'EXO', chapter: 2, verse:  1 },
        end  : { book: 'EXO', chapter: 2, verse:  6 },
      },
      { book: 'JOS', chapter: 12, verse: 11 },
      { is_range: true,
        start: { book: 'RUT', chapter:  2, verse:  3 },
        end  : { book: 'RUT', chapter:  2, verse: 23 },
      },
      { is_range: true,
        start: { book: 'RUT', chapter:  3, verse:  1 },
        end  : { book: 'RUT', chapter:  3, verse:  5 },
      },
    ]);
  }); // end ofs iterateChapterRanges
});
