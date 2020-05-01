/**
 * Main file representing the full API of the library
 */

import { BibleRef, BibleVerse, BibleRange, BibleRefLibData } from './BibleRef';
import { Parsers, ParseResult } from './parser';
import * as Printer             from './printer';
import VERSIFICATION            from './Versification';
import * as Vidx                from './vidx';
import * as Validate            from './validate';
import * as RangeManip          from './range-manip';
import * as Geometry            from './geometry';

import { Versification        } from './Versification';
import { FormatOptions        } from './printer';
import { ValidationError      } from './validate';
import { RangeManipFunctions  } from './range-manip';
import { GeometryFunctions    } from './geometry';

/**
 * Export types which should be visible to users of the library
 */
export { BibleRef, BibleVerse, BibleRange } from './BibleRef';
export { Versification }   from './Versification';
export { FormatOptions }   from './printer';
export { ValidationError } from './validate';

/**
 * Publically exposed interface to this library
 */
export interface BibleRefLib extends BibleRefLibData, RangeManipFunctions, GeometryFunctions {
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
};

/**
 * Parses a string which may (or may not) represent a [[BibleRef]]
 * and returns a [[ParseResult]] representing whether the parse was successful,
 * and if so what value was obtained.
 *
 * Examples of valid input strings include:
 *
 * Book references (returns (list of) range(s) representing entire book):
 * - Genesis
 * - Gen
 * - GEN
 * - Genesis; Revelation
 *
 * Chapter references (returns (list of) range(s) representing entire chapters):
 * - Genesis 1
 * - GEN1
 * - Genesis 1; Exodus 2; REV1
 *
 * Verse References (represents a single verse):
 * - Genesis 1:1
 * - Gen 1v1
 * - GEN1.1
 *
 * Verse Ranges (continous blocks of verses, can cross chapter/book boundaries):
 * - Genesis 1:1-4
 * - Genesis 1:1 - 2:2
 * - Genesis 50 - Exodus 2
 *
 * Complex sets/combinations:
 * - Genesis 1:1, 2-4, 6
 * - GEN1.1-2; EXO3:4 - DEU5v6,10; Revelation 22
 *
 * @public
 * @param this - Instance of [[BibleRefLib]] (includes the versification to use)
 * @param str  - The string to parse
 */
function parse(this: BibleRefLib, str: string) : ParseResult {
	return Parsers.BibleRef.parse(str);
}

/**
 * As with [[parse]], but throws error if the input string is not a valid representation
 * of a [[BibleRef]]
 *
 * @public
 * @param this - Instance of [[BibleRefLib]] (includes the versification to use)
 * @param str  - The string to parse
 */
function parseOrThrow(this: BibleRefLib, str: string) : BibleRef[]{
	let result = this.parse(str);
	if(result.status === true){ return result.value; }
	throw result;
}

/**
 * Converts a JSON [[BibleRef]] (or array thereof) into a human readable string
 *
 * The output format is fairly flexible, see [[FormatOptions]] for details
 */
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

/**
 * Takes an array of [[BibleRef]] instances and sorts them into
 * order as per the versification scheme in use, from the BibleRef
 * which appears first, to the one which apears last
 *
 * @note [[BibleRanges]] are compared based on their `start` value
 */
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

/**
 * Converts a [[BibleVerse]] into a "Verse Index", IE: number between 0 and ~33K
 * Where 0 is the first verse of the Bible, and max value is the last verse of the Bible
 */
function toVidx(this: BibleRefLib, verse : BibleVerse): number {
	return Vidx.toVidx(this.versification, verse);
}

/**
 * Converts a "Verse Index" produced by [[toVidex]] back into a JSON [[BibleVerse]]
 *
 * @note You should ensure the versification scheme used is the same in both directions, else
 * unexpected results are likely to occur
 */
function fromVidx(this: BibleRefLib, vidx : number): BibleVerse {
	return Vidx.fromVidx(this.versification, vidx);;
}

/**
 * Given a [[BibleRef]] instance, or array thereof, returns a new array of [[BibleRef]] instances
 * which contains at most `n` verses. The final [[BibleRange]] in input list may be split if its
 * length is too great
 *
 * @param refs - List of references to consider
 * @param n    - Maximum number of verses to include in output set
 *
 * @note This is a no-op if `countVerses(refs) < n`
 */
function firstNVerses(this: BibleRefLib, refs: BibleRef | BibleRef[], n : number) : BibleRef[] {
	let data : BibleRef[] = 'length' in refs ? refs : [refs];
	return Vidx.firstNVerses(this.versification, data, n);
}

/**
 * Computes the total number of verses in the input [[BibleRef]] (or list thereof)
 */
function countVerses(this: BibleRefLib, refs: BibleRef | BibleRef[]) : number {
	if('length' in refs){
		return refs
			.map((r) => Vidx.countVerses(this.versification, r))
			.reduce((acc, x) => acc + x, 0);
	} else {
		return Vidx.countVerses(this.versification, refs);
	}
}

/**
 * Checks for issues with a [[BibleRef]] JSON object, such as the chapter or verse count
 * being out of bounds
 */
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

/**
 * Attempts to fix issues identified by [[Validate]], for example by reducing the verse/chapter
 * number if it is too high
 */
function repair(this: BibleRefLib, ref: BibleRef, include_warnings?: boolean) : BibleRef {
	return Validate.repair(this.versification, ref, include_warnings);
}

/**
 * Constructor interface
 *
 * We are using a hybrid interface to this lib, you can just require(lib)
 * and call function such as parse, parseOrThrow, etc - or you can construct a
 * new instance with a non standard versification scheme and then call methods
 * of that
 */
type BibleRefLibConstructor =	(v: Versification) => BibleRefLib;

const constructFunc : BibleRefLib & BibleRefLibConstructor = function(this: BibleRefLib, v: Versification) : BibleRefLib {
	this.versification    = v;
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
	this.makeRange        = RangeManip.makeRange;
	this.splitByBook      = RangeManip.splitByBook;
	this.splitByChapter   = RangeManip.splitByChapter;
	this.splitByVerse     = RangeManip.splitByVerse;
	this.iterateByBook    = RangeManip.iterateByBook;
	this.iterateByChapter = RangeManip.iterateByChapter;
	this.iterateByVerse   = RangeManip.iterateByVerse;
	this.combineRanges    = RangeManip.combineRanges;
	this.nextChapter      = RangeManip.nextChapter;
	this.previousChapter  = RangeManip.previousChapter;
	this.nextBook         = RangeManip.nextBook;
	this.previousBook     = RangeManip.previousBook;
	this.getIntersection  = Geometry.getIntersection;
	this.intersects       = Geometry.intersects;
	this.getUnion         = Geometry.getUnion;
	this.contains         = Geometry.contains;
	return this;
};

// Allow calling of all methods statically, with the default Versification scheme used
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
constructFunc.makeRange        = RangeManip.makeRange.bind(constructFunc);
constructFunc.splitByBook      = RangeManip.splitByBook.bind(constructFunc);
constructFunc.splitByChapter   = RangeManip.splitByChapter.bind(constructFunc);
constructFunc.splitByVerse     = RangeManip.splitByVerse.bind(constructFunc);
constructFunc.iterateByBook    = RangeManip.iterateByBook.bind(constructFunc);
constructFunc.iterateByChapter = RangeManip.iterateByChapter.bind(constructFunc);
constructFunc.iterateByVerse   = RangeManip.iterateByVerse.bind(constructFunc);
constructFunc.combineRanges    = RangeManip.combineRanges.bind(constructFunc);
constructFunc.nextChapter      = RangeManip.nextChapter.bind(constructFunc);
constructFunc.previousChapter  = RangeManip.previousChapter.bind(constructFunc);
constructFunc.nextBook         = RangeManip.nextBook.bind(constructFunc);
constructFunc.previousBook     = RangeManip.previousBook.bind(constructFunc);
constructFunc.getIntersection  = Geometry.getIntersection.bind(constructFunc);
constructFunc.intersects       = Geometry.intersects.bind(constructFunc);
constructFunc.getUnion         = Geometry.getUnion.bind(constructFunc);
constructFunc.contains         = Geometry.contains.bind(constructFunc);

export default constructFunc;
