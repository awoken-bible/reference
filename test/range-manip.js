"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const { iterateBookRanges,
        iterateChapterRanges,
        iterateVerses,
        combineRanges } = require('../src/range-manip.ts');
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


  it('iterateVerses', () => {
    // single verse is no-op
    expect(Array.from(iterateVerses(v, [
      { book: 'GEN', chapter: 2, verse: 8 },
    ]))).is.deep.equal([
      { book: 'GEN', chapter: 2, verse: 8 },
    ]);

    // intra-chapter range
    expect(Array.from(iterateVerses(v, [{
      is_range: true,
      start : { book: 'GEN', chapter: 2, verse:  8 },
      end   : { book: 'GEN', chapter: 2, verse: 12 },
    }]))).is.deep.equal([
      { book: 'GEN', chapter: 2, verse:  8 },
      { book: 'GEN', chapter: 2, verse:  9 },
      { book: 'GEN', chapter: 2, verse: 10 },
      { book: 'GEN', chapter: 2, verse: 11 },
      { book: 'GEN', chapter: 2, verse: 12 },
    ]);

    // cross chapter range
    expect(Array.from(iterateVerses(v, [{
      is_range: true,
      start : { book: 'PRO', chapter: 18, verse: 21 },
      end   : { book: 'PRO', chapter: 19, verse:  3 },
    }]))).is.deep.equal([
      { book: 'PRO', chapter: 18, verse: 21 },
      { book: 'PRO', chapter: 18, verse: 22 },
      { book: 'PRO', chapter: 18, verse: 23 },
      { book: 'PRO', chapter: 18, verse: 24 },
      { book: 'PRO', chapter: 19, verse:  1 },
      { book: 'PRO', chapter: 19, verse:  2 },
      { book: 'PRO', chapter: 19, verse:  3 },
    ]);

    // cross book range
    expect(Array.from(iterateVerses(v, [{
      is_range: true,
      start : { book: 'EST', chapter: 10, verse:  2 },
      end   : { book: 'JOB', chapter:  1, verse:  5 },
    }]))).is.deep.equal([
      { book: 'EST', chapter: 10, verse:  2 },
      { book: 'EST', chapter: 10, verse:  3 },
      { book: 'JOB', chapter:  1, verse:  1 },
      { book: 'JOB', chapter:  1, verse:  2 },
      { book: 'JOB', chapter:  1, verse:  3 },
      { book: 'JOB', chapter:  1, verse:  4 },
      { book: 'JOB', chapter:  1, verse:  5 },
    ]);

    // multi-input set iterated fully
    expect(Array.from(iterateVerses(v, [{
      is_range: true,
      start : { book: 'PRO', chapter: 18, verse: 21 },
      end   : { book: 'PRO', chapter: 19, verse:  3 },
    }, {
      is_range: true,
      start : { book: 'GEN', chapter: 2, verse:  8 },
      end   : { book: 'GEN', chapter: 2, verse: 12 },
    }, {
      is_range: true,
      start : { book: 'EST', chapter: 10, verse:  2 },
      end   : { book: 'JOB', chapter:  1, verse:  5 },
    }]))).is.deep.equal([
      { book: 'PRO', chapter: 18, verse: 21 },
      { book: 'PRO', chapter: 18, verse: 22 },
      { book: 'PRO', chapter: 18, verse: 23 },
      { book: 'PRO', chapter: 18, verse: 24 },
      { book: 'PRO', chapter: 19, verse:  1 },
      { book: 'PRO', chapter: 19, verse:  2 },
      { book: 'PRO', chapter: 19, verse:  3 },
      { book: 'GEN', chapter:  2, verse:  8 },
      { book: 'GEN', chapter:  2, verse:  9 },
      { book: 'GEN', chapter:  2, verse: 10 },
      { book: 'GEN', chapter:  2, verse: 11 },
      { book: 'GEN', chapter:  2, verse: 12 },
      { book: 'EST', chapter: 10, verse:  2 },
      { book: 'EST', chapter: 10, verse:  3 },
      { book: 'JOB', chapter:  1, verse:  1 },
      { book: 'JOB', chapter:  1, verse:  2 },
      { book: 'JOB', chapter:  1, verse:  3 },
      { book: 'JOB', chapter:  1, verse:  4 },
      { book: 'JOB', chapter:  1, verse:  5 },
    ]);
  });

  it('combineRanges', () => {
    // empty input is no-up
    expect(combineRanges(v, [])).is.deep.equal([]);

    // non-overlapping ranges is no-op
    expect(combineRanges(v, [
      { book: 'GEN', chapter: 2, verse: 3 },
      { book: 'GEN', chapter: 2, verse: 5 },
    ])).to.deep.equal([
      { book: 'GEN', chapter: 2, verse: 3 },
      { book: 'GEN', chapter: 2, verse: 5 },
    ]);

    // adjacent verses are merged
    expect(combineRanges(v, [
      { book: 'GEN', chapter: 2, verse: 3 },
      { book: 'GEN', chapter: 2, verse: 4 },
    ])).to.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse: 3 },
        end  : { book: 'GEN', chapter: 2, verse: 4 },
      }
    ]);

    // many adjacent verses are merged
    expect(combineRanges(v, [
      { book: 'GEN', chapter: 2, verse: 3 },
      { book: 'GEN', chapter: 2, verse: 4 },
      { book: 'GEN', chapter: 2, verse: 5 },
      { book: 'GEN', chapter: 2, verse: 7 },
      { book: 'GEN', chapter: 2, verse: 8 },
      { book: 'GEN', chapter: 2, verse: 9 },
    ])).to.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse: 3 },
        end  : { book: 'GEN', chapter: 2, verse: 5 },
      },
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse: 7 },
        end  : { book: 'GEN', chapter: 2, verse: 9 },
      }
    ]);

    // overlapping ranges are merged
    expect(combineRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  3 },
        end  : { book: 'GEN', chapter: 2, verse:  7 },
      },
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  5 },
        end  : { book: 'GEN', chapter: 2, verse: 10 },
      },
    ])).to.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  3 },
        end  : { book: 'GEN', chapter: 2, verse: 10 },
      },
    ]);


    expect(combineRanges(v, [
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  3 },
        end  : { book: 'GEN', chapter: 2, verse:  5 },
      },
      { book: 'GEN', chapter: 2, verse:  6 },
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  7 },
        end  : { book: 'GEN', chapter: 2, verse: 12 },
      },
    ])).to.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  3 },
        end  : { book: 'GEN', chapter: 2, verse: 12 },
      },
    ]);


    expect(combineRanges(v, [
      { book: 'GEN', chapter: 2, verse:  6 },
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  3 },
        end  : { book: 'GEN', chapter: 2, verse:  5 },
      },
      { book: 'EXO', chapter: 1, verse:  1 },
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse:  7 },
        end  : { book: 'GEN', chapter: 2, verse: 12 },
      },
      { book: 'EXO', chapter: 2, verse:  9 },
      { book: 'EXO', chapter: 2, verse:  7 },
      { is_range: true,
        start: { book: 'GEN', chapter: 50, verse:  10 },
        end:   { book: 'EXO', chapter:  2, verse:   6 },
      },
      { book: 'GEN', chapter:  9, verse: 10 },
      { book: 'GEN', chapter: 50, verse:  9 },
    ])).to.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter:  2, verse:  3 },
        end  : { book: 'GEN', chapter:  2, verse: 12 },
      },
      { book: 'GEN', chapter: 9, verse: 10 },
      { is_range: true,
        start: { book: 'GEN', chapter: 50, verse:  9 },
        end  : { book: 'EXO', chapter:  2, verse:  7 },
      },
      { book: 'EXO', chapter: 2, verse:  9 },
    ]);


  });
});
