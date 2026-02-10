/* eslint-disable no-underscore-dangle */
/**
 * Sandbox workaround:
 * Node.js `fs.rename*` returns EXDEV here even for same-filesystem moves.
 * Next.js build uses rename for some artifacts, so we polyfill rename to:
 * - try rename
 * - if EXDEV, fall back to copy + unlink
 *
 * Keep this narrowly scoped to EXDEV to avoid masking real errors.
 */

const fs = require("node:fs");
const fsp = require("node:fs/promises");

async function copyThenUnlink(src, dest) {
  await fsp.mkdir(require("node:path").dirname(dest), { recursive: true });
  await fsp.copyFile(src, dest);
  await fsp.unlink(src);
}

const _rename = fs.rename.bind(fs);
fs.rename = (oldPath, newPath, cb) => {
  _rename(oldPath, newPath, async (err) => {
    if (!err) return cb(null);
    if (err && err.code === "EXDEV") {
      try {
        await copyThenUnlink(oldPath, newPath);
        return cb(null);
      } catch (e) {
        return cb(e);
      }
    }
    return cb(err);
  });
};

const _renameSync = fs.renameSync.bind(fs);
fs.renameSync = (oldPath, newPath) => {
  try {
    _renameSync(oldPath, newPath);
  } catch (err) {
    if (err && err.code === "EXDEV") {
      fs.mkdirSync(require("node:path").dirname(newPath), { recursive: true });
      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
      return;
    }
    throw err;
  }
};

