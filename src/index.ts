/**
 * Main file representing the full API of the library
 */

import { BibleRef, BibleVerse, BibleRange } from './BibleRef';
import { Parsers, ParseResult } from './parser';
import * as Printer             from './printer';
import VERSIFICATION            from './Versification';
import * as Vidx                from './vidx';
import * as Validate            from './validate';
import * as RangeManip          from './range-manip';

import { Versification   } from './Versification';
import { FormatOptions   } from './printer';
import { ValidationError } from './validate';

export { Versification }   from './Versification';
export { FormatOptions }   from './printer';
export { ValidationError } from './validate';

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

	/**
	 * Sorts a list of bible refs into chronological order (ranges are sorted
	 * based on their start, standalone verses come before the range with the
	 * same start)
	 * Modifies the passed in array, and returns reference to same array
	 */
	sort(refs : BibleRef[]) : BibleRef[];

	/**
	 * Converts a BibleVerse to corresponding verse index - a unique identifier
	 * but which is dependent on the Versification scheme in use, and thus is
	 * not portable across translations with different schemes
	 */
	toVidx(verse: BibleVerse) : number;

	/**
	 * Converts a VIDX back into the corresponding BibleVerse
	 */
	fromVidx(vidx : number) : BibleVerse;

	/**
	 * Truncates a list of verses and references such that the total number
	 * of verses contained within does not exceed n
	 * Does not modify passed in array, however some elements of the result
	 * may be references to elements in the original array
	 */
	firstNVerses(refs : BibleRef | BibleRef[], n : number) : BibleRef[];

	/**
	 * Splits an array of ranges such that any input range spanning multiple
	 * books is subdivided into multiple smaller ranges, one for each book
	 * @param refs - The list of refs to be split
	 * @param expand_verses - If set then even single verses will be represented
	 * as ranges of length 1, ensuring all returned objects have the same schema
	 * Default to true
	 */
	splitByBook(refs: BibleRef | BibleRef[], expand_verses?: boolean) : BibleRef[];

	/**
	 * Splits an array of ranges such that any input range spanning multiple
	 * chapters is subdivided into multiple smaller ranges, one for each chapter
	 * @param refs - The list of refs to be split
	 * @param expand_verses - If set then even single verses will be represented
	 * as ranges of length 1, ensuring all returned objects have the same schema.
	 * Defaults to true
	 */
	splitByChapter(refs: BibleRef | BibleRef[], expand_verses?: boolean) : BibleRef[];

	/**
	 * Splits an array of ranges to form an array of individual verses
	 * @param refs - The list of refs to be split
	 */
	splitByVerse(refs: BibleRef | BibleRef[]) : BibleVerse[];

	/**
	 * Returns an iterator that traverses over the objects that would have been
	 * returned by `splitByBook`
	 */
	iterateByBook   (refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleRef>;

	/**
	 * Returns an iterator that traverses over the objects that would have been
	 * returned by `splitByChapter`
	 */
	iterateByChapter(refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleRef>;

	/**
	 * Returns an iterator that traverses over the objects that would have been
	 * returned by `splitByVerse`
	 */
	iterateByVerse  (refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleVerse>;

	/**
	 * Generates the most compressed representation possible of some set of
	 * verses/ranges by combining adjacent or overlapping ranges into
	 * single larger ones
	 */
	combineRanges(refs: BibleRef[]) : BibleRef[];

	/**
	 * Counts the total number of verses represented by a single BibleRef
	 * or list of refs
	 */
	countVerses(refs : BibleRef | BibleRef[]) : number;

	/**
	 * Validates a set of BibleRefs returning a list of errors, such as out of
	 * bound chapter and verse numbers, backwards ranges, etc
	 */
	validate(refs: BibleRef | BibleRef[], include_warnings?: boolean) : ValidationError[];

	/**
	 * Repairs a BibleRef, resolving errors found by validate
	 * Note this function can throw if it encounters an error that cannot be
	 * repaired
	 */
	repair(ref: BibleRef, include_warnings?: boolean) : BibleRef;

	/**
	 * Creates a BibleRange representing either an entire book, or
	 * an entire chapter
	 * Note that this function will throw if the specified book is not a
	 * valid book ID, or if the specified chapter is too high
	 */
	makeRange(book : string, chapter?: number) : BibleRange;
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
		return Printer.formatBibleRefList(this.versification, b, opts);
	}

	if(b.is_range){
		return Printer.formatBibleRange(this.versification, b, opts);
	} else {
		return Printer.formatBibleVerse(this.versification, b, opts);
	}
}

function sort(this: BibleRefLib, refs: BibleRef[]) : BibleRef[] {
	return refs.sort((a : BibleRef, b : BibleRef) => {
		let start = a.is_range ? a.start : a;
		let end   = b.is_range ? b.start : b;
		let va = Vidx.toVidx(this.versification, start);
		let vb = Vidx.toVidx(this.versification, end);

		if(va == vb){
			if( a.is_range && !b.is_range){ return  1; }
			if(!a.is_range &&  b.is_range){ return -1; }
			return 0;
		}
		return va - vb;
	});
}

function toVidx(this: BibleRefLib, verse : BibleVerse): number {
	return Vidx.toVidx(this.versification, verse);
}


function fromVidx(this: BibleRefLib, vidx : number): BibleVerse {
	return Vidx.fromVidx(this.versification, vidx);;
}

function firstNVerses(this: BibleRefLib, refs: BibleRef | BibleRef[], n : number) : BibleRef[] {
	let data : BibleRef[] = 'length' in refs ? refs : [refs];
	return Vidx.firstNVerses(this.versification, data, n);
}

function countVerses(this: BibleRefLib, refs: BibleRef | BibleRef[]) : number {
	if('length' in refs){
		return refs
			.map((r) => Vidx.countVerses(this.versification, r))
			.reduce((acc, x) => acc + x, 0);
	} else {
		return Vidx.countVerses(this.versification, refs);
	}
}

function validate(this: BibleRefLib,
									refs: BibleRef | BibleRef[],
									include_warnings?: boolean) {
	if('length' in refs){
		return refs
			.map((r) => Validate.validate(this.versification, r, include_warnings))
			.reduce((acc, x) => acc.concat(x), []);
	} else {
		return Validate.validate(this.versification, refs, include_warnings);
	}
}

function repair(this: BibleRefLib, ref: BibleRef, include_warnings?: boolean) : BibleRef {
	return Validate.repair(this.versification, ref, include_warnings);
}

function makeRange(this: BibleRefLib, book : string, chapter? : number) : BibleRange {
	return RangeManip.makeRange(this.versification, book, chapter);
}

function splitByBook(this: BibleRefLib,
										 refs: BibleRef | BibleRef[],
										 expand_verses?: boolean
										) : BibleRef[] {

	return Array.from(this.iterateByBook(refs, expand_verses));
}

function splitByChapter(this: BibleRefLib,
												refs: BibleRef | BibleRef[],
												expand_verses?: boolean) : BibleRef[]{
	return Array.from(this.iterateByChapter(refs, expand_verses));
}

function splitByVerse(this: BibleRefLib, refs: BibleRef | BibleRef[]) : BibleVerse[]{
	return Array.from(this.iterateByVerse(refs));
}

function iterateByBook(this: BibleRefLib, refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleRef> {
	if(expand_verses === undefined){ expand_verses = true; }
	if(!('length' in refs)){ refs = [refs]; }
	return RangeManip.iterateBookRanges(this.versification, refs, expand_verses)
}

function iterateByChapter(this: BibleRefLib, refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleRef> {
	if(expand_verses === undefined){ expand_verses = true; }
	if(!('length' in refs)){ refs = [refs]; }
	return Array.from(RangeManip.iterateChapterRanges(this.versification, refs, expand_verses));
}

function iterateByVerse(this: BibleRefLib, refs: BibleRef | BibleRef[], expand_verses?: boolean): Iterable<BibleVerse> {
	if(!('length' in refs)){ refs = [refs]; }
	return RangeManip.iterateVerses(this.versification, refs);
}

function combineRanges(this: BibleRefLib, refs: BibleRef[]) : BibleRef[]{
	return RangeManip.combineRanges(this.versification, refs);
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
	this.versification    = VERSIFICATION;
	this.parse            = parse;
	this.parseOrThrow     = parseOrThrow;
	this.format           = format;
	this.sort             = sort;
	this.toVidx           = toVidx;
	this.fromVidx         = fromVidx;
	this.firstNVerses     = firstNVerses;
	this.countVerses      = countVerses;
	this.validate         = validate;
	this.repair           = repair;
	this.makeRange        = makeRange;
	this.splitByBook      = splitByBook;
	this.splitByChapter   = splitByChapter;
	this.splitByVerse     = splitByVerse;
	this.iterateByBook    = iterateByBook;
	this.iterateByChapter = iterateByChapter;
	this.iterateByVerse   = iterateByVerse;
	this.combineRanges    = combineRanges;
	return this;
};
constructFunc.versification    = VERSIFICATION;
constructFunc.parse            = parse.bind(constructFunc);
constructFunc.parseOrThrow     = parseOrThrow.bind(constructFunc);
constructFunc.format           = format.bind(constructFunc);
constructFunc.sort             = sort.bind(constructFunc);
constructFunc.toVidx           = toVidx.bind(constructFunc);
constructFunc.fromVidx         = fromVidx.bind(constructFunc);
constructFunc.firstNVerses     = firstNVerses.bind(constructFunc);
constructFunc.countVerses      = countVerses.bind(constructFunc);
constructFunc.validate         = validate.bind(constructFunc);
constructFunc.repair           = repair.bind(constructFunc);
constructFunc.makeRange        = makeRange.bind(constructFunc);
constructFunc.splitByBook      = splitByBook.bind(constructFunc);
constructFunc.splitByChapter   = splitByChapter.bind(constructFunc);
constructFunc.splitByVerse     = splitByVerse.bind(constructFunc);
constructFunc.iterateByBook    = iterateByBook.bind(constructFunc);
constructFunc.iterateByChapter = iterateByChapter.bind(constructFunc);
constructFunc.iterateByVerse   = iterateByVerse.bind(constructFunc);
constructFunc.combineRanges    = combineRanges.bind(constructFunc);

export default constructFunc;
