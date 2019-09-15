/**
 * Contains utilities to print a BibleRef as a string
 */

import VERSIFICATION from './Versification';
import { BibleRef, BibleVerse, BibleRange } from './BibleRef';

export interface FormatOptions {
	/**
	 * If set then the 3 character book id will be used rather than the full
	 * book name
	 */
	use_book_id? : boolean,

	/**
	 * The character to use to seperate the chapter number from the verse number
	 * To be conformant with the parse this should be set to one of:
	 * [ ':', 'v', '.', ' v ' ]
	 */
	verse_seperator?: string;

	/**
	 * If set then all printer added whitespace will be stripped
	 * (IE: not any in custom seperator options)
	 * This makes for harder to read outputs, but URL encodable output strings
	 */
	strip_whitespace?: boolean,
};

const DEFAULT_OPTS : FormatOptions = {
	use_book_id : false,
	verse_seperator: ':',
	strip_whitespace: false,
};


// Strips whitespace if option is set
function _stripWhitespaceMaybe(str: string, opts : FormatOptions){
	return opts.strip_whitespace ? str.replace(/ /g, '') : str;
}

// Returns a string representing the name of the specified book id
// obeying the format options
// Will have a trailing space unless strip_whitespace is set
function _formatBookName(id : string, opts : FormatOptions){
	if(opts.use_book_id){
		return opts.strip_whitespace ? id : id + ' ';
	}
	return _stripWhitespaceMaybe(VERSIFICATION.book[id].name + ' ', opts);
}

// Formats a chapter verse specifier, eg "3:5"
function _formatChapterVerse(x: BibleVerse, opts: FormatOptions){
	return `${x.chapter}${opts.verse_seperator}${x.verse}`;
}

/**
 * Format a single BibleVerse to a string
 */
export function formatBibleVerse(x : BibleVerse, arg_opts? : FormatOptions){
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };
	return _formatBookName(x.book, opts) + _formatChapterVerse(x, opts);
}

/**
 * Format a single BibleRange to a string
 */
export function formatBibleRange(x: BibleRange, arg_opts? : FormatOptions){
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };

	if(x.start.book !== x.end.book){
		// cross book range
		// Format as two completely seperate BibleVerse refs, joined by " - "
		return (formatBibleVerse(x.start, opts) +
						_stripWhitespaceMaybe(' - ', opts) +
						formatBibleVerse(x.end, opts)
					 );
	} else if (x.start.chapter !== x.end.chapter){
		// cross chapter range within single book
		// Format as "Genesis 1:2 - 3:4"
		return (_formatBookName      (x.start.book, opts) +
						_formatChapterVerse  (x.start,      opts) +
						_stripWhitespaceMaybe(' - ',        opts) +
						_formatChapterVerse  (x.end,        opts)
					 );
	} else if (x.start.verse !== x.end.verse){
		// range of verses within single chapter
		// Format as "Genesis 1:2-3"
		return formatBibleVerse(x.start, opts) + '-' + x.end.verse;
	} else {
		// Then start == end
		return formatBibleVerse(x.start, opts);
	}
}

/**
 * Format a list of BibleRefs to strings using commas to shorten the output
 * wherever possible
 * Eg, mapping formatBibleVerse over [
 *   { book: 'GEN', chapter: 1, verse: 1 },
 *   { book: 'GEN', chapter: 1, verse: 2 },
 * ]
 * would produce "Genesis 1:1" and "Genesis 1:2"
 * By using this function we instead get the more compact "Genesis 1:1,2"
 */

export function formatBibleRefList(xs: BibleRef[], arg_opts? : FormatOptions){
	if(xs.length == 0){ return ""; }
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };

	let cur_book  : string | null = null;
	let cur_chpt  : number | null = null;

	let results = [];
	let cur_str = "";

	let cv_seperator = _stripWhitespaceMaybe(", ", opts);

	function makeNewRef(x : BibleRef){
		if(cur_str.length > 0){ results.push(cur_str) };
		cur_str = "";
		if(x['is_range']){
			cur_str = formatBibleRange(x, opts);
			if(x.start.book    === x.end.book)   { cur_book = x.start.book; }
			if(x.start.chapter === x.end.chapter){ cur_chpt = x.start.chapter; }
		} else {
			cur_str = formatBibleVerse(x, opts);
			cur_book  = x.book;
			cur_chpt  = x.chapter;
		}
	}

	for(let x of xs){
		if(!x.is_range){ // Then we're dealing with a single verse
			if(x.book != cur_book){
				// Nothing to reuse
				makeNewRef(x);
				continue;
			}

			if(x.chapter != cur_chpt){
				// Can reuse book only
				cur_str += cv_seperator + _formatChapterVerse(x,opts);
				cur_chpt = x.chapter;
				continue;
			}

			// Can reuse book and chapter
			cur_str += "," + x.verse;
			continue;
		}

		// If still going then we're dealing with a range

		if(x.start.book !== x.end.book || x.start.book !== cur_book){
			// Don't reuse anything if its a cross book range, or
			// if the range is within a single book - but not the current book
			makeNewRef(x);
			continue;
		}

		// If still going then we can reuse the book part...


		if(x.start.chapter !== x.end.chapter || x.start.chapter !== cur_chpt){
			// Cannot reuse chapter part
			cur_str += (cv_seperator +
									_formatChapterVerse(x.start, opts) +
									_stripWhitespaceMaybe(" - ", opts) +
									_formatChapterVerse(x.end,   opts)
								 );
			continue;
		}

		// Can reuse chapter part
		cur_str += "," + x.start.verse + "-" + x.end.verse;
	}

	results.push(cur_str);

	return results.join(opts.strip_whitespace ? ';' : '; ');
}
