import P from 'parsimmon';

import VERSIFICATION from './Versification';
import type { Versification } from './Versification';
import BibleRef      from './BibleRef';
import { _makeBookRange } from './range-manip';

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

	/**
	 * The string we were attempting to parse
	 */
	input: string,
};

/**
 * Represents the output of attempting to parse a string containing a Bible reference
 * Check the `status` field to see if the parse succeeded, and then utalize the fields
 * of [[ParseResultSuccess]] and [[ParseResultFailure]] as appropriate
 */
export type ParseResult = ParseResultSuccess | ParseResultFailure;

/**
 * Set of publically exposed parsimon parsers
 */
export interface Parsers {
	Book     : P.Parser<string>;
	BibleRef : P.Parser<BibleRef[]>;
}

///////////////////////////////////////////////////////////////////////
// Basic Parsers
// These do not depend on versification and thus are not declared inside buildParsers

// differs to parsimons whitespace in that it doesn't consume new lines
const pAnySpace : P.Parser<string> = P.regex(/[ \t]*/);

const pInt : P.Parser<number> = P
	.regex(/[0-9]+/)
	.skip(pAnySpace)
	.map(s => Number(s));


// Helper to parse a number before a book name, eg, in "1 John"
const pBookPrefixNumber : P.Parser<number> = P.alt(
	P.string("1st").map((x) => 1),
	P.string("2nd").map((x) => 2),
	P.string("3rd").map((x) => 3),
	P.string("First" ).map(() => 1),
	P.string("Second").map(() => 2),
	P.string("Third" ).map(() => 3),
	P.oneOf("123").map(x => parseInt(x)),
	P.oneOf("I").times(1,3).map(x => x.length),
);

// Parses a character that separates a chapter number from verse number
const pVerseSeparator : P.Parser<string> = P.oneOf(":v.").skip(pAnySpace);

// Parses a comma seperator, optionally followed by whitespace
const pCommaSeparator : P.Parser<string> = P.oneOf(',').skip(pAnySpace);

const pRangeSeparator : P.Parser<string> = P
	.optWhitespace
	.then(P.oneOf("-"))
	.skip(pAnySpace);

// Represents an integer or optionally a range of ints such as "5" or "5 - 7"
interface IntRange {
	start : number,
	end   : number | null,
};
const pIntRange : P.Parser<IntRange> = P.seq(
	pInt, pRangeSeparator.then(pInt).fallback(null)
).chain(([start, end]) => {
	if(end && end <= start){
		return P.fail("End of range must be higher than start");
	}
	return P.succeed({ start, end });
});


/**
 * Builds parsers for a given Versification scheme
 */
export function buildParsers(versification: Versification = VERSIFICATION) : Parsers {

	let book_name_to_id : { [ index: string ] : string } = {};
	for(let book of versification.order){
		[ book.name, ...book.aliases ].map(x => book_name_to_id[x.toLowerCase()] = book.id)
	}

	///////////////////////////////////////////////////////////////////////
	// Bible Book

	const pBookId : P.Parser<string> = P
		.regex(/([0-9A-Z]{3})\.?/i)
		.chain(x => {
			x = x.toUpperCase().substring(0,3);
			if(versification.book[x]){
				return P.succeed(x);
			} else {
				return P.fail(`Invalid book ID: ${x}`);
			}
		}).desc("USFM book identifier (eg: 'GEN', 'REV')");

	const pBookName : P.Parser<string> = P.alt(
		// Multiword book names
		P.regexp(/[Ss]ong\sof\s[Ss](ongs|olomon|ol)/).chain(x => P.succeed("SNG")),

		// Number followed by single word (eg: 1 Kings)
		P.seq(pBookPrefixNumber, pAnySpace, P.letters).chain(x => {
			let name = x[0] + ' ' + x[2].toLowerCase();
			let id   = book_name_to_id[name];
			if(id){ return P.succeed(id); }
			else  { return P.fail("Invalid book name: " + x); }
		}),

		// Single word book names
		P.regexp(/[A-Z]+/i).chain(x => {
			let id = book_name_to_id[x.toLowerCase()];
			if(id){ return P.succeed(id); }
			else  { return P.fail("Invalid book name: " + x); }
		})
	).desc("Book name (eg, 'Genesis', '2 Kings')");

	const rangeAliases = versification.rangeAliases.map(({ pattern, refs }) => (
		P.regexp(pattern).chain(x => P.succeed(refs))
	))
	const pRangeAlias : P.Parser<BibleRef[]> = P.alt(...rangeAliases);

	const pBook : P.Parser<string> = P.alt(pBookName, pBookId).skip(P.regexp(/\.? */));

	///////////////////////////////////////////////////////////////////////

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
			pInt.skip(pVerseSeparator),
			pInt,
			pRangeSeparator,
			pInt.skip(pVerseSeparator),
			pInt,
			(c1, v1, r, c2, v2) => { return { kind: "chapter_range", c1, v1, c2, v2 }; }
		),

		// Parses full chapters, eg "5", "5-8"
		pIntRange.notFollowedBy(pVerseSeparator).map((range) => {
			return { kind: "full_chapter", range };
		}),

		// Parses single chapter with verses, eg "5:8", "5:8-10",
		P.seqMap(
			pInt,
			pVerseSeparator.then(
				(pIntRange.notFollowedBy(pVerseSeparator)).sepBy1(pCommaSeparator)
			),
			(chapter : number, verses : IntRange[]) => {
				return { kind: "verse", chapter, verses };
			}
		)
	).notFollowedBy(
		// this requirement breaks an ambiguity in parsing something like:
		// "1Sam1,2Sam1
		//
		// Without it we parse
		// "1Sam1" -> valid ref
		// ",2"    -> valid ref (with previous context)
		// "Sam1"  -> invalid ref (no such book)
		P.regex(/[a-z]/i)
	);

	// Converts a parsed ChapterVerseSpecifier into a list of BibleRefs
	function chapterVerseSpecifierToBibleRef(book : string, cv : ChapterVerseSpecifier) : BibleRef[]{
		switch(cv.kind){
			case "full_chapter": {
				let start : number = cv.range.start;
				let end   : number = cv.range.end ? cv.range.end : cv.range.start;
				let last_verse = 1;
				if(versification.book[book][end] !== undefined){
					last_verse = versification.book[book][end].verse_count;
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
		P.seq(
			pBook,
			P.seq(pInt, pVerseSeparator.then(pInt).fallback(null)).fallback(null),
			pRangeSeparator,
			pBook,
			(pChapterVerseSpecifier.sepBy(pCommaSeparator)), // sepBy automatically falls back to []
		).chain(([b1, b1_extra, r, b2, b2_extra]) => {
			let results : BibleRef[] = [];

			let start = { book: b1, chapter: 1, verse: 1};
			if(b1_extra){
				let [c1, v1] = b1_extra;
				start.chapter = c1;
				if(v1 !== null) { start.verse = v1; }
			}

			let end = {
				book    : b2,
				chapter : versification.book[b2].chapters.length,
				verse   : 0
			};
			if(!b2_extra.length) {
				end.verse = versification.book[b2][end.chapter].verse_count;
				results.push({ is_range: true, start, end });
			} else {
				// The first item in the cv_list needs special handling, since the pChapterVerseSpecifier
				// allows for ranges - which are NOT allowed here
				// After handling the head of the cv_list we can fallback to the standard chapterVerseSpeciferToBibleRef
				const cv_first = b2_extra[0]!;
				switch(cv_first.kind) {
				case 'full_chapter':
					if(cv_first.range.end) {
						// This is a case like "Gen 1 - Exo 2-3" which makes no sense
						return P.fail('Double range encountered');
					}
					end.chapter = cv_first.range.start;
					end.verse = versification.book[b2][end.chapter].verse_count;
					results.push({ is_range: true, start, end });

					// consume head of cv_list fully!
					b2_extra.shift();
					break;
				case 'verse':
					if(cv_first.verses[0].end) {
						// This is a case Like "Gen 1 - Exo 2:3 - 4:5" which makes no sense
						return P.fail('Double range encountered');
					}
					end.chapter = cv_first.chapter;
					end.verse   = cv_first.verses[0].start;
					results.push({ is_range: true, start, end });
					// consume only first item in verse list, reset
					// is processed as normal
					cv_first.verses.shift();
					break;
				default:
					// this represents other range types
					return P.fail('Double range encountered')
				}
			}

			// consume extra items still left in cv_list
			for(let cv of (b2_extra || [])) {
				results = results.concat(chapterVerseSpecifierToBibleRef(b2, cv));
			}
			return P.succeed(results);
		}),

		// Ranges within a single chapter
		// EG: Gen 5:12-14
		P.seqMap(
			pBook,
			pChapterVerseSpecifier.sepBy(pCommaSeparator),
			(book : string, cv_list : ChapterVerseSpecifier[]) => {

				if(cv_list.length == 0){
					// Then we just got a book name, no chapter/verse
					let max_chapter : number = versification.book[book].chapters.length;
					let max_verse   : number = versification.book[book][max_chapter].verse_count;
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

		// A range of numbered books, eg, 1-2 Kings
		// These cannot have a cv specifier afterwards, IE: 1-2 Kings 3v4 doesn't make sense
		P.seq(
			pBookPrefixNumber,
			pRangeSeparator.then(pBookPrefixNumber),
			pAnySpace.then(P.letters)
		).chain(([ prefix_a, prefix_b, book ]: [ number, number, string ]) => {
			if(prefix_a === prefix_b) { return P.fail('Numbered book range must have different start to end'); }

			let name_a = prefix_a + ' ' + book.toLowerCase();
			let id_a = book_name_to_id[name_a];
			if(!id_a) { return P.fail(`Invalid book name: ${prefix_a} ${book.toLowerCase()}`); }

			let name_b = prefix_b + ' ' + book.toLowerCase();
			let id_b = book_name_to_id[name_b];
			if(!id_b) { return P.fail(`Invalid book name: ${prefix_b} ${book.toLowerCase()}`); }

			return P.succeed(_makeBookRange(versification, id_a, id_b));
		}),

		// A named range alias from the versification, eg "Old Testament"
		// As with numbered book ranges, these cannot have a cv specifier
		pRangeAlias,
	);

	const pBibleRef : P.Parser<BibleRef[]> = pBibleRefSingle
		.sepBy1(pAnySpace.then(P.oneOf(';_,')).then(pAnySpace))
		.map((list) => list.reduce((acc, x) => acc.concat(x), []));

	return {
		Book     : pBook,
		BibleRef : pBibleRef,
	}
}

export const DefaultParsers = buildParsers();
export default DefaultParsers;
