"use strict";

const chai     = require('chai');
const expect   = chai.expect;

const V = require('../src/Versification.ts').default;

function collectNames(b) {
  return [ b.id, b.name, ...b.aliases ].map(n => n.toLowerCase());
}

describe("BookSequence", () => {
  it('No duplicate ids/names/aliases', () => {

    for(let i = 0; i < V.order.length-1; ++i){
      let names = collectNames(V.order[i]);

      let rest = V.order.slice(i+1, V.order.length)
          .map(collectNames)
          .reduce((acc, v) => acc.concat(v), []);

      for(let n of names){
        expect(rest[rest.indexOf(n)]).to.deep.equal(undefined);
      }
    }
  });
});
