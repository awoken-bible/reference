 # Awoken Bible Reference [![Build Status](https://travis-ci.org/jnterry/awoken-bible-reference.svg?branch=master)](https://travis-ci.org/jnterry/awoken-bible-reference) [![Coverage Status](https://coveralls.io/repos/github/jnterry/awoken-bible-reference/badge.svg?branch=master)](https://coveralls.io/github/jnterry/awoken-bible-reference?branch=master)

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
- Sorting a list of references
- Counting the number of verses in a set of ranges
- Truncating a list of ranges to a new list of ranges containing the first N verses (useful for pagination, or short previews of a longer text)

