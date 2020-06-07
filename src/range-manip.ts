/**
 * Various utility functions for manipulating (sets of) ranges
 */

import { BibleRef, BibleVerse, BibleRange, BibleRefLibData } from './BibleRef';
import { Versification, BookMeta } from './Versification'
import * as Vidx from './vidx';

export interface RangeManipFunctions {
	splitByBook(refs: BibleRef | BibleRef[], expand_verses?: boolean) : BibleRef[];
	splitByChapter(refs: BibleRef | BibleRef[], expand_verses?: boolean) : BibleRef[];
	splitByVerse(refs: BibleRef | BibleRef[]) : BibleVerse[];
	iterateByBook   (refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleRef>;
	iterateByChapter(refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleRef>;
	iterateByVerse  (refs: BibleRef | BibleRef[]): Iterable<BibleVerse>;
	combineRanges(refs: BibleRef[]) : BibleRef[];
	makeRange(book : string, chapter?: number) : BibleRange;
	nextChapter(ref: BibleRef, constrain_book?: boolean) : BibleRange | null;
	previousChapter(ref: BibleRef, constrain_book?: boolean) : BibleRange | null;
	nextBook(ref: BibleRef) : BibleRange | null;
	previousBook(ref: BibleRef) : BibleRange | null;
	isFullBook(ref: BibleRef) : boolean;
	isFullChapter(ref: BibleRef) : boolean;
};

/**
 * Creates a [[BibleRange]] representing either an entire book, or
 * an entire chapter
 * @note This function will throw if the specified book is not a
 * valid book ID, or if the specified chapter is too high
 *
 * @param this - Any object with a `versification` field
 */
export function makeRange(this: BibleRefLibData, book : string, chapter? : number) : BibleRange {
	let v = this.versification;
	return _makeRange(this.versification, book, chapter);
}

/**
 * Generates the most compressed representation possible of some set of
 * [[BibleVerse]]s/[[BibleRange]]s by combining adjacent or overlapping ranges into
 * larger ones
 *
 * For example, an input list of "Gen 1", "Gen 2", "Gen 3", would produce a
 * single [[BibleRange]] for "Gen 1-3"
 *
 * Order of input ranges in unimportant, since this functional will interally
 * call [[sort]] first
 */
export function combineRanges(this: BibleRefLibData, refs: BibleRef[]) : BibleRef[]{
	let v = this.versification;

	// Convert BibleRefs into vidx pairs representing the range
	let ranges : [number,number][] = refs
		.map((x) => x.is_range ? x : { is_range: true, start: x, end: x })
		.map((x) => [ Vidx.toVidx(v, x.start), Vidx.toVidx(v, x.end) ]);

	// Sort ranges based on start
	ranges.sort((a,b) => a[0] - b[0]);

	// Combine all ranges
	let out_ranges : [number,number][] = [];
	let cur_r : [number,number] | null = null;
	for(let new_r of ranges){
		if(cur_r == null){
			cur_r = new_r;
			continue;
		}

		if(new_r[0] > cur_r[1]+1){
			// then no overlap
			out_ranges.push(cur_r);
			cur_r = new_r;
			continue;
		}

		// expand the current cur_r to end at the end of the new one
		if(new_r[1] > cur_r[1]){ cur_r[1] = new_r[1] };
	}
	if(cur_r){ out_ranges.push(cur_r); }


	// Convert vidx pairs back into BibleRefs
	return out_ranges.map((r) => {
		if(r[0] == r[1]){
			return Vidx.fromVidx(v, r[0]);
		} else {
			return { is_range: true,
							 start : Vidx.fromVidx(v, r[0]),
							 end   : Vidx.fromVidx(v, r[1]),
						 };
		}
	});
}

/**
 * Splits an array of ranges such that any input range spanning multiple
 * books is subdivided into multiple smaller ranges, one for each book
 * @param refs - The list of refs to be split
 * @param expand_verses - If set then even single verses will be represented
 * as ranges of length 1, ensuring all returned objects have the same schema
 */
export function splitByBook(this: BibleRefLibData,
										 refs: BibleRef | BibleRef[],
										 expand_verses?: boolean
										) : BibleRef[] {
	return Array.from(iterateByBook.bind(this)(refs, expand_verses));
}

/**
 * Splits an array of ranges such that any input range spanning multiple
 * chapters is subdivided into multiple smaller ranges, one for each chapter
 * @param refs - The list of refs to be split
 * @param expand_verses - If set then even single verses will be represented
 * as ranges of length 1, ensuring all returned objects have the same schema.
 */
export function splitByChapter(this: BibleRefLibData,
												refs: BibleRef | BibleRef[],
												expand_verses?: boolean) : BibleRef[]{
	return Array.from(iterateByChapter.bind(this)(refs, expand_verses));
}

/**
 * Splits an array of ranges to form an array of individual verses
 * @param refs - The list of refs to be split
 */
export function splitByVerse(this: BibleRefLibData, refs: BibleRef | BibleRef[]) : BibleVerse[]{
	return Array.from(iterateByVerse.bind(this)(refs));
}

/**
 * Returns an iterator that traverses over the objects that would have been
 * returned by `splitByBook`
 */
export function iterateByBook(this: BibleRefLibData, refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleRef> {
	if(expand_verses === undefined){ expand_verses = false; }
	if(!('length' in refs)){ refs = [refs]; }
	return _iterateBookRanges(this.versification, refs, expand_verses)
}


/**
 * Returns an iterator that traverses over the objects that would have been
 * returned by `splitByChapter`
 */
export function iterateByChapter(this: BibleRefLibData, refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleRef> {
	if(expand_verses === undefined){ expand_verses = false; }
	if(!('length' in refs)){ refs = [refs]; }
	return _iterateChapterRanges(this.versification, refs, expand_verses);
}

/**
 * Returns an iterator that traverses over the objects that would have been
 * returned by `splitByVerse`
 */
export function iterateByVerse(this: BibleRefLibData, refs: BibleRef | BibleRef[]): Iterable<BibleVerse> {
	if(!('length' in refs)){ refs = [refs]; }
	return _iterateVerses(this.versification, refs);
}

/**
 * Given a BibleRef, returns a new BibleRef which represents the next chapter
 * after the last verse in the input ref.
 * @param constrain_book - If true, will not cross book boundaries to find another chapter
 * @return BibleRef or null if there is no next chapter
 */
export function nextChapter(this: BibleRefLibData, ref: BibleRef, constrain_book?: boolean) : BibleRange | null {
	let r : BibleVerse = ref.is_range ? ref.end : ref;

	let cur_book = this.versification.book[r.book];
	if(cur_book === undefined){
		throw new Error("Invalid input reference!");
	}

	if(r.chapter < cur_book.chapters.length){
		return _makeRange(this.versification, r.book, r.chapter + 1);
	} else {
		if(constrain_book){ return null; }
		if(cur_book.index+1 < this.versification.order.length){
			return _makeRange(this.versification, this.versification.order[cur_book.index+1].id, 1);
		} else {
			return null;
		}
	}
}

/**
 * Returns BibleRef representing the range of verses making up the chapter
 * BEFORE the first verse of the input ref
 * @param constrain_book - If true, will not cross book boundaries to find another chapter
 * @return BibleRef or null if there is no previous chapter
 */
export function	previousChapter(this: BibleRefLibData, ref: BibleRef, constrain_book?: boolean) : BibleRange | null{
	let r : BibleVerse = ref.is_range ? ref.start : ref;

	let new_book_id = r.book;
	let new_chapter = 0;

	if(r.chapter <= 1){
		if(constrain_book){ return null; }
		let old_book = this.versification.book[r.book];
		if(old_book === undefined){ throw new Error("Invalid input reference"); }
		if(old_book.index === 0){ return null; }
		let new_book = this.versification.order[old_book.index-1];
		new_book_id = new_book.id;
		new_chapter = new_book.chapters.length;
	} else {
		new_chapter = r.chapter - 1;
	}

	return _makeRange(this.versification, new_book_id, new_chapter);
}

/**
 * Given a BibleRef, returns a new BibleRef which represents the range of verses making up
 * the next book after the book containing the last verse in the input range
 * @return BibleRef or null if there is no next book (IE: input is revelation)
 */
export function nextBook(this: BibleRefLibData, ref: BibleRef) : BibleRange | null {
	let r : BibleVerse = ref.is_range ? ref.end : ref;

	let cur_book = this.versification.book[r.book];
	if(cur_book.index+1 < this.versification.order.length){
		return _makeRange(this.versification, this.versification.order[cur_book.index+1].id);
	} else {
		return null;
	}
}

/**
 * Given a BibleRef, returns a new BibleRef which represents the range of verses making up
 * the book before the book containing the first verse in the input range
 * @return BibleRef or null if there is no previous book (IE: input is genesis)
 */
export function previousBook(this: BibleRefLibData, ref: BibleRef) : BibleRange | null {
	let r : BibleVerse = ref.is_range ? ref.start : ref;

	let cur_book = this.versification.book[r.book];
	if(cur_book.index > 0){
		return _makeRange(this.versification, this.versification.order[cur_book.index-1].id);
	} else {
		return null;
	}
}

/**
 * Determines if a [[BibleRef]] is in fact just a single [[BibleRange]] which represents **exactly**
 * the entirety of a single book - no more, no less
 * @return Boolean representing decision
 */
export function isFullBook(this: BibleRefLibData, ref: BibleRef) : boolean {
	if(!ref.is_range){ return false; }

	let book_id = ref.start.book;
	if(ref.end.book != book_id){ return false; }

	return (
		ref.start.chapter === 1 &&
			ref.start.verse   === 1 &&
			ref.end.chapter   === this.versification.book[book_id].chapters.length &&
			ref.end.verse     === this.versification.book[book_id][ref.end.chapter].verse_count
	);
}

/**
 * Determines if a [[BibleRef]] is in fact just a single [[BibleRange]] which represents **exactly**
 * the entirety of a single chapter - no more, no less
 * @return Boolean representing decision
 */
export function isFullChapter(this: BibleRefLibData, ref: BibleRef) : boolean {
	if(!ref.is_range){ return false; }

	let book_id = ref.start.book;
	if(ref.end.book != book_id){ return false; }

	return (
		ref.start.chapter === ref.end.chapter &&
	  ref.start.verse   === 1 &&
		ref.end.verse     === this.versification.book[book_id][ref.start.chapter].verse_count
	);
}

////////////////////////////////////////////////////////////////////
//
// Private Implementation Functions
//
////////////////////////////////////////////////////////////////////

function _makeRange(v: Versification, book : string, chapter? : number) : BibleRange {
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

function* _iterateBookRanges(v: Versification, refs: BibleRef[], verse_as_range: boolean) : Iterable<BibleRef> {
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
			yield _makeRange(v, v.order[bi].id);
		}

		// yield the final book, from chapter 1 verse 1, to the defined end point
		yield { is_range: true,
						start: { book: cur.end.book, chapter: 1, verse: 1 },
						end  : cur.end
					};
	}
}


function* _iterateChapterRanges(v: Versification, refs: BibleRef[], verse_as_range: boolean) : Iterable<BibleRef> {
	for(let cur of _iterateBookRanges(v, refs, verse_as_range)){
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
			yield _makeRange(v, b_meta.id, ci);
		}

		// yield the final chapter from verse 1, to the defined end point
		yield { is_range: true,
						start: { book, chapter: cur.end.chapter, verse: 1 },
						end  : cur.end
					};
	}
}

function* _iterateVerses(v: Versification, refs: BibleRef[]) : Iterable<BibleVerse> {
	for(let cur of _iterateChapterRanges(v, refs, false)){
		if(cur.is_range){
			for(let v = cur.start.verse; v <= cur.end.verse; ++v){
				yield { book: cur.start.book, chapter: cur.start.chapter, verse: v };
			}
		} else {
			yield cur;
		}
	}
}
