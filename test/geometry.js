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
    expect(AwokenRef.getUnion(p('Gen 1:5-10'), p('Genesis 1:7-12'))).to.deep.equal(p('Gen 1:5-12'));
    expect(AwokenRef.getUnion(p('Gen 1:5   '), p('Genesis 1:7   '))).to.deep.equal(p('Gen 1:5; Gen 1:7'));

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
});
