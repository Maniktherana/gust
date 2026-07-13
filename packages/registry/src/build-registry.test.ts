import { describe, expect, test } from "bun:test";

import { cssToRegistryObject } from "./build-registry";

describe("registry CSS conversion", () => {
  test("preserves layers, selectors, and declarations", () => {
    expect(
      cssToRegistryObject(`
        @layer components {
          :where([data-slot="gust"]) {
            display: inline-grid;
            width: max-content;
          }
        }
      `),
    ).toEqual({
      "@layer components": {
        ':where([data-slot="gust"])': {
          display: "inline-grid",
          width: "max-content",
        },
      },
    });
  });
});
