/**
 * Includes base data types used by other modules
 */

export interface BibleVerse {
	/**
   * The 3 character book id
   */
	book: string,

	/**
	 * The chapter number within the book, note, this is indexed from 1
	 * rather than 0 as with arrays
	 */
	chapter: number,

  /**
   * The number of the references verse
	 * @note This is index from 1 rather than 0!
	 */
  verse: number,
};

export interface BibleRange {
	/**
	 * Field that allows us to distingish a BibleRange from a BibleVerse
	 */
	is_range: true,
	start : BibleVerse,
	end   : BibleVerse,
};

/**
 * Union type that represents any continous section of bible, including
 * a single verse, to a span of text over multiple chapters
 */
export type BibleRef = BibleVerse | BibleRange;
export default BibleRef;
