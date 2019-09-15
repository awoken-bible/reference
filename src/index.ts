/**
 * Main file representing the full API of the library
 */

import { BibleRef } from './BibleRef';
import { Parsers, ParseResult } from './parser';
import * as Printer      from './printer';
import VERSIFICATION from './Versification';


import { Versification } from './Versification';
import { FormatOptions } from './printer';

export { Versification } from './Versification';
export { FormatOptions } from './printer';

export interface BibleRefLib {
	/**
	 * Versification used by all methods
	 */
	versification : Versification;

	/**
	 * Constructor interface
	 *
	 * We are using a hybrid interface to this lib, you can just require(lib)
	 * and call function such as parse, etc - or you can construct a new instance
	 * with a non standard versification scheme
	 */
	(this: BibleRefLib) : BibleRefLib;


	/**
	 * Parses a string containing a BibleRef
	 */
	parse(str: string) : ParseResult;

	/**
	 * Wrapper around parse() which throws the error object
	 * on failure, but returns just the value on success
	 */
	parseOrThrow(str: string) : BibleRef[];

	/**
	 * Formats a single BibleVerse, BibleRange, or list of BibleRefs as a human
	 * readable string which can be parsed to rebuild the original object
	 */
	format(b : BibleRef | BibleRef[], opts?: FormatOptions) : string;
}

const BibleRefLib = function(this: BibleRefLib){
	this.versification = VERSIFICATION;

	this.parse = (str: string) => {
		return Parsers.BibleRef.parse(str);
	};

	this.parseOrThrow = (str: string) => {
		let result = this.parse(str);
		if(result.status === true){ return result.value; }
		throw result;
	};

	this.format = (b : BibleRef | BibleRef[], opts?: FormatOptions) => {
		if('length' in b){
			return Printer.formatBibleRefList(b, opts);
		}

		if(b.is_range){
			return Printer.formatBibleRange(b, opts);
		} else {
			return Printer.formatBibleVerse(b, opts);
		}
	};
} as BibleRefLib;

export default BibleRefLib;
