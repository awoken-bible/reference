import VERSIFICATION from './Versification';
import BibleRef      from './BibleRef';
import * as P from 'parsimmon';


let book_name_to_id      : { [ index: string ] : string } = {};
for(let book of VERSIFICATION.order){
	let ns = [ book.name, ...book.aliases ].map(n => n.toLowerCase());
	for(let n of ns){
		book_name_to_id[n] = book.id;
	}

	let name = book.name.toLowerCase();
	book_name_to_id[book.name.toLowerCase()] = book.id;
}

const pInt : P.Parser<number> = P
	.regex(/[0-9]+/)
	.skip(P.optWhitespace)
	.map(s => Number(s));

///////////////////////////////////////////////////////////////////////
// Bible Book

const pBookId : P.Parser<string> = P
	.regex(/[0-9A-Z]{3}/i)
	.chain(x => {
		x = x.toUpperCase();
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
	P.string("Song of Solomon").chain(x => P.succeed("SNG")),
	P.string("song of solomon").chain(x => P.succeed("SNG")),
	P.string("Song of songs"  ).chain(x => P.succeed("SNG")),
	P.string("song of songs"  ).chain(x => P.succeed("SNG")),

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

const pBook : P.Parser<string> = P.alt(pBookName, pBookId).skip(P.optWhitespace);

///////////////////////////////////////////////////////////////////////

// Parses a character that seperates a chapter number from verse number
const pVerseSeperator : P.Parser<string> = P.oneOf(":v.").skip(P.optWhitespace);

// Parses a comma seperator, optionally followed by whitespace
const pCommaSeperator : P.Parser<string> = P.oneOf(',').skip(P.optWhitespace);

const pRangeSeperator : P.Parser<string> = P
	.optWhitespace
	.then(P.oneOf("-"))
	.skip(P.optWhitespace);

// Represents an integer or optionally a range of ints such as "5" or "5 - 7"
interface IntRange {
	start : number,
	end   : number | null,
};
const pIntRange : P.Parser<IntRange> = P.seqMap(
	pInt,
	pRangeSeperator.then(pInt).fallback(null),
	(start : number, end: number | null) => { return { start, end }; }
);

// Parses a chapter/verse reference such as:
// full_chapters:
// 5         :: full chapter
// 5-8       :: chapter range
//
// verse:
// 5:6       :: single verse
// 5:6,12    :: multiple verses
// 5:6-12    :: range of verses
//
// Comma seperated list:
// 5:6-12,14 :: multiple ranges/verses
type ChapterVerseSpecifier = {
	kind: "full_chapter",
	range: IntRange
} | {
	kind    : "verse",
	chapter : number,
	verses  : IntRange[],
};
const pChapterVerseSpecifier : P.Parser<ChapterVerseSpecifier> = P.alt(
	// Parses full chapters, eg "5", "5-8"
	pIntRange.notFollowedBy(pVerseSeperator).map((range) => {
		return { kind: "full_chapter", range };
	}),

	// Parses single chapter with verses, eg "5:8", "5:8-10",
	P.seqMap(
		pInt,
		pVerseSeperator.then(
			(pIntRange.notFollowedBy(pVerseSeperator)).sepBy(pCommaSeperator)
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
			return [{
				is_range: true,
				start : { book, chapter: start, verse: 1 },
				end   : { book, chapter: end,   verse: VERSIFICATION.book[book][end] },
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
	}
}

const pBibleRefSingle : P.Parser<BibleRef[]> = P.alt(
	// Ranges accross chapters
	P.seqMap(
		pBook,
		P.seq(pInt, pVerseSeperator.then(pInt).fallback(null)),
		pRangeSeperator,
		pBook,
		P.seq(pInt, pVerseSeperator.then(pInt).fallback(null)),
		(b1, [c1, v1], r, b2, [c2, v2]) => {
			 if(v1 == null) { v1 = 1; }
			 if(v2 == null) { v2 = VERSIFICATION.book[b2][c2]; }

			 return [{ is_range: true,
								 start : { book: b1, chapter: c1, verse: v1 },
								 end   : { book: b2, chapter: c2, verse: v2 },
							 }];
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
				let max_chapter = VERSIFICATION.book[book].chapter_count;
				let max_verse   = VERSIFICATION.book[book][max_chapter];
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
	.sepBy1(P.optWhitespace.then(P.oneOf(';')).then(P.optWhitespace))
	.map((list) => list.reduce((acc, x) => acc.concat(x), []));


let Api = {
	parse : (str : string) => pBibleRef.parse(str),

	parser : pBibleRef,
	parser_book: pBook,

};
export default Api;