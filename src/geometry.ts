/**
 * Various utility functions for treating [[BibleRef]]s as geometry, IE:
 * BibleVerse's as points, and BibleRange's as line segments, and then finding intersections/etc
 */

import { BibleRef, BibleVerse, BibleRange, BibleRefLibData } from './BibleRef';
import { Versification, BookMeta } from './Versification'
import * as Vidx from './vidx';
import { combineRanges } from './range-manip';

export interface GeometryFunctions {
	getIntersection(a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]): BibleRef[];
	intersects(a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]): boolean,
	contains(a: BibleRef, b: BibleRef): boolean,
	getUnion(a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]): BibleRef[];
	indexOf(a: BibleRef | BibleRef[], b: BibleVerse): number;
	verseAtIndex(a: BibleRef | BibleRef[], idx: number): BibleVerse | undefined;
};

/**
 *  Represents a 1d line segment (we map [[BibleRange]]'s to vidx ranges to do maths on them)
 *
 * @private
 */
interface LineSegment {
	min: number;
	max: number;
}

/**
 * Creates a new array of [[BibleRef]]s which represents the intersection between two other sets
 *
 * @param this - Any object with a `versification` field
 * @param x    - First set of [[BibleRef]] instances
 * @param y    - Second set of [[BibleRef]] instances
 *
 * @return Simplified and sorted list of [[BibleRef]]s which appear in both input sets. Will
 * return empty array if there are no verses in common between the inputs
 */
export function getIntersection(this: BibleRefLibData, x: BibleRef | BibleRef[], y: BibleRef | BibleRef[]) : BibleRef[]  {
	let a = _toLineSegments(this, x);
	let b = _toLineSegments(this, y);

	let ai = 0; let bi = 0;
	let out : BibleRef[] = [];
	while(ai < a.length && bi < b.length){
		// Find intersections between current list heads
		let intersection = _intersectLineSegment(a[ai], b[bi]);

		if(intersection === null){
			// If no intersection between current heads, skip past the one which ends soonest
			if(a[ai].max < b[bi].max){
				++ai;
			} else {
				++bi;
			}
			continue;
		}

		// If intersection found, add to result set
		out.push(_fromLineSegment(this, intersection));

		// Alter the ranges to exclude that which we've just found
		a[ai].min = intersection.max+1;
		b[bi].min = intersection.max+1;

		// Skip past list heads if they now have length 0
		if(a[ai].min >= a[ai].max){ ++ai; }
		if(b[bi].min >= b[bi].max){ ++bi; }
	}

	return out;
}

/**
 * Determines whether two sets of [[BibleRef]]s have any verses in common
 */
export function intersects(this: BibleRefLibData, a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]) : boolean {
	return getIntersection.bind(this)(a,b).length > 0;
}

/**
 * Determines whether `outer` fully contains all verses present within `inner`
 */
export function contains(this: BibleRefLibData, outer: BibleRef | BibleRef[], inner: BibleRef | BibleRef[]) : boolean {
	let a = _toLineSegments(this, outer);
	let b = _toLineSegments(this, inner);

	let ai = 0, bi = 0;
	while(bi < b.length){
		// Consume head of a while segment is before start of head of b
		while(a[ai].max < b[bi].min){
			++ai;
			if(ai >= a.length){ return false; }
		}

		// Check that b falls within the head of a
		while(bi < b.length && b[bi].min <= a[ai].max){
			if(a[ai].min > b[bi].min || b[bi].max > a[ai].max){
				return false;
			}
			++bi;
		}
	}

	return true;
}

/**
 * Returns the union of two sets of [[BibleRef]]s, IE: the combined and simpified set of verses
 * which are in one or the other or both input sets
 */
export function getUnion(this: BibleRefLibData, a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]) : BibleRef[] {
	let x = 'length' in a ? a : [a];
	let y = 'length' in b ? b : [b];
	return combineRanges.bind(this)([...x, ...y]);
}

/**
 * Given a (potentially non-continous) set of [[BibleRef]]'s, computes the index of some
 * [[BibleVerse]] within the set.
 *
 * For example, given the input set "Revelation 1:1; Exodus 1:2-4; Genesis 10:5" the following
 * verses appear at each index:
 * - 0: Revelation 1:1
 * - 1: Exodus 1:2
 * - 2: Exodus 1:3
 * - 3: Exodus 1:4
 * - 4: Genesis 10:5
 *
 * @param array - The array of input verses you wish to search (aka, the haystack)
 * @param verse - The verse whose index you wish to determnine (aka, the needle)
 * @return The zero based index at which `verse` can be found, or -1 if the `verse` does not appear
 * within the input `array`
 *
 * @note If the same verse appears at multiple positions within the input array then only the
 * first index is returned
 *
 * @note The inverse of this function is [[verseAtIndex]]
 */
export function indexOf(this: BibleRefLibData, array: BibleRef | BibleRef[], verse: BibleVerse): number {
	let blocks = _toLineSegmentsUnsorted(this, array);
	let idx    = Vidx.toVidx(this.versification, verse);

	let offset = 0;
	for(let b of blocks){
		if(idx >= b.min && idx <= b.max){
			// then target verse falls within this
			return offset + (idx - b.min);
		} else {
			offset += (b.max - b.min) + 1;
		}
	}

	return -1;
}

/**
 * Given a (potentially non-continous) set of [[BibleRef]]'s, finds the [[BibleVerse]] at the
 * specified index. This is the inverse of [[indexOf]]
 *
 * @param array - The set of [[BibleRef]] instances (or singular instance) to extract a verse from
 * @param index - The zero based index of the verse you wish to extract from the input set
 *
 * @return BibleVerse instance, or undefined if `index` is out of bounds
 *
 * @note Semantically, the call `AwokenRef.verseAtIndex(array, n)` is equivalent to
 * `AwokenRef.splitByVerse(array)[n]`, however this version is more efficent for a single call,
 * since it does not have build the full temporary array, but intead internally operates by
 * blocks of verses represented by the [[BibleRef]] instances in the input `array`
 */
export function verseAtIndex(this: BibleRefLibData, array: BibleRef | BibleRef[], index: number): BibleVerse | undefined {
	let blocks = _toLineSegmentsUnsorted(this, array);

	let offset = 0;
	for(let b of blocks){
		let max_offset = offset + (b.max - b.min);
		if(index >= offset && index <= max_offset){
			return Vidx.fromVidx(this.versification, b.min + index - offset);
		} else {
			offset = max_offset + 1;
		}
	}

	return undefined;
}

////////////////////////////////////////////////////////////////////////////////
//
// Private implementation methods below
//
////////////////////////////////////////////////////////////////////////////////

/**
 * Converts a set of [[BibleRef]]'s into a set of [[LineSegment]] instances. Returns set will not
 * be sorted/combined
 *
 * @private
 */
function _toLineSegmentsUnsorted(lib: BibleRefLibData, input: BibleRef | BibleRef[]): LineSegment[] {
	let in_arr : BibleRef[] = 'length' in input ? input : [input];
	return in_arr.map((x : BibleRef) => {
		if(x.is_range){
			return { min: Vidx.toVidx(lib.versification, x.start), max: Vidx.toVidx(lib.versification, x.end) };
		} else {
			let val = Vidx.toVidx(lib.versification, x);
			return { min: val, max: val };
		}
	});
}

/**
 * Converts a set of [[BibleRef]]'s into a set of [[LineSegment]] instances
 *
 * First calls combineRanges to ensure returned set is ordered and consists of the minimal number
 * of segments
 *
 * @private
 */
function _toLineSegments(lib: BibleRefLibData, input: BibleRef | BibleRef[]): LineSegment[] {
	let in_arr : BibleRef[] = 'length' in input ? input : [input];
	return _toLineSegmentsUnsorted(lib, combineRanges.bind(lib)(in_arr));
}

/**
 * Convertse a [[LineSegment]] instance back into a [[BibleRef]]
 *
 * @private
 */
function _fromLineSegment(lib: BibleRefLibData, line: LineSegment): BibleRef{
	if(line.min === line.max){
		return Vidx.fromVidx(lib.versification, line.min);
	} else {
		return { is_range : true,
						 start    : Vidx.fromVidx(lib.versification, line.min),
						 end      : Vidx.fromVidx(lib.versification, line.max)
					 };
	}
}

/**
 * Finds the intersection between two 1d [[LineSegment]] instances, or returns null if there is no
 * intersection
 *
 * @private
 */
function _intersectLineSegment(a: LineSegment, b: LineSegment) : LineSegment | null {
	let min = Math.max(a.min, b.min);
	let max = Math.min(b.max, a.max);

	if(min <= max){
		return { min, max };
	} else {
		return null;
	}
}
