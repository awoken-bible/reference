/**
 * Specialized version of parser designed to much more rapidly parse url encoded verse refs
 */

import { BibleRef, BibleRefLibData } from './BibleRef';
import { makeRange } from './range-manip';

const CHAR_CODE_0 = '0'.charCodeAt(0);
const CHAR_CODE_9 = '9'.charCodeAt(0);

export function parseUrlEncoded(this: BibleRefLibData, raw: string): BibleRef[] {
	//console.log('hello world');
	let results : BibleRef[] = [];

	// what is the active book in this block?
	let book = null;

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

	const BKS = this.versification.book;

	let idx = 0;

	function consumeInt(error: string) {
		let out : any = null;
		while(true) {
			let code = raw.charCodeAt(idx);
			if(code >= CHAR_CODE_0 && code <= CHAR_CODE_9){
				out = 10*out + (code-CHAR_CODE_0);
				++idx;
			} else {
				break;
			}
		}
		if(error && !out) { throw new Error(error); }
		return out;
	}

	const mkR = makeRange.bind(this);

	//console.log('parsing: ' + raw);
	top: while(idx < raw.length) {
		//	console.log('--------------');
		//console.log(raw.substring(idx));
		let book = raw.substring(idx, idx+3).toUpperCase();
		idx += 3;
		if(!BKS[book]) {
			throw new Error('Failed to parse url BibleRef, wanted book id, got: ' + book);
		}

		let bSep = raw.charAt(idx);
		//console.log('bSep: ' + bSep + ', rest: ' + raw.substring(idx));
		if(bSep === '_' || bSep === '' ) {
			results.push(mkR(book));
			continue top;
		}

		// where the current chapter-verse specifier started
		let cvStartIdx = idx;
		// current chaper context
		let chapter : number | null = null;

		parseChapterVerse: while(true) {
			//console.log('Loop');
			// parse an extra nums and seps
			//
			// _ is used as seperator to reset to top:
			// hence if idx is beyond end of raw, we use _ instead of the returned empty string
			nums.push(consumeInt(`Expected int or _ seperator or end of string at char ${idx}, got: raw.charAt(idx)`));
			let nextSep = (raw.charAt(idx++) || '_');

			//console.dir({ seps, nums, nextSep });

			let matched = true;

			if(seps === '') {
				switch(nextSep){
				case 'v': // update the current chapter context, emit nothing
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

			//console.log("  NO MATCH");
			seps += nextSep;
		}
	}

	//console.dir(results);

	return results;
}
