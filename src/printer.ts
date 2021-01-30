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
	 * The format to use for book name
	 * - name -> The full name      -> Judges
	 * - usfm -> The 3 char usfm id -> JDG
	 * - osis -> The OSIS id        -> Judg
	 */
	book_format? : "name" | "usfm" | "osis",

	/**
	 * The character/string to use to separate the book name/id from the chapter/verse
	 * numbers
	 * Defaults to ' ', can use '.' and still be conformant with parser
	 */
	book_separator?: string,

	/**
	 * The character to use to separate the chapter number from the verse number
	 * To be conformant with the parse this should be set to one of:
	 * [ ':', 'v', '.', ' v ' ]
	 */
	verse_separator?: string;

	/**
	 * The character to use to separate multiple references if a list of distinct refs is passed in.
	 * To be conformat with the parser this should be set to a string matching the regex \s*[;_]\s*
	 * Defaults to '; '
	 */
	ref_separator?: string;

	/**
	 * If set then all printer added whitespace will be stripped
	 * (IE: excludes whitespace in any custom separator options)
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
	 * If true, references will always be output in there entirety
	 * (IE: never reusing part of the previous reference as implicit context)
	 *
	 * Eg, Rather than "Genesis 1:4,6" we will return "Genesis 1:4; Genesis 1:6"
	 *
	 * Additionally, ranges will contain complete references on both sides of the separator
	 * character, Eg, Rather than "Genesis 1:4-6" we will return "Genesis 1:4 - Genesis 1:6"
	 *
	 * Defaults to false, must be true to adhear to OSIS reference specification
	 */
	complete_refs? : boolean,

	/**
	 * If true then adjacent/overlapping ranges will sorted into order and
	 * combined before printing
	 */
	combine_ranges? : boolean,

	/**
	 * If true then string will be converted to lower case before being returned
	 */
	lowercase?: boolean,
};

const DEFAULT_OPTS : FormatOptions = {
	book_format      : "name",
	verse_separator  : ':',
	strip_whitespace : false,
	compact          : false,
	combine_ranges   : false,
	complete_refs    : false,
	lowercase        : false,
};

/**
 * Enumeration of possible format presets
 *
 * - osis      -> uses . separators and osis book ids, eg: "Gen.1.1"
 * - url       -> uses url safe separators and usfm book ids, eg: gen1v1_exo1v2-3
 * - compact   -> sets the `compact` flag to true
 * - lowercase -> sets the `lowercase` flag to true
 * - combined  -> sets the `combine_ranges` flag to true
 * - complete  -> sets the `complete_refs` flag to true
 */
export type FormatPreset = "osis" | "url" | "compact" | "lowercase" | "combined";

/**
 * Set of arguments that can be passed to represent a formatting scheme
 *
 * Either a full FormatOptions object describing the options, or a present
 * name such as "osis" for OSIS formatted references
 *
 * Present name can be combined with :, eg: url:combined to use url formatting, and combine ranges
 * Later presets override earlier presets
 *
 * For a full list of present names, see [[FormatPreset]]
 *
 */
export type FormatArg = FormatOptions | string;

const FORMAT_PRESETS : { [index:string] : FormatOptions } = {
	"osis": {
		book_format      : "osis",
		book_separator   : '.',
		verse_separator  : '.',
		complete_refs    : true,
		strip_whitespace : true,
		ref_separator    : ', ',
	},
	"url": {
		book_format      : "usfm",
		book_separator   : '',
		verse_separator  : 'v',
		strip_whitespace : true,
		compact          : true,
		ref_separator    : '_',
		lowercase        : true,
	},
	"compact"   : { compact        : true },
	"lowercase" : { lowercase      : true },
	"combined"  : { combine_ranges : true },
	"complete"  : { complete_refs  : true },
};



// Strips whitespace if option is set
function _stripWhitespaceMaybe(opts : FormatOptions, str: string){
	return opts.strip_whitespace ? str.replace(/ /g, '') : str;
}

// Returns a string representing the name of the specified book id
// obeying the format options
// Will have a trailing space unless strip_whitespace is set
function _formatBookName(v: Versification, id : string, opts : FormatOptions) : string {
	let out : string;
	switch(opts.book_format){
		case "name": out = v.book[id].name; break;
		case "usfm": out = id; break;
		case "osis": out = v.book[id].osisId; break;
		default:
			throw new Error("Invalid output book format specified");
	}
	return opts.lowercase ? out.toLowerCase() : out;
}

// Formats a chapter verse specifier, eg "3:5"
function _formatChapterVerse(x: BibleVerse, opts: FormatOptions) : string {
	return `${x.chapter}${opts.verse_separator}${x.verse}`;
}

function _generateFormatOpts(arg_opts?: FormatArg) : FormatOptions{
	let result = { ...DEFAULT_OPTS };

	if(typeof arg_opts === "string"){
		for(let preset of arg_opts.split(':')){

			if(!(preset in FORMAT_PRESETS)){
				throw new Error(`Invalid format preset name specified: '${preset}'`);
			}

			result = { ...result, ...FORMAT_PRESETS[preset] };
		}

	} else if (arg_opts !== undefined) {
		result = { ...result, ...arg_opts };
	}

	if(!result.book_separator) {
		result.book_separator = result.strip_whitespace ? '' : ' ';
	}
	if(!result.ref_separator) {
		result.ref_separator = result.strip_whitespace ? ';' : '; ';
	}

	return result;
}

/**
 * Format a single BibleVerse to a string
 * @private
 */
export function formatBibleVerse(v: Versification, x : BibleVerse, arg_opts? : FormatArg) : string {
	let opts = _generateFormatOpts(arg_opts);
	return _stripWhitespaceMaybe(
		opts, _formatBookName(v, x.book, opts) + opts.book_separator + _formatChapterVerse(x, opts)
	);
}

/**
 * Format a single BibleRange to a string
 * @private
 */
export function formatBibleRange(v: Versification, x: BibleRange, arg_opts? : FormatArg) : string{
	let opts = _generateFormatOpts(arg_opts);

	let b_meta = v.book[x.start.book];

	const SPACED_HYPHEN = opts.strip_whitespace ? '-' : ' - ';

	if(x.start.book !== x.end.book || opts.complete_refs){
		// cross book range
		// Format as two completely separate BibleVerse refs, joined by " - "
		return (
			formatBibleVerse(v, x.start, opts) +
			SPACED_HYPHEN +
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
				return _formatBookName(v, x.start.book, opts) + `${opts.book_separator}${x.start.chapter}${SPACED_HYPHEN}${x.end.chapter}`;
			}
		}

		// Format as "Genesis 1:2 - 3:4"
		return (
			_formatBookName(v, x.start.book, opts) +
			opts.book_separator +
			_formatChapterVerse(x.start, opts) +
			SPACED_HYPHEN +
			_formatChapterVerse(x.end, opts)
		);
	} else if (x.start.verse !== x.end.verse){
		if(opts.compact &&
			 x.start.verse === 1 &&
			 x.end.verse   === b_meta.chapters[x.end.chapter-1].verse_count
			) {
			// then its an entire chapter, format as "Genesis 1"
			return (
				_formatBookName(v, x.start.book, opts) + opts.book_separator + x.start.chapter
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
export function formatBibleRefList(v: Versification, xs: BibleRef[], arg_opts? : FormatArg) : string {
	if(xs.length == 0){ return ""; }
	let opts = _generateFormatOpts(arg_opts);

	if(opts.combine_ranges){ xs = combineRanges.bind({ versification: v })(xs); }

	let cur_book  : string | null = null;
	let cur_chpt  : number | null = null;

	let results = [];
	let cur_str = "";

	// separator used for multiple chapter verse blocks, eg Gen 1:2, 5:6
	//                                                             ^^
	const CV_SEPARATOR = opts.strip_whitespace ? ',' : ', ';
	const SPACED_HYPHEN = opts.strip_whitespace ? '-' : ' - ';

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
			if(x.book !== cur_book || opts.complete_refs){
				// Nothing to reuse
				makeNewRef(x);
				continue;
			}

			if(x.chapter != cur_chpt){
				// Can reuse book only
				cur_str += CV_SEPARATOR + _formatChapterVerse(x,opts);
				cur_chpt = x.chapter;
				continue;
			}

			// Can reuse book and chapter
			cur_str += "," + x.verse;
			continue;
		}

		// If still going then we're dealing with a range

		if(x.start.book !== x.end.book || x.start.book !== cur_book || opts.complete_refs){
			// Don't reuse anything if its a cross book range, or
			// if the range is within a single book - but not the current book
			makeNewRef(x);
			continue;
		}

		// If still going then we can reuse the book part...


		if(x.start.chapter !== x.end.chapter || x.start.chapter !== cur_chpt){
			// Cannot reuse chapter part
			cur_str += (
				  CV_SEPARATOR +
					_formatChapterVerse(x.start, opts) +
					SPACED_HYPHEN +
					_formatChapterVerse(x.end,   opts)
			);
			continue;
		}

		// Can reuse chapter part
		cur_str += "," + x.start.verse + (x.start.verse === x.end.verse ? '' : "-" + x.end.verse);
	}

	results.push(cur_str);

	return results.join(opts.ref_separator);
}
