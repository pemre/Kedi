import { Filters } from "../types/filters";

// @ts-ignore
import filtersJson from "./filters.json?assert { type: 'json' }";

export const filters: Filters = filtersJson as Filters;
