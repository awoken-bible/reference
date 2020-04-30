/**
 * Various utility functions for treating [[BibleRef]]s as geometry, IE:
 * BibleVerse's as points, and BibleRange's as line segments
 */

import { BibleRef, BibleVerse, BibleRange }    from './BibleRef';
import { Versification, BookMeta } from './Versification'
import * as Vidx from './vidx';

export interface GeometryFunctions {
	getIntersection(a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]): BibleRef | null;
	intersects(a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]): boolean,
	contains(a: BibleRef, b: BibleRef): boolean,
	getUnion(a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]): BibleRef | null;
};


interface _Self {
	versification : Versification;
};

/**
 * Creates a new array of [[BibleRef]]s which represents the intersection between two other sets
 *
 * @param this - Any object with a `versification` field
 * @param a    - First set of [[BibleRef]] instances
 * @param b    - Second set of [[BibleRef]] instances
 *
 * @return Simplified and sorted list of [[BibleRef]]s which appear in both input sets. Will
 * return empty array if there are no verses in common between the inputs
 */
export function getIntersection(this: _Self, a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]) : BibleRef[]  {
	return [];
}

/**
 * Determines whether two sets of [[BibleRef]]s have any verses in common
 */
export function intersects(this: _Self, a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]) : boolean {
	return getIntersection.bind(this)(a,b).length > 0;
}

/**
 * Determines whether `outer` fully contains all verses present within `inner`
 */
export function contains(this: _Self, a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]) : boolean {
	return true;
}

/**
 * Returns the union of two sets of [[BibleRef]]s, IE: the combined and simpified set of verses
 * which are in one or the other or both input sets
 */
export function getUnion(this: _Self, a: BibleRef | BibleRef[], b: BibleRef | BibleRef[]) : BibleRef[] {
	return [];
}
