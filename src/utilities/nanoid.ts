import { customAlphabet } from "nanoid";
import { BaseModel } from "../models/BaseModel";

/**
 * Custom nanoid generator with only uppercase letters and numbers
 * Alphabet: ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 (36 characters)
 * Length: 8 characters
 */
const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

/**
 * Generate a unique ID using nanoid
 * @returns 8-character string with uppercase letters and numbers
 */
export function generateId(): string {
  return nanoid();
}

/**
 * Generate a unique ID for a specific model
 * Ensures the ID doesn't already exist in the database
 * @param model - The model instance to check for ID uniqueness
 * @returns Promise<string> - A unique 8-character ID
 */
export async function generateUniqueId(model: BaseModel): Promise<string> {
  let id: string;
  let exists: boolean;

  do {
    id = generateId();
    exists = await model.findById(id).then((result) => result !== null);
  } while (exists);

  return id;
}
