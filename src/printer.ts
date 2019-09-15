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
	 * If set then all whitespace will be stripped, making for some harder to read
	 * but URL encodable output strings
	 */
	strip_whitespace?: boolean,
};

const DEFAULT_OPTS : FormatOptions = {
	use_book_id : false,
	verse_seperator: ':',
	strip_whitespace: false,
};

export function formatBibleVerse(x : BibleVerse, arg_opts? : FormatOptions){
	let opts : FormatOptions = { ...DEFAULT_OPTS, ...(arg_opts ? arg_opts : {}) };

	let b_name = opts.use_book_id ? x.book : VERSIFICATION.book[x.book].name;

	let result = `${b_name} ${x.chapter}${opts.verse_seperator}${x.verse}`;
	if(opts.strip_whitespace){ result = result.replace(/ /g, ''); }
	return result;
}
