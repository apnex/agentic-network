/**
 * GCS document access for MCP tools (read_document, list_documents).
 *
 * Reads and lists files from the state bucket.
 * Validates paths to prevent traversal attacks.
 */

import { Storage } from "@google-cloud/storage";

const storage = new Storage();

export interface DocumentInfo {
  path: string;
  size: number;
  contentType: string;
  created: string;
  updated: string;
}

/**
 * List documents in a GCS directory prefix.
 * Returns file metadata (path, size, content type, timestamps).
 */
export async function listDocuments(
  bucket: string,
  prefix: string
): Promise<DocumentInfo[]> {
  // Validate prefix
  if (prefix.includes("..") || prefix.startsWith("/")) {
    throw new Error(`Invalid prefix: ${prefix}`);
  }

  // Ensure prefix ends with /
  const normalizedPrefix = prefix.endsWith("/") ? prefix : prefix + "/";

  const [files] = await storage.bucket(bucket).getFiles({ prefix: normalizedPrefix });
  const results: DocumentInfo[] = [];

  for (const file of files) {
    const [metadata] = await file.getMetadata();
    results.push({
      path: file.name,
      size: parseInt(metadata.size as string, 10) || 0,
      contentType: (metadata.contentType as string) || "unknown",
      created: (metadata.timeCreated as string) || "",
      updated: (metadata.updated as string) || "",
    });
  }

  return results;
}

/**
 * Write a document to the GCS state bucket.
 * Overwrites if the file already exists (blind overwrite for V1).
 */
export async function writeDocument(
  bucket: string,
  path: string,
  content: string,
  contentType: string = "text/markdown"
): Promise<{ path: string; size: number }> {
  // Validate path — no traversal, no absolute paths
  if (path.includes("..") || path.startsWith("/")) {
    throw new Error(`Invalid path: ${path}`);
  }

  const file = storage.bucket(bucket).file(path);
  await file.save(content, {
    contentType,
    metadata: { contentType },
  });

  return { path, size: Buffer.byteLength(content, "utf-8") };
}

/**
 * Read a document from the GCS state bucket.
 * Returns the file contents as a string, or null if not found.
 */
export async function readDocument(
  bucket: string,
  path: string
): Promise<{ content: string; contentType: string } | null> {
  // Validate path — no traversal, no absolute paths
  if (path.includes("..") || path.startsWith("/")) {
    throw new Error(`Invalid path: ${path}`);
  }

  try {
    const file = storage.bucket(bucket).file(path);
    const [metadata] = await file.getMetadata();
    const [content] = await file.download();
    return {
      content: content.toString("utf-8"),
      contentType: (metadata.contentType as string) || "text/plain",
    };
  } catch (error: any) {
    if (error.code === 404) return null;
    throw error;
  }
}
