/**
 * Specialized version of parser designed to much more rapidly parse url encoded verse refs
 */

import { BibleRef, BibleRefLibData } from './BibleRef';
import { makeRange } from './range-manip';

export function parseUrlEncoded(this: BibleRefLibData, raw: string): BibleRef[] {
	const BKS = this.versification.book;
	let results : BibleRef[] = [];

	// variables to store context of the book/chapter for ranges/comma lists
	let book    : string | null = null;
	let chapter : number | null = null;

	// queues of values and placeholders being processed
	// we only emit values to results once the sequence of
	// seperators is unambigious
	// eg 1v2-3
	// (sequence seperator v-) is ambigious since
	// it could be:
	// - chapter 1v2-3
	// - chapter 1v2, chapter 3v(next item to read)
	// seps is a string so we can compare whole list in one go ('v-' == seps rather than seps[0] === 'v' && ...)
	let nums : number[] = [];
	let seps : string   = '';

	// next char index of 'raw' to process
	let idx = 0;

	function consumeInt() : number | null {
		// in testing, using the built in parseInt and substring
		// is faster than iterating character by character and builing our own int
		let out = parseInt(raw.substring(idx));
		if(out) {
			idx += `${out}`.length;
			return out;
		} else {
			return null;
		}
	}
	const mkR = makeRange.bind(this);

	top: while(idx < raw.length) {
		// parse book name
		let book = raw.substring(idx, idx+3).toUpperCase();
		idx += 3;
		if(!BKS[book]) {
			throw new Error('Failed to parse url BibleRef, wanted book id, got: ' + book);
		}

		// clear out existing context for the new book
		chapter = null;

		// restart loop immediately if we've reached end of block
		if((raw.charAt(idx) || '_') === '_') {
			results.push(mkR(book));
			continue top;
		}

		// record where the current chapter-verse specifier started to make error messages
		let cvStartIdx = idx;

		parseChapterVerse: while(true) {
			// on each iteration of the loop we consider one more number and following seperator
			// _ is used as seperator to reset to top:
			// hence if idx is beyond end of raw, we use _ instead of the returned empty string
			let int = consumeInt();
			let nextSep = (raw.charAt(idx++) || '_');

			if(int){
				nums.push(int);
			} else {
				if(seps === '-') {
					// then this must be a cross-book range
					let book2 = (nextSep + raw.substring(idx, idx+2)).toUpperCase();
					idx+=2;
					if(!BKS[book2]) {
						throw new Error('Invalid book id in close of cross-book range, got: ' + book2);
					}

					// we need to parse optional chapter and verse number, but we
					// don't allow any continuation after them, so this is simple
					// (eg, gen1v2-exo3v4,5 is invalid)
					let start : BibleRef = chapter ? { book, chapter: chapter, verse: nums.shift()! } : { book, chapter: nums.shift() || 1, verse: 1 };

					//console.log("About to parse cross-book range closer cv spec: " + raw.substring(idx));
					let chapter2 = consumeInt();

					let end : BibleRef = chapter2 ? mkR(book2, chapter2).end : mkR(book2).end;
					if(chapter2 && raw.charAt(idx) === 'v') {
						++idx;
						end.verse = consumeInt()!;
						if(!end.verse) {
							throw new Error("Expected integer after 'v' seperator in closing cross-book range");
						}
					}
					results.push({ is_range: true, start, end });
					continue top;
				}
			} // end of cross-book range parsing

			// try and consume the head of the nums/seps lists
			// only doing so if the sequence of seperators so far is unambigious
			// eg, gen1v3-5 (IE: seperators 'v-') is ambigious, since it could be
			// - chapter 1 v 3-5
			// - chapter 1v3 - 5v(?? to read next ??)
			let matched = true;
			if(seps === '') {
				switch(nextSep){
				case 'v': // update the current chapter context, but emit nothing
					chapter = nums.shift()!;
					break;
				case ',':
				case '_':
					results.push(chapter ? { book, chapter, verse: nums.shift()! } : mkR(book, nums.shift()!) );
					break;
				default:
					matched = false;
					break;
				}
			} else if(seps === '-' && ( nextSep === ',' || nextSep === '_')) {
				if(chapter) { // gen1v2-3,
					results.push({ is_range: true, start: { book, chapter, verse: nums.shift()! }, end: { book, chapter, verse: nums.shift()! }});
				} else { // gen1-2,
					results.push({ is_range: true, start: { book, chapter: nums.shift()!, verse: 1}, end: mkR(book, nums.shift()!).end});
				}
			} else if(seps === '-v' && (nextSep === ',' || nextSep === '_')) {
				if(chapter) { // gen1v2-3v4
					results.push({
						is_range: true,
						start: { book, chapter, verse: nums.shift()! },
						end: { book, chapter: nums.shift()!, verse: nums.shift()! }
					});
					chapter = null;
				} else { // gen1-2v3
					throw new Error('Invalid chapter-verse specifier: ' + raw.substring(cvStartIdx, idx));
				}
			} else {
				matched = false;
			}

			if(matched){
				seps = '';
				cvStartIdx = idx;
				if(nextSep === '_') { continue top; } else { continue parseChapterVerse; }
			}

			seps += nextSep;
		}
	}

	return results;
}
