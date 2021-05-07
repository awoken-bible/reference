/**
 * Main file representing the full API of the library
 *
 * This file is used by the esmodule build to include extra public typescript
 * type definitions. These are not used by browser, and hence are seperated
 * from the main "library" in ./lib
 */

/**
 * Export types which should be visible to users of the library
 */
export { BibleRef, BibleVerse, BibleRange }       from './BibleRef';
export { Versification   }                        from './Versification';
export { FormatOptions, FormatArg  }              from './printer';
export { ValidationError }                        from './validate';
export { RefsByBook, RefsByChapter, RefsByLevel } from './range-manip';

import AwokenRef from './lib';
export default AwokenRef;
export { AwokenRef };
