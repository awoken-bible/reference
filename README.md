 # Awoken Bible Reference [![Build Status](https://travis-ci.org/awoken-bible/reference.svg?branch=master)](https://travis-ci.org/awoken-bible/reference) [![Coverage Status](https://coveralls.io/repos/github/awoken-bible/reference/badge.svg?branch=master)](https://coveralls.io/github/awoken-bible/reference?branch=master)

_Bible verse reference parsing, formating and manipulation_

[Click for public API reference docs](https://awoken-bible.github.io/reference/index.html).

## Quick Start Guide

### Node JS

To use the default versification scheme, simple import the libary and use the global [API functions](https://awoken-bible.github.io/reference/index.html).

```typescript
import AwokenRef from 'awoken-bible-reference';

let vref = AwokenRef.parseOrThrow('Genesis 1');
if(AwokenRef.countVerses(vref) > 10)){
	vref = AwokenRef.firstNVerses(vref, 10);
}
vref = AwokenRef.getIntersection(vref, AwokenRef.parseOrThrow('GEN 1 v6,9-20'));

// Print as human readable verse reference (IE: "Genesis 1:6,9-10")
console.log(AwokenRef.format(vref));

// Print as url encodable reference (IE: "gen1v6,9-10")
console.log(AwokenRef.format(vref, { url: true }));

// Inspect the object, will yield:
// [ { book: 'GEN', chapter: 1, verse: 6 },
//   { is_range : true,
//     start    : { book: 'GEN', chapter: 1, verse:  9 },
//     end      : { book: 'GEN', chapter: 1, verse: 10 },
//   }
// ]
console.dir(vref);
```

Non-standard versification schemes can be used by instead creating an instance of the library. This allows support to be added for the Apocrypha, or translations that use a different split of verses per chapter.

```typescript
import __AwokenRef__ from 'awoken-bible-reference';

const AwokenRef = new __AwokenRef__(my_versificaton);

let vref = AwokenRef.parse('MyBook 100:999');
```

The full list of methods on the `AwokenRef` object can be found in the [API docs](https://awoken-bible.github.io/reference/index.html).

### Browser

If using plain javascript in the browser with no build-system to bundle your dependencies, you may simply reference the file found in `./dist.browser/awoken-ref.js`.

This will create a global "AwokenRef` variable, which can be used as both an instance of the library, and a constructor to create new instances with non-default versification schemes.

```html

<script src="[path]/awoken-ref.js"/>


<script>
	var refs = AwokenRef.parseOrThrow('Tobit 1.1'); // error!

	var lib = new AwokenRef(myCustomVersificationWithApocrytha);
	var myRefs = lib.parseOrThrow('Tobit 1.1'); // success!
</script>
```

# Type Representations

## Bible Verses

`awoken-bible-reference` can represent (and convert between) the following representations of a Bible verse:

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

The `book` field is always a 3 character mix of upper case letters and digits, as per the [USFM specification](https://ubsicap.github.io/usfm/identification/books.html).

## BibleRanges

BibleRanges are represented by an object of the form:

```typescript
/** Representation of continous block of verses */
interface BibleRange {
	is_range : true,
	start    : BibleVerse,
	end      : BibleVerse,
};
```

## Mixed Sets

Note that most API function can take either `BibleRange` or `BibleVerse` objects (or lists thereof), and thus the `is_range` field can be used to easily distinguish the types from one another.

The following union type is also exported for convenience:

```typescript
/** Generic reference to verse or range */
type BibleRef = BibleVerse | BibleRange;
```

# Overview of Functionality

API methods include functionality to:

- Parse partial references, ranges, and comma separated lists there of:
  - `Genesis 1:1-10,12, 2:14`
  - `EXO 3:1 - DEU 4:1`
  - `Matt 1; Luke3.16; Mark 1 v 2-3,5`
- Generate verbose human readable reference strings, and compact URL encodable equivalents
  - `Genesis 10 v6-10` vs `gen10v6-10`
  - `Song of Solomon` vs `sng`
- Validate and fix references, including out of range chapters and verses, and inverted ranges:
  - `validate({book: 'GEN', chapter: 51, verse: 1})`<br/>
     becomes<br/>
    `{ message: "Genesis has only 50 chapters", got: 51, max_value: 50, ... }`
  - `fixErrors({book: 'GEN', chapter: 51, verse: 1})`<br/>
     becomes<br/>
    `{book: 'GEN', chapter: 50, verse: 26}`
- Sorting a list of references
- Counting the number of verses in a list of `BibleRef` instances
- Iterating/Splitting by book/chapter/verse
- Truncating a list of `BibleRef`s to contain only the first N verses (useful for pagination, or short previews of a longer text)
- Combining/Simplifying ranges, as well as finding the intersection/union of ranges

For a full list of the exported functions and data types, see the [generated typedoc API reference](https://awoken-bible.github.io/reference/index.html).

# Build Targets

The published copy of this library multiple output targets. Node.js projects should autoload the correct version, and there also exists a browser bundle.


- `dist/awoken-ref.cjs.js` - CommonJS module loadable via require() in nodejs project - built via esbuild
- `dist/awoken-ref.esm.mjs` - ESModule loadable via import() in nodejs type=module projects - built via esbuild
- `dist/awoken-ref.min.js` - Browser bundle, loadable via `<script>` tag, and will create a global AwokenRef variable with attached functions using the default versification, or you can create a new instance with `new AwokenRef(customVersification)` - built via webpack/babel
- `dist/types` - Contains typescript declaration (.d.ts) files - package.json is setup such that these should be auto-loaded by typescript consumers of this library
