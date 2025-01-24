// Imports
import { envSchema } from '@shared-schemas/Enviroment';

// Functions
export default function loadAndParseEnvConfig() {
  //  Code
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return result.data;
  }
  throw new Error(result.error.message);
}
