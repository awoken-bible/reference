/**
 * Contains various utility functions related to converting BibleVerse's to and
 * from "Verse Indexes" (IE: VIDX)
 */

import { Versification } from './Versification';
import { BibleRef, BibleVerse, BibleRange } from './BibleRef';

/**
 * Converts a BibleVerse to a "Verse Index" which would be the 0-based index of
 * the verse in an array contain all verse of the bible
 */
export function toVidx(versification: Versification, verse: BibleVerse) : number {
	return versification.book[verse.book][verse.chapter].cumulative_verse + verse.verse - 1;
}

export function fromVidx(versification: Versification, vidx: number) : BibleVerse {
	// First identify the book containing the CVID by linear search of the books
	// only 66 books so performance is fine
	let b_idx;
	for(b_idx = 1; b_idx < versification.order.length; ++b_idx){
		if(versification.order[b_idx].chapters[0].cumulative_verse > vidx){
			break;
		}
	}
	--b_idx;

	let book = versification.order[b_idx];

	// Now find the chapter, again by linear search, but even longest book (Psalms)
	// has only 150 chapters, so performance is fine
	let c_idx;
	for(c_idx = 1; c_idx < book.chapters.length; ++c_idx){
		if(book.chapters[c_idx].cumulative_verse > vidx){
			break;
		}
	}
	--c_idx;

	// +1's here since chapters and verses not indexed from 0
	return { book    : book.id,
					 chapter : c_idx + 1,
					 verse   : vidx - book.chapters[c_idx].cumulative_verse + 1,
				 };
}


/**
 * Counts the total number of verses expressed by a BibleRef
 */
export function countVerses(v : Versification, ref : BibleRef) : number {
	if(ref.is_range){
		// +1 since we include both start and end, and adjacent verses have vidx's
		// differing by 1
		return toVidx(v, ref.end) - toVidx(v, ref.start) + 1;
	} else {
		return 1;
	}
}

/**
 * Comapres two verses returning negative, zero or postive as per the array.sort
 * compareFunction requirements
 */
export function comparator(v : Versification, a: BibleVerse, b: BibleVerse) : number {
	return toVidx(v, a) - toVidx(v, b);
}


/**
 * Takes a list of BibleRefs and returns a new list containing just the first N
 * verses from the set
 */
export function firstNVerses(v    : Versification,
														 refs : BibleRef[],
														 n    : number
														) : BibleRef[] {
	if(n === 0 || refs.length === 0){
		return [];
	}

	if (refs.length === 1){
		let ref = refs[0];

		let count = countVerses(v, ref);
		if(count <= n){ return refs; }

		// Logically we MUST be left with a range now, since if n === 0 we would
		// have already returned, hence n > 0
		// If ref is a BibleVerse then count = 1, hence count >= n, hence
		// we have just returned
		// But typescript can't do that sort of inference, so we force it here
		let range : BibleRange = ref as BibleRange;

		if(n == 1){ return [range.start]; }

		// Now we simply get the v_idx of the start, advance by n, and convert
		// back to a verse
		return [{ is_range : true,
							start    : range.start,
							end      : fromVidx(v, toVidx(v, range.start) + n - 1),
						}];
	}

	// If we're still going then we have multiple BibleRef instances to consider
	// We can simply go thorugh the list, adding each ref in turn until we run
	// out of verses
	// The final entry is trimmed to the length of the remaining allowance
	// using firstNVerses (although the refs.length === 1 case will be hit)
	let result : BibleRef[] = [];
	let used = 0;
	for(let i = 0; i < refs.length && used < n; ++i){
		let more = firstNVerses(v, [refs[i]], n - used);
		used += countVerses(v, more[0]);
		result.push(more[0]);
	}
	return result;
}
