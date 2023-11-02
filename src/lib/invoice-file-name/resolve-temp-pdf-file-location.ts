import { access, constants, mkdir } from "fs/promises";
import { join } from "path";
import invariant from "tiny-invariant";

/**
 * Path will be relative to built file, in dev its inside .next/server
 */
const DEFAULT_TEMP_FILES_LOCATION = join(__dirname, "_temp");

const getTempPdfStorageDir = () => {
  return process.env.TEMP_PDF_STORAGE_DIR ?? DEFAULT_TEMP_FILES_LOCATION;
};

export const resolveTempPdfFileLocation = async (fileName: string) => {
  invariant(fileName.includes(".pdf"), `fileName should include pdf extension`);

  const dirToWrite = getTempPdfStorageDir();

  await access(dirToWrite, constants.W_OK).catch(async () => {
    console.log("Can't access directory, will try to create it");

    try {
      return await mkdir(dirToWrite);
    } catch (e_1) {
      console.log(
        "Cant create a directory. Ensure its writable and check TEMP_PDF_STORAGE_DIR env"
      );
    }
  });

  return join(dirToWrite, encodeURIComponent(fileName));
};
