/**
 * Various utility functions for manipulating (sets of) ranges
 */

import { BibleRef, BibleVerse, BibleRange }    from './BibleRef';
import { Versification, BookMeta } from './Versification'
import * as Vidx from './vidx';


export function makeRange(v: Versification, book : string, chapter? : number) : BibleRange{
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
