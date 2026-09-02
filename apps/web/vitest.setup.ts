import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom keeps the document between tests in the same file; without this a query
// can match a node left over from the previous render.
afterEach(cleanup);
