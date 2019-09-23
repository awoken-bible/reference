/**
 * Contains utilities to print a BibleRef as a string
 */

import VERSIFICATION from './Versification';
import { Versification } from './Versification';
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

	/**
	 * If set then implict elements will be hidden, for example a range
	 * reperenting an chapter will be printed as "Genesis 1" rather than
	 * "Genesis 1:1-31", and a range representing an entire book will be
	 * printed "Genesis" rather than "Genesis 1:1 - 50:26"]
	 */
	compact : boolean,
};

const DEFAULT_OPTS : FormatOptions = {
	use_book_id : false,
	verse_seperator: ':',
	strip_whitespace: false,
	compact: false,
};


// Strips whitespace if option is set
function _stripWhitespaceMaybe(opts : FormatOptions, str: string){
	return opts.strip_whitespace ? str.replace(/ /g, '') : str;
}

// Returns a string representing the name of the specified book id
// obeying the format options
// Will have a trailing space unless strip_whitespace is set
function _formatBookName(v: Versification, id : string, opts : FormatOptions){
	if(opts.use_book_id){ return id; }
	return v.book[id].name;
}

// Formats a chapter verse specifier, eg "3:5"
function _formatChapterVerse(x: BibleVerse, opts: FormatOptions){
	return `${x.chapter}${opts.verse_seperator}${x.verse}`;
}

/**
 * Format a single BibleVerse to a string
 */
export function formatBibleVerse(v: Versification, x : BibleVerse, arg_opts? : FormatOptions){
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };
	return _stripWhitespaceMaybe(
		opts, _formatBookName(v, x.book, opts) + ' ' + _formatChapterVerse(x, opts)
	);
}

/**
 * Format a single BibleRange to a string
 */
export function formatBibleRange(v: Versification, x: BibleRange, arg_opts? : FormatOptions){
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };

	let b_meta = v.book[x.start.book];

	if(x.start.book !== x.end.book){
		// cross book range
		// Format as two completely seperate BibleVerse refs, joined by " - "
		return _stripWhitespaceMaybe(opts,
																 formatBibleVerse(v, x.start, opts) +
																 ' - ' +
																 formatBibleVerse(v, x.end, opts)
																);
	} else if (x.start.chapter !== x.end.chapter){
		// Cross chapter range within single book

		if(opts.compact &&
			 x.start.chapter === 1 &&
			 x.start.verse === 1 &&
			 x.end.verse === b_meta.chapters[x.end.chapter-1].verse_count
			){
			// then its a range of complete chapters

			if(x.end.chapter === b_meta.chapters.length){
				// Its a complete book, format as "Genesis"
				return _formatBookName(v, x.start.book, opts);
			} else {
				// format as "Geneses 1 - 2"
				return _stripWhitespaceMaybe(
					opts,
					_formatBookName(v, x.start.book, opts) +
						` ${x.start.chapter} - ${x.end.chapter}`
				);
			}
		}

		// Format as "Genesis 1:2 - 3:4"
			return _stripWhitespaceMaybe(opts,
																	 _formatBookName    (v, x.start.book, opts) + ' ' +
																	 _formatChapterVerse(x.start, opts) + ' - ' +
																	 _formatChapterVerse(x.end, opts)
																	);
	} else if (x.start.verse !== x.end.verse){
		if(opts.compact &&
			 x.start.verse === 1 &&
			 x.end.verse   === b_meta.chapters[x.end.chapter-1].verse_count
			) {
			// then its an entire chapter, format as "Genesis 1"
			return _stripWhitespaceMaybe(
				opts, _formatBookName(v, x.start.book, opts) + ' ' + x.start.chapter
			);
		}

		// Range of verses within single chapter
		// Format as "Genesis 1:2-3"
		return formatBibleVerse(v, x.start, opts) + '-' + x.end.verse;
	} else {
		// Then start == end
		return formatBibleVerse(v, x.start, opts);
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

export function formatBibleRefList(v: Versification, xs: BibleRef[], arg_opts? : FormatOptions){
	if(xs.length == 0){ return ""; }
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };

	let cur_book  : string | null = null;
	let cur_chpt  : number | null = null;

	let results = [];
	let cur_str = "";

	let cv_seperator = ", ";

	function makeNewRef(x : BibleRef){
		if(cur_str.length > 0){ results.push(cur_str) };
		cur_str = "";
		if(x['is_range']){
			cur_str = formatBibleRange(v, x, opts);
			if(x.start.book    === x.end.book)   { cur_book = x.start.book; }
			if(x.start.chapter === x.end.chapter){ cur_chpt = x.start.chapter; }
		} else {
			cur_str = formatBibleVerse(v, x, opts);
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
									_formatChapterVerse(x.start, opts) + ' - ' +
									_formatChapterVerse(x.end,   opts)
								 );
			continue;
		}

		// Can reuse chapter part
		cur_str += "," + x.start.verse + "-" + x.end.verse;
	}

	results.push(cur_str);

	return _stripWhitespaceMaybe(opts, results.join('; '));
}
