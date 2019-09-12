import VERSIFICATION from './Versification';
import manifest      from './manifest';
import * as P from 'parsimmon';

let book_name_to_id : { [ index: string ] : string } = {};
for(let k in manifest.book_names){
	let v = manifest.book_names[k];
	book_name_to_id[v.toLowerCase()] = k;
}

export interface BibleVerse {
	/**
   * The 3 character book id
   */
	book: string,

	/**
	 * The chapter number within the book, note, this is indexed from 1
	 * rather than 0 as with arrays
	 */
	chapter: number,

  /**
   * The number of the references verse
	 * @note This is index from 1 rather than 0!
	 */
  verse: number,
};

export interface BibleVerseRange {
	is_range: true,
	start : BibleVerse,
	end   : BibleVerse,
};

export type BibleRef = BibleVerse | BibleVerseRange;

const pInt : P.Parser<number> = P.digits.map(s => Number(s));

///////////////////////////////////////////////////////////////////////
// Bible Book

const pBookId : P.Parser<string> = P
	.regex(/[0-9A-Z]{3}/i)
	.chain(x => {
		x = x.toUpperCase();
		if(VERSIFICATION[x]){
			return P.succeed(x);
		} else {
			return P.fail(`Invalid book ID: ${x}`);
		}
	}).desc("USFM book identifier (eg: 'GEN', 'REV')");

const pBookPrefixNumber : P.Parser<number> = P.alt(
	P.oneOf("123").map(x => parseInt(x)),
	P.regex(/I{1,3}/i).map(x => x.length),
);

const pBookName : P.Parser<string> = P.alt(
	// Multiword book names
	P.string("Song of Solomon").chain(x => P.succeed("SNG")),
	P.string("song of solomon").chain(x => P.succeed("SNG")),

	// Number followed by single word (eg: 1 Kings)
	P.seq(pBookPrefixNumber, P.optWhitespace, P.letters).chain(x => {
		let name = x[0] + ' ' + x[2].toLowerCase();
		let id   = book_name_to_id[name];
		if(id){ return P.succeed(id); }
		else  { return P.fail("Invalid book name: " + x); }
	}),

	// Single word book names
	P.letters.chain(x => {
		let id = book_name_to_id[x.toLowerCase()];
		if(id){ return P.succeed(id); }
		else  { return P.fail("Invalid book name: " + x); }
	})
).desc("Book name (eg, 'Genesis', '2 Kings')");

const pBook : P.Parser<string> = P.alt(pBookName, pBookId);

///////////////////////////////////////////////////////////////////////

const pRef = pInt;

function parse(str : string) : any {
	return pRef.tryParse(str);
}


let Api = {
	parse,
};
export default Api;
