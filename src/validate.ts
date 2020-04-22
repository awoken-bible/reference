/**
 * Allows for validation (and fixing) of BibleRefs
 */

import { BibleRef, BibleVerse, BibleRange }    from './BibleRef';
import { Versification, BookMeta } from './Versification'

/**
 * Enumeration of the different sorts of validation error
 */
export enum ErrKind {
	/** The specified book does not exist */
	BadBook = "BADBOOK",

	/** Verse number is higher than number of verses in chapter */
	BadVerse = "BADVERSE",

	/** Chapter number is higher than number of chapters in book */
	BadChapter = "BADCHPT",

	/** A range goes from later in the bible to earlier in the bible */
	BackwardsRange = "BACKWARDSRANGE",

	//////////////////////////////////////////////
	// Warnings below

	/** A range contains just a single verse */
	RangeOfOne = "RANGEOFONE",
};

/**
 * Represents an error which was detected during validation
 */
export type ValidationError = {
	kind: ErrKind.BadBook,
	is_warning: false,
	message: string,
	got: string,
	ref: BibleVerse,
} | {
	kind: ErrKind.BadVerse | ErrKind.BadChapter,
	is_warning: false,
	message: string,

	max_value: number,
	got: number,
	ref: BibleVerse,
} | {
	kind: ErrKind.BackwardsRange,
	is_warning: false,
	message: string,

	/** The most significant part of the range which is reversed */
	component: "book" | "chapter" | "verse",
	ref: BibleRange,
} | {
	kind: ErrKind.RangeOfOne,
	is_warning: true,
	message: string,
	ref: BibleRange,
};

function _validateVerse(v : Versification, ref: BibleVerse) : ValidationError[] {
	let b_data : BookMeta | undefined = v.book[ref.book];

	let results : ValidationError[] = [];

	if(b_data == undefined){
		results.push({
			ref        : ref,
			kind       : ErrKind.BadBook,
			is_warning : false,
			message    : "The specified book does not exist",
			got        : ref.book,
		});
	} else if (b_data.chapters.length < ref.chapter){
		results.push({
			ref        : ref,
			kind       : ErrKind.BadChapter,
			is_warning : false,
			message    : `${b_data.name} has only ${b_data.chapters.length} chapters`,
			max_value  : b_data.chapters.length,
			got        : ref.chapter,
		});
	} else if(b_data[ref.chapter].verse_count < ref.verse){
		results.push({
			ref        : ref,
			kind       : ErrKind.BadVerse,
			is_warning : false,
			message    : `${b_data.name} ${ref.chapter} has only ${b_data[ref.chapter].verse_count} verses`,
			max_value  : b_data[ref.chapter].verse_count,
			got        : ref.verse,
		});
	}

	return results;
}
/**
 * Validates a BibleRef, returning an array of errors, or empty array if no
 * issues
 * Note that the .ref field of each error produced will be a reference to the
 * BibleRef passed in rather than a copy
 * @param include_warnings - if true then warning messages will be included
 */
export function validate(v : Versification, ref : BibleRef, include_warnings?: boolean) : ValidationError[] {
	if(include_warnings === undefined){ include_warnings = true; }

	let results : ValidationError[] = [];

	if(ref.is_range === undefined){
		results = results.concat(_validateVerse(v, ref));
	} else {
		results = results.concat(_validateVerse(v, ref.start));
		results = results.concat(_validateVerse(v, ref.end));

		let b1_data : BookMeta | undefined = v.book[ref.start.book];
		let b2_data : BookMeta | undefined = v.book[ref.end.book  ];

		if(b1_data && b2_data && b2_data.index < b1_data.index){
			results.push({
				ref        : ref,
				kind       : ErrKind.BackwardsRange,
				is_warning : false,
				message    : `Range is backwards (${b2_data.name} comes before ${b1_data.name})`,
				component  : "book",
			});
		} else if(ref.start.book === ref.end.book){
			if(ref.end.chapter < ref.start.chapter){
				results.push({
					ref        : ref,
					kind       : ErrKind.BackwardsRange,
					is_warning : false,
					message    : `Chapter range is backwards`,
					component  : "chapter",
				});
			} else if (ref.end.chapter === ref.start.chapter){
				if(ref.end.verse < ref.start.verse){
					results.push({
						ref        : ref,
						kind       : ErrKind.BackwardsRange,
						is_warning : false,
						message    : `Verse range is backwards`,
						component  : "verse",
					});
				} else if(ref.end.verse === ref.start.verse && include_warnings){
					results.push({
						ref        : ref,
						kind       : ErrKind.RangeOfOne,
						is_warning : true,
						message    : `Range contains only a single verse`,
					});
				}
			}
		}
	}

	return results;
}

/**
 * Attempts to fix errors identified by "validate". Will modify the specified
 * ref in place rather than making a copy
 * Will throw if the error is unfixable
 * @return reference to the passed in BibleRef
 */
export function repair(v: Versification, ref: BibleRef, include_warnings? : boolean) : BibleRef{
	let errors = validate(v, ref, include_warnings);

	for(let i = 0; i < 5 && errors.length; ++i){
		for(let err of errors){
			_fixError(v, err);
		}
		errors = validate(v, ref, include_warnings);
	}

	if(errors.length){ throw new Error("Max fix passes exceeded"); }

	return ref;
}


function _fixError(v : Versification, err: ValidationError) : void {
	switch(err.kind){
		case ErrKind.BadBook:
			throw new Error("Cannot fix an 'unknown book' error");
		case ErrKind.BadChapter:
			err.ref.chapter = err.max_value;
			err.ref.verse   = v.book[err.ref.book][err.ref.chapter].verse_count;
			break;
		case ErrKind.BadVerse:
			err.ref.verse = err.max_value;
			break;
		case ErrKind.BackwardsRange:
			let tmp = err.ref.start;
			err.ref.start = err.ref.end;
			err.ref.end   = tmp;
			break;
		case ErrKind.RangeOfOne:
			// We have to modify the object in place rather then setting to a new
			// object (as the whole point is we've passed it by reference)
			// Hence rebuild the members of the existing object
			let r = err.ref as any;
			r.book    = r.start.book;
			r.chapter = r.start.chapter;
			r.verse   = r.start.verse;
			delete r.is_range;
			delete r.start;
			delete r.end;
			break;
	}
}
