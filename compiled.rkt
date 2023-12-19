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