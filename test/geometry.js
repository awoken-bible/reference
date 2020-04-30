"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const v        = require('../src/Versification.ts').default;
const Parsers  = require('../src/parser.ts').default;
const { getIntersection, intersects, getUnion } = require('../src/geometry.ts');

function p(str){
  return Parsers.BibleRef.parse(str).value;
}

describe("Geometry", () => {
  it('getIntersection', () => {

    expect(getIntersection(v, p('Genesis 1:5-10'), p('Geneis 1:7-12'))).to.deep.equal([
      { is_range: true,
        start : { book: 'GEN', chapter: 1, verse:  7 },
        end   : { book: 'GEN', chapter: 1, verse: 10 },
      }
    ]);

    expect(getIntersection(
      v, p('Genesis 1:5-10'), p('Geneis 1:5, 8-9')
    )).to.deep.equal([
      { book: 'GEN', chapter: 1, verse:  5 },
      { is_range: true,
        start : { book: 'GEN', chapter: 1, verse: 8 },
        end   : { book: 'GEN', chapter: 1, verse: 9 },
      }
    ]);

    expect(getIntersection(
      v,
      p('Gen 1:1,          Gen 1:3, Gen 1:6, Gen 1:7, Gen 1:10'),
      p('         Gen 1:2, Gen 1:3,          Gen 1:7, Gen 1:10'),
    )).to.deep.equal([
      { book: 'GEN', chapter: 1, verse:  3 },
      { book: 'GEN', chapter: 1, verse:  7 },
      { book: 'GEN', chapter: 1, verse: 10 },
    ]);
  });

  it('intersects', () => {
    expect(intersects(v, p('Gen 1'), p('Genesis 1:1'))).to.deep.equal(true);
    expect(intersects(v, p('Exo 1'), p('Genesis 1:1'))).to.deep.equal(false);
  });

  it('getUnion', () => {
    expect(getUnion(v, p('Gen 1:5-10'), p('Genesis 1:7-12'))).to.deep.equal(p('Gen 1:5-12'));
    expect(getUnion(v, p('Gen 1:5   '), p('Genesis 1:7   '))).to.deep.equal(p('Gen 1:5, Gen 1:7'));
  });
});
