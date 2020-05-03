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
});
