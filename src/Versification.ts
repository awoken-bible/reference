/**
 * A Versification represents the way in which the bible text is split into
 * books, chapters and verses
 *
 * This module exports both a type decleration, and the default data set
 */
import BibleRef from './BibleRef';
import { _makeBookRange } from './range-manip';

/**
 * Minimal data set used to create full BookMeta
 * @private
 */
export interface BookMetaRaw {
	/**
	 * 4 character USFM identifier, in upper case
	 */
	id : string,

	/**
	 * Shortened book name used in osis references
	 */
	osisId: string,

	/**
	 * Canconical, long form, name
	 */
	name: string,

	/**
	 * Common aliases/abbreviations
	 */
	aliases: string[],

	/**
	 * Array of the number of verses in each chapter
	 * Number of chapters in the book is implied by the length of this array
	 */
	verse_counts : number[],
};

export interface ChapterMeta {
	/**
	 * Number of verses within this chapter
	 */
	verse_count: number;

	/**
	 * The cumulative number of verses between the beginning of the versification
	 * and the first verse of this chapter
	 */
	cumulative_verse: number;
};

export interface BookMeta {
	// 3 character USFM identifier, in upper case
	id: string,

	// shortened book name used in osis references
	osisId: string,

	// Canconical name
	name: string,

	// 0 based index defining the ordering of the books
	index : number,

	// Common aliases/shortenings
	aliases: string[],

	// Array of ChapterMeta's for each chapter in the book
	chapters: ChapterMeta[],

	// Mapping of chapter number to meta data concerning a chapter
	[index: number] : ChapterMeta,
};

/**
 * A range alias is a regex pattern which denotes a named BibleRef set
 * Eg, these should parse equivalently:
 * - "Gospels" 'Mat-Jhn'
 * - "Old Testament" = 'Gen-Mal'
 */
interface RangeAlias {
	pattern: RegExp;
	refs: BibleRef[];
}

/**
 * Argument that can be used to create a RangeAlias using just a compact
 * [book,book] representation for full book ranges where the books are used
 * as an argument to makeBookRange
 *
 * (this is primarily used in the createVersification arguments to make
 * the hard coded data we need to store both smaller (good for browser bundle)
 * and more compatible with versifications with different verse number divisions
 * (as we don't duplicate data about chapter/verse count inside a raw refs array)
 */
type RangeAliasRaw = RangeAlias | {
	pattern: RegExp
	books: ([string,string] | [string])[];
}

export interface Versification {
	/**
	 * Array of books within this Versification scheme
	 */
	order : BookMeta[],

	/**
	 * Mapping from book ID (eg GEN, REV) to the corresponding
	 * element of the order array
	 */
	book : { [ index: string ] : BookMeta },

	/** Set of aliases that map onto cross-book ranges */
	rangeAliases: RangeAlias[];
};

/**
 * Creates a full Versification object from the minimal data set by computing
 * the rest
 */
export function createVersification(data: BookMetaRaw[], rangeAliases: RangeAliasRaw[] = []) : Versification {
	let result : Versification = {
		order: [],
		book : {},
		rangeAliases: [],
	};

	let accumulator = 0;
	for(let i = 0; i < data.length; ++i){
		let raw = data[i];

		let chapters : ChapterMeta[] = [];
		for(let c of raw.verse_counts){
			chapters.push({
				verse_count      : c,
				cumulative_verse : accumulator,
			});
			accumulator += c;
		}

		let b_meta : BookMeta = {
			id       : raw.id,
			osisId   : raw.osisId,
			name     : raw.name,
			index    : i,
			aliases  : raw.aliases,
			chapters : chapters,
		};

		for(let j = 0; j < chapters.length; ++j){
			b_meta[j+1] = chapters[j];
		}
		result.order.push(b_meta);
		result.book[b_meta.id] = b_meta;
	}

	result.rangeAliases = rangeAliases.map(x => {
		if('refs' in x) { return x; }
		return {
			pattern: x.pattern,
			refs: x.books.map(b => _makeBookRange(result, b[0], b[1]))
		}
	}) as any[];

	return result;
}

/**
 * Contains meta data concerning books of the bible as per standard versification scheme.
 * This does not include the apocrypha
 *
 * Aliases contains common abbrevations for books compiled from various sources. Note that these
 * must be unique since the parser relies on them!
 *
 * USFM Abbreviations:
 * - https://ubsicap.github.io/usfm/identification/books.html
 *
 * OSIS Abbreviations:
 * - https://wiki.crosswire.org/OSIS_Book_Abbreviations
 *
 * Chicago Abbreviations:
 * - https://hbl.gcc.libguides.com/ld.php?content_id=13822328
 *
 * Other Abbreviation Sources:
 * - https://www.aresearchguide.com/bibleabb.html
 * - https://www.logos.com/bible-book-abbreviations
 * - https://www.biblija.net/abbrevs.all.php
 *
 * @private
 */
const default_data : BookMetaRaw[] = [
	{ id            : 'GEN',
	  osisId        : 'Gen',
	  name          : 'Genesis',
	  aliases       : ['Gn', 'Ge'],
	  verse_counts  : [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
	},
	{ id            : 'EXO',
	  osisId        : 'Exod',
	  name          : 'Exodus',
	  aliases       : ['Exod', 'Ex'],
	  verse_counts  : [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],
	},
	{ id            : 'LEV',
	  osisId        : 'Lev',
	  name          : 'Leviticus',
	  aliases       : ['Lv', 'Le'],
	  verse_counts  : [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
	},
	{ id            : 'NUM',
	  osisId        : 'Num',
	  name          : 'Numbers',
	  aliases       : ['Nm', 'Nu', 'Nb'],
	  verse_counts  : [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
	},
	{ id            : 'DEU',
	  osisId        : 'Deut',
	  name          : 'Deuteronomy',
	  aliases       : ['Deut', 'Dt', 'De'],
	  verse_counts  : [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
	},
	{ id            : 'JOS',
	  osisId        : 'Josh',
	  name          : 'Joshua',
	  aliases       : ['Josh', 'Jo', 'Jsh'],
	  verse_counts  : [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
	},
	{ id            : 'JDG',
	  osisId        : 'Judg',
	  name          : 'Judges',
	  aliases       : ['Judg', 'Jgs', 'Jg', 'Jdgs'],
	  verse_counts  : [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
	},
	{ id            : 'RUT',
	  osisId        : 'Ruth',
	  name          : 'Ruth',
	  aliases       : ['Ru', 'Rth'],
	  verse_counts  : [22,23,18,22],
	},
	{ id            : '1SA',
	  osisId        : '1Sam',
	  name          : '1 Samuel',
	  aliases       : ['1 Sam', '1 Sm'],
	  verse_counts  : [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13],
	},
	{ id            : '2SA',
	  osisId        : '2Sam',
	  name          : '2 Samuel',
	  aliases       : ['2 Sam', '2 Sm'],
	  verse_counts  : [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
	},
	{ id            : '1KI',
	  osisId        : '1Kgs',
	  name          : '1 Kings',
	  aliases       : ['1 Kgs', '1 Kin'],
	  verse_counts  : [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
	},
	{ id            : '2KI',
	  osisId        : '2Kgs',
	  name          : '2 Kings',
	  aliases       : ['2 Kgs', '2 Kin'],
	  verse_counts  : [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
	},
	{ id            : '1CH',
	  osisId        : '1Chr',
	  name          : '1 Chronicles',
	  aliases       : ['1 Chr', '1 Chron'],
	  verse_counts  : [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
	},
	{ id            : '2CH',
	  osisId        : '2Chr',
	  name          : '2 Chronicles',
	  aliases       : ['2 Chr', '2 Chron'],
	  verse_counts  : [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
	},
	{ id            : 'EZR',
	  osisId        : 'Ezra',
	  name          : 'Ezra',
	  aliases       : ['Ezr'],
	  verse_counts  : [11,70,13,24,17,22,28,36,15,44],
	},
	{ id            : 'NEH',
	  osisId        : 'Neh',
	  name          : 'Nehemiah',
	  aliases       : ['Ne'],
	  verse_counts  : [11,20,32,23,19,19,73,18,38,39,36,47,31],
	},
	{ id            : 'EST',
	  osisId        : 'Esth',
	  name          : 'Esther',
	  aliases       : ['Esth', 'Es'],
	  verse_counts  : [22,23,15,17,14,14,10,17,32,3],
	},
	{ id            : 'JOB',
	  osisId        : 'Job',
	  name          : 'Job',
	  aliases       : ['Jb'],
	  verse_counts  : [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17],
	},
	{ id            : 'PSA',
	  osisId        : 'Ps',
	  name          : 'Psalm',
	  aliases       : ['Psalms', 'Ps', 'Pss', 'Psm', 'Pslm'],
	  verse_counts  : [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
	},
	{ id            : 'PRO',
	  osisId        : 'Prov',
	  name          : 'Proverbs',
	  aliases       : ['Prov', 'Prv', 'Pr'],
	  verse_counts  : [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
	},
	{ id            : 'ECC',
	  osisId        : 'Eccl',
	  name          : 'Ecclesiastes',
	  aliases       : [ 'Eccl', 'Eccles', 'Ec', 'Eccle', 'Qoheleth', 'Qoh', 'Kohelet', 'Koh' ],
	  verse_counts  : [18,26,22,16,20,12,29,17,18,20,10,14],
	},
	{ id            : 'SNG',
	  osisId        : 'Song',
	  name          : 'Song of Solomon',
	  aliases       : [ 'Song', 'Song of Songs', 'SOS', 'SongOfSolomon', 'SongOfSongs', 'Song of Sol', 'Sg', 'Canticles', 'Cant'],
	  verse_counts  : [17,17,11,16,16,13,13,14],
	},
	{ id            : 'ISA',
	  osisId        : 'Isa',
	  name          : 'Isaiah',
	  aliases       : ['Is'],
	  verse_counts  : [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
	},
	{ id            : 'JER',
	  osisId        : 'Jer',
	  name          : 'Jeremiah',
	  aliases       : ['Je', 'Jr'],
	  verse_counts  : [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
	},
	{ id            : 'LAM',
	  osisId        : 'Lam',
	  name          : 'Lamentations',
	  aliases       : ['La'],
	  verse_counts  : [22,22,66,22,22],
	},
	{ id            : 'EZK',
	  osisId        : 'Ezek',
	  name          : 'Ezekiel',
	  aliases       : [ 'Ezek', 'Ez', 'Eze' ],
	  verse_counts  : [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
	},
	{ id            : 'DAN',
	  osisId        : 'Dan',
	  name          : 'Daniel',
	  aliases       : ['Dn', 'Da'],
	  verse_counts  : [21,49,30,37,31,28,28,27,27,21,45,13],
	},
	{ id            : 'HOS',
	  osisId        : 'Hos',
	  name          : 'Hosea',
	  aliases       : ['Ho'],
	  verse_counts  : [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
	},
	{ id            : 'JOL',
	  osisId        : 'Joel',
	  name          : 'Joel',
	  aliases       : ['Jl', 'Joe'],
	  verse_counts  : [20,32,21],
	},
	{ id            : 'AMO',
	  osisId        : 'Amos',
	  name          : 'Amos',
	  aliases       : ['Am'],
	  verse_counts  : [15,16,15,13,27,14,17,14,15],
	},
	{ id            : 'OBA',
	  osisId        : 'Obad',
	  name          : 'Obadiah',
	  aliases       : ['Obad', 'Ob'],
	  verse_counts  : [21],
	},
	{ id            : 'JON',
	  osisId        : 'Jonah',
	  name          : 'Jonah',
	  aliases       : ['Jnh'],
	  verse_counts  : [17,10,10,11],
	},
	{ id            : 'MIC',
	  osisId        : 'Mic',
	  name          : 'Micah',
	  aliases       : ['Mi', 'Mc', 'Mch'],
	  verse_counts  : [16,13,12,13,15,16,20],
	},
	{ id            : 'NAM',
	  osisId        : 'Nah',
	  name          : 'Nahum',
	  aliases       : ['Na', 'Nah'],
	  verse_counts  : [15,13,19],
	},
	{ id            : 'HAB',
	  osisId        : 'Hab',
	  name          : 'Habakkuk',
	  aliases       : ['Hb'],
	  verse_counts  : [17,20,19],
	},
	{ id            : 'ZEP',
	  osisId        : 'Zeph',
	  name          : 'Zephaniah',
	  aliases       : ['Zeph', 'Zp'],
	  verse_counts  : [18,15,20],
	},
	{ id            : 'HAG',
	  osisId        : 'Hag',
	  name          : 'Haggai',
	  aliases       : ['Hg', 'Hagg', 'Hgg'],
	  verse_counts  : [15,23],
	},
	{ id            : 'ZEC',
	  osisId        : 'Zech',
	  name          : 'Zechariah',
	  aliases       : ['Zech', 'Zec', 'Zc', 'Zch', 'Zah'],
	  verse_counts  : [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
	},
	{ id            : 'MAL',
	  osisId        : 'Mal',
	  name          : 'Malachi',
	  aliases       : ['Ml'],
	  verse_counts  : [14,17,18,6],
	},

	//
	// NEW TESTEMANT
	//

	{ id            : 'MAT',
	  osisId        : 'Matt',
	  name          : 'Matthew',
	  aliases       : ['Matt', 'Mt'],
	  verse_counts  : [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],
	},
	{ id            : 'MRK',
	  osisId        : 'Mark',
	  name          : 'Mark',
	  aliases       : ['Mk', 'Mar', 'Mr'],
	  verse_counts  : [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],
	},
	{ id            : 'LUK',
	  osisId        : 'Luke',
	  name          : 'Luke',
	  aliases       : ['Lk', 'Lu', 'Lc', 'Luc'],
	  verse_counts  : [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],
	},
	{ id            : 'JHN',
	  osisId        : 'John',
	  name          : 'John',
	  aliases       : ['Jn'],
	  verse_counts  : [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],
	},
	{ id            : 'ACT',
	  osisId        : 'Acts',
	  name          : 'Acts',
	  aliases       : ['Ac'],
	  verse_counts  : [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],
	},
	{ id            : 'ROM',
	  osisId        : 'Rom',
	  name          : 'Romans',
	  aliases       : ['Ro', 'Rm'],
	  verse_counts  : [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],
	},
	{ id            : '1CO',
	  osisId        : '1Cor',
	  name          : '1 Corinthians',
	  aliases       : [ '1 Cor'],
	  verse_counts  : [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24],
	},
	{ id            : '2CO',
	  osisId        : '2Cor',
	  name          : '2 Corinthians',
	  aliases       : ['2 Cor'],
	  verse_counts  : [24,17,18,18,21,18,16,24,15,18,33,21,14],
	},
	{ id            : 'GAL',
	  osisId        : 'Gal',
	  name          : 'Galatians',
	  aliases       : ['Ga', 'Gl'],
	  verse_counts  : [24,21,29,31,26,18],
	},
	{ id            : 'EPH',
	  osisId        : 'Eph',
	  name          : 'Ephesians',
	  aliases       : ['Ephes'],
	  verse_counts  : [23,22,21,32,33,24],
	},
	{ id            : 'PHP',
	  osisId        : 'Phil',
	  name          : 'Philippians',
	  aliases       : ['Phil', 'Phl', 'Pp'],
	  verse_counts  : [30,30,21,23],
	},
	{ id            : 'COL',
	  osisId        : 'Col',
	  name          : 'Colossians',
	  aliases       : [],
	  verse_counts  : [29,23,25,18],
	},
	{ id            : '1TH',
	  osisId        : '1Thess',
	  name          : '1 Thessalonians',
	  aliases       : ['1 Thess', '1 Thes', '1 Te', '1 Ts', '1 Tess'],
	  verse_counts  : [10,20,13,18,28],
	},
	{ id            : '2TH',
	  osisId        : '2Thess',
	  name          : '2 Thessalonians',
	  aliases       : ['2 Thess', '2 Thes', '2 Te', '2 Ts', '2 Tess'],
	  verse_counts  : [12,17,18],
	},
	{ id            : '1TI',
	  osisId        : '1Tim',
	  name          : '1 Timothy',
	  aliases       : ['1 Tim', '1 Tm', '1 Ti'],
	  verse_counts  : [20,15,16,16,25,21],
	},
	{ id            : '2TI',
	  osisId        : '2Tim',
	  name          : '2 Timothy',
	  aliases       : ['2 Tim', '2 Tm', '2 Ti'],
	  verse_counts  : [18,26,17,22],
	},
	{ id            : 'TIT',
	  osisId        : 'Titus',
	  name          : 'Titus',
	  aliases       : ['Ti', 'Tt'],
	  verse_counts  : [16,15,15],
	},
	{ id            : 'PHM',
	  osisId        : 'Phlm',
	  name          : 'Philemon',
	  aliases       : ['Phlm', 'Philem', 'Pm'],
	  verse_counts  : [25],
	},
	{ id            : 'HEB',
	  osisId        : 'Heb',
	  name          : 'Hebrews',
	  aliases       : ['Hbr', 'Hebr', 'He'],
	  verse_counts  : [14,18,19,16,14,20,28,13,28,39,40,29,25],
	},
	{ id            : 'JAS',
	  osisId        : 'Jas',
	  name          : 'James',
	  aliases       : ['Jm'],
	  verse_counts  : [27,26,18,17,20],
	},
	{ id            : '1PE',
	  osisId        : '1Pet',
	  name          : '1 Peter',
	  aliases       : ['1 Pet', '1 Pt', '1 Pe', '1 Petr'],
	  verse_counts  : [25,25,22,19,14],
	},
	{ id            : '2PE',
	  osisId        : '2Pet',
	  name          : '2 Peter',
	  aliases       : ['2 Pet', '2 Pt', '2 Pe', '2 Petr'],
	  verse_counts  : [21,22,18],
	},
	{ id            : '1JN',
	  osisId        : '1John',
	  name          : '1 John',
	  aliases       : ['1 Jn', '1 Jo', '1 Joh'],
	  verse_counts  : [10,29,24,21,21],
	},
	{ id            : '2JN',
	  osisId        : '2John',
	  name          : '2 John',
	  aliases       : ['2 Jn', '2 Jo', '2 Joh'],
	  verse_counts  : [13],
	},
	{ id            : '3JN',
	  osisId        : '3John',
	  name          : '3 John',
	  aliases       : ['3 Jn', '3 Jo', '3 Joh'],
	  verse_counts  : [14],
	},
	{ id            : 'JUD',
	  osisId        : 'Jude',
	  name          : 'Jude',
	  aliases       : ['Jde', 'Jd'],
	  verse_counts  : [25],
	},
	{ id            : 'REV',
	  osisId        : 'Rev',
	  name          : 'Revelation',
	  aliases       : ['Apoc', 'Rv'],
	  verse_counts  : [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21],
	},
];

const default_range_aliases : RangeAliasRaw[] = [
	{
		pattern: /gospels?/i,
		books: [['MAT', 'JHN']],
	}, {
		pattern: /torah|pentateuch|law|(five )?books of moses/i,
		books: [['GEN', 'DEU']],
	}, {
		pattern: /old test[ae]ment|tanakh/i, // accept common mis-spelling
		books: [['GEN', 'MAL']],
	}, {
		pattern: /new test[ae]ment/i, // accept common mis-spelling
		books: [['MAT', 'REV']],
	}, {
		pattern: /ketuvim/i,
		books: [['JOS', 'JDG'], ['1SA', '2KI'], ['ISA', 'JER'], ['EZK'], ['HOS', 'MAL']],
	}, {
		pattern: /nevi'?im/i,
		books: [['RUT'], ['1CH', 'SNG'], ['LAM'], ['DAN']],
	}
]

export const VERSIFICATION : Versification = createVersification(default_data, default_range_aliases);
export default VERSIFICATION;
