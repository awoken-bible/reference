/**
 * Specialized version of parser designed to much more rapidly parse url encoded verse refs
 */

import { BibleRef, BibleRefLibData } from './BibleRef';
import { makeRange } from './range-manip';

const CHAR_CODE_0 = '0'.charCodeAt(0);
const CHAR_CODE_9 = '9'.charCodeAt(0);

export function parseUrlEncoded(this: BibleRefLibData, raw: string): BibleRef[] {
	console.log('hello world');
	let results : BibleRef[] = [];
	let curBook  = null;
	let curChpt  = null;
	let curVerse = null;

	const BKS = this.versification.book;


	let idx = 0;

	function consumeInt() {
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
		return out;
	}

	const mkR = makeRange.bind(this);

	console.log('parsing: ' + raw);
	top: while(idx < raw.length) {
		console.log('--------------');
		console.log(raw.substring(idx));
		let curBook = raw.substring(idx, idx+3).toUpperCase();
		idx += 3;
		if(!BKS[curBook]) {
			throw new Error('Failed to parse url BibleRef, wanted book id, got: ' + curBook);
		}

		let bSep = raw.charAt(idx);
		console.log('bSep: ' + bSep + ', rest: ' + raw.substring(idx));
		if(bSep === '_' || bSep === '' ) {
			results.push(mkR(curBook));
			continue top;
		}

		chpt: while(true) {
			curChpt = consumeInt();
			if(!curChpt) {
				throw new Error(`Expected chpt number or _ seperator at char ${idx}, got: raw.charAt(idx)`);
			}

			console.log('got chpt: ' + curChpt);
			console.log(raw.substring(idx));


			let cSep = raw.charAt(idx++);
			switch(cSep) {
			case '': // end of string
				results.push(mkR(curBook, curChpt));
				break top;
			case ',': // seperator for new chapter value
				results.push(mkR(curBook, curChpt));
				continue chpt;
			case '-': { // range of full chapters
				let endChpt = consumeInt();
				if(!endChpt) { throw new Error(`Expected end of chapter range int at ${idx}, got: ${raw.charAt(idx)}`); }
				results.push({ is_range: true, start: mkR(curBook, curChpt).start, end: mkR(curBook, endChpt).end });
				let c = raw.charAt(idx++);
				if(c === ',') { continue chpt; }
				continue top;
			}
			case 'v': {
				verse: while(true) {
					let v1 = consumeInt();
					console.log('got verse ' + v1 + ', rest: ' + raw.substring(idx));
					if(!v1) {
						throw new Error(`Expected verse number at ${idx}, got: ${raw.charAt(idx)}`);
					}
					let vSep = raw.charAt(idx++);
					console.log('vSep: ' + vSep + ', rest: ' + raw.substring(idx));
					switch(vSep) {
					case '': // end of string
					case '_':
						results.push({ book: curBook, chapter: curChpt, verse: v1 });
						continue top;
					case ',': // seperator for new verse specifier
						results.push({ book: curBook, chapter: curChpt, verse: v1 });
						continue verse;
					case '-': { // verse range
						let v2 = consumeInt();
						if(!v2) { throw new Error(`Expected ending verse in range at ${idx}, got: ${raw.charAt(idx)}`); }
						results.push({ is_range: true, start: { book: curBook, chapter: curChpt, verse: v1}, end: { book: curBook, chapter: curChpt, verse: v2 }});
						let c = raw.charAt(idx++);
						if(c === ',') { continue verse; }
						continue top;
					}
					default:
						throw new Error('Unexpected seperator in verse specifier: ' + vSep);
					}
				}
			}
			default:
				throw new Error('Unexpected seperator in chapter specifier: ' + cSep);
			}
		}
	}

	console.dir(results);

	return results;
}
