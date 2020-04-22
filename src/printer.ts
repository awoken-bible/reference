/**
 * Contains utilities to print a BibleRef as a string
 */

import VERSIFICATION from './Versification';
import { Versification } from './Versification';
import { BibleRef, BibleVerse, BibleRange } from './BibleRef';
import { combineRanges } from './range-manip';

/**
 * Set of optional flags which can be passed to the format function
 */
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
	 * The character to use to seperate multiple references if a list of distinct refs is passed in.
	 * To be conformat with the parser this should be set to a string matching the regex \s*[;_]\s*
	 * Defaults to ';'
	 */
	ref_seperator?: string;

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
	compact? : boolean,

	/**
	 * If true then adjacent/overlapping ranges will sorted into order and
	 * combined before printing
	 */
	combine_ranges? : boolean,

	/**
	 * If true then string will be converted to lower case before being returned
	 */
	lowercase?: boolean,

	/**
	 * If set then will ensure returned string uses only characters which may appear in a URL,
	 * but can also be natively parsed by this library
	 * This implies:
	 * { use_book_id      : true,
   *   verse_seperator  : 'v',
   *   strip_whitespace : true,
   *   compact          : true,
   *   lowercase        : true,
   * }
   * And in addition the return string will be converted to lowercase
	 *
	 * All other options which are implied by this may still be overrien
	 */
	url? : boolean,
};

const DEFAULT_OPTS : FormatOptions = {
	use_book_id      : false,
	verse_seperator  : ':',
	strip_whitespace : false,
	compact          : false,
	combine_ranges   : false,
	lowercase        : false,
	ref_seperator    : '; ',
	url              : false,
};
const DEFAULT_OPTS_URL : FormatOptions = {
	use_book_id      : true,
	verse_seperator  : 'v',
	strip_whitespace : true,
	compact          : true,
	combine_ranges   : false,
	ref_seperator    : '_',
	lowercase        : true,
	url              : true,
};


// Strips whitespace if option is set
function _stripWhitespaceMaybe(opts : FormatOptions, str: string){
	return opts.strip_whitespace ? str.replace(/ /g, '') : str;
}

// Returns a string representing the name of the specified book id
// obeying the format options
// Will have a trailing space unless strip_whitespace is set
function _formatBookName(v: Versification, id : string, opts : FormatOptions) : string {
	let out = opts.use_book_id ? id : v.book[id].name;
	return opts.lowercase ? out.toLowerCase() : out;
}

// Formats a chapter verse specifier, eg "3:5"
function _formatChapterVerse(x: BibleVerse, opts: FormatOptions) : string {
	return `${x.chapter}${opts.verse_seperator}${x.verse}`;
}

function _generateFormatOpts(arg_opts?: FormatOptions) : FormatOptions{
	if(arg_opts === undefined){ return DEFAULT_OPTS; }
	if(arg_opts.url){
		return { ...DEFAULT_OPTS_URL, ...arg_opts };
	} else {
		return { ...DEFAULT_OPTS, ...arg_opts };
	}
}

/**
 * Format a single BibleVerse to a string
 * @private
 */
export function formatBibleVerse(v: Versification, x : BibleVerse, arg_opts? : FormatOptions) : string {
	let opts = _generateFormatOpts(arg_opts);
	return _stripWhitespaceMaybe(
		opts, _formatBookName(v, x.book, opts) + ' ' + _formatChapterVerse(x, opts)
	);
}

/**
 * Format a single BibleRange to a string
 * @private
 */
export function formatBibleRange(v: Versification, x: BibleRange, arg_opts? : FormatOptions) : string{
	let opts = _generateFormatOpts(arg_opts);

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
 * @private
 */
export function formatBibleRefList(v: Versification, xs: BibleRef[], arg_opts? : FormatOptions) : string {
	if(xs.length == 0){ return ""; }
	let opts = _generateFormatOpts(arg_opts);

	if(opts.combine_ranges){ xs = combineRanges.bind({ versification: v })(xs); }

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

	return _stripWhitespaceMaybe(opts, results.join(opts.ref_seperator || '; '));
}
