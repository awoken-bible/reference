"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const BookSequence = require('../src/BookSequence.ts');
const { Bible, NewTestament, OldTestament, Torah } = BookSequence;

describe("BookSequence", () => {
  it('Bible', () => {
    expect(Bible.length).to.equal(66);
    expect(Bible[ 0]).to.equal('GEN');
    expect(Bible[65]).to.equal('REV');
    expect(Bible.getFirst()).to.equal('GEN');
    expect(Bible.getLast ()).to.equal('REV');

    expect(Bible.getNext    ('EXO')).to.equal('LEV');
    expect(Bible.getPrevious('2KI')).to.equal('1KI');

    expect(Bible.getName('GEN')).to.equal('Genesis');
    expect(Bible.getName('1SA')).to.equal('1 Samuel');
    expect(Bible.getName('BAD')).to.equal(undefined);
  });

  it('Old Testement', () => {
    expect(OldTestament.length).to.equal(39);
    expect(OldTestament[ 0]).to.equal('GEN');
    expect(OldTestament[38]).to.equal('MAL');
    expect(OldTestament.getFirst()).to.equal('GEN');
    expect(OldTestament.getLast ()).to.equal('MAL');
  });

  it('New Testement', () => {
    expect(NewTestament.length).to.equal(27);
    expect(NewTestament[ 0]).to.equal('MAT');
    expect(NewTestament[26]).to.equal('REV');
    expect(NewTestament.getFirst()).to.equal('MAT');
    expect(NewTestament.getLast ()).to.equal('REV');

    expect(NewTestament.getNext('MAT')).to.equal('MRK');
    expect(NewTestament.getNext('MRK')).to.equal('LUK');
    expect(NewTestament.getNext('LUK')).to.equal('JHN');
  });
});
