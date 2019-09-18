/**
 * Allows for validation of BibleRefs
 */

import { BibleRef, BibleVerse }    from './BibleRef';
import { Versification, BookMeta } from './Versification'


export enum ErrKind {
	/** The specified book does not exist */
	InvalidBook = "BADBOOK",

	/** Verse number is higher than number of verses in chapter */
	OutOfBoundsVerse = "BADVERSE",

	/** Chapter number is higher than number of chapters in book */
	OutOfBoundsChapter = "BADCHPT",

	/** A range goes from later in the bible to earlier in the bible */
	BackwardsRange = "INVERTEDRANGE",

	//////////////////////////////////////////////
	// Warnings below

	/** A range contains just a single verse */
	RangeOfOne = "USELESSRANGE",
};

export type ValidationError = {
	kind: ErrKind.InvalidBook,
	is_warning: false,
	message: string,
	got: string,
} | {
	kind: ErrKind.OutOfBoundsVerse | ErrKind.OutOfBoundsChapter,
	is_warning: false,
	message: string,

	max_value: number,
	got: number,
} | {
	kind: ErrKind.BackwardsRange,
	is_warning: false,
	message: string,

	/** The most significant part of the range which is reversed */
	component: "book" | "chapter" | "verse",
} | {
	kind: ErrKind.RangeOfOne,
	is_warning: true,
	message: string,
};

function _validateVerse(v : Versification, ref: BibleVerse) : ValidationError[] {
	let b_data : BookMeta | undefined = v.book[ref.book];

	let results : ValidationError[] = [];

	if(b_data == undefined){
		results.push({
			kind       : ErrKind.InvalidBook,
			is_warning : false,
			message    : "The specified book does not exist",
			got        : ref.book,
		});
	} else if (b_data.chapters.length < ref.chapter){
		results.push({
			kind       : ErrKind.OutOfBoundsChapter,
			is_warning : false,
			message    : `${b_data.name} has only ${b_data.chapters.length} chapters`,
			max_value  : b_data.chapters.length,
			got        : ref.chapter,
		});
	} else if(b_data[ref.chapter].verse_count < ref.verse){
		results.push({
			kind       : ErrKind.OutOfBoundsVerse,
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
				kind       : ErrKind.BackwardsRange,
				is_warning : false,
				message    : `Range is backwards (${b2_data.name} comes before ${b1_data.name})`,
				component  : "book",
			});
		} else if(ref.start.book === ref.end.book){
			if(ref.end.chapter < ref.start.chapter){
				results.push({
					kind       : ErrKind.BackwardsRange,
					is_warning : false,
					message    : `Chapter range is backwards`,
					component  : "chapter",
				});
			} else if (ref.end.chapter === ref.start.chapter){
				if(ref.end.verse < ref.start.verse){
					results.push({
						kind       : ErrKind.BackwardsRange,
						is_warning : false,
						message    : `Verse range is backwards`,
						component  : "verse",
					});
				} else if(ref.end.verse === ref.start.verse && include_warnings){
					results.push({
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
