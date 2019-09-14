import VERSIFICATION from './Versification';

/**
 * Represents a sequence of books, eg, could be the entire bible,
 * or some subset such as the new testement, or the torah
 */
export interface BookSequence {
	/**
	 * Determines whether this BookSequence contains a given book reference
	 */
	contains    : (ref: string) => boolean;

	/**
	 * Given a book reference gets the following book, or NULL
	 * if there is no next book
	 */
	getNext     : (ref: string) => string | null;

	/**
	 * Given a book reference gets the previous book, or NULL
	 * if there is no previous book
	 */
	getPrevious : (ref: string) => string | null;

	/**
	 * Gets the first book in the sequence
	 */
	getFirst    : (           ) => string;

	/**
	 * Gets the last book in the sequence
	 */
	getLast     : (           ) => string;

	/**
	 * Gets full human readable name of a book, eg GEN becomes genesis
	 */
	getName     : (ref: string) => string;

	/**
	 * Gets full list of references in this BookSequence
	 */
	getRefs     : () => [string];

	/**
	 * Gets full list of names of books in this sequence
	 */
	getNames    : () => [string];

	/**
	 * Number of books
	 */
	length : number;

	/**
	 * Access a ref by index
	 */
	[index: number] : string | null;
};

function createFromLists(refs : string[], names: string[]) : BookSequence {
	if(refs.length !== names.length){
		console.log(refs.length);
		console.log(names.length);
		throw new Error("List of reference names and book names must be equal!");
	}

	function idxOf(ref : string) { return refs.indexOf(ref.toUpperCase()); }

	let result : any = [...refs];
	result.contains = (ref: string) => idxOf(ref) >= 0;

	result.getNext = (ref: string) => {
		let idx = idxOf(ref);
		if(idx < 0 || idx >= refs.length-1){ return null; }
		return refs[idx + 1];
	};

	result.getPrevious = (ref: string) => {
		let idx = idxOf(ref);
		if(idx < 1){ return null; }
		return refs[idx - 1];
	};

	result.getFirst = () => { return refs[0]; };
	result.getLast  = () => { return refs[refs.length-1]; };

	result.getName  = (ref: string) => {
		let idx = idxOf(ref);
		if(idx == null){ return null; }
		return names[idx];
	};

	result.getRefs  = () => [...refs];
	result.getNames = () => [...names];

	return result as BookSequence;
}

function createFromRange(start: number, end: number) : BookSequence {
	let books = VERSIFICATION.order.slice(start, end);
	return createFromLists(books.map(b => b.id), books.map(b => b.name));
}

const Bible        = createFromRange( 0, 66);
const Torah        = createFromRange( 0,  5);
const OldTestament = createFromRange( 0, 39);
const NewTestament = createFromRange(39, 67);

export default Bible;
export { Bible };
export { OldTestament };
export { NewTestament };
export { Torah };
