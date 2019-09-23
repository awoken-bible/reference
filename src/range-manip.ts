/**
 * Various utility functions for manipulating (sets of) ranges
 */

import { BibleRef, BibleVerse, BibleRange }    from './BibleRef';
import { Versification, BookMeta } from './Versification'
import * as Vidx from './vidx';


export function makeRange(v: Versification, book : string, chapter? : number) : BibleRange {
	let b_meta = v.book[book];
	if(b_meta == null){ throw new Error("Specified book id does not exist"); }
	if(chapter){
		if(chapter > b_meta.chapters.length){
			throw new Error("Specified chapter index is too high");
		}
		return {
			is_range: true,
			start   : { book, chapter, verse: 1 },
			end     : { book, chapter, verse: b_meta.chapters[chapter-1].verse_count }
		};
	} else {
		return {
			is_range: true,
			start   : { book, chapter: 1, verse: 1 },
			end     : { book,
									chapter: b_meta.chapters.length,
									verse: b_meta.chapters[b_meta.chapters.length-1].verse_count
								}
		};
	}
}


export function* iterateBookRanges(v: Versification, refs: BibleRef[], verse_as_range: boolean) {
	for(let cur of refs){
		if(!cur.is_range){
			// single verse
			if(verse_as_range){
				yield { is_range: true, start: cur, end: cur };
			} else {
				yield cur;
			}
			continue;
		}

		if(cur.start.book == cur.end.book){
			// then the range contains only a single book already, return it
			yield cur;
			continue;
		}

		// if still going we have a cross book range, split at boundries

		// Yeild the first book from the defined start point, to the end of the book
		let last_c = v.book[cur.start.book].chapters.length;
		let last_v = v.book[cur.start.book].chapters[last_c-1].verse_count;
		yield { is_range: true,
						start : cur.start,
						end   : { book: cur.start.book, chapter: last_c, verse: last_v },
					};

		// yield all complete books
		for(let bi = v.book[cur.start.book].index+1; bi < v.book[cur.end.book].index; ++bi){
			yield makeRange(v, v.order[bi].id);
		}

		// yield the final book, from chapter 1 verse 1, to the defined end point
		yield { is_range: true,
						start: { book: cur.end.book, chapter: 1, verse: 1 },
						end  : cur.end
					};
	}
}


export function* iterateChapterRanges(v: Versification, refs: BibleRef[], verse_as_range: boolean) {
	for(let cur of iterateBookRanges(v, refs, verse_as_range)){
		if(!cur.is_range){
			yield cur;
			continue;
		}

		if(cur.start.chapter == cur.end.chapter){
			// then we have only a single chapter anyway
			yield cur;
			continue;
		}

		// then we have a cross chapter range, emit each individually
		let book    = cur.start.book;
		let b_meta = v.book[book];

		// Yeild the first chapter from the defined start point, to the end of the chapter
		let last_v = b_meta.chapters[cur.start.chapter-1].verse_count;
		yield { is_range: true,
						start : cur.start,
						end   : { book, chapter: cur.start.chapter, verse: last_v },
					};

		// Yield all complete chapters
		for(let ci = cur.start.chapter+1; ci < cur.end.chapter; ++ci){
			yield makeRange(v, b_meta.id, ci);
		}

		// yield the final chapter from verse 1, to the defined end point
		yield { is_range: true,
						start: { book, chapter: cur.end.chapter, verse: 1 },
						end  : cur.end
					};
	}
}

export function* iterateVerses(v: Versification, refs: BibleRef[]){
	for(let cur of iterateChapterRanges(v, refs, false)){
		if(cur.is_range){
			for(let v = cur.start.verse; v <= cur.end.verse; ++v){
				yield { book: cur.start.book, chapter: cur.start.chapter, verse: v };
			}
		} else {
			yield cur;
		}
	}
}



		/*

function _expandToChapters(v: Versification, refs: BibleRef[]) : BibleRef[] {
	let results : BibleRef[] = [];


	let results : BibleVerse[] = [];


}

function _expandToVerses(v: Versificaton, refs: BibleRef[]) : BibleVerse[] {
	let chpts = _expandToChaters();

	let results : BibleVerse[] = [];

	return results;
}

*/

/**
 * Expands a range into a simpler object for iteration by splitting cross
 * chapter ranges into multiple single chapter ranges, or all ranges into
 * BibleVerse instances
 */

		/*
export function expandRanges(v: Versification,
														 refs: BibleRef[],
														 collate_chapter? : boolean){
	if(collate_chapters){
		return _expandToChapters(v, refs);
	} else {
		return _expandToVerses(v, refs);
	}

}

		*/
