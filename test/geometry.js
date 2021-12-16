"use strict";

const chai      = require('chai');
const expect    = chai.expect;

const AwokenRef = require('../src/index.ts').default;

const v         = require('../src/Versification.ts').default;
const Parsers   = require('../src/parser.ts').default;

function p(str){
  let out = Parsers.BibleRef.parse(str);
  if(out.value === undefined){
    console.log("-----");
    console.log(str);
    console.dir(out);
  }
  return out.value;
}

describe("Geometry", () => {

	//expect(AwokenRef.intersects(
	//	{ segments: [ { min:  5, max: 10 } ] },
	//	{ segments: [ { min:  0, max:  2 },
	//								{ min:  3, max:  4 },
	//								{ min:  5, max:  7 },
	//								{ min:  6, max:  8 },
	//								{ min: 11, max: 15 },
	//							]
	//	},
	//)).to.deep.equal(true);

	//expect(AwokenRef.intersects(
	//	{ segments: [ { min:  5, max: 10 } ] },
	//	{ segments: [ { min:  0, max:  2 },
	//								{ min:  3, max:  4 },
	//								{ min: 11, max: 15 },
	//							]
	//	},
	//)).to.deep.equal(false);

  it('getIntersection', () => {
    expect(AwokenRef.getIntersection(p('Genesis 1:5-10'), p('Genesis 1:7-12'))).to.deep.equal([
      { is_range: true,
        start : { book: 'GEN', chapter: 1, verse:  7 },
        end   : { book: 'GEN', chapter: 1, verse: 10 },
      }
    ]);
    expect(AwokenRef.getIntersection(
      p('Genesis 1:5-10'), p('Genesis 1:5,8-9')
    )).to.deep.equal([
      { book: 'GEN', chapter: 1, verse:  5 },
      { is_range: true,
        start : { book: 'GEN', chapter: 1, verse: 8 },
        end   : { book: 'GEN', chapter: 1, verse: 9 },
      }
    ]);

    expect(AwokenRef.getIntersection(
      p('Gen 1:1;          Gen 1:3; Gen 1:6; Gen 1:7; Gen 1:10'.trim()),
      p('         Gen 1:2; Gen 1:3;          Gen 1:7; Gen 1:10'.trim()),
    )).to.deep.equal([
      { book: 'GEN', chapter: 1, verse:  3 },
      { book: 'GEN', chapter: 1, verse:  7 },
      { book: 'GEN', chapter: 1, verse: 10 },
    ]);

    expect(AwokenRef.getIntersection(
      p('Joshua 24:14 - Judges 2:10; Judges 2:20 - 3:10'),
      p('Joshua 22:1 - Joshua 24:20; Judges 2:5 - 2:23; Joshua 24:31'),
    )).to.deep.equal([
      { is_range : true,
        start    : { book: 'JOS', chapter: 24, verse: 14 },
        end      : { book: 'JOS', chapter: 24, verse: 20 },
      },
      { book: 'JOS', chapter: 24, verse: 31 },
      { is_range: true,
        start: { book: 'JDG', chapter: 2, verse:  5 },
        end  : { book: 'JDG', chapter: 2, verse: 10 },
      },
      { is_range: true,
        start: { book: 'JDG', chapter: 2, verse: 20 },
        end  : { book: 'JDG', chapter: 2, verse: 23 },
      },
    ]);

    expect(AwokenRef.getIntersection(p('Exo 1'), p('Genesis 1:1'))).to.deep.equal([]);
    expect(AwokenRef.getIntersection(p('Exo 1:1'), p('Exo 1:2'))).to.deep.equal([]);
    expect(AwokenRef.getIntersection(
      p('Exo 1:1; Exo 1:3; Exo 1:5'),
      p('Exo 1:2; Exo 1:4; Exo 1:6')
    )).to.deep.equal([]);
  });

  it('intersects', () => {
    expect(AwokenRef.intersects(p('Gen 1'), p('Genesis 1:1'))).to.deep.equal(true);
    expect(AwokenRef.intersects(p('Exo 1'), p('Genesis 1:1'))).to.deep.equal(false);
  });

  it('getUnion', () => {
    expect(AwokenRef.getUnion(p('Gen 1:5-10')[0], p('Genesis 1:7-12')[0])).to.deep.equal(p('Gen 1:5-12'));
    expect(AwokenRef.getUnion(p('Gen 1:5   '),    p('Genesis 1:7   ')   )).to.deep.equal(p('Gen 1:5; Gen 1:7'));

    expect(AwokenRef.getUnion(
      p('Joshua 24:14 - Judges 2:10; Judges 2:20 - 3:10'),
      p('Joshua 22:1 - Joshua 24:20; Judges 2:5 - 2:23; Joshua 24:31'),
    )).to.deep.equal([
      { is_range : true,
        start    : { book: 'JOS', chapter: 22, verse:  1 },
        end      : { book: 'JDG', chapter:  3, verse: 10 },
      }
    ]);
  });

  it('getDifference', () => {
    expect(AwokenRef.getDifference(p('Gen 1:1-2')[0], p('Genesis 1:1')[0])).to.deep.equal(p('Gen 1:2'));
    expect(AwokenRef.getDifference(p('Gen 1:1-2')[0], p('Genesis 1:2')[0])).to.deep.equal(p('Gen 1:1'));
    expect(AwokenRef.getDifference(p('Gen 1:1-2')[0], p('Genesis 1:3')[0])).to.deep.equal(p('Gen 1:1-2'));
    expect(AwokenRef.getDifference(p('Gen 1:1-2')[0], []                 )).to.deep.equal(p('Gen 1:1-2'));

    expect(AwokenRef.getDifference(p('Gen 1:2-4')[0], p('Genesis 1:1')[0])).to.deep.equal(p('Gen 1:2-4'));
    expect(AwokenRef.getDifference(p('Gen 1:2-4')[0], p('Genesis 1:2')[0])).to.deep.equal(p('Gen 1:3-4'));
    expect(AwokenRef.getDifference(p('Gen 1:2-4')[0], p('Genesis 1:3')[0])).to.deep.equal(p('Gen 1:2,4'));
    expect(AwokenRef.getDifference(p('Gen 1:2-4')[0], p('Genesis 1:4')[0])).to.deep.equal(p('Gen 1:2-3'));
    expect(AwokenRef.getDifference(p('Gen 1:2-4')[0], p('Genesis 1:5')[0])).to.deep.equal(p('Gen 1:2-4'));

    expect(AwokenRef.getDifference(p('Gen - Deu'), p('Exo'))).to.deep.equal(p('Gen; Lev - Deu'));

    expect(AwokenRef.getDifference(
      p('Gen 1; Gen 3; Gen 5; Gen 7'),
      p('Gen 1; Gen 3; Gen 5v1-10; Gen 7; Gen 5v12-32 ')
    )).to.deep.equal([ { book: 'GEN', chapter: 5, verse: 11 } ]);

    expect(AwokenRef.getDifference(
      p('Gen 1; Gen 3; Gen 5; Gen 7'),
      p('Gen 1; Gen7 v21-24; Gen 3; Gen 5v1-10; Gen 7v1-20; Gen 5v11-32 ')
    )).to.deep.equal([]);

    expect(AwokenRef.getDifference(
      p('Gen 1; Gen 3; Gen 5; Gen 7'),
      p('Gen 1:5-10; Gen 1:26-Gen 2:9; Gen 5:1,3,5; Gen 6; Gen 7:1 ')
    )).to.deep.equal([
      { is_range : true,
        start    : { book: 'GEN', chapter: 1, verse: 1 },
        end      : { book: 'GEN', chapter: 1, verse: 4 },
      },
      { is_range : true,
        start    : { book: 'GEN', chapter: 1, verse: 11 },
        end      : { book: 'GEN', chapter: 1, verse: 25 },
      },
      { is_range : true,
        start    : { book: 'GEN', chapter: 3, verse:  1 },
        end      : { book: 'GEN', chapter: 3, verse: 24 },
      },
      { book: 'GEN', chapter: 5, verse:  2 },
      { book: 'GEN', chapter: 5, verse:  4 },
      { is_range : true,
        start    : { book: 'GEN', chapter: 5, verse:  6 },
        end      : { book: 'GEN', chapter: 5, verse: 32 },
      },
      { is_range : true,
        start    : { book: 'GEN', chapter: 7, verse:  2 },
        end      : { book: 'GEN', chapter: 7, verse: 24 },
      },
    ]);
  });

  it('contains', () => {
    expect(AwokenRef.contains(p('Gen 1'  )[0], p('Gen 1:1')[0])).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1')[0], p('Gen 1'  )[0])).to.deep.equal(false);
    expect(AwokenRef.contains(p('Gen 1'  )[0], p('Gen 1'  )[0])).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1')[0], p('Gen 1:1')[0])).to.deep.equal(true);

    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Exo 2:2; Deu 3:3'))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Gen 1:1; Deu 3:3'))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Gen 1:1; Exo 2:2'))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Exo 2:2; Gen 1:1'))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Gen 1:1'         ))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Exo 2:2'         ))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Deu 3:3'         ))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), [])).to.deep.equal(true);

    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Deu 3:3; Gen 2:2'))).to.deep.equal(false);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Deu 3:3; Gen 2'  ))).to.deep.equal(false);
    expect(AwokenRef.contains(p('Gen 1:1; Exo 2:2; Deu 3:3'), p('Rev'             ))).to.deep.equal(false);

    expect(AwokenRef.contains(p('Gen 1 - Exo 40; Rev'), p('Gen 1; Exo 2:14; Exo 3:1-10'))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1 - Exo 40; Rev'), p('Exo 2:14; Exo 3:1-10; Gen 1'))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1 - Exo 40; Rev'), p('Rev; Gen'                   ))).to.deep.equal(true);
    expect(AwokenRef.contains(p('Gen 1 - Exo 40; Rev'), p('Exo 1:1; Ruth 1:1'))).to.deep.equal(false);
  });

  it('indexOf and verseAtIndex', () => {
    let arr = p('Revelation 1:1; Exodus 1:2-4; Genesis 6:7');

    expect(AwokenRef.indexOf(arr, { book: 'REV', chapter: 1, verse: 1 })).to.deep.equal(0);
    expect(AwokenRef.indexOf(arr, { book: 'EXO', chapter: 1, verse: 2 })).to.deep.equal(1);
    expect(AwokenRef.indexOf(arr, { book: 'EXO', chapter: 1, verse: 3 })).to.deep.equal(2);
    expect(AwokenRef.indexOf(arr, { book: 'EXO', chapter: 1, verse: 4 })).to.deep.equal(3);
    expect(AwokenRef.indexOf(arr, { book: 'GEN', chapter: 6, verse: 7 })).to.deep.equal(4);
    expect(AwokenRef.indexOf(arr, { book: 'REV', chapter: 1, verse: 2 })).to.deep.equal(-1);
    expect(AwokenRef.indexOf(arr, { book: 'EXO', chapter: 1, verse: 1 })).to.deep.equal(-1);
    expect(AwokenRef.indexOf(arr, { book: 'EXO', chapter: 1, verse: 5 })).to.deep.equal(-1);
    expect(AwokenRef.indexOf(arr, { book: 'GEN', chapter: 6, verse: 6 })).to.deep.equal(-1);
    expect(AwokenRef.indexOf(arr, { book: 'GEN', chapter: 6, verse: 8 })).to.deep.equal(-1);

    expect(AwokenRef.verseAtIndex(arr, 0)).to.deep.equal({ book: 'REV', chapter: 1, verse: 1 });
    expect(AwokenRef.verseAtIndex(arr, 1)).to.deep.equal({ book: 'EXO', chapter: 1, verse: 2 });
    expect(AwokenRef.verseAtIndex(arr, 2)).to.deep.equal({ book: 'EXO', chapter: 1, verse: 3 });
    expect(AwokenRef.verseAtIndex(arr, 3)).to.deep.equal({ book: 'EXO', chapter: 1, verse: 4 });
    expect(AwokenRef.verseAtIndex(arr, 4)).to.deep.equal({ book: 'GEN', chapter: 6, verse: 7 });
    expect(AwokenRef.verseAtIndex(arr, -1)).to.deep.equal(undefined);
    expect(AwokenRef.verseAtIndex(arr,  5)).to.deep.equal(undefined);
    expect(AwokenRef.verseAtIndex(arr, 10)).to.deep.equal(undefined);

    arr = {
      is_range : true,
      start    : { book: 'GEN', chapter:  1, verse:  1 },
      end      : { book: 'GEN', chapter: 50, verse: 26 },
    };
    expect(AwokenRef.indexOf(arr, { book: 'GEN', chapter:  1, verse:  1})).to.deep.equal(   0);
    expect(AwokenRef.indexOf(arr, { book: 'GEN', chapter:  1, verse: 31})).to.deep.equal(  30);
    expect(AwokenRef.indexOf(arr, { book: 'GEN', chapter:  2, verse:  1})).to.deep.equal(  31);
    expect(AwokenRef.indexOf(arr, { book: 'GEN', chapter: 50, verse: 26})).to.deep.equal(1532);
    expect(AwokenRef.indexOf(arr, { book: 'EXO', chapter:  1, verse:  1})).to.deep.equal( -1 );

    expect(AwokenRef.verseAtIndex(arr,    0)).to.deep.equal({ book: 'GEN', chapter:  1, verse:  1});
    expect(AwokenRef.verseAtIndex(arr,   30)).to.deep.equal({ book: 'GEN', chapter:  1, verse: 31});
    expect(AwokenRef.verseAtIndex(arr,   31)).to.deep.equal({ book: 'GEN', chapter:  2, verse:  1});
    expect(AwokenRef.verseAtIndex(arr, 1532)).to.deep.equal({ book: 'GEN', chapter: 50, verse: 26});
    expect(AwokenRef.verseAtIndex(arr,   -1)).to.deep.equal(undefined);
    expect(AwokenRef.verseAtIndex(arr, 1533)).to.deep.equal(undefined);
  });

	it('createIntersectionSet (aka: Large List Performance)', () => {
		// This is a performance test using real world data...
		//
		// We want to filter a list of all Bible chapters down to only those which include references to
		// Jesus -> implemented by filtering a list of BibleRef's representing each chapter using
		// the intersects function
		//
		// Old nieve implementation was very slow (~550ms) as we had to call intersects ~1000 times
		// (once for each chapter) and compare against the ~1000 distinct verse ranges which mention
		// Jesus
		//
		// Instead we now:
		// 1. Pre-compute and reuse the "IntersectionSet" for verse list which mention Jesus (saves ~450ms)
		// 2. Use an optimzed version of `intersects` which doesn't just internally call
		//    "getIntersection().length > 0" (saves ~80ms)

		// Parse list of all verses which mention Jesus...
		const verses = AwokenRef.combineRanges(p('gen49v10_num24v17_deu18v15_1ch17v13_psa2v7,12,16v10,110v1,5_isa7v14,8v8,9v6,11v1,40v3,49v7_jer33v15_dan7v13,9v25_zec6v12,9v9_mal3v1,4v2_mat1v1,16-18,21-23,1v25-2v1,2v4,15,3v3,13,3v15-4v1,4v3,6-7,10,12,17-18,23,5v33,7v21-7v22,7v28,8v2-8v8,8v10,13-14,18,20-22,25,29,34,9v2,4,6,9-10,12,15,19,22-23,27-28,30,35,38,10v5,23,11v1-11v2,11v4,7,19,25,27,12v1,8,15,23,25,32,40,13v1,34,36-37,41,51,53,57,14v1,12-14,16,22,25,27-31,33,15v1,16,21-22,25,27-30,32,34,16v6,8,13,16-17,20-22,24,16v27-17v1,17v4-17v5,17v7-17v9,17v11-17v12,17v15,17-20,22,24-26,18v1-18v2,18v11,21-22,26,19v1,14,17-18,21,23,26,28,20v17-20v18,20v22,25,28,20v30-21v1,21v3,6,9,11-12,15-16,21,24,27-28,31,42,22v1,16,18,29,37,41-42,44-45,23v1,8,10,23v39-24v2,24v4-24v5,24v23,27,30,37,39,42,44,25v11,13,20,22,24,31,37,44,26v1-26v2,26v4,6,10,17,19,22,24,26,31,34,36,45,49-52,55,57,59,63-64,68-69,71,26v75-27v1,27v10-27v11,27v17,20,22,26-27,37,40,43,46,50,54-55,57-58,28v2,5-6,9-10,16,18-19_mrk1v1,3,9,11,14,17,24-25,41,45,2v5,8,10,15,17,19,28,3v7,11,5v6-5v7,5v13,15,19-21,24,27,30,36,6v3-6v4,6v30,34,7v27-7v28,8v1,17,27,29,31,38,9v2,4-5,7-9,12,23-25,27,31,39,41,10v5,14,18,21,23-24,27,29,32-33,38-39,42,45,47-52,11v3,6-7,9-11,14-15,22,29,33,12v17,24,29-30,34-36,41,13v2,5-6,20-21,26,32,34,14v6,18,21-22,27,30,41,45,48,53,55,60-62,67,14v72-15v1,15v5,15,32,34,37,39,43,16v6,19-20_luk1v9,17,28,31-32,35,38,43,45,47,58,2v7,11,21-23,26-27,29,37,43,48,52,3v4,15,21-23,4v1,3-4,8-9,12,14,19,34-35,41,5v8,10,12,17,19,22,24,31,6v3,5,9,11,22,46,7v3-7v4,7v6,9,13,19,22,31,34,40,8v24,28,30,35,38-41,45-46,50,9v20,22,26,33,35-36,41-44,47,50,54,9v56-10v2,10v17,21-22,27,29-30,37,39-41,11v1,30,39,12v8,10,40-42,13v2,8,12,14-15,23,25,35,14v3,22,15v31,16v25,17v5-17v6,17v13,17,22,24,26,30,37,18v6,8,16,19,22,24,31,37-42,19v3,5,8-10,16,18,20,25,31,34-35,38,20v8,34,37,41-42,21v8,27,36,22v22,31,33,38,47-49,51-52,61,63,67,69-70,23v2,8,20,25-26,28,34-35,39,42-43,46,52,24v3,7,15,19,26,34,36,46_jhn1v1,7-9,14,17-18,20,23,25,29,34,36-38,41-43,45,1v47-2v4,2v7,11,13,19,22,24,3v2-3v3,3v5,10,13-14,16-18,22,28,3v35-4v2,4v6-4v7,4v10,13,16-17,21,24-26,29,34,42,44,46-48,50,4v53-5v1,5v6,8,13-17,19-23,25-27,6v1,3,5,10-11,14-15,17,19,22-24,26-27,29,32,34-35,40,42-43,53,61-64,67-70,7v1,6,14,16,21,26-28,31,33,37,39,41-42,50,8v1,6,9-12,14,19-21,25,28,31,34-36,39,42,49,54,58-59,9v3,11,14,22,35-39,41,10v6-10v7,10v23-10v25,10v32,34,36,11v2-11v5,11v9,12-14,17,20-21,23,25,27,30,32-35,38-41,44-46,51,54,56,12v1,3,7,9,11-14,16,21-23,30,34-36,38,44,13v1,3,6-10,13-14,21,23,25-27,29,31,36-38,14v5-14v6,14v8-14v9,14v13,22-23,16v19,31,17v1,3,18v1-18v2,18v4-18v5,18v7-18v8,18v11-18v12,18v15,19-20,22-23,28,32-34,36-37,19v1,5,7,9,11,13,16,18-20,23,25-26,28,30,33,38-40,42,20v2,12-21,24-26,20v28-21v1,21v4-21v5,21v7,10,12-17,20-23,25_act1v1,6,11,14,16,21,24,2v20-2v22,2v25,27,30-32,34,36,38-39,47,3v6,13-14,18-20,22-23,26,4v2,10,13,18,24,26-27,29-30,33,5v9,14,19,30-31,40,42,6v14,7v30-7v31,7v33,37,49,55-56,59-60,8v5,12,16,24-26,35,37,39,9v1,5-6,10-11,13,15,17,20,22,27,29,31,34-35,42,10v4,14,36,38,48,11v8,16-17,20-21,23-24,12v7,11,17,23,13v2,10-12,23,33,35,47-49,14v3,23,15v11,26,35-36,16v10,14-15,18,31-32,17v3,7,18,24,27,18v5,8-9,25,28,19v4-19v5,19v10,13,15,17,20v19,21,24,35,21v13-21v14,21v20,22v8,10,16,19,23v11,24v24,25v19,26v9,15,23,28v23,31_rom1v1,3-4,6-9,16,2v16,3v22,24,26,4v8,24,5v1,6,8,10-11,15,17,21,6v3-6v4,6v8-6v9,6v11,23,7v4,7v25-8v3,8v9-8v11,8v17,29,32,34-35,8v39-9v1,9v3,5,29,10v4,6-7,9,12-13,16,11v3,34,12v5,11,19,13v14,14v6,8-11,14-15,18,15v3,5-8,11,16-20,29-30,16v2-16v3,16v5,7-13,16,18,20,22,24-25,27_1co1v1-4,6-10,12-13,17,23-24,30-31,2v2,8,2v16-3v1,3v5,11,20,3v23-4v1,4v4-4v5,4v10,15,17,19,5v4-5v5,5v7,6v11,13-15,17,7v10,12,17,22,25,32,34-35,39,8v6,11-12,9v1-9v2,9v5,12,14,18,21,10v4,9,16,21-22,11v1,3,11,23,27,32,12v3,5,12,27,14v21,37,15v3,12-20,22-23,28,31,47,57-58,16v2,7,10,19,22-24_2co1v1-3,5,14,19,21,2v10,12,14-15,17,3v3-3v4,3v14,16-18,4v4-4v6,4v10-4v11,4v14,5v6,8,10-11,14,16-20,6v15,17,8v5,9,19,21,23,9v13,10v1,5,8,14,17-18,11v2-11v4,11v10,13,17,23,31,12v1-12v2,12v8-12v9,12v19,13v3,5,10,14_gal1v1,3,6-7,10,12,16,22,2v4,16-17,2v20-3v1,3v13-3v14,3v16-3v17,3v22,24,26-28,4v4,6-7,14,19,5v1-5v2,5v4,6,10,6v2,12,14-15,17-18_eph1v1-3,5,10,12-13,15,17,20,2v5-2v7,2v10,12-13,20-21,3v1,4,6,8-9,11,14,17,19,3v21-4v1,4v5,7,12-13,15,17,20-21,30,5v2,5,8,10,14,17,19-20,22-25,29,32,6v1,4-8,10,21,23-24_php1v1-2,6,8,10-11,13-16,18-21,23,26-27,29,2v1,5,10-11,16,19,21,24,2v29-3v1,3v3,7-9,12,14,18,20,4v1-4v2,4v4-4v5,4v7,10,13,19,21,23_col1v1-4,7,10,13,24,27-28,2v2,5-6,8,11,17,20,3v1,3-4,11,13,16-18,20,23-24,4v3,7,12,17_1th1v1,3,6,8,10,2v6,14-15,19,3v2,8,3v11-4v2,4v6,14-17,5v2,9,12,18,23,27-28_2th1v1-2,7-9,1v12-2v2,2v8,13-14,16,3v1,3-6,12,16,18_1ti1v1-2,12,14-16,2v3,5,7,3v13,4v6,10,5v11,21,6v3,13-15_2ti1v1-2,8-10,13,16,1v18-2v1,2v3,7-8,10,14,19,22,24,3v11-3v12,3v15,4v1,8,14,17-18,22_tit1v1,3-4,2v10,13,3v4,6_phm1v1,3,5-6,8-9,16,20,23,25_heb1v2,5,8-10,2v3,9,3v1,6,14,4v8,14,5v5,8,6v1,6,20,7v3,14,21-22,28,8v2,8-11,9v11,14,24,28,10v10,16,19,29-30,11v26,12v2,5-6,14,24,13v6,8,12,20-21_jas1v1,7,12,2v1,4v10,15,5v4,7-8,10-11,14-15_1pe1v1-3,7,11,13,19,25,2v3,5,21,3v12,16,18,21,4v1,11,14,5v1,3,10,14_2pe1v1-2,8,11,14,16-17,2v1,9,11,20,3v2,8-10,15,18_1jn1v1,3,7,2v1,20,22-24,3v8,23,4v2-4v3,4v9-4v10,4v14-4v15,5v1,5-7,9-13,20_2jn1v3,7,9_jud1v1,4-5,9,14,17,21,25_rev1v1-2,5,8-9,13,2v18,4v2,11,5v6,8,12-13,6v1,10,16,7v9-7v10,7v14,17,11v8,15,12v10-12v11,12v17,13v8,14v1,4,10,12-14,15v3-15v4,16v5,17v3,6,14,19v1,7,9-10,13,20v4,6,21v9-21v10,21v14,22-23,21v27-22v1,22v3,16,20-21'));

		// Generate list of all BibleRef's representing each Bible chapter
		const options = [];
		for(let b of Object.values(AwokenRef.versification.book)) {
			for(let c = 1; c <= b.chapters.length; ++c) {
				options.push(AwokenRef.makeRange(b.id, c));
			}
		}

		// Do filtering
		console.time("createIntersectionSet");
		const intersectionSet = AwokenRef.createIntersectionSet(verses);
		console.timeEnd("createIntersectionSet");
		console.time("intersects");
		const valid = options.filter(o => AwokenRef.intersects(o, intersectionSet));
		console.timeEnd("intersects");

		expect(options.length).to.deep.equal(1189);
		expect(verses.length).to.deep.equal(1259);
		expect(valid.length).to.deep.equal(267);
	});
});
