/**
 * @file Helper for working with hashids
 * @see https://hashids.org/javascript/
 */

import Hashids from 'hashids/cjs';

const generic = new Hashids(process.env.API_GENERIC_ID_SECRET, 4);

export { generic };
