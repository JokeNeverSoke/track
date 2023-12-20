# TRack

T(yped)Rack(et) is an experimental in-progress type-checker/compiler/language for the Racket language. Help is appreciated in _any_ of the following domains:

- [ ] Compiler formatting
- [ ] _Any_ enhancement to the codebase
- [ ] Environment definitions (e.g. language packs & imported libraries)
- [ ] Test suites

## Installation

First make sure you have deno installed. You can get deno [here](https://docs.deno.com/runtime/manual/getting_started/installation).

```bash
$ deno install --allow-read --allow-write https://raw.githubusercontent.com/JokeNeverSoke/track/master/trc.ts
```

This downloads the latest unstable code from GitHub. Versioned code will be added in the future.

## Usage

```
T(yped)Rack(et) v0.0.1
Makes Racket slightly better. Only slightly.

USAGE:
  $ trc [options] <file>

ARGUMENTS:
  <file>        The file to compile

OPTIONS:
  --out=<file>  The output file (default: out.rkt)
  --no-emit     Do not emit the compiled code (only typecheck)
  --no-check    Skips typechecking (may fail to compile)

EXAMPLE:
  $ trc --out=main.rkt main.trkt

REPOSITORY:
  <https://github.com/jokeneversoke/track>

AUTHOR:
  Joseph Zeng   <jokeneversoke@gmail.com>

LICENSE:
  GPLv3, see <https://github.com/JokeNeverSoke/track/blob/master/LICENSE>
  for details. No warranties provided.
```

```
  error: function expects return type String, but got Number instead
   2 | 
   3 | 
   4 | (define g (lambda (x : Number & y : Number -> String) (+ x y)))
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
   5 | 
   6 | (define (f x : Number -> String)

  error: number->string argument 1 expects number, but received String instead
   5 | 
   6 | (define (f x : Number -> String)
   7 |     (string-append (number->string (g x 10)) " is a number"))
                                          ^^^^^^^^
   8 | 
   9 | (let ([x 10]

  error: identifier x already defined locally
   9 | (let ([x 10]
  10 |       [y 20]
  11 |       [x 30])
              ^
  12 |     (g x y))
  13 | 

  error: function u is not type-checked
  13 | 
  14 > (define (u x)
  15 > (+ x 5)
  16 > )
  17 | 

Found 4 errors, skipping emit. (--no-check to override)
```

## Examples

Track compiles this

```racket
(define (f x : String & y : Number -> Number)
  (local ([define (g z : Number -> Number) (+ y z)])
    (+ (string->number x) (g y) 5)))
```

into this

```racket
#lang htdp/isl+
;; f : String Number -> Number
(define (f x y)
  (local (
    ;; g : Number -> Number
    (define (g z)
      (+
        y
        z
      )))
    (+
      (string->number
        x
      )
      (g
        y
      )
      5
    )))
```

> _yes, i know its ugly. i'm trying to improve the compiler output. or you can
> just run the output over `raco fmt` again._

## Related

- [Racket-huh](https://github.com/jokeneversoke/racket-huh) - Executes Racket
  code **in browser** within embeds.
