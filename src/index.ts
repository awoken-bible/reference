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

/**
 * Publically exposed interface to this library
 */
export interface BibleRefLib {
	/**
	 * Versification used by all methods
	 */
	versification : Versification;

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

function parse(this: BibleRefLib, str: string) : ParseResult{
	return Parsers.BibleRef.parse(str);
}

function parseOrThrow(this: BibleRefLib, str: string) : BibleRef[]{
	let result = this.parse(str);
	if(result.status === true){ return result.value; }
	throw result;
}

function format(this: BibleRefLib, b : BibleRef | BibleRef[], opts?: FormatOptions) : string{
	if('length' in b){
		return Printer.formatBibleRefList(b, opts);
	}

	if(b.is_range){
		return Printer.formatBibleRange(b, opts);
	} else {
		return Printer.formatBibleVerse(b, opts);
	}
}

/**
 * Constructor interface
 *
 * We are using a hybrid interface to this lib, you can just require(lib)
 * and call function such as parse, parseOrThrow, etc - or you can construct a
 * new instance with a non standard versification scheme and then call methods
 * of that
 */
type BibleRefLibConstructor =	(this: BibleRefLib) => BibleRefLib;

const constructFunc : BibleRefLib & BibleRefLibConstructor = function(this: BibleRefLib) : BibleRefLib {
	this.versification = VERSIFICATION;
	this.parse         = parse;
	this.parseOrThrow  = parseOrThrow;
	this.format        = format;
	return this;
};
constructFunc.versification = VERSIFICATION;
constructFunc.parse         = parse.bind(constructFunc);
constructFunc.parseOrThrow  = parseOrThrow.bind(constructFunc);
constructFunc.format        = format.bind(constructFunc);

export default constructFunc;
