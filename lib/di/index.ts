/**
 * DI container exports
 * Importing this module ensures reflect-metadata and container setup are loaded.
 */
import "reflect-metadata";
import { container } from "tsyringe";

// Ensure setup runs when this module is first imported (e.g. by scripts)
import "./setup";

export { container };
export { setupContainer } from "./setup";
