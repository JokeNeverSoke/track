import * as AST from "./main.ts";

type TypeError = {
  message: string;
  locations?: Array<{ index: number; line: number; column: number }>;
};
type CodeType = {
  type: "number" | "string" | "boolean" | "symbol";
} | {
  type: "list";
  subtype: CodeType;
} | {
  type: "function";
  args: CodeType[];
  ret: CodeType;
} | {
  type: "struct";
  fields: Map<string, CodeType>;
} | {
  // flexible does not raise errors, while any does
  type: "flexible" | "any" | "void";
} | {
  type: "union";
  types: CodeType[];
};

function collapse(t: CodeType): CodeType {
  if (t.type === "union") {
    const types = t.types.map(collapse);
    if (types.some((t) => t.type === "any")) {
      return { type: "any" };
    }
    // remove duplicates
    const seen = new Set();
    const filtered = types.filter((t) => {
      if (seen.has(t.type)) {
        return false;
      }
      seen.add(t.type);
      return true;
    });
    if (filtered.length === 1) {
      return filtered[0];
    }
    return { type: "union", types: filtered };
  }
  return t;
}
function toActualType(type: AST.TypeAnnotation): CodeType {
  if (type.type === "type-function") {
    switch (type.name) {
      case "List-of":
        return {
          type: "list",
          subtype: { type: "any" },
        };
      case "Any":
        return { type: "any" };
    }
  } else {
    switch (type.name.value) {
      case "Number":
        return { type: "number" };
      case "String":
        return { type: "string" };
      case "Boolean":
        return { type: "boolean" };
      case "Symbol":
        return { type: "symbol" };
      default:
        return { type: "any" };
    }
  }
}

class Env {
  space: Map<string, CodeType>;
  parent: Env | null;
  constructor(parent?: Env | null) {
    this.space = new Map();
    this.parent = parent ?? null;
  }
  subEnv(): Env {
    return new Env(this);
  }
  set(name: string, type: CodeType) {
    this.space.set(name, type);
  }
  get(name: string): CodeType | undefined {
    return this.space.get(name) ?? this.parent?.get(name);
  }
}

const BUILTINS: Record<string, CodeType> = {
  "+": {
    type: "function",
    args: [{ type: "number" }, { type: "number" }],
    ret: { type: "number" },
  },
  "string-append": {
    type: "function",
    args: [{ type: "string" }, { type: "string" }],
    ret: { type: "string" },
  },
  "string->number": {
    type: "function",
    args: [{ type: "string" }],
    ret: { type: "number" },
  },
};

function is<T extends string>(
  from: CodeType,
  to: T,
): from is Extract<CodeType, { type: T }> {
  return from.type === to;
}
function canBe<T extends CodeType>(from: CodeType, to: T): boolean {
  if (typeof to === "string") {
    return from.type === to;
  }
  if (to.type === "any" || from.type === "flexible") {
    return true;
  }
  if (to.type === "union") {
    return to.types.some((t) => canBe(from, t));
  } else if (from.type === "union") {
    return from.types.every((t) => canBe(t, to));
  } else {
    return from.type === to.type;
  }
}

export function typecheck(ast: AST.Program): TypeError[] {
  const errors: TypeError[] = [];
  const globalEnv = new Env();
  Object.entries(BUILTINS).forEach(([name, type]) => {
    globalEnv.set(name, type);
  });

  for (const expr of ast) {
    typecheckExpr(expr, globalEnv);
  }
  function typecheckExpr(expr: AST.Expr, env: Env): CodeType {
    switch (expr.type) {
      case "define-constant":
      case "define-struct":
      case "if-statement":
      case "cond-statement":
      case "lambda-statement":
      case "local-statement":
      case "let-statement":
      case "letrec-statement":
      case "letstar-statement":
      case "require-statement":
        return { type: "any" };
      case "define-function":
        return typecheckDefineFunction(expr, env);
      case "misc-function":
        return typecheckMiscFunction(expr, env);
      case "boolean-literal":
        return {
          type: "boolean",
        };
      case "symbol-value":
        return {
          type: "symbol",
        };
      case "identifier":
        return typecheckIdentifier(expr, env);
      case "string-literal":
        return {
          type: "string",
        };
      case "number-literal":
      case "number-exact":
      case "number-inexact":
        return {
          type: "number",
        };
    }
  }
  function typecheckDefineFunction(
    expr: AST.DefineFunction,
    env: Env,
  ): CodeType {
    const name = expr.name.value;
    const type = env.get(name);
    if (type !== undefined) {
      errors.push({
        message: `identifier ${name} already defined`,
      });
      // do not modify
      return {
        type: "flexible",
      };
    }
    if (expr.signature.type === "untyped-parameters") {
      globalEnv.set(name, {
        type: "function",
        args: [],
        ret: { type: "any" },
      });
    } else {
      const args = expr.signature.parameters;
      const argTypes: [string, CodeType][] = args.map(({ type }) => {
        return toActualType(type);
      }).map((t, i) => [args[i].name.value, t] as [string, CodeType]);

      const localEnv = env.subEnv();
      argTypes.forEach(([name, type]) => {
        localEnv.set(name, type);
      });
      const actualReturn = typecheckExpr(expr.body, localEnv);
      const ret = collapse(actualReturn);
      const expectedReturn = toActualType(expr.signature.returnType);
      if (!canBe(ret, expectedReturn)) {
        errors.push({
          message:
            `function ${name} expects return type ${expectedReturn.type}, but got ${ret.type} instead`,
        });
      }

      globalEnv.set(name, {
        type: "function",
        args: argTypes.map(([, t]) => t),
        ret: expectedReturn,
      });
    }
    return {
      type: "void",
    };
  }
  function typecheckIdentifier(expr: AST.Identifier, env: Env): CodeType {
    const identifier = expr.value;
    const type = env.get(identifier);
    if (type === undefined) {
      errors.push({
        message: `undefined identifier ${identifier}`,
      });
      return {
        type: "flexible",
      };
    }
    return type;
  }
  function typecheckMiscFunction(
    expr: AST.MiscFunction,
    env: Env,
  ): CodeType {
    const name = expr.name.value;
    const type = env.get(name);
    if (type === undefined) {
      errors.push({
        message: `undefined function identifier ${name}`,
      });
      return {
        type: "flexible",
      };
    } else if (!is(type, "function")) {
      errors.push({
        message: `${name} is not a function, it is a ${type.type}`,
      });
      return {
        type: "flexible",
      };
    } else if (is(type, "flexible")) {
      return {
        type: "flexible",
      };
    } else {
      const args = expr.arguments.map((arg) => typecheckExpr(arg, env));
      if (args.length !== type.args.length) {
        errors.push({
          message:
            `${name} expects ${type.args.length} arguments, but received ${args.length} instead`,
        });
        return {
          type: "flexible",
        };
      }
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const expected = type.args[i];
        if (!canBe(arg, expected)) {
          errors.push({
            message:
              `${name} argument ${i} expects ${expected.type}, but received ${arg.type} instead`,
          });
        }
      }
      return type.ret;
    }
  }
  return errors;
}