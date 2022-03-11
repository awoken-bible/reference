/**
 * Specialized version of parser designed to much more rapidly parse url encoded verse refs
 */

import { BibleRef, BibleRefLibData } from './BibleRef';
import { makeRange } from './range-manip';

/**
 * Function to parse data written using [[format]] with the 'url' preset
 * This operates ~20x faster than the generic parser and guarantied to produce the
 * exact same output as standard [[parseOrThrow]] on good input. Behaviour is undefined
 * on bad input - some checks are omitted for increased performance which may cause
 * this function to return garbage output when [[parseOrThrow]] would have thrown
 *
 * For reference, a 5.5kb url-encoded [[BibleRef]] string takes 1.5ms to parse with
 * this function, or 30ms to parse with the generic parser.
 * The equivalent JSON representation of the data is 72kb, but can be parsed
 * in ~0.7ms using the native JSON.parse function
 */
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
			if(seps === '' && nextSep === 'v') {
				// if first sep in a region is a v, the just update the current chapter
				// context but emit nothing
				chapter = nums.shift()!;
				continue parseChapterVerse;
			}

			// if we're closing a region then try and emit data
			if(nextSep === ',' || nextSep === '_') {
				switch(seps) {
				case '': // gen1 or gen1v1
					results.push(chapter ? { book, chapter, verse: nums.shift()! } : mkR(book, nums.shift()!) );
					break;
				case '-':
					if(chapter) { // gen1v2-3,
						results.push({ is_range: true, start: { book, chapter, verse: nums.shift()! }, end: { book, chapter, verse: nums.shift()! }});
					} else { // gen1-2,
						results.push({ is_range: true, start: { book, chapter: nums.shift()!, verse: 1}, end: mkR(book, nums.shift()!).end});
					}
					break;
				case '-v':
					// this could either be gen1v2-3v4 or gen1-2v3 depending on if the
					// chapter variable is set
					// The later is invalid input, so in the spirit of being fast on good
					// input, we don't bother checking!
					results.push({
						is_range: true,
						start: { book, chapter: chapter!, verse: nums.shift()! },
						end: { book, chapter: nums.shift()!, verse: nums.shift()! }
					});
					break;
				default:
					seps += nextSep;
					continue parseChapterVerse;
				}
			} else {
				seps += nextSep;
				continue parseChapterVerse;
			}

			// if still going, we must have emitted some data...
			seps = '';
			if(nextSep === '_') { continue top; }
		}
	}

	return results;
}
