import { expect, it } from "vitest";
import { collectFullReferenceCandidates } from "@/transformer/utils/linkReference.js";

it("collectFullReferenceCandidates finds full reference links in span", () => {
  const candidates = collectFullReferenceCandidates("[text][ref]", (text) => [
    { type: "text", value: text },
  ]);

  expect(candidates).toHaveLength(1);
  expect(candidates[0]).toMatchObject({
    offset: 0,
    end: 11,
    refKey: "ref",
  });
});
