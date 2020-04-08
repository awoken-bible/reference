/**
 * A Versification represents the way in which the bible text is split into
 * books, chapters and verses
 *
 * This module exports both a type decleration, and the default data set
 */

/**
 * Minimal data set used to create full BookMeta
 */
export interface BookMetaRaw {
	/**
	 * 4 character USFM identifier, in upper case
	 */
	id : string,

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

export interface Versification {
	// Array of books within this Versification scheme
	order : BookMeta[],

	// Mapping from book ID (eg GEN, REV) to the corresponding
	// element of the order array
	book : { [ index: string ] : BookMeta }
};

/**
 * Creates a full Versification object from the minimal data set by computing
 * the rest
 */
export function createVersification(data: BookMetaRaw[]) : Versification {
	let result : Versification = {
		order: [],
		book : {},
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

	return result;
}

let default_data : BookMetaRaw[] = [
	{ id            : 'GEN',
		name          : 'Genesis',
		aliases       : [],
		verse_counts  : [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
	},
	{ id            : 'EXO',
		name          : "Exodus",
		aliases       : ["Exod", "Ex"],
		verse_counts  : [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],
	},
	{ id            : 'LEV',
		name          : "Leviticus",
		aliases       : [],
		verse_counts  : [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
	},
	{ id            : 'NUM',
		name          : "Numbers",
		aliases       : [],
		verse_counts  : [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
	},
	{ id            : 'DEU',
		name          : "Deuteronomy",
		aliases       : ["Deut"],
		verse_counts  : [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
	},
	{ id            : 'JOS',
		name          : "Joshua",
		aliases       : ["Josh"],
		verse_counts  : [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
	},
	{ id            : 'JDG',
		name          : "Judges",
		aliases       : [],
		verse_counts  : [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
	},
	{ id            : 'RUT',
		name          : "Ruth",
		aliases       : [],
		verse_counts  : [22,23,18,22],
	},
	{ id            : '1SA',
		name          : "1 Samuel",
		aliases       : ["1 Sam"],
		verse_counts  : [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13],
	},
	{ id            : '2SA',
		name          : "2 Samuel",
		aliases       : ["2 Sam"],
		verse_counts  : [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
	},
	{ id            : '1KI',
		name          : "1 Kings",
		aliases       : ["1 Kgs"],
		verse_counts  : [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
	},
	{ id            : '2KI',
		name          : "2 Kings",
		aliases       : ["2 Kgs"],
		verse_counts  : [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
	},
	{ id            : '1CH',
		name          : "1 Chronicles",
		aliases       : ["1 Chr"],
		verse_counts  : [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
	},
	{ id            : '2CH',
		name          : "2 Chronicles",
		aliases       : ["2 Chr"],
		verse_counts  : [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
	},
	{ id            : 'EZR',
		name          : "Ezra",
		aliases       : [],
		verse_counts  : [11,70,13,24,17,22,28,36,15,44],
	},
	{ id            : 'NEH',
		name          : "Nehemiah",
		aliases       : [],
		verse_counts  : [11,20,32,23,19,19,73,18,38,39,36,47,31],
	},
	{ id            : 'EST',
		name          : "Esther",
		aliases       : [],
		verse_counts  : [22,23,15,17,14,14,10,17,32,3],
	},
	{ id            : 'JOB',
		name          : "Job",
		aliases       : [],
		verse_counts  : [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17],
	},
	{ id            : 'PSA',
		name          : "Psalm",
		aliases       : [ "Psalms", "Ps"],
		verse_counts  : [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
	},
	{ id            : 'PRO',
		name          : "Proverbs",
		aliases       : [ "Prov" ],
		verse_counts  : [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
	},
	{ id            : 'ECC',
		name          : "Ecclesiastes",
		aliases       : [ "Eccl" ],
		verse_counts  : [18,26,22,16,20,12,29,17,18,20,10,14],
	},
	{ id            : 'SNG',
		name          : "Song of Solomon",
		aliases       : [ "Song", "Song of Songs", "SOS", "SongOfSolomon", "SongOfSongs"],
		verse_counts  : [17,17,11,16,16,13,13,14],
	},
	{ id            : 'ISA',
		name          : "Isaiah",
		aliases       : [],
		verse_counts  : [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
	},
	{ id            : 'JER',
		name          : "Jeremiah",
		aliases       : [],
		verse_counts  : [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
	},
	{ id            : 'LAM',
		name          : "Lamentations",
		aliases       : [],
		verse_counts  : [22,22,66,22,22],
	},
	{ id            : 'EZK',
		name          : "Ezekiel",
		aliases       : [ "Ezek" ],
		verse_counts  : [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
	},
	{ id            : 'DAN',
		name          : "Daniel",
		aliases       : [],
		verse_counts  : [21,49,30,37,31,28,28,27,27,21,45,13],
	},
	{ id            : 'HOS',
		name          : "Hosea",
		aliases       : [],
		verse_counts  : [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
	},
	{ id            : 'JOL',
		name          : "Joel",
		aliases       : [],
		verse_counts  : [20,32,21],
	},
	{ id            : 'AMO',
		name          : "Amos",
		aliases       : [],
		verse_counts  : [15,16,15,13,27,14,17,14,15],
	},
	{ id            : 'OBA',
		name          : "Obadiah",
		aliases       : [ "Obad" ],
		verse_counts  : [21],
	},
	{ id            : 'JON',
		name          : "Jonah",
		aliases       : [],
		verse_counts  : [17,10,10,11],
	},
	{ id            : 'MIC',
		name          : "Micah",
		aliases       : [],
		verse_counts  : [16,13,12,13,15,16,20],
	},
	{ id            : 'NAM',
		name          : "Nahum",
		aliases       : [],
		verse_counts  : [15,13,19],
	},
	{ id            : 'HAB',
		name          : "Habakkuk",
		aliases       : [],
		verse_counts  : [17,20,19],
	},
	{ id            : 'ZEP',
		name          : "Zephaniah",
		aliases       : [ "Zeph" ],
		verse_counts  : [18,15,20],
	},
	{ id            : 'HAG',
		name          : "Haggai",
		aliases       : [],
		verse_counts  : [15,23],
	},
	{ id            : 'ZEC',
		name          : "Zechariah",
		aliases       : [ "Zech" ],
		verse_counts  : [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
	},
	{ id            : 'MAL',
		name          : "Malachi",
		aliases       : [],
		verse_counts  : [14,17,18,6],
	},
	{ id            : 'MAT',
		name          : "Matthew",
		aliases       : [ "Matt" ],
		verse_counts  : [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],
	},
	{ id            : 'MRK',
		name          : "Mark",
		aliases       : [],
		verse_counts  : [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],
	},
	{ id            : 'LUK',
		name          : "Luke",
		aliases       : [],
		verse_counts  : [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],
	},
	{ id            : 'JHN',
		name          : "John",
		aliases       : [],
		verse_counts  : [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],
	},
	{ id            : 'ACT',
		name          : "Acts",
		aliases       : [],
		verse_counts  : [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],
	},
	{ id            : 'ROM',
		name          : "Romans",
		aliases       : [],
		verse_counts  : [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],
	},
	{ id            : '1CO',
		name          : "1 Corinthians",
		aliases       : [ "1 Cor"],
		verse_counts  : [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24],
	},
	{ id            : '2CO',
		name          : "2 Corinthians",
		aliases       : ["2 Cor"],
		verse_counts  : [24,17,18,18,21,18,16,24,15,18,33,21,14],
	},
	{ id            : 'GAL',
		name          : "Galatians",
		aliases       : [],
		verse_counts  : [24,21,29,31,26,18],
	},
	{ id            : 'EPH',
		name          : "Ephesians",
		aliases       : [],
		verse_counts  : [23,22,21,32,33,24],
	},
	{ id            : 'PHP',
		name          : "Philippians",
		aliases       : [],
		verse_counts  : [30,30,21,23],
	},
	{ id            : 'COL',
		name          : "Colossians",
		aliases       : [],
		verse_counts  : [29,23,25,18],
	},
	{ id            : '1TH',
		name          : "1 Thessalonians",
		aliases       : ["1 Thess"],
		verse_counts  : [10,20,13,18,28],
	},
	{ id            : '2TH',
		name          : "2 Thessalonians",
		aliases       : ["2 Thess"],
		verse_counts  : [12,17,18],
	},
	{ id            : '1TI',
		name          : "1 Timothy",
		aliases       : [],
		verse_counts  : [20,15,16,16,25,21],
	},
	{ id            : '2TI',
		name          : "2 Timothy",
		aliases       : [],
		verse_counts  : [18,26,17,22],
	},
	{ id            : 'TIT',
		name          : "Titus",
		aliases       : [],
		verse_counts  : [16,15,15],
	},
	{ id            : 'PHM',
		name          : "Philemon",
		aliases       : ["Phlm"],
		verse_counts  : [25],
	},
	{ id            : 'HEB',
		name          : "Hebrews",
		aliases       : [],
		verse_counts  : [14,18,19,16,14,20,28,13,28,39,40,29,25],
	},
	{ id            : 'JAS',
		name          : "James",
		aliases       : [],
		verse_counts  : [27,26,18,17,20],
	},
	{ id            : '1PE',
		name          : "1 Peter",
		aliases       : [],
		verse_counts  : [25,25,22,19,14],
	},
	{ id            : '2PE',
		name          : "2 Peter",
		aliases       : [],
		verse_counts  : [21,22,18],
	},
	{ id            : '1JN',
		name          : "1 John",
		aliases       : [],
		verse_counts  : [10,29,24,21,21],
	},
	{ id            : '2JN',
		name          : "2 John",
		aliases       : [],
		verse_counts  : [13],
	},
	{ id            : '3JN',
		name          : "3 John",
		aliases       : [],
		verse_counts  : [14],
	},
	{ id            : 'JUD',
		name          : "Jude",
		aliases       : [],
		verse_counts  : [25],
	},
	{ id            : 'REV',
		name          : "Revelation",
		aliases       : [],
		verse_counts  : [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21],
	},
];

export const VERSIFICATION : Versification = createVersification(default_data);
export default VERSIFICATION;
