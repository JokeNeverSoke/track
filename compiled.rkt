#lang htdp/isl+
;; k : Number Number -> Number
(define (k x y)
  "")
;; v : String -> Number
(define (v u)
  (string->number
    u
  ))
(+
  (k
    1
    2
  )
  (v
    ""
  )
)
(+
  (v
    1
  )
  (k
    2
  )
)
(k
  3
  ""
)