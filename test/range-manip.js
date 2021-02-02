"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const Rm = require('../src/index.ts').default;

const v = require('../src/Versification.ts').default;

describe('range-manip', () => {
  it('splitByBook', () => {
    // single verse is no-op
    expect(Rm.splitByBook([
      { book: 'GEN', chapter: 4, verse: 9 },
    ])).is.deep.equal([
      { book: 'GEN', chapter: 4, verse: 9 },
    ]);

    // can pass in single element without array wrapper
    expect(Rm.splitByBook(
      { book: 'GEN', chapter: 4, verse: 9 },
    )).is.deep.equal([
      { book: 'GEN', chapter: 4, verse: 9 },
    ]);

    // single verse is expanded to range of 1, if flag is set
    expect(Rm.splitByBook([
      { book: 'GEN', chapter: 4, verse: 9 },
    ], true)).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 4, verse: 9 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ]);

    // in book range is not split
    expect(Rm.splitByBook([
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse: 8 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ])).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse: 8 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ]);

    // cross book range is split
    expect(Rm.splitByBook([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'EXO', chapter:  2, verse:  6 },
      }
    ])).is.deep.equal([
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
    expect(Rm.splitByBook([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'LEV', chapter: 17, verse:  9 },
      }
    ])).is.deep.equal([
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
    expect(Rm.splitByBook([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'LEV', chapter: 17, verse:  9 },
      },
      { book: 'JOS', chapter: 12, verse: 11 },
      { is_range: true,
        start: { book: 'RUT', chapter:  2, verse:  3 },
        end  : { book: 'RUT', chapter:  3, verse:  5 },
      },
    ])).is.deep.equal([
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
  }); // end of splitByBook


  it('splitByChapter', () => {
    // single verse is no-op
    expect(Rm.splitByChapter([
      { book: 'GEN', chapter: 4, verse: 9 },
    ])).is.deep.equal([
      { book: 'GEN', chapter: 4, verse: 9 },
    ]);

    // can pass in single element without array wrapper
    expect(Rm.splitByChapter(
      { book: 'GEN', chapter: 4, verse: 9 },
    )).is.deep.equal([
      { book: 'GEN', chapter: 4, verse: 9 },
    ]);

    // single verse is expanded to range of 1, if flag is set
    expect(Rm.splitByChapter([
      { book: 'GEN', chapter: 4, verse: 9 },
    ], true)).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 4, verse: 9 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ]);

    // in-chapter range is not split
    expect(Rm.splitByChapter([
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse:  8 },
        end  : { book: 'GEN', chapter: 1, verse: 13 },
      }
    ])).is.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse:  8 },
        end  : { book: 'GEN', chapter: 1, verse: 13 },
      }
    ]);

    // cross chapter range is split
    expect(Rm.splitByChapter([
      { is_range: true,
        start: { book: 'GEN', chapter: 1, verse: 8 },
        end  : { book: 'GEN', chapter: 4, verse: 9 },
      }
    ])).is.deep.equal([
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
    expect(Rm.splitByChapter([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'EXO', chapter:  2, verse:  6 },
      }
    ])).is.deep.equal([
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
    expect(Rm.splitByChapter([
      { is_range: true,
        start: { book: 'GEN', chapter: 49, verse: 10 },
        end  : { book: 'EXO', chapter:  2, verse:  6 },
      },
      { book: 'JOS', chapter: 12, verse: 11 },
      { is_range: true,
        start: { book: 'RUT', chapter:  2, verse:  3 },
        end  : { book: 'RUT', chapter:  3, verse:  5 },
      },
    ])).is.deep.equal([
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
    }); // end of splitByChapter


  it('splitByVerse', () => {
    // single verse is no-op
    expect(Rm.splitByVerse([
      { book: 'GEN', chapter: 2, verse: 8 },
    ])).is.deep.equal([
      { book: 'GEN', chapter: 2, verse: 8 },
    ]);

    // can pass in single element without array wrapper
    expect(Rm.splitByVerse(
      { book: 'GEN', chapter: 4, verse: 9 },
    )).is.deep.equal([
      { book: 'GEN', chapter: 4, verse: 9 },
    ]);

    // intra-chapter range
    expect(Rm.splitByVerse([{
      is_range: true,
      start : { book: 'GEN', chapter: 2, verse:  8 },
      end   : { book: 'GEN', chapter: 2, verse: 12 },
    }])).is.deep.equal([
      { book: 'GEN', chapter: 2, verse:  8 },
      { book: 'GEN', chapter: 2, verse:  9 },
      { book: 'GEN', chapter: 2, verse: 10 },
      { book: 'GEN', chapter: 2, verse: 11 },
      { book: 'GEN', chapter: 2, verse: 12 },
    ]);

    // cross chapter range
    expect(Rm.splitByVerse([{
      is_range: true,
      start : { book: 'PRO', chapter: 18, verse: 21 },
      end   : { book: 'PRO', chapter: 19, verse:  3 },
    }])).is.deep.equal([
      { book: 'PRO', chapter: 18, verse: 21 },
      { book: 'PRO', chapter: 18, verse: 22 },
      { book: 'PRO', chapter: 18, verse: 23 },
      { book: 'PRO', chapter: 18, verse: 24 },
      { book: 'PRO', chapter: 19, verse:  1 },
      { book: 'PRO', chapter: 19, verse:  2 },
      { book: 'PRO', chapter: 19, verse:  3 },
    ]);

    // cross book range
    expect(Rm.splitByVerse([{
      is_range: true,
      start : { book: 'EST', chapter: 10, verse:  2 },
      end   : { book: 'JOB', chapter:  1, verse:  5 },
    }])).is.deep.equal([
      { book: 'EST', chapter: 10, verse:  2 },
      { book: 'EST', chapter: 10, verse:  3 },
      { book: 'JOB', chapter:  1, verse:  1 },
      { book: 'JOB', chapter:  1, verse:  2 },
      { book: 'JOB', chapter:  1, verse:  3 },
      { book: 'JOB', chapter:  1, verse:  4 },
      { book: 'JOB', chapter:  1, verse:  5 },
    ]);

    // multi-input set iterated fully
    expect(Rm.splitByVerse([{
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
    }])).is.deep.equal([
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
  }); // end of splitByVerse


	it('groupByBook', () => {
		expect(
			Rm.groupByBook({ book: 'GEN', chapter: 1, verse: 1 })
		).is.deep.equal([
			{ book: 'GEN',
				references: [
					{ book: 'GEN', chapter: 1, verse: 1 }
				],
			}
		]);

		expect(
			Rm.groupByBook([
				{ book: 'GEN', chapter: 10, verse: 5 },
				{ book: 'EXO', chapter:  5, verse: 2 },
				{ book: 'GEN', chapter:  1, verse: 1 },
				{ book: 'EXO', chapter:  3, verse: 2 },
				{ book: 'GEN', chapter:  3, verse: 3 },
			])
		).is.deep.equal([
			{ book: 'GEN',
				references: [
					{ book: 'GEN', chapter: 10, verse: 5 },
					{ book: 'GEN', chapter:  1, verse: 1 },
					{ book: 'GEN', chapter:  3, verse: 3 }
				],
			},
			{ book: 'EXO',
				references: [
					{ book: 'EXO', chapter:  5, verse: 2 },
					{ book: 'EXO', chapter:  3, verse: 2 },
				],
			},
		]);

		expect(
			Rm.groupByBook([
				{ is_range: true,
					start: { book: 'GEN', chapter: 11, verse: 1 },
					end  : { book: 'GEN', chapter: 11, verse: 3 },
				},
				{ is_range: true,
					start : { book: 'GEN', chapter: 50, verse: 10 },
					end   : { book: 'EXO', chapter:  1, verse:  5 },
				},
				{ book: 'EXO', chapter: 3, verse: 14 },
			])
		).is.deep.equal([
			{ book: 'GEN',
				references: [
					{ is_range: true,
						start: { book: 'GEN', chapter: 11, verse: 1 },
						end  : { book: 'GEN', chapter: 11, verse: 3 },
					},
					{ is_range: true,
						start: { book: 'GEN', chapter: 50, verse: 10 },
						end  : { book: 'GEN', chapter: 50, verse: 26 },
					},
				],
			},
			{ book: 'EXO',
				references: [
					{ is_range: true,
						start: { book: 'EXO', chapter:  1, verse: 1 },
						end  : { book: 'EXO', chapter:  1, verse: 5 },
					},
					{ book: 'EXO', chapter:  3, verse: 14 },
				],
			},
		]);
	}); // end of groupByBook

		it('groupByChapter', () => {
		expect(
			Rm.groupByChapter({ book: 'GEN', chapter: 1, verse: 1 })
		).is.deep.equal([
			{ book: 'GEN', chapter: 1,
				references: [ { book: 'GEN', chapter: 1, verse: 1 } ],
			}
		]);

		expect(
			Rm.groupByChapter([
				{ book: 'GEN', chapter: 10, verse: 5 },
				{ book: 'EXO', chapter:  5, verse: 2 },
				{ book: 'GEN', chapter: 10, verse: 4 },
				{ book: 'EXO', chapter:  5, verse: 6 },
				{ is_range: true,
					start: { book: 'GEN', chapter:  9, verse: 10 },
					end  : { book: 'GEN', chapter: 10, verse: 3  },
				}
			])
		).is.deep.equal([
			{ book: 'GEN', chapter: 9,
				references: [
					{ is_range: true,
						start : { book: 'GEN', chapter: 9, verse: 10 },
						end   : { book: 'GEN', chapter: 9, verse: 29 },
					}
				],
			},
			{ book: 'GEN', chapter: 10,
				references: [
					{ book: 'GEN', chapter: 10, verse: 5 },
					{ book: 'GEN', chapter: 10, verse: 4 },
					{ is_range: true,
						start : { book: 'GEN', chapter: 10, verse: 1 },
						end   : { book: 'GEN', chapter: 10, verse: 3 },
					}
				],
			},
			{ book: 'EXO', chapter: 5,
				references: [
					{ book: 'EXO', chapter:  5, verse: 2 },
					{ book: 'EXO', chapter:  5, verse: 6 },
				],
			},
		]);

		expect(
			Rm.groupByChapter([
				{ is_range: true,
					start: { book: 'GEN', chapter: 11, verse: 1 },
					end  : { book: 'GEN', chapter: 11, verse: 3 },
				},
				{ is_range: true,
					start : { book: 'GEN', chapter: 50, verse: 10 },
					end   : { book: 'EXO', chapter:  1, verse:  5 },
				},
				{ book: 'EXO', chapter: 1, verse: 14 },
			])
		).is.deep.equal([
			{ book: 'GEN', chapter: 11,
				references: [
					{ is_range: true,
						start: { book: 'GEN', chapter: 11, verse: 1 },
						end  : { book: 'GEN', chapter: 11, verse: 3 },
					},
				]
			},
			{ book: 'GEN', chapter: 50,
				references: [
					{ is_range: true,
						start: { book: 'GEN', chapter: 50, verse: 10 },
						end  : { book: 'GEN', chapter: 50, verse: 26 },
					},
				],
			},
			{ book: 'EXO', chapter: 1,
				references: [
					{ is_range: true,
						start: { book: 'EXO', chapter:  1, verse: 1 },
						end  : { book: 'EXO', chapter:  1, verse: 5 },
					},
					{ book: 'EXO', chapter:  1, verse: 14 },
				],
			},
		]);
	}); // end of groupByBook

  it('combineRanges', () => {
    // empty input is no-up
    expect(Rm.combineRanges([])).is.deep.equal([]);

    // non-overlapping ranges is no-op
    expect(Rm.combineRanges([
      { book: 'GEN', chapter: 2, verse: 3 },
      { book: 'GEN', chapter: 2, verse: 5 },
    ])).to.deep.equal([
      { book: 'GEN', chapter: 2, verse: 3 },
      { book: 'GEN', chapter: 2, verse: 5 },
    ]);

    // adjacent verses are merged
    expect(Rm.combineRanges([
      { book: 'GEN', chapter: 2, verse: 3 },
      { book: 'GEN', chapter: 2, verse: 4 },
    ])).to.deep.equal([
      { is_range: true,
        start: { book: 'GEN', chapter: 2, verse: 3 },
        end  : { book: 'GEN', chapter: 2, verse: 4 },
      }
    ]);

    // many adjacent verses are merged
    expect(Rm.combineRanges([
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
    expect(Rm.combineRanges([
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


    expect(Rm.combineRanges([
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


    expect(Rm.combineRanges([
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

  it('nextChapter', () => {
    expect(Rm.nextChapter({
      book: 'GEN', chapter: 1, verse: 1
    })).to.deep.equal({
      is_range: true,
      start: { book: 'GEN', chapter:  2, verse:  1 },
      end:   { book: 'GEN', chapter:  2, verse: 25 },
    });

    expect(Rm.nextChapter({
      is_range: true,
      start: { book: 'REV', chapter: 20, verse: 10 },
      end:   { book: 'REV', chapter: 21, verse:  6 },
    })).to.deep.equal({
      is_range: true,
      start: { book: 'REV', chapter: 22, verse:  1 },
      end:   { book: 'REV', chapter: 22, verse: 21 },
    });

    expect(Rm.nextChapter({
      is_range: true,
      start: { book: 'REV', chapter: 22, verse:  7 },
      end:   { book: 'REV', chapter: 22, verse:  9 },
    })).to.deep.equal(null);

    expect(Rm.nextChapter({
      is_range: true,
      start: { book: '2TH', chapter:  2, verse:  6 },
      end:   { book: 'TIT', chapter:  3, verse: 15 },
    })).to.deep.equal({
      is_range: true,
      start: { book: 'PHM', chapter:  1, verse:  1 },
      end:   { book: 'PHM', chapter:  1, verse: 25 },
    });
    expect(Rm.nextChapter({
      is_range: true,
      start: { book: '2TH', chapter:  2, verse:  6 },
      end:   { book: 'TIT', chapter:  3, verse: 15 },
    }, true)).to.deep.equal(null);

    expect(() => Rm.nextChapter({ book: 'XYZ', chapter: 1, verse: 1 })).to.throw();
  });

  it('previousChapter', () => {
    expect(      Rm.previousChapter({ book: 'GEN', chapter: 1, verse: 1 })).to.deep.equal(null);

    expect(      Rm.previousChapter({
      book: 'EXO', chapter: 1, verse: 1
    })).to.deep.equal({
      is_range : true,
      start    : { book: 'GEN', chapter: 50, verse:  1 },
      end      : { book: 'GEN', chapter: 50, verse: 26 },
    });
    expect(      Rm.previousChapter({
      book: 'EXO', chapter: 1, verse: 1
    }, true)).to.deep.equal(null);

    expect(      Rm.previousChapter({
      is_range : true,
      start    : { book: 'RUT', chapter:  3, verse:  8 },
      end      : { book: '1SA', chapter: 17, verse: 24 },
    })).to.deep.equal({
      is_range : true,
      start    : { book: 'RUT', chapter: 2, verse:  1 },
      end      : { book: 'RUT', chapter: 2, verse: 23 },
    });

    expect(      Rm.previousChapter({ book: 'GEN', chapter: 1, verse: 1 })).to.deep.equal(null);
    expect(() => Rm.previousChapter({ book: 'XYZ', chapter: 1, verse: 1 })).to.throw();
  });

  it('nextBook', () => {
    expect(Rm.nextBook({
      book: 'GEN', chapter: 1, verse: 1
    })).to.deep.equal({
      is_range: true,
      start: { book: 'EXO', chapter:  1, verse:  1 },
      end:   { book: 'EXO', chapter: 40, verse: 38 },
    });

    expect(Rm.nextBook({
      book: 'JOS', chapter: 24, verse: 33
    })).to.deep.equal({
      is_range: true,
      start: { book: 'JDG', chapter:  1, verse:  1 },
      end:   { book: 'JDG', chapter: 21, verse: 25 },
    });

    expect(Rm.nextBook({
      is_range: true,
      start: { book: 'REV', chapter: 12, verse: 3},
      end  : { book: 'REV', chapter: 12, verse: 8},
    })).to.deep.equal(null);

    expect(() => Rm.nextBook({ book: 'XYZ', chapter: 1, verse: 1 })).to.throw();
  });

  it('previousBook', () => {
    expect(Rm.previousBook({
      book: 'MIC', chapter: 1, verse: 1
    })).to.deep.equal({
      is_range: true,
      start: { book: 'JON', chapter:  1, verse:  1 },
      end:   { book: 'JON', chapter:  4, verse: 11 },
    });

    expect(Rm.previousBook({
      is_range: true,
      start: { book: 'MAT', chapter:  2, verse: 10 },
      end:   { book: 'MAT', chapter:  9, verse:  4 },
    })).to.deep.equal({
      is_range: true,
      start: { book: 'MAL', chapter:  1, verse:  1 },
      end:   { book: 'MAL', chapter:  4, verse:  6 },
    });

    expect(Rm.previousBook({
      is_range: true,
      start: { book: 'ACT', chapter:  7, verse:  8 },
      end:   { book: 'ROM', chapter:  3, verse:  5 },
    })).to.deep.equal({
      is_range: true,
      start: { book: 'JHN', chapter:  1, verse:  1 },
      end:   { book: 'JHN', chapter: 21, verse: 25 },
    });

    expect(Rm.previousBook({
      book: 'GEN', chapter: 50, verse: 26,
    })).to.deep.equal(null);
    expect(() => Rm.previousBook({ book: 'XYZ', chapter: 1, verse: 1 })).to.throw();
  });

  it('isFullBook', () => {
    expect(Rm.isFullBook({ book: 'GEN', chapter: 5, verse: 10 })).to.deep.equal(false);
    expect(Rm.isFullBook({
      is_range : true,
      start    : { book: 'GEN', chapter:  1, verse:   1 },
      end      : { book: 'GEN', chapter: 50, verse:  26 },
    })).to.deep.equal(true);
    expect(Rm.isFullBook({
      is_range : true,
      start    : { book: 'GEN', chapter:  1, verse:   2 },
      end      : { book: 'GEN', chapter: 50, verse:  26 },
    })).to.deep.equal(false);
    expect(Rm.isFullBook({
      is_range : true,
      start    : { book: 'GEN', chapter:  1, verse:   1 },
      end      : { book: 'GEN', chapter: 50, verse:  25 },
    })).to.deep.equal(false);
    expect(Rm.isFullBook({
      is_range : true,
      start    : { book: 'GEN', chapter:  2, verse:   1 },
      end      : { book: 'GEN', chapter: 50, verse:  25 },
    })).to.deep.equal(false);
    expect(Rm.isFullBook({
      is_range : true,
      start    : { book: 'GEN', chapter:  2, verse:   1 },
      end      : { book: 'GEN', chapter: 49, verse:  26 },
    })).to.deep.equal(false);
    expect(Rm.isFullBook({
      is_range : true,
      start    : { book: 'GEN', chapter:  1, verse:   1 },
      end      : { book: 'EXO', chapter:  1, verse:   1 },
    })).to.deep.equal(false);
    expect(Rm.isFullBook({
      is_range : true,
      start    : { book: 'EZR', chapter:  1, verse:   1 },
      end      : { book: 'EZR', chapter: 10, verse:  44 },
    })).to.deep.equal(true);
  });

  it('isFullChapter', () => {
    expect(Rm.isFullBook({ book: 'GEN', chapter: 5, verse: 10 })).to.deep.equal(false);
    expect(Rm.isFullChapter({
      is_range : true,
      start    : { book: 'GEN', chapter: 5, verse:  1 },
      end      : { book: 'GEN', chapter: 5, verse: 32 },
    })).to.deep.equal(true);
    expect(Rm.isFullChapter({
      is_range : true,
      start    : { book: 'GEN', chapter: 5, verse:  1 },
      end      : { book: 'GEN', chapter: 5, verse: 31 },
    })).to.deep.equal(false);
    expect(Rm.isFullChapter({
      is_range : true,
      start    : { book: 'GEN', chapter: 5, verse:  2 },
      end      : { book: 'GEN', chapter: 5, verse: 32 },
    })).to.deep.equal(false);
    expect(Rm.isFullChapter({
      is_range : true,
      start    : { book: 'GEN', chapter: 4, verse: 26 },
      end      : { book: 'GEN', chapter: 5, verse: 32 },
    })).to.deep.equal(false);
    expect(Rm.isFullChapter({
      is_range : true,
      start    : { book: 'GEN', chapter: 5, verse:  1 },
      end      : { book: 'GEN', chapter: 6, verse:  1 },
    })).to.deep.equal(false);
    expect(Rm.isFullChapter({
      is_range : true,
      start    : { book: 'MIC', chapter: 6, verse:  1 },
      end      : { book: 'MIC', chapter: 6, verse: 16 },
    })).to.deep.equal(true);


  });
});
