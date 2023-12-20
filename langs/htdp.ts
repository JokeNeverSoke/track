import { type LanguageEnvironment } from "../types.ts";

// https://docs.racket-lang.org/htdp-langs/beginner.html
export const bsl: LanguageEnvironment = {
  empty: {
    type: "list",
    subtype: {
      type: "flexible",
    },
  },
  and: {
    type: "function",
    args: [
      {
        type: "boolean",
        expandable: true,
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  or: {
    type: "function",
    args: [
      {
        type: "boolean",
        expandable: true,
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "*": {
    type: "function",
    args: [
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "number",
    },
  },
  "+": {
    type: "function",
    args: [
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "number",
    },
  },
  "-": {
    type: "function",
    args: [
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "number",
    },
  },
  "/": {
    type: "function",
    args: [
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "number",
    },
  },
  "<": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "<=": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "=": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  ">": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  ">=": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  abs: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  acos: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  add1: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  angle: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  asin: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  atan: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  ceiling: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "complex?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  conjugate: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  cos: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  cosh: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "current-seconds": {
    type: "function",
    args: [],
    ret: {
      type: "number",
    },
  },
  denominator: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  e: {
    type: "number",
  },
  "even?": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "exact->inexact": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "exact?": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  exp: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  expt: {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  floor: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "gcd": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "number",
    },
  },
  "imag-part": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "inexact->exact": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "inexact?": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "integer->char": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "integer-sqrt": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "integer?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "lcm": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "number",
    },
  },
  log: {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "magnitude": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "make-polar": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "make-rectangular": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "max": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "number",
    },
  },
  "min": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
        expandable: true,
      },
    ],
    ret: {
      type: "number",
    },
  },
  "modulo": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "negative?": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "number->string": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "number->string-digits": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "number?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "numerator": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "odd?": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  pi: {
    type: "number",
  },
  "positive?": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "quotient": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  random: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "rational?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "real-part": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "real?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "remainder": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "round": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "sgn": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "sin": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "sinh": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "sqr": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "sqrt": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  sub1: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  tan: {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "zero?": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "boolean",
    },
  },

  // 1.7 Booleans
  "boolean->string": {
    type: "function",
    args: [
      {
        type: "boolean",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "boolean=?": {
    type: "function",
    args: [
      {
        type: "boolean",
      },
      {
        type: "boolean",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "boolean?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "not": {
    type: "function",
    args: [
      {
        type: "boolean",
      },
    ],
    ret: {
      type: "boolean",
    },
  },

  // 1.8 symbols
  "symbol->string": {
    type: "function",
    args: [
      {
        type: "symbol",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "symbol=?": {
    type: "function",
    args: [
      {
        type: "symbol",
      },
      {
        type: "symbol",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "symbol?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },

  // 1.9 Lists
  "append": {
    type: "function",
    args: [
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
      {
        type: "list",
        subtype: {
          type: "any",
        },
        expandable: true,
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },
  "cons": {
    type: "function",
    args: [
      {
        type: "any",
      },
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },
  "cons?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "empty?": {
    type: "function",
    args: [
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "first": {
    type: "function",
    args: [
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "any",
    },
  },
  "length": {
    type: "function",
    args: [
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "number",
    },
  },
  "list": {
    type: "function",
    args: [
      {
        type: "any",
        expandable: true,
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },
  "list*": {
    type: "function",
    args: [
      {
        type: "any",
        expandable: true,
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },
  "list-ref": {
    type: "function",
    args: [
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "any",
    },
  },
  "list?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "make-list": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "any",
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },
  "member": {
    type: "function",
    args: [
      {
        type: "any",
      },
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "member?": {
    type: "function",
    args: [
      {
        type: "any",
      },
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "boolean",
    },
  }, // these two are equal. why?
  null: {
    type: "list",
    subtype: {
      type: "any",
    },
  },
  "null?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  range: {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "number",
      },
    },
  },
  "remove": {
    type: "function",
    args: [
      {
        type: "any",
      },
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },
  "remove-all": {
    type: "function",
    args: [
      {
        type: "any",
      },
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },
  "rest": {
    type: "function",
    args: [
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },
  "reverse": {
    type: "function",
    args: [
      {
        type: "list",
        subtype: {
          type: "any",
        },
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "any",
      },
    },
  },

  // TODO: 1.10 posns

  // 1.12 strings
  "explode": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "list",
      subtype: {
        type: "string",
      },
    },
  },
  "implode": {
    type: "function",
    args: [
      {
        type: "list",
        subtype: {
          type: "string",
        },
      },
    ],
    ret: {
      type: "string",
    },
  },
  "int->string": {
    type: "function",
    args: [
      {
        type: "number",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "replicate": {
    type: "function",
    args: [
      {
        type: "number",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "string->int": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "string->number": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "string->symbol": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "symbol",
    },
  },
  "string-alphabetic?": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-append": {
    type: "function",
    args: [
      {
        type: "string",
        expandable: true,
      },
    ],
    ret: {
      type: "string",
    },
  },
  "string-ci<=?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-ci<?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-ci=?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-ci>=?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-ci>?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-contains-ci?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-contains?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-copy": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "string-downcase": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "string-ith": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "string-length": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "number",
    },
  },
  "string-lower-case?": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-numeric?": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-ref": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "string-upcase": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "string",
    },
  },
  "string-upper-case?": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string-whitespace?": {
    type: "function",
    args: [
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string<=?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string<?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string=?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string>=?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string>?": {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "string",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  "string?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
  substring: {
    type: "function",
    args: [
      {
        type: "string",
      },
      {
        type: "number",
      },
      {
        type: "number",
      },
    ],
    ret: {
      type: "string",
    },
  },

  // 1.14
  "struct?": {
    type: "function",
    args: [
      {
        type: "any",
      },
    ],
    ret: {
      type: "boolean",
    },
  },
};
