import VERSIFICATION from './Versification';
import BibleRef      from './BibleRef';
import * as P from 'parsimmon';


let book_name_to_id : { [ index: string ] : string } = {};
for(let book of VERSIFICATION.order){
	book_name_to_id[book.name.toLowerCase()] = book.id;

	for(let n of book.aliases.map(x => x.toLowerCase())){
		// We support aliases both with and without a trailing .
		book_name_to_id[n      ] = book.id;
		book_name_to_id[n + '.'] = book.id;
	}

	let name = book.name.toLowerCase();
	book_name_to_id[book.name.toLowerCase()] = book.id;
}


///////////////////////////////////////////////////////////////////////
// Basic Parses

// differs to parsimons whitespace in that it doesn't consume new lines
const pAnySpace : P.Parser<string> = P.regex(/[ \t]*/);

const pInt : P.Parser<number> = P
	.regex(/[0-9]+/)
	.skip(pAnySpace)
	.map(s => Number(s));

///////////////////////////////////////////////////////////////////////
// Bible Book

const pBookId : P.Parser<string> = P
	.regex(/([0-9A-Z]{3})\.?/i)
	.chain(x => {
		x = x.toUpperCase().substring(0,3);
		if(VERSIFICATION.book[x]){
			return P.succeed(x);
		} else {
			return P.fail(`Invalid book ID: ${x}`);
		}
	}).desc("USFM book identifier (eg: 'GEN', 'REV')");

const pBookPrefixNumber : P.Parser<number> = P.alt(
	P.string("1st").map((x) => 1),
	P.string("2nd").map((x) => 2),
	P.string("3rd").map((x) => 3),
	P.oneOf("123").map(x => parseInt(x)),
	P.oneOf("I").times(1,3).map(x => x.length),
);

const pBookName : P.Parser<string> = P.alt(
	// Multiword book names
	P.regexp(/[Ss]ong\sof\s[Ss](ongs|olomon|ol.?)/).chain(x => P.succeed("SNG")),

	// Number followed by single word (eg: 1 Kings)
	P.seq(pBookPrefixNumber, pAnySpace, P.regexp(/[A-Z]+\.?/i)).chain(x => {
		let name = x[0] + ' ' + x[2].toLowerCase();
		let id   = book_name_to_id[name];
		if(id){ return P.succeed(id); }
		else  { return P.fail("Invalid book name: " + x); }
	}),

	// Single word book names
	P.regexp(/[A-Z]+\.?/i).chain(x => {
		let id = book_name_to_id[x.toLowerCase()];
		if(id){ return P.succeed(id); }
		else  { return P.fail("Invalid book name: " + x); }
	})
).desc("Book name (eg, 'Genesis', '2 Kings')");

const pBook : P.Parser<string> = P.alt(pBookName, pBookId).skip(pAnySpace);

///////////////////////////////////////////////////////////////////////

// Parses a character that seperates a chapter number from verse number
const pVerseSeperator : P.Parser<string> = P.oneOf(":v.").skip(pAnySpace);

// Parses a comma seperator, optionally followed by whitespace
const pCommaSeperator : P.Parser<string> = P.oneOf(',').skip(pAnySpace);

const pRangeSeperator : P.Parser<string> = P
	.optWhitespace
	.then(P.oneOf("-"))
	.skip(pAnySpace);

// Represents an integer or optionally a range of ints such as "5" or "5 - 7"
interface IntRange {
	start : number,
	end   : number | null,
};
const pIntRange : P.Parser<IntRange> = P.seq(
	pInt, pRangeSeperator.then(pInt).fallback(null)
).chain(([start, end]) => {
	if(end && end <= start){
		return P.fail("End of range must be higher than start");
	}
	return P.succeed({ start, end });
});

// Parses a chapter/verse reference such as:
// full_chapters:
// 5         :: full chapter
// 5-8       :: chapter range
//
// verse:
// 5:6       :: single verse
// 5:6,12    :: multiple verses
// 5:6-12    :: range of verses
// 5:6-12,14 :: multiple ranges/verses
//
// chapter_range:
// 5:12 - 6:13
type ChapterVerseSpecifier = {
	kind: "full_chapter",
	range: IntRange
} | {
	kind    : "verse",
	chapter : number,
	verses  : IntRange[],
} | {
	kind: "chapter_range",
	c1 : number,
	v1 : number,
	c2 : number,
	v2 : number,
};
const pChapterVerseSpecifier : P.Parser<ChapterVerseSpecifier> = P.alt(
	// chapter_range:
	P.seqMap(
		pInt.skip(pVerseSeperator),
		pInt,
		pRangeSeperator,
		pInt.skip(pVerseSeperator),
		pInt,
		(c1, v1, r, c2, v2) => { return { kind: "chapter_range", c1, v1, c2, v2 }; }
	),

	// Parses full chapters, eg "5", "5-8"
	pIntRange.notFollowedBy(pVerseSeperator).map((range) => {
		return { kind: "full_chapter", range };
	}),

	// Parses single chapter with verses, eg "5:8", "5:8-10",
	P.seqMap(
		pInt,
		pVerseSeperator.then(
			(pIntRange.notFollowedBy(pVerseSeperator)).sepBy1(pCommaSeperator)
		),
		(chapter : number, verses : IntRange[]) => {
			return { kind: "verse", chapter, verses };
		}
	)
);

// Converts a parsed ChapterVerseSpecifier into a list of BibleRefs
function chapterVerseSpecifierToBibleRef(book : string, cv : ChapterVerseSpecifier) : BibleRef[]{
	switch(cv.kind){
		case "full_chapter": {
			let start : number = cv.range.start;
			let end   : number = cv.range.end ? cv.range.end : cv.range.start;
			let last_verse = 1;
			if(VERSIFICATION.book[book][end] !== undefined){
				last_verse = VERSIFICATION.book[book][end].verse_count;
			}
			return [{
				is_range: true,
				start : { book, chapter: start, verse: 1 },
				end   : { book, chapter: end,   verse: last_verse },
			}];
		}
		case "verse": {
			let chapter = cv.chapter;
			let results : BibleRef[] = [];
			for(let v of cv.verses){
				if(v.end){
					results.push({
						is_range: true,
						start : { book, chapter, verse: v.start },
						end   : { book, chapter, verse: v.end   },
					});
				} else {
					results.push({ book, chapter, verse: v.start });
				}
			}

			return results;
		}
		case "chapter_range":
			return [{
				is_range: true,
				start : { book, chapter: cv.c1, verse: cv.v1 },
				end   : { book, chapter: cv.c2, verse: cv.v2 },
			}];
	}
}

const pBibleRefSingle : P.Parser<BibleRef[]> = P.alt(
	// Ranges where both sides of - have a book name, for example:
	//
	// Eg:
	// - Genesis 1:1 - Genesis 5:1
	// - Genesis 1   - Genesis 5
	// - Genesis - Exodus
	P.seqMap(
		pBook,
		P.seq(pInt, pVerseSeperator.then(pInt).fallback(null)).fallback(null),
		pRangeSeperator,
		pBook,
		P.seq(pInt, pVerseSeperator.then(pInt).fallback(null)).fallback(null),
		(b1, b1_extra, r, b2, b2_extra) => {

			let start = { book: b1, chapter: 1, verse: 1};
			if(b1_extra){
				let [c1, v1] = b1_extra;
				start.chapter = c1;
				if(v1 !== null) { start.verse = v1; }
			}

			let end = {
				book    : b2,
				chapter : VERSIFICATION.book[b2].chapters.length,
				verse   : 0
			};
			if(b2_extra){
				let [ c2, v2 ] = b2_extra;
				end.chapter = c2;
				if(v2 == null){
					end.verse = VERSIFICATION.book[b2][end.chapter].verse_count;
				} else {
					end.verse = v2;
				}
			} else {
				end.verse = VERSIFICATION.book[b2][end.chapter].verse_count;
			}

			return [{ is_range: true, start, end }];
		 }
	),

	// Ranges within a single chapter
	// EG: Gen 5:12-14
	P.seqMap(
		pBook,
		pChapterVerseSpecifier.sepBy(pCommaSeperator),
		(book : string, cv_list : ChapterVerseSpecifier[]) => {

			if(cv_list.length == 0){
				// Then we just got a book name, no chapter/verse
				let max_chapter : number = VERSIFICATION.book[book].chapters.length;
				let max_verse   : number = VERSIFICATION.book[book][max_chapter].verse_count;
				return [{
					is_range: true,
					start : { book, chapter: 1, verse: 1 },
					end   : { book, chapter: max_chapter, verse: max_verse},
				}];
			}

			let results : BibleRef[] = [];
			for(let cv of cv_list){
				results = results.concat(chapterVerseSpecifierToBibleRef(book, cv));
			}
			return results;
		}
	),
);

const pBibleRef : P.Parser<BibleRef[]> = pBibleRefSingle
	.sepBy1(pAnySpace.then(P.oneOf(';_')).then(pAnySpace))
	.map((list) => list.reduce((acc, x) => acc.concat(x), []));

/**
 * Represents the result of a successful attempt to parse a string representing a [[BibleRef]]
 */
interface ParseResultSuccess {
	/**
	 * Whether the parsing was successful - `true` for a [[ParseResultSuccess]]
	 */
	status : true;

	/**
	 * The array of [[BibleRef]]s which were parsed
	 * An array is used since input string may include multiple non-contigious blocks, for example:
	 * - Genesis 1 v5,8
	 * - Genesis 1:1 ; Exodus 1:1
	 */
	value  : BibleRef[];
}

/**
 * Represents the result of an unsuccessful attempt to parse a string representing a [[BibleRef]]
 */
interface ParseResultFailure {
	/**
	 * Whether the parsing was successful - `false` for a [[ParseResultFailure]]
	 */
	status: false,

	/**
	 * List of possible tokens/characters at the indicated location
	 */
	expected: string[],

	/**
	 * Location within input string where an unexpected token was encountered
	 */
	index: { column: number, line: number, offset: number },
};

/**
 * Represents the output of attempting to parse a string containing a Bible reference
 * Check the `status` field to see if the parse succeeded, and then utalize the fields
 * of [[ParseResultSuccess]] and [[ParseResultFailure]] as appropriate
 */
export type ParseResult = ParseResultSuccess | ParseResultFailure;

const Parsers = {
	Book     : pBook,
	BibleRef : pBibleRef,
};
export default Parsers;
export { Parsers };
