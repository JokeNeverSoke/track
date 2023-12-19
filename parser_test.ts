import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { assertSnapshot } from "https://deno.land/std@0.208.0/testing/snapshot.ts";
import { parse, tokenize } from "./parser.ts";

Deno.test("parser", async (t) => {
  const tokens = tokenize(`\
(define NAME "Joseph")
(define AGE 19)
(define (square x)
  (* x x))
(define (sum-of-squares x : Number & y : Number -> Number)
  (+ (square x) (square y)))
(define (func x)
  (if (> x 0) (sum-of-squares x (* x 2)) 0))
(define (func2 x)
  (local ((define (square x)
            (* x x)))
         (square x)))
    `);
  const ast = parse(tokens);
  await assertSnapshot(t, ast);
});
