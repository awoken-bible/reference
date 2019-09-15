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

export function formatBibleVerse(x : BibleVerse, arg_opts? : FormatOptions){
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };
	let b_name = _formatBookName(x.book, opts);
	return `${b_name}${x.chapter}${opts.verse_seperator}${x.verse}`;
}

export function formatBibleRange(x: BibleRange, arg_opts? : FormatOptions){
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };

	if(x.start.book !== x.end.book){ // cross book range
		return (formatBibleVerse(x.start, opts) +
						_stripWhitespaceMaybe(' - ', opts) +
						formatBibleVerse(x.end, opts)
					 );
	} else if (x.start.chapter !== x.end.chapter){ // cross chapter range
		return (_formatBookName(x.start.book, opts) +
						`${x.start.chapter}${opts.verse_seperator}${x.start.verse}` +
						_stripWhitespaceMaybe(' - ', opts) +
						`${x.end.chapter}${opts.verse_seperator}${x.end.verse}`
					 );
	} else if (x.start.verse !== x.end.verse){
		return formatBibleVerse(x.start, opts) + '-' + x.end.verse;
	} else {
		// Then start == end
		return formatBibleVerse(x.start, opts);
	}

}
