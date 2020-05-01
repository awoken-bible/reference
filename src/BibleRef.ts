/**
 * Includes base data types used by other modules
 */

import { Versification } from './Versification';

/**
 * Base data for an instance of the bible ref library
 * We allow users of this library to instantiate their own copies
 * with a custom versification as desired, eg to cope with apocrypha or
 * non-standard translations
 *
 * @private
 */
export interface BibleRefLibData {
	/**
	 * The versification used by methods
	 */
	versification: Versification,
};

/**
 * Represents a single verse of the Bible, by storing the USFM book id, as well
 * as the chapter and verse number.
 */
export interface BibleVerse {
	/**
	 * Field that allows us to distingish a [[BibleRange]] from a [[BibleVerse]]
	 */
	is_range? : undefined,

	/**
   * The 3 character book id
   */
	book: string,

	/**
	 * The chapter number within the book
	 * @note First chapter in a book has the value 1, not 0!
	 */
	chapter: number,

  /**
   * The number of the referenced verse
	 * @note First verse in a chapter has the value 1, not 0!
	 */
  verse: number,
};

/**
 * Type which represents a continous block of Bible verses
 */
export interface BibleRange {
	/**
	 * Field that allows us to distingish a [[BibleRange]] from a [[BibleVerse]]
	 */
	is_range: true,

	/**
	 * First verse in the range, inclusive
	 */
	start : BibleVerse,

	/**
	 * Last verse in the range, inclusive
	 */
	end   : BibleVerse,
};

/**
 * Union type that represents any continous section of bible, including
 * a single verse, to a span of text over multiple chapters/books
 */
export type BibleRef = BibleVerse | BibleRange;
export default BibleRef;
