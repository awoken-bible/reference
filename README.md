 # Awoken Bible Reference [![Build Status](https://travis-ci.org/awoken-bible/reference.svg?branch=master)](https://travis-ci.org/awoken-bible/reference) [![Coverage Status](https://coveralls.io/repos/github/awoken-bible/reference/badge.svg?branch=master)](https://coveralls.io/github/awoken-bible/reference?branch=master)

_Bible verse reference parsing, formating and meta data_

## Overview

The most basic usage of `awoken-bible-reference` is to simply deal with the conversion between the following representations of bible verse references:

<table>
<tr>
<th>What</th>
<th>Typescript Type</th>
<th>Example 1</th>
<th>Example 2</th>
</tr>
<tr>
<td>Human readable string</td>
<td>string</td>
<td>Genesis 1:1</td>
<td>Revelation 22:21</td>
</tr>
<tr>
<td>Verse Index</td>
<td>number</td>
<td>0</td>
<td>33021</td>
</tr>

<tr>
<td>JSON</td>
<td>

```typescript
interface BibleVerse {
  book    : string,
  chapter : number,
  verse   : number,
}
```

</td>
<td>

```json
{
  "book"    : "GEN",
  "chapter" : 1,
  "verse"   : 1,
}
```

</td>
<td>

```json
{
  "book"    : "REV",
  "chapter" : 22,
  "verse"   : 21,
}
```

</td>
</tr>
</table>

> Note that the verse index representation should be avoided unless you are sure that all translations you care about utalize the exact same [versification scheme](https://en.wikipedia.org/wiki/Chapters_and_verses_of_the_Bible). While it is useful for assigning unique IDs and computing offsets etc, it should probably not be used as a portable data exchange format.

Additionally the library supports more interesting operations such as:
- Parsing partial references, ranges, and comma seperated lists there of:
  - `Genesis 1:1-10,12, 2:14`
  - `EXO 3:1 - DEU 4:1`
  - `Matt 1; Luke3.16; Mark 1 v 2-3,5`
- Generating verbose human readable reference strings, and compact URL encodable equivalents
  - `Genesis 10 v6-10` vs `GEN10:6-10`
  - `Song of Solomon` vs `SNG`
- Validation and fixing of references, including out of range chapters and verses, and inverted ranges
  - `validate({book: 'GEN', chapter: 51, verse: 1})`<br/>
     becomes<br/>
    `{ message: "Genesis has only 50 chapters", got: 51, max_value: 50, ... }`
  - `fixErrors({book: 'GEN', chapter: 51, verse: 1})`<br/>
     becomes<br/>
    `{book: 'GEN', chapter: 50, verse: 26}`
- Sorting a list of references
- Counting the number of verses in a set of ranges
- Iterating by book/chapter/verse
- Truncating a list of ranges to a new list of ranges containing the first N verses (useful for pagination, or short previews of a longer text)

## Data Types

The following data types are exported:

```typescript
/** Representation of single verse */
interface BibleVerse {
  book    : string,
  chapter : number,
  verse   : number,
}

/** Representation of continous block of verses */
interface BibleRange {
	is_range : true,
	start    : BibleVerse,
	end      : BibleVerse,
};

/** Generic reference to verse or range */
type BibleRef = BibleVerse | BibleRange;
```

Most functions take `BibleRef`s as arguments and/or produce them as output, thus the `is_range` field can be used to distinguish the types from one another.

The `BibleVerse.book` string is always a 3 character mix of upper case letters and digits, as per the [USFM specification](https://ubsicap.github.io/usfm/identification/books.html).

## API

```typescript
type ParseResult = {
	status: true,
	value: BibleRef[],
} | {
	status: false,
	expected: string[],
	index: { column: number, line: number, offset: number },
};
parse(str: string) : ParseResult
```

Parses a human readable or compact string representing a bible reference, returning an array of references when the reference string contains multiple non-continous blocks, for example `Genesis ; Leviticus `, `Genesis 1, 10`, `Genesis 1:1,10`

```typescript
parseOrThrow(str: string) : BibleRef[]
```

As with `parse`, but returns the resultant object directly throwing if an error occurs.

```typescript
format(ref: BibleRef[] | BibleVerse | BibleRange, opts? : FormatOptions) : string
```

Formats any type of reference as a string, with opts allowing you to control verbosity.
