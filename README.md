# TRack

T(yped)Rack(et) is an experimental in-progress type-checker/compiler I'm writing
for the racket language. Help is appreciated in _any_ of the following domains:

- [ ] Compiler formatting
- [ ] _Any_ enhancement to the codebase
- [ ] Environment definitions (e.g. language packs & imported libraries)
- [ ] Test suites

## Usage

_unusable right now_

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
