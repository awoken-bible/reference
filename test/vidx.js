"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const v        = require('../src/Versification.ts').default;
const Parsers  = require('../src/parser.ts').default;
const { toVidx, fromVidx, comparator, firstNVerses, countVerses } = require('../src/vidx.ts');

console.dir(Parsers);

function p(str){
  return Parsers.BibleRef.parse(str).value;
}

describe("vidx", () => {
  it('toVidx', () => {
    expect(toVidx(v, { book: 'GEN', chapter:  1, verse:  1})).to.deep.equal( 0);
    expect(toVidx(v, { book: 'GEN', chapter:  1, verse:  2})).to.deep.equal( 1);
    expect(toVidx(v, { book: 'GEN', chapter:  1, verse: 31})).to.deep.equal(30);
    expect(toVidx(v, { book: 'GEN', chapter:  2, verse:  1})).to.deep.equal(31);
    expect(toVidx(v, { book: 'MAL', chapter:  4, verse:  6})).to.deep.equal(23144);
    expect(toVidx(v, { book: 'MAT', chapter:  1, verse:  1})).to.deep.equal(23145);
    expect(toVidx(v, { book: 'REV', chapter: 22, verse: 21})).to.deep.equal(31101);
  });

  it('fromVidx', () => {
    expect(fromVidx(v,     0)).to.deep.equal({ book: 'GEN', chapter:  1, verse:  1});
    expect(fromVidx(v,     1)).to.deep.equal({ book: 'GEN', chapter:  1, verse:  2});
    expect(fromVidx(v,    30)).to.deep.equal({ book: 'GEN', chapter:  1, verse: 31});
    expect(fromVidx(v,    31)).to.deep.equal({ book: 'GEN', chapter:  2, verse:  1});
    expect(fromVidx(v, 23144)).to.deep.equal({ book: 'MAL', chapter:  4, verse:  6});
    expect(fromVidx(v, 23145)).to.deep.equal({ book: 'MAT', chapter:  1, verse:  1});
    expect(fromVidx(v, 31101)).to.deep.equal({ book: 'REV', chapter: 22, verse: 21});
  });

  it('to/from round trip', () => {
    for(let i = 0; i < 33102; ++i){
      expect(toVidx(v,fromVidx(v,i))).to.deep.equal(i);
    }
  });

  it('compare', () => {
    expect(comparator(v,
                      { book: 'GEN', chapter: 5, verse: 10 },
                      { book: 'GEN', chapter: 5, verse: 10 }
                     )).to.deep.equal(0);
    expect(comparator(v,
                      { book: 'GEN', chapter: 5, verse: 10 },
                      { book: 'GEN', chapter: 5, verse: 11 }
                     )).to.deep.equal(-1);
    expect(comparator(v,
                      { book: 'GEN', chapter: 5, verse: 11 },
                      { book: 'GEN', chapter: 5, verse: 10 }
                     )).to.deep.equal(1);
    expect([{ book: 'MAL', chapter: 1, verse: 12 },
            { book: 'GEN', chapter: 5, verse:  9 },
            { book: 'MAL', chapter: 1, verse: 11 },
            { book: 'GEN', chapter: 4, verse: 10 },
            { book: 'REV', chapter: 1, verse:  1 },
            { book: 'MAL', chapter: 1, verse: 10 },
            { book: 'GEN', chapter: 4, verse: 11 },
           ].sort((a,b) => comparator(v, a, b))
          ).to.deep.equal([
            { book: 'GEN', chapter: 4, verse: 10 },
            { book: 'GEN', chapter: 4, verse: 11 },
            { book: 'GEN', chapter: 5, verse:  9 },
            { book: 'MAL', chapter: 1, verse: 10 },
            { book: 'MAL', chapter: 1, verse: 11 },
            { book: 'MAL', chapter: 1, verse: 12 },
            { book: 'REV', chapter: 1, verse:  1 },
          ]);
  });

  it('verseCount', () => {
    expect(countVerses(v, { book: 'GEN', chapter: 1, verse:  1 })).to.deep.equal(1);
    expect(countVerses(v, { book: 'JHN', chapter: 3, verse: 16 })).to.deep.equal(1);
    expect(countVerses(v, { book: 'ETH', chapter: 2, verse:  2 })).to.deep.equal(1);

    function count(str){ return countVerses(v, p(str)[0]); }

    expect(count('Gen 1:1'            )).to.deep.equal(    1);
    expect(count('Gen 1:1-2'          )).to.deep.equal(    2);
    expect(count('Gen 1:1-10'         )).to.deep.equal(   10);
    expect(count('Gen 1'              )).to.deep.equal(   31);
    expect(count('Gen 1:1 - Rev 22:21')).to.deep.equal(31102);
  });

  it('firstNVerses', () => {
    function firstN(str, n){ return firstNVerses(v, p(str), n); }

    // Empty results
    expect(firstNVerses(v, [],  0)).to.deep.equal([]);
    expect(firstNVerses(v, [],  1)).to.deep.equal([]);
    expect(firstNVerses(v, [], 10)).to.deep.equal([]);
    expect(firstN      ('GEN',  0)).to.deep.equal([]);

    // Within chapter
    expect(firstN('GEN', 5)).to.deep.equal(p('Gen 1:1-5'));
    expect(firstN('GEN', 1)).to.deep.equal(p('Gen 1:1'));

    // Cross chapter span
    expect(firstN('GEN 1:31 - 2:25', 1000)).to.deep.equal(p('Gen 1:31 - 2:25'));
    expect(firstN('GEN 1:31 - 2:25',    1)).to.deep.equal(p('Gen 1:31'));
    expect(firstN('GEN 1:31 - 2:25',    2)).to.deep.equal(p('Gen 1:31 - 2:1'));
    expect(firstN('GEN 1:31 - 2:25',    5)).to.deep.equal(p('Gen 1:31 - 2:4'));

    // 2 book span
    expect(firstN('DEU 34:10 - JOS 1:18', 1000)).to.deep.equal(p('DEU 34:10 - JOS 1:18'));
    expect(firstN('DEU 34:10 - JOS 1:18',    1)).to.deep.equal(p('DEU 34:10'));
    expect(firstN('DEU 34:10 - JOS 1:18',    2)).to.deep.equal(p('DEU 34:10-11'));
    expect(firstN('DEU 34:10 - JOS 1:18',    3)).to.deep.equal(p('DEU 34:10-12'));
    expect(firstN('DEU 34:10 - JOS 1:18',    4)).to.deep.equal(p('DEU 34:10 - JOS 1:1'));
    expect(firstN('DEU 34:10 - JOS 1:18',    5)).to.deep.equal(p('DEU 34:10 - JOS 1:2'));
    expect(firstN('DEU 34:10 - JOS 1:18',    8)).to.deep.equal(p('DEU 34:10 - JOS 1:5'));

    // 3 book span
    expect(firstN('2JN 1:12 - Jude 1:25', 1000)).to.deep.equal(p('2JN 1:12 - Jude 1:25'));
    expect(firstN('2JN 1:12 - Jude 1:25',    1)).to.deep.equal(p('2JN 1:12'));
    expect(firstN('2JN 1:12 - Jude 1:25',    2)).to.deep.equal(p('2JN 1:12-13'));
    expect(firstN('2JN 1:12 - Jude 1:25',    3)).to.deep.equal(p('2JN 1:12 - 3JN 1:1'));
    expect(firstN('2JN 1:12 - Jude 1:25',   10)).to.deep.equal(p('2JN 1:12 - 3JN 1:8'));
    expect(firstN('2JN 1:12 - Jude 1:25',   16)).to.deep.equal(p('2JN 1:12 - 3JN 1:14'));
    expect(firstN('2JN 1:12 - Jude 1:25',   17)).to.deep.equal(p('2JN 1:12 - Jude 1:1'));
    expect(firstN('2JN 1:12 - Jude 1:25',   18)).to.deep.equal(p('2JN 1:12 - Jude 1:2'));
    expect(firstN('2JN 1:12 - Jude 1:25',   25)).to.deep.equal(p('2JN 1:12 - Jude 1:9'));

    // Multiple in list
    expect(firstN('GEN 1:1,2,3,4,5', 1000)).to.deep.equal(p('GEN 1:1,2,3,4,5'));
    expect(firstN('GEN 1:1,2,3,4,5',    1)).to.deep.equal(p('GEN 1:1'));
    expect(firstN('GEN 1:1,2,3,4,5',    3)).to.deep.equal(p('GEN 1:1,2,3'));
    expect(firstN('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10', 1000)).to.deep.equal(p('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10'));
    expect(firstN('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10',    2)).to.deep.equal(p('GEN 1:1; EXO 1:3'));
    expect(firstN('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10',    3)).to.deep.equal(p('GEN 1:1; EXO 1:3-4'));
    expect(firstN('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10',    4)).to.deep.equal(p('GEN 1:1; EXO 1:3-5'));
    expect(firstN('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10',    5)).to.deep.equal(p('GEN 1:1; EXO 1:3-5,10'));
    expect(firstN('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10',    6)).to.deep.equal(p('GEN 1:1; EXO 1:3-5,10; DEU 8:9'));
    expect(firstN('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10',    7)).to.deep.equal(p('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10'));
    expect(firstN('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10',    8)).to.deep.equal(p('GEN 1:1; EXO 1:3-5,10; DEU 8:9-10'));


    function count(str){ return countVerses(v, p(str)[0]); }
  });
});
