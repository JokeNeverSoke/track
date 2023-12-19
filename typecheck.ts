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
  args: Array<CodeType & { expandable?: boolean }>;
  ret: CodeType;
} | {
  type: "struct";
  name: string;
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
  getLocal(name: string): CodeType | undefined {
    return this.space.get(name);
  }
}

const BUILTINS: Record<string, CodeType> = {
  "+": {
    type: "function",
    args: [{ type: "number", expandable: true }],
    ret: { type: "number" },
  },
  "string-append": {
    type: "function",
    args: [{ type: "string", expandable: true }],
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
  let errors: TypeError[] = [];
  const globalEnv = new Env();
  Object.entries(BUILTINS).forEach(([name, type]) => {
    globalEnv.set(name, type);
  });
  const structEnv: Record<
    string,
    { fieldName: string; fieldType: CodeType }[]
  > = {};
  function withFreezeErrors<T>(fn: () => T): T {
    const oldErrors = errors;
    errors = [];
    const result = fn();
    errors = oldErrors;
    return result;
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
          if (structEnv[type.name.value] === undefined) {
            errors.push({
              message: `unknown type ${type.name.value}`,
            });
            return { type: "any" };
          } else {
            return {
              type: "struct",
              name: type.name.value,
            };
          }
      }
    }
  }

  for (const expr of ast) {
    registerTo(expr, globalEnv);
  }
  function registerTo(expr: AST.Expr, env: Env) {
    switch (expr.type) {
      case "define-function": {
        const name = expr.name.value;
        const type = env.getLocal(name);
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
          env.set(name, {
            type: "function",
            args: expr.signature.parameters.map(() => ({ type: "any" })),
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
          const expectedReturn = expr.signature.returnType
            ? toActualType(expr.signature.returnType)
            : { type: "any" } as CodeType;

          env.set(name, {
            type: "function",
            args: argTypes.map(([, t]) => t),
            ret: expectedReturn,
          });
        }
        break;
      }

      case "define-constant": {
        const name = expr.name.value;
        const type = env.getLocal(name);
        if (type !== undefined) {
          errors.push({
            message: `identifier ${name} already defined`,
          });
          // do not modify
          return {
            type: "flexible",
          };
        }

        // to prevent duplicate errors in constant definition
        const returnType = withFreezeErrors(() =>
          typecheckExpr(expr.value, env)
        );
        env.set(name, returnType);
        break;
      }
      case "define-struct": {
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
        const fields = expr.fields.type === "untyped-parameters"
          ? expr.fields.parameters.map((p) => ({
            fieldName: p.value,
            fieldType: { type: "any" } as CodeType,
          }))
          : expr.fields.parameters.map((p) => ({
            fieldName: p.name.value,
            fieldType: toActualType(p.type),
          }));
        structEnv[name] = fields;
        env.set(name, {
          type: "struct",
          name,
        });
        // struct methods
        // for a struct  (define-struct name [field1 : String]
        // we have
        // name? : Any -> Boolean
        // make-name : String -> name
        // name-field1 : name -> String

        env.set(`${name}?`, {
          type: "function",
          args: [{ type: "any" }],
          ret: { type: "boolean" },
        });
        env.set(`make-${name}`, {
          type: "function",
          args: fields.map(({ fieldType }) => fieldType),
          ret: { type: "struct", name },
        });
        fields.forEach(({ fieldName, fieldType }) => {
          env.set(`${name}-${fieldName}`, {
            type: "function",
            args: [{ type: "struct", name }],
            ret: fieldType,
          });
        });
        break;
      }
      default:
        return;
    }
  }

  for (const expr of ast) {
    typecheckExpr(expr, globalEnv);
  }
  function typecheckExpr(expr: AST.Expr, env: Env): CodeType {
    switch (expr.type) {
      case "define-struct": // already handled
      case "if-statement":
      case "cond-statement":
      case "lambda-statement":
      case "let-statement":
      case "require-statement":
      case "letstar-statement":
        return { type: "any" };
      case "letrec-statement":
        return typecheckLetRecStatement(expr, env);
      case "local-statement":
        return typecheckLocalStatement(expr, env);
      case "define-constant":
        return typecheckDefineConstant(expr, env);
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
  function typecheckLetRecStatement(
    expr: AST.LetRecStatement,
    env: Env,
  ): CodeType {
    const localEnv = env.subEnv();
    expr.definitions.forEach(({ name, value }) => {
      const type = localEnv.getLocal(name.value);
      if (type !== undefined) {
        errors.push({
          message: `identifier ${name.value} already defined locally`,
        });
        // do not modify
        return {
          type: "flexible",
        };
      }
      const returnType = typecheckExpr(value, localEnv);
      localEnv.set(name.value, returnType);
    });
    return typecheckExpr(expr.body, localEnv);
  }
  function typecheckLocalStatement(
    expr: AST.LocalStatement,
    env: Env,
  ): CodeType {
    const localEnv = env.subEnv();
    expr.definitions.forEach((def) => {
      registerTo(def, localEnv);
      typecheckExpr(def, localEnv);
    });
    return typecheckExpr(expr.body, localEnv);
  }
  function typecheckDefineConstant(
    expr: AST.DefineConstant,
    env: Env,
  ): CodeType {
    const returnType = typecheckExpr(expr.value, env);
    return returnType;
  }
  function typecheckDefineFunction(
    expr: AST.DefineFunction,
    env: Env,
  ): CodeType {
    if (expr.signature.type === "untyped-parameters") {
      errors.push({
        message: `function ${expr.name.value} is not type-checked`,
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
      if (expr.signature.returnType === null) {
        errors.push({
          message: `function ${expr.name.value} is not type-checked`,
        });
        return {
          type: "flexible",
        };
      }
      const expectedReturn = toActualType(expr.signature.returnType);
      if (!canBe(ret, expectedReturn)) {
        errors.push({
          message:
            `function ${expr.name.value} expects return type ${expectedReturn.type}, but got ${ret.type} instead`,
        });
      }
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
      const expandable = type.args.some((arg) => arg.expandable);
      const expandedArgs = [...type.args];
      if (expandable) {
        // repeat the expandable argument in type args if its length is less than the number of arguments provided
        const diff = args.length - expandedArgs.length;
        if (diff > 0) {
          const expandableArg = expandedArgs.find((arg) => arg.expandable)!;
          // find its index
          const expandableIndex = type.args.indexOf(expandableArg);
          for (let i = 0; i < diff; i++) {
            expandedArgs.splice(expandableIndex, 0, expandableArg);
          }
        }
      }
      if (args.length !== expandedArgs.length) {
        if (expandable) {
          errors.push({
            message:
              `${name} expects at least ${type.args.length} arguments, but received ${args.length} instead`,
          });
        } else {
          errors.push({
            message:
              `${name} expects ${type.args.length} arguments, but received ${args.length} instead`,
          });
        }
        return {
          type: "flexible",
        };
      }
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const expected = expandedArgs[i];
        if (!canBe(arg, expected)) {
          errors.push({
            message: `${name} argument ${
              i + 1
            } expects ${expected.type}, but received ${arg.type} instead`,
          });
        }
      }
      return type.ret;
    }
  }
  return errors;
}
