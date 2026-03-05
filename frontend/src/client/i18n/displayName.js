import { fishUk } from "./fishUk";

export function displayFishName(name, locale) {
  if (!name) return "";
  if (locale !== "uk") return name;
  return fishUk[name] || name;
}