const chai      = require('chai');
const expect    = chai.expect;

const AwokenRef = require('../src').default;
const { createVersification } = require('../src');

const VERSIFICATION = createVersification([{
	id: 'TST',
	osisId: 'Tst',
	name: 'Test',
	aliases: ['Tt'],
	verse_counts: [ 11,12,13,15,15 ],
}, {
	id: 'THG',
	osisId: 'Tng',
	name: 'Thing',
	aliases: ['Things'],
	verse_counts: [ 21, 22 ],
}]);

const lib = new AwokenRef(VERSIFICATION);

describe('Custom Versification', () => {
	it('makeRange', () => {
		expect(lib.makeRange('TST')).to.deep.equal({
			is_range: true,
			start: { book: 'TST', chapter: 1, verse: 1 },
			end: { book: 'TST', chapter: 5, verse: 15 },
		});

		expect(lib.makeRange('TST', 2)).to.deep.equal({
			is_range: true,
			start: { book: 'TST', chapter: 2, verse: 1 },
			end: { book: 'TST', chapter: 2, verse: 12 },
		});
	});

	it('makeBookRange', () => {
		expect(lib.makeBookRange('TST')).to.deep.equal({
			is_range: true,
			start: { book: 'TST', chapter: 1, verse: 1 },
			end: { book: 'TST', chapter: 5, verse: 15 },
		});

		expect(lib.makeBookRange('TST', 'THG')).to.deep.equal({
			is_range: true,
			start: { book: 'TST', chapter: 1, verse: 1 },
			end: { book: 'THG', chapter: 2, verse: 22 },
		});
	});

	it('parser', () => {
		expect(lib.parseOrThrow('Test 2')).to.deep.equal([{
			is_range: true,
			start: { book: 'TST', chapter: 2, verse: 1 },
			end: { book: 'TST', chapter: 2, verse: 12 },
		}]);

		expect(lib.parseOrThrow('Test 3; Test 5v10 - Things 1')).to.deep.equal([{
			is_range: true,
			start: { book: 'TST', chapter: 3, verse: 1 },
			end: { book: 'TST', chapter: 3, verse: 13 },
		}, {
			is_range: true,
			start: { book: 'TST', chapter: 5, verse: 10 },
			end: { book: 'THG', chapter: 1, verse: 21 },
		}]);
	});

	it('format', () => {
		expect(lib.format({ book: 'TST', chapter: 2, verse: 3 })).to.deep.equal('Test 2:3');
	});

});
