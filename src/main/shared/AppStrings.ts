// Imports
import { appStrSchema } from "@shared-schemas/Strings";
import { env } from "@shared/Setup";

//  Functions
export default function loadAppStrings() {
  const file = require(`@lang/${env.APP_LANG}.json`)
  const res = appStrSchema.safeParse(file);
  if (res.success) 
    return (res.data);
  throw new Error(`Invalid language file: ${res.error.message}`);
}