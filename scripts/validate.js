#!/usr/bin/env node

/**
 * FDL Blueprint Validator
 *
 * Validates blueprint YAML files against the FDL meta-schema.
 * Can validate a single file or all blueprints in the project.
 *
 * Usage:
 *   node scripts/validate.js                          # validate all
 *   node scripts/validate.js blueprints/auth/login.blueprint.yaml  # validate one
 */

import { readFileSync } from "fs";
import { resolve, relative } from "path";
import { glob } from "glob";
import YAML from "yaml";
import Ajv from "ajv";
import addFormats from "ajv-formats";

// ─── JSON Schema equivalent of our FDL meta-schema ────────
// This is the machine-readable validation layer

const blueprintJsonSchema = {
  type: "object",
  required: [
    "feature",
    "version",
    "description",
    "category",
    "rules",
    // fields is optional for system-driven features (webhooks, scheduled jobs)
    // flows and outcomes are conditionally required — checked in validateFile()
  ],
  properties: {
    feature: {
      type: "string",
      pattern: "^[a-z][a-z0-9-]*$",
      description: "Unique kebab-case identifier",
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
      description: "Semantic version",
    },
    description: {
      type: "string",
      maxLength: 200,
    },
    category: {
      type: "string",
      enum: [
        "auth",
        "data",
        "access",
        "ui",
        "integration",
        "notification",
        "payment",
        "workflow",
      ],
    },
    tags: {
      type: "array",
      items: { type: "string" },
    },
    fields: {
      type: "array",
      minItems: 1,
      items: { $ref: "#/$defs/field" },
    },
    rules: {
      type: "object",
      minProperties: 1,
    },
    flows: {
      type: "object",
      minProperties: 1,
    },
    outcomes: {
      type: "object",
      minProperties: 1,
    },
    related: {
      type: "array",
      items: { $ref: "#/$defs/relationship" },
    },
    events: {
      type: "array",
      items: { $ref: "#/$defs/event" },
    },
    errors: {
      type: "array",
      items: { $ref: "#/$defs/error" },
    },
    actors: {
      type: "array",
      items: { $ref: "#/$defs/actor" },
    },
    states: { type: "object" },
    sla: { type: "object" },
    ui_hints: { type: "object" },
    extensions: { type: "object" },
  },
  additionalProperties: false,
  $defs: {
    actor: {
      type: "object",
      required: ["id", "name", "type"],
      properties: {
        id: {
          type: "string",
          pattern: "^[a-z][a-z0-9_]*$",
        },
        name: { type: "string" },
        type: {
          type: "string",
          enum: ["human", "system", "external"],
        },
        description: { type: "string" },
        role: { type: "string" },
      },
      additionalProperties: false,
    },
    field: {
      type: "object",
      required: ["name", "type", "required"],
      properties: {
        name: {
          type: "string",
          pattern: "^[a-z][a-z0-9_]*$",
        },
        type: {
          type: "string",
          enum: [
            "text",
            "email",
            "password",
            "number",
            "boolean",
            "date",
            "datetime",
            "phone",
            "url",
            "file",
            "select",
            "multiselect",
            "hidden",
            "token",
            "rich_text",
            "json",
          ],
        },
        required: { type: "boolean" },
        label: { type: "string" },
        placeholder: { type: "string" },
        default: {},
        sensitive: { type: "boolean" },
        immutable: { type: "boolean" },
        form: { type: "string" },
        options: {
          type: "array",
          items: {
            type: "object",
            properties: {
              value: { type: "string" },
              label: { type: "string" },
            },
          },
        },
        validation: {
          type: "array",
          items: { $ref: "#/$defs/validationRule" },
        },
      },
      additionalProperties: false,
    },
    validationRule: {
      type: "object",
      required: ["type", "message"],
      properties: {
        type: {
          type: "string",
          enum: [
            "required",
            "minLength",
            "maxLength",
            "min",
            "max",
            "pattern",
            "email",
            "phone",
            "url",
            "oneOf",
            "unique",
            "match",
            "custom",
          ],
        },
        message: { type: "string" },
        value: {},
        field: { type: "string" },
      },
      additionalProperties: false,
    },
    relationship: {
      type: "object",
      required: ["feature", "type"],
      properties: {
        feature: { type: "string" },
        type: {
          type: "string",
          enum: ["required", "recommended", "optional", "extends"],
        },
        reason: { type: "string" },
        ui_link: { type: "string" },
        ui_link_position: { type: "string" },
        insert_after: { type: "string" },
      },
      additionalProperties: false,
    },
    event: {
      type: "object",
      required: ["name", "payload"],
      properties: {
        name: {
          type: "string",
          pattern: "^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$",
        },
        description: { type: "string" },
        payload: {
          type: "array",
          items: { type: "string" },
        },
      },
      additionalProperties: false,
    },
    error: {
      type: "object",
      required: ["code", "status", "message"],
      properties: {
        code: {
          type: "string",
          pattern: "^[A-Z][A-Z0-9_]*$",
        },
        status: {
          type: "integer",
          enum: [400, 401, 403, 404, 409, 422, 423, 429, 500],
        },
        message: { type: "string" },
        retry: { type: "boolean" },
        redirect: { type: "string" },
      },
      additionalProperties: false,
    },
  },
};

// ─── Validator ────────────────────────────────────────────

const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);
const validate = ajv.compile(blueprintJsonSchema);

function validateFile(filePath) {
  const absPath = resolve(filePath);
  const relPath = relative(process.cwd(), absPath);

  let content;
  try {
    content = readFileSync(absPath, "utf-8");
  } catch (err) {
    return { file: relPath, valid: false, errors: [`File not found: ${absPath}`] };
  }

  let data;
  try {
    data = YAML.parse(content);
  } catch (err) {
    return { file: relPath, valid: false, errors: [`YAML parse error: ${err.message}`] };
  }

  const valid = validate(data);

  if (!valid) {
    const errors = validate.errors.map((err) => {
      const path = err.instancePath || "(root)";
      return `  ${path}: ${err.message}${err.params ? ` (${JSON.stringify(err.params)})` : ""}`;
    });
    return { file: relPath, valid: false, errors };
  }

  // ─── Custom validation checks ───────────────────────────

  const customErrors = [];
  const customWarnings = [];

  // Check: must have at least one of flows or outcomes
  const hasFlows = data.flows && Object.keys(data.flows).length > 0;
  const hasOutcomes = data.outcomes && Object.keys(data.outcomes).length > 0;
  if (!hasFlows && !hasOutcomes) {
    customErrors.push('  (root): must have at least one of "flows" or "outcomes"');
  }

  // Check: fields is optional but warn if missing (system-driven features may skip it)
  if (!data.fields || data.fields.length === 0) {
    customWarnings.push(
      `${data.feature} has no fields — this is OK for system-driven features but unusual otherwise`
    );
  }

  // Check: outcome structure — each outcome should have given, then, or result
  const validOperators = new Set([
    "eq", "neq", "gt", "gte", "lt", "lte",
    "in", "not_in", "matches", "exists", "not_exists",
  ]);

  if (data.outcomes) {
    const validOutcomeKeys = new Set(["given", "then", "result"]);
    for (const [name, outcome] of Object.entries(data.outcomes)) {
      if (typeof outcome !== "object" || outcome === null) {
        customErrors.push(`  outcomes.${name}: must be an object with given/then/result keys`);
        continue;
      }
      const outcomeKeys = Object.keys(outcome);
      const hasValidKey = outcomeKeys.some((k) => validOutcomeKeys.has(k));
      if (!hasValidKey) {
        customErrors.push(
          `  outcomes.${name}: must have at least one of "given", "then", or "result"`
        );
      }

      // Validate structured conditions in given[]
      if (Array.isArray(outcome.given)) {
        for (let i = 0; i < outcome.given.length; i++) {
          const condition = outcome.given[i];
          // Strings are plain-text conditions — always valid
          if (typeof condition === "string") continue;
          // Objects are structured conditions — validate operator
          if (typeof condition === "object" && condition !== null) {
            if (!condition.field) {
              customErrors.push(
                `  outcomes.${name}.given[${i}]: structured condition must have a "field" property`
              );
            }
            if (!condition.operator) {
              customErrors.push(
                `  outcomes.${name}.given[${i}]: structured condition must have an "operator" property`
              );
            } else if (!validOperators.has(condition.operator)) {
              customErrors.push(
                `  outcomes.${name}.given[${i}]: unknown operator "${condition.operator}" — valid: ${[...validOperators].join(", ")}`
              );
            }
          }
        }
      }
    }
  }

  if (customErrors.length > 0) {
    return { file: relPath, valid: false, errors: customErrors };
  }

  return {
    file: relPath,
    valid: true,
    feature: data.feature,
    version: data.version,
    warnings: customWarnings,
  };
}

// ─── Cross-blueprint relationship validation ──────────────

function validateRelationships(results) {
  const features = new Set(results.filter((r) => r.valid).map((r) => r.feature));
  const warnings = [];

  for (const result of results) {
    if (!result.valid) continue;

    const absPath = resolve(result.file);
    const content = readFileSync(absPath, "utf-8");
    const data = YAML.parse(content);

    if (data.related) {
      for (const rel of data.related) {
        if (rel.type === "required" && !features.has(rel.feature)) {
          warnings.push(
            `${result.feature} requires "${rel.feature}" but no blueprint found for it`
          );
        }
      }
    }
  }

  return warnings;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let files;

  if (args.length > 0) {
    files = args;
  } else {
    files = await glob("blueprints/**/*.blueprint.yaml");
  }

  if (files.length === 0) {
    console.log("No blueprint files found.");
    process.exit(0);
  }

  console.log(`\nFDL Blueprint Validator v0.1.0`);
  console.log(`${"=".repeat(50)}\n`);

  const results = files.map(validateFile);
  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.valid) {
      console.log(`  PASS  ${result.file} (${result.feature} v${result.version})`);
      passed++;
    } else {
      console.log(`  FAIL  ${result.file}`);
      for (const err of result.errors) {
        console.log(`        ${err}`);
      }
      failed++;
    }
  }

  // Collect all warnings: per-file custom warnings + cross-reference warnings
  const allWarnings = [];

  for (const result of results) {
    if (result.valid && result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  allWarnings.push(...validateRelationships(results));

  if (allWarnings.length > 0) {
    console.log(`\n  WARNINGS:`);
    for (const w of allWarnings) {
      console.log(`    WARN  ${w}`);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`  ${passed} passed, ${failed} failed, ${allWarnings.length} warnings`);
  console.log(`${"=".repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

main();
