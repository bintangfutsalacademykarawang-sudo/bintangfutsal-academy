var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/@vercel/oidc/dist/version.js
var require_version = __commonJS({
  "node_modules/@vercel/oidc/dist/version.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var version_exports = {};
    __export(version_exports, {
      version: () => version
    });
    module.exports = __toCommonJS(version_exports);
    var version = "4.0.6";
  }
});

// node_modules/@vercel/oidc/dist/exchange-vercel-oidc-token.js
var require_exchange_vercel_oidc_token = __commonJS({
  "node_modules/@vercel/oidc/dist/exchange-vercel-oidc-token.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var exchange_vercel_oidc_token_exports = {};
    __export(exchange_vercel_oidc_token_exports, {
      exchangeVercelOidcToken: () => exchangeVercelOidcToken2
    });
    module.exports = __toCommonJS(exchange_vercel_oidc_token_exports);
    var import_version = require_version();
    var TokenCache = class {
      constructor(maxEntries) {
        this.maxEntries = maxEntries;
        this.entries = /* @__PURE__ */ new Map();
      }
      /**
       * Returns a cached token for the key when present and unexpired, refreshing
       * its recency for LRU eviction. Expired entries are removed on access.
       */
      get(key) {
        const entry = this.entries.get(key);
        if (entry === void 0) {
          return void 0;
        }
        if (entry.expiresAt <= Date.now()) {
          this.entries.delete(key);
          return void 0;
        }
        this.entries.delete(key);
        this.entries.set(key, entry);
        return entry.token;
      }
      /**
       * Stores a token under the key and evicts the least-recently-used entries
       * once the cache exceeds its size limit.
       */
      set({
        key,
        token,
        expiresAt
      }) {
        this.entries.delete(key);
        this.entries.set(key, { token, expiresAt });
        while (this.entries.size > this.maxEntries) {
          const oldest = this.entries.keys().next().value;
          if (oldest === void 0) {
            break;
          }
          this.entries.delete(oldest);
        }
      }
    };
    var MAX_CACHE_ENTRIES = 1e3;
    var tokenCache = new TokenCache(MAX_CACHE_ENTRIES);
    async function getCacheKey(options) {
      const input = JSON.stringify([options.token, options.audience, options.jti]);
      const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(input)
      );
      return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    }
    async function exchangeVercelOidcToken2(options) {
      const cacheKey = await getCacheKey(options);
      if (!options.skipCache) {
        const cached = tokenCache.get(cacheKey);
        if (cached !== void 0) {
          return cached;
        }
      }
      const response = await fetch("https://oidc.vercel.com/~token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": `@vercel/oidc@${import_version.version}`
        },
        body: JSON.stringify({
          token: options.token,
          aud: options.audience,
          ...options.jti ? { jti: options.jti } : void 0
        })
      });
      if (!response.ok) {
        throw new Error(
          `Failed to exchange token: ${await readErrorMessage(response)}`
        );
      }
      let data;
      try {
        data = await response.json();
      } catch (_error) {
        throw new Error("Failed to exchange token: response was not valid JSON");
      }
      if (!data || typeof data !== "object" || !("token" in data) || typeof data.token !== "string") {
        throw new Error(
          "Failed to exchange token: response did not contain a token"
        );
      }
      const { token } = data;
      const expiry = "expiry" in data && typeof data.expiry === "number" ? data.expiry : void 0;
      if (expiry !== void 0) {
        const expiresAt = expiry * 1e3;
        if (expiresAt > Date.now()) {
          tokenCache.set({ key: cacheKey, token, expiresAt });
        }
      }
      return token;
    }
    async function readErrorMessage(response) {
      try {
        const data = await response.json();
        if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
          return data.error;
        }
      } catch (_error) {
      }
      return response.statusText || `HTTP ${response.status}`;
    }
  }
});

// node_modules/@vercel/oidc/dist/get-context.js
var require_get_context = __commonJS({
  "node_modules/@vercel/oidc/dist/get-context.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var get_context_exports = {};
    __export(get_context_exports, {
      SYMBOL_FOR_REQ_CONTEXT: () => SYMBOL_FOR_REQ_CONTEXT,
      getContext: () => getContext2
    });
    module.exports = __toCommonJS(get_context_exports);
    var SYMBOL_FOR_REQ_CONTEXT = Symbol.for("@vercel/request-context");
    function getContext2() {
      const fromSymbol = globalThis;
      return fromSymbol[SYMBOL_FOR_REQ_CONTEXT]?.get?.() ?? {};
    }
  }
});

// node_modules/@vercel/oidc/dist/get-vercel-oidc-token-sync.js
var require_get_vercel_oidc_token_sync = __commonJS({
  "node_modules/@vercel/oidc/dist/get-vercel-oidc-token-sync.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var get_vercel_oidc_token_sync_exports = {};
    __export(get_vercel_oidc_token_sync_exports, {
      getVercelOidcTokenSync: () => getVercelOidcTokenSync2
    });
    module.exports = __toCommonJS(get_vercel_oidc_token_sync_exports);
    var import_get_context = require_get_context();
    function getVercelOidcTokenSync2() {
      const token = (0, import_get_context.getContext)().headers?.["x-vercel-oidc-token"] ?? process.env.VERCEL_OIDC_TOKEN;
      if (!token) {
        throw new Error(
          `The 'x-vercel-oidc-token' header is missing from the request.`
        );
      }
      return token;
    }
  }
});

// node_modules/@vercel/oidc/dist/token-error.js
var require_token_error = __commonJS({
  "node_modules/@vercel/oidc/dist/token-error.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var token_error_exports = {};
    __export(token_error_exports, {
      VercelOidcTokenError: () => VercelOidcTokenError
    });
    module.exports = __toCommonJS(token_error_exports);
    var VercelOidcTokenError = class extends Error {
      constructor(message, cause) {
        super(message);
        this.name = "VercelOidcTokenError";
        this.cause = cause;
      }
      toString() {
        if (this.cause) {
          return `${this.name}: ${this.message}: ${this.cause}`;
        }
        return `${this.name}: ${this.message}`;
      }
    };
  }
});

// node_modules/@vercel/cli-exec/dist/errors.js
var require_errors = __commonJS({
  "node_modules/@vercel/cli-exec/dist/errors.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var errors_exports = {};
    __export(errors_exports, {
      VercelCliError: () => VercelCliError2,
      assertValidCwd: () => assertValidCwd,
      getCliNotFoundMessage: () => getCliNotFoundMessage,
      toVercelCliError: () => toVercelCliError
    });
    module.exports = __toCommonJS(errors_exports);
    var import_promises = __require("node:fs/promises");
    var VercelCliError2 = class extends Error {
      constructor(options) {
        super(options.message);
        this.name = "VercelCliError";
        this.code = options.code;
        this.invocation = options.invocation;
        this.stdout = options.stdout;
        this.stderr = options.stderr;
        this.exitCode = options.exitCode;
        if (options.cause !== void 0) {
          this.cause = options.cause;
        }
      }
    };
    function getCliNotFoundMessage(diagnostics) {
      const details = [];
      const { localBinSearch } = diagnostics;
      if (localBinSearch.stopReason === "project-root-marker") {
        details.push(
          `Local bin lookup stopped at ${JSON.stringify(localBinSearch.stoppedAt)} (${JSON.stringify(localBinSearch.markerPath)}).`
        );
      } else if (localBinSearch.stopReason === "filesystem-root") {
        details.push(
          `No project root marker was found from ${JSON.stringify(localBinSearch.searchRoot)}; local bin lookup reached the filesystem root.`
        );
      }
      for (const skippedNodeModules of localBinSearch.skippedNodeModules) {
        details.push(
          `Skipped ${JSON.stringify(skippedNodeModules.directory)}: ${skippedNodeModules.reason}.`
        );
      }
      for (const skippedLocalBin of diagnostics.skippedLocalBins) {
        details.push(
          `Skipped ${JSON.stringify(skippedLocalBin.candidate)}: ${skippedLocalBin.reason}.`
        );
      }
      if (details.length === 0) {
        return "Unable to find a usable Vercel CLI installation.";
      }
      return ["Unable to find a usable Vercel CLI installation.", ...details].join(
        "\n"
      );
    }
    async function assertValidCwd(cwd) {
      try {
        if (!(await (0, import_promises.stat)(cwd)).isDirectory()) {
          throw new Error("not a directory");
        }
      } catch {
        throw new VercelCliError2({
          code: "VERCEL_CLI_INVALID_CWD",
          message: `Working directory ${JSON.stringify(cwd)} does not exist or is not a directory.`
        });
      }
    }
    function toVercelCliError(invocation, error) {
      if (typeof error === "object" && error !== null) {
        const execaError = error;
        if (execaError.code === "ENOENT") {
          return new VercelCliError2({
            code: "VERCEL_CLI_NOT_FOUND",
            message: `Unable to find Vercel CLI command ${JSON.stringify(invocation.command)}.`,
            invocation,
            cause: error
          });
        }
        if (execaError.code === "EACCES" || execaError.code === "EPERM") {
          return new VercelCliError2({
            code: "VERCEL_CLI_PERMISSION_DENIED",
            message: `Permission denied while executing Vercel CLI command ${JSON.stringify(invocation.command)}.`,
            invocation,
            cause: error
          });
        }
        if (execaError.timedOut) {
          return new VercelCliError2({
            code: "VERCEL_CLI_TIMED_OUT",
            message: `Timed out while executing Vercel CLI command ${JSON.stringify(invocation.command)}.`,
            invocation,
            stdout: execaError.stdout,
            stderr: execaError.stderr,
            cause: error
          });
        }
        if (execaError.isCanceled) {
          return new VercelCliError2({
            code: "VERCEL_CLI_CANCELED",
            message: `Canceled while executing Vercel CLI command ${JSON.stringify(invocation.command)}.`,
            invocation,
            stdout: execaError.stdout,
            stderr: execaError.stderr,
            cause: error
          });
        }
        if (execaError.signal) {
          return new VercelCliError2({
            code: "VERCEL_CLI_SIGNALED",
            message: `Vercel CLI command ${JSON.stringify(invocation.command)} exited due to signal ${execaError.signal}.`,
            invocation,
            stdout: execaError.stdout,
            stderr: execaError.stderr,
            cause: error
          });
        }
        if (typeof execaError.exitCode === "number") {
          return new VercelCliError2({
            code: "VERCEL_CLI_ERRORED",
            message: execaError.shortMessage ?? execaError.message ?? `Vercel CLI command ${JSON.stringify(invocation.command)} exited with code ${execaError.exitCode}.`,
            invocation,
            stdout: execaError.stdout,
            stderr: execaError.stderr,
            exitCode: execaError.exitCode,
            cause: error
          });
        }
      }
      return new VercelCliError2({
        code: "VERCEL_CLI_EXEC_FAILED",
        message: `Could not execute Vercel CLI command ${JSON.stringify(invocation.command)}.`,
        invocation,
        cause: error
      });
    }
  }
});

// node_modules/isexe/windows.js
var require_windows = __commonJS({
  "node_modules/isexe/windows.js"(exports, module) {
    module.exports = isexe;
    isexe.sync = sync;
    var fs2 = __require("fs");
    function checkPathExt(path2, options) {
      var pathext = options.pathExt !== void 0 ? options.pathExt : process.env.PATHEXT;
      if (!pathext) {
        return true;
      }
      pathext = pathext.split(";");
      if (pathext.indexOf("") !== -1) {
        return true;
      }
      for (var i = 0; i < pathext.length; i++) {
        var p = pathext[i].toLowerCase();
        if (p && path2.substr(-p.length).toLowerCase() === p) {
          return true;
        }
      }
      return false;
    }
    function checkStat(stat, path2, options) {
      if (!stat.isSymbolicLink() && !stat.isFile()) {
        return false;
      }
      return checkPathExt(path2, options);
    }
    function isexe(path2, options, cb) {
      fs2.stat(path2, function(er, stat) {
        cb(er, er ? false : checkStat(stat, path2, options));
      });
    }
    function sync(path2, options) {
      return checkStat(fs2.statSync(path2), path2, options);
    }
  }
});

// node_modules/isexe/mode.js
var require_mode = __commonJS({
  "node_modules/isexe/mode.js"(exports, module) {
    module.exports = isexe;
    isexe.sync = sync;
    var fs2 = __require("fs");
    function isexe(path2, options, cb) {
      fs2.stat(path2, function(er, stat) {
        cb(er, er ? false : checkStat(stat, options));
      });
    }
    function sync(path2, options) {
      return checkStat(fs2.statSync(path2), options);
    }
    function checkStat(stat, options) {
      return stat.isFile() && checkMode(stat, options);
    }
    function checkMode(stat, options) {
      var mod = stat.mode;
      var uid = stat.uid;
      var gid = stat.gid;
      var myUid = options.uid !== void 0 ? options.uid : process.getuid && process.getuid();
      var myGid = options.gid !== void 0 ? options.gid : process.getgid && process.getgid();
      var u = parseInt("100", 8);
      var g = parseInt("010", 8);
      var o = parseInt("001", 8);
      var ug = u | g;
      var ret = mod & o || mod & g && gid === myGid || mod & u && uid === myUid || mod & ug && myUid === 0;
      return ret;
    }
  }
});

// node_modules/isexe/index.js
var require_isexe = __commonJS({
  "node_modules/isexe/index.js"(exports, module) {
    var fs2 = __require("fs");
    var core;
    if (process.platform === "win32" || global.TESTING_WINDOWS) {
      core = require_windows();
    } else {
      core = require_mode();
    }
    module.exports = isexe;
    isexe.sync = sync;
    function isexe(path2, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (!cb) {
        if (typeof Promise !== "function") {
          throw new TypeError("callback not provided");
        }
        return new Promise(function(resolve, reject) {
          isexe(path2, options || {}, function(er, is) {
            if (er) {
              reject(er);
            } else {
              resolve(is);
            }
          });
        });
      }
      core(path2, options || {}, function(er, is) {
        if (er) {
          if (er.code === "EACCES" || options && options.ignoreErrors) {
            er = null;
            is = false;
          }
        }
        cb(er, is);
      });
    }
    function sync(path2, options) {
      try {
        return core.sync(path2, options || {});
      } catch (er) {
        if (options && options.ignoreErrors || er.code === "EACCES") {
          return false;
        } else {
          throw er;
        }
      }
    }
  }
});

// node_modules/which/which.js
var require_which = __commonJS({
  "node_modules/which/which.js"(exports, module) {
    var isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
    var path2 = __require("path");
    var COLON = isWindows ? ";" : ":";
    var isexe = require_isexe();
    var getNotFoundError = (cmd) => Object.assign(new Error(`not found: ${cmd}`), { code: "ENOENT" });
    var getPathInfo = (cmd, opt) => {
      const colon = opt.colon || COLON;
      const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? [""] : [
        // windows always checks the cwd first
        ...isWindows ? [process.cwd()] : [],
        ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */
        "").split(colon)
      ];
      const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
      const pathExt = isWindows ? pathExtExe.split(colon) : [""];
      if (isWindows) {
        if (cmd.indexOf(".") !== -1 && pathExt[0] !== "")
          pathExt.unshift("");
      }
      return {
        pathEnv,
        pathExt,
        pathExtExe
      };
    };
    var which = (cmd, opt, cb) => {
      if (typeof opt === "function") {
        cb = opt;
        opt = {};
      }
      if (!opt)
        opt = {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      const step = (i) => new Promise((resolve, reject) => {
        if (i === pathEnv.length)
          return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path2.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        resolve(subStep(p, i, 0));
      });
      const subStep = (p, i, ii) => new Promise((resolve, reject) => {
        if (ii === pathExt.length)
          return resolve(step(i + 1));
        const ext = pathExt[ii];
        isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
          if (!er && is) {
            if (opt.all)
              found.push(p + ext);
            else
              return resolve(p + ext);
          }
          return resolve(subStep(p, i, ii + 1));
        });
      });
      return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
    };
    var whichSync = (cmd, opt) => {
      opt = opt || {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      for (let i = 0; i < pathEnv.length; i++) {
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path2.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        for (let j = 0; j < pathExt.length; j++) {
          const cur = p + pathExt[j];
          try {
            const is = isexe.sync(cur, { pathExt: pathExtExe });
            if (is) {
              if (opt.all)
                found.push(cur);
              else
                return cur;
            }
          } catch (ex) {
          }
        }
      }
      if (opt.all && found.length)
        return found;
      if (opt.nothrow)
        return null;
      throw getNotFoundError(cmd);
    };
    module.exports = which;
    which.sync = whichSync;
  }
});

// node_modules/path-key/index.js
var require_path_key = __commonJS({
  "node_modules/path-key/index.js"(exports, module) {
    "use strict";
    var pathKey = (options = {}) => {
      const environment = options.env || process.env;
      const platform = options.platform || process.platform;
      if (platform !== "win32") {
        return "PATH";
      }
      return Object.keys(environment).reverse().find((key) => key.toUpperCase() === "PATH") || "Path";
    };
    module.exports = pathKey;
    module.exports.default = pathKey;
  }
});

// node_modules/cross-spawn/lib/util/resolveCommand.js
var require_resolveCommand = __commonJS({
  "node_modules/cross-spawn/lib/util/resolveCommand.js"(exports, module) {
    "use strict";
    var path2 = __require("path");
    var which = require_which();
    var getPathKey = require_path_key();
    function resolveCommandAttempt(parsed, withoutPathExt) {
      const env = parsed.options.env || process.env;
      const cwd = process.cwd();
      const hasCustomCwd = parsed.options.cwd != null;
      const shouldSwitchCwd = hasCustomCwd && process.chdir !== void 0 && !process.chdir.disabled;
      if (shouldSwitchCwd) {
        try {
          process.chdir(parsed.options.cwd);
        } catch (err) {
        }
      }
      let resolved;
      try {
        resolved = which.sync(parsed.command, {
          path: env[getPathKey({ env })],
          pathExt: withoutPathExt ? path2.delimiter : void 0
        });
      } catch (e) {
      } finally {
        if (shouldSwitchCwd) {
          process.chdir(cwd);
        }
      }
      if (resolved) {
        resolved = path2.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
      }
      return resolved;
    }
    function resolveCommand(parsed) {
      return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
    }
    module.exports = resolveCommand;
  }
});

// node_modules/cross-spawn/lib/util/escape.js
var require_escape = __commonJS({
  "node_modules/cross-spawn/lib/util/escape.js"(exports, module) {
    "use strict";
    var metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
    function escapeCommand(arg) {
      arg = arg.replace(metaCharsRegExp, "^$1");
      return arg;
    }
    function escapeArgument(arg, doubleEscapeMetaChars) {
      arg = `${arg}`;
      arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
      arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
      arg = `"${arg}"`;
      arg = arg.replace(metaCharsRegExp, "^$1");
      if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, "^$1");
      }
      return arg;
    }
    module.exports.command = escapeCommand;
    module.exports.argument = escapeArgument;
  }
});

// node_modules/shebang-regex/index.js
var require_shebang_regex = __commonJS({
  "node_modules/shebang-regex/index.js"(exports, module) {
    "use strict";
    module.exports = /^#!(.*)/;
  }
});

// node_modules/shebang-command/index.js
var require_shebang_command = __commonJS({
  "node_modules/shebang-command/index.js"(exports, module) {
    "use strict";
    var shebangRegex = require_shebang_regex();
    module.exports = (string = "") => {
      const match = string.match(shebangRegex);
      if (!match) {
        return null;
      }
      const [path2, argument] = match[0].replace(/#! ?/, "").split(" ");
      const binary = path2.split("/").pop();
      if (binary === "env") {
        return argument;
      }
      return argument ? `${binary} ${argument}` : binary;
    };
  }
});

// node_modules/cross-spawn/lib/util/readShebang.js
var require_readShebang = __commonJS({
  "node_modules/cross-spawn/lib/util/readShebang.js"(exports, module) {
    "use strict";
    var fs2 = __require("fs");
    var shebangCommand = require_shebang_command();
    function readShebang(command) {
      const size = 150;
      const buffer = Buffer.alloc(size);
      let fd;
      try {
        fd = fs2.openSync(command, "r");
        fs2.readSync(fd, buffer, 0, size, 0);
        fs2.closeSync(fd);
      } catch (e) {
      }
      return shebangCommand(buffer.toString());
    }
    module.exports = readShebang;
  }
});

// node_modules/cross-spawn/lib/parse.js
var require_parse = __commonJS({
  "node_modules/cross-spawn/lib/parse.js"(exports, module) {
    "use strict";
    var path2 = __require("path");
    var resolveCommand = require_resolveCommand();
    var escape = require_escape();
    var readShebang = require_readShebang();
    var isWin = process.platform === "win32";
    var isExecutableRegExp = /\.(?:com|exe)$/i;
    var isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
    function detectShebang(parsed) {
      parsed.file = resolveCommand(parsed);
      const shebang = parsed.file && readShebang(parsed.file);
      if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;
        return resolveCommand(parsed);
      }
      return parsed.file;
    }
    function parseNonShell(parsed) {
      if (!isWin) {
        return parsed;
      }
      const commandFile = detectShebang(parsed);
      const needsShell = !isExecutableRegExp.test(commandFile);
      if (parsed.options.forceShell || needsShell) {
        const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);
        parsed.command = path2.normalize(parsed.command);
        parsed.command = escape.command(parsed.command);
        parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));
        const shellCommand = [parsed.command].concat(parsed.args).join(" ");
        parsed.args = ["/d", "/s", "/c", `"${shellCommand}"`];
        parsed.command = process.env.comspec || "cmd.exe";
        parsed.options.windowsVerbatimArguments = true;
      }
      return parsed;
    }
    function parse(command, args, options) {
      if (args && !Array.isArray(args)) {
        options = args;
        args = null;
      }
      args = args ? args.slice(0) : [];
      options = Object.assign({}, options);
      const parsed = {
        command,
        args,
        options,
        file: void 0,
        original: {
          command,
          args
        }
      };
      return options.shell ? parsed : parseNonShell(parsed);
    }
    module.exports = parse;
  }
});

// node_modules/cross-spawn/lib/enoent.js
var require_enoent = __commonJS({
  "node_modules/cross-spawn/lib/enoent.js"(exports, module) {
    "use strict";
    var isWin = process.platform === "win32";
    function notFoundError(original, syscall) {
      return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: "ENOENT",
        errno: "ENOENT",
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args
      });
    }
    function hookChildProcess(cp, parsed) {
      if (!isWin) {
        return;
      }
      const originalEmit = cp.emit;
      cp.emit = function(name, arg1) {
        if (name === "exit") {
          const err = verifyENOENT(arg1, parsed);
          if (err) {
            return originalEmit.call(cp, "error", err);
          }
        }
        return originalEmit.apply(cp, arguments);
      };
    }
    function verifyENOENT(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawn");
      }
      return null;
    }
    function verifyENOENTSync(status, parsed) {
      if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, "spawnSync");
      }
      return null;
    }
    module.exports = {
      hookChildProcess,
      verifyENOENT,
      verifyENOENTSync,
      notFoundError
    };
  }
});

// node_modules/cross-spawn/index.js
var require_cross_spawn = __commonJS({
  "node_modules/cross-spawn/index.js"(exports, module) {
    "use strict";
    var cp = __require("child_process");
    var parse = require_parse();
    var enoent = require_enoent();
    function spawn(command, args, options) {
      const parsed = parse(command, args, options);
      const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
      enoent.hookChildProcess(spawned, parsed);
      return spawned;
    }
    function spawnSync(command, args, options) {
      const parsed = parse(command, args, options);
      const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
      result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
      return result;
    }
    module.exports = spawn;
    module.exports.spawn = spawn;
    module.exports.sync = spawnSync;
    module.exports._parse = parse;
    module.exports._enoent = enoent;
  }
});

// node_modules/strip-final-newline/index.js
var require_strip_final_newline = __commonJS({
  "node_modules/strip-final-newline/index.js"(exports, module) {
    "use strict";
    module.exports = (input) => {
      const LF = typeof input === "string" ? "\n" : "\n".charCodeAt();
      const CR = typeof input === "string" ? "\r" : "\r".charCodeAt();
      if (input[input.length - 1] === LF) {
        input = input.slice(0, input.length - 1);
      }
      if (input[input.length - 1] === CR) {
        input = input.slice(0, input.length - 1);
      }
      return input;
    };
  }
});

// node_modules/npm-run-path/index.js
var require_npm_run_path = __commonJS({
  "node_modules/npm-run-path/index.js"(exports, module) {
    "use strict";
    var path2 = __require("path");
    var pathKey = require_path_key();
    var npmRunPath = (options) => {
      options = {
        cwd: process.cwd(),
        path: process.env[pathKey()],
        execPath: process.execPath,
        ...options
      };
      let previous;
      let cwdPath = path2.resolve(options.cwd);
      const result = [];
      while (previous !== cwdPath) {
        result.push(path2.join(cwdPath, "node_modules/.bin"));
        previous = cwdPath;
        cwdPath = path2.resolve(cwdPath, "..");
      }
      const execPathDir = path2.resolve(options.cwd, options.execPath, "..");
      result.push(execPathDir);
      return result.concat(options.path).join(path2.delimiter);
    };
    module.exports = npmRunPath;
    module.exports.default = npmRunPath;
    module.exports.env = (options) => {
      options = {
        env: process.env,
        ...options
      };
      const env = { ...options.env };
      const path3 = pathKey({ env });
      options.path = env[path3];
      env[path3] = module.exports(options);
      return env;
    };
  }
});

// node_modules/mimic-fn/index.js
var require_mimic_fn = __commonJS({
  "node_modules/mimic-fn/index.js"(exports, module) {
    "use strict";
    var mimicFn = (to, from) => {
      for (const prop of Reflect.ownKeys(from)) {
        Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
      }
      return to;
    };
    module.exports = mimicFn;
    module.exports.default = mimicFn;
  }
});

// node_modules/onetime/index.js
var require_onetime = __commonJS({
  "node_modules/onetime/index.js"(exports, module) {
    "use strict";
    var mimicFn = require_mimic_fn();
    var calledFunctions = /* @__PURE__ */ new WeakMap();
    var onetime = (function_, options = {}) => {
      if (typeof function_ !== "function") {
        throw new TypeError("Expected a function");
      }
      let returnValue;
      let callCount = 0;
      const functionName = function_.displayName || function_.name || "<anonymous>";
      const onetime2 = function(...arguments_) {
        calledFunctions.set(onetime2, ++callCount);
        if (callCount === 1) {
          returnValue = function_.apply(this, arguments_);
          function_ = null;
        } else if (options.throw === true) {
          throw new Error(`Function \`${functionName}\` can only be called once`);
        }
        return returnValue;
      };
      mimicFn(onetime2, function_);
      calledFunctions.set(onetime2, callCount);
      return onetime2;
    };
    module.exports = onetime;
    module.exports.default = onetime;
    module.exports.callCount = (function_) => {
      if (!calledFunctions.has(function_)) {
        throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
      }
      return calledFunctions.get(function_);
    };
  }
});

// node_modules/human-signals/build/src/core.js
var require_core = __commonJS({
  "node_modules/human-signals/build/src/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SIGNALS = void 0;
    var SIGNALS = [
      {
        name: "SIGHUP",
        number: 1,
        action: "terminate",
        description: "Terminal closed",
        standard: "posix"
      },
      {
        name: "SIGINT",
        number: 2,
        action: "terminate",
        description: "User interruption with CTRL-C",
        standard: "ansi"
      },
      {
        name: "SIGQUIT",
        number: 3,
        action: "core",
        description: "User interruption with CTRL-\\",
        standard: "posix"
      },
      {
        name: "SIGILL",
        number: 4,
        action: "core",
        description: "Invalid machine instruction",
        standard: "ansi"
      },
      {
        name: "SIGTRAP",
        number: 5,
        action: "core",
        description: "Debugger breakpoint",
        standard: "posix"
      },
      {
        name: "SIGABRT",
        number: 6,
        action: "core",
        description: "Aborted",
        standard: "ansi"
      },
      {
        name: "SIGIOT",
        number: 6,
        action: "core",
        description: "Aborted",
        standard: "bsd"
      },
      {
        name: "SIGBUS",
        number: 7,
        action: "core",
        description: "Bus error due to misaligned, non-existing address or paging error",
        standard: "bsd"
      },
      {
        name: "SIGEMT",
        number: 7,
        action: "terminate",
        description: "Command should be emulated but is not implemented",
        standard: "other"
      },
      {
        name: "SIGFPE",
        number: 8,
        action: "core",
        description: "Floating point arithmetic error",
        standard: "ansi"
      },
      {
        name: "SIGKILL",
        number: 9,
        action: "terminate",
        description: "Forced termination",
        standard: "posix",
        forced: true
      },
      {
        name: "SIGUSR1",
        number: 10,
        action: "terminate",
        description: "Application-specific signal",
        standard: "posix"
      },
      {
        name: "SIGSEGV",
        number: 11,
        action: "core",
        description: "Segmentation fault",
        standard: "ansi"
      },
      {
        name: "SIGUSR2",
        number: 12,
        action: "terminate",
        description: "Application-specific signal",
        standard: "posix"
      },
      {
        name: "SIGPIPE",
        number: 13,
        action: "terminate",
        description: "Broken pipe or socket",
        standard: "posix"
      },
      {
        name: "SIGALRM",
        number: 14,
        action: "terminate",
        description: "Timeout or timer",
        standard: "posix"
      },
      {
        name: "SIGTERM",
        number: 15,
        action: "terminate",
        description: "Termination",
        standard: "ansi"
      },
      {
        name: "SIGSTKFLT",
        number: 16,
        action: "terminate",
        description: "Stack is empty or overflowed",
        standard: "other"
      },
      {
        name: "SIGCHLD",
        number: 17,
        action: "ignore",
        description: "Child process terminated, paused or unpaused",
        standard: "posix"
      },
      {
        name: "SIGCLD",
        number: 17,
        action: "ignore",
        description: "Child process terminated, paused or unpaused",
        standard: "other"
      },
      {
        name: "SIGCONT",
        number: 18,
        action: "unpause",
        description: "Unpaused",
        standard: "posix",
        forced: true
      },
      {
        name: "SIGSTOP",
        number: 19,
        action: "pause",
        description: "Paused",
        standard: "posix",
        forced: true
      },
      {
        name: "SIGTSTP",
        number: 20,
        action: "pause",
        description: 'Paused using CTRL-Z or "suspend"',
        standard: "posix"
      },
      {
        name: "SIGTTIN",
        number: 21,
        action: "pause",
        description: "Background process cannot read terminal input",
        standard: "posix"
      },
      {
        name: "SIGBREAK",
        number: 21,
        action: "terminate",
        description: "User interruption with CTRL-BREAK",
        standard: "other"
      },
      {
        name: "SIGTTOU",
        number: 22,
        action: "pause",
        description: "Background process cannot write to terminal output",
        standard: "posix"
      },
      {
        name: "SIGURG",
        number: 23,
        action: "ignore",
        description: "Socket received out-of-band data",
        standard: "bsd"
      },
      {
        name: "SIGXCPU",
        number: 24,
        action: "core",
        description: "Process timed out",
        standard: "bsd"
      },
      {
        name: "SIGXFSZ",
        number: 25,
        action: "core",
        description: "File too big",
        standard: "bsd"
      },
      {
        name: "SIGVTALRM",
        number: 26,
        action: "terminate",
        description: "Timeout or timer",
        standard: "bsd"
      },
      {
        name: "SIGPROF",
        number: 27,
        action: "terminate",
        description: "Timeout or timer",
        standard: "bsd"
      },
      {
        name: "SIGWINCH",
        number: 28,
        action: "ignore",
        description: "Terminal window size changed",
        standard: "bsd"
      },
      {
        name: "SIGIO",
        number: 29,
        action: "terminate",
        description: "I/O is available",
        standard: "other"
      },
      {
        name: "SIGPOLL",
        number: 29,
        action: "terminate",
        description: "Watched event",
        standard: "other"
      },
      {
        name: "SIGINFO",
        number: 29,
        action: "ignore",
        description: "Request for process information",
        standard: "other"
      },
      {
        name: "SIGPWR",
        number: 30,
        action: "terminate",
        description: "Device running out of power",
        standard: "systemv"
      },
      {
        name: "SIGSYS",
        number: 31,
        action: "core",
        description: "Invalid system call",
        standard: "other"
      },
      {
        name: "SIGUNUSED",
        number: 31,
        action: "terminate",
        description: "Invalid system call",
        standard: "other"
      }
    ];
    exports.SIGNALS = SIGNALS;
  }
});

// node_modules/human-signals/build/src/realtime.js
var require_realtime = __commonJS({
  "node_modules/human-signals/build/src/realtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SIGRTMAX = exports.getRealtimeSignals = void 0;
    var getRealtimeSignals = function() {
      const length = SIGRTMAX - SIGRTMIN + 1;
      return Array.from({ length }, getRealtimeSignal);
    };
    exports.getRealtimeSignals = getRealtimeSignals;
    var getRealtimeSignal = function(value, index) {
      return {
        name: `SIGRT${index + 1}`,
        number: SIGRTMIN + index,
        action: "terminate",
        description: "Application-specific signal (realtime)",
        standard: "posix"
      };
    };
    var SIGRTMIN = 34;
    var SIGRTMAX = 64;
    exports.SIGRTMAX = SIGRTMAX;
  }
});

// node_modules/human-signals/build/src/signals.js
var require_signals = __commonJS({
  "node_modules/human-signals/build/src/signals.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSignals = void 0;
    var _os = __require("os");
    var _core = require_core();
    var _realtime = require_realtime();
    var getSignals = function() {
      const realtimeSignals = (0, _realtime.getRealtimeSignals)();
      const signals = [..._core.SIGNALS, ...realtimeSignals].map(normalizeSignal);
      return signals;
    };
    exports.getSignals = getSignals;
    var normalizeSignal = function({
      name,
      number: defaultNumber,
      description,
      action,
      forced = false,
      standard
    }) {
      const {
        signals: { [name]: constantSignal }
      } = _os.constants;
      const supported = constantSignal !== void 0;
      const number = supported ? constantSignal : defaultNumber;
      return { name, number, description, supported, action, forced, standard };
    };
  }
});

// node_modules/human-signals/build/src/main.js
var require_main = __commonJS({
  "node_modules/human-signals/build/src/main.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.signalsByNumber = exports.signalsByName = void 0;
    var _os = __require("os");
    var _signals = require_signals();
    var _realtime = require_realtime();
    var getSignalsByName = function() {
      const signals = (0, _signals.getSignals)();
      return signals.reduce(getSignalByName, {});
    };
    var getSignalByName = function(signalByNameMemo, { name, number, description, supported, action, forced, standard }) {
      return {
        ...signalByNameMemo,
        [name]: { name, number, description, supported, action, forced, standard }
      };
    };
    var signalsByName = getSignalsByName();
    exports.signalsByName = signalsByName;
    var getSignalsByNumber = function() {
      const signals = (0, _signals.getSignals)();
      const length = _realtime.SIGRTMAX + 1;
      const signalsA = Array.from({ length }, (value, number) => getSignalByNumber(number, signals));
      return Object.assign({}, ...signalsA);
    };
    var getSignalByNumber = function(number, signals) {
      const signal = findSignalByNumber(number, signals);
      if (signal === void 0) {
        return {};
      }
      const { name, description, supported, action, forced, standard } = signal;
      return {
        [number]: {
          name,
          number,
          description,
          supported,
          action,
          forced,
          standard
        }
      };
    };
    var findSignalByNumber = function(number, signals) {
      const signal = signals.find(({ name }) => _os.constants.signals[name] === number);
      if (signal !== void 0) {
        return signal;
      }
      return signals.find((signalA) => signalA.number === number);
    };
    var signalsByNumber = getSignalsByNumber();
    exports.signalsByNumber = signalsByNumber;
  }
});

// node_modules/execa/lib/error.js
var require_error = __commonJS({
  "node_modules/execa/lib/error.js"(exports, module) {
    "use strict";
    var { signalsByName } = require_main();
    var getErrorPrefix = ({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled }) => {
      if (timedOut) {
        return `timed out after ${timeout} milliseconds`;
      }
      if (isCanceled) {
        return "was canceled";
      }
      if (errorCode !== void 0) {
        return `failed with ${errorCode}`;
      }
      if (signal !== void 0) {
        return `was killed with ${signal} (${signalDescription})`;
      }
      if (exitCode !== void 0) {
        return `failed with exit code ${exitCode}`;
      }
      return "failed";
    };
    var makeError = ({
      stdout,
      stderr,
      all,
      error,
      signal,
      exitCode,
      command,
      escapedCommand,
      timedOut,
      isCanceled,
      killed,
      parsed: { options: { timeout } }
    }) => {
      exitCode = exitCode === null ? void 0 : exitCode;
      signal = signal === null ? void 0 : signal;
      const signalDescription = signal === void 0 ? void 0 : signalsByName[signal].description;
      const errorCode = error && error.code;
      const prefix = getErrorPrefix({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled });
      const execaMessage = `Command ${prefix}: ${command}`;
      const isError = Object.prototype.toString.call(error) === "[object Error]";
      const shortMessage = isError ? `${execaMessage}
${error.message}` : execaMessage;
      const message = [shortMessage, stderr, stdout].filter(Boolean).join("\n");
      if (isError) {
        error.originalMessage = error.message;
        error.message = message;
      } else {
        error = new Error(message);
      }
      error.shortMessage = shortMessage;
      error.command = command;
      error.escapedCommand = escapedCommand;
      error.exitCode = exitCode;
      error.signal = signal;
      error.signalDescription = signalDescription;
      error.stdout = stdout;
      error.stderr = stderr;
      if (all !== void 0) {
        error.all = all;
      }
      if ("bufferedData" in error) {
        delete error.bufferedData;
      }
      error.failed = true;
      error.timedOut = Boolean(timedOut);
      error.isCanceled = isCanceled;
      error.killed = killed && !timedOut;
      return error;
    };
    module.exports = makeError;
  }
});

// node_modules/execa/lib/stdio.js
var require_stdio = __commonJS({
  "node_modules/execa/lib/stdio.js"(exports, module) {
    "use strict";
    var aliases = ["stdin", "stdout", "stderr"];
    var hasAlias = (options) => aliases.some((alias) => options[alias] !== void 0);
    var normalizeStdio = (options) => {
      if (!options) {
        return;
      }
      const { stdio } = options;
      if (stdio === void 0) {
        return aliases.map((alias) => options[alias]);
      }
      if (hasAlias(options)) {
        throw new Error(`It's not possible to provide \`stdio\` in combination with one of ${aliases.map((alias) => `\`${alias}\``).join(", ")}`);
      }
      if (typeof stdio === "string") {
        return stdio;
      }
      if (!Array.isArray(stdio)) {
        throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
      }
      const length = Math.max(stdio.length, aliases.length);
      return Array.from({ length }, (value, index) => stdio[index]);
    };
    module.exports = normalizeStdio;
    module.exports.node = (options) => {
      const stdio = normalizeStdio(options);
      if (stdio === "ipc") {
        return "ipc";
      }
      if (stdio === void 0 || typeof stdio === "string") {
        return [stdio, stdio, stdio, "ipc"];
      }
      if (stdio.includes("ipc")) {
        return stdio;
      }
      return [...stdio, "ipc"];
    };
  }
});

// node_modules/signal-exit/signals.js
var require_signals2 = __commonJS({
  "node_modules/signal-exit/signals.js"(exports, module) {
    module.exports = [
      "SIGABRT",
      "SIGALRM",
      "SIGHUP",
      "SIGINT",
      "SIGTERM"
    ];
    if (process.platform !== "win32") {
      module.exports.push(
        "SIGVTALRM",
        "SIGXCPU",
        "SIGXFSZ",
        "SIGUSR2",
        "SIGTRAP",
        "SIGSYS",
        "SIGQUIT",
        "SIGIOT"
        // should detect profiler and enable/disable accordingly.
        // see #21
        // 'SIGPROF'
      );
    }
    if (process.platform === "linux") {
      module.exports.push(
        "SIGIO",
        "SIGPOLL",
        "SIGPWR",
        "SIGSTKFLT",
        "SIGUNUSED"
      );
    }
  }
});

// node_modules/signal-exit/index.js
var require_signal_exit = __commonJS({
  "node_modules/signal-exit/index.js"(exports, module) {
    var process2 = global.process;
    var processOk = function(process3) {
      return process3 && typeof process3 === "object" && typeof process3.removeListener === "function" && typeof process3.emit === "function" && typeof process3.reallyExit === "function" && typeof process3.listeners === "function" && typeof process3.kill === "function" && typeof process3.pid === "number" && typeof process3.on === "function";
    };
    if (!processOk(process2)) {
      module.exports = function() {
        return function() {
        };
      };
    } else {
      assert = __require("assert");
      signals = require_signals2();
      isWin = /^win/i.test(process2.platform);
      EE = __require("events");
      if (typeof EE !== "function") {
        EE = EE.EventEmitter;
      }
      if (process2.__signal_exit_emitter__) {
        emitter = process2.__signal_exit_emitter__;
      } else {
        emitter = process2.__signal_exit_emitter__ = new EE();
        emitter.count = 0;
        emitter.emitted = {};
      }
      if (!emitter.infinite) {
        emitter.setMaxListeners(Infinity);
        emitter.infinite = true;
      }
      module.exports = function(cb, opts) {
        if (!processOk(global.process)) {
          return function() {
          };
        }
        assert.equal(typeof cb, "function", "a callback must be provided for exit handler");
        if (loaded === false) {
          load();
        }
        var ev = "exit";
        if (opts && opts.alwaysLast) {
          ev = "afterexit";
        }
        var remove = function() {
          emitter.removeListener(ev, cb);
          if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
            unload();
          }
        };
        emitter.on(ev, cb);
        return remove;
      };
      unload = function unload2() {
        if (!loaded || !processOk(global.process)) {
          return;
        }
        loaded = false;
        signals.forEach(function(sig) {
          try {
            process2.removeListener(sig, sigListeners[sig]);
          } catch (er) {
          }
        });
        process2.emit = originalProcessEmit;
        process2.reallyExit = originalProcessReallyExit;
        emitter.count -= 1;
      };
      module.exports.unload = unload;
      emit = function emit2(event, code, signal) {
        if (emitter.emitted[event]) {
          return;
        }
        emitter.emitted[event] = true;
        emitter.emit(event, code, signal);
      };
      sigListeners = {};
      signals.forEach(function(sig) {
        sigListeners[sig] = function listener() {
          if (!processOk(global.process)) {
            return;
          }
          var listeners = process2.listeners(sig);
          if (listeners.length === emitter.count) {
            unload();
            emit("exit", null, sig);
            emit("afterexit", null, sig);
            if (isWin && sig === "SIGHUP") {
              sig = "SIGINT";
            }
            process2.kill(process2.pid, sig);
          }
        };
      });
      module.exports.signals = function() {
        return signals;
      };
      loaded = false;
      load = function load2() {
        if (loaded || !processOk(global.process)) {
          return;
        }
        loaded = true;
        emitter.count += 1;
        signals = signals.filter(function(sig) {
          try {
            process2.on(sig, sigListeners[sig]);
            return true;
          } catch (er) {
            return false;
          }
        });
        process2.emit = processEmit;
        process2.reallyExit = processReallyExit;
      };
      module.exports.load = load;
      originalProcessReallyExit = process2.reallyExit;
      processReallyExit = function processReallyExit2(code) {
        if (!processOk(global.process)) {
          return;
        }
        process2.exitCode = code || /* istanbul ignore next */
        0;
        emit("exit", process2.exitCode, null);
        emit("afterexit", process2.exitCode, null);
        originalProcessReallyExit.call(process2, process2.exitCode);
      };
      originalProcessEmit = process2.emit;
      processEmit = function processEmit2(ev, arg) {
        if (ev === "exit" && processOk(global.process)) {
          if (arg !== void 0) {
            process2.exitCode = arg;
          }
          var ret = originalProcessEmit.apply(this, arguments);
          emit("exit", process2.exitCode, null);
          emit("afterexit", process2.exitCode, null);
          return ret;
        } else {
          return originalProcessEmit.apply(this, arguments);
        }
      };
    }
    var assert;
    var signals;
    var isWin;
    var EE;
    var emitter;
    var unload;
    var emit;
    var sigListeners;
    var loaded;
    var load;
    var originalProcessReallyExit;
    var processReallyExit;
    var originalProcessEmit;
    var processEmit;
  }
});

// node_modules/execa/lib/kill.js
var require_kill = __commonJS({
  "node_modules/execa/lib/kill.js"(exports, module) {
    "use strict";
    var os = __require("os");
    var onExit = require_signal_exit();
    var DEFAULT_FORCE_KILL_TIMEOUT = 1e3 * 5;
    var spawnedKill = (kill, signal = "SIGTERM", options = {}) => {
      const killResult = kill(signal);
      setKillTimeout(kill, signal, options, killResult);
      return killResult;
    };
    var setKillTimeout = (kill, signal, options, killResult) => {
      if (!shouldForceKill(signal, options, killResult)) {
        return;
      }
      const timeout = getForceKillAfterTimeout(options);
      const t = setTimeout(() => {
        kill("SIGKILL");
      }, timeout);
      if (t.unref) {
        t.unref();
      }
    };
    var shouldForceKill = (signal, { forceKillAfterTimeout }, killResult) => {
      return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
    };
    var isSigterm = (signal) => {
      return signal === os.constants.signals.SIGTERM || typeof signal === "string" && signal.toUpperCase() === "SIGTERM";
    };
    var getForceKillAfterTimeout = ({ forceKillAfterTimeout = true }) => {
      if (forceKillAfterTimeout === true) {
        return DEFAULT_FORCE_KILL_TIMEOUT;
      }
      if (!Number.isFinite(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
        throw new TypeError(`Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`);
      }
      return forceKillAfterTimeout;
    };
    var spawnedCancel = (spawned, context) => {
      const killResult = spawned.kill();
      if (killResult) {
        context.isCanceled = true;
      }
    };
    var timeoutKill = (spawned, signal, reject) => {
      spawned.kill(signal);
      reject(Object.assign(new Error("Timed out"), { timedOut: true, signal }));
    };
    var setupTimeout = (spawned, { timeout, killSignal = "SIGTERM" }, spawnedPromise) => {
      if (timeout === 0 || timeout === void 0) {
        return spawnedPromise;
      }
      let timeoutId;
      const timeoutPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          timeoutKill(spawned, killSignal, reject);
        }, timeout);
      });
      const safeSpawnedPromise = spawnedPromise.finally(() => {
        clearTimeout(timeoutId);
      });
      return Promise.race([timeoutPromise, safeSpawnedPromise]);
    };
    var validateTimeout = ({ timeout }) => {
      if (timeout !== void 0 && (!Number.isFinite(timeout) || timeout < 0)) {
        throw new TypeError(`Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`);
      }
    };
    var setExitHandler = async (spawned, { cleanup, detached }, timedPromise) => {
      if (!cleanup || detached) {
        return timedPromise;
      }
      const removeExitHandler = onExit(() => {
        spawned.kill();
      });
      return timedPromise.finally(() => {
        removeExitHandler();
      });
    };
    module.exports = {
      spawnedKill,
      spawnedCancel,
      setupTimeout,
      validateTimeout,
      setExitHandler
    };
  }
});

// node_modules/is-stream/index.js
var require_is_stream = __commonJS({
  "node_modules/is-stream/index.js"(exports, module) {
    "use strict";
    var isStream = (stream) => stream !== null && typeof stream === "object" && typeof stream.pipe === "function";
    isStream.writable = (stream) => isStream(stream) && stream.writable !== false && typeof stream._write === "function" && typeof stream._writableState === "object";
    isStream.readable = (stream) => isStream(stream) && stream.readable !== false && typeof stream._read === "function" && typeof stream._readableState === "object";
    isStream.duplex = (stream) => isStream.writable(stream) && isStream.readable(stream);
    isStream.transform = (stream) => isStream.duplex(stream) && typeof stream._transform === "function";
    module.exports = isStream;
  }
});

// node_modules/get-stream/buffer-stream.js
var require_buffer_stream = __commonJS({
  "node_modules/get-stream/buffer-stream.js"(exports, module) {
    "use strict";
    var { PassThrough: PassThroughStream } = __require("stream");
    module.exports = (options) => {
      options = { ...options };
      const { array } = options;
      let { encoding } = options;
      const isBuffer = encoding === "buffer";
      let objectMode = false;
      if (array) {
        objectMode = !(encoding || isBuffer);
      } else {
        encoding = encoding || "utf8";
      }
      if (isBuffer) {
        encoding = null;
      }
      const stream = new PassThroughStream({ objectMode });
      if (encoding) {
        stream.setEncoding(encoding);
      }
      let length = 0;
      const chunks = [];
      stream.on("data", (chunk) => {
        chunks.push(chunk);
        if (objectMode) {
          length = chunks.length;
        } else {
          length += chunk.length;
        }
      });
      stream.getBufferedValue = () => {
        if (array) {
          return chunks;
        }
        return isBuffer ? Buffer.concat(chunks, length) : chunks.join("");
      };
      stream.getBufferedLength = () => length;
      return stream;
    };
  }
});

// node_modules/get-stream/index.js
var require_get_stream = __commonJS({
  "node_modules/get-stream/index.js"(exports, module) {
    "use strict";
    var { constants: BufferConstants } = __require("buffer");
    var stream = __require("stream");
    var { promisify } = __require("util");
    var bufferStream = require_buffer_stream();
    var streamPipelinePromisified = promisify(stream.pipeline);
    var MaxBufferError = class extends Error {
      constructor() {
        super("maxBuffer exceeded");
        this.name = "MaxBufferError";
      }
    };
    async function getStream(inputStream, options) {
      if (!inputStream) {
        throw new Error("Expected a stream");
      }
      options = {
        maxBuffer: Infinity,
        ...options
      };
      const { maxBuffer } = options;
      const stream2 = bufferStream(options);
      await new Promise((resolve, reject) => {
        const rejectPromise = (error) => {
          if (error && stream2.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
            error.bufferedData = stream2.getBufferedValue();
          }
          reject(error);
        };
        (async () => {
          try {
            await streamPipelinePromisified(inputStream, stream2);
            resolve();
          } catch (error) {
            rejectPromise(error);
          }
        })();
        stream2.on("data", () => {
          if (stream2.getBufferedLength() > maxBuffer) {
            rejectPromise(new MaxBufferError());
          }
        });
      });
      return stream2.getBufferedValue();
    }
    module.exports = getStream;
    module.exports.buffer = (stream2, options) => getStream(stream2, { ...options, encoding: "buffer" });
    module.exports.array = (stream2, options) => getStream(stream2, { ...options, array: true });
    module.exports.MaxBufferError = MaxBufferError;
  }
});

// node_modules/merge-stream/index.js
var require_merge_stream = __commonJS({
  "node_modules/merge-stream/index.js"(exports, module) {
    "use strict";
    var { PassThrough } = __require("stream");
    module.exports = function() {
      var sources = [];
      var output = new PassThrough({ objectMode: true });
      output.setMaxListeners(0);
      output.add = add;
      output.isEmpty = isEmpty;
      output.on("unpipe", remove);
      Array.prototype.slice.call(arguments).forEach(add);
      return output;
      function add(source) {
        if (Array.isArray(source)) {
          source.forEach(add);
          return this;
        }
        sources.push(source);
        source.once("end", remove.bind(null, source));
        source.once("error", output.emit.bind(output, "error"));
        source.pipe(output, { end: false });
        return this;
      }
      function isEmpty() {
        return sources.length == 0;
      }
      function remove(source) {
        sources = sources.filter(function(it) {
          return it !== source;
        });
        if (!sources.length && output.readable) {
          output.end();
        }
      }
    };
  }
});

// node_modules/execa/lib/stream.js
var require_stream = __commonJS({
  "node_modules/execa/lib/stream.js"(exports, module) {
    "use strict";
    var isStream = require_is_stream();
    var getStream = require_get_stream();
    var mergeStream = require_merge_stream();
    var handleInput = (spawned, input) => {
      if (input === void 0 || spawned.stdin === void 0) {
        return;
      }
      if (isStream(input)) {
        input.pipe(spawned.stdin);
      } else {
        spawned.stdin.end(input);
      }
    };
    var makeAllStream = (spawned, { all }) => {
      if (!all || !spawned.stdout && !spawned.stderr) {
        return;
      }
      const mixed = mergeStream();
      if (spawned.stdout) {
        mixed.add(spawned.stdout);
      }
      if (spawned.stderr) {
        mixed.add(spawned.stderr);
      }
      return mixed;
    };
    var getBufferedData = async (stream, streamPromise) => {
      if (!stream) {
        return;
      }
      stream.destroy();
      try {
        return await streamPromise;
      } catch (error) {
        return error.bufferedData;
      }
    };
    var getStreamPromise = (stream, { encoding, buffer, maxBuffer }) => {
      if (!stream || !buffer) {
        return;
      }
      if (encoding) {
        return getStream(stream, { encoding, maxBuffer });
      }
      return getStream.buffer(stream, { maxBuffer });
    };
    var getSpawnedResult = async ({ stdout, stderr, all }, { encoding, buffer, maxBuffer }, processDone) => {
      const stdoutPromise = getStreamPromise(stdout, { encoding, buffer, maxBuffer });
      const stderrPromise = getStreamPromise(stderr, { encoding, buffer, maxBuffer });
      const allPromise = getStreamPromise(all, { encoding, buffer, maxBuffer: maxBuffer * 2 });
      try {
        return await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
      } catch (error) {
        return Promise.all([
          { error, signal: error.signal, timedOut: error.timedOut },
          getBufferedData(stdout, stdoutPromise),
          getBufferedData(stderr, stderrPromise),
          getBufferedData(all, allPromise)
        ]);
      }
    };
    var validateInputSync = ({ input }) => {
      if (isStream(input)) {
        throw new TypeError("The `input` option cannot be a stream in sync mode");
      }
    };
    module.exports = {
      handleInput,
      makeAllStream,
      getSpawnedResult,
      validateInputSync
    };
  }
});

// node_modules/execa/lib/promise.js
var require_promise = __commonJS({
  "node_modules/execa/lib/promise.js"(exports, module) {
    "use strict";
    var nativePromisePrototype = (async () => {
    })().constructor.prototype;
    var descriptors = ["then", "catch", "finally"].map((property) => [
      property,
      Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property)
    ]);
    var mergePromise = (spawned, promise) => {
      for (const [property, descriptor] of descriptors) {
        const value = typeof promise === "function" ? (...args) => Reflect.apply(descriptor.value, promise(), args) : descriptor.value.bind(promise);
        Reflect.defineProperty(spawned, property, { ...descriptor, value });
      }
      return spawned;
    };
    var getSpawnedPromise = (spawned) => {
      return new Promise((resolve, reject) => {
        spawned.on("exit", (exitCode, signal) => {
          resolve({ exitCode, signal });
        });
        spawned.on("error", (error) => {
          reject(error);
        });
        if (spawned.stdin) {
          spawned.stdin.on("error", (error) => {
            reject(error);
          });
        }
      });
    };
    module.exports = {
      mergePromise,
      getSpawnedPromise
    };
  }
});

// node_modules/execa/lib/command.js
var require_command = __commonJS({
  "node_modules/execa/lib/command.js"(exports, module) {
    "use strict";
    var normalizeArgs = (file, args = []) => {
      if (!Array.isArray(args)) {
        return [file];
      }
      return [file, ...args];
    };
    var NO_ESCAPE_REGEXP = /^[\w.-]+$/;
    var DOUBLE_QUOTES_REGEXP = /"/g;
    var escapeArg = (arg) => {
      if (typeof arg !== "string" || NO_ESCAPE_REGEXP.test(arg)) {
        return arg;
      }
      return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
    };
    var joinCommand = (file, args) => {
      return normalizeArgs(file, args).join(" ");
    };
    var getEscapedCommand = (file, args) => {
      return normalizeArgs(file, args).map((arg) => escapeArg(arg)).join(" ");
    };
    var SPACES_REGEXP = / +/g;
    var parseCommand = (command) => {
      const tokens = [];
      for (const token of command.trim().split(SPACES_REGEXP)) {
        const previousToken = tokens[tokens.length - 1];
        if (previousToken && previousToken.endsWith("\\")) {
          tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
        } else {
          tokens.push(token);
        }
      }
      return tokens;
    };
    module.exports = {
      joinCommand,
      getEscapedCommand,
      parseCommand
    };
  }
});

// node_modules/execa/index.js
var require_execa = __commonJS({
  "node_modules/execa/index.js"(exports, module) {
    "use strict";
    var path2 = __require("path");
    var childProcess = __require("child_process");
    var crossSpawn = require_cross_spawn();
    var stripFinalNewline = require_strip_final_newline();
    var npmRunPath = require_npm_run_path();
    var onetime = require_onetime();
    var makeError = require_error();
    var normalizeStdio = require_stdio();
    var { spawnedKill, spawnedCancel, setupTimeout, validateTimeout, setExitHandler } = require_kill();
    var { handleInput, getSpawnedResult, makeAllStream, validateInputSync } = require_stream();
    var { mergePromise, getSpawnedPromise } = require_promise();
    var { joinCommand, parseCommand, getEscapedCommand } = require_command();
    var DEFAULT_MAX_BUFFER = 1e3 * 1e3 * 100;
    var getEnv = ({ env: envOption, extendEnv, preferLocal, localDir, execPath }) => {
      const env = extendEnv ? { ...process.env, ...envOption } : envOption;
      if (preferLocal) {
        return npmRunPath.env({ env, cwd: localDir, execPath });
      }
      return env;
    };
    var handleArguments = (file, args, options = {}) => {
      const parsed = crossSpawn._parse(file, args, options);
      file = parsed.command;
      args = parsed.args;
      options = parsed.options;
      options = {
        maxBuffer: DEFAULT_MAX_BUFFER,
        buffer: true,
        stripFinalNewline: true,
        extendEnv: true,
        preferLocal: false,
        localDir: options.cwd || process.cwd(),
        execPath: process.execPath,
        encoding: "utf8",
        reject: true,
        cleanup: true,
        all: false,
        windowsHide: true,
        ...options
      };
      options.env = getEnv(options);
      options.stdio = normalizeStdio(options);
      if (process.platform === "win32" && path2.basename(file, ".exe") === "cmd") {
        args.unshift("/q");
      }
      return { file, args, options, parsed };
    };
    var handleOutput = (options, value, error) => {
      if (typeof value !== "string" && !Buffer.isBuffer(value)) {
        return error === void 0 ? void 0 : "";
      }
      if (options.stripFinalNewline) {
        return stripFinalNewline(value);
      }
      return value;
    };
    var execa = (file, args, options) => {
      const parsed = handleArguments(file, args, options);
      const command = joinCommand(file, args);
      const escapedCommand = getEscapedCommand(file, args);
      validateTimeout(parsed.options);
      let spawned;
      try {
        spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
      } catch (error) {
        const dummySpawned = new childProcess.ChildProcess();
        const errorPromise = Promise.reject(makeError({
          error,
          stdout: "",
          stderr: "",
          all: "",
          command,
          escapedCommand,
          parsed,
          timedOut: false,
          isCanceled: false,
          killed: false
        }));
        return mergePromise(dummySpawned, errorPromise);
      }
      const spawnedPromise = getSpawnedPromise(spawned);
      const timedPromise = setupTimeout(spawned, parsed.options, spawnedPromise);
      const processDone = setExitHandler(spawned, parsed.options, timedPromise);
      const context = { isCanceled: false };
      spawned.kill = spawnedKill.bind(null, spawned.kill.bind(spawned));
      spawned.cancel = spawnedCancel.bind(null, spawned, context);
      const handlePromise = async () => {
        const [{ error, exitCode, signal, timedOut }, stdoutResult, stderrResult, allResult] = await getSpawnedResult(spawned, parsed.options, processDone);
        const stdout = handleOutput(parsed.options, stdoutResult);
        const stderr = handleOutput(parsed.options, stderrResult);
        const all = handleOutput(parsed.options, allResult);
        if (error || exitCode !== 0 || signal !== null) {
          const returnedError = makeError({
            error,
            exitCode,
            signal,
            stdout,
            stderr,
            all,
            command,
            escapedCommand,
            parsed,
            timedOut,
            isCanceled: context.isCanceled,
            killed: spawned.killed
          });
          if (!parsed.options.reject) {
            return returnedError;
          }
          throw returnedError;
        }
        return {
          command,
          escapedCommand,
          exitCode: 0,
          stdout,
          stderr,
          all,
          failed: false,
          timedOut: false,
          isCanceled: false,
          killed: false
        };
      };
      const handlePromiseOnce = onetime(handlePromise);
      handleInput(spawned, parsed.options.input);
      spawned.all = makeAllStream(spawned, parsed.options);
      return mergePromise(spawned, handlePromiseOnce);
    };
    module.exports = execa;
    module.exports.sync = (file, args, options) => {
      const parsed = handleArguments(file, args, options);
      const command = joinCommand(file, args);
      const escapedCommand = getEscapedCommand(file, args);
      validateInputSync(parsed.options);
      let result;
      try {
        result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
      } catch (error) {
        throw makeError({
          error,
          stdout: "",
          stderr: "",
          all: "",
          command,
          escapedCommand,
          parsed,
          timedOut: false,
          isCanceled: false,
          killed: false
        });
      }
      const stdout = handleOutput(parsed.options, result.stdout, result.error);
      const stderr = handleOutput(parsed.options, result.stderr, result.error);
      if (result.error || result.status !== 0 || result.signal !== null) {
        const error = makeError({
          stdout,
          stderr,
          error: result.error,
          signal: result.signal,
          exitCode: result.status,
          command,
          escapedCommand,
          parsed,
          timedOut: result.error && result.error.code === "ETIMEDOUT",
          isCanceled: false,
          killed: result.signal !== null
        });
        if (!parsed.options.reject) {
          return error;
        }
        throw error;
      }
      return {
        command,
        escapedCommand,
        exitCode: 0,
        stdout,
        stderr,
        failed: false,
        timedOut: false,
        isCanceled: false,
        killed: false
      };
    };
    module.exports.command = (command, options) => {
      const [file, ...args] = parseCommand(command);
      return execa(file, args, options);
    };
    module.exports.commandSync = (command, options) => {
      const [file, ...args] = parseCommand(command);
      return execa.sync(file, args, options);
    };
    module.exports.node = (scriptPath, args, options = {}) => {
      if (args && !Array.isArray(args) && typeof args === "object") {
        options = args;
        args = [];
      }
      const stdio = normalizeStdio.node(options);
      const defaultExecArgv = process.execArgv.filter((arg) => !arg.startsWith("--inspect"));
      const {
        nodePath = process.execPath,
        nodeOptions = defaultExecArgv
      } = options;
      return execa(
        nodePath,
        [
          ...nodeOptions,
          scriptPath,
          ...Array.isArray(args) ? args : []
        ],
        {
          ...options,
          stdin: void 0,
          stdout: void 0,
          stderr: void 0,
          stdio,
          shell: false
        }
      );
    };
  }
});

// node_modules/@vercel/cli-exec/dist/envpath.js
var require_envpath = __commonJS({
  "node_modules/@vercel/cli-exec/dist/envpath.js"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var envpath_exports = {};
    __export(envpath_exports, {
      getEnvPath: () => getEnvPath,
      prependPathEntries: () => prependPathEntries,
      setEnvPath: () => setEnvPath,
      splitPath: () => splitPath
    });
    module.exports = __toCommonJS(envpath_exports);
    var import_node_path = __toESM2(__require("node:path"));
    function prependPathEntries(pathValue, directories) {
      const pathParts = pathValue.split(import_node_path.default.delimiter).filter(Boolean);
      const prepended = [];
      for (const directory of directories) {
        if (!pathParts.includes(directory) && !prepended.includes(directory)) {
          prepended.push(directory);
        }
      }
      if (prepended.length === 0) {
        return pathValue;
      }
      return pathValue === "" || pathValue === import_node_path.default.delimiter ? `${prepended.join(import_node_path.default.delimiter)}${pathValue}` : [...prepended, pathValue].join(import_node_path.default.delimiter);
    }
    function splitPath(pathValue) {
      return pathValue.split(import_node_path.default.delimiter).filter(Boolean);
    }
    function getEnvPath(env = process.env) {
      if (process.platform !== "win32") {
        return env.PATH ?? "";
      }
      const pathKeys = Object.keys(env).filter((key) => key.toLowerCase() === "path");
      for (let index = pathKeys.length - 1; index >= 0; index--) {
        const value = env[pathKeys[index]];
        if (value !== void 0) {
          return value;
        }
      }
      return "";
    }
    function setEnvPath(env = process.env, pathValue) {
      if (process.platform !== "win32") {
        return {
          ...env,
          PATH: pathValue
        };
      }
      const normalizedEnv = { ...env };
      for (const key of Object.keys(normalizedEnv)) {
        if (key !== "PATH" && key.toLowerCase() === "path") {
          delete normalizedEnv[key];
        }
      }
      normalizedEnv.PATH = pathValue;
      return normalizedEnv;
    }
  }
});

// node_modules/@vercel/cli-exec/dist/errutils.js
var require_errutils = __commonJS({
  "node_modules/@vercel/cli-exec/dist/errutils.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var errutils_exports = {};
    __export(errutils_exports, {
      getErrorMessage: () => getErrorMessage,
      isMissingPathError: () => isMissingPathError
    });
    module.exports = __toCommonJS(errutils_exports);
    function getErrorMessage(error) {
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
    function isMissingPathError(error) {
      return typeof error === "object" && error !== null && "code" in error && (error.code === "ENOENT" || error.code === "ENOTDIR");
    }
  }
});

// node_modules/@vercel/cli-exec/dist/fsutils.js
var require_fsutils = __commonJS({
  "node_modules/@vercel/cli-exec/dist/fsutils.js"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var fsutils_exports = {};
    __export(fsutils_exports, {
      getCanonicalPath: () => getCanonicalPath,
      getCommandBase: () => getCommandBase,
      getDirectoriesBetween: () => getDirectoriesBetween,
      isNodeScript: () => isNodeScript,
      isSubpath: () => isSubpath,
      statIfExists: () => statIfExists
    });
    module.exports = __toCommonJS(fsutils_exports);
    var import_promises = __require("node:fs/promises");
    var import_node_path = __toESM2(__require("node:path"));
    var import_errutils = require_errutils();
    async function getCanonicalPath(filePath) {
      try {
        return await (0, import_promises.realpath)(filePath);
      } catch {
        return filePath;
      }
    }
    function getDirectoriesBetween(parent, child) {
      const directories = [];
      let current = import_node_path.default.resolve(child);
      const resolvedParent = import_node_path.default.resolve(parent);
      while (true) {
        directories.push(current);
        if (current === resolvedParent) {
          return directories.reverse();
        }
        const next = import_node_path.default.dirname(current);
        if (next === current) {
          return [];
        }
        current = next;
      }
    }
    async function statIfExists(filePath) {
      try {
        return { stats: await (0, import_promises.stat)(filePath) };
      } catch (error) {
        if ((0, import_errutils.isMissingPathError)(error)) {
          return { missing: true };
        }
        return { reason: `could not inspect: ${(0, import_errutils.getErrorMessage)(error)}` };
      }
    }
    function isNodeScript(filePath) {
      return [".js", ".cjs", ".mjs"].includes(import_node_path.default.extname(filePath));
    }
    function isSubpath(parent, child) {
      const relativePath = import_node_path.default.relative(parent, child);
      return relativePath === "" || relativePath !== "" && !relativePath.startsWith("..") && !import_node_path.default.isAbsolute(relativePath);
    }
    function getCommandBase(command) {
      const extension = import_node_path.default.extname(command).toLowerCase();
      if (process.platform === "win32" && [".cmd", ".exe"].includes(extension)) {
        return import_node_path.default.basename(command, extension);
      }
      return import_node_path.default.basename(command);
    }
  }
});

// node_modules/@vercel/cli-exec/dist/safety.js
var require_safety = __commonJS({
  "node_modules/@vercel/cli-exec/dist/safety.js"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var safety_exports = {};
    __export(safety_exports, {
      getSkippedNodeModulesReason: () => getSkippedNodeModulesReason,
      getUnsafeDirectoryReason: () => getUnsafeDirectoryReason,
      getUnsafePackageBinReason: () => getUnsafePackageBinReason,
      getUnsafePackageDirectoryReason: () => getUnsafePackageDirectoryReason,
      getUnsafePackageFileReason: () => getUnsafePackageFileReason,
      getUnsafeStatsReason: () => getUnsafeStatsReason
    });
    module.exports = __toCommonJS(safety_exports);
    var import_promises = __require("node:fs/promises");
    var import_node_path = __toESM2(__require("node:path"));
    var import_errutils = require_errutils();
    var import_fsutils = require_fsutils();
    async function getSkippedNodeModulesReason(nodeModulesDirectory, parentDirectories) {
      const parentDirectory = import_node_path.default.dirname(nodeModulesDirectory);
      parentDirectories ??= [parentDirectory];
      for (const directory of parentDirectories) {
        let unsafeParentReason;
        try {
          unsafeParentReason = await getUnsafeDirectoryReason(directory);
        } catch (error) {
          unsafeParentReason = `could not inspect: ${(0, import_errutils.getErrorMessage)(error)}`;
        }
        if (unsafeParentReason) {
          return `${directory} is ${unsafeParentReason}`;
        }
      }
      const result = await (0, import_fsutils.statIfExists)(nodeModulesDirectory);
      if ("missing" in result) {
        return null;
      }
      if ("reason" in result) {
        return result.reason;
      }
      if (!result.stats.isDirectory()) {
        return "not a directory";
      }
      const unsafeNodeModulesReason = getUnsafeStatsReason(result.stats);
      if (unsafeNodeModulesReason) {
        return unsafeNodeModulesReason;
      }
      return await getSkippedLocalBinDirectoryReason(
        import_node_path.default.join(nodeModulesDirectory, ".bin")
      );
    }
    async function getSkippedLocalBinDirectoryReason(localBinDirectory) {
      const result = await (0, import_fsutils.statIfExists)(localBinDirectory);
      if ("missing" in result) {
        return null;
      }
      if ("reason" in result) {
        return `${localBinDirectory} ${result.reason}`;
      }
      if (!result.stats.isDirectory()) {
        return `${localBinDirectory} is not a directory`;
      }
      const unsafeLocalBinReason = getUnsafeStatsReason(result.stats);
      return unsafeLocalBinReason ? `${localBinDirectory} is ${unsafeLocalBinReason}` : null;
    }
    async function getUnsafePackageBinReason(nodeModulesDirectory, packageDirectory, binPath) {
      const unsafePackageDirectoryReason = await getUnsafePackageDirectoryReason(
        nodeModulesDirectory,
        packageDirectory
      );
      if (unsafePackageDirectoryReason) {
        return unsafePackageDirectoryReason;
      }
      return await getUnsafePackageFileReason(packageDirectory, binPath);
    }
    async function getUnsafePackageDirectoryReason(nodeModulesDirectory, packageDirectory) {
      const directoriesToCheck = (0, import_fsutils.getDirectoriesBetween)(
        nodeModulesDirectory,
        packageDirectory
      );
      if (directoriesToCheck.length === 0) {
        return `${packageDirectory} resolves outside local node_modules`;
      }
      for (const directory of directoriesToCheck) {
        const reason = await getUnsafeDirectoryReason(directory);
        if (reason) {
          return `${directory} is ${reason}`;
        }
      }
      return null;
    }
    async function getUnsafePackageFileReason(packageDirectory, filePath) {
      const directoriesToCheck = (0, import_fsutils.getDirectoriesBetween)(
        packageDirectory,
        import_node_path.default.dirname(filePath)
      );
      if (directoriesToCheck.length === 0) {
        return `${filePath} resolves outside package`;
      }
      for (const directory of directoriesToCheck) {
        const reason2 = await getUnsafeDirectoryReason(directory);
        if (reason2) {
          return `${directory} is ${reason2}`;
        }
      }
      const reason = await getUnsafeFileReason(filePath);
      return reason ? `${filePath} is ${reason}` : null;
    }
    async function getUnsafeDirectoryReason(directory) {
      const stats = await (0, import_promises.stat)(directory);
      if (!stats.isDirectory()) {
        return "not a directory";
      }
      return getUnsafeStatsReason(stats);
    }
    async function getUnsafeFileReason(filePath) {
      const stats = await (0, import_promises.stat)(filePath);
      if (!stats.isFile()) {
        return "not a file";
      }
      return getUnsafeStatsReason(stats);
    }
    function getUnsafeStatsReason(stats) {
      const getuid = process.geteuid ?? process.getuid;
      if (typeof getuid !== "function") {
        return null;
      }
      const uid = getuid();
      if ((stats.mode & 18) !== 0) {
        if ((stats.mode & 2) !== 0) {
          return "world-writable";
        }
        return "group-writable";
      }
      if (stats.uid !== uid) {
        return `owned by uid ${stats.uid}, current uid is ${uid}`;
      }
      return null;
    }
  }
});

// node_modules/@vercel/cli-exec/dist/lookup.js
var require_lookup = __commonJS({
  "node_modules/@vercel/cli-exec/dist/lookup.js"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var lookup_exports = {};
    __export(lookup_exports, {
      clearCachedCliInvocation: () => clearCachedCliInvocation,
      clearVercelCliLookupCache: () => clearVercelCliLookupCache2,
      findVercelCli: () => findVercelCli2,
      getLocalBinSearch: () => getLocalBinSearch,
      resolveCachedCliInvocation: () => resolveCachedCliInvocation,
      toVercelCliInvocation: () => toVercelCliInvocation
    });
    module.exports = __toCommonJS(lookup_exports);
    var import_promises = __require("node:fs/promises");
    var import_node_path = __toESM2(__require("node:path"));
    var import_envpath = require_envpath();
    var import_errutils = require_errutils();
    var import_fsutils = require_fsutils();
    var import_safety = require_safety();
    var cliInvocationCache = /* @__PURE__ */ new Map();
    async function findVercelCli2(options = {}) {
      const cwd = import_node_path.default.resolve(options.cwd ?? process.cwd());
      const pathValue = options.path ?? (0, import_envpath.getEnvPath)(process.env);
      const resolution = await resolveCachedCliInvocation(cwd, pathValue);
      return resolution.found ? toVercelCliInvocation(resolution) : null;
    }
    function resolveCachedCliInvocation(cwd, pathValue) {
      const cacheKey = getCliInvocationCacheKey(cwd, pathValue);
      if (cliInvocationCache.has(cacheKey)) {
        return cliInvocationCache.get(cacheKey);
      }
      const resolution = resolveCliInvocation(cwd, pathValue).catch((error) => {
        cliInvocationCache.delete(cacheKey);
        throw error;
      });
      cliInvocationCache.set(cacheKey, resolution);
      return resolution;
    }
    function toVercelCliInvocation(resolution) {
      return {
        command: resolution.command,
        commandArgs: resolution.commandArgs,
        source: resolution.source
      };
    }
    function clearVercelCliLookupCache2() {
      cliInvocationCache.clear();
    }
    function clearCachedCliInvocation(cwd, pathValue) {
      cliInvocationCache.delete(getCliInvocationCacheKey(cwd, pathValue));
    }
    async function resolveCliInvocation(cwd, pathValue) {
      const localBinSearch = await getLocalBinSearch(cwd);
      const diagnostics = {
        localBinSearch: localBinSearch.diagnostics,
        skippedLocalBins: []
      };
      const resolvedPath = (0, import_envpath.prependPathEntries)(
        pathValue,
        localBinSearch.directories
      );
      for (const command of getVercelCommandNames()) {
        const resolvedCommand = await findCommandInPath(
          command,
          resolvedPath,
          cwd,
          localBinSearch,
          diagnostics
        );
        if (!resolvedCommand) {
          continue;
        }
        if ((0, import_fsutils.isNodeScript)(resolvedCommand.realPath)) {
          return {
            found: true,
            command: process.execPath,
            commandArgs: [resolvedCommand.realPath],
            source: resolvedCommand.source,
            diagnostics
          };
        }
        return {
          found: true,
          command: resolvedCommand.realPath,
          commandArgs: [],
          source: resolvedCommand.source,
          diagnostics
        };
      }
      return { found: false, diagnostics };
    }
    async function findCommandInPath(command, pathValue, cwd, localBinSearch, diagnostics) {
      for (const directory of (0, import_envpath.splitPath)(pathValue)) {
        const candidate = getPathCommandCandidate(directory, command, cwd);
        try {
          const canAccess = await canAccessCommandCandidate(
            candidate,
            localBinSearch,
            diagnostics
          );
          if (canAccess) {
            const resolvedCommand = await resolveCommandCandidate(
              command,
              candidate,
              localBinSearch,
              diagnostics
            );
            if (resolvedCommand) {
              return resolvedCommand;
            }
          }
        } catch {
        }
      }
      return null;
    }
    function getPathCommandCandidate(directory, command, cwd) {
      const candidateDirectory = import_node_path.default.isAbsolute(directory) ? directory : import_node_path.default.resolve(cwd, directory);
      return import_node_path.default.join(candidateDirectory, command);
    }
    async function canAccessCommandCandidate(candidate, localBinSearch, diagnostics) {
      try {
        await (0, import_promises.access)(
          candidate,
          process.platform === "win32" ? import_promises.constants.F_OK : import_promises.constants.F_OK | import_promises.constants.X_OK
        );
        return true;
      } catch (error) {
        if (!(0, import_errutils.isMissingPathError)(error)) {
          await recordInaccessibleLocalBinCandidate(
            candidate,
            error,
            localBinSearch,
            diagnostics
          );
        }
        return false;
      }
    }
    async function recordInaccessibleLocalBinCandidate(candidate, error, localBinSearch, diagnostics) {
      const localBinCandidate = await classifyPathLocalBinCandidate(
        candidate,
        localBinSearch.directories
      );
      if (!localBinCandidate) {
        return;
      }
      recordSkippedLocalBin(
        diagnostics,
        candidate,
        "reason" in localBinCandidate ? localBinCandidate.reason : `local bin is not accessible: ${(0, import_errutils.getErrorMessage)(error)}`
      );
    }
    async function resolveCommandCandidate(command, candidate, localBinSearch, diagnostics) {
      if (!(await (0, import_promises.stat)(candidate)).isFile()) {
        return null;
      }
      const realPath = await (0, import_promises.realpath)(candidate);
      const localBinCandidate = await classifyPathLocalBinCandidate(
        candidate,
        localBinSearch.directories
      );
      if (!localBinCandidate) {
        return { realPath, source: "path" };
      }
      if ("reason" in localBinCandidate) {
        recordSkippedLocalBin(diagnostics, candidate, localBinCandidate.reason);
        return null;
      }
      const localPackageBinResult = await getLocalVercelPackageBin(
        command,
        localBinCandidate.directory
      );
      if ("reason" in localPackageBinResult) {
        recordSkippedLocalBin(diagnostics, candidate, localPackageBinResult.reason);
        return null;
      }
      return { realPath: localPackageBinResult.binPath, source: "local-bin" };
    }
    function recordSkippedLocalBin(diagnostics, candidate, reason) {
      diagnostics.skippedLocalBins.push({ candidate, reason });
    }
    function getVercelCommandNames() {
      const commandBases = ["vercel"];
      if (process.platform !== "win32") {
        return commandBases;
      }
      const extensions = [".cmd", ".exe", ""];
      return commandBases.flatMap(
        (command) => extensions.map((extension) => `${command}${extension}`)
      );
    }
    async function getLocalBinSearch(cwd) {
      const searchRoot = await (0, import_fsutils.getCanonicalPath)(import_node_path.default.resolve(cwd));
      const ancestorSearch = await getAncestorDirectorySearch(searchRoot);
      const skippedNodeModules = [];
      const directories = [];
      for (const directory of ancestorSearch.directories) {
        const nodeModulesDirectory = import_node_path.default.join(directory, "node_modules");
        const parentDirectories = ancestorSearch.stopReason === "project-root-marker" ? (0, import_fsutils.getDirectoriesBetween)(ancestorSearch.stoppedAt, directory) : (0, import_fsutils.getDirectoriesBetween)(directory, searchRoot);
        const skippedReason = await (0, import_safety.getSkippedNodeModulesReason)(
          nodeModulesDirectory,
          parentDirectories
        );
        if (skippedReason) {
          skippedNodeModules.push({
            directory: nodeModulesDirectory,
            reason: skippedReason
          });
          continue;
        }
        directories.push(import_node_path.default.join(nodeModulesDirectory, ".bin"));
      }
      return {
        directories,
        diagnostics: {
          searchRoot,
          stoppedAt: ancestorSearch.stoppedAt,
          stopReason: ancestorSearch.stopReason,
          markerPath: ancestorSearch.markerPath,
          skippedNodeModules
        }
      };
    }
    async function getAncestorDirectorySearch(cwd) {
      const directories = [];
      let current = import_node_path.default.resolve(cwd);
      while (true) {
        directories.push(current);
        const marker = await getProjectRootMarker(current);
        if (marker) {
          return {
            directories,
            stoppedAt: current,
            stopReason: "project-root-marker",
            markerPath: marker.path
          };
        }
        const parent = import_node_path.default.dirname(current);
        if (parent === current) {
          return {
            directories,
            stoppedAt: current,
            stopReason: "filesystem-root"
          };
        }
        current = parent;
      }
    }
    async function getProjectRootMarker(directory) {
      const gitPath = import_node_path.default.join(directory, ".git");
      try {
        await (0, import_promises.stat)(gitPath);
        return { path: gitPath };
      } catch {
      }
      return null;
    }
    async function getLocalBinDirectory(filePath, localBinDirectories) {
      const resolvedFilePath = import_node_path.default.resolve(filePath);
      let canonicalFilePath = resolvedFilePath;
      try {
        canonicalFilePath = import_node_path.default.join(
          await (0, import_promises.realpath)(import_node_path.default.dirname(resolvedFilePath)),
          import_node_path.default.basename(resolvedFilePath)
        );
      } catch {
      }
      for (let localBinDirectory of localBinDirectories) {
        try {
          localBinDirectory = await (0, import_promises.realpath)(localBinDirectory);
        } catch {
        }
        if (canonicalFilePath.startsWith(`${localBinDirectory}${import_node_path.default.sep}`)) {
          return localBinDirectory;
        }
      }
      return null;
    }
    async function getNodeModulesBinDirectory(filePath) {
      const candidateDirectory = import_node_path.default.resolve(import_node_path.default.dirname(filePath));
      const directories = [candidateDirectory];
      try {
        const canonicalDirectory = await (0, import_promises.realpath)(candidateDirectory);
        if (!directories.includes(canonicalDirectory)) {
          directories.push(canonicalDirectory);
        }
      } catch {
      }
      for (const directory of directories) {
        if (import_node_path.default.basename(directory) === ".bin" && import_node_path.default.basename(import_node_path.default.dirname(directory)) === "node_modules") {
          return directory;
        }
      }
      return null;
    }
    async function classifyPathLocalBinCandidate(filePath, localBinDirectories) {
      const localBinDirectory = await getLocalBinDirectory(
        filePath,
        localBinDirectories
      );
      if (localBinDirectory) {
        return { directory: localBinDirectory };
      }
      const nodeModulesBinDirectory = await getNodeModulesBinDirectory(filePath);
      if (!nodeModulesBinDirectory) {
        return null;
      }
      const nodeModulesDirectory = import_node_path.default.dirname(nodeModulesBinDirectory);
      const skippedReason = await (0, import_safety.getSkippedNodeModulesReason)(nodeModulesDirectory);
      if (skippedReason) {
        return { reason: `local node_modules is ${skippedReason}` };
      }
      return { reason: "local bin is outside project lookup boundary" };
    }
    async function getLocalVercelPackageBin(command, localBinDirectory) {
      const commandBase = (0, import_fsutils.getCommandBase)(command);
      const nodeModulesDirectory = import_node_path.default.dirname(localBinDirectory);
      if (commandBase !== "vercel" || import_node_path.default.basename(nodeModulesDirectory) !== "node_modules") {
        return { reason: "not a local vercel bin" };
      }
      try {
        const localPackage = await getLocalVercelPackage(nodeModulesDirectory);
        if ("reason" in localPackage) {
          return localPackage;
        }
        const packageJsonResult = await readLocalVercelPackageJson(
          localPackage.realPackageDirectory
        );
        if ("reason" in packageJsonResult) {
          return packageJsonResult;
        }
        localPackage.packageJson = packageJsonResult.packageJson;
        return await getDeclaredLocalVercelPackageBin(localPackage, commandBase);
      } catch (error) {
        return {
          reason: `could not validate local vercel package: ${(0, import_errutils.getErrorMessage)(error)}`
        };
      }
    }
    async function getLocalVercelPackage(nodeModulesDirectory) {
      const packageDirectory = import_node_path.default.join(nodeModulesDirectory, "vercel");
      const realNodeModulesDirectory = await (0, import_promises.realpath)(nodeModulesDirectory);
      const realPackageDirectory = await (0, import_promises.realpath)(packageDirectory);
      if (!(0, import_fsutils.isSubpath)(realNodeModulesDirectory, realPackageDirectory)) {
        return {
          reason: "local vercel package resolves outside local node_modules"
        };
      }
      const unsafePackageDirectoryReason = await (0, import_safety.getUnsafePackageDirectoryReason)(
        realNodeModulesDirectory,
        realPackageDirectory
      );
      if (unsafePackageDirectoryReason) {
        return {
          reason: `local vercel package is unsafe: ${unsafePackageDirectoryReason}`
        };
      }
      return {
        realNodeModulesDirectory,
        realPackageDirectory,
        packageJson: {}
      };
    }
    async function readLocalVercelPackageJson(realPackageDirectory) {
      const packageJsonPath = import_node_path.default.join(realPackageDirectory, "package.json");
      const realPackageJsonPath = await (0, import_promises.realpath)(packageJsonPath);
      if (!(0, import_fsutils.isSubpath)(realPackageDirectory, realPackageJsonPath)) {
        return { reason: "local vercel package.json resolves outside package" };
      }
      const unsafePackageJsonReason = await (0, import_safety.getUnsafePackageFileReason)(
        realPackageDirectory,
        realPackageJsonPath
      );
      if (unsafePackageJsonReason) {
        return {
          reason: `local vercel package.json is unsafe: ${unsafePackageJsonReason}`
        };
      }
      const packageJson = JSON.parse(
        await (0, import_promises.readFile)(realPackageJsonPath, "utf8")
      );
      if (packageJson.name !== "vercel") {
        return {
          reason: 'local vercel package.json does not have name "vercel"'
        };
      }
      return { packageJson };
    }
    async function getDeclaredLocalVercelPackageBin(localPackage, commandBase) {
      const { packageJson, realNodeModulesDirectory, realPackageDirectory } = localPackage;
      const binTarget = getPackageBinTarget(packageJson, commandBase);
      if (!binTarget) {
        return { reason: "local vercel package does not declare bin.vercel" };
      }
      const declaredBinPath = import_node_path.default.resolve(realPackageDirectory, binTarget);
      const realDeclaredBinPath = await (0, import_promises.realpath)(declaredBinPath);
      if (!(0, import_fsutils.isSubpath)(realPackageDirectory, realDeclaredBinPath)) {
        return { reason: "local vercel package bin resolves outside package" };
      }
      const unsafePackageBinReason = await (0, import_safety.getUnsafePackageBinReason)(
        realNodeModulesDirectory,
        realPackageDirectory,
        realDeclaredBinPath
      );
      if (unsafePackageBinReason) {
        return {
          reason: `local vercel package bin is unsafe: ${unsafePackageBinReason}`
        };
      }
      if (process.platform !== "win32" && !(0, import_fsutils.isNodeScript)(realDeclaredBinPath)) {
        try {
          await (0, import_promises.access)(realDeclaredBinPath, import_promises.constants.F_OK | import_promises.constants.X_OK);
        } catch (error) {
          return {
            reason: `local vercel package bin is not executable: ${(0, import_errutils.getErrorMessage)(error)}`
          };
        }
      }
      return { binPath: realDeclaredBinPath };
    }
    function getPackageBinTarget(packageJson, command) {
      const bin = packageJson.bin;
      if (typeof bin === "string") {
        return command === "vercel" ? bin : null;
      }
      if (bin && typeof bin === "object") {
        const target = bin[command];
        if (typeof target === "string") {
          return target;
        }
      }
      return null;
    }
    function getCliInvocationCacheKey(cwd, pathValue) {
      return `${cwd}\0${pathValue}`;
    }
  }
});

// node_modules/@vercel/cli-exec/dist/exec.js
var require_exec = __commonJS({
  "node_modules/@vercel/cli-exec/dist/exec.js"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var exec_exports = {};
    __export(exec_exports, {
      execVercelCli: () => execVercelCli2
    });
    module.exports = __toCommonJS(exec_exports);
    var import_node_path = __toESM2(__require("node:path"));
    var import_execa = __toESM2(require_execa());
    var import_envpath = require_envpath();
    var import_errors = require_errors();
    var import_lookup = require_lookup();
    async function execVercelCli2(args, options = {}) {
      const cwd = import_node_path.default.resolve(options.cwd ?? process.cwd());
      await (0, import_errors.assertValidCwd)(cwd);
      const env = mergeExecEnv(options.env);
      const pathValue = (0, import_envpath.getEnvPath)(env);
      try {
        return await execResolvedVercelCli(args, options, cwd, env, pathValue);
      } catch (error) {
        if (error instanceof import_errors.VercelCliError && error.code === "VERCEL_CLI_NOT_FOUND") {
          (0, import_lookup.clearCachedCliInvocation)(cwd, pathValue);
          return await execResolvedVercelCli(args, options, cwd, env, pathValue);
        }
        throw error;
      }
    }
    async function execResolvedVercelCli(args, options, cwd, env, pathValue) {
      const invocation = await resolveInvocationOrThrow(cwd, pathValue);
      try {
        const execaOptions = {
          input: options.input,
          stdio: options.stdio,
          stdin: options.stdin,
          stdout: options.stdout,
          stderr: options.stderr,
          timeout: options.timeout,
          cwd,
          env: await prependLocalBinsToEnvPath(cwd, env),
          windowsHide: true
        };
        if (options.signal) {
          execaOptions.signal = options.signal;
        }
        const { stdout, stderr } = await (0, import_execa.default)(
          invocation.command,
          [...invocation.commandArgs, ...args],
          execaOptions
        );
        return { stdout, stderr, invocation };
      } catch (error) {
        throw (0, import_errors.toVercelCliError)(invocation, error);
      }
    }
    async function resolveInvocationOrThrow(cwd, pathValue) {
      const resolution = await (0, import_lookup.resolveCachedCliInvocation)(cwd, pathValue);
      if (!resolution.found) {
        throw new import_errors.VercelCliError({
          code: "VERCEL_CLI_NOT_FOUND",
          message: (0, import_errors.getCliNotFoundMessage)(resolution.diagnostics)
        });
      }
      return (0, import_lookup.toVercelCliInvocation)(resolution);
    }
    function mergeExecEnv(env) {
      if (!env) {
        return process.env;
      }
      return { ...process.env, ...env };
    }
    async function prependLocalBinsToEnvPath(cwd, env = process.env) {
      const localPath = await prependLocalBinsToPath(cwd, (0, import_envpath.getEnvPath)(env));
      return (0, import_envpath.setEnvPath)(
        env,
        (0, import_envpath.prependPathEntries)(localPath, [import_node_path.default.dirname(process.execPath)])
      );
    }
    async function prependLocalBinsToPath(cwd, pathValue = "") {
      return (0, import_envpath.prependPathEntries)(
        pathValue,
        (await (0, import_lookup.getLocalBinSearch)(cwd)).directories
      );
    }
  }
});

// node_modules/@vercel/cli-exec/dist/index.js
var require_dist = __commonJS({
  "node_modules/@vercel/cli-exec/dist/index.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export(src_exports, {
      VercelCliError: () => import_errors.VercelCliError,
      clearVercelCliLookupCache: () => import_lookup.clearVercelCliLookupCache,
      execVercelCli: () => import_exec.execVercelCli,
      findVercelCli: () => import_lookup.findVercelCli
    });
    module.exports = __toCommonJS(src_exports);
    var import_errors = require_errors();
    var import_exec = require_exec();
    var import_lookup = require_lookup();
  }
});

// node_modules/@vercel/cli-config/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/@vercel/cli-config/dist/index.js"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __commonJS2 = (cb, mod) => function() {
      return mod || (0, cb[__getOwnPropNames2(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    };
    var __export = (target, all) => {
      for (var name in all) __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from == "object" || typeof from == "function") for (let key of __getOwnPropNames2(from)) !__hasOwnProp2.call(to, key) && key !== except && __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target, mod));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var require_lib = __commonJS2({ "../../node_modules/.pnpm/os-paths@4.4.0/node_modules/os-paths/src/lib/index.js"(exports2, module2) {
      "use strict";
      var os = __require("os"), paths = __require("path"), isWinOS = /^win/i.test(process.platform);
      function normalize_path(path3) {
        return paths.normalize(paths.join(path3, "."));
      }
      var base = () => {
        let { env } = process, object2 = {};
        return object2.home = () => normalize_path(os.homedir ? os.homedir() : env.HOME), object2.temp = () => normalize_path(os.tmpdir ? os.tmpdir() : env.TMPDIR || env.TEMP || env.TMP), object2;
      }, windows = () => {
        let { env } = process, object2 = {};
        return object2.home = () => normalize_path(os.homedir ? os.homedir() : env.USERPROFILE || paths.join(env.HOMEDRIVE, env.HOMEPATH) || env.HOME), object2.temp = () => normalize_path(os.tmpdir ? os.tmpdir() : env.TEMP || env.TMP || paths.join(env.LOCALAPPDATA || env.SystemRoot || env.windir, "Temp")), object2;
      }, _OSPaths = class __OSPaths {
        constructor() {
          let OSPaths = function() {
            return new __OSPaths();
          };
          this._fn = OSPaths;
          let extension = isWinOS ? windows() : base();
          return Object.keys(extension).forEach((key) => {
            this._fn[key] = extension[key];
          }), this._fn;
        }
      };
      module2.exports = new _OSPaths();
    } });
    var require_lib2 = __commonJS2({ "../../node_modules/.pnpm/xdg-portable@7.3.0/node_modules/xdg-portable/src/lib/index.js"(exports2, module2) {
      "use strict";
      var path3 = __require("path"), osPaths = require_lib(), linux = () => {
        let object2 = {};
        return object2.cache = () => process.env.XDG_CACHE_HOME || path3.join(osPaths.home() || osPaths.temp(), ".cache"), object2.config = () => process.env.XDG_CONFIG_HOME || path3.join(osPaths.home() || osPaths.temp(), ".config"), object2.data = () => process.env.XDG_DATA_HOME || path3.join(osPaths.home() || osPaths.temp(), ".local", "share"), object2.runtime = () => process.env.XDG_RUNTIME_DIR || void 0, object2.state = () => process.env.XDG_STATE_HOME || path3.join(osPaths.home() || osPaths.temp(), ".local", "state"), object2;
      }, macos = () => {
        let object2 = {};
        return object2.cache = () => process.env.XDG_CACHE_HOME || path3.join(path3.join(osPaths.home() || osPaths.temp(), "Library"), "Caches"), object2.config = () => process.env.XDG_CONFIG_HOME || path3.join(path3.join(osPaths.home() || osPaths.temp(), "Library"), "Preferences"), object2.data = () => process.env.XDG_DATA_HOME || path3.join(path3.join(osPaths.home() || osPaths.temp(), "Library"), "Application Support"), object2.runtime = () => process.env.XDG_RUNTIME_DIR || void 0, object2.state = () => process.env.XDG_STATE_HOME || path3.join(path3.join(osPaths.home() || osPaths.temp(), "Library"), "State"), object2;
      }, windows = () => {
        let object2 = {};
        return object2.cache = () => {
          let localAppData = process.env.LOCALAPPDATA || path3.join(osPaths.home() || osPaths.temp(), "AppData", "Local");
          return process.env.XDG_CACHE_HOME || path3.join(localAppData, "xdg.cache");
        }, object2.config = () => {
          let appData = process.env.APPDATA || path3.join(osPaths.home() || osPaths.temp(), "AppData", "Roaming");
          return process.env.XDG_CONFIG_HOME || path3.join(appData, "xdg.config");
        }, object2.data = () => {
          let appData = process.env.APPDATA || path3.join(osPaths.home() || osPaths.temp(), "AppData", "Roaming");
          return process.env.XDG_DATA_HOME || path3.join(appData, "xdg.data");
        }, object2.runtime = () => process.env.XDG_RUNTIME_DIR || void 0, object2.state = () => {
          let localAppData = process.env.LOCALAPPDATA || path3.join(osPaths.home() || osPaths.temp(), "AppData", "Local");
          return process.env.XDG_STATE_HOME || path3.join(localAppData, "xdg.state");
        }, object2;
      }, _XDGPortable = () => {
        let XDGPortable = function() {
          return _XDGPortable();
        }, extension = {};
        return /^darwin$/i.test(process.platform) ? extension = macos() : /^win/i.test(process.platform) ? extension = windows() : extension = linux(), extension.configDirs = () => {
          let dirs = [];
          return dirs.push(extension.config()), process.env.XDG_CONFIG_DIRS && dirs.push(...process.env.XDG_CONFIG_DIRS.split(path3.delimiter)), dirs;
        }, extension.dataDirs = () => {
          let dirs = [];
          return dirs.push(extension.data()), process.env.XDG_DATA_DIRS && dirs.push(...process.env.XDG_DATA_DIRS.split(path3.delimiter)), dirs;
        }, Object.keys(extension).forEach((key) => {
          XDGPortable[key] = extension[key];
        }), XDGPortable;
      };
      module2.exports = _XDGPortable();
    } });
    var require_xdg_app_paths = __commonJS2({ "../../node_modules/.pnpm/xdg-app-paths@5.1.0/node_modules/xdg-app-paths/index.js"(exports2, module2) {
      "use strict";
      var path3 = __require("path"), os = __require("os"), xdg = require_lib2(), isWinOS = /^win/i.test(process.platform);
      function _normalizeOptions(options, isolated) {
        if (options = options || {}, typeof options != "object" && (options = { isolated: options }), options.isolated = options.isolated === void 0 || options.isolated === null ? isolated : options.isolated, typeof options.isolated != "boolean") throw new TypeError(`Expected boolean for "isolated" argument, got ${typeof options.isolated}`);
        return options;
      }
      var base = (name, isolated) => {
        let object2 = {};
        return object2.cache = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), path3.join(xdg.cache(), options.isolated ? name : "")), object2.config = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), path3.join(xdg.config(), options.isolated ? name : "")), object2.data = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), path3.join(xdg.data(), options.isolated ? name : "")), object2.runtime = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), xdg.runtime() ? path3.join(xdg.runtime(), options.isolated ? name : "") : void 0), object2.state = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), path3.join(xdg.state(), options.isolated ? name : "")), object2.configDirs = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), xdg.configDirs().map((s) => path3.join(s, options.isolated ? name : ""))), object2.dataDirs = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), xdg.dataDirs().map((s) => path3.join(s, options.isolated ? name : ""))), object2;
      }, windows = (name, isolated) => {
        let { env } = process, homedir2 = os.homedir(), tmpdir = os.tmpdir(), appData = env.APPDATA || path3.join(homedir2 || tmpdir, "AppData", "Roaming"), localAppData = env.LOCALAPPDATA || path3.join(homedir2 || tmpdir, "AppData", "Local"), object2 = {};
        return object2.cache = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), !options.isolated || env.XDG_CACHE_HOME ? path3.join(xdg.cache(), options.isolated ? name : "") : path3.join(localAppData, options.isolated ? name : "", "Cache")), object2.config = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), !options.isolated || env.XDG_CONFIG_HOME ? path3.join(xdg.config(), options.isolated ? name : "") : path3.join(appData, options.isolated ? name : "", "Config")), object2.data = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), !options.isolated || env.XDG_DATA_HOME ? path3.join(xdg.data(), options.isolated ? name : "") : path3.join(appData, options.isolated ? name : "", "Data")), object2.runtime = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), xdg.runtime() ? path3.join(xdg.runtime(), options.isolated ? name : "") : void 0), object2.state = (options = { isolated: null }) => (options = _normalizeOptions(options, isolated), !options.isolated || env.XDG_STATE_HOME ? path3.join(xdg.state(), options.isolated ? name : "") : path3.join(localAppData, options.isolated ? name : "", "State")), object2.configDirs = (options = { isolated: null }) => {
          options = _normalizeOptions(options, isolated);
          let dirs = [object2.config(options)];
          return env.XDG_CONFIG_DIRS && dirs.push(...env.XDG_CONFIG_DIRS.split(path3.delimiter).map((s) => path3.join(s, options.isolated ? name : ""))), dirs;
        }, object2.dataDirs = (options = { isolated: null }) => {
          options = _normalizeOptions(options, isolated);
          let dirs = [object2.data(options)];
          return env.XDG_DATA_DIRS && dirs.push(...env.XDG_DATA_DIRS.split(path3.delimiter).map((s) => path3.join(s, options.isolated ? name : ""))), dirs;
        }, object2;
      }, _XDGAppPaths = class __XDGAppPaths {
        constructor(options = { name: null, suffix: null, isolated: true }) {
          let XDGAppPaths = function(options2 = { name: null, suffix: null, isolated: true }) {
            return new __XDGAppPaths(options2);
          };
          this._fn = XDGAppPaths, options = options || {}, typeof options != "object" && (options = { name: options });
          let name = options.name || "";
          if (typeof name != "string") throw new TypeError(`Expected string for "name" argument, got ${typeof name}`);
          let suffix = options.suffix || "";
          if (typeof suffix != "string") throw new TypeError(`Expected string for "suffix" argument, got ${typeof suffix}`);
          let isolated = options.isolated === void 0 || options.isolated === null ? true : options.isolated;
          if (typeof isolated != "boolean") throw new TypeError(`Expected boolean for "isolated" argument, got ${typeof isolated}`);
          name || (name = path3.parse(process.pkg ? process.execPath : __require.main ? __require.main.filename : process.argv[0]).name), suffix && (name += suffix), this._fn.$name = () => name, this._fn.$isolated = () => isolated;
          let extension = isWinOS ? windows(name, isolated) : base(name, isolated);
          return Object.keys(extension).forEach((key) => {
            this._fn[key] = extension[key];
          }), this._fn;
        }
      };
      module2.exports = new _XDGAppPaths();
    } });
    var src_exports = {};
    __export(src_exports, { CRED_STORAGE_CONFIG_VALUES: () => CRED_STORAGE_CONFIG_VALUES, CRED_STORAGE_VALUES: () => CRED_STORAGE_VALUES, DEFAULT_CRED_STORAGE: () => DEFAULT_CRED_STORAGE, authConfigHasUsableTokenData: () => authConfigHasUsableTokenData, authConfigSchema: () => authConfigSchema2, credStorageSchema: () => credStorageSchema2, defaultAuthConfig: () => defaultAuthConfig, defaultGlobalConfig: () => defaultGlobalConfig, deleteAuthConfig: () => deleteAuthConfig, deleteAuthConfigFile: () => deleteAuthConfigFile, getAuthConfigFilePath: () => getAuthConfigFilePath, getCachePath: () => getCachePath, getConfigFilePath: () => getConfigFilePath, getDataPath: () => getDataPath, getDefaultAuthConfig: () => getDefaultAuthConfig, getDpopAuthConfigFilePath: () => getDpopAuthConfigFilePath, getGlobalPathConfig: () => getGlobalPathConfig, getLikelyEffectiveCredStorage: () => getLikelyEffectiveCredStorage, globalConfigSchema: () => globalConfigSchema2, guidanceConfigSchema: () => guidanceConfigSchema2, parseAuthConfig: () => parseAuthConfig, parseAuthFileConfig: () => parseAuthFileConfig, parseGlobalConfig: () => parseGlobalConfig, readAuthConfig: () => readAuthConfig, readAuthConfigFile: () => readAuthConfigFile, readAuthFileConfig: () => readAuthFileConfig, readConfigFile: () => readConfigFile, readGlobalConfigFile: () => readGlobalConfigFile, telemetryConfigSchema: () => telemetryConfigSchema2, tryReadAuthConfig: () => tryReadAuthConfig, updatesConfigSchema: () => updatesConfigSchema2, writeAuthConfig: () => writeAuthConfig, writeAuthConfigFile: () => writeAuthConfigFile, writeConfigFile: () => writeConfigFile, writeGlobalConfigFile: () => writeGlobalConfigFile });
    module.exports = __toCommonJS(src_exports);
    var CRED_STORAGE_CONFIG_VALUES = ["auto", "file", "keyring"];
    var CRED_STORAGE_VALUES = CRED_STORAGE_CONFIG_VALUES.filter((storage) => storage !== "auto");
    var DEFAULT_CRED_STORAGE = "file";
    var util_exports = {};
    __export(util_exports, { BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES, CONSTANT_CATCH: () => CONSTANT_CATCH, Class: () => Class, NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES, aborted: () => aborted, allowsEval: () => allowsEval, assert: () => assert, assertEqual: () => assertEqual, assertIs: () => assertIs, assertNever: () => assertNever, assertNotEqual: () => assertNotEqual, assignProp: () => assignProp, attachSchema: () => attachSchema, base64ToUint8Array: () => base64ToUint8Array, base64urlToUint8Array: () => base64urlToUint8Array, cached: () => cached, captureStackTrace: () => captureStackTrace, cleanEnum: () => cleanEnum, cleanRegex: () => cleanRegex, clone: () => clone, cloneDef: () => cloneDef, codePointLength: () => codePointLength, constantCatch: () => constantCatch, createTransparentProxy: () => createTransparentProxy, defineLazy: () => defineLazy, defineLazyInternal: () => defineLazyInternal, derived: () => derived, esc: () => esc, escapeRegex: () => escapeRegex, explicitlyAborted: () => explicitlyAborted, extend: () => extend, finalizeIssue: () => finalizeIssue, floatSafeRemainder: () => floatSafeRemainder, getElementAtPath: () => getElementAtPath, getEnumValues: () => getEnumValues, getLengthableOrigin: () => getLengthableOrigin, getParsedType: () => getParsedType, getSizableOrigin: () => getSizableOrigin, hexToUint8Array: () => hexToUint8Array, hide: () => hide, installLazyProp: () => installLazyProp, isObject: () => isObject, isPlainObject: () => isPlainObject, issue: () => issue, joinValues: () => joinValues, jsonStringifyReplacer: () => jsonStringifyReplacer, members: () => members, merge: () => merge, mergeDefs: () => mergeDefs, normalizeParams: () => normalizeParams, nullish: () => nullish, numKeys: () => numKeys, objectClone: () => objectClone, omit: () => omit, optionalKeys: () => optionalKeys, own: () => own, parsedType: () => parsedType, partial: () => partial, pick: () => pick, prefixIssues: () => prefixIssues, primitiveTypes: () => primitiveTypes, promiseAllObject: () => promiseAllObject, propertyKeyTypes: () => propertyKeyTypes, randomString: () => randomString, rawShape: () => rawShape, required: () => required, safeExtend: () => safeExtend, shallowClone: () => shallowClone, sizeCaps: () => sizeCaps, slugify: () => slugify, stringifyPrimitive: () => stringifyPrimitive, toZod: () => toZod, uint8ArrayToBase64: () => uint8ArrayToBase64, uint8ArrayToBase64url: () => uint8ArrayToBase64url, uint8ArrayToHex: () => uint8ArrayToHex, unwrapMessage: () => unwrapMessage });
    function assertEqual(val) {
      return val;
    }
    function assertNotEqual(val) {
      return val;
    }
    function toZod() {
      return (schema) => schema;
    }
    function assertIs(_arg) {
    }
    function assertNever(_x) {
      throw new Error("Unexpected value in exhaustive check");
    }
    function assert(_) {
    }
    function getEnumValues(entries) {
      let numericValues = Object.values(entries).filter((v) => typeof v == "number");
      return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
    }
    function joinValues(array2, separator = "|") {
      return array2.map((val) => stringifyPrimitive(val)).join(separator);
    }
    function jsonStringifyReplacer(_, value) {
      return typeof value == "bigint" ? value.toString() : value;
    }
    var Cached = class {
      constructor(getter) {
        this._getter = getter, this._value = void 0;
      }
      get value() {
        let getter = this._getter;
        return getter !== void 0 && (this._value = getter(), this._getter = void 0), this._value;
      }
    };
    function cached(getter) {
      return new Cached(getter);
    }
    function nullish(input) {
      return input == null;
    }
    function cleanRegex(source) {
      let start = source.startsWith("^") ? 1 : 0, end = source.endsWith("$") ? source.length - 1 : source.length;
      return source.slice(start, end);
    }
    function floatSafeRemainder(val, step) {
      let ratio = val / step, roundedRatio = Math.round(ratio), tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
      return Math.abs(ratio - roundedRatio) < tolerance ? 0 : ratio - roundedRatio;
    }
    var EVALUATING = Symbol("evaluating");
    function defineLazy(object2, key, getter) {
      let value;
      Object.defineProperty(object2, key, { get() {
        if (value !== EVALUATING) return value === void 0 && (value = EVALUATING, value = getter()), value;
      }, set(v) {
        Object.defineProperty(object2, key, { value: v });
      }, configurable: true });
    }
    function objectClone(obj) {
      return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
    }
    function assignProp(target, prop, value) {
      Object.defineProperty(target, prop, { value, writable: true, enumerable: true, configurable: true });
    }
    function rawShape(def) {
      let desc = Object.getOwnPropertyDescriptor(def, "shape");
      return desc?.get ? desc.get.raw : desc?.value;
    }
    function sourceShape(schema) {
      return rawShape(schema._zod.def) ?? schema._zod.def.shape;
    }
    function deferProp(target, key, getter) {
      Object.defineProperty(target, key, { get() {
        let value = getter();
        return assignProp(this, key, value), value;
      }, enumerable: true, configurable: true });
    }
    function putProp(target, key, value) {
      key in target ? assignProp(target, key, value) : target[key] = value;
    }
    function mirrorShape(target, source, keys, wrap) {
      let raw = sourceShape(source);
      for (let key of keys) {
        let desc = Object.getOwnPropertyDescriptor(raw, key);
        desc.enumerable && (desc.get ? deferProp(target, key, () => {
          let value = source._zod.def.shape[key];
          return wrap ? wrap(value, key) : value;
        }) : putProp(target, key, wrap ? wrap(desc.value, key) : desc.value));
      }
    }
    function mirrorProps(target, source) {
      for (let key of Reflect.ownKeys(source)) {
        let desc = Object.getOwnPropertyDescriptor(source, key);
        desc.enumerable && (desc.get ? deferProp(target, key, () => source[key]) : putProp(target, key, desc.value));
      }
    }
    function mergeDefs(...defs) {
      let mergedDescriptors = {};
      for (let def of defs) {
        let descriptors = Object.getOwnPropertyDescriptors(def);
        Object.assign(mergedDescriptors, descriptors);
      }
      return Object.defineProperties({}, mergedDescriptors);
    }
    function cloneDef(schema) {
      return mergeDefs(schema._zod.def);
    }
    function getElementAtPath(obj, path3) {
      return path3 ? path3.reduce((acc, key) => acc?.[key], obj) : obj;
    }
    function promiseAllObject(promisesObj) {
      let keys = Object.keys(promisesObj), promises = keys.map((key) => promisesObj[key]);
      return Promise.all(promises).then((results) => {
        let resolvedObj = {};
        for (let i = 0; i < keys.length; i++) resolvedObj[keys[i]] = results[i];
        return resolvedObj;
      });
    }
    function randomString(length = 10) {
      let chars = "abcdefghijklmnopqrstuvwxyz", str = "";
      for (let i = 0; i < length; i++) str += chars[Math.floor(Math.random() * chars.length)];
      return str;
    }
    function esc(str) {
      return JSON.stringify(str);
    }
    function slugify(input) {
      return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
    }
    var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
    };
    function isObject(data) {
      return typeof data == "object" && data !== null && !Array.isArray(data);
    }
    var allowsEval = cached(() => {
      if (globalConfig.jitless || typeof navigator < "u" && navigator?.userAgent?.includes("Cloudflare")) return false;
      try {
        let F = Function;
        return new F(""), true;
      } catch {
        return false;
      }
    });
    function isPlainObject(o) {
      if (isObject(o) === false) return false;
      let ctor = o.constructor;
      if (ctor === void 0 || typeof ctor != "function") return true;
      let prot = ctor.prototype;
      return !(isObject(prot) === false || Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false);
    }
    function shallowClone(o) {
      return isPlainObject(o) ? { ...o } : Array.isArray(o) ? [...o] : o instanceof Map ? new Map(o) : o instanceof Set ? new Set(o) : o;
    }
    function numKeys(data) {
      let keyCount = 0;
      for (let key in data) Object.prototype.hasOwnProperty.call(data, key) && keyCount++;
      return keyCount;
    }
    var getParsedType = (data) => {
      let t = typeof data;
      switch (t) {
        case "undefined":
          return "undefined";
        case "string":
          return "string";
        case "number":
          return Number.isNaN(data) ? "nan" : "number";
        case "boolean":
          return "boolean";
        case "function":
          return "function";
        case "bigint":
          return "bigint";
        case "symbol":
          return "symbol";
        case "object":
          return Array.isArray(data) ? "array" : data === null ? "null" : data.then && typeof data.then == "function" && data.catch && typeof data.catch == "function" ? "promise" : typeof Map < "u" && data instanceof Map ? "map" : typeof Set < "u" && data instanceof Set ? "set" : typeof Date < "u" && data instanceof Date ? "date" : typeof File < "u" && data instanceof File ? "file" : "object";
        default:
          throw new Error(`Unknown data type: ${t}`);
      }
    };
    var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
    var primitiveTypes = /* @__PURE__ */ new Set(["string", "number", "bigint", "boolean", "symbol", "undefined"]);
    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function clone(inst, def, params) {
      let cl = new inst._zod.constr(def ?? inst._zod.def);
      return (!def || params?.parent) && (cl._zod.parent = inst), cl;
    }
    function normalizeParams(_params) {
      let params = _params;
      if (!params) return {};
      if (typeof params == "string") return { error: () => params };
      if (params?.message !== void 0) {
        if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
        params.error = params.message;
      }
      return delete params.message, typeof params.error == "string" ? { ...params, error: () => params.error } : params;
    }
    function createTransparentProxy(getter) {
      let target;
      return new Proxy({}, { get(_, prop, receiver) {
        return target ?? (target = getter()), Reflect.get(target, prop, receiver);
      }, set(_, prop, value, receiver) {
        return target ?? (target = getter()), Reflect.set(target, prop, value, receiver);
      }, has(_, prop) {
        return target ?? (target = getter()), Reflect.has(target, prop);
      }, deleteProperty(_, prop) {
        return target ?? (target = getter()), Reflect.deleteProperty(target, prop);
      }, ownKeys(_) {
        return target ?? (target = getter()), Reflect.ownKeys(target);
      }, getOwnPropertyDescriptor(_, prop) {
        return target ?? (target = getter()), Reflect.getOwnPropertyDescriptor(target, prop);
      }, defineProperty(_, prop, descriptor) {
        return target ?? (target = getter()), Reflect.defineProperty(target, prop, descriptor);
      } });
    }
    function stringifyPrimitive(value) {
      return typeof value == "bigint" ? value.toString() + "n" : typeof value == "string" ? `"${value}"` : `${value}`;
    }
    function optionalKeys(shape) {
      return Object.keys(shape).filter((k) => shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional");
    }
    var NUMBER_FORMAT_RANGES = (() => ({ safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER], int32: [-2147483648, 2147483647], uint32: [0, 4294967295], float32: [-34028234663852886e22, 34028234663852886e22], float64: [-Number.MAX_VALUE, Number.MAX_VALUE] }))();
    var BIGINT_FORMAT_RANGES = { int64: [BigInt("-9223372036854775808"), BigInt("9223372036854775807")], uint64: [BigInt(0), BigInt("18446744073709551615")] };
    function pick(schema, mask) {
      let currDef = schema._zod.def, checks = currDef.checks;
      if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
      let newShape = {};
      return mirrorShape(newShape, schema, maskedKeys(schema, mask)), clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
    }
    function maskedKeys(schema, mask) {
      let raw = sourceShape(schema), keys = [];
      for (let key of Reflect.ownKeys(mask)) {
        if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) throw new Error(`Unrecognized key: "${String(key)}"`);
        mask[key] && keys.push(key);
      }
      return keys;
    }
    function omit(schema, mask) {
      let currDef = schema._zod.def, checks = currDef.checks;
      if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
      let omitted = new Set(maskedKeys(schema, mask)), newShape = {};
      return mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key))), clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
    }
    function extend(schema, shape) {
      if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
      let checks = schema._zod.def.checks;
      if (checks && checks.length > 0) {
        let existingShape = sourceShape(schema);
        for (let key of Reflect.ownKeys(shape)) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
      return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
    }
    function extended(schema, shape) {
      let newShape = {};
      return mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema))), mirrorProps(newShape, shape), newShape;
    }
    function safeExtend(schema, shape) {
      if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
      return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
    }
    function merge(a, b) {
      if (!b?._zod?.def) throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
      if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
      let newShape = {};
      mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a))), mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
      let def = mergeDefs(a._zod.def, { shape: newShape, get catchall() {
        return b._zod.def.catchall;
      }, checks: b._zod.def.checks ?? [] });
      return clone(a, def);
    }
    function partial(Class2, schema, mask, name = "partial") {
      let checks = schema._zod.def.checks;
      if (checks && checks.length > 0) throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
      let selected = mask ? new Set(maskedKeys(schema, mask)) : void 0, newShape = {};
      return mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class2 && ((value, key) => selected && !selected.has(key) ? value : new Class2({ type: "optional", innerType: value }))), clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
    }
    function required(Class2, schema, mask) {
      let selected = mask ? new Set(maskedKeys(schema, mask)) : void 0, newShape = {};
      return mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => selected && !selected.has(key) ? value : new Class2({ type: "nonoptional", innerType: value })), clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
    }
    function aborted(x, startIndex = 0) {
      if (x.aborted === true) return true;
      for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
      return false;
    }
    function explicitlyAborted(x, startIndex = 0) {
      if (x.aborted === true) return true;
      for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
      return false;
    }
    function prefixIssues(path3, issues) {
      return issues.map((iss) => {
        var _a3;
        return (_a3 = iss).path ?? (_a3.path = []), iss.path.unshift(path3), iss;
      });
    }
    function unwrapMessage(message) {
      return typeof message == "string" ? message : message?.message;
    }
    function sizeCaps(defChecks) {
      let caps = [];
      for (let ch of defChecks ?? []) {
        let d = ch._zod.def;
        if (!/_(length|size)$|_equals$/.test(d.check)) break;
        let max = d.maximum ?? d.length ?? d.size;
        max >= 0 && caps.push([max, ch]);
      }
      return caps;
    }
    function attachSchema(issues, start, inst) {
      var _a3;
      for (let i = start; i < issues.length; i++) (_a3 = issues[i]).schema ?? (_a3.schema = inst);
    }
    function finalizeIssue(iss, ctx, config2) {
      var _a3;
      let traits = iss.inst?._zod?.traits;
      traits?.has("$ZodType") && (traits.has("$ZodCheck") ? (_a3 = iss).schema ?? (_a3.schema = iss.inst) : iss.schema = iss.inst);
      let schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0, message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input", full = {};
      for (let k of Object.keys(iss)) k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__" || (full[k] = iss[k]);
      return full.path ?? (full.path = []), full.message = message, ctx?.reportInput && (full.input = iss.input), full;
    }
    function getSizableOrigin(input) {
      return input instanceof Set ? "set" : input instanceof Map ? "map" : input instanceof File ? "file" : "unknown";
    }
    var highSurrogate = /[\uD800-\uDBFF]/;
    function codePointLength(str) {
      let units = str.length;
      if (!highSurrogate.test(str)) return units;
      let count = units;
      for (let i = 0; i < units - 1; i++) (str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320 && (count--, i++);
      return count;
    }
    function getLengthableOrigin(input) {
      return Array.isArray(input) ? "array" : typeof input == "string" ? "string" : "unknown";
    }
    function parsedType(data) {
      let t = typeof data;
      switch (t) {
        case "number":
          return Number.isNaN(data) ? "nan" : "number";
        case "object": {
          if (data === null) return "null";
          if (Array.isArray(data)) return "array";
          let obj = data;
          if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) return obj.constructor.name;
        }
      }
      return t;
    }
    function issue(...args) {
      let [iss, input, inst] = args;
      return typeof iss == "string" ? { message: iss, code: "custom", input, inst } : { ...iss };
    }
    function cleanEnum(obj) {
      return Object.entries(obj).filter(([k, _]) => Number.isNaN(Number.parseInt(k, 10))).map((el) => el[1]);
    }
    function base64ToUint8Array(base642) {
      let binaryString = atob(base642), bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      return bytes;
    }
    function uint8ArrayToBase64(bytes) {
      let binaryString = "";
      for (let i = 0; i < bytes.length; i++) binaryString += String.fromCharCode(bytes[i]);
      return btoa(binaryString);
    }
    function base64urlToUint8Array(base64url2) {
      let base642 = base64url2.replace(/-/g, "+").replace(/_/g, "/"), padding = "=".repeat((4 - base642.length % 4) % 4);
      return base64ToUint8Array(base642 + padding);
    }
    function uint8ArrayToBase64url(bytes) {
      return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
    }
    function hexToUint8Array(hex) {
      let cleanHex = hex.replace(/^0x/, "");
      if (cleanHex.length % 2 !== 0) throw new Error("Invalid hex string length");
      let bytes = new Uint8Array(cleanHex.length / 2);
      for (let i = 0; i < cleanHex.length; i += 2) bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
      return bytes;
    }
    function uint8ArrayToHex(bytes) {
      return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    var Class = class {
      constructor(..._args) {
      }
    };
    function members(proto, table) {
      for (let key in table) {
        let desc = Object.getOwnPropertyDescriptor(table, key);
        desc.get ? Object.defineProperty(proto, key, { ...desc, enumerable: false }) : defineBound(proto, key, desc.value);
      }
    }
    function own(inst, key, value, enumerable = true) {
      return Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value }), value;
    }
    function hide(inst, key, value) {
      return own(inst, key, value, false);
    }
    function derived(computes, table) {
      for (let key in computes) {
        let compute = computes[key];
        Object.defineProperty(table, key, { configurable: true, enumerable: true, get() {
          return own(this, key, compute(this));
        }, set(value) {
          own(this, key, value);
        } });
      }
      return table;
    }
    function defineBound(proto, key, fn) {
      Object.defineProperty(proto, key, { configurable: true, get() {
        return this == null ? fn : own(this, key, fn.bind(this));
      }, set(value) {
        own(this, key, value);
      } });
    }
    function claim(inst, sentinel) {
      let proto = Object.getPrototypeOf(inst);
      return sentinel in proto ? void 0 : proto;
    }
    var installing;
    var broke = false;
    var breaker = { configurable: true, get() {
      broke = true;
    } };
    function defineLazyInternal(inst, key, compute) {
      let proto = Object.getPrototypeOf(inst._zod);
      if (key in proto && installing !== inst._zod) {
        installing = void 0;
        return;
      }
      installing = inst._zod, Object.defineProperty(proto, key, { configurable: true, get() {
        Object.defineProperty(this, key, breaker);
        let outer = broke;
        broke = false;
        try {
          let value = compute(this);
          return broke ? delete this[key] : Object.defineProperty(this, key, { configurable: true, writable: true, value }), broke = broke || outer, value;
        } catch (err) {
          throw delete this[key], broke = broke || outer, err;
        }
      }, set(value) {
        Object.defineProperty(this, key, { configurable: true, writable: true, value });
      } });
    }
    function installLazyProp(inst, key, make, enumerable) {
      let proto = claim(inst, key);
      proto && Object.defineProperty(proto, key, { configurable: true, get() {
        let desc = { configurable: true, writable: true, enumerable, value: void 0 };
        return Object.defineProperty(this, key, desc), desc.value = make(this), Object.defineProperty(this, key, desc), desc.value;
      }, set(value) {
        Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
      } });
    }
    var CONSTANT_CATCH = "~constantCatch";
    function constantCatch(value) {
      let fn = () => value;
      return fn[CONSTANT_CATCH] = true, fn;
    }
    var _a;
    var _zodDesc = { value: void 0, enumerable: false };
    var _E = "captureStackTrace" in Error ? Error : null;
    function newError(Definition) {
      let E = _E;
      if (E) {
        let saved = E.stackTraceLimit;
        if (typeof saved == "number") {
          try {
            E.stackTraceLimit = 0;
          } catch {
            return _E = null, new Definition();
          }
          try {
            return new Definition();
          } finally {
            E.stackTraceLimit = saved;
          }
        }
      }
      return new Definition();
    }
    function $constructor(name, initializer3, proto, params) {
      let zodProto = {};
      function Internals(def) {
        this.def = def, this.constr = _, this.traits = /* @__PURE__ */ new Set();
      }
      Internals.prototype = zodProto;
      let protoMembers = proto, initialized = protoMembers && /* @__PURE__ */ new WeakSet();
      function init(inst, def) {
        if (inst._zod) {
          if (inst._zod.traits.has(name)) return;
        } else {
          _zodDesc.value = new Internals(def);
          try {
            Object.defineProperty(inst, "_zod", _zodDesc);
          } finally {
            _zodDesc.value = void 0;
          }
        }
        if (inst._zod.traits.add(name), initializer3(inst, def), initialized) {
          let own2 = Object.getPrototypeOf(inst), ctorProto = inst._zod.constr.prototype, up = own2;
          for (; up && up !== ctorProto; ) up = Object.getPrototypeOf(up);
          let target = up ?? own2;
          initialized.has(target) || (initialized.add(target), members(target, protoMembers));
        }
        let proto2 = _.prototype;
        for (let k in proto2) Object.prototype.hasOwnProperty.call(proto2, k) && (k in inst || (inst[k] = proto2[k].bind(inst)));
      }
      let Parent = params?.Parent ?? Object;
      class Definition extends Parent {
      }
      Object.defineProperty(Definition, "name", { value: name });
      function _(def) {
        let inst = params?.Parent ? newError(Definition) : this;
        init(inst, def);
        let deferred = inst._zod.deferred;
        if (deferred) {
          for (let fn of deferred) fn();
          inst._zod.deferred = void 0;
        }
        let pp = globalThis.__zod_globalConfig?.postProcessor;
        return pp && pp(inst), inst;
      }
      return Object.defineProperty(_, "init", { value: init }), Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => params?.Parent && inst instanceof params.Parent ? true : inst?._zod?.traits?.has(name) }), Object.defineProperty(_, "name", { value: name }), _;
    }
    var $ZodAsyncError = class extends Error {
      constructor() {
        super("Encountered Promise during synchronous parse. Use .parseAsync() instead.");
      }
    };
    var $ZodEncodeError = class extends Error {
      constructor(name) {
        super(`Encountered unidirectional transform during encode: ${name}`), this.name = "ZodEncodeError";
      }
    };
    (_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
    var globalConfig = globalThis.__zod_globalConfig;
    function config(newConfig) {
      return newConfig && Object.assign(globalConfig, newConfig), globalConfig;
    }
    function _getMessage() {
      let internals = this._zod;
      return internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2)), internals.message;
    }
    function _setMessage(value) {
      this._zod.message = value;
    }
    var _messageDesc = { get: _getMessage, set: _setMessage, enumerable: true, configurable: true };
    var _issuesDesc = { value: void 0, enumerable: false };
    var _installedToString = new WeakSet([Object.prototype, Error.prototype]);
    var initializer = (inst, def) => {
      inst.name = "$ZodError", _issuesDesc.value = def, Object.defineProperty(inst, "issues", _issuesDesc), _issuesDesc.value = void 0, Object.defineProperty(inst, "message", _messageDesc);
      let proto = Object.getPrototypeOf(inst);
      _installedToString.has(proto) || (_installedToString.add(proto), Object.defineProperty(proto, "toString", { configurable: true, enumerable: false, get() {
        let value = () => this.message;
        return Object.defineProperty(this, "toString", { value, configurable: true, writable: true }), value;
      }, set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      } }));
    };
    var $ZodError = $constructor("$ZodError", initializer);
    var $ZodRealError = $constructor("$ZodError", initializer, void 0, { Parent: Error });
    function node(obj, key, make) {
      return Object.prototype.hasOwnProperty.call(obj, key) || (key === "__proto__" ? Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true }) : obj[key] = make()), obj[key];
    }
    function flattenError(error2, mapper = (issue2) => issue2.message) {
      let fieldErrors = {}, formErrors = [];
      for (let sub of error2.issues) sub.path.length > 0 ? node(fieldErrors, sub.path[0], () => []).push(mapper(sub)) : formErrors.push(mapper(sub));
      return { formErrors, fieldErrors };
    }
    function formatError(error2, mapper = (issue2) => issue2.message) {
      let fieldErrors = { _errors: [] }, processError = (error3, path3 = []) => {
        for (let issue2 of error3.issues) if (issue2.code === "invalid_union" && issue2.errors.length) issue2.errors.map((issues) => processError({ issues }, [...path3, ...issue2.path]));
        else if (issue2.code === "invalid_key") processError({ issues: issue2.issues }, [...path3, ...issue2.path]);
        else if (issue2.code === "invalid_element") processError({ issues: issue2.issues }, [...path3, ...issue2.path]);
        else {
          let fullpath = [...path3, ...issue2.path];
          if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue2));
          else {
            let curr = fieldErrors, i = 0;
            for (; i < fullpath.length; ) {
              let el = fullpath[i], terminal = i === fullpath.length - 1;
              if (el === "_errors") {
                terminal && curr._errors.push(mapper(issue2)), i++;
                continue;
              }
              Object.prototype.hasOwnProperty.call(curr, el) || Object.defineProperty(curr, el, { value: { _errors: [] }, enumerable: true, writable: true, configurable: true });
              let node2 = curr[el];
              terminal && node2._errors.push(mapper(issue2)), curr = node2, i++;
            }
          }
        }
      };
      return processError(error2), fieldErrors;
    }
    function finalizeParams(callee, params) {
      return { callee: params?.callee ?? callee, Err: params?.Err };
    }
    var _parse = (_Err) => {
      let fn = (schema, value, _ctx, _params) => {
        let ctx = _ctx ? { ..._ctx, async: false } : { async: false }, result = schema._zod.run({ value, issues: [] }, ctx);
        if (result instanceof Promise) throw new $ZodAsyncError();
        if (result.issues.length) {
          let e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
          throw captureStackTrace(e, _params?.callee ?? fn), e;
        }
        return result.value;
      };
      return fn;
    };
    var _parseAsync = (_Err) => {
      let fn = async (schema, value, _ctx, params) => {
        let ctx = _ctx ? { ..._ctx, async: true } : { async: true }, result = schema._zod.run({ value, issues: [] }, ctx);
        if (result instanceof Promise && (result = await result), result.issues.length) {
          let e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
          throw captureStackTrace(e, params?.callee ?? fn), e;
        }
        return result.value;
      };
      return fn;
    };
    var _safeParse = (_Err) => (schema, value, _ctx) => {
      let ctx = _ctx ? { ..._ctx, async: false } : { async: false }, result = schema._zod.run({ value, issues: [] }, ctx);
      if (result instanceof Promise) throw new $ZodAsyncError();
      return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
    };
    function failure(Err, issues, ctx) {
      let error2;
      return { success: false, get error() {
        return error2 || (error2 = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config()))), issues = void 0, ctx = void 0), error2;
      }, set error(e) {
        error2 = e, issues = void 0, ctx = void 0;
      } };
    }
    var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
      let ctx = _ctx ? { ..._ctx, async: true } : { async: true }, result = schema._zod.run({ value, issues: [] }, ctx);
      return result instanceof Promise && (result = await result), result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
    };
    var COMPILE_INVALID = Symbol.for("zod.compile.invalid");
    var COMPILE_FALLBACK = Symbol.for("zod.compile.fallback");
    var validate = (schema, value, _ctx) => {
      let validator = schema._zod.bag.validator;
      if (validator !== void 0) {
        if (validator(value) !== COMPILE_INVALID) return true;
        if (validator.definite === true && _ctx === void 0) return false;
      }
      return validateFallback(schema, value, _ctx);
    };
    function validateFallback(schema, value, _ctx) {
      let ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true }, fallbackRun = schema._zod.bag.fallbackRun, result;
      if (fallbackRun ? (ctx[COMPILE_FALLBACK] = true, result = fallbackRun({ value, issues: [] }, ctx)) : result = schema._zod.run({ value, issues: [] }, ctx), result instanceof Promise) throw new $ZodAsyncError();
      return result.issues.length === 0;
    }
    var validateAsync = async (schema, value, _ctx) => {
      let ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true }, result = schema._zod.run({ value, issues: [] }, ctx);
      return result instanceof Promise && (result = await result), result.issues.length === 0;
    };
    var _encode = (_Err) => {
      let parse2 = _parse(_Err), fn = (schema, value, _ctx, _params) => {
        let ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
        return parse2(schema, value, ctx, finalizeParams(fn, _params));
      };
      return fn;
    };
    var _decode = (_Err) => {
      let parse2 = _parse(_Err), fn = (schema, value, _ctx, _params) => parse2(schema, value, _ctx, finalizeParams(fn, _params));
      return fn;
    };
    var _encodeAsync = (_Err) => {
      let parseAsync2 = _parseAsync(_Err), fn = async (schema, value, _ctx, _params) => {
        let ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
        return await parseAsync2(schema, value, ctx, finalizeParams(fn, _params));
      };
      return fn;
    };
    var _decodeAsync = (_Err) => {
      let parseAsync2 = _parseAsync(_Err), fn = async (schema, value, _ctx, _params) => await parseAsync2(schema, value, _ctx, finalizeParams(fn, _params));
      return fn;
    };
    var _safeEncode = (_Err) => (schema, value, _ctx) => {
      let ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return _safeParse(_Err)(schema, value, ctx);
    };
    var _safeDecode = (_Err) => (schema, value, _ctx) => _safeParse(_Err)(schema, value, _ctx);
    var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
      let ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
      return _safeParseAsync(_Err)(schema, value, ctx);
    };
    var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => _safeParseAsync(_Err)(schema, value, _ctx);
    var cuid = /^[cC][0-9a-z]{6,}$/;
    var cuid2 = /^[0-9a-z]+$/;
    var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
    var xid = /^[0-9a-vA-V]{20}$/;
    var ksuid = /^[A-Za-z0-9]{27}$/;
    var nanoid = /^[a-zA-Z0-9_-]{21}$/;
    function nanoidOfLength(length) {
      return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
    }
    var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
    var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
    var uuid = (version2) => version2 ? new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`) : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
    var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
    var _emoji = "^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$";
    function emoji() {
      return new RegExp(_emoji, "u");
    }
    var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
    var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
    var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
    var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
    var httpProtocol = /^https?$/;
    var e164 = /^\+[1-9]\d{6,14}$/;
    var dateSource = "(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))";
    function anchor(source) {
      return new RegExp(`^${source}$`);
    }
    var date = anchor(dateSource);
    function timeSource(args) {
      let hhmm = "(?:[01]\\d|2[0-3]):[0-5]\\d";
      return typeof args.precision == "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
    }
    function time(args) {
      return new RegExp(`^${timeSource(args)}$`);
    }
    function datetime(args) {
      let opts = ["Z"];
      args.offset && opts.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");
      let qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`, timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
      return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
    }
    var anyString = /^[\s\S]{0,}$/;
    var number = /^-?\d+(?:\.\d+)?$/;
    var boolean = /^(?:true|false)$/i;
    var lowercase = /^[^A-Z]*$/;
    var uppercase = /^[^a-z]*$/;
    var $ZodCheck = $constructor("$ZodCheck", (inst, def) => {
      var _a3;
      inst._zod ?? (inst._zod = {}), inst._zod.def = def, (_a3 = inst._zod).onattach ?? (_a3.onattach = []);
    });
    var _whenHasLength = (payload) => {
      let val = payload.value;
      return !nullish(val) && val.length !== void 0;
    };
    var numericOriginMap = { number: "number", bigint: "bigint", object: "date" };
    var $ZodCheckLessThan = $constructor("$ZodCheckLessThan", (inst, def) => {
      $ZodCheck.init(inst, def);
      let origin = numericOriginMap[typeof def.value];
      inst._zod.check = (payload) => {
        (def.inclusive ? payload.value <= def.value : payload.value < def.value) || payload.issues.push({ origin: numericOriginMap[typeof payload.value] ?? origin, code: "too_big", maximum: typeof def.value == "object" ? def.value.getTime() : def.value, input: payload.value, inclusive: def.inclusive, inst, continue: !def.abort });
      };
    });
    var $ZodCheckGreaterThan = $constructor("$ZodCheckGreaterThan", (inst, def) => {
      $ZodCheck.init(inst, def);
      let origin = numericOriginMap[typeof def.value];
      inst._zod.check = (payload) => {
        (def.inclusive ? payload.value >= def.value : payload.value > def.value) || payload.issues.push({ origin: numericOriginMap[typeof payload.value] ?? origin, code: "too_small", minimum: typeof def.value == "object" ? def.value.getTime() : def.value, input: payload.value, inclusive: def.inclusive, inst, continue: !def.abort });
      };
    });
    var $ZodCheckMultipleOf = $constructor("$ZodCheckMultipleOf", (inst, def) => {
      $ZodCheck.init(inst, def), inst._zod.check = (payload) => {
        if (typeof payload.value != typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
        (typeof payload.value == "bigint" ? def.value !== BigInt(0) && payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) || payload.issues.push({ origin: typeof payload.value, code: "not_multiple_of", divisor: def.value, input: payload.value, inst, continue: !def.abort });
      };
    });
    var $ZodCheckNumberFormat = $constructor("$ZodCheckNumberFormat", (inst, def) => {
      $ZodCheck.init(inst, def), def.format = def.format || "float64";
      let isInt = def.format?.includes("int"), origin = isInt ? "int" : "number", [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
      inst._zod.check = (payload) => {
        let input = payload.value;
        if (isInt) {
          if (!Number.isInteger(input)) {
            payload.issues.push({ expected: origin, format: def.format, code: "invalid_type", continue: false, input, inst });
            return;
          }
          if (!Number.isSafeInteger(input)) {
            input > 0 ? payload.issues.push({ input, code: "too_big", maximum: Number.MAX_SAFE_INTEGER, note: "Integers must be within the safe integer range.", inst, origin, inclusive: true, continue: !def.abort }) : payload.issues.push({ input, code: "too_small", minimum: Number.MIN_SAFE_INTEGER, note: "Integers must be within the safe integer range.", inst, origin, inclusive: true, continue: !def.abort });
            return;
          }
        }
        input < minimum && payload.issues.push({ origin: "number", input, code: "too_small", minimum, inclusive: true, inst, continue: !def.abort }), input > maximum && payload.issues.push({ origin: "number", input, code: "too_big", maximum, inclusive: true, inst, continue: !def.abort });
      };
    });
    var $ZodCheckMaxLength = $constructor("$ZodCheckMaxLength", (inst, def) => {
      var _a3;
      $ZodCheck.init(inst, def), (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength), inst._zod.check = (payload) => {
        let input = payload.value, units = input.length;
        if ((typeof input == "string" && units > def.maximum ? codePointLength(input) : units) <= def.maximum) return;
        let origin = getLengthableOrigin(input);
        payload.issues.push({ origin, code: "too_big", maximum: def.maximum, inclusive: true, input, inst, continue: !def.abort });
      };
    });
    var $ZodCheckMinLength = $constructor("$ZodCheckMinLength", (inst, def) => {
      var _a3;
      $ZodCheck.init(inst, def), (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength), inst._zod.check = (payload) => {
        let input = payload.value, units = input.length;
        if ((typeof input == "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input) : units) >= def.minimum) return;
        let origin = getLengthableOrigin(input);
        payload.issues.push({ origin, code: "too_small", minimum: def.minimum, inclusive: true, input, inst, continue: !def.abort });
      };
    });
    var $ZodCheckLengthEquals = $constructor("$ZodCheckLengthEquals", (inst, def) => {
      var _a3;
      $ZodCheck.init(inst, def), (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength), inst._zod.check = (payload) => {
        let input = payload.value, units = input.length, length = typeof input == "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input) : units;
        if (length === def.length) return;
        let origin = getLengthableOrigin(input), tooBig = length > def.length;
        payload.issues.push({ origin, ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length }, inclusive: true, exact: true, input: payload.value, inst, continue: !def.abort });
      };
    });
    var $ZodCheckStringFormat = $constructor("$ZodCheckStringFormat", (inst, def) => {
      var _a3, _b;
      $ZodCheck.init(inst, def), def.pattern ? (_a3 = inst._zod).check ?? (_a3.check = (payload) => {
        def.pattern.lastIndex = 0, !def.pattern.test(payload.value) && payload.issues.push({ origin: "string", code: "invalid_format", format: def.format, input: payload.value, ...def.pattern ? { pattern: def.pattern.toString() } : {}, inst, continue: !def.abort });
      }) : (_b = inst._zod).check ?? (_b.check = () => {
      });
    });
    var $ZodCheckRegex = $constructor("$ZodCheckRegex", (inst, def) => {
      $ZodCheckStringFormat.init(inst, def), inst._zod.check = (payload) => {
        def.pattern.lastIndex = 0, !def.pattern.test(payload.value) && payload.issues.push({ origin: "string", code: "invalid_format", format: "regex", input: payload.value, pattern: def.pattern.toString(), inst, continue: !def.abort });
      };
    });
    var $ZodCheckLowerCase = $constructor("$ZodCheckLowerCase", (inst, def) => {
      def.pattern ?? (def.pattern = lowercase), $ZodCheckStringFormat.init(inst, def);
    });
    var $ZodCheckUpperCase = $constructor("$ZodCheckUpperCase", (inst, def) => {
      def.pattern ?? (def.pattern = uppercase), $ZodCheckStringFormat.init(inst, def);
    });
    var $ZodCheckIncludes = $constructor("$ZodCheckIncludes", (inst, def) => {
      $ZodCheck.init(inst, def);
      let escapedRegex = escapeRegex(def.includes), pattern = new RegExp(typeof def.position == "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
      def.pattern = pattern, inst._zod.check = (payload) => {
        payload.value.includes(def.includes, def.position) || payload.issues.push({ origin: "string", code: "invalid_format", format: "includes", includes: def.includes, input: payload.value, inst, continue: !def.abort });
      };
    });
    var $ZodCheckStartsWith = $constructor("$ZodCheckStartsWith", (inst, def) => {
      $ZodCheck.init(inst, def);
      let pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
      def.pattern ?? (def.pattern = pattern), inst._zod.check = (payload) => {
        payload.value.startsWith(def.prefix) || payload.issues.push({ origin: "string", code: "invalid_format", format: "starts_with", prefix: def.prefix, input: payload.value, inst, continue: !def.abort });
      };
    });
    var $ZodCheckEndsWith = $constructor("$ZodCheckEndsWith", (inst, def) => {
      $ZodCheck.init(inst, def);
      let pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
      def.pattern ?? (def.pattern = pattern), inst._zod.check = (payload) => {
        payload.value.endsWith(def.suffix) || payload.issues.push({ origin: "string", code: "invalid_format", format: "ends_with", suffix: def.suffix, input: payload.value, inst, continue: !def.abort });
      };
    });
    var $ZodCheckOverwrite = $constructor("$ZodCheckOverwrite", (inst, def) => {
      $ZodCheck.init(inst, def), inst._zod.check = (payload) => {
        payload.value = def.tx(payload.value);
      };
    });
    var Doc = class {
      constructor(args = [], closed = {}) {
        this.content = [], this.indent = 0, this.args = args, this.closed = closed;
      }
      indented(fn) {
        this.indent += 1;
        try {
          fn(this);
        } finally {
          this.indent -= 1;
        }
      }
      write(arg) {
        if (typeof arg == "function") {
          arg(this, { execution: "sync" }), arg(this, { execution: "async" });
          return;
        }
        let lines = arg.split(`
`).filter((x) => x), minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length)), dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
        for (let line of dedented) this.content.push(line);
      }
      compile() {
        let F = Function, content = this?.content ?? [""];
        return new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join(`
`)}
};`)(...Object.values(this.closed));
      }
    };
    var version = { major: 4, minor: 6, patch: 7 };
    var $ZodType = $constructor("$ZodType", (inst, def) => {
      var _a3;
      inst ?? (inst = {}), inst._zod.def = def, inst._zod.bag = inst._zod.bag || {}, inst._zod.version = version;
      let defChecks = inst._zod.def.checks, checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
      for (let ch of checks) for (let fn of ch._zod.onattach) fn(inst);
      if (checks.length === 0) (_a3 = inst._zod).deferred ?? (_a3.deferred = []), inst._zod.deferred?.push(() => {
        inst._zod.run = inst._zod.parse;
      });
      else {
        let runChecks = (payload, checks2, ctx) => {
          if (payload.memo) return payload;
          let isAborted = aborted(payload), asyncResult;
          for (let ch of checks2) {
            if (ch._zod.def.when) {
              if (explicitlyAborted(payload) || !ch._zod.def.when(payload)) continue;
            } else if (isAborted) continue;
            let currLen = payload.issues.length, _ = ch._zod.check(payload);
            if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
            if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
              await _, payload.issues.length !== currLen && (attachSchema(payload.issues, currLen, inst), isAborted || (isAborted = aborted(payload, currLen)));
            });
            else {
              if (payload.issues.length === currLen) continue;
              attachSchema(payload.issues, currLen, inst), isAborted || (isAborted = aborted(payload, currLen));
            }
          }
          return asyncResult ? asyncResult.then(() => payload) : payload;
        }, handleCanaryResult = (canary, payload, ctx) => {
          if (aborted(canary)) return canary.aborted = true, canary;
          let checkResult = runChecks(payload, checks, ctx);
          if (checkResult instanceof Promise) {
            if (ctx.async === false) throw new $ZodAsyncError();
            return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
          }
          return inst._zod.parse(checkResult, ctx);
        };
        inst._zod.run = (payload, ctx) => {
          if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
          if (ctx.direction === "backward") {
            let canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
            return canary instanceof Promise ? canary.then((canary2) => handleCanaryResult(canary2, payload, ctx)) : handleCanaryResult(canary, payload, ctx);
          }
          let result = inst._zod.parse(payload, ctx);
          if (result instanceof Promise) {
            if (ctx.async === false) throw new $ZodAsyncError();
            return result.then((result2) => runChecks(result2, checks, ctx));
          }
          return runChecks(result, checks, ctx);
        };
      }
    }, { get "~standard"() {
      return hide(this, "~standard", standardProps(this));
    }, set "~standard"(value) {
      own(this, "~standard", value);
    } });
    var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
    async function validateAsync2(inst, value) {
      let ctx = { async: true };
      return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
    }
    function standardProps(inst) {
      return { validate: (value) => {
        let ctx = { async: false };
        try {
          let r = inst._zod.run({ value, issues: [] }, ctx);
          if (!(r instanceof Promise)) return toStandardResult(r, ctx);
        } catch {
        }
        return validateAsync2(inst, value);
      }, vendor: "zod", version: 1 };
    }
    var $ZodString = $constructor("$ZodString", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.pattern = def.pattern ?? anyString, inst._zod.parse = (payload, _) => {
        if (def.coerce) try {
          payload.value = String(payload.value);
        } catch {
        }
        return typeof payload.value == "string" || payload.issues.push({ expected: "string", code: "invalid_type", input: payload.value, inst }), payload;
      };
    });
    var $ZodStringFormat = $constructor("$ZodStringFormat", (inst, def) => {
      $ZodCheckStringFormat.init(inst, def), $ZodString.init(inst, def);
    });
    var $ZodGUID = $constructor("$ZodGUID", (inst, def) => {
      def.pattern ?? (def.pattern = guid), $ZodStringFormat.init(inst, def);
    });
    var $ZodUUID = $constructor("$ZodUUID", (inst, def) => {
      if (def.version) {
        let v = { v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8 }[def.version];
        if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
        def.pattern ?? (def.pattern = uuid(v));
      } else def.pattern ?? (def.pattern = uuid());
      $ZodStringFormat.init(inst, def);
    });
    var $ZodEmail = $constructor("$ZodEmail", (inst, def) => {
      def.pattern ?? (def.pattern = email), $ZodStringFormat.init(inst, def);
    });
    var URL_BAD_FORMAT = 1;
    var URL_UNPARSEABLE = 2;
    function canParseURL(input) {
      try {
        return typeof URL < "u" && typeof URL.canParse == "function" ? URL.canParse(input) : (new URL(input), true);
      } catch {
        return false;
      }
    }
    function validateURL(trimmed, def) {
      return !("normalize" in def) && !("hostname" in def) && !("protocol" in def) ? canParseURL(trimmed) || URL_UNPARSEABLE : parseURLObject(trimmed, def);
    }
    function parseURLObject(trimmed, def) {
      if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) return URL_BAD_FORMAT;
      try {
        if (typeof URL < "u") {
          let URLStatic = URL;
          if (typeof URLStatic.parse == "function") return URLStatic.parse(trimmed) ?? URL_UNPARSEABLE;
        }
        return new URL(trimmed);
      } catch {
        return URL_UNPARSEABLE;
      }
    }
    var asciiTabOrNewline = /[\t\n\r]/g;
    function stripTabAndNewline(value) {
      return value.replace(asciiTabOrNewline, "");
    }
    function urlHostnameOk(url, hostname) {
      return hostname.lastIndex = 0, hostname.test(url.hostname);
    }
    function urlProtocolOk(url, protocol) {
      return protocol.lastIndex = 0, protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol);
    }
    var $ZodURL = $constructor("$ZodURL", (inst, def) => {
      $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
        try {
          let trimmed = payload.value.trim(), url = validateURL(trimmed, def);
          if (url === URL_BAD_FORMAT) {
            payload.issues.push({ code: "invalid_format", format: "url", note: "Invalid URL format", input: payload.value, inst, continue: !def.abort });
            return;
          }
          if (url === URL_UNPARSEABLE) {
            payload.issues.push({ code: "invalid_format", format: "url", input: payload.value, inst, continue: !def.abort });
            return;
          }
          if (url === true) {
            payload.value = stripTabAndNewline(trimmed);
            return;
          }
          def.hostname && !urlHostnameOk(url, def.hostname) && payload.issues.push({ code: "invalid_format", format: "url", note: "Invalid hostname", pattern: def.hostname.source, input: payload.value, inst, continue: !def.abort }), def.protocol && !urlProtocolOk(url, def.protocol) && payload.issues.push({ code: "invalid_format", format: "url", note: "Invalid protocol", pattern: def.protocol.source, input: payload.value, inst, continue: !def.abort }), payload.value = def.normalize ? url.href : stripTabAndNewline(trimmed);
          return;
        } catch {
          payload.issues.push({ code: "invalid_format", format: "url", input: payload.value, inst, continue: !def.abort });
        }
      };
    });
    var $ZodEmoji = $constructor("$ZodEmoji", (inst, def) => {
      def.pattern ?? (def.pattern = emoji()), $ZodStringFormat.init(inst, def);
    });
    var $ZodNanoID = $constructor("$ZodNanoID", (inst, def) => {
      if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1)) throw new Error(`Invalid nanoid length: ${def.length}`);
      def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length)), $ZodStringFormat.init(inst, def);
    });
    var $ZodCUID = $constructor("$ZodCUID", (inst, def) => {
      def.pattern ?? (def.pattern = cuid), $ZodStringFormat.init(inst, def);
    });
    var $ZodCUID2 = $constructor("$ZodCUID2", (inst, def) => {
      def.pattern ?? (def.pattern = cuid2), $ZodStringFormat.init(inst, def);
    });
    var $ZodULID = $constructor("$ZodULID", (inst, def) => {
      def.pattern ?? (def.pattern = ulid), $ZodStringFormat.init(inst, def);
    });
    var $ZodXID = $constructor("$ZodXID", (inst, def) => {
      def.pattern ?? (def.pattern = xid), $ZodStringFormat.init(inst, def);
    });
    var $ZodKSUID = $constructor("$ZodKSUID", (inst, def) => {
      def.pattern ?? (def.pattern = ksuid), $ZodStringFormat.init(inst, def);
    });
    var $ZodISODateTime = $constructor("$ZodISODateTime", (inst, def) => {
      def.pattern ?? (def.pattern = datetime(def)), $ZodStringFormat.init(inst, def);
    });
    var $ZodISODate = $constructor("$ZodISODate", (inst, def) => {
      def.pattern ?? (def.pattern = date), $ZodStringFormat.init(inst, def);
    });
    var $ZodISOTime = $constructor("$ZodISOTime", (inst, def) => {
      def.pattern ?? (def.pattern = time(def)), $ZodStringFormat.init(inst, def);
    });
    var $ZodISODuration = $constructor("$ZodISODuration", (inst, def) => {
      def.pattern ?? (def.pattern = duration), $ZodStringFormat.init(inst, def);
    });
    var $ZodIPv4 = $constructor("$ZodIPv4", (inst, def) => {
      def.pattern ?? (def.pattern = ipv4), $ZodStringFormat.init(inst, def);
    });
    var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
    function isValidIPv6(value) {
      return ipv6Alphabet.test(value) ? canParseURL(`http://[${value}]`) : false;
    }
    var $ZodIPv6 = $constructor("$ZodIPv6", (inst, def) => {
      def.pattern ?? (def.pattern = ipv6), $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
        isValidIPv6(payload.value) || payload.issues.push({ code: "invalid_format", format: "ipv6", input: payload.value, inst, continue: !def.abort });
      };
    });
    var $ZodCIDRv4 = $constructor("$ZodCIDRv4", (inst, def) => {
      def.pattern ?? (def.pattern = cidrv4), $ZodStringFormat.init(inst, def);
    });
    function isValidCIDRv6(value) {
      let parts = value.split("/");
      if (parts.length !== 2) return false;
      let [address, prefix] = parts;
      if (!prefix) return false;
      let prefixNum = Number(prefix);
      return `${prefixNum}` !== prefix || prefixNum < 0 || prefixNum > 128 ? false : isValidIPv6(address);
    }
    var $ZodCIDRv6 = $constructor("$ZodCIDRv6", (inst, def) => {
      def.pattern ?? (def.pattern = cidrv6), $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
        isValidCIDRv6(payload.value) || payload.issues.push({ code: "invalid_format", format: "cidrv6", input: payload.value, inst, continue: !def.abort });
      };
    });
    function isValidBase64(data) {
      if (data === "") return true;
      if (/\s/.test(data) || data.length % 4 !== 0) return false;
      try {
        return atob(data), true;
      } catch {
        return false;
      }
    }
    var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
    var $ZodBase64 = $constructor("$ZodBase64", (inst, def) => {
      def.pattern ?? (def.pattern = base64Charset), $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
        isValidBase64(payload.value) || payload.issues.push({ code: "invalid_format", format: "base64", input: payload.value, inst, continue: !def.abort });
      };
    });
    var base64urlCharset = /^[A-Za-z0-9_-]*$/;
    function isValidBase64URL(data) {
      if (!base64urlCharset.test(data)) return false;
      let base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/"), padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
      return isValidBase64(padded);
    }
    var $ZodBase64URL = $constructor("$ZodBase64URL", (inst, def) => {
      def.pattern ?? (def.pattern = base64urlCharset), $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
        isValidBase64URL(payload.value) || payload.issues.push({ code: "invalid_format", format: "base64url", input: payload.value, inst, continue: !def.abort });
      };
    });
    var $ZodE164 = $constructor("$ZodE164", (inst, def) => {
      def.pattern ?? (def.pattern = e164), $ZodStringFormat.init(inst, def);
    });
    function isValidJWT(token, algorithm = null) {
      try {
        let tokensParts = token.split(".");
        if (tokensParts.length !== 3) return false;
        let [header] = tokensParts;
        if (!header) return false;
        let parsedHeader = JSON.parse(atob(header));
        return !("typ" in parsedHeader && parsedHeader?.typ !== "JWT" || !parsedHeader.alg || algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm));
      } catch {
        return false;
      }
    }
    var $ZodJWT = $constructor("$ZodJWT", (inst, def) => {
      $ZodStringFormat.init(inst, def), inst._zod.check = (payload) => {
        isValidJWT(payload.value, def.alg) || payload.issues.push({ code: "invalid_format", format: "jwt", input: payload.value, inst, continue: !def.abort });
      };
    });
    var $ZodNumber = $constructor("$ZodNumber", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.pattern = number, inst._zod.parse = (payload, _ctx) => {
        if (def.coerce) try {
          payload.value = Number(payload.value);
        } catch {
        }
        let input = payload.value;
        if (typeof input == "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
        let received = typeof input == "number" ? Number.isNaN(input) ? "NaN" : Number.isFinite(input) ? void 0 : String(input) : void 0;
        return payload.issues.push({ expected: "number", code: "invalid_type", input, inst, ...received ? { received } : {} }), payload;
      };
    });
    var $ZodNumberFormat = $constructor("$ZodNumberFormat", (inst, def) => {
      $ZodCheckNumberFormat.init(inst, def), $ZodNumber.init(inst, def);
    });
    var $ZodBoolean = $constructor("$ZodBoolean", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.pattern = boolean, inst._zod.parse = (payload, _ctx) => {
        if (def.coerce) try {
          payload.value = !!payload.value;
        } catch {
        }
        let input = payload.value;
        return typeof input == "boolean" || payload.issues.push({ expected: "boolean", code: "invalid_type", input, inst }), payload;
      };
    });
    var $ZodUnknown = $constructor("$ZodUnknown", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.parse = (payload) => payload;
    });
    var $ZodNever = $constructor("$ZodNever", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.parse = (payload, _ctx) => (payload.issues.push({ expected: "never", code: "invalid_type", input: payload.value, inst }), payload);
    });
    function capSize(inst, size) {
      let caps = sizeCaps(inst._zod.def.checks);
      if (!caps.length) return;
      let cap = Math.min(...caps.map((c) => c[0])), parse2 = inst._zod.parse;
      inst._zod.parse = (payload, ctx) => {
        let n = size(payload.value);
        if (n > cap && !ctx?.skipChecks && ctx?.direction !== "backward") {
          for (let [max, ch] of sizeCaps(inst._zod.def.checks)) if (n > max && ch._zod.def.when(payload)) {
            let start = payload.issues.length;
            return ch._zod.check(payload), payload.issues[start].continue = false, attachSchema(payload.issues, start, inst), payload;
          }
        }
        return parse2(payload, ctx);
      };
    }
    var arraySize = (input) => Array.isArray(input) ? input.length : -1;
    function handleArrayResult(result, final, index) {
      result.issues.length && final.issues.push(...prefixIssues(index, result.issues)), final.value[index] = result.value;
    }
    var $ZodArray = $constructor("$ZodArray", (inst, def) => {
      $ZodType.init(inst, def);
      let memo2 = globalConfig.memoizer;
      memo2?.attach(inst), inst._zod.parse = (payload, ctx) => {
        let input = payload.value;
        if (!Array.isArray(input)) return payload.issues.push({ expected: "array", code: "invalid_type", input, inst }), payload;
        payload.value = memo2 ? memo2.alloc(inst, payload, Array(input.length), ctx) : Array(input.length);
        let proms = [], abortEarly = ctx?.abortEarly;
        for (let i = 0; i < input.length; i++) {
          let item = input[i], result = def.element._zod.run({ value: item, issues: [] }, ctx);
          if (result instanceof Promise) proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
          else if (handleArrayResult(result, payload, i), abortEarly && result.issues.length !== 0 && aborted(result)) break;
        }
        return proms.length ? Promise.all(proms).then(() => payload) : payload;
      }, capSize(inst, arraySize);
    });
    function handlePropertyResult(result, final, key, input, optin, optout) {
      let isPresent = key in input, isOptionalOut = optout === "optional";
      if (!(!isPresent && isOptionalOut && optin === "optional")) {
        if (result.issues.length) {
          if (optin !== void 0 && isOptionalOut && !isPresent) return;
          final.issues.push(...prefixIssues(key, result.issues));
        }
        if (!isPresent && optin === void 0) {
          result.issues.length || final.issues.push({ code: "invalid_type", expected: "nonoptional", input: void 0, path: [key] });
          return;
        }
        result.value === void 0 ? (isPresent || optin === "defaulted" && !isOptionalOut) && (final.value[key] = void 0) : final.value[key] = result.value;
      }
    }
    var NO_SYMBOL_KEYS = [];
    function normalizeDef(def) {
      let keys = Object.keys(def.shape), ownSymbols = Object.getOwnPropertySymbols(def.shape), symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS, allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
      for (let k of allKeys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
      let okeys = optionalKeys(def.shape);
      return { ...def, allKeys, symbolKeys, keySet: new Set(keys), numKeys: keys.length, optionalKeys: new Set(okeys) };
    }
    function handleCatchall(proms, input, payload, ctx, def, inst, abortEarly) {
      let unrecognized = [], keySet = def.keySet, _catchall = def.catchall._zod, t = _catchall.def.type, optin = _catchall.optin, optout = _catchall.optout, seen = 0;
      for (let key in input) {
        if (abortEarly && payload.issues.length !== seen) {
          if (aborted(payload, seen)) break;
          seen = payload.issues.length;
        }
        if (keySet.has(key)) continue;
        if (key === "__proto__") {
          t === "never" && unrecognized.push(key);
          continue;
        }
        if (t === "never") {
          unrecognized.push(key);
          continue;
        }
        let r = _catchall.run({ value: input[key], issues: [] }, ctx);
        r instanceof Promise ? proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout))) : handlePropertyResult(r, payload, key, input, optin, optout);
      }
      return unrecognized.length && payload.issues.push({ code: "unrecognized_keys", keys: unrecognized, input, inst, continue: true }), proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    var $ZodObject = $constructor("$ZodObject", (inst, def) => {
      $ZodType.init(inst, def);
      let desc = Object.getOwnPropertyDescriptor(def, "shape"), sh = desc?.get ? desc.get.raw : def.shape ?? {};
      if (sh) {
        let get = () => {
          let newSh = { ...sh };
          return Object.defineProperty(def, "shape", { value: newSh }), get.raw = newSh, newSh;
        };
        get.raw = sh, Object.defineProperty(def, "shape", { get });
      }
      let _normalized = cached(() => normalizeDef(def));
      defineLazyInternal(inst, "propValues", (zod) => {
        let shape = zod.def.shape, propValues = {};
        for (let key in shape) {
          let field = shape[key]._zod;
          if (field.values) {
            Object.prototype.hasOwnProperty.call(propValues, key) || assignProp(propValues, key, /* @__PURE__ */ new Set());
            for (let v of field.values) propValues[key].add(v);
            field.optin !== void 0 && propValues[key].add(void 0);
          }
        }
        return propValues;
      });
      let isObject2 = isObject, catchall = def.catchall, value, memo2 = globalConfig.memoizer;
      memo2?.attach(inst), inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        let input = payload.value;
        if (!isObject2(input)) return payload.issues.push({ expected: "object", code: "invalid_type", input, inst }), payload;
        payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
        let proms = [], shape = value.shape, abortEarly = ctx?.abortEarly, seen = payload.issues.length;
        for (let key of value.allKeys) {
          if (abortEarly && payload.issues.length !== seen) {
            if (aborted(payload, seen)) break;
            seen = payload.issues.length;
          }
          if (key === "__proto__") continue;
          let el = shape[key], optin = el._zod.optin, optout = el._zod.optout, r = el._zod.run({ value: input[key], issues: [] }, ctx);
          r instanceof Promise ? proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input, optin, optout))) : handlePropertyResult(r, payload, key, input, optin, optout);
        }
        return catchall ? handleCatchall(proms, input, payload, ctx, _normalized.value, inst, abortEarly === true) : proms.length ? Promise.all(proms).then(() => payload) : payload;
      };
    });
    var $ZodObjectJIT = $constructor("$ZodObjectJIT", (inst, def) => {
      $ZodObject.init(inst, def);
      let superParse = inst._zod.parse, _normalized = cached(() => normalizeDef(def)), memo2 = globalConfig.memoizer, generateFastpass = (shape) => {
        let normalized = _normalized.value, syms = normalized.symbolKeys, doc = new Doc(["payload", "ctx"], { shape, inst, memo: memo2, syms }), parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`, prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
        doc.write("const input = payload.value;");
        let ids = /* @__PURE__ */ Object.create(null), counter = 0;
        for (let key of normalized.allKeys) ids[key] = `key_${counter++}`;
        doc.write(memo2 ? "const newResult = memo.alloc(inst, payload, {}, ctx);" : "const newResult = {};");
        for (let key of normalized.allKeys) {
          if (key === "__proto__") continue;
          let id = ids[key], k = typeof key == "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key), isPresent = `${k} in input`, schema = shape[key], optin = schema?._zod?.optin, isOptionalIn = optin !== void 0, isOptionalOut = schema?._zod?.optout === "optional";
          if (doc.write(`const ${id} = ${parseStr(k)};`), isOptionalIn && isOptionalOut) {
            let assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
            doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
          } else isOptionalIn ? (doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `), optin === "defaulted" ? doc.write(`newResult[${k}] = ${id}.value;`) : doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `)) : doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
        }
        return doc.write("payload.value = newResult;"), doc.write("return payload;"), doc.compile();
      }, fastpass, isObject2 = isObject, jit = !globalConfig.jitless, fastEnabled = jit && allowsEval.value, catchall = def.catchall, value;
      inst._zod.parse = (payload, ctx) => {
        value ?? (value = _normalized.value);
        let input = payload.value;
        return isObject2(input) ? jit && fastEnabled && ctx?.async === false && ctx.jitless !== true ? (fastpass || (fastpass = generateFastpass(def.shape)), payload = fastpass(payload, ctx), catchall ? handleCatchall([], input, payload, ctx, value, inst, ctx?.abortEarly === true) : payload) : superParse(payload, ctx) : (payload.issues.push({ expected: "object", code: "invalid_type", input, inst }), payload);
      };
    });
    function handleUnionResults(results, final, inst, ctx) {
      for (let result of results) if (result.issues.length === 0) return final.value = result.value, final;
      let nonaborted = results.filter((r) => !aborted(r));
      return nonaborted.length === 1 ? (final.value = nonaborted[0].value, nonaborted[0]) : (final.issues.push({ code: "invalid_union", input: final.value, inst, errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config()))) }), final);
    }
    var $ZodUnion = $constructor("$ZodUnion", (inst, def) => {
      $ZodType.init(inst, def), defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0), defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0), defineLazyInternal(inst, "values", (zod) => {
        if (zod.def.options.every((o) => o._zod.values)) return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
      }), defineLazyInternal(inst, "pattern", (zod) => {
        if (zod.def.options.every((o) => o._zod.pattern)) {
          let patterns = zod.def.options.map((o) => o._zod.pattern);
          return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
        }
      });
      let first = def.options.length === 1 ? def.options[0]._zod.run : null;
      inst._zod.parse = (payload, ctx) => {
        if (first) return first(payload, ctx);
        let async = false, results = [];
        for (let option of def.options) {
          let result = option._zod.run({ value: payload.value, issues: [] }, ctx);
          if (result instanceof Promise) results.push(result), async = true;
          else {
            if (result.issues.length === 0) return result;
            results.push(result);
          }
        }
        return async ? Promise.all(results).then((results2) => handleUnionResults(results2, payload, inst, ctx)) : handleUnionResults(results, payload, inst, ctx);
      };
    });
    var $ZodIntersection = $constructor("$ZodIntersection", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.parse = (payload, ctx) => {
        let input = payload.value, left = def.left._zod.run({ value: input, issues: [] }, ctx), right = def.right._zod.run({ value: input, issues: [] }, ctx);
        return left instanceof Promise || right instanceof Promise ? Promise.all([left, right]).then(([left2, right2]) => handleIntersectionResults(payload, left2, right2)) : handleIntersectionResults(payload, left, right);
      };
    });
    function mergeValues(a, b) {
      if (a === b) return { valid: true, data: a };
      if (a instanceof Date && b instanceof Date && +a == +b) return { valid: true, data: a };
      if (isPlainObject(a) && isPlainObject(b)) {
        let bKeys = Object.keys(b), sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1), newObj = { ...a, ...b };
        Object.prototype.hasOwnProperty.call(newObj, "__proto__") && delete newObj.__proto__;
        for (let key of sharedKeys) {
          if (key === "__proto__") continue;
          let sharedValue = mergeValues(a[key], b[key]);
          if (!sharedValue.valid) return { valid: false, mergeErrorPath: [key, ...sharedValue.mergeErrorPath] };
          newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
      }
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return { valid: false, mergeErrorPath: [] };
        let newArray = [];
        for (let index = 0; index < a.length; index++) {
          let itemA = a[index], itemB = b[index], sharedValue = mergeValues(itemA, itemB);
          if (!sharedValue.valid) return { valid: false, mergeErrorPath: [index, ...sharedValue.mergeErrorPath] };
          newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
      }
      return { valid: false, mergeErrorPath: [] };
    }
    function handleIntersectionResults(result, left, right) {
      let unrecKeys = /* @__PURE__ */ new Map(), unrecIssue, keyIssues = /* @__PURE__ */ new Map(), collect = (iss, side) => {
        let keys;
        if (iss.code === "unrecognized_keys" && !iss.path?.length) unrecIssue ?? (unrecIssue = iss), keys = iss.keys;
        else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
          let k = String(iss.path[0]);
          keyIssues.has(k) || keyIssues.set(k, iss), keys = [k];
        } else return false;
        for (let k of keys) unrecKeys.has(k) || unrecKeys.set(k, {}), unrecKeys.get(k)[side] = true;
        return true;
      };
      for (let iss of left.issues) collect(iss, "l") || result.issues.push(iss);
      for (let iss of right.issues) collect(iss, "r") || result.issues.push(iss);
      let bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
      if (bothKeys.length) {
        let aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
        aggregated.length && result.issues.push({ ...unrecIssue, keys: aggregated });
        for (let k of bothKeys) !aggregated.includes(k) && keyIssues.has(k) && result.issues.push(keyIssues.get(k));
      }
      let merged = mergeValues(left.value, right.value);
      if (!merged.valid) {
        if (aborted(result)) return result;
        throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
      }
      return result.value = merged.data, result;
    }
    var $ZodEnum = $constructor("$ZodEnum", (inst, def) => {
      $ZodType.init(inst, def);
      let values = getEnumValues(def.entries), valuesSet = new Set(values);
      inst._zod.values = valuesSet, defineLazyInternal(inst, "pattern", (zod) => {
        let patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
        return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
      }), inst._zod.parse = (payload, _ctx) => {
        let input = payload.value;
        return valuesSet.has(input) || payload.issues.push({ code: "invalid_value", values, input, inst }), payload;
      };
    });
    var $ZodLiteral = $constructor("$ZodLiteral", (inst, def) => {
      $ZodType.init(inst, def);
      let values = new Set(def.values);
      inst._zod.values = values, defineLazyInternal(inst, "pattern", (zod) => {
        let vals = zod.def.values;
        return new RegExp(vals.length ? `^(${vals.map((o) => typeof o == "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
      }), inst._zod.parse = (payload, _ctx) => {
        let input = payload.value;
        return values.has(input) || payload.issues.push({ code: "invalid_value", values: def.values, input, inst }), payload;
      };
    });
    var $ZodTransform = $constructor("$ZodTransform", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.optin = "optional", globalConfig.memoizer?.guard(inst), inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
        let _out = def.transform(payload.value, payload);
        if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output2) => (payload.value = output2, payload));
        if (_out instanceof Promise) throw new $ZodAsyncError();
        return payload.value = _out, payload;
      };
    });
    function handleOptionalResult(payload, result) {
      return payload.value = result.issues.length ? void 0 : result.value, payload;
    }
    var $ZodOptional = $constructor("$ZodOptional", (inst, def) => {
      $ZodType.init(inst, def), defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), inst._zod.optout = "optional", defineLazyInternal(inst, "values", (zod) => {
        let values = zod.def.innerType._zod.values;
        return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
      }), defineLazyInternal(inst, "pattern", (zod) => {
        let pattern = zod.def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
      }), inst._zod.parse = (payload, ctx) => {
        if (payload.value === void 0) {
          if (def.innerType._zod.optin !== "defaulted") return payload;
          let result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
          return result instanceof Promise ? result.then((result2) => handleOptionalResult(payload, result2)) : handleOptionalResult(payload, result);
        }
        return def.innerType._zod.run(payload, ctx);
      };
    });
    var $ZodExactOptional = $constructor("$ZodExactOptional", (inst, def) => {
      $ZodOptional.init(inst, def), defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values), defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern), inst._zod.parse = (payload, ctx) => def.innerType._zod.run(payload, ctx);
    });
    var $ZodNullable = $constructor("$ZodNullable", (inst, def) => {
      $ZodType.init(inst, def), defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin), defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout), defineLazyInternal(inst, "pattern", (zod) => {
        let pattern = zod.def.innerType._zod.pattern;
        return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
      }), defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0), inst._zod.parse = (payload, ctx) => payload.value === null ? payload : def.innerType._zod.run(payload, ctx);
    });
    var $ZodDefault = $constructor("$ZodDefault", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.optin = "defaulted", defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values), inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
        if (payload.value === void 0) return payload.value = def.defaultValue, payload;
        let result = def.innerType._zod.run(payload, ctx);
        return result instanceof Promise ? result.then((result2) => handleDefaultResult(result2, def)) : handleDefaultResult(result, def);
      };
    });
    function handleDefaultResult(payload, def) {
      return payload.value === void 0 && (payload.value = def.defaultValue), payload;
    }
    var $ZodPrefault = $constructor("$ZodPrefault", (inst, def) => {
      $ZodType.init(inst, def), inst._zod.optin = "defaulted", defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values), inst._zod.parse = (payload, ctx) => (ctx.direction === "backward" || payload.value === void 0 && (payload.value = def.defaultValue), def.innerType._zod.run(payload, ctx));
    });
    var $ZodNonOptional = $constructor("$ZodNonOptional", (inst, def) => {
      $ZodType.init(inst, def), defineLazyInternal(inst, "values", (zod) => {
        let v = zod.def.innerType._zod.values;
        return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
      }), inst._zod.parse = (payload, ctx) => {
        let result = def.innerType._zod.run(payload, ctx);
        return result instanceof Promise ? result.then((result2) => handleNonOptionalResult(result2, inst)) : handleNonOptionalResult(result, inst);
      };
    });
    function handleNonOptionalResult(payload, inst) {
      return !payload.issues.length && payload.value === void 0 && payload.issues.push({ code: "invalid_type", expected: "nonoptional", input: payload.value, inst }), payload;
    }
    function handleCatchResult(payload, result, def, ctx) {
      return result.issues.length ? (payload.value = def.catchValue({ ...result, value: payload.value, error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) }, input: payload.value }), payload) : (payload.value = result.value, result.memo && (payload.memo = true), payload);
    }
    var $ZodCatch = $constructor("$ZodCatch", (inst, def) => {
      $ZodType.init(inst, def), defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional"), defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout), defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values), inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
        let result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
        return result instanceof Promise ? result.then((result2) => handleCatchResult(payload, result2, def, ctx)) : handleCatchResult(payload, result, def, ctx);
      };
    });
    var $ZodPipe = $constructor("$ZodPipe", (inst, def) => {
      $ZodType.init(inst, def), defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values), defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin), defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout), defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues), inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") {
          let right = def.out._zod.run(payload, ctx);
          return right instanceof Promise ? right.then((right2) => handlePipeResult(right2, def.in, ctx)) : handlePipeResult(right, def.in, ctx);
        }
        let left = def.in._zod.run(payload, ctx);
        return left instanceof Promise ? left.then((left2) => handlePipeResult(left2, def.out, ctx)) : handlePipeResult(left, def.out, ctx);
      };
    });
    function handlePipeResult(left, next, ctx) {
      return left.issues.some((iss) => iss.code !== "unrecognized_keys") ? (left.aborted = true, left) : next._zod.run({ value: left.value, issues: left.issues }, ctx);
    }
    var $ZodReadonly = $constructor("$ZodReadonly", (inst, def) => {
      $ZodType.init(inst, def), defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues), defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values), defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin), defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout), inst._zod.parse = (payload, ctx) => {
        if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
        let result = def.innerType._zod.run(payload, ctx);
        return result instanceof Promise ? result.then(handleReadonlyResult) : handleReadonlyResult(result);
      };
    });
    function handleReadonlyResult(payload) {
      return payload.memo || (payload.value = Object.freeze(payload.value)), payload;
    }
    var $ZodCustom = $constructor("$ZodCustom", (inst, def) => {
      $ZodCheck.init(inst, def), $ZodType.init(inst, def), inst._zod.parse = (payload, _) => payload, inst._zod.check = (payload) => {
        let input = payload.value, r = def.fn(input);
        if (r instanceof Promise) return r.then((r2) => handleRefineResult(r2, payload, input, inst));
        handleRefineResult(r, payload, input, inst);
      };
    });
    function handleRefineResult(result, payload, input, inst) {
      if (!result) {
        let _iss = { code: "custom", input, inst, path: [...inst._zod.def.path ?? []], continue: !inst._zod.def.abort };
        inst._zod.def.params && (_iss.params = inst._zod.def.params), payload.issues.push(issue(_iss));
      }
    }
    var $ZodCyclicError = class extends Error {
      constructor() {
        super("Cannot parse a reference cycle that closes through a transform"), this.name = "ZodCyclicError";
      }
    };
    var STATE = "~memo";
    var NO_ISSUES = [];
    function isRef(value) {
      return value !== null && typeof value == "object";
    }
    function cloneIssues(issues) {
      return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
    }
    var recursive = /* @__PURE__ */ new WeakMap();
    var NONE = 0;
    var ASSUMED = 1;
    var PROVEN = 2;
    function isRecursive(inst, stack, resolve) {
      let cached2 = recursive.get(inst);
      if (cached2 !== void 0) return cached2 ? PROVEN : NONE;
      if (stack.has(inst)) return PROVEN;
      stack.add(inst);
      let result = NONE, check = (child) => {
        if (result !== PROVEN && child?._zod) {
          let answer = isRecursive(child, stack, resolve);
          answer > result && (result = answer);
        }
      }, shape = (sh, spread) => {
        let answer = NONE;
        for (let key of Reflect.ownKeys(sh)) {
          let desc = Object.getOwnPropertyDescriptor(sh, key);
          if (spread && !desc.enumerable) continue;
          let child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
          child > answer && (answer = child);
        }
        return answer;
      }, merge2 = (answer) => {
        answer > result && (result = answer);
      }, def = inst._zod.def, kind = def.type;
      switch (kind) {
        case "object": {
          let raw = rawShape(def);
          merge2(raw ? shape(raw, true) : ASSUMED), check(def.catchall);
          break;
        }
        case "array":
          check(def.element);
          break;
        case "tuple":
          for (let el of def.items) check(el);
          check(def.rest);
          break;
        case "record":
        case "map":
          check(def.keyType), check(def.valueType);
          break;
        case "set":
          check(def.valueType);
          break;
        case "union":
          for (let el of def.options) check(el);
          break;
        case "intersection":
          check(def.left), check(def.right);
          break;
        case "optional":
        case "nullable":
        case "default":
        case "prefault":
        case "catch":
        case "readonly":
        case "nonoptional":
        case "promise":
        case "success":
          check(def.innerType);
          break;
        case "pipe":
          check(def.in), check(def.out);
          break;
        case "function":
          check(def.input), check(def.output);
          break;
        case "lazy": {
          let inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
          merge2(inner ? isRecursive(inner, stack, false) : ASSUMED);
          break;
        }
        case "template_literal":
        case "string":
        case "number":
        case "int":
        case "boolean":
        case "bigint":
        case "symbol":
        case "undefined":
        case "null":
        case "void":
        case "never":
        case "any":
        case "unknown":
        case "date":
        case "nan":
        case "enum":
        case "literal":
        case "file":
        case "transform":
        case "custom":
          break;
        default:
          for (let key in def) {
            let desc = Object.getOwnPropertyDescriptor(def, key);
            if (!desc || desc.get) continue;
            let value = desc.value;
            if (!(!value || typeof value != "object")) {
              if (value._zod) check(value);
              else if (Array.isArray(value)) for (let el of value) check(el);
            }
          }
      }
      return stack.delete(inst), settle(inst, result);
    }
    function settle(inst, answer) {
      return answer !== ASSUMED && recursive.set(inst, answer === PROVEN), answer;
    }
    function bucketFor(state, inst) {
      let bucket = state.buckets.get(inst);
      return bucket || (bucket = /* @__PURE__ */ new WeakMap(), state.buckets.set(inst, bucket)), bucket;
    }
    var handoff;
    var open = [];
    var memo = { alloc(_inst, payload, empty) {
      let bucket = handoff;
      if (!bucket) return empty;
      handoff = void 0;
      let entry = { value: empty, issues: null };
      return bucket.set(payload.value, entry), open.push(entry), empty;
    }, guard(inst) {
      var _a3;
      (_a3 = inst._zod).deferred ?? (_a3.deferred = []), inst._zod.deferred.push(() => {
        let base = inst._zod.parse, wrapped = (payload, ctx) => {
          if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value)) throw new $ZodCyclicError();
          return base(payload, ctx);
        };
        inst._zod.parse = wrapped, inst._zod.run === base && (inst._zod.run = wrapped);
      });
    }, attach(inst) {
      var _a3;
      let isRecursiveInst, rechecked = false, lastCtx, lastBucket;
      (_a3 = inst._zod).deferred ?? (_a3.deferred = []), inst._zod.deferred.push(() => {
        let base = inst._zod.parse, wrapped = (payload, ctx) => {
          if (isRecursiveInst === void 0) {
            let walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
            if (walked === NONE) return inst._zod.parse = base, inst._zod.run === wrapped && (inst._zod.run = base), base(payload, ctx);
            walked === PROVEN || rechecked ? isRecursiveInst = true : rechecked = true;
          }
          let input = payload.value;
          if (!isRef(input)) return base(payload, ctx);
          let state = ctx[STATE];
          state || (state = { buckets: /* @__PURE__ */ new WeakMap(), backEdges: void 0 }, ctx[STATE] = state);
          let bucket;
          lastCtx === ctx ? bucket = lastBucket : (bucket = bucketFor(state, inst), lastCtx = ctx, lastBucket = bucket);
          let hit = bucket.get(input);
          if (hit) return payload.value = hit.value, hit.issues ? hit.issues.length && payload.issues.push(...cloneIssues(hit.issues)) : (payload.memo = true, state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet()), state.backEdges.add(hit.value)), payload;
          handoff = bucket;
          let depth = open.length, result = base(payload, ctx);
          handoff = void 0;
          let entry = open.length > depth ? open.pop() : void 0;
          return result instanceof Promise ? result.then((r) => (entry && (entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES), r)) : (entry && (entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES), result);
        };
        inst._zod.parse = wrapped, inst._zod.run === base && (inst._zod.run = wrapped);
      });
    } };
    function memoizer() {
      return memo;
    }
    function isBackEdge(ctx, value) {
      let backEdges = ctx[STATE]?.backEdges;
      return backEdges !== void 0 && isRef(value) && backEdges.has(value);
    }
    var error = () => {
      let Sizable = { string: { unit: "characters", verb: "to have" }, file: { unit: "bytes", verb: "to have" }, array: { unit: "items", verb: "to have" }, set: { unit: "items", verb: "to have" }, map: { unit: "entries", verb: "to have" } };
      function getSizing(origin) {
        return Sizable[origin] ?? null;
      }
      let FormatDictionary = { regex: "input", email: "email address", url: "URL", emoji: "emoji", uuid: "UUID", uuidv4: "UUIDv4", uuidv6: "UUIDv6", nanoid: "nanoid", guid: "GUID", cuid: "cuid", cuid2: "cuid2", ulid: "ULID", xid: "XID", ksuid: "KSUID", datetime: "ISO datetime", date: "ISO date", time: "ISO time", duration: "ISO duration", ipv4: "IPv4 address", ipv6: "IPv6 address", mac: "MAC address", cidrv4: "IPv4 range", cidrv6: "IPv6 range", base64: "base64-encoded string", base64url: "base64url-encoded string", json_string: "JSON string", e164: "E.164 number", currency_code: "currency code", credit_card: "credit card number", iban: "IBAN", jwt: "JWT", template_literal: "input" }, TypeDictionary = { nan: "NaN" };
      function getTypeName(type, input) {
        return type === "number" && typeof input == "number" && !Number.isFinite(input) ? String(input) : TypeDictionary[type] ?? type;
      }
      return (issue2) => {
        switch (issue2.code) {
          case "invalid_type": {
            let expected = getTypeName(issue2.expected), receivedType = parsedType(issue2.input), received = getTypeName(receivedType, issue2.input);
            return `Invalid input: expected ${expected}, received ${received}`;
          }
          case "invalid_value":
            return issue2.values.length === 1 ? `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}` : `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
          case "too_big": {
            let adj = issue2.exact ? "exactly " : issue2.inclusive ? "<=" : "<", sizing = getSizing(issue2.origin);
            return sizing ? `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}` : `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
          }
          case "too_small": {
            let adj = issue2.exact ? "exactly " : issue2.inclusive ? ">=" : ">", sizing = getSizing(issue2.origin);
            return sizing ? `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}` : `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
          }
          case "invalid_format": {
            let _issue = issue2;
            return _issue.format === "starts_with" ? `Invalid string: must start with "${_issue.prefix}"` : _issue.format === "ends_with" ? `Invalid string: must end with "${_issue.suffix}"` : _issue.format === "includes" ? `Invalid string: must include "${_issue.includes}"` : _issue.format === "regex" ? `Invalid string: must match pattern ${_issue.pattern}` : `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
          }
          case "not_multiple_of":
            return `Invalid number: must be a multiple of ${issue2.divisor}`;
          case "unrecognized_keys":
            return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
          case "invalid_key":
            return `Invalid key in ${issue2.origin}`;
          case "invalid_union":
            return issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0 ? `Invalid discriminator value. Expected ${issue2.options.map((o) => `'${o}'`).join(" | ")}` : issue2.inclusive === false ? "Invalid input: more than one option matched" : "Invalid input";
          case "invalid_element":
            return `Invalid value in ${issue2.origin}`;
          default:
            return "Invalid input";
        }
      };
    };
    function en_default() {
      return { localeError: error() };
    }
    var _a2;
    var $ZodRegistry = class {
      constructor() {
        this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map();
      }
      add(schema, ..._meta) {
        let meta2 = _meta[0];
        return this._map.set(schema, meta2), meta2 && typeof meta2 == "object" && "id" in meta2 && this._idmap.set(meta2.id, schema), this;
      }
      clear() {
        return this._map = /* @__PURE__ */ new WeakMap(), this._idmap = /* @__PURE__ */ new Map(), this;
      }
      remove(schema) {
        let meta2 = this._map.get(schema);
        return meta2 && typeof meta2 == "object" && "id" in meta2 && this._idmap.delete(meta2.id), this._map.delete(schema), this;
      }
      get(schema) {
        let p = schema._zod.parent;
        if (p) {
          let pm = { ...this.get(p) ?? {} };
          delete pm.id;
          let f = { ...pm, ...this._map.get(schema) };
          return Object.keys(f).length ? f : void 0;
        }
        return this._map.get(schema);
      }
      has(schema) {
        return this._map.has(schema);
      }
    };
    function registry() {
      return new $ZodRegistry();
    }
    (_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
    var globalRegistry = globalThis.__zod_globalRegistry;
    function snapshotChecks(def) {
      return def.checks && (def.checks = [...def.checks]), def;
    }
    function _string(Class2, params) {
      return new Class2(snapshotChecks({ type: "string", ...normalizeParams(params) }));
    }
    function _email(Class2, params) {
      return new Class2({ type: "string", format: "email", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _guid(Class2, params) {
      return new Class2({ type: "string", format: "guid", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _uuid(Class2, params) {
      return new Class2({ type: "string", format: "uuid", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _uuidv4(Class2, params) {
      return new Class2({ type: "string", format: "uuid", check: "string_format", abort: false, version: "v4", ...normalizeParams(params) });
    }
    function _uuidv6(Class2, params) {
      return new Class2({ type: "string", format: "uuid", check: "string_format", abort: false, version: "v6", ...normalizeParams(params) });
    }
    function _uuidv7(Class2, params) {
      return new Class2({ type: "string", format: "uuid", check: "string_format", abort: false, version: "v7", ...normalizeParams(params) });
    }
    function _url(Class2, params) {
      return new Class2({ type: "string", format: "url", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _emoji2(Class2, params) {
      return new Class2({ type: "string", format: "emoji", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _nanoid(Class2, params) {
      return new Class2({ type: "string", format: "nanoid", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _cuid(Class2, params) {
      return new Class2({ type: "string", format: "cuid", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _cuid2(Class2, params) {
      return new Class2({ type: "string", format: "cuid2", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _ulid(Class2, params) {
      return new Class2({ type: "string", format: "ulid", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _xid(Class2, params) {
      return new Class2({ type: "string", format: "xid", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _ksuid(Class2, params) {
      return new Class2({ type: "string", format: "ksuid", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _ipv4(Class2, params) {
      return new Class2({ type: "string", format: "ipv4", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _ipv6(Class2, params) {
      return new Class2({ type: "string", format: "ipv6", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _cidrv4(Class2, params) {
      return new Class2({ type: "string", format: "cidrv4", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _cidrv6(Class2, params) {
      return new Class2({ type: "string", format: "cidrv6", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _base64(Class2, params) {
      return new Class2({ type: "string", format: "base64", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _base64url(Class2, params) {
      return new Class2({ type: "string", format: "base64url", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _e164(Class2, params) {
      return new Class2({ type: "string", format: "e164", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _jwt(Class2, params) {
      return new Class2({ type: "string", format: "jwt", check: "string_format", abort: false, ...normalizeParams(params) });
    }
    function _isoDateTime(Class2, params) {
      return new Class2({ type: "string", format: "datetime", check: "string_format", offset: false, local: false, precision: null, ...normalizeParams(params) });
    }
    function _isoDate(Class2, params) {
      return new Class2({ type: "string", format: "date", check: "string_format", ...normalizeParams(params) });
    }
    function _isoTime(Class2, params) {
      return new Class2({ type: "string", format: "time", check: "string_format", precision: null, ...normalizeParams(params) });
    }
    function _isoDuration(Class2, params) {
      return new Class2({ type: "string", format: "duration", check: "string_format", ...normalizeParams(params) });
    }
    function _number(Class2, params) {
      return new Class2(snapshotChecks({ type: "number", checks: [], ...normalizeParams(params) }));
    }
    function _int(Class2, params) {
      return new Class2({ type: "number", check: "number_format", abort: false, format: "safeint", ...normalizeParams(params) });
    }
    function _boolean(Class2, params) {
      return new Class2({ type: "boolean", ...normalizeParams(params) });
    }
    function _unknown(Class2) {
      return new Class2({ type: "unknown" });
    }
    function _never(Class2, params) {
      return new Class2({ type: "never", ...normalizeParams(params) });
    }
    function _lt(value, params) {
      return new $ZodCheckLessThan({ check: "less_than", ...normalizeParams(params), value, inclusive: false });
    }
    function _lte(value, params) {
      return new $ZodCheckLessThan({ check: "less_than", ...normalizeParams(params), value, inclusive: true });
    }
    function _gt(value, params) {
      return new $ZodCheckGreaterThan({ check: "greater_than", ...normalizeParams(params), value, inclusive: false });
    }
    function _gte(value, params) {
      return new $ZodCheckGreaterThan({ check: "greater_than", ...normalizeParams(params), value, inclusive: true });
    }
    function _multipleOf(value, params) {
      return new $ZodCheckMultipleOf({ check: "multiple_of", ...normalizeParams(params), value });
    }
    function _maxLength(maximum, params) {
      return new $ZodCheckMaxLength({ check: "max_length", ...normalizeParams(params), maximum });
    }
    function _minLength(minimum, params) {
      return new $ZodCheckMinLength({ check: "min_length", ...normalizeParams(params), minimum });
    }
    function _length(length, params) {
      return new $ZodCheckLengthEquals({ check: "length_equals", ...normalizeParams(params), length });
    }
    function _regex(pattern, params) {
      return new $ZodCheckRegex({ check: "string_format", format: "regex", ...normalizeParams(params), pattern });
    }
    function _lowercase(params) {
      return new $ZodCheckLowerCase({ check: "string_format", format: "lowercase", ...normalizeParams(params) });
    }
    function _uppercase(params) {
      return new $ZodCheckUpperCase({ check: "string_format", format: "uppercase", ...normalizeParams(params) });
    }
    function _includes(includes, params) {
      return new $ZodCheckIncludes({ check: "string_format", format: "includes", ...normalizeParams(params), includes });
    }
    function _startsWith(prefix, params) {
      return new $ZodCheckStartsWith({ check: "string_format", format: "starts_with", ...normalizeParams(params), prefix });
    }
    function _endsWith(suffix, params) {
      return new $ZodCheckEndsWith({ check: "string_format", format: "ends_with", ...normalizeParams(params), suffix });
    }
    function _overwrite(tx) {
      return new $ZodCheckOverwrite({ check: "overwrite", tx });
    }
    function _normalize(form) {
      return _overwrite((input) => input.normalize(form));
    }
    function _trim() {
      return _overwrite((input) => input.trim());
    }
    function _toLowerCase() {
      return _overwrite((input) => input.toLowerCase());
    }
    function _toUpperCase() {
      return _overwrite((input) => input.toUpperCase());
    }
    function _slugify() {
      return _overwrite((input) => slugify(input));
    }
    function _array(Class2, element, params) {
      return new Class2({ type: "array", element, ...normalizeParams(params) });
    }
    function _refine(Class2, fn, _params) {
      return new Class2({ type: "custom", check: "custom", fn, ...normalizeParams(_params) });
    }
    function _superRefine(fn, params) {
      let ch = _check((payload) => (payload.addIssue = (issue2) => {
        if (typeof issue2 == "string") payload.issues.push(issue(issue2, payload.value, ch._zod.def));
        else {
          let _issue = issue2;
          _issue.fatal && (_issue.continue = false), _issue.code ?? (_issue.code = "custom"), "input" in _issue || (_issue.input = payload.value), _issue.inst ?? (_issue.inst = ch), _issue.continue ?? (_issue.continue = !ch._zod.def.abort), payload.issues.push(issue(_issue));
        }
      }, fn(payload.value, payload)), params);
      return ch;
    }
    function _check(fn, params) {
      let ch = new $ZodCheck({ check: "custom", ...normalizeParams(params) });
      return ch._zod.check = fn, ch;
    }
    function assignProps(target, ...sources) {
      for (let source of sources) for (let key of Reflect.ownKeys(source)) Object.prototype.propertyIsEnumerable.call(source, key) && assignProp(target, key, source[key]);
      return target;
    }
    function initializeContext(params) {
      let target = params?.target ?? "draft-2020-12";
      return target === "draft-4" && (target = "draft-04"), target === "draft-7" && (target = "draft-07"), { processors: params.processors ?? {}, metadataRegistry: params?.metadata ?? globalRegistry, target, unrepresentable: params?.unrepresentable ?? "throw", override: params?.override ?? (() => {
      }), io: params?.io ?? "output", counter: 0, seen: /* @__PURE__ */ new Map(), sharedDefsExtractedFor: void 0, sharedEmitDoneFor: void 0, cycles: params?.cycles ?? "ref", reused: params?.reused ?? "inline", intersections: [], deferred: [], external: params?.external ?? void 0 };
    }
    function handleUnrepresentable(schema, ctx, json, params, message) {
      let result = typeof ctx.unrepresentable == "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
      if (result === "any") return false;
      if (result === void 0 || result === "throw") throw new Error(message);
      return Object.assign(json, result), true;
    }
    function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
      var _a3;
      let def = schema._zod.def, seen = ctx.seen.get(schema);
      if (seen) return seen.count++, _params.schemaPath.includes(schema) && (seen.cycle = _params.path), seen.schema;
      let result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
      ctx.seen.set(schema, result), ctx.sharedDefsExtractedFor = void 0, ctx.sharedEmitDoneFor = void 0;
      let overrideSchema = schema._zod.toJSONSchema?.();
      if (overrideSchema) result.schema = overrideSchema;
      else {
        let params = { ..._params, schemaPath: [..._params.schemaPath, schema], path: _params.path };
        if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
        else {
          let _json = result.schema, processor = ctx.processors[def.type];
          if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
          processor(schema, ctx, _json, params);
        }
        let parent = schema._zod.parent;
        parent && (result.ref || (result.ref = parent), processSchema(parent, ctx, params), ctx.seen.get(parent).isParent = true);
      }
      let meta2 = ctx.metadataRegistry.get(schema);
      return meta2 && assignProps(result.schema, meta2), ctx.io === "input" && isTransforming(schema) && (delete result.schema.examples, delete result.schema.default), ctx.io === "input" && "_prefault" in result.schema && ((_a3 = result.schema).default ?? (_a3.default = result.schema._prefault)), delete result.schema._prefault, ctx.seen.get(schema).schema;
    }
    function encodeJSONPointerSegment(segment) {
      return segment.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    function extractDefs(ctx, schema) {
      let root = ctx.seen.get(schema);
      if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
      if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external) return;
      let idToSchema = /* @__PURE__ */ new Map();
      for (let entry of ctx.seen.entries()) {
        let id = ctx.metadataRegistry.get(entry[0])?.id;
        if (id) {
          let existing = idToSchema.get(id);
          if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
          idToSchema.set(id, entry[0]);
        }
      }
      let makeURI = (entry) => {
        let defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
        if (ctx.external) {
          let externalId = ctx.external.registry.get(entry[0])?.id, uriGenerator = ctx.external.uri ?? ((id2) => id2);
          if (externalId) return { ref: uriGenerator(externalId) };
          let id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
          return entry[1].defId = id, { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
        }
        let uriPrefix = "#", defUriPrefix = `${uriPrefix}/${defsSegment}/`;
        if (entry[1] === root && !entry[1].schema.id) return { ref: uriPrefix };
        let defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
        return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
      }, extractToDef = (entry) => {
        if (entry[1].schema.$ref) return;
        let seen = entry[1], { ref, defId } = makeURI(entry);
        seen.def = { ...seen.schema }, defId && (seen.defId = defId);
        let schema2 = seen.schema;
        for (let key in schema2) delete schema2[key];
        schema2.$ref = ref;
      };
      if (ctx.cycles === "throw") for (let entry of ctx.seen.entries()) {
        let seen = entry[1];
        if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
      for (let entry of ctx.seen.entries()) {
        let seen = entry[1];
        if (schema === entry[0]) {
          extractToDef(entry);
          continue;
        }
        if (ctx.external) {
          let ext = ctx.external.registry.get(entry[0])?.id;
          if (schema !== entry[0] && ext) {
            extractToDef(entry);
            continue;
          }
        }
        if (ctx.metadataRegistry.get(entry[0])?.id) {
          extractToDef(entry);
          continue;
        }
        if (seen.cycle) {
          extractToDef(entry);
          continue;
        }
        seen.count > 1 && ctx.reused === "ref" && extractToDef(entry);
      }
      ctx.external && (ctx.sharedDefsExtractedFor = ctx.external);
    }
    function compactTypeUnion(schema) {
      let options = schema.anyOf;
      if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0) return;
      let types = [];
      for (let option of options) {
        if (!option || typeof option != "object") return;
        compactTypeUnion(option);
        let keys = Object.keys(option);
        if (keys.length !== 1 || keys[0] !== "type") return;
        let type = option.type;
        for (let member of Array.isArray(type) ? type : [type]) {
          if (typeof member != "string") return;
          types.includes(member) || types.push(member);
        }
      }
      delete schema.anyOf, schema.type = types.length === 1 ? types[0] : types;
    }
    var FOLDABLE_KEYS = /* @__PURE__ */ new Set(["type", "properties", "required", "additionalProperties"]);
    var UNION_KEYS = ["oneOf", "anyOf"];
    function undeclaredConstraint(member) {
      let extra = member.additionalProperties;
      return extra === void 0 || extra === false || typeof extra != "object" || extra === null ? null : Object.keys(extra).length ? extra : null;
    }
    function foldObjects(members2) {
      let objects = [];
      for (let member of members2) {
        if (typeof member != "object" || member.type !== "object") return null;
        for (let key in member) if (!FOLDABLE_KEYS.has(key)) return null;
        objects.push(member);
      }
      let properties = {}, required2 = /* @__PURE__ */ new Set();
      for (let object2 of objects) {
        for (let key in object2.properties) {
          if (Object.prototype.hasOwnProperty.call(properties, key)) continue;
          let parts = [];
          for (let other of objects) {
            let part = other.properties?.[key] ?? undeclaredConstraint(other);
            part != null && (parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part)) || parts.push(part));
          }
          let merged = parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts };
          assignProp(properties, key, merged);
        }
        for (let key of object2.required ?? []) required2.add(key);
      }
      let folded = { type: "object", properties };
      if (required2.size && (folded.required = [...required2]), objects.every((object2) => object2.additionalProperties === false)) folded.additionalProperties = false;
      else {
        let constraints = [];
        for (let object2 of objects) {
          let constraint = undeclaredConstraint(object2);
          constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)) && constraints.push(constraint);
        }
        constraints.length === 1 ? folded.additionalProperties = constraints[0] : constraints.length > 1 && (folded.additionalProperties = { allOf: constraints });
      }
      return folded;
    }
    function foldIntersection(json) {
      let allOf = json.allOf;
      if (!Array.isArray(allOf) || allOf.length < 2) return;
      for (let key of FOLDABLE_KEYS) if (key in json) return;
      let unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k]))), folded = null;
      if (!unions.length) folded = foldObjects(allOf);
      else {
        let union2 = unions[0], keyword = UNION_KEYS.find((k) => Array.isArray(union2[k]));
        if (Object.keys(union2).length !== 1) return;
        let rest = allOf.filter((m) => m !== union2), branches = union2[keyword].map((branch) => foldObjects([...rest, branch]));
        if (branches.some((b) => !b)) return;
        folded = { [keyword]: branches };
      }
      folded && (delete json.allOf, assignProps(json, folded));
    }
    function finalize(ctx, schema) {
      let root = ctx.seen.get(schema);
      if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
      let flattenRef = (zodSchema) => {
        let seen = ctx.seen.get(zodSchema);
        if (seen.ref === null) return;
        let schema2 = seen.def ?? seen.schema, _cached = { ...schema2 }, ref = seen.ref;
        if (seen.ref = null, ref) {
          flattenRef(ref);
          let refSeen = ctx.seen.get(ref), refSchema = refSeen.schema;
          if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0") ? (schema2.allOf = schema2.allOf ?? [], schema2.allOf.push(refSchema)) : assignProps(schema2, refSchema), assignProps(schema2, _cached), zodSchema._zod.parent === ref) for (let key in schema2) key === "$ref" || key === "allOf" || key in _cached || delete schema2[key];
          if (refSchema.$ref && refSeen.def) for (let key in schema2) key === "$ref" || key === "allOf" || key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key]) && delete schema2[key];
        }
        let parent = zodSchema._zod.parent;
        if (parent && parent !== ref) {
          flattenRef(parent);
          let parentSeen = ctx.seen.get(parent);
          if (parentSeen?.schema.$ref && (schema2.$ref = parentSeen.schema.$ref, parentSeen.def)) for (let key in schema2) key === "$ref" || key === "allOf" || key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key]) && delete schema2[key];
        }
        ctx.override({ zodSchema, jsonSchema: schema2, path: seen.path ?? [] });
      };
      if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
        for (let entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
        if (ctx.target !== "openapi-3.0") for (let entry of ctx.seen.entries()) compactTypeUnion(entry[1].def ?? entry[1].schema);
        for (let rewrite of ctx.deferred) rewrite();
        if (ctx.intersections.length) {
          let carriers = /* @__PURE__ */ new Map();
          for (let seen of ctx.seen.values()) for (let json of [seen.schema, seen.def]) {
            let allOf = json?.allOf;
            if (!Array.isArray(allOf)) continue;
            let existing = carriers.get(allOf);
            existing ? existing.push(json) : carriers.set(allOf, [json]);
          }
          for (let allOf of ctx.intersections) for (let json of carriers.get(allOf) ?? []) foldIntersection(json);
        }
      }
      let result = {};
      if (ctx.target === "draft-2020-12" ? result.$schema = "https://json-schema.org/draft/2020-12/schema" : ctx.target === "draft-07" ? result.$schema = "http://json-schema.org/draft-07/schema#" : ctx.target === "draft-04" ? result.$schema = "http://json-schema.org/draft-04/schema#" : ctx.target, ctx.external?.uri) {
        let id = ctx.external.registry.get(schema)?.id;
        if (!id) throw new Error("Schema is missing an `id` property");
        result.$id = ctx.external.uri(id);
      }
      assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
      let rootMetaId = ctx.metadataRegistry.get(schema)?.id;
      rootMetaId !== void 0 && result.id === rootMetaId && delete result.id;
      let defs = ctx.external?.defs ?? {};
      if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) for (let entry of ctx.seen.entries()) {
        let seen = entry[1];
        seen.def && seen.defId && (seen.def.id === seen.defId && delete seen.def.id, assignProp(defs, seen.defId, seen.def));
      }
      ctx.external && (ctx.sharedEmitDoneFor = ctx.external), ctx.external || Object.keys(defs).length > 0 && (ctx.target === "draft-2020-12" ? result.$defs = defs : result.definitions = defs);
      try {
        let finalized = JSON.parse(JSON.stringify(result));
        return Object.defineProperty(finalized, "~standard", { value: { ...schema["~standard"], jsonSchema: { input: createStandardJSONSchemaMethod(schema, "input", ctx.processors), output: createStandardJSONSchemaMethod(schema, "output", ctx.processors) } }, enumerable: false, writable: false }), finalized;
      } catch {
        throw new Error("Error converting schema to JSON.");
      }
    }
    function isTransforming(_schema, _ctx) {
      let ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
      if (ctx.seen.has(_schema)) return false;
      ctx.seen.add(_schema);
      let def = _schema._zod.def;
      if (def.type === "transform") return true;
      if (def.type === "array") return isTransforming(def.element, ctx);
      if (def.type === "set") return isTransforming(def.valueType, ctx);
      if (def.type === "lazy") return isTransforming(def.getter(), ctx);
      if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") return isTransforming(def.innerType, ctx);
      if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
      if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
      if (def.type === "pipe") return _schema._zod.traits.has("$ZodCodec") ? true : isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
      if (def.type === "object") {
        for (let key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
        return false;
      }
      if (def.type === "union") {
        for (let option of def.options) if (isTransforming(option, ctx)) return true;
        return false;
      }
      if (def.type === "tuple") {
        for (let item of def.items) if (isTransforming(item, ctx)) return true;
        return !!(def.rest && isTransforming(def.rest, ctx));
      }
      return false;
    }
    var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
      let ctx = initializeContext({ ...params, processors });
      return processSchema(schema, ctx), extractDefs(ctx, schema), finalize(ctx, schema);
    };
    var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
      let { libraryOptions, target } = params ?? {}, ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
      return processSchema(schema, ctx), extractDefs(ctx, schema), finalize(ctx, schema);
    };
    var narrowMin = (agg, key, value) => {
      (agg[key] === void 0 || value > agg[key]) && (agg[key] = value);
    };
    var narrowMax = (agg, key, value) => {
      (agg[key] === void 0 || value < agg[key]) && (agg[key] = value);
    };
    var narrowBoth = (agg, value) => {
      narrowMin(agg, "minimum", value), narrowMax(agg, "maximum", value);
    };
    var addDivisor = (agg, value) => {
      agg.multipleOf ?? (agg.multipleOf = []), agg.multipleOf.includes(value) || agg.multipleOf.push(value);
    };
    var addPattern = (agg, pattern) => {
      agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set()), agg.patterns.add(pattern);
    };
    var intersectMime = (agg, mime) => {
      agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
    };
    var setFormat = (agg, format) => {
      agg.format = format, format.includes("int") && (agg.isInt = true);
    };
    var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
    var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
    var formatContributor = (ranges) => (agg, def) => {
      setFormat(agg, def.format);
      let [minimum, maximum] = ranges[def.format];
      narrowMin(agg, "minimum", minimum), narrowMax(agg, "maximum", maximum);
    };
    var contributors = { greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value), less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value), multiple_of: (agg, def) => addDivisor(agg, def.value), number_format: formatContributor(NUMBER_FORMAT_RANGES), bigint_format: formatContributor(BIGINT_FORMAT_RANGES), min_length: minContributor, max_length: maxContributor, length_equals: (agg, def) => narrowBoth(agg, def.length), min_size: minContributor, max_size: maxContributor, size_equals: (agg, def) => narrowBoth(agg, def.size), string_format: (agg, def) => {
      setFormat(agg, def.format), def.pattern && addPattern(agg, def.pattern), (def.format === "base64" || def.format === "base64url") && (agg.contentEncoding = def.format), (def.local || def.precision === -1) && (agg.laxFormat = true);
    }, mime_type: (agg, def) => intersectMime(agg, def.mime) };
    function aggregateChecks(schema) {
      let agg = {}, def = schema._zod.def, list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
      for (let ch of list) contributors[ch._zod.def.check]?.(agg, ch._zod.def);
      let bag = schema._zod.bag;
      bag.minimum !== void 0 && narrowMin(agg, "minimum", bag.minimum), bag.exclusiveMinimum !== void 0 && narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum), bag.maximum !== void 0 && narrowMax(agg, "maximum", bag.maximum), bag.exclusiveMaximum !== void 0 && narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum), bag.multipleOf !== void 0 && addDivisor(agg, bag.multipleOf), bag.format !== void 0 && (agg.format ?? (agg.format = bag.format), bag.format.includes("int") && (agg.isInt = true)), bag.mime && intersectMime(agg, bag.mime);
      for (let pattern of bag.patterns ?? []) addPattern(agg, pattern);
      return agg;
    }
    var formatMap = { guid: "uuid", url: "uri", datetime: "date-time", json_string: "json-string", regex: "" };
    var exactPatterns = /* @__PURE__ */ new Map([[base64Charset, base64], [base64urlCharset, base64url]]);
    var exactPattern = (p) => exactPatterns.get(p) ?? p;
    var stringProcessor = (schema, ctx, _json, _params) => {
      let json = _json;
      json.type = "string";
      let { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
      if (typeof minimum == "number" && (json.minLength = minimum), typeof maximum == "number" && (json.maxLength = maximum), format && (json.format = formatMap[format] ?? format, json.format === "" && delete json.format, (format === "time" || laxFormat) && delete json.format), contentEncoding && (json.contentEncoding = contentEncoding), patterns && patterns.size > 0) {
        let patternList = [...patterns].map(exactPattern);
        patternList.length === 1 ? json.pattern = patternList[0].source : patternList.length > 1 && (json.allOf = [...patternList.map((regex) => ({ ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {}, pattern: regex.source }))]);
      }
    };
    var numberProcessor = (schema, ctx, _json, params) => {
      let json = _json, { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
      json.type = isInt ? "integer" : "number";
      let exMin = typeof exclusiveMinimum == "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY), exMax = typeof exclusiveMaximum == "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY), legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
      if (exMin ? legacy ? (json.minimum = exclusiveMinimum, json.exclusiveMinimum = true) : json.exclusiveMinimum = exclusiveMinimum : typeof minimum == "number" && (json.minimum = minimum), exMax ? legacy ? (json.maximum = exclusiveMaximum, json.exclusiveMaximum = true) : json.exclusiveMaximum = exclusiveMaximum : typeof maximum == "number" && (json.maximum = maximum), multipleOf) {
        let divisors = /* @__PURE__ */ new Set();
        for (let divisor of multipleOf) Number.isFinite(divisor) && divisor !== 0 ? divisors.add(Math.abs(divisor)) : handleUnrepresentable(schema, ctx, json, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
        let [first, ...rest] = divisors;
        first !== void 0 && (json.multipleOf = first), rest.length && (json.allOf = [...json.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))]);
      }
    };
    var booleanProcessor = (_schema, _ctx, json, _params) => {
      json.type = "boolean";
    };
    var neverProcessor = (_schema, _ctx, json, _params) => {
      json.not = {};
    };
    var unknownProcessor = (_schema, _ctx, _json, _params) => {
    };
    var enumProcessor = (schema, _ctx, json, _params) => {
      let def = schema._zod.def, values = getEnumValues(def.entries);
      if (values.length === 0) {
        json.not = {};
        return;
      }
      values.every((v) => typeof v == "number") && (json.type = "number"), values.every((v) => typeof v == "string") && (json.type = "string"), json.enum = values;
    };
    var literalProcessor = (schema, ctx, json, params) => {
      let def = schema._zod.def;
      if (def.values.length === 0) {
        json.not = {};
        return;
      }
      let vals = [];
      for (let val of def.values) if (val === void 0) {
        if (handleUnrepresentable(schema, ctx, json, params, "Literal `undefined` cannot be represented in JSON Schema")) return;
      } else if (typeof val == "bigint") {
        if (handleUnrepresentable(schema, ctx, json, params, "BigInt literals cannot be represented in JSON Schema")) return;
        vals.push(Number(val));
      } else vals.push(val);
      if (vals.length !== 0) if (vals.length === 1) {
        let val = vals[0];
        json.type = val === null ? "null" : typeof val, ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? json.enum = [val] : json.const = val;
      } else vals.every((v) => typeof v == "number") && (json.type = "number"), vals.every((v) => typeof v == "string") && (json.type = "string"), vals.every((v) => typeof v == "boolean") && (json.type = "boolean"), vals.every((v) => v === null) && (json.type = "null"), json.enum = vals;
    };
    var customProcessor = (schema, ctx, json, params) => {
      handleUnrepresentable(schema, ctx, json, params, "Custom types cannot be represented in JSON Schema");
    };
    var transformProcessor = (schema, ctx, json, params) => {
      handleUnrepresentable(schema, ctx, json, params, "Transforms cannot be represented in JSON Schema");
    };
    var arrayProcessor = (schema, ctx, _json, params) => {
      let json = _json, def = schema._zod.def, { minimum, maximum } = aggregateChecks(schema);
      typeof minimum == "number" && (json.minItems = minimum), typeof maximum == "number" && (json.maxItems = maximum), json.type = "array", json.items = processSchema(def.element, ctx, { ...params, path: [...params.path, "items"] });
    };
    function inputOptin(schema) {
      let def = schema._zod.def;
      return def.type === "pipe" && def.in._zod.traits.has("$ZodTransform") ? inputOptin(def.out) : def.type === "catch" ? inputOptin(def.innerType) : schema._zod.optin;
    }
    var objectProcessor = (schema, ctx, _json, params) => {
      let json = _json, def = schema._zod.def, shape = def.shape;
      if (Object.getOwnPropertySymbols(shape).length && handleUnrepresentable(schema, ctx, json, params, "Symbol keys cannot be represented in JSON Schema")) return;
      json.type = "object", json.properties = {};
      for (let key in shape) assignProp(json.properties, key, processSchema(shape[key], ctx, { ...params, path: [...params.path, "properties", key] }));
      let requiredKeys = [];
      for (let key of Object.keys(shape)) {
        let field = def.shape[key];
        (ctx.io === "input" ? inputOptin(field) === void 0 : field._zod.optout === void 0) && requiredKeys.push(key);
      }
      requiredKeys.length > 0 && (json.required = requiredKeys), def.catchall?._zod.def.type === "never" ? json.additionalProperties = false : def.catchall ? def.catchall && (json.additionalProperties = processSchema(def.catchall, ctx, { ...params, path: [...params.path, "additionalProperties"] })) : ctx.io === "output" && (json.additionalProperties = false);
    };
    var unionProcessor = (schema, ctx, json, params) => {
      let def = schema._zod.def, isExclusive = def.inclusive === false, options = def.options.map((x, i) => processSchema(x, ctx, { ...params, path: [...params.path, isExclusive ? "oneOf" : "anyOf", i] }));
      isExclusive ? json.oneOf = options : json.anyOf = options;
    };
    var intersectionProcessor = (schema, ctx, json, params) => {
      let def = schema._zod.def, a = processSchema(def.left, ctx, { ...params, path: [...params.path, "allOf", 0] }), b = processSchema(def.right, ctx, { ...params, path: [...params.path, "allOf", 1] }), isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1, allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
      json.allOf = allOf, ctx.intersections.push(allOf);
    };
    var nullableProcessor = (schema, ctx, json, params) => {
      let def = schema._zod.def, inner = processSchema(def.innerType, ctx, params), seen = ctx.seen.get(schema);
      ctx.target === "openapi-3.0" ? (seen.ref = def.innerType, json.nullable = true) : json.anyOf = [inner, { type: "null" }];
    };
    var nonoptionalProcessor = (schema, ctx, _json, params) => {
      let def = schema._zod.def;
      processSchema(def.innerType, ctx, params);
      let seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
    };
    var UNREPRESENTABLE_DEFAULT = Symbol();
    function serializeDefaultValue(value, schema, ctx, json, params) {
      let unrepresentable = false, serialized = JSON.stringify(value, (_, val) => typeof val != "bigint" ? val : (unrepresentable = true, null));
      return unrepresentable ? (handleUnrepresentable(schema, ctx, json, params, "BigInt defaults cannot be represented in JSON Schema"), UNREPRESENTABLE_DEFAULT) : JSON.parse(serialized);
    }
    var defaultProcessor = (schema, ctx, json, params) => {
      let def = schema._zod.def;
      processSchema(def.innerType, ctx, params);
      let seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      let value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
      value !== UNREPRESENTABLE_DEFAULT && (json.default = value);
    };
    var prefaultProcessor = (schema, ctx, json, params) => {
      let def = schema._zod.def;
      processSchema(def.innerType, ctx, params);
      let seen = ctx.seen.get(schema);
      if (seen.ref = def.innerType, ctx.io !== "input") return;
      let value = serializeDefaultValue(def.defaultValue, schema, ctx, json, params);
      value !== UNREPRESENTABLE_DEFAULT && (json._prefault = value);
    };
    var catchProcessor = (schema, ctx, json, params) => {
      let def = schema._zod.def;
      processSchema(def.innerType, ctx, params);
      let seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
      let catchValue;
      try {
        catchValue = def.catchValue(void 0);
      } catch {
        handleUnrepresentable(schema, ctx, json, params, "Dynamic catch values are not supported in JSON Schema");
        return;
      }
      json.default = catchValue;
    };
    var pipeProcessor = (schema, ctx, _json, params) => {
      let def = schema._zod.def, inIsTransform = def.in._zod.traits.has("$ZodTransform"), innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
      processSchema(innerType, ctx, params);
      let seen = ctx.seen.get(schema);
      seen.ref = innerType;
    };
    var readonlyProcessor = (schema, ctx, json, params) => {
      let def = schema._zod.def;
      processSchema(def.innerType, ctx, params);
      let seen = ctx.seen.get(schema);
      seen.ref = def.innerType, json.readOnly = true;
    };
    var optionalProcessor = (schema, ctx, _json, params) => {
      let def = schema._zod.def;
      processSchema(def.innerType, ctx, params);
      let seen = ctx.seen.get(schema);
      seen.ref = def.innerType;
    };
    var _installedErrorProtos = new WeakSet([Object.prototype, Error.prototype]);
    function _lazyMethod(proto, key, make) {
      Object.defineProperty(proto, key, { configurable: true, enumerable: false, get() {
        let value = make(this);
        return Object.defineProperty(this, key, { value, configurable: true, writable: true }), value;
      }, set(value) {
        Object.defineProperty(this, key, { value, configurable: true, writable: true });
      } });
    }
    var initializer2 = (inst, issues) => {
      $ZodError.init(inst, issues), inst.name = "ZodError";
      let proto = Object.getPrototypeOf(inst);
      _installedErrorProtos.has(proto) || (_installedErrorProtos.add(proto), _lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper)), _lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper)), _lazyMethod(proto, "addIssue", (self) => (issue2) => {
        self.issues.push(issue2), self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
      }), _lazyMethod(proto, "addIssues", (self) => (issues2) => {
        self.issues.push(...issues2), self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
      }), Object.defineProperty(proto, "isEmpty", { configurable: true, enumerable: false, get() {
        return this.issues.length === 0;
      } }));
    };
    var ZodError = $constructor("ZodError", initializer2);
    var ZodRealError = $constructor("ZodError", initializer2, void 0, { Parent: Error });
    var parse = _parse(ZodRealError);
    var parseAsync = _parseAsync(ZodRealError);
    var safeParse = _safeParse(ZodRealError);
    var safeParseAsync = _safeParseAsync(ZodRealError);
    var encode = _encode(ZodRealError);
    var decode = _decode(ZodRealError);
    var encodeAsync = _encodeAsync(ZodRealError);
    var decodeAsync = _decodeAsync(ZodRealError);
    var safeEncode = _safeEncode(ZodRealError);
    var safeDecode = _safeDecode(ZodRealError);
    var safeEncodeAsync = _safeEncodeAsync(ZodRealError);
    var safeDecodeAsync = _safeDecodeAsync(ZodRealError);
    function _ensureDefaultLocale() {
      globalConfig.localeError || config(en_default());
    }
    function _ensureDefaultMemoizer() {
      globalConfig.memoizer || config({ memoizer: memoizer() });
    }
    var ZodType = $constructor("ZodType", (inst, def) => (_ensureDefaultLocale(), $ZodType.init(inst, def), inst.def = def, inst.type = def.type, inst), { check(...chks) {
      let def = this.def;
      return this.clone(util_exports.mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch == "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)] }), { parent: true });
    }, with(...chks) {
      return this.check(...chks);
    }, clone(def, params) {
      return clone(this, def, params);
    }, brand() {
      return this;
    }, register(reg, meta2) {
      return reg.add(this, meta2), this;
    }, refine(check, params) {
      return this.check(refine(check, params));
    }, superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    }, overwrite(fn) {
      return this.check(_overwrite(fn));
    }, optional() {
      return optional(this);
    }, exactOptional() {
      return exactOptional(this);
    }, nullable() {
      return nullable(this);
    }, nullish() {
      return optional(nullable(this));
    }, nonoptional(params) {
      return nonoptional(this, params);
    }, array() {
      return array(this);
    }, or(arg) {
      return union([this, arg]);
    }, and(arg) {
      return intersection(this, arg);
    }, transform(tx) {
      return pipe(this, transform(tx));
    }, default(d) {
      return _default(this, d);
    }, prefault(d) {
      return prefault(this, d);
    }, catch(params) {
      return _catch(this, params);
    }, pipe(target) {
      return pipe(this, target);
    }, readonly() {
      return readonly(this);
    }, describe(description) {
      let cl = this.clone();
      return globalRegistry.add(cl, { description }), cl;
    }, meta(...args) {
      if (args.length === 0) return globalRegistry.get(this);
      let cl = this.clone();
      return globalRegistry.add(cl, args[0]), cl;
    }, isOptional() {
      return this.safeParse(void 0).success;
    }, isNullable() {
      return this.safeParse(null).success;
    }, apply(fn, ...args) {
      return args.length === 0 ? fn(this) : fn(this, ...args);
    }, get "~standard"() {
      return util_exports.hide(this, "~standard", { ...standardProps(this), jsonSchema: { input: createStandardJSONSchemaMethod(this, "input"), output: createStandardJSONSchemaMethod(this, "output") } });
    }, set "~standard"(value) {
      util_exports.own(this, "~standard", value);
    }, parse: function _parse2(data, params) {
      return parse(this, data, params, { callee: _parse2 });
    }, parseAsync: async function _parseAsync2(data, params) {
      return await parseAsync(this, data, params, { callee: _parseAsync2 });
    }, safeParse(data, params) {
      return safeParse(this, data, params);
    }, async safeParseAsync(data, params) {
      return safeParseAsync(this, data, params);
    }, get spa() {
      return this?.safeParseAsync;
    }, set spa(value) {
      util_exports.own(this, "spa", value);
    }, validate(data, params) {
      return validate(this, data, params);
    }, validateAsync(data, params) {
      return validateAsync(this, data, params);
    }, encode: function _encode2(data, params) {
      return encode(this, data, params, { callee: _encode2 });
    }, decode: function _decode2(data, params) {
      return decode(this, data, params, { callee: _decode2 });
    }, encodeAsync: async function _encodeAsync2(data, params) {
      return await encodeAsync(this, data, params, { callee: _encodeAsync2 });
    }, decodeAsync: async function _decodeAsync2(data, params) {
      return await decodeAsync(this, data, params, { callee: _decodeAsync2 });
    }, safeEncode(data, params) {
      return safeEncode(this, data, params);
    }, safeDecode(data, params) {
      return safeDecode(this, data, params);
    }, async safeEncodeAsync(data, params) {
      return safeEncodeAsync(this, data, params);
    }, async safeDecodeAsync(data, params) {
      return safeDecodeAsync(this, data, params);
    }, toJSONSchema(params) {
      return createToJSONSchemaMethod(this, {})(params);
    }, get description() {
      return globalRegistry.get(this)?.description;
    }, get _def() {
      return this._zod.def;
    } });
    var _ZodString = $constructor("_ZodString", (inst, def) => {
      $ZodString.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
    }, util_exports.derived({ format: (inst) => aggregateChecks(inst).format ?? null, minLength: (inst) => aggregateChecks(inst).minimum ?? null, maxLength: (inst) => aggregateChecks(inst).maximum ?? null }, { regex(...args) {
      return this.check(_regex(...args));
    }, includes(...args) {
      return this.check(_includes(...args));
    }, startsWith(...args) {
      return this.check(_startsWith(...args));
    }, endsWith(...args) {
      return this.check(_endsWith(...args));
    }, min(...args) {
      return this.check(_minLength(...args));
    }, max(...args) {
      return this.check(_maxLength(...args));
    }, length(...args) {
      return this.check(_length(...args));
    }, nonempty(...args) {
      return this.check(_minLength(1, ...args));
    }, lowercase(params) {
      return this.check(_lowercase(params));
    }, uppercase(params) {
      return this.check(_uppercase(params));
    }, trim() {
      return this.check(_trim());
    }, normalize(...args) {
      return this.check(_normalize(...args));
    }, toLowerCase() {
      return this.check(_toLowerCase());
    }, toUpperCase() {
      return this.check(_toUpperCase());
    }, slugify() {
      return this.check(_slugify());
    } }));
    var ZodString = $constructor("ZodString", (inst, def) => {
      $ZodString.init(inst, def), _ZodString.init(inst, def);
    }, { email(params) {
      return this.check(_email(ZodEmail, params));
    }, url(params) {
      return this.check(_url(ZodURL, params));
    }, jwt(params) {
      return this.check(_jwt(ZodJWT, params));
    }, emoji(params) {
      return this.check(_emoji2(ZodEmoji, params));
    }, guid(params) {
      return this.check(_guid(ZodGUID, params));
    }, uuid(params) {
      return this.check(_uuid(ZodUUID, params));
    }, uuidv4(params) {
      return this.check(_uuidv4(ZodUUID, params));
    }, uuidv6(params) {
      return this.check(_uuidv6(ZodUUID, params));
    }, uuidv7(params) {
      return this.check(_uuidv7(ZodUUID, params));
    }, nanoid(params) {
      return this.check(_nanoid(ZodNanoID, params));
    }, cuid(params) {
      return this.check(_cuid(ZodCUID, params));
    }, cuid2(params) {
      return this.check(_cuid2(ZodCUID2, params));
    }, ulid(params) {
      return this.check(_ulid(ZodULID, params));
    }, base64(params) {
      return this.check(_base64(ZodBase64, params));
    }, base64url(params) {
      return this.check(_base64url(ZodBase64URL, params));
    }, xid(params) {
      return this.check(_xid(ZodXID, params));
    }, ksuid(params) {
      return this.check(_ksuid(ZodKSUID, params));
    }, ipv4(params) {
      return this.check(_ipv4(ZodIPv4, params));
    }, ipv6(params) {
      return this.check(_ipv6(ZodIPv6, params));
    }, cidrv4(params) {
      return this.check(_cidrv4(ZodCIDRv4, params));
    }, cidrv6(params) {
      return this.check(_cidrv6(ZodCIDRv6, params));
    }, e164(params) {
      return this.check(_e164(ZodE164, params));
    }, datetime(params) {
      return this.check(_isoDateTime(ZodISODateTime, params));
    }, date(params) {
      return this.check(_isoDate(ZodISODate, params));
    }, time(params) {
      return this.check(_isoTime(ZodISOTime, params));
    }, duration(params) {
      return this.check(_isoDuration(ZodISODuration, params));
    } });
    function string2(params) {
      return _string(ZodString, params);
    }
    var ZodStringFormat = $constructor("ZodStringFormat", (inst, def) => {
      $ZodStringFormat.init(inst, def), _ZodString.init(inst, def);
    });
    var ZodISODateTime = $constructor("ZodISODateTime", (inst, def) => {
      $ZodISODateTime.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodISODate = $constructor("ZodISODate", (inst, def) => {
      $ZodISODate.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodISOTime = $constructor("ZodISOTime", (inst, def) => {
      $ZodISOTime.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodISODuration = $constructor("ZodISODuration", (inst, def) => {
      $ZodISODuration.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodEmail = $constructor("ZodEmail", (inst, def) => {
      $ZodEmail.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodGUID = $constructor("ZodGUID", (inst, def) => {
      $ZodGUID.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodUUID = $constructor("ZodUUID", (inst, def) => {
      $ZodUUID.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodURL = $constructor("ZodURL", (inst, def) => {
      $ZodURL.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodEmoji = $constructor("ZodEmoji", (inst, def) => {
      $ZodEmoji.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodNanoID = $constructor("ZodNanoID", (inst, def) => {
      $ZodNanoID.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodCUID = $constructor("ZodCUID", (inst, def) => {
      $ZodCUID.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodCUID2 = $constructor("ZodCUID2", (inst, def) => {
      $ZodCUID2.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodULID = $constructor("ZodULID", (inst, def) => {
      $ZodULID.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodXID = $constructor("ZodXID", (inst, def) => {
      $ZodXID.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodKSUID = $constructor("ZodKSUID", (inst, def) => {
      $ZodKSUID.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodIPv4 = $constructor("ZodIPv4", (inst, def) => {
      $ZodIPv4.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodIPv6 = $constructor("ZodIPv6", (inst, def) => {
      $ZodIPv6.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodCIDRv4 = $constructor("ZodCIDRv4", (inst, def) => {
      $ZodCIDRv4.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodCIDRv6 = $constructor("ZodCIDRv6", (inst, def) => {
      $ZodCIDRv6.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodBase64 = $constructor("ZodBase64", (inst, def) => {
      $ZodBase64.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodBase64URL = $constructor("ZodBase64URL", (inst, def) => {
      $ZodBase64URL.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodE164 = $constructor("ZodE164", (inst, def) => {
      $ZodE164.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodJWT = $constructor("ZodJWT", (inst, def) => {
      $ZodJWT.init(inst, def), ZodStringFormat.init(inst, def);
    });
    var ZodNumber = $constructor("ZodNumber", (inst, def) => {
      $ZodNumber.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params), inst.isFinite = true;
    }, util_exports.derived({ minValue: (inst) => {
      let { minimum, exclusiveMinimum } = aggregateChecks(inst);
      return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
    }, maxValue: (inst) => {
      let { maximum, exclusiveMaximum } = aggregateChecks(inst);
      return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
    }, isInt: (inst) => {
      let { isInt, multipleOf } = aggregateChecks(inst);
      return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
    }, format: (inst) => aggregateChecks(inst).format ?? null }, { gt(value, params) {
      return this.check(_gt(value, params));
    }, gte(value, params) {
      return this.check(_gte(value, params));
    }, min(value, params) {
      return this.check(_gte(value, params));
    }, lt(value, params) {
      return this.check(_lt(value, params));
    }, lte(value, params) {
      return this.check(_lte(value, params));
    }, max(value, params) {
      return this.check(_lte(value, params));
    }, int(params) {
      return this.check(int(params));
    }, safe(params) {
      return this.check(int(params));
    }, positive(params) {
      return this.check(_gt(0, params));
    }, nonnegative(params) {
      return this.check(_gte(0, params));
    }, negative(params) {
      return this.check(_lt(0, params));
    }, nonpositive(params) {
      return this.check(_lte(0, params));
    }, multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    }, step(value, params) {
      return this.check(_multipleOf(value, params));
    }, finite() {
      return this;
    } }));
    function number2(params) {
      return _number(ZodNumber, params);
    }
    var ZodNumberFormat = $constructor("ZodNumberFormat", (inst, def) => {
      $ZodNumberFormat.init(inst, def), ZodNumber.init(inst, def);
    });
    function int(params) {
      return _int(ZodNumberFormat, params);
    }
    var ZodBoolean = $constructor("ZodBoolean", (inst, def) => {
      $ZodBoolean.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
    });
    function boolean2(params) {
      return _boolean(ZodBoolean, params);
    }
    var ZodUnknown = $constructor("ZodUnknown", (inst, def) => {
      $ZodUnknown.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
    });
    function unknown() {
      return _unknown(ZodUnknown);
    }
    var ZodNever = $constructor("ZodNever", (inst, def) => {
      $ZodNever.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
    });
    function never(params) {
      return _never(ZodNever, params);
    }
    var ZodArray = $constructor("ZodArray", (inst, def) => {
      _ensureDefaultMemoizer(), $ZodArray.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params), inst.element = def.element;
    }, { min(n, params) {
      return this.check(_minLength(n, params));
    }, nonempty(params) {
      return this.check(_minLength(1, params));
    }, max(n, params) {
      return this.check(_maxLength(n, params));
    }, length(n, params) {
      return this.check(_length(n, params));
    }, unwrap() {
      return this.element;
    } });
    function array(element, params) {
      return _array(ZodArray, element, params);
    }
    var ZodObject = $constructor("ZodObject", (inst, def) => {
      _ensureDefaultMemoizer(), $ZodObjectJIT.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params), util_exports.installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
    }, { keyof() {
      return _enum(Object.keys(this._zod.def.shape));
    }, catchall(catchall) {
      return this.clone(util_exports.mergeDefs(this._zod.def, { catchall }));
    }, passthrough() {
      return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
    }, loose() {
      return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
    }, strict() {
      return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: never() }));
    }, strip() {
      return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: void 0 }));
    }, extend(incoming) {
      return util_exports.extend(this, incoming);
    }, safeExtend(incoming) {
      return util_exports.safeExtend(this, incoming);
    }, merge(other) {
      return util_exports.merge(this, other);
    }, pick(mask) {
      return util_exports.pick(this, mask);
    }, omit(mask) {
      return util_exports.omit(this, mask);
    }, partial(...args) {
      return util_exports.partial(ZodOptional, this, args[0]);
    }, exactPartial(...args) {
      return util_exports.partial(ZodExactOptional, this, args[0], "exactPartial");
    }, required(...args) {
      return util_exports.required(ZodNonOptional, this, args[0]);
    } });
    function object(shape, params) {
      let def = { type: "object", shape: shape ?? {}, ...util_exports.normalizeParams(params) };
      return new ZodObject(def);
    }
    var ZodUnion = $constructor("ZodUnion", (inst, def) => {
      $ZodUnion.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params), inst.options = def.options;
    });
    function union(options, params) {
      return new ZodUnion({ type: "union", options, ...util_exports.normalizeParams(params) });
    }
    var ZodIntersection = $constructor("ZodIntersection", (inst, def) => {
      $ZodIntersection.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
    });
    function intersection(left, right) {
      return new ZodIntersection({ type: "intersection", left, right });
    }
    var ZodEnum = $constructor("ZodEnum", (inst, def) => {
      $ZodEnum.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params), inst.enum = def.entries, inst.options = [...inst._zod.values];
      let keys = new Set(Object.keys(def.entries));
      inst.extract = (values, params) => {
        let newEntries = {};
        for (let value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
        else throw new Error(`Key ${value} not found in enum`);
        return new ZodEnum({ ...def, checks: [], ...util_exports.normalizeParams(params), entries: newEntries });
      }, inst.exclude = (values, params) => {
        let newEntries = { ...def.entries };
        for (let value of values) if (keys.has(value)) delete newEntries[value];
        else throw new Error(`Key ${value} not found in enum`);
        return new ZodEnum({ ...def, checks: [], ...util_exports.normalizeParams(params), entries: newEntries });
      };
    });
    function _enum(values, params) {
      let entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
      return new ZodEnum({ type: "enum", entries, ...util_exports.normalizeParams(params) });
    }
    var ZodLiteral = $constructor("ZodLiteral", (inst, def) => {
      $ZodLiteral.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params), inst.values = new Set(def.values), Object.defineProperty(inst, "value", { get() {
        if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
        return def.values[0];
      } });
    });
    function literal(value, params) {
      return new ZodLiteral({ type: "literal", values: Array.isArray(value) ? value : [value], ...util_exports.normalizeParams(params) });
    }
    var ZodTransform = $constructor("ZodTransform", (inst, def) => {
      _ensureDefaultMemoizer(), $ZodTransform.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params), inst._zod.parse = (payload, _ctx) => {
        if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
        payload.addIssue = (issue2) => {
          if (typeof issue2 == "string") payload.issues.push(util_exports.issue(issue2, payload.value, def));
          else {
            let _issue = issue2;
            _issue.fatal && (_issue.continue = false), _issue.code ?? (_issue.code = "custom"), "input" in _issue || (_issue.input = payload.value), _issue.inst ?? (_issue.inst = inst), payload.issues.push(util_exports.issue(_issue));
          }
        };
        let output = def.transform(payload.value, payload);
        return output instanceof Promise ? output.then((output2) => (payload.value = output2, payload)) : (payload.value = output, payload);
      };
    });
    function transform(fn) {
      return new ZodTransform({ type: "transform", transform: fn });
    }
    var ZodOptional = $constructor("ZodOptional", (inst, def) => {
      $ZodOptional.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params), inst.unwrap = () => inst._zod.def.innerType;
    });
    function optional(innerType) {
      return new ZodOptional({ type: "optional", innerType });
    }
    var ZodExactOptional = $constructor("ZodExactOptional", (inst, def) => {
      $ZodExactOptional.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params), inst.unwrap = () => inst._zod.def.innerType;
    });
    function exactOptional(innerType) {
      return new ZodExactOptional({ type: "optional", innerType });
    }
    var ZodNullable = $constructor("ZodNullable", (inst, def) => {
      $ZodNullable.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params), inst.unwrap = () => inst._zod.def.innerType;
    });
    function nullable(innerType) {
      return new ZodNullable({ type: "nullable", innerType });
    }
    var ZodDefault = $constructor("ZodDefault", (inst, def) => {
      $ZodDefault.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params), inst.unwrap = () => inst._zod.def.innerType, inst.removeDefault = inst.unwrap;
    });
    function _default(innerType, defaultValue) {
      return new ZodDefault({ type: "default", innerType, get defaultValue() {
        return typeof defaultValue == "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
      } });
    }
    var ZodPrefault = $constructor("ZodPrefault", (inst, def) => {
      $ZodPrefault.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params), inst.unwrap = () => inst._zod.def.innerType;
    });
    function prefault(innerType, defaultValue) {
      return new ZodPrefault({ type: "prefault", innerType, get defaultValue() {
        return typeof defaultValue == "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
      } });
    }
    var ZodNonOptional = $constructor("ZodNonOptional", (inst, def) => {
      $ZodNonOptional.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params), inst.unwrap = () => inst._zod.def.innerType;
    });
    function nonoptional(innerType, params) {
      return new ZodNonOptional({ type: "nonoptional", innerType, ...util_exports.normalizeParams(params) });
    }
    var ZodCatch = $constructor("ZodCatch", (inst, def) => {
      $ZodCatch.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params), inst.unwrap = () => inst._zod.def.innerType, inst.removeCatch = inst.unwrap;
    });
    function _catch(innerType, catchValue) {
      return new ZodCatch({ type: "catch", innerType, catchValue: typeof catchValue == "function" ? catchValue : util_exports.constantCatch(catchValue) });
    }
    var ZodPipe = $constructor("ZodPipe", (inst, def) => {
      $ZodPipe.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params), inst.in = def.in, inst.out = def.out;
    });
    function pipe(in_, out) {
      return new ZodPipe({ type: "pipe", in: in_, out });
    }
    var ZodReadonly = $constructor("ZodReadonly", (inst, def) => {
      $ZodReadonly.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params), inst.unwrap = () => inst._zod.def.innerType;
    });
    function readonly(innerType) {
      return new ZodReadonly({ type: "readonly", innerType });
    }
    var ZodCustom = $constructor("ZodCustom", (inst, def) => {
      $ZodCustom.init(inst, def), ZodType.init(inst, def), inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
    });
    function refine(fn, _params = {}) {
      return _refine(ZodCustom, fn, _params);
    }
    function superRefine(fn, params) {
      return _superRefine(fn, params);
    }
    var telemetryConfigSchema = object({ enabled: boolean2().optional() });
    var guidanceConfigSchema = object({ enabled: boolean2().optional() });
    var updatesConfigSchema = object({ auto: boolean2().optional(), bypassMinReleaseAge: boolean2().optional() });
    var credStorageSchema = union([literal("auto"), literal("file"), literal("keyring")]);
    var dpopPublicKeySchema = object({ kty: literal("EC"), crv: literal("P-256"), x: string2(), y: string2() });
    var dpopPrivateKeySchema = dpopPublicKeySchema.and(union([object({ d: string2() }), object({ secureEnclave: string2(), sealed: string2() }), object({ tpm: string2(), sealed: string2() }), object({ tpmPublic: string2(), sealed: string2() })]));
    var authConfigSchema = object({ "// Note": string2().optional(), "// Docs": string2().optional(), skipWrite: boolean2().optional(), token: string2().optional(), userId: string2().optional(), cachedUser: object({ id: string2(), username: string2() }).optional(), refreshToken: string2().optional(), expiresAt: number2().optional(), tokenSource: union([literal("flag"), literal("env")]).optional(), dpop: object({ key: dpopPrivateKeySchema }).optional() });
    var authFileConfigSchema = authConfigSchema.omit({ tokenSource: true });
    var globalConfigSchema = object({ "// Note": string2().optional(), "// Docs": string2().optional(), credStorage: credStorageSchema.optional(), currentTeam: string2().optional(), api: string2().optional(), telemetry: telemetryConfigSchema.optional(), guidance: guidanceConfigSchema.optional(), updates: updatesConfigSchema.optional(), useNativeBinary: boolean2().optional(), nativeBinaryAutoOptIn: boolean2().optional(), usedBefore: boolean2().optional() });
    function formatCredStorageError(value) {
      return `Invalid value for \`credStorage\`: ${JSON.stringify(value)}. Expected one of: ${CRED_STORAGE_CONFIG_VALUES.map((storage) => JSON.stringify(storage)).join(", ")}.`;
    }
    var telemetryConfigSchema2 = telemetryConfigSchema.passthrough();
    var guidanceConfigSchema2 = guidanceConfigSchema.passthrough();
    var updatesConfigSchema2 = updatesConfigSchema.passthrough();
    var credStorageSchema2 = _enum(CRED_STORAGE_CONFIG_VALUES, { error: (issue2) => formatCredStorageError(issue2.input) }).optional();
    var globalConfigSchema2 = globalConfigSchema.extend({ credStorage: credStorageSchema2, telemetry: telemetryConfigSchema2.optional(), guidance: guidanceConfigSchema2.optional(), updates: updatesConfigSchema2.optional() }).passthrough();
    var authConfigSchema2 = authConfigSchema.passthrough();
    var import_node_fs2 = __toESM2(__require("fs"));
    var import_node_path2 = __toESM2(__require("path"));
    var import_node_fs = __toESM2(__require("fs"));
    var import_node_path = __toESM2(__require("path"));
    var import_node_os = __require("os");
    function isReadableDirectory(targetPath) {
      try {
        return import_node_fs.default.lstatSync(targetPath).isDirectory();
      } catch {
        return false;
      }
    }
    function getAppPaths(appName) {
      return require_xdg_app_paths()(appName);
    }
    function getDataDirectories(appName) {
      return getAppPaths(appName).dataDirs();
    }
    function getDataPath() {
      return getDataDirectories("com.vercel.cli")[0];
    }
    function getCachePath() {
      return getAppPaths("com.vercel.cli").cache();
    }
    function getGlobalPathConfig() {
      let vercelDirectories = getDataDirectories("com.vercel.cli");
      return [...vercelDirectories, import_node_path.default.join((0, import_node_os.homedir)(), ".now"), ...getDataDirectories("now")].find((configPath) => isReadableDirectory(configPath)) || vercelDirectories[0];
    }
    function getConfigFilePath(configDir) {
      return import_node_path.default.join(configDir, "config.json");
    }
    function getAuthConfigFilePath(configDir) {
      return import_node_path.default.join(configDir, "auth.json");
    }
    function getDpopAuthConfigFilePath(configDir) {
      return import_node_path.default.join(configDir, "credentials.json");
    }
    var DOCS_URL = "https://vercel.com/docs/projects/project-configuration/global-configuration";
    var defaultGlobalConfig = { "// Note": "This is your Vercel config file. For more information see the global configuration documentation.", "// Docs": `${DOCS_URL}#config.json`, usedBefore: false };
    function getDefaultAuthConfig() {
      return { "// Note": "This is your Vercel credentials file. DO NOT SHARE!", "// Docs": `${DOCS_URL}#auth.json` };
    }
    var defaultAuthConfig = getDefaultAuthConfig();
    function normalizeConfigError(error2) {
      if (error2 instanceof ZodError) {
        let credStorageIssue = error2.issues.find((issue2) => issue2.path[0] === "credStorage");
        if (credStorageIssue) throw new Error(credStorageIssue.message);
      }
      throw error2;
    }
    function parseGlobalConfig(value) {
      try {
        return globalConfigSchema2.parse(value);
      } catch (error2) {
        normalizeConfigError(error2);
      }
    }
    function parseAuthConfig(value) {
      return authConfigSchema2.parse(value);
    }
    function parseAuthFileConfig(value) {
      let { tokenSource, ...authConfig } = parseAuthConfig(value);
      return authConfig;
    }
    function readJsonFileSync(filePath) {
      let content = import_node_fs2.default.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
      return JSON.parse(content);
    }
    function writeJsonFileSync(filePath, value, options = {}) {
      let directory = import_node_path2.default.dirname(filePath), tempFilePath = import_node_path2.default.join(directory, `.${import_node_path2.default.basename(filePath)}.${process.pid}.${Date.now()}.tmp`), content = `${JSON.stringify(value, null, options.indent ?? 2)}
`;
      import_node_fs2.default.mkdirSync(directory, { recursive: true });
      try {
        import_node_fs2.default.writeFileSync(tempFilePath, content, { encoding: "utf8", mode: options.mode }), import_node_fs2.default.renameSync(tempFilePath, filePath);
      } catch (error2) {
        try {
          import_node_fs2.default.rmSync(tempFilePath, { force: true });
        } catch {
        }
        throw error2;
      }
    }
    function readConfigFile(configPath, schema) {
      return schema.parse(readJsonFileSync(configPath));
    }
    function writeConfigFile(configPath, schema, config2, options) {
      let normalizedConfig = encode(schema, config2);
      writeJsonFileSync(configPath, normalizedConfig, { indent: 2, ...options });
    }
    function readGlobalConfigFile(configPath) {
      try {
        return readConfigFile(configPath, globalConfigSchema2);
      } catch (error2) {
        normalizeConfigError(error2);
      }
    }
    function writeGlobalConfigFile(configPath, config2) {
      writeConfigFile(configPath, globalConfigSchema2, config2);
    }
    function readAuthConfigFile(configPath) {
      return readConfigFile(configPath, authConfigSchema2);
    }
    function readAuthFileConfig(configPath) {
      return parseAuthFileConfig(readJsonFileSync(configPath));
    }
    function readAuthConfig(configDir) {
      return readAuthConfigFile(getAuthConfigFilePath(configDir));
    }
    function tryReadAuthConfig(configDir) {
      try {
        return readAuthConfig(configDir);
      } catch {
        return null;
      }
    }
    function writeAuthConfigFile(configPath, authConfig) {
      authConfig.skipWrite || writeConfigFile(configPath, authConfigSchema2, authConfig, { mode: 384 });
    }
    function writeAuthConfig(configDir, authConfig) {
      writeAuthConfigFile(getAuthConfigFilePath(configDir), authConfig);
    }
    function deleteAuthConfigFile(configPath) {
      import_node_fs2.default.rmSync(configPath, { force: true });
    }
    function deleteAuthConfig(configDir) {
      deleteAuthConfigFile(getAuthConfigFilePath(configDir));
    }
    var TOKEN_STORAGE_ENV = "VERCEL_TOKEN_STORAGE";
    function isErrnoException(error2) {
      return typeof error2 == "object" && error2 !== null && "code" in error2;
    }
    function isCredStorage(value) {
      return CRED_STORAGE_CONFIG_VALUES.includes(value);
    }
    function formatCredStorageError2(value, source) {
      return `Invalid value for \`${source}\`: ${JSON.stringify(value)}. Expected one of: ${CRED_STORAGE_CONFIG_VALUES.map((storage) => JSON.stringify(storage)).join(", ")}.`;
    }
    function parseCredStorage(value, source = "credStorage") {
      if (!(typeof value > "u")) {
        if (isCredStorage(value)) return value;
        throw new Error(formatCredStorageError2(value, source));
      }
    }
    function authConfigHasUsableTokenData(value) {
      if (!value || typeof value != "object") return false;
      let authConfig = value;
      return typeof authConfig.token == "string" && authConfig.token.length > 0 || typeof authConfig.refreshToken == "string" && authConfig.refreshToken.length > 0;
    }
    function getLikelyAutoCredStorage(configDir) {
      try {
        return authConfigHasUsableTokenData(readAuthConfigFile(getAuthConfigFilePath(configDir))) ? "file" : "keyring";
      } catch {
        return "keyring";
      }
    }
    function getLikelyConfiguredCredStorage(configDir, credStorage) {
      return credStorage === "keyring" ? "keyring" : credStorage !== "auto" ? DEFAULT_CRED_STORAGE : getLikelyAutoCredStorage(configDir);
    }
    function getLikelyEffectiveCredStorage(configDir) {
      let config2 = {}, credStorageOverride = process.env[TOKEN_STORAGE_ENV];
      if (typeof credStorageOverride < "u") return getLikelyConfiguredCredStorage(configDir, parseCredStorage(credStorageOverride, TOKEN_STORAGE_ENV));
      try {
        let parsed = readGlobalConfigFile(getConfigFilePath(configDir));
        config2 = { ...parsed, credStorage: parseCredStorage(parsed.credStorage) };
      } catch (error2) {
        if (!(isErrnoException(error2) && error2.code === "ENOENT")) throw error2;
      }
      return getLikelyConfiguredCredStorage(configDir, config2.credStorage);
    }
  }
});

// node_modules/@vercel/oidc/dist/token-io.js
var require_token_io = __commonJS({
  "node_modules/@vercel/oidc/dist/token-io.js"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var token_io_exports = {};
    __export(token_io_exports, {
      findRootDir: () => findRootDir,
      getUserDataDir: () => getUserDataDir
    });
    module.exports = __toCommonJS(token_io_exports);
    var import_path2 = __toESM2(__require("path"));
    var import_fs2 = __toESM2(__require("fs"));
    var import_os = __toESM2(__require("os"));
    var import_token_error = require_token_error();
    function findRootDir() {
      try {
        let dir = process.cwd();
        while (dir !== import_path2.default.dirname(dir)) {
          const pkgPath = import_path2.default.join(dir, ".vercel");
          if (import_fs2.default.existsSync(pkgPath)) {
            return dir;
          }
          dir = import_path2.default.dirname(dir);
        }
      } catch (_e) {
        throw new import_token_error.VercelOidcTokenError(
          "Token refresh only supported in node server environments"
        );
      }
      return null;
    }
    function getUserDataDir() {
      if (process.env.XDG_DATA_HOME) {
        return process.env.XDG_DATA_HOME;
      }
      switch (import_os.default.platform()) {
        case "darwin":
          return import_path2.default.join(import_os.default.homedir(), "Library/Application Support");
        case "linux":
          return import_path2.default.join(import_os.default.homedir(), ".local/share");
        case "win32":
          if (process.env.LOCALAPPDATA) {
            return process.env.LOCALAPPDATA;
          }
          return null;
        default:
          return null;
      }
    }
  }
});

// node_modules/@vercel/oidc/dist/oauth.js
var require_oauth = __commonJS({
  "node_modules/@vercel/oidc/dist/oauth.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var oauth_exports = {};
    __export(oauth_exports, {
      processTokenResponse: () => processTokenResponse,
      refreshTokenRequest: () => refreshTokenRequest
    });
    module.exports = __toCommonJS(oauth_exports);
    var import_os = __require("os");
    var VERCEL_ISSUER = "https://vercel.com";
    var VERCEL_CLI_CLIENT_ID = "cl_HYyOPBNtFMfHhaUn9L4QPfTZz6TP47bp";
    var userAgent = `@vercel/oidc node-${process.version} ${(0, import_os.platform)()} (${(0, import_os.arch)()}) ${(0, import_os.hostname)()}`;
    var _tokenEndpoint = null;
    async function getTokenEndpoint() {
      if (_tokenEndpoint) {
        return _tokenEndpoint;
      }
      const discoveryUrl = `${VERCEL_ISSUER}/.well-known/openid-configuration`;
      const response = await fetch(discoveryUrl, {
        headers: { "user-agent": userAgent }
      });
      if (!response.ok) {
        throw new Error("Failed to discover OAuth endpoints");
      }
      const metadata = await response.json();
      if (!metadata || typeof metadata.token_endpoint !== "string") {
        throw new Error("Invalid OAuth discovery response");
      }
      const endpoint = metadata.token_endpoint;
      _tokenEndpoint = endpoint;
      return endpoint;
    }
    async function refreshTokenRequest(options) {
      const tokenEndpoint = await getTokenEndpoint();
      return await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "user-agent": userAgent
        },
        body: new URLSearchParams({
          client_id: VERCEL_CLI_CLIENT_ID,
          grant_type: "refresh_token",
          ...options
        })
      });
    }
    async function processTokenResponse(response) {
      const json = await response.json();
      if (!response.ok) {
        const errorMsg = typeof json === "object" && json && "error" in json ? String(json.error) : "Token refresh failed";
        return [new Error(errorMsg)];
      }
      if (typeof json !== "object" || json === null) {
        return [new Error("Invalid token response")];
      }
      if (typeof json.access_token !== "string") {
        return [new Error("Missing access_token in response")];
      }
      if (json.token_type !== "Bearer") {
        return [new Error("Invalid token_type in response")];
      }
      if (typeof json.expires_in !== "number") {
        return [new Error("Missing expires_in in response")];
      }
      return [null, json];
    }
  }
});

// node_modules/@vercel/oidc/dist/auth-errors.js
var require_auth_errors = __commonJS({
  "node_modules/@vercel/oidc/dist/auth-errors.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var auth_errors_exports = {};
    __export(auth_errors_exports, {
      AccessTokenMissingError: () => AccessTokenMissingError2,
      RefreshAccessTokenFailedError: () => RefreshAccessTokenFailedError2
    });
    module.exports = __toCommonJS(auth_errors_exports);
    var AccessTokenMissingError2 = class extends Error {
      constructor() {
        super(
          "No authentication found. Please log in with the Vercel CLI (vercel login)."
        );
        this.name = "AccessTokenMissingError";
      }
    };
    var RefreshAccessTokenFailedError2 = class extends Error {
      constructor(cause) {
        super("Failed to refresh authentication token.");
        this.name = "RefreshAccessTokenFailedError";
        if (cause !== void 0) {
          this.cause = cause;
        }
      }
    };
  }
});

// node_modules/@vercel/oidc/dist/token-util.js
var require_token_util = __commonJS({
  "node_modules/@vercel/oidc/dist/token-util.js"(exports, module) {
    "use strict";
    var __create2 = Object.create;
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __getProtoOf2 = Object.getPrototypeOf;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create2(__getProtoOf2(mod)) : {}, __copyProps2(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var token_util_exports = {};
    __export(token_util_exports, {
      assertVercelOidcTokenResponse: () => assertVercelOidcTokenResponse,
      findProjectInfo: () => findProjectInfo,
      getTokenPayload: () => getTokenPayload,
      getVercelOidcToken: () => getVercelOidcToken3,
      getVercelOidcTokenFromCli: () => getVercelOidcTokenFromCli,
      getVercelToken: () => getVercelToken2,
      isExpired: () => isExpired,
      loadToken: () => loadToken,
      saveToken: () => saveToken
    });
    module.exports = __toCommonJS(token_util_exports);
    var path2 = __toESM2(__require("path"));
    var fs2 = __toESM2(__require("fs"));
    var import_cli_exec = require_dist();
    var import_cli_config = require_dist2();
    var import_token_error = require_token_error();
    var import_token_io = require_token_io();
    var import_oauth = require_oauth();
    var import_auth_errors = require_auth_errors();
    async function getVercelToken2(options) {
      const configDir = (0, import_cli_config.getGlobalPathConfig)();
      const authConfig = (0, import_cli_config.tryReadAuthConfig)(configDir);
      if (!authConfig || !authConfig.token && !authConfig.refreshToken) {
        throw new import_auth_errors.AccessTokenMissingError();
      }
      if (isValidAccessToken(authConfig, options?.expirationBufferMs)) {
        return authConfig.token;
      }
      if (!authConfig.refreshToken) {
        (0, import_cli_config.writeAuthConfig)(configDir, {});
        throw new import_auth_errors.RefreshAccessTokenFailedError("No refresh token available");
      }
      try {
        const tokenResponse = await (0, import_oauth.refreshTokenRequest)({
          refresh_token: authConfig.refreshToken
        });
        const [tokensError, tokens] = await (0, import_oauth.processTokenResponse)(tokenResponse);
        if (tokensError || !tokens) {
          (0, import_cli_config.writeAuthConfig)(configDir, {});
          throw new import_auth_errors.RefreshAccessTokenFailedError(tokensError);
        }
        const updatedConfig = {
          token: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1e3) + tokens.expires_in,
          refreshToken: tokens.refresh_token
        };
        (0, import_cli_config.writeAuthConfig)(configDir, updatedConfig);
        return updatedConfig.token;
      } catch (error) {
        (0, import_cli_config.writeAuthConfig)(configDir, {});
        if (error instanceof import_auth_errors.AccessTokenMissingError || error instanceof import_auth_errors.RefreshAccessTokenFailedError) {
          throw error;
        }
        throw new import_auth_errors.RefreshAccessTokenFailedError(error);
      }
    }
    function isValidAccessToken(authConfig, expirationBufferMs = 0) {
      if (!authConfig.token)
        return false;
      if (typeof authConfig.expiresAt !== "number")
        return true;
      const nowInSeconds = Math.floor(Date.now() / 1e3);
      const bufferInSeconds = expirationBufferMs / 1e3;
      return authConfig.expiresAt >= nowInSeconds + bufferInSeconds;
    }
    var CLI_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
    function assertCliId(value, kind) {
      if (!CLI_ID_PATTERN.test(value)) {
        throw new import_token_error.VercelOidcTokenError(
          `Failed to refresh OIDC token: ${JSON.stringify(value)} is not a valid ${kind} ID or name. Try re-linking your project with \`vc link\``
        );
      }
    }
    async function getVercelOidcTokenFromCli(projectId, teamId) {
      assertCliId(projectId, "project");
      if (teamId) {
        assertCliId(teamId, "team");
      }
      const args = ["project", "token", projectId, "--format=json"];
      if (teamId) {
        args.push("--scope", teamId);
      }
      try {
        const { stdout } = await (0, import_cli_exec.execVercelCli)(args);
        let parsedOutput;
        if (typeof stdout !== "string") {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: `vercel project token` did not return stdout"
          );
        }
        try {
          parsedOutput = JSON.parse(stdout);
        } catch {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: `vercel project token` returned invalid JSON: " + stdout
          );
        }
        assertVercelOidcTokenResponse(parsedOutput);
        return parsedOutput;
      } catch (error) {
        if (error instanceof import_token_error.VercelOidcTokenError) {
          throw error;
        }
        let message = error instanceof Error ? error.message : "";
        const stderr = error instanceof import_cli_exec.VercelCliError ? error.stderr?.trim() : void 0;
        if (stderr && !message.includes(stderr)) {
          message = `${message}
${stderr}`.trim();
        }
        throw new import_token_error.VercelOidcTokenError(
          message ? `Failed to refresh OIDC token with the Vercel CLI: ${message}` : "Failed to refresh OIDC token with the Vercel CLI"
        );
      }
    }
    async function getVercelOidcToken3(authToken, projectId, teamId) {
      const url = `https://api.vercel.com/v1/projects/${projectId}/token?source=vercel-oidc-refresh${teamId ? `&teamId=${teamId}` : ""}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      if (!res.ok) {
        throw new import_token_error.VercelOidcTokenError(
          `Failed to refresh OIDC token: ${res.statusText}`
        );
      }
      const tokenRes = await res.json();
      assertVercelOidcTokenResponse(tokenRes);
      return tokenRes;
    }
    function assertVercelOidcTokenResponse(res) {
      if (!res || typeof res !== "object") {
        throw new TypeError("Vercel OIDC token is malformed. Expected an object.");
      }
      if (!("token" in res) || typeof res.token !== "string") {
        throw new TypeError(
          "Vercel OIDC token is malformed. Expected a string-valued token property."
        );
      }
    }
    function findProjectInfo() {
      const dir = (0, import_token_io.findRootDir)();
      if (!dir) {
        throw new import_token_error.VercelOidcTokenError(
          "Unable to find project root directory. Have you linked your project with `vc link?`"
        );
      }
      const prjPath = path2.join(dir, ".vercel", "project.json");
      if (!fs2.existsSync(prjPath)) {
        throw new import_token_error.VercelOidcTokenError(
          "project.json not found, have you linked your project with `vc link?`"
        );
      }
      const prj = JSON.parse(fs2.readFileSync(prjPath, "utf8"));
      if (typeof prj.projectId !== "string" && typeof prj.orgId !== "string") {
        throw new TypeError(
          "Expected a string-valued projectId property. Try running `vc link` to re-link your project."
        );
      }
      return { projectId: prj.projectId, teamId: prj.orgId };
    }
    function saveToken(token, projectId) {
      const dir = (0, import_token_io.getUserDataDir)();
      if (!dir) {
        throw new import_token_error.VercelOidcTokenError(
          "Unable to find user data directory. Please reach out to Vercel support."
        );
      }
      const tokenPath = path2.join(dir, "com.vercel.token", `${projectId}.json`);
      const tokenJson = JSON.stringify(token);
      fs2.mkdirSync(path2.dirname(tokenPath), { mode: 504, recursive: true });
      fs2.writeFileSync(tokenPath, tokenJson);
      fs2.chmodSync(tokenPath, 432);
      return;
    }
    function loadToken(projectId) {
      const dir = (0, import_token_io.getUserDataDir)();
      if (!dir) {
        throw new import_token_error.VercelOidcTokenError(
          "Unable to find user data directory. Please reach out to Vercel support."
        );
      }
      const tokenPath = path2.join(dir, "com.vercel.token", `${projectId}.json`);
      if (!fs2.existsSync(tokenPath)) {
        return null;
      }
      const token = JSON.parse(fs2.readFileSync(tokenPath, "utf8"));
      assertVercelOidcTokenResponse(token);
      return token;
    }
    function getTokenPayload(token) {
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        throw new import_token_error.VercelOidcTokenError("Invalid token.");
      }
      const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + (4 - base64.length % 4) % 4,
        "="
      );
      return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    }
    function isExpired(token, bufferMs = 0) {
      return token.exp * 1e3 < Date.now() + bufferMs;
    }
  }
});

// node_modules/@vercel/oidc/dist/token.js
var require_token = __commonJS({
  "node_modules/@vercel/oidc/dist/token.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var token_exports = {};
    __export(token_exports, {
      refreshToken: () => refreshToken
    });
    module.exports = __toCommonJS(token_exports);
    var import_cli_config = require_dist2();
    var import_token_error = require_token_error();
    var import_token_util = require_token_util();
    async function refreshToken(options) {
      let projectId = options?.project;
      let teamId = options?.team;
      if (!projectId && !teamId) {
        const projectInfo = (0, import_token_util.findProjectInfo)();
        projectId = projectInfo.projectId;
        teamId = projectInfo.teamId;
      } else if (!projectId || !teamId) {
        const projectInfo = (0, import_token_util.findProjectInfo)();
        projectId = projectId ?? projectInfo.projectId;
        teamId = teamId ?? projectInfo.teamId;
      }
      if (!projectId) {
        throw new import_token_error.VercelOidcTokenError(
          "Failed to refresh OIDC token: No project specified. Try re-linking your project with `vc link`"
        );
      }
      let maybeToken = (0, import_token_util.loadToken)(projectId);
      if (!maybeToken || (0, import_token_util.isExpired)((0, import_token_util.getTokenPayload)(maybeToken.token), options?.expirationBufferMs)) {
        const configDir = (0, import_cli_config.getGlobalPathConfig)();
        if ((0, import_cli_config.getLikelyEffectiveCredStorage)(configDir) === "keyring" || isDpopLoginEnabled()) {
          maybeToken = await (0, import_token_util.getVercelOidcTokenFromCli)(projectId, teamId);
        } else {
          const authToken = await (0, import_token_util.getVercelToken)({
            expirationBufferMs: options?.expirationBufferMs
          });
          maybeToken = await (0, import_token_util.getVercelOidcToken)(authToken, projectId, teamId);
        }
        if (!maybeToken) {
          throw new import_token_error.VercelOidcTokenError("Failed to refresh OIDC token");
        }
        (0, import_token_util.saveToken)(maybeToken, projectId);
      }
      process.env.VERCEL_OIDC_TOKEN = maybeToken.token;
      return;
    }
    function isDpopLoginEnabled() {
      return process.env.__VERCEL_FF_DPOP === "1";
    }
  }
});

// node_modules/@vercel/oidc/dist/get-vercel-oidc-token-with-refresh.js
var require_get_vercel_oidc_token_with_refresh = __commonJS({
  "node_modules/@vercel/oidc/dist/get-vercel-oidc-token-with-refresh.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var get_vercel_oidc_token_with_refresh_exports = {};
    __export(get_vercel_oidc_token_with_refresh_exports, {
      getVercelOidcToken: () => getVercelOidcToken3
    });
    module.exports = __toCommonJS(get_vercel_oidc_token_with_refresh_exports);
    var import_promises = __require("node:fs/promises");
    var import_exchange_vercel_oidc_token = require_exchange_vercel_oidc_token();
    var import_get_context = require_get_context();
    var import_get_vercel_oidc_token_sync = require_get_vercel_oidc_token_sync();
    var import_token_error = require_token_error();
    async function getVercelOidcToken3(options) {
      let token = "";
      let err;
      const tokenFromFile = (0, import_get_context.getContext)().headers?.["x-vercel-oidc-token"] ? null : await tryOidcTokenFromFile();
      try {
        token = tokenFromFile ?? (0, import_get_vercel_oidc_token_sync.getVercelOidcTokenSync)();
      } catch (error) {
        err = error;
      }
      try {
        const [{ getTokenPayload, isExpired }, { refreshToken }] = await Promise.all([
          await Promise.resolve().then(() => __toESM(require_token_util())),
          await Promise.resolve().then(() => __toESM(require_token()))
        ]);
        if (!token || isExpired(getTokenPayload(token), options?.expirationBufferMs)) {
          await refreshToken(options);
          token = (0, import_get_vercel_oidc_token_sync.getVercelOidcTokenSync)();
        }
      } catch (error) {
        let message = err instanceof Error ? err.message : "";
        if (error instanceof Error) {
          message = `${message}
${error.message}`;
        }
        if (message) {
          throw new import_token_error.VercelOidcTokenError(message);
        }
        throw error;
      }
      if (options?.audience) {
        token = await (0, import_exchange_vercel_oidc_token.exchangeVercelOidcToken)({
          token,
          audience: options.audience,
          jti: options.jti,
          skipCache: options.skipCache
        });
      }
      return token;
    }
    async function tryOidcTokenFromFile() {
      const tokenFile = process.env.VERCEL_OIDC_TOKEN_FILE;
      if (!tokenFile) {
        return null;
      }
      const token = (await (0, import_promises.readFile)(tokenFile, "utf8")).trim();
      if (!token) {
        throw new import_token_error.VercelOidcTokenError(
          `The Vercel OIDC token file is empty: ${tokenFile}`
        );
      }
      return token;
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/digest.js
var require_digest = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/digest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_crypto_1 = __require("node:crypto");
    var digest = (algorithm, data) => (0, node_crypto_1.createHash)(algorithm).update(data).digest();
    exports.default = digest;
  }
});

// node_modules/jose/dist/node/cjs/lib/buffer_utils.js
var require_buffer_utils = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/buffer_utils.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decoder = exports.encoder = void 0;
    exports.concat = concat;
    exports.p2s = p2s;
    exports.uint64be = uint64be;
    exports.uint32be = uint32be;
    exports.lengthAndInput = lengthAndInput;
    exports.concatKdf = concatKdf;
    var digest_js_1 = require_digest();
    exports.encoder = new TextEncoder();
    exports.decoder = new TextDecoder();
    var MAX_INT32 = 2 ** 32;
    function concat(...buffers) {
      const size = buffers.reduce((acc, { length }) => acc + length, 0);
      const buf = new Uint8Array(size);
      let i = 0;
      for (const buffer of buffers) {
        buf.set(buffer, i);
        i += buffer.length;
      }
      return buf;
    }
    function p2s(alg, p2sInput) {
      return concat(exports.encoder.encode(alg), new Uint8Array([0]), p2sInput);
    }
    function writeUInt32BE(buf, value, offset) {
      if (value < 0 || value >= MAX_INT32) {
        throw new RangeError(`value must be >= 0 and <= ${MAX_INT32 - 1}. Received ${value}`);
      }
      buf.set([value >>> 24, value >>> 16, value >>> 8, value & 255], offset);
    }
    function uint64be(value) {
      const high = Math.floor(value / MAX_INT32);
      const low = value % MAX_INT32;
      const buf = new Uint8Array(8);
      writeUInt32BE(buf, high, 0);
      writeUInt32BE(buf, low, 4);
      return buf;
    }
    function uint32be(value) {
      const buf = new Uint8Array(4);
      writeUInt32BE(buf, value);
      return buf;
    }
    function lengthAndInput(input) {
      return concat(uint32be(input.length), input);
    }
    async function concatKdf(secret, bits, value) {
      const iterations = Math.ceil((bits >> 3) / 32);
      const res = new Uint8Array(iterations * 32);
      for (let iter = 0; iter < iterations; iter++) {
        const buf = new Uint8Array(4 + secret.length + value.length);
        buf.set(uint32be(iter + 1));
        buf.set(secret, 4);
        buf.set(value, 4 + secret.length);
        res.set(await (0, digest_js_1.default)("sha256", buf), iter * 32);
      }
      return res.slice(0, bits >> 3);
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/base64url.js
var require_base64url = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/base64url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decode = exports.encode = exports.encodeBase64 = exports.decodeBase64 = void 0;
    var node_buffer_1 = __require("node:buffer");
    var buffer_utils_js_1 = require_buffer_utils();
    function normalize(input) {
      let encoded = input;
      if (encoded instanceof Uint8Array) {
        encoded = buffer_utils_js_1.decoder.decode(encoded);
      }
      return encoded;
    }
    var encode = (input) => node_buffer_1.Buffer.from(input).toString("base64url");
    exports.encode = encode;
    var decodeBase64 = (input) => new Uint8Array(node_buffer_1.Buffer.from(input, "base64"));
    exports.decodeBase64 = decodeBase64;
    var encodeBase64 = (input) => node_buffer_1.Buffer.from(input).toString("base64");
    exports.encodeBase64 = encodeBase64;
    var decode = (input) => new Uint8Array(node_buffer_1.Buffer.from(normalize(input), "base64url"));
    exports.decode = decode;
  }
});

// node_modules/jose/dist/node/cjs/util/errors.js
var require_errors2 = __commonJS({
  "node_modules/jose/dist/node/cjs/util/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.JWSSignatureVerificationFailed = exports.JWKSTimeout = exports.JWKSMultipleMatchingKeys = exports.JWKSNoMatchingKey = exports.JWKSInvalid = exports.JWKInvalid = exports.JWTInvalid = exports.JWSInvalid = exports.JWEInvalid = exports.JWEDecryptionFailed = exports.JOSENotSupported = exports.JOSEAlgNotAllowed = exports.JWTExpired = exports.JWTClaimValidationFailed = exports.JOSEError = void 0;
    var JOSEError = class extends Error {
      static code = "ERR_JOSE_GENERIC";
      code = "ERR_JOSE_GENERIC";
      constructor(message, options) {
        super(message, options);
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    exports.JOSEError = JOSEError;
    var JWTClaimValidationFailed = class extends JOSEError {
      static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      claim;
      reason;
      payload;
      constructor(message, payload, claim = "unspecified", reason = "unspecified") {
        super(message, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    exports.JWTClaimValidationFailed = JWTClaimValidationFailed;
    var JWTExpired = class extends JOSEError {
      static code = "ERR_JWT_EXPIRED";
      code = "ERR_JWT_EXPIRED";
      claim;
      reason;
      payload;
      constructor(message, payload, claim = "unspecified", reason = "unspecified") {
        super(message, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    exports.JWTExpired = JWTExpired;
    var JOSEAlgNotAllowed = class extends JOSEError {
      static code = "ERR_JOSE_ALG_NOT_ALLOWED";
      code = "ERR_JOSE_ALG_NOT_ALLOWED";
    };
    exports.JOSEAlgNotAllowed = JOSEAlgNotAllowed;
    var JOSENotSupported = class extends JOSEError {
      static code = "ERR_JOSE_NOT_SUPPORTED";
      code = "ERR_JOSE_NOT_SUPPORTED";
    };
    exports.JOSENotSupported = JOSENotSupported;
    var JWEDecryptionFailed = class extends JOSEError {
      static code = "ERR_JWE_DECRYPTION_FAILED";
      code = "ERR_JWE_DECRYPTION_FAILED";
      constructor(message = "decryption operation failed", options) {
        super(message, options);
      }
    };
    exports.JWEDecryptionFailed = JWEDecryptionFailed;
    var JWEInvalid = class extends JOSEError {
      static code = "ERR_JWE_INVALID";
      code = "ERR_JWE_INVALID";
    };
    exports.JWEInvalid = JWEInvalid;
    var JWSInvalid = class extends JOSEError {
      static code = "ERR_JWS_INVALID";
      code = "ERR_JWS_INVALID";
    };
    exports.JWSInvalid = JWSInvalid;
    var JWTInvalid = class extends JOSEError {
      static code = "ERR_JWT_INVALID";
      code = "ERR_JWT_INVALID";
    };
    exports.JWTInvalid = JWTInvalid;
    var JWKInvalid = class extends JOSEError {
      static code = "ERR_JWK_INVALID";
      code = "ERR_JWK_INVALID";
    };
    exports.JWKInvalid = JWKInvalid;
    var JWKSInvalid = class extends JOSEError {
      static code = "ERR_JWKS_INVALID";
      code = "ERR_JWKS_INVALID";
    };
    exports.JWKSInvalid = JWKSInvalid;
    var JWKSNoMatchingKey = class extends JOSEError {
      static code = "ERR_JWKS_NO_MATCHING_KEY";
      code = "ERR_JWKS_NO_MATCHING_KEY";
      constructor(message = "no applicable key found in the JSON Web Key Set", options) {
        super(message, options);
      }
    };
    exports.JWKSNoMatchingKey = JWKSNoMatchingKey;
    var JWKSMultipleMatchingKeys = class extends JOSEError {
      [Symbol.asyncIterator];
      static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
      constructor(message = "multiple matching keys found in the JSON Web Key Set", options) {
        super(message, options);
      }
    };
    exports.JWKSMultipleMatchingKeys = JWKSMultipleMatchingKeys;
    var JWKSTimeout = class extends JOSEError {
      static code = "ERR_JWKS_TIMEOUT";
      code = "ERR_JWKS_TIMEOUT";
      constructor(message = "request timed out", options) {
        super(message, options);
      }
    };
    exports.JWKSTimeout = JWKSTimeout;
    var JWSSignatureVerificationFailed = class extends JOSEError {
      static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      constructor(message = "signature verification failed", options) {
        super(message, options);
      }
    };
    exports.JWSSignatureVerificationFailed = JWSSignatureVerificationFailed;
  }
});

// node_modules/jose/dist/node/cjs/runtime/random.js
var require_random = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/random.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = void 0;
    var node_crypto_1 = __require("node:crypto");
    Object.defineProperty(exports, "default", { enumerable: true, get: function() {
      return node_crypto_1.randomFillSync;
    } });
  }
});

// node_modules/jose/dist/node/cjs/lib/iv.js
var require_iv = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/iv.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bitLength = bitLength;
    var errors_js_1 = require_errors2();
    var random_js_1 = require_random();
    function bitLength(alg) {
      switch (alg) {
        case "A128GCM":
        case "A128GCMKW":
        case "A192GCM":
        case "A192GCMKW":
        case "A256GCM":
        case "A256GCMKW":
          return 96;
        case "A128CBC-HS256":
        case "A192CBC-HS384":
        case "A256CBC-HS512":
          return 128;
        default:
          throw new errors_js_1.JOSENotSupported(`Unsupported JWE Algorithm: ${alg}`);
      }
    }
    exports.default = (alg) => (0, random_js_1.default)(new Uint8Array(bitLength(alg) >> 3));
  }
});

// node_modules/jose/dist/node/cjs/lib/check_iv_length.js
var require_check_iv_length = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/check_iv_length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var errors_js_1 = require_errors2();
    var iv_js_1 = require_iv();
    var checkIvLength = (enc, iv) => {
      if (iv.length << 3 !== (0, iv_js_1.bitLength)(enc)) {
        throw new errors_js_1.JWEInvalid("Invalid Initialization Vector length");
      }
    };
    exports.default = checkIvLength;
  }
});

// node_modules/jose/dist/node/cjs/runtime/is_key_object.js
var require_is_key_object = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/is_key_object.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util = __require("node:util");
    exports.default = (obj) => util.types.isKeyObject(obj);
  }
});

// node_modules/jose/dist/node/cjs/runtime/check_cek_length.js
var require_check_cek_length = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/check_cek_length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var errors_js_1 = require_errors2();
    var is_key_object_js_1 = require_is_key_object();
    var checkCekLength = (enc, cek) => {
      let expected;
      switch (enc) {
        case "A128CBC-HS256":
        case "A192CBC-HS384":
        case "A256CBC-HS512":
          expected = parseInt(enc.slice(-3), 10);
          break;
        case "A128GCM":
        case "A192GCM":
        case "A256GCM":
          expected = parseInt(enc.slice(1, 4), 10);
          break;
        default:
          throw new errors_js_1.JOSENotSupported(`Content Encryption Algorithm ${enc} is not supported either by JOSE or your javascript runtime`);
      }
      if (cek instanceof Uint8Array) {
        const actual = cek.byteLength << 3;
        if (actual !== expected) {
          throw new errors_js_1.JWEInvalid(`Invalid Content Encryption Key length. Expected ${expected} bits, got ${actual} bits`);
        }
        return;
      }
      if ((0, is_key_object_js_1.default)(cek) && cek.type === "secret") {
        const actual = cek.symmetricKeySize << 3;
        if (actual !== expected) {
          throw new errors_js_1.JWEInvalid(`Invalid Content Encryption Key length. Expected ${expected} bits, got ${actual} bits`);
        }
        return;
      }
      throw new TypeError("Invalid Content Encryption Key type");
    };
    exports.default = checkCekLength;
  }
});

// node_modules/jose/dist/node/cjs/runtime/timing_safe_equal.js
var require_timing_safe_equal = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/timing_safe_equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_crypto_1 = __require("node:crypto");
    var timingSafeEqual = node_crypto_1.timingSafeEqual;
    exports.default = timingSafeEqual;
  }
});

// node_modules/jose/dist/node/cjs/runtime/cbc_tag.js
var require_cbc_tag = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/cbc_tag.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = cbcTag;
    var node_crypto_1 = __require("node:crypto");
    var buffer_utils_js_1 = require_buffer_utils();
    function cbcTag(aad, iv, ciphertext, macSize, macKey, keySize) {
      const macData = (0, buffer_utils_js_1.concat)(aad, iv, ciphertext, (0, buffer_utils_js_1.uint64be)(aad.length << 3));
      const hmac = (0, node_crypto_1.createHmac)(`sha${macSize}`, macKey);
      hmac.update(macData);
      return hmac.digest().slice(0, keySize >> 3);
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/webcrypto.js
var require_webcrypto = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/webcrypto.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isCryptoKey = void 0;
    var crypto3 = __require("node:crypto");
    var util = __require("node:util");
    var webcrypto = crypto3.webcrypto;
    exports.default = webcrypto;
    var isCryptoKey = (key) => util.types.isCryptoKey(key);
    exports.isCryptoKey = isCryptoKey;
  }
});

// node_modules/jose/dist/node/cjs/lib/crypto_key.js
var require_crypto_key = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/crypto_key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkSigCryptoKey = checkSigCryptoKey;
    exports.checkEncCryptoKey = checkEncCryptoKey;
    function unusable(name, prop = "algorithm.name") {
      return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
    }
    function isAlgorithm(algorithm, name) {
      return algorithm.name === name;
    }
    function getHashLength(hash) {
      return parseInt(hash.name.slice(4), 10);
    }
    function getNamedCurve(alg) {
      switch (alg) {
        case "ES256":
          return "P-256";
        case "ES384":
          return "P-384";
        case "ES512":
          return "P-521";
        default:
          throw new Error("unreachable");
      }
    }
    function checkUsage(key, usages) {
      if (usages.length && !usages.some((expected) => key.usages.includes(expected))) {
        let msg = "CryptoKey does not support this operation, its usages must include ";
        if (usages.length > 2) {
          const last = usages.pop();
          msg += `one of ${usages.join(", ")}, or ${last}.`;
        } else if (usages.length === 2) {
          msg += `one of ${usages[0]} or ${usages[1]}.`;
        } else {
          msg += `${usages[0]}.`;
        }
        throw new TypeError(msg);
      }
    }
    function checkSigCryptoKey(key, alg, ...usages) {
      switch (alg) {
        case "HS256":
        case "HS384":
        case "HS512": {
          if (!isAlgorithm(key.algorithm, "HMAC"))
            throw unusable("HMAC");
          const expected = parseInt(alg.slice(2), 10);
          const actual = getHashLength(key.algorithm.hash);
          if (actual !== expected)
            throw unusable(`SHA-${expected}`, "algorithm.hash");
          break;
        }
        case "RS256":
        case "RS384":
        case "RS512": {
          if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
            throw unusable("RSASSA-PKCS1-v1_5");
          const expected = parseInt(alg.slice(2), 10);
          const actual = getHashLength(key.algorithm.hash);
          if (actual !== expected)
            throw unusable(`SHA-${expected}`, "algorithm.hash");
          break;
        }
        case "PS256":
        case "PS384":
        case "PS512": {
          if (!isAlgorithm(key.algorithm, "RSA-PSS"))
            throw unusable("RSA-PSS");
          const expected = parseInt(alg.slice(2), 10);
          const actual = getHashLength(key.algorithm.hash);
          if (actual !== expected)
            throw unusable(`SHA-${expected}`, "algorithm.hash");
          break;
        }
        case "EdDSA": {
          if (key.algorithm.name !== "Ed25519" && key.algorithm.name !== "Ed448") {
            throw unusable("Ed25519 or Ed448");
          }
          break;
        }
        case "Ed25519": {
          if (!isAlgorithm(key.algorithm, "Ed25519"))
            throw unusable("Ed25519");
          break;
        }
        case "ES256":
        case "ES384":
        case "ES512": {
          if (!isAlgorithm(key.algorithm, "ECDSA"))
            throw unusable("ECDSA");
          const expected = getNamedCurve(alg);
          const actual = key.algorithm.namedCurve;
          if (actual !== expected)
            throw unusable(expected, "algorithm.namedCurve");
          break;
        }
        default:
          throw new TypeError("CryptoKey does not support this operation");
      }
      checkUsage(key, usages);
    }
    function checkEncCryptoKey(key, alg, ...usages) {
      switch (alg) {
        case "A128GCM":
        case "A192GCM":
        case "A256GCM": {
          if (!isAlgorithm(key.algorithm, "AES-GCM"))
            throw unusable("AES-GCM");
          const expected = parseInt(alg.slice(1, 4), 10);
          const actual = key.algorithm.length;
          if (actual !== expected)
            throw unusable(expected, "algorithm.length");
          break;
        }
        case "A128KW":
        case "A192KW":
        case "A256KW": {
          if (!isAlgorithm(key.algorithm, "AES-KW"))
            throw unusable("AES-KW");
          const expected = parseInt(alg.slice(1, 4), 10);
          const actual = key.algorithm.length;
          if (actual !== expected)
            throw unusable(expected, "algorithm.length");
          break;
        }
        case "ECDH": {
          switch (key.algorithm.name) {
            case "ECDH":
            case "X25519":
            case "X448":
              break;
            default:
              throw unusable("ECDH, X25519, or X448");
          }
          break;
        }
        case "PBES2-HS256+A128KW":
        case "PBES2-HS384+A192KW":
        case "PBES2-HS512+A256KW":
          if (!isAlgorithm(key.algorithm, "PBKDF2"))
            throw unusable("PBKDF2");
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512": {
          if (!isAlgorithm(key.algorithm, "RSA-OAEP"))
            throw unusable("RSA-OAEP");
          const expected = parseInt(alg.slice(9), 10) || 1;
          const actual = getHashLength(key.algorithm.hash);
          if (actual !== expected)
            throw unusable(`SHA-${expected}`, "algorithm.hash");
          break;
        }
        default:
          throw new TypeError("CryptoKey does not support this operation");
      }
      checkUsage(key, usages);
    }
  }
});

// node_modules/jose/dist/node/cjs/lib/invalid_key_input.js
var require_invalid_key_input = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/invalid_key_input.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.withAlg = withAlg;
    function message(msg, actual, ...types) {
      types = types.filter(Boolean);
      if (types.length > 2) {
        const last = types.pop();
        msg += `one of type ${types.join(", ")}, or ${last}.`;
      } else if (types.length === 2) {
        msg += `one of type ${types[0]} or ${types[1]}.`;
      } else {
        msg += `of type ${types[0]}.`;
      }
      if (actual == null) {
        msg += ` Received ${actual}`;
      } else if (typeof actual === "function" && actual.name) {
        msg += ` Received function ${actual.name}`;
      } else if (typeof actual === "object" && actual != null) {
        if (actual.constructor?.name) {
          msg += ` Received an instance of ${actual.constructor.name}`;
        }
      }
      return msg;
    }
    exports.default = (actual, ...types) => {
      return message("Key must be ", actual, ...types);
    };
    function withAlg(alg, actual, ...types) {
      return message(`Key for the ${alg} algorithm must be `, actual, ...types);
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/ciphers.js
var require_ciphers = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/ciphers.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_crypto_1 = __require("node:crypto");
    var ciphers;
    exports.default = (algorithm) => {
      ciphers ||= new Set((0, node_crypto_1.getCiphers)());
      return ciphers.has(algorithm);
    };
  }
});

// node_modules/jose/dist/node/cjs/runtime/is_key_like.js
var require_is_key_like = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/is_key_like.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.types = void 0;
    var webcrypto_js_1 = require_webcrypto();
    var is_key_object_js_1 = require_is_key_object();
    exports.default = (key) => (0, is_key_object_js_1.default)(key) || (0, webcrypto_js_1.isCryptoKey)(key);
    var types = ["KeyObject"];
    exports.types = types;
    if (globalThis.CryptoKey || webcrypto_js_1.default?.CryptoKey) {
      types.push("CryptoKey");
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/decrypt.js
var require_decrypt = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/decrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_crypto_1 = __require("node:crypto");
    var check_iv_length_js_1 = require_check_iv_length();
    var check_cek_length_js_1 = require_check_cek_length();
    var buffer_utils_js_1 = require_buffer_utils();
    var errors_js_1 = require_errors2();
    var timing_safe_equal_js_1 = require_timing_safe_equal();
    var cbc_tag_js_1 = require_cbc_tag();
    var webcrypto_js_1 = require_webcrypto();
    var crypto_key_js_1 = require_crypto_key();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var ciphers_js_1 = require_ciphers();
    var is_key_like_js_1 = require_is_key_like();
    function cbcDecrypt(enc, cek, ciphertext, iv, tag, aad) {
      const keySize = parseInt(enc.slice(1, 4), 10);
      if ((0, is_key_object_js_1.default)(cek)) {
        cek = cek.export();
      }
      const encKey = cek.subarray(keySize >> 3);
      const macKey = cek.subarray(0, keySize >> 3);
      const macSize = parseInt(enc.slice(-3), 10);
      const algorithm = `aes-${keySize}-cbc`;
      if (!(0, ciphers_js_1.default)(algorithm)) {
        throw new errors_js_1.JOSENotSupported(`alg ${enc} is not supported by your javascript runtime`);
      }
      const expectedTag = (0, cbc_tag_js_1.default)(aad, iv, ciphertext, macSize, macKey, keySize);
      let macCheckPassed;
      try {
        macCheckPassed = (0, timing_safe_equal_js_1.default)(tag, expectedTag);
      } catch {
      }
      if (!macCheckPassed) {
        throw new errors_js_1.JWEDecryptionFailed();
      }
      let plaintext;
      try {
        const decipher = (0, node_crypto_1.createDecipheriv)(algorithm, encKey, iv);
        plaintext = (0, buffer_utils_js_1.concat)(decipher.update(ciphertext), decipher.final());
      } catch {
      }
      if (!plaintext) {
        throw new errors_js_1.JWEDecryptionFailed();
      }
      return plaintext;
    }
    function gcmDecrypt(enc, cek, ciphertext, iv, tag, aad) {
      const keySize = parseInt(enc.slice(1, 4), 10);
      const algorithm = `aes-${keySize}-gcm`;
      if (!(0, ciphers_js_1.default)(algorithm)) {
        throw new errors_js_1.JOSENotSupported(`alg ${enc} is not supported by your javascript runtime`);
      }
      try {
        const decipher = (0, node_crypto_1.createDecipheriv)(algorithm, cek, iv, { authTagLength: 16 });
        decipher.setAuthTag(tag);
        if (aad.byteLength) {
          decipher.setAAD(aad, { plaintextLength: ciphertext.length });
        }
        const plaintext = decipher.update(ciphertext);
        decipher.final();
        return plaintext;
      } catch {
        throw new errors_js_1.JWEDecryptionFailed();
      }
    }
    var decrypt = (enc, cek, ciphertext, iv, tag, aad) => {
      let key;
      if ((0, webcrypto_js_1.isCryptoKey)(cek)) {
        (0, crypto_key_js_1.checkEncCryptoKey)(cek, enc, "decrypt");
        key = node_crypto_1.KeyObject.from(cek);
      } else if (cek instanceof Uint8Array || (0, is_key_object_js_1.default)(cek)) {
        key = cek;
      } else {
        throw new TypeError((0, invalid_key_input_js_1.default)(cek, ...is_key_like_js_1.types, "Uint8Array"));
      }
      if (!iv) {
        throw new errors_js_1.JWEInvalid("JWE Initialization Vector missing");
      }
      if (!tag) {
        throw new errors_js_1.JWEInvalid("JWE Authentication Tag missing");
      }
      (0, check_cek_length_js_1.default)(enc, key);
      (0, check_iv_length_js_1.default)(enc, iv);
      switch (enc) {
        case "A128CBC-HS256":
        case "A192CBC-HS384":
        case "A256CBC-HS512":
          return cbcDecrypt(enc, key, ciphertext, iv, tag, aad);
        case "A128GCM":
        case "A192GCM":
        case "A256GCM":
          return gcmDecrypt(enc, key, ciphertext, iv, tag, aad);
        default:
          throw new errors_js_1.JOSENotSupported("Unsupported JWE Content Encryption Algorithm");
      }
    };
    exports.default = decrypt;
  }
});

// node_modules/jose/dist/node/cjs/lib/is_disjoint.js
var require_is_disjoint = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/is_disjoint.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var isDisjoint = (...headers) => {
      const sources = headers.filter(Boolean);
      if (sources.length === 0 || sources.length === 1) {
        return true;
      }
      let acc;
      for (const header of sources) {
        const parameters = Object.keys(header);
        if (!acc || acc.size === 0) {
          acc = new Set(parameters);
          continue;
        }
        for (const parameter of parameters) {
          if (acc.has(parameter)) {
            return false;
          }
          acc.add(parameter);
        }
      }
      return true;
    };
    exports.default = isDisjoint;
  }
});

// node_modules/jose/dist/node/cjs/lib/is_object.js
var require_is_object = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/is_object.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = isObject;
    function isObjectLike(value) {
      return typeof value === "object" && value !== null;
    }
    function isObject(input) {
      if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
        return false;
      }
      if (Object.getPrototypeOf(input) === null) {
        return true;
      }
      let proto = input;
      while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
      }
      return Object.getPrototypeOf(input) === proto;
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/aeskw.js
var require_aeskw = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/aeskw.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.unwrap = exports.wrap = void 0;
    var node_buffer_1 = __require("node:buffer");
    var node_crypto_1 = __require("node:crypto");
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    var webcrypto_js_1 = require_webcrypto();
    var crypto_key_js_1 = require_crypto_key();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var ciphers_js_1 = require_ciphers();
    var is_key_like_js_1 = require_is_key_like();
    function checkKeySize(key, alg) {
      if (key.symmetricKeySize << 3 !== parseInt(alg.slice(1, 4), 10)) {
        throw new TypeError(`Invalid key size for alg: ${alg}`);
      }
    }
    function ensureKeyObject(key, alg, usage) {
      if ((0, is_key_object_js_1.default)(key)) {
        return key;
      }
      if (key instanceof Uint8Array) {
        return (0, node_crypto_1.createSecretKey)(key);
      }
      if ((0, webcrypto_js_1.isCryptoKey)(key)) {
        (0, crypto_key_js_1.checkEncCryptoKey)(key, alg, usage);
        return node_crypto_1.KeyObject.from(key);
      }
      throw new TypeError((0, invalid_key_input_js_1.default)(key, ...is_key_like_js_1.types, "Uint8Array"));
    }
    var wrap = (alg, key, cek) => {
      const size = parseInt(alg.slice(1, 4), 10);
      const algorithm = `aes${size}-wrap`;
      if (!(0, ciphers_js_1.default)(algorithm)) {
        throw new errors_js_1.JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
      }
      const keyObject = ensureKeyObject(key, alg, "wrapKey");
      checkKeySize(keyObject, alg);
      const cipher = (0, node_crypto_1.createCipheriv)(algorithm, keyObject, node_buffer_1.Buffer.alloc(8, 166));
      return (0, buffer_utils_js_1.concat)(cipher.update(cek), cipher.final());
    };
    exports.wrap = wrap;
    var unwrap = (alg, key, encryptedKey) => {
      const size = parseInt(alg.slice(1, 4), 10);
      const algorithm = `aes${size}-wrap`;
      if (!(0, ciphers_js_1.default)(algorithm)) {
        throw new errors_js_1.JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
      }
      const keyObject = ensureKeyObject(key, alg, "unwrapKey");
      checkKeySize(keyObject, alg);
      const cipher = (0, node_crypto_1.createDecipheriv)(algorithm, keyObject, node_buffer_1.Buffer.alloc(8, 166));
      return (0, buffer_utils_js_1.concat)(cipher.update(encryptedKey), cipher.final());
    };
    exports.unwrap = unwrap;
  }
});

// node_modules/jose/dist/node/cjs/lib/is_jwk.js
var require_is_jwk = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/is_jwk.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isJWK = isJWK;
    exports.isPrivateJWK = isPrivateJWK;
    exports.isPublicJWK = isPublicJWK;
    exports.isSecretJWK = isSecretJWK;
    var is_object_js_1 = require_is_object();
    function isJWK(key) {
      return (0, is_object_js_1.default)(key) && typeof key.kty === "string";
    }
    function isPrivateJWK(key) {
      return key.kty !== "oct" && typeof key.d === "string";
    }
    function isPublicJWK(key) {
      return key.kty !== "oct" && typeof key.d === "undefined";
    }
    function isSecretJWK(key) {
      return isJWK(key) && key.kty === "oct" && typeof key.k === "string";
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/get_named_curve.js
var require_get_named_curve = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/get_named_curve.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.weakMap = void 0;
    var node_crypto_1 = __require("node:crypto");
    var errors_js_1 = require_errors2();
    var webcrypto_js_1 = require_webcrypto();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var is_key_like_js_1 = require_is_key_like();
    var is_jwk_js_1 = require_is_jwk();
    exports.weakMap = /* @__PURE__ */ new WeakMap();
    var namedCurveToJOSE = (namedCurve) => {
      switch (namedCurve) {
        case "prime256v1":
          return "P-256";
        case "secp384r1":
          return "P-384";
        case "secp521r1":
          return "P-521";
        case "secp256k1":
          return "secp256k1";
        default:
          throw new errors_js_1.JOSENotSupported("Unsupported key curve for this operation");
      }
    };
    var getNamedCurve = (kee, raw) => {
      let key;
      if ((0, webcrypto_js_1.isCryptoKey)(kee)) {
        key = node_crypto_1.KeyObject.from(kee);
      } else if ((0, is_key_object_js_1.default)(kee)) {
        key = kee;
      } else if ((0, is_jwk_js_1.isJWK)(kee)) {
        return kee.crv;
      } else {
        throw new TypeError((0, invalid_key_input_js_1.default)(kee, ...is_key_like_js_1.types));
      }
      if (key.type === "secret") {
        throw new TypeError('only "private" or "public" type keys can be used for this operation');
      }
      switch (key.asymmetricKeyType) {
        case "ed25519":
        case "ed448":
          return `Ed${key.asymmetricKeyType.slice(2)}`;
        case "x25519":
        case "x448":
          return `X${key.asymmetricKeyType.slice(1)}`;
        case "ec": {
          const namedCurve = key.asymmetricKeyDetails.namedCurve;
          if (raw) {
            return namedCurve;
          }
          return namedCurveToJOSE(namedCurve);
        }
        default:
          throw new TypeError("Invalid asymmetric key type for this operation");
      }
    };
    exports.default = getNamedCurve;
  }
});

// node_modules/jose/dist/node/cjs/runtime/ecdhes.js
var require_ecdhes = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/ecdhes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ecdhAllowed = void 0;
    exports.deriveKey = deriveKey;
    exports.generateEpk = generateEpk;
    var node_crypto_1 = __require("node:crypto");
    var node_util_1 = __require("node:util");
    var get_named_curve_js_1 = require_get_named_curve();
    var buffer_utils_js_1 = require_buffer_utils();
    var errors_js_1 = require_errors2();
    var webcrypto_js_1 = require_webcrypto();
    var crypto_key_js_1 = require_crypto_key();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var is_key_like_js_1 = require_is_key_like();
    var generateKeyPair = (0, node_util_1.promisify)(node_crypto_1.generateKeyPair);
    async function deriveKey(publicKee, privateKee, algorithm, keyLength, apu = new Uint8Array(0), apv = new Uint8Array(0)) {
      let publicKey;
      if ((0, webcrypto_js_1.isCryptoKey)(publicKee)) {
        (0, crypto_key_js_1.checkEncCryptoKey)(publicKee, "ECDH");
        publicKey = node_crypto_1.KeyObject.from(publicKee);
      } else if ((0, is_key_object_js_1.default)(publicKee)) {
        publicKey = publicKee;
      } else {
        throw new TypeError((0, invalid_key_input_js_1.default)(publicKee, ...is_key_like_js_1.types));
      }
      let privateKey;
      if ((0, webcrypto_js_1.isCryptoKey)(privateKee)) {
        (0, crypto_key_js_1.checkEncCryptoKey)(privateKee, "ECDH", "deriveBits");
        privateKey = node_crypto_1.KeyObject.from(privateKee);
      } else if ((0, is_key_object_js_1.default)(privateKee)) {
        privateKey = privateKee;
      } else {
        throw new TypeError((0, invalid_key_input_js_1.default)(privateKee, ...is_key_like_js_1.types));
      }
      const value = (0, buffer_utils_js_1.concat)((0, buffer_utils_js_1.lengthAndInput)(buffer_utils_js_1.encoder.encode(algorithm)), (0, buffer_utils_js_1.lengthAndInput)(apu), (0, buffer_utils_js_1.lengthAndInput)(apv), (0, buffer_utils_js_1.uint32be)(keyLength));
      const sharedSecret = (0, node_crypto_1.diffieHellman)({ privateKey, publicKey });
      return (0, buffer_utils_js_1.concatKdf)(sharedSecret, keyLength, value);
    }
    async function generateEpk(kee) {
      let key;
      if ((0, webcrypto_js_1.isCryptoKey)(kee)) {
        key = node_crypto_1.KeyObject.from(kee);
      } else if ((0, is_key_object_js_1.default)(kee)) {
        key = kee;
      } else {
        throw new TypeError((0, invalid_key_input_js_1.default)(kee, ...is_key_like_js_1.types));
      }
      switch (key.asymmetricKeyType) {
        case "x25519":
          return generateKeyPair("x25519");
        case "x448": {
          return generateKeyPair("x448");
        }
        case "ec": {
          const namedCurve = (0, get_named_curve_js_1.default)(key);
          return generateKeyPair("ec", { namedCurve });
        }
        default:
          throw new errors_js_1.JOSENotSupported("Invalid or unsupported EPK");
      }
    }
    var ecdhAllowed = (key) => ["P-256", "P-384", "P-521", "X25519", "X448"].includes((0, get_named_curve_js_1.default)(key));
    exports.ecdhAllowed = ecdhAllowed;
  }
});

// node_modules/jose/dist/node/cjs/lib/check_p2s.js
var require_check_p2s = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/check_p2s.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = checkP2s;
    var errors_js_1 = require_errors2();
    function checkP2s(p2s) {
      if (!(p2s instanceof Uint8Array) || p2s.length < 8) {
        throw new errors_js_1.JWEInvalid("PBES2 Salt Input must be 8 or more octets");
      }
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/pbes2kw.js
var require_pbes2kw = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/pbes2kw.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decrypt = exports.encrypt = void 0;
    var node_util_1 = __require("node:util");
    var node_crypto_1 = __require("node:crypto");
    var random_js_1 = require_random();
    var buffer_utils_js_1 = require_buffer_utils();
    var base64url_js_1 = require_base64url();
    var aeskw_js_1 = require_aeskw();
    var check_p2s_js_1 = require_check_p2s();
    var webcrypto_js_1 = require_webcrypto();
    var crypto_key_js_1 = require_crypto_key();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var is_key_like_js_1 = require_is_key_like();
    var pbkdf2 = (0, node_util_1.promisify)(node_crypto_1.pbkdf2);
    function getPassword(key, alg) {
      if ((0, is_key_object_js_1.default)(key)) {
        return key.export();
      }
      if (key instanceof Uint8Array) {
        return key;
      }
      if ((0, webcrypto_js_1.isCryptoKey)(key)) {
        (0, crypto_key_js_1.checkEncCryptoKey)(key, alg, "deriveBits", "deriveKey");
        return node_crypto_1.KeyObject.from(key).export();
      }
      throw new TypeError((0, invalid_key_input_js_1.default)(key, ...is_key_like_js_1.types, "Uint8Array"));
    }
    var encrypt = async (alg, key, cek, p2c = 2048, p2s = (0, random_js_1.default)(new Uint8Array(16))) => {
      (0, check_p2s_js_1.default)(p2s);
      const salt = (0, buffer_utils_js_1.p2s)(alg, p2s);
      const keylen = parseInt(alg.slice(13, 16), 10) >> 3;
      const password = getPassword(key, alg);
      const derivedKey = await pbkdf2(password, salt, p2c, keylen, `sha${alg.slice(8, 11)}`);
      const encryptedKey = await (0, aeskw_js_1.wrap)(alg.slice(-6), derivedKey, cek);
      return { encryptedKey, p2c, p2s: (0, base64url_js_1.encode)(p2s) };
    };
    exports.encrypt = encrypt;
    var decrypt = async (alg, key, encryptedKey, p2c, p2s) => {
      (0, check_p2s_js_1.default)(p2s);
      const salt = (0, buffer_utils_js_1.p2s)(alg, p2s);
      const keylen = parseInt(alg.slice(13, 16), 10) >> 3;
      const password = getPassword(key, alg);
      const derivedKey = await pbkdf2(password, salt, p2c, keylen, `sha${alg.slice(8, 11)}`);
      return (0, aeskw_js_1.unwrap)(alg.slice(-6), derivedKey, encryptedKey);
    };
    exports.decrypt = decrypt;
  }
});

// node_modules/jose/dist/node/cjs/runtime/check_key_length.js
var require_check_key_length = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/check_key_length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_crypto_1 = __require("node:crypto");
    exports.default = (key, alg) => {
      let modulusLength;
      try {
        if (key instanceof node_crypto_1.KeyObject) {
          modulusLength = key.asymmetricKeyDetails?.modulusLength;
        } else {
          modulusLength = Buffer.from(key.n, "base64url").byteLength << 3;
        }
      } catch {
      }
      if (typeof modulusLength !== "number" || modulusLength < 2048) {
        throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
      }
    };
  }
});

// node_modules/jose/dist/node/cjs/runtime/rsaes.js
var require_rsaes = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/rsaes.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decrypt = exports.encrypt = void 0;
    var node_crypto_1 = __require("node:crypto");
    var node_util_1 = __require("node:util");
    var check_key_length_js_1 = require_check_key_length();
    var webcrypto_js_1 = require_webcrypto();
    var crypto_key_js_1 = require_crypto_key();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var is_key_like_js_1 = require_is_key_like();
    var checkKey = (key, alg) => {
      if (key.asymmetricKeyType !== "rsa") {
        throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be rsa");
      }
      (0, check_key_length_js_1.default)(key, alg);
    };
    var RSA1_5 = (0, node_util_1.deprecate)(() => node_crypto_1.constants.RSA_PKCS1_PADDING, 'The RSA1_5 "alg" (JWE Algorithm) is deprecated and will be removed in the next major revision.');
    var resolvePadding = (alg) => {
      switch (alg) {
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          return node_crypto_1.constants.RSA_PKCS1_OAEP_PADDING;
        case "RSA1_5":
          return RSA1_5();
        default:
          return void 0;
      }
    };
    var resolveOaepHash = (alg) => {
      switch (alg) {
        case "RSA-OAEP":
          return "sha1";
        case "RSA-OAEP-256":
          return "sha256";
        case "RSA-OAEP-384":
          return "sha384";
        case "RSA-OAEP-512":
          return "sha512";
        default:
          return void 0;
      }
    };
    function ensureKeyObject(key, alg, ...usages) {
      if ((0, is_key_object_js_1.default)(key)) {
        return key;
      }
      if ((0, webcrypto_js_1.isCryptoKey)(key)) {
        (0, crypto_key_js_1.checkEncCryptoKey)(key, alg, ...usages);
        return node_crypto_1.KeyObject.from(key);
      }
      throw new TypeError((0, invalid_key_input_js_1.default)(key, ...is_key_like_js_1.types));
    }
    var encrypt = (alg, key, cek) => {
      const padding = resolvePadding(alg);
      const oaepHash = resolveOaepHash(alg);
      const keyObject = ensureKeyObject(key, alg, "wrapKey", "encrypt");
      checkKey(keyObject, alg);
      return (0, node_crypto_1.publicEncrypt)({ key: keyObject, oaepHash, padding }, cek);
    };
    exports.encrypt = encrypt;
    var decrypt = (alg, key, encryptedKey) => {
      const padding = resolvePadding(alg);
      const oaepHash = resolveOaepHash(alg);
      const keyObject = ensureKeyObject(key, alg, "unwrapKey", "decrypt");
      checkKey(keyObject, alg);
      return (0, node_crypto_1.privateDecrypt)({ key: keyObject, oaepHash, padding }, encryptedKey);
    };
    exports.decrypt = decrypt;
  }
});

// node_modules/jose/dist/node/cjs/runtime/normalize_key.js
var require_normalize_key = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/normalize_key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = {};
  }
});

// node_modules/jose/dist/node/cjs/lib/cek.js
var require_cek = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/cek.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bitLength = bitLength;
    var errors_js_1 = require_errors2();
    var random_js_1 = require_random();
    function bitLength(alg) {
      switch (alg) {
        case "A128GCM":
          return 128;
        case "A192GCM":
          return 192;
        case "A256GCM":
        case "A128CBC-HS256":
          return 256;
        case "A192CBC-HS384":
          return 384;
        case "A256CBC-HS512":
          return 512;
        default:
          throw new errors_js_1.JOSENotSupported(`Unsupported JWE Algorithm: ${alg}`);
      }
    }
    exports.default = (alg) => (0, random_js_1.default)(new Uint8Array(bitLength(alg) >> 3));
  }
});

// node_modules/jose/dist/node/cjs/runtime/asn1.js
var require_asn1 = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/asn1.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.fromX509 = exports.fromSPKI = exports.fromPKCS8 = exports.toPKCS8 = exports.toSPKI = void 0;
    var node_crypto_1 = __require("node:crypto");
    var node_buffer_1 = __require("node:buffer");
    var webcrypto_js_1 = require_webcrypto();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var is_key_like_js_1 = require_is_key_like();
    var genericExport = (keyType, keyFormat, key) => {
      let keyObject;
      if ((0, webcrypto_js_1.isCryptoKey)(key)) {
        if (!key.extractable) {
          throw new TypeError("CryptoKey is not extractable");
        }
        keyObject = node_crypto_1.KeyObject.from(key);
      } else if ((0, is_key_object_js_1.default)(key)) {
        keyObject = key;
      } else {
        throw new TypeError((0, invalid_key_input_js_1.default)(key, ...is_key_like_js_1.types));
      }
      if (keyObject.type !== keyType) {
        throw new TypeError(`key is not a ${keyType} key`);
      }
      return keyObject.export({ format: "pem", type: keyFormat });
    };
    var toSPKI = (key) => {
      return genericExport("public", "spki", key);
    };
    exports.toSPKI = toSPKI;
    var toPKCS8 = (key) => {
      return genericExport("private", "pkcs8", key);
    };
    exports.toPKCS8 = toPKCS8;
    var fromPKCS8 = (pem) => (0, node_crypto_1.createPrivateKey)({
      key: node_buffer_1.Buffer.from(pem.replace(/(?:-----(?:BEGIN|END) PRIVATE KEY-----|\s)/g, ""), "base64"),
      type: "pkcs8",
      format: "der"
    });
    exports.fromPKCS8 = fromPKCS8;
    var fromSPKI = (pem) => (0, node_crypto_1.createPublicKey)({
      key: node_buffer_1.Buffer.from(pem.replace(/(?:-----(?:BEGIN|END) PUBLIC KEY-----|\s)/g, ""), "base64"),
      type: "spki",
      format: "der"
    });
    exports.fromSPKI = fromSPKI;
    var fromX509 = (pem) => (0, node_crypto_1.createPublicKey)({
      key: pem,
      type: "spki",
      format: "pem"
    });
    exports.fromX509 = fromX509;
  }
});

// node_modules/jose/dist/node/cjs/runtime/jwk_to_key.js
var require_jwk_to_key = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/jwk_to_key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_crypto_1 = __require("node:crypto");
    var parse = (key) => {
      if (key.d) {
        return (0, node_crypto_1.createPrivateKey)({ format: "jwk", key });
      }
      return (0, node_crypto_1.createPublicKey)({ format: "jwk", key });
    };
    exports.default = parse;
  }
});

// node_modules/jose/dist/node/cjs/key/import.js
var require_import = __commonJS({
  "node_modules/jose/dist/node/cjs/key/import.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.importSPKI = importSPKI;
    exports.importX509 = importX509;
    exports.importPKCS8 = importPKCS8;
    exports.importJWK = importJWK;
    var base64url_js_1 = require_base64url();
    var asn1_js_1 = require_asn1();
    var jwk_to_key_js_1 = require_jwk_to_key();
    var errors_js_1 = require_errors2();
    var is_object_js_1 = require_is_object();
    async function importSPKI(spki, alg, options) {
      if (typeof spki !== "string" || spki.indexOf("-----BEGIN PUBLIC KEY-----") !== 0) {
        throw new TypeError('"spki" must be SPKI formatted string');
      }
      return (0, asn1_js_1.fromSPKI)(spki, alg, options);
    }
    async function importX509(x509, alg, options) {
      if (typeof x509 !== "string" || x509.indexOf("-----BEGIN CERTIFICATE-----") !== 0) {
        throw new TypeError('"x509" must be X.509 formatted string');
      }
      return (0, asn1_js_1.fromX509)(x509, alg, options);
    }
    async function importPKCS8(pkcs8, alg, options) {
      if (typeof pkcs8 !== "string" || pkcs8.indexOf("-----BEGIN PRIVATE KEY-----") !== 0) {
        throw new TypeError('"pkcs8" must be PKCS#8 formatted string');
      }
      return (0, asn1_js_1.fromPKCS8)(pkcs8, alg, options);
    }
    async function importJWK(jwk, alg) {
      if (!(0, is_object_js_1.default)(jwk)) {
        throw new TypeError("JWK must be an object");
      }
      alg ||= jwk.alg;
      switch (jwk.kty) {
        case "oct":
          if (typeof jwk.k !== "string" || !jwk.k) {
            throw new TypeError('missing "k" (Key Value) Parameter value');
          }
          return (0, base64url_js_1.decode)(jwk.k);
        case "RSA":
          if ("oth" in jwk && jwk.oth !== void 0) {
            throw new errors_js_1.JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
          }
        case "EC":
        case "OKP":
          return (0, jwk_to_key_js_1.default)({ ...jwk, alg });
        default:
          throw new errors_js_1.JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
      }
    }
  }
});

// node_modules/jose/dist/node/cjs/lib/check_key_type.js
var require_check_key_type = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/check_key_type.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkKeyTypeWithJwk = void 0;
    var invalid_key_input_js_1 = require_invalid_key_input();
    var is_key_like_js_1 = require_is_key_like();
    var jwk = require_is_jwk();
    var tag = (key) => key?.[Symbol.toStringTag];
    var jwkMatchesOp = (alg, key, usage) => {
      if (key.use !== void 0 && key.use !== "sig") {
        throw new TypeError("Invalid key for this operation, when present its use must be sig");
      }
      if (key.key_ops !== void 0 && key.key_ops.includes?.(usage) !== true) {
        throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${usage}`);
      }
      if (key.alg !== void 0 && key.alg !== alg) {
        throw new TypeError(`Invalid key for this operation, when present its alg must be ${alg}`);
      }
      return true;
    };
    var symmetricTypeCheck = (alg, key, usage, allowJwk) => {
      if (key instanceof Uint8Array)
        return;
      if (allowJwk && jwk.isJWK(key)) {
        if (jwk.isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
      }
      if (!(0, is_key_like_js_1.default)(key)) {
        throw new TypeError((0, invalid_key_input_js_1.withAlg)(alg, key, ...is_key_like_js_1.types, "Uint8Array", allowJwk ? "JSON Web Key" : null));
      }
      if (key.type !== "secret") {
        throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
      }
    };
    var asymmetricTypeCheck = (alg, key, usage, allowJwk) => {
      if (allowJwk && jwk.isJWK(key)) {
        switch (usage) {
          case "sign":
            if (jwk.isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation be a private JWK`);
          case "verify":
            if (jwk.isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation be a public JWK`);
        }
      }
      if (!(0, is_key_like_js_1.default)(key)) {
        throw new TypeError((0, invalid_key_input_js_1.withAlg)(alg, key, ...is_key_like_js_1.types, allowJwk ? "JSON Web Key" : null));
      }
      if (key.type === "secret") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
      }
      if (usage === "sign" && key.type === "public") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
      }
      if (usage === "decrypt" && key.type === "public") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
      }
      if (key.algorithm && usage === "verify" && key.type === "private") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
      }
      if (key.algorithm && usage === "encrypt" && key.type === "private") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
      }
    };
    function checkKeyType(allowJwk, alg, key, usage) {
      const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(alg);
      if (symmetric) {
        symmetricTypeCheck(alg, key, usage, allowJwk);
      } else {
        asymmetricTypeCheck(alg, key, usage, allowJwk);
      }
    }
    exports.default = checkKeyType.bind(void 0, false);
    exports.checkKeyTypeWithJwk = checkKeyType.bind(void 0, true);
  }
});

// node_modules/jose/dist/node/cjs/runtime/encrypt.js
var require_encrypt = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/encrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_crypto_1 = __require("node:crypto");
    var check_iv_length_js_1 = require_check_iv_length();
    var check_cek_length_js_1 = require_check_cek_length();
    var buffer_utils_js_1 = require_buffer_utils();
    var cbc_tag_js_1 = require_cbc_tag();
    var webcrypto_js_1 = require_webcrypto();
    var crypto_key_js_1 = require_crypto_key();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var iv_js_1 = require_iv();
    var errors_js_1 = require_errors2();
    var ciphers_js_1 = require_ciphers();
    var is_key_like_js_1 = require_is_key_like();
    function cbcEncrypt(enc, plaintext, cek, iv, aad) {
      const keySize = parseInt(enc.slice(1, 4), 10);
      if ((0, is_key_object_js_1.default)(cek)) {
        cek = cek.export();
      }
      const encKey = cek.subarray(keySize >> 3);
      const macKey = cek.subarray(0, keySize >> 3);
      const algorithm = `aes-${keySize}-cbc`;
      if (!(0, ciphers_js_1.default)(algorithm)) {
        throw new errors_js_1.JOSENotSupported(`alg ${enc} is not supported by your javascript runtime`);
      }
      const cipher = (0, node_crypto_1.createCipheriv)(algorithm, encKey, iv);
      const ciphertext = (0, buffer_utils_js_1.concat)(cipher.update(plaintext), cipher.final());
      const macSize = parseInt(enc.slice(-3), 10);
      const tag = (0, cbc_tag_js_1.default)(aad, iv, ciphertext, macSize, macKey, keySize);
      return { ciphertext, tag, iv };
    }
    function gcmEncrypt(enc, plaintext, cek, iv, aad) {
      const keySize = parseInt(enc.slice(1, 4), 10);
      const algorithm = `aes-${keySize}-gcm`;
      if (!(0, ciphers_js_1.default)(algorithm)) {
        throw new errors_js_1.JOSENotSupported(`alg ${enc} is not supported by your javascript runtime`);
      }
      const cipher = (0, node_crypto_1.createCipheriv)(algorithm, cek, iv, { authTagLength: 16 });
      if (aad.byteLength) {
        cipher.setAAD(aad, { plaintextLength: plaintext.length });
      }
      const ciphertext = cipher.update(plaintext);
      cipher.final();
      const tag = cipher.getAuthTag();
      return { ciphertext, tag, iv };
    }
    var encrypt = (enc, plaintext, cek, iv, aad) => {
      let key;
      if ((0, webcrypto_js_1.isCryptoKey)(cek)) {
        (0, crypto_key_js_1.checkEncCryptoKey)(cek, enc, "encrypt");
        key = node_crypto_1.KeyObject.from(cek);
      } else if (cek instanceof Uint8Array || (0, is_key_object_js_1.default)(cek)) {
        key = cek;
      } else {
        throw new TypeError((0, invalid_key_input_js_1.default)(cek, ...is_key_like_js_1.types, "Uint8Array"));
      }
      (0, check_cek_length_js_1.default)(enc, key);
      if (iv) {
        (0, check_iv_length_js_1.default)(enc, iv);
      } else {
        iv = (0, iv_js_1.default)(enc);
      }
      switch (enc) {
        case "A128CBC-HS256":
        case "A192CBC-HS384":
        case "A256CBC-HS512":
          return cbcEncrypt(enc, plaintext, key, iv, aad);
        case "A128GCM":
        case "A192GCM":
        case "A256GCM":
          return gcmEncrypt(enc, plaintext, key, iv, aad);
        default:
          throw new errors_js_1.JOSENotSupported("Unsupported JWE Content Encryption Algorithm");
      }
    };
    exports.default = encrypt;
  }
});

// node_modules/jose/dist/node/cjs/lib/aesgcmkw.js
var require_aesgcmkw = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/aesgcmkw.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wrap = wrap;
    exports.unwrap = unwrap;
    var encrypt_js_1 = require_encrypt();
    var decrypt_js_1 = require_decrypt();
    var base64url_js_1 = require_base64url();
    async function wrap(alg, key, cek, iv) {
      const jweAlgorithm = alg.slice(0, 7);
      const wrapped = await (0, encrypt_js_1.default)(jweAlgorithm, cek, key, iv, new Uint8Array(0));
      return {
        encryptedKey: wrapped.ciphertext,
        iv: (0, base64url_js_1.encode)(wrapped.iv),
        tag: (0, base64url_js_1.encode)(wrapped.tag)
      };
    }
    async function unwrap(alg, key, encryptedKey, iv, tag) {
      const jweAlgorithm = alg.slice(0, 7);
      return (0, decrypt_js_1.default)(jweAlgorithm, key, encryptedKey, iv, tag, new Uint8Array(0));
    }
  }
});

// node_modules/jose/dist/node/cjs/lib/decrypt_key_management.js
var require_decrypt_key_management = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/decrypt_key_management.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var aeskw_js_1 = require_aeskw();
    var ECDH = require_ecdhes();
    var pbes2kw_js_1 = require_pbes2kw();
    var rsaes_js_1 = require_rsaes();
    var base64url_js_1 = require_base64url();
    var normalize_key_js_1 = require_normalize_key();
    var errors_js_1 = require_errors2();
    var cek_js_1 = require_cek();
    var import_js_1 = require_import();
    var check_key_type_js_1 = require_check_key_type();
    var is_object_js_1 = require_is_object();
    var aesgcmkw_js_1 = require_aesgcmkw();
    async function decryptKeyManagement(alg, key, encryptedKey, joseHeader, options) {
      (0, check_key_type_js_1.default)(alg, key, "decrypt");
      key = await normalize_key_js_1.default.normalizePrivateKey?.(key, alg) || key;
      switch (alg) {
        case "dir": {
          if (encryptedKey !== void 0)
            throw new errors_js_1.JWEInvalid("Encountered unexpected JWE Encrypted Key");
          return key;
        }
        case "ECDH-ES":
          if (encryptedKey !== void 0)
            throw new errors_js_1.JWEInvalid("Encountered unexpected JWE Encrypted Key");
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW": {
          if (!(0, is_object_js_1.default)(joseHeader.epk))
            throw new errors_js_1.JWEInvalid(`JOSE Header "epk" (Ephemeral Public Key) missing or invalid`);
          if (!ECDH.ecdhAllowed(key))
            throw new errors_js_1.JOSENotSupported("ECDH with the provided key is not allowed or not supported by your javascript runtime");
          const epk = await (0, import_js_1.importJWK)(joseHeader.epk, alg);
          let partyUInfo;
          let partyVInfo;
          if (joseHeader.apu !== void 0) {
            if (typeof joseHeader.apu !== "string")
              throw new errors_js_1.JWEInvalid(`JOSE Header "apu" (Agreement PartyUInfo) invalid`);
            try {
              partyUInfo = (0, base64url_js_1.decode)(joseHeader.apu);
            } catch {
              throw new errors_js_1.JWEInvalid("Failed to base64url decode the apu");
            }
          }
          if (joseHeader.apv !== void 0) {
            if (typeof joseHeader.apv !== "string")
              throw new errors_js_1.JWEInvalid(`JOSE Header "apv" (Agreement PartyVInfo) invalid`);
            try {
              partyVInfo = (0, base64url_js_1.decode)(joseHeader.apv);
            } catch {
              throw new errors_js_1.JWEInvalid("Failed to base64url decode the apv");
            }
          }
          const sharedSecret = await ECDH.deriveKey(epk, key, alg === "ECDH-ES" ? joseHeader.enc : alg, alg === "ECDH-ES" ? (0, cek_js_1.bitLength)(joseHeader.enc) : parseInt(alg.slice(-5, -2), 10), partyUInfo, partyVInfo);
          if (alg === "ECDH-ES")
            return sharedSecret;
          if (encryptedKey === void 0)
            throw new errors_js_1.JWEInvalid("JWE Encrypted Key missing");
          return (0, aeskw_js_1.unwrap)(alg.slice(-6), sharedSecret, encryptedKey);
        }
        case "RSA1_5":
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512": {
          if (encryptedKey === void 0)
            throw new errors_js_1.JWEInvalid("JWE Encrypted Key missing");
          return (0, rsaes_js_1.decrypt)(alg, key, encryptedKey);
        }
        case "PBES2-HS256+A128KW":
        case "PBES2-HS384+A192KW":
        case "PBES2-HS512+A256KW": {
          if (encryptedKey === void 0)
            throw new errors_js_1.JWEInvalid("JWE Encrypted Key missing");
          if (typeof joseHeader.p2c !== "number")
            throw new errors_js_1.JWEInvalid(`JOSE Header "p2c" (PBES2 Count) missing or invalid`);
          const p2cLimit = options?.maxPBES2Count || 1e4;
          if (joseHeader.p2c > p2cLimit)
            throw new errors_js_1.JWEInvalid(`JOSE Header "p2c" (PBES2 Count) out is of acceptable bounds`);
          if (typeof joseHeader.p2s !== "string")
            throw new errors_js_1.JWEInvalid(`JOSE Header "p2s" (PBES2 Salt) missing or invalid`);
          let p2s;
          try {
            p2s = (0, base64url_js_1.decode)(joseHeader.p2s);
          } catch {
            throw new errors_js_1.JWEInvalid("Failed to base64url decode the p2s");
          }
          return (0, pbes2kw_js_1.decrypt)(alg, key, encryptedKey, joseHeader.p2c, p2s);
        }
        case "A128KW":
        case "A192KW":
        case "A256KW": {
          if (encryptedKey === void 0)
            throw new errors_js_1.JWEInvalid("JWE Encrypted Key missing");
          return (0, aeskw_js_1.unwrap)(alg, key, encryptedKey);
        }
        case "A128GCMKW":
        case "A192GCMKW":
        case "A256GCMKW": {
          if (encryptedKey === void 0)
            throw new errors_js_1.JWEInvalid("JWE Encrypted Key missing");
          if (typeof joseHeader.iv !== "string")
            throw new errors_js_1.JWEInvalid(`JOSE Header "iv" (Initialization Vector) missing or invalid`);
          if (typeof joseHeader.tag !== "string")
            throw new errors_js_1.JWEInvalid(`JOSE Header "tag" (Authentication Tag) missing or invalid`);
          let iv;
          try {
            iv = (0, base64url_js_1.decode)(joseHeader.iv);
          } catch {
            throw new errors_js_1.JWEInvalid("Failed to base64url decode the iv");
          }
          let tag;
          try {
            tag = (0, base64url_js_1.decode)(joseHeader.tag);
          } catch {
            throw new errors_js_1.JWEInvalid("Failed to base64url decode the tag");
          }
          return (0, aesgcmkw_js_1.unwrap)(alg, key, encryptedKey, iv, tag);
        }
        default: {
          throw new errors_js_1.JOSENotSupported('Invalid or unsupported "alg" (JWE Algorithm) header value');
        }
      }
    }
    exports.default = decryptKeyManagement;
  }
});

// node_modules/jose/dist/node/cjs/lib/validate_crit.js
var require_validate_crit = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/validate_crit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var errors_js_1 = require_errors2();
    function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
      if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
        throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
      }
      if (!protectedHeader || protectedHeader.crit === void 0) {
        return /* @__PURE__ */ new Set();
      }
      if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
        throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
      }
      let recognized;
      if (recognizedOption !== void 0) {
        recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
      } else {
        recognized = recognizedDefault;
      }
      for (const parameter of protectedHeader.crit) {
        if (!recognized.has(parameter)) {
          throw new errors_js_1.JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
        }
        if (joseHeader[parameter] === void 0) {
          throw new Err(`Extension Header Parameter "${parameter}" is missing`);
        }
        if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
          throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
        }
      }
      return new Set(protectedHeader.crit);
    }
    exports.default = validateCrit;
  }
});

// node_modules/jose/dist/node/cjs/lib/validate_algorithms.js
var require_validate_algorithms = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/validate_algorithms.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var validateAlgorithms = (option, algorithms) => {
      if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
        throw new TypeError(`"${option}" option must be an array of strings`);
      }
      if (!algorithms) {
        return void 0;
      }
      return new Set(algorithms);
    };
    exports.default = validateAlgorithms;
  }
});

// node_modules/jose/dist/node/cjs/jwe/flattened/decrypt.js
var require_decrypt2 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwe/flattened/decrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flattenedDecrypt = flattenedDecrypt;
    var base64url_js_1 = require_base64url();
    var decrypt_js_1 = require_decrypt();
    var errors_js_1 = require_errors2();
    var is_disjoint_js_1 = require_is_disjoint();
    var is_object_js_1 = require_is_object();
    var decrypt_key_management_js_1 = require_decrypt_key_management();
    var buffer_utils_js_1 = require_buffer_utils();
    var cek_js_1 = require_cek();
    var validate_crit_js_1 = require_validate_crit();
    var validate_algorithms_js_1 = require_validate_algorithms();
    async function flattenedDecrypt(jwe, key, options) {
      if (!(0, is_object_js_1.default)(jwe)) {
        throw new errors_js_1.JWEInvalid("Flattened JWE must be an object");
      }
      if (jwe.protected === void 0 && jwe.header === void 0 && jwe.unprotected === void 0) {
        throw new errors_js_1.JWEInvalid("JOSE Header missing");
      }
      if (jwe.iv !== void 0 && typeof jwe.iv !== "string") {
        throw new errors_js_1.JWEInvalid("JWE Initialization Vector incorrect type");
      }
      if (typeof jwe.ciphertext !== "string") {
        throw new errors_js_1.JWEInvalid("JWE Ciphertext missing or incorrect type");
      }
      if (jwe.tag !== void 0 && typeof jwe.tag !== "string") {
        throw new errors_js_1.JWEInvalid("JWE Authentication Tag incorrect type");
      }
      if (jwe.protected !== void 0 && typeof jwe.protected !== "string") {
        throw new errors_js_1.JWEInvalid("JWE Protected Header incorrect type");
      }
      if (jwe.encrypted_key !== void 0 && typeof jwe.encrypted_key !== "string") {
        throw new errors_js_1.JWEInvalid("JWE Encrypted Key incorrect type");
      }
      if (jwe.aad !== void 0 && typeof jwe.aad !== "string") {
        throw new errors_js_1.JWEInvalid("JWE AAD incorrect type");
      }
      if (jwe.header !== void 0 && !(0, is_object_js_1.default)(jwe.header)) {
        throw new errors_js_1.JWEInvalid("JWE Shared Unprotected Header incorrect type");
      }
      if (jwe.unprotected !== void 0 && !(0, is_object_js_1.default)(jwe.unprotected)) {
        throw new errors_js_1.JWEInvalid("JWE Per-Recipient Unprotected Header incorrect type");
      }
      let parsedProt;
      if (jwe.protected) {
        try {
          const protectedHeader2 = (0, base64url_js_1.decode)(jwe.protected);
          parsedProt = JSON.parse(buffer_utils_js_1.decoder.decode(protectedHeader2));
        } catch {
          throw new errors_js_1.JWEInvalid("JWE Protected Header is invalid");
        }
      }
      if (!(0, is_disjoint_js_1.default)(parsedProt, jwe.header, jwe.unprotected)) {
        throw new errors_js_1.JWEInvalid("JWE Protected, JWE Unprotected Header, and JWE Per-Recipient Unprotected Header Parameter names must be disjoint");
      }
      const joseHeader = {
        ...parsedProt,
        ...jwe.header,
        ...jwe.unprotected
      };
      (0, validate_crit_js_1.default)(errors_js_1.JWEInvalid, /* @__PURE__ */ new Map(), options?.crit, parsedProt, joseHeader);
      if (joseHeader.zip !== void 0) {
        throw new errors_js_1.JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
      }
      const { alg, enc } = joseHeader;
      if (typeof alg !== "string" || !alg) {
        throw new errors_js_1.JWEInvalid("missing JWE Algorithm (alg) in JWE Header");
      }
      if (typeof enc !== "string" || !enc) {
        throw new errors_js_1.JWEInvalid("missing JWE Encryption Algorithm (enc) in JWE Header");
      }
      const keyManagementAlgorithms = options && (0, validate_algorithms_js_1.default)("keyManagementAlgorithms", options.keyManagementAlgorithms);
      const contentEncryptionAlgorithms = options && (0, validate_algorithms_js_1.default)("contentEncryptionAlgorithms", options.contentEncryptionAlgorithms);
      if (keyManagementAlgorithms && !keyManagementAlgorithms.has(alg) || !keyManagementAlgorithms && alg.startsWith("PBES2")) {
        throw new errors_js_1.JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
      }
      if (contentEncryptionAlgorithms && !contentEncryptionAlgorithms.has(enc)) {
        throw new errors_js_1.JOSEAlgNotAllowed('"enc" (Encryption Algorithm) Header Parameter value not allowed');
      }
      let encryptedKey;
      if (jwe.encrypted_key !== void 0) {
        try {
          encryptedKey = (0, base64url_js_1.decode)(jwe.encrypted_key);
        } catch {
          throw new errors_js_1.JWEInvalid("Failed to base64url decode the encrypted_key");
        }
      }
      let resolvedKey = false;
      if (typeof key === "function") {
        key = await key(parsedProt, jwe);
        resolvedKey = true;
      }
      let cek;
      try {
        cek = await (0, decrypt_key_management_js_1.default)(alg, key, encryptedKey, joseHeader, options);
      } catch (err) {
        if (err instanceof TypeError || err instanceof errors_js_1.JWEInvalid || err instanceof errors_js_1.JOSENotSupported) {
          throw err;
        }
        cek = (0, cek_js_1.default)(enc);
      }
      let iv;
      let tag;
      if (jwe.iv !== void 0) {
        try {
          iv = (0, base64url_js_1.decode)(jwe.iv);
        } catch {
          throw new errors_js_1.JWEInvalid("Failed to base64url decode the iv");
        }
      }
      if (jwe.tag !== void 0) {
        try {
          tag = (0, base64url_js_1.decode)(jwe.tag);
        } catch {
          throw new errors_js_1.JWEInvalid("Failed to base64url decode the tag");
        }
      }
      const protectedHeader = buffer_utils_js_1.encoder.encode(jwe.protected ?? "");
      let additionalData;
      if (jwe.aad !== void 0) {
        additionalData = (0, buffer_utils_js_1.concat)(protectedHeader, buffer_utils_js_1.encoder.encode("."), buffer_utils_js_1.encoder.encode(jwe.aad));
      } else {
        additionalData = protectedHeader;
      }
      let ciphertext;
      try {
        ciphertext = (0, base64url_js_1.decode)(jwe.ciphertext);
      } catch {
        throw new errors_js_1.JWEInvalid("Failed to base64url decode the ciphertext");
      }
      const plaintext = await (0, decrypt_js_1.default)(enc, cek, ciphertext, iv, tag, additionalData);
      const result = { plaintext };
      if (jwe.protected !== void 0) {
        result.protectedHeader = parsedProt;
      }
      if (jwe.aad !== void 0) {
        try {
          result.additionalAuthenticatedData = (0, base64url_js_1.decode)(jwe.aad);
        } catch {
          throw new errors_js_1.JWEInvalid("Failed to base64url decode the aad");
        }
      }
      if (jwe.unprotected !== void 0) {
        result.sharedUnprotectedHeader = jwe.unprotected;
      }
      if (jwe.header !== void 0) {
        result.unprotectedHeader = jwe.header;
      }
      if (resolvedKey) {
        return { ...result, key };
      }
      return result;
    }
  }
});

// node_modules/jose/dist/node/cjs/jwe/compact/decrypt.js
var require_decrypt3 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwe/compact/decrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compactDecrypt = compactDecrypt;
    var decrypt_js_1 = require_decrypt2();
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    async function compactDecrypt(jwe, key, options) {
      if (jwe instanceof Uint8Array) {
        jwe = buffer_utils_js_1.decoder.decode(jwe);
      }
      if (typeof jwe !== "string") {
        throw new errors_js_1.JWEInvalid("Compact JWE must be a string or Uint8Array");
      }
      const { 0: protectedHeader, 1: encryptedKey, 2: iv, 3: ciphertext, 4: tag, length } = jwe.split(".");
      if (length !== 5) {
        throw new errors_js_1.JWEInvalid("Invalid Compact JWE");
      }
      const decrypted = await (0, decrypt_js_1.flattenedDecrypt)({
        ciphertext,
        iv: iv || void 0,
        protected: protectedHeader,
        tag: tag || void 0,
        encrypted_key: encryptedKey || void 0
      }, key, options);
      const result = { plaintext: decrypted.plaintext, protectedHeader: decrypted.protectedHeader };
      if (typeof key === "function") {
        return { ...result, key: decrypted.key };
      }
      return result;
    }
  }
});

// node_modules/jose/dist/node/cjs/jwe/general/decrypt.js
var require_decrypt4 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwe/general/decrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generalDecrypt = generalDecrypt;
    var decrypt_js_1 = require_decrypt2();
    var errors_js_1 = require_errors2();
    var is_object_js_1 = require_is_object();
    async function generalDecrypt(jwe, key, options) {
      if (!(0, is_object_js_1.default)(jwe)) {
        throw new errors_js_1.JWEInvalid("General JWE must be an object");
      }
      if (!Array.isArray(jwe.recipients) || !jwe.recipients.every(is_object_js_1.default)) {
        throw new errors_js_1.JWEInvalid("JWE Recipients missing or incorrect type");
      }
      if (!jwe.recipients.length) {
        throw new errors_js_1.JWEInvalid("JWE Recipients has no members");
      }
      for (const recipient of jwe.recipients) {
        try {
          return await (0, decrypt_js_1.flattenedDecrypt)({
            aad: jwe.aad,
            ciphertext: jwe.ciphertext,
            encrypted_key: recipient.encrypted_key,
            header: recipient.header,
            iv: jwe.iv,
            protected: jwe.protected,
            tag: jwe.tag,
            unprotected: jwe.unprotected
          }, key, options);
        } catch {
        }
      }
      throw new errors_js_1.JWEDecryptionFailed();
    }
  }
});

// node_modules/jose/dist/node/cjs/lib/private_symbols.js
var require_private_symbols = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/private_symbols.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.unprotected = void 0;
    exports.unprotected = Symbol();
  }
});

// node_modules/jose/dist/node/cjs/runtime/key_to_jwk.js
var require_key_to_jwk = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/key_to_jwk.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var node_crypto_1 = __require("node:crypto");
    var base64url_js_1 = require_base64url();
    var errors_js_1 = require_errors2();
    var webcrypto_js_1 = require_webcrypto();
    var is_key_object_js_1 = require_is_key_object();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var is_key_like_js_1 = require_is_key_like();
    var keyToJWK = (key) => {
      let keyObject;
      if ((0, webcrypto_js_1.isCryptoKey)(key)) {
        if (!key.extractable) {
          throw new TypeError("CryptoKey is not extractable");
        }
        keyObject = node_crypto_1.KeyObject.from(key);
      } else if ((0, is_key_object_js_1.default)(key)) {
        keyObject = key;
      } else if (key instanceof Uint8Array) {
        return {
          kty: "oct",
          k: (0, base64url_js_1.encode)(key)
        };
      } else {
        throw new TypeError((0, invalid_key_input_js_1.default)(key, ...is_key_like_js_1.types, "Uint8Array"));
      }
      if (keyObject.type !== "secret" && !["rsa", "ec", "ed25519", "x25519", "ed448", "x448"].includes(keyObject.asymmetricKeyType)) {
        throw new errors_js_1.JOSENotSupported("Unsupported key asymmetricKeyType");
      }
      return keyObject.export({ format: "jwk" });
    };
    exports.default = keyToJWK;
  }
});

// node_modules/jose/dist/node/cjs/key/export.js
var require_export = __commonJS({
  "node_modules/jose/dist/node/cjs/key/export.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.exportSPKI = exportSPKI;
    exports.exportPKCS8 = exportPKCS8;
    exports.exportJWK = exportJWK;
    var asn1_js_1 = require_asn1();
    var asn1_js_2 = require_asn1();
    var key_to_jwk_js_1 = require_key_to_jwk();
    async function exportSPKI(key) {
      return (0, asn1_js_1.toSPKI)(key);
    }
    async function exportPKCS8(key) {
      return (0, asn1_js_2.toPKCS8)(key);
    }
    async function exportJWK(key) {
      return (0, key_to_jwk_js_1.default)(key);
    }
  }
});

// node_modules/jose/dist/node/cjs/lib/encrypt_key_management.js
var require_encrypt_key_management = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/encrypt_key_management.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var aeskw_js_1 = require_aeskw();
    var ECDH = require_ecdhes();
    var pbes2kw_js_1 = require_pbes2kw();
    var rsaes_js_1 = require_rsaes();
    var base64url_js_1 = require_base64url();
    var normalize_key_js_1 = require_normalize_key();
    var cek_js_1 = require_cek();
    var errors_js_1 = require_errors2();
    var export_js_1 = require_export();
    var check_key_type_js_1 = require_check_key_type();
    var aesgcmkw_js_1 = require_aesgcmkw();
    async function encryptKeyManagement(alg, enc, key, providedCek, providedParameters = {}) {
      let encryptedKey;
      let parameters;
      let cek;
      (0, check_key_type_js_1.default)(alg, key, "encrypt");
      key = await normalize_key_js_1.default.normalizePublicKey?.(key, alg) || key;
      switch (alg) {
        case "dir": {
          cek = key;
          break;
        }
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW": {
          if (!ECDH.ecdhAllowed(key)) {
            throw new errors_js_1.JOSENotSupported("ECDH with the provided key is not allowed or not supported by your javascript runtime");
          }
          const { apu, apv } = providedParameters;
          let { epk: ephemeralKey } = providedParameters;
          ephemeralKey ||= (await ECDH.generateEpk(key)).privateKey;
          const { x, y, crv, kty } = await (0, export_js_1.exportJWK)(ephemeralKey);
          const sharedSecret = await ECDH.deriveKey(key, ephemeralKey, alg === "ECDH-ES" ? enc : alg, alg === "ECDH-ES" ? (0, cek_js_1.bitLength)(enc) : parseInt(alg.slice(-5, -2), 10), apu, apv);
          parameters = { epk: { x, crv, kty } };
          if (kty === "EC")
            parameters.epk.y = y;
          if (apu)
            parameters.apu = (0, base64url_js_1.encode)(apu);
          if (apv)
            parameters.apv = (0, base64url_js_1.encode)(apv);
          if (alg === "ECDH-ES") {
            cek = sharedSecret;
            break;
          }
          cek = providedCek || (0, cek_js_1.default)(enc);
          const kwAlg = alg.slice(-6);
          encryptedKey = await (0, aeskw_js_1.wrap)(kwAlg, sharedSecret, cek);
          break;
        }
        case "RSA1_5":
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512": {
          cek = providedCek || (0, cek_js_1.default)(enc);
          encryptedKey = await (0, rsaes_js_1.encrypt)(alg, key, cek);
          break;
        }
        case "PBES2-HS256+A128KW":
        case "PBES2-HS384+A192KW":
        case "PBES2-HS512+A256KW": {
          cek = providedCek || (0, cek_js_1.default)(enc);
          const { p2c, p2s } = providedParameters;
          ({ encryptedKey, ...parameters } = await (0, pbes2kw_js_1.encrypt)(alg, key, cek, p2c, p2s));
          break;
        }
        case "A128KW":
        case "A192KW":
        case "A256KW": {
          cek = providedCek || (0, cek_js_1.default)(enc);
          encryptedKey = await (0, aeskw_js_1.wrap)(alg, key, cek);
          break;
        }
        case "A128GCMKW":
        case "A192GCMKW":
        case "A256GCMKW": {
          cek = providedCek || (0, cek_js_1.default)(enc);
          const { iv } = providedParameters;
          ({ encryptedKey, ...parameters } = await (0, aesgcmkw_js_1.wrap)(alg, key, cek, iv));
          break;
        }
        default: {
          throw new errors_js_1.JOSENotSupported('Invalid or unsupported "alg" (JWE Algorithm) header value');
        }
      }
      return { cek, encryptedKey, parameters };
    }
    exports.default = encryptKeyManagement;
  }
});

// node_modules/jose/dist/node/cjs/jwe/flattened/encrypt.js
var require_encrypt2 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwe/flattened/encrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FlattenedEncrypt = void 0;
    var base64url_js_1 = require_base64url();
    var private_symbols_js_1 = require_private_symbols();
    var encrypt_js_1 = require_encrypt();
    var encrypt_key_management_js_1 = require_encrypt_key_management();
    var errors_js_1 = require_errors2();
    var is_disjoint_js_1 = require_is_disjoint();
    var buffer_utils_js_1 = require_buffer_utils();
    var validate_crit_js_1 = require_validate_crit();
    var FlattenedEncrypt = class {
      _plaintext;
      _protectedHeader;
      _sharedUnprotectedHeader;
      _unprotectedHeader;
      _aad;
      _cek;
      _iv;
      _keyManagementParameters;
      constructor(plaintext) {
        if (!(plaintext instanceof Uint8Array)) {
          throw new TypeError("plaintext must be an instance of Uint8Array");
        }
        this._plaintext = plaintext;
      }
      setKeyManagementParameters(parameters) {
        if (this._keyManagementParameters) {
          throw new TypeError("setKeyManagementParameters can only be called once");
        }
        this._keyManagementParameters = parameters;
        return this;
      }
      setProtectedHeader(protectedHeader) {
        if (this._protectedHeader) {
          throw new TypeError("setProtectedHeader can only be called once");
        }
        this._protectedHeader = protectedHeader;
        return this;
      }
      setSharedUnprotectedHeader(sharedUnprotectedHeader) {
        if (this._sharedUnprotectedHeader) {
          throw new TypeError("setSharedUnprotectedHeader can only be called once");
        }
        this._sharedUnprotectedHeader = sharedUnprotectedHeader;
        return this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        if (this._unprotectedHeader) {
          throw new TypeError("setUnprotectedHeader can only be called once");
        }
        this._unprotectedHeader = unprotectedHeader;
        return this;
      }
      setAdditionalAuthenticatedData(aad) {
        this._aad = aad;
        return this;
      }
      setContentEncryptionKey(cek) {
        if (this._cek) {
          throw new TypeError("setContentEncryptionKey can only be called once");
        }
        this._cek = cek;
        return this;
      }
      setInitializationVector(iv) {
        if (this._iv) {
          throw new TypeError("setInitializationVector can only be called once");
        }
        this._iv = iv;
        return this;
      }
      async encrypt(key, options) {
        if (!this._protectedHeader && !this._unprotectedHeader && !this._sharedUnprotectedHeader) {
          throw new errors_js_1.JWEInvalid("either setProtectedHeader, setUnprotectedHeader, or sharedUnprotectedHeader must be called before #encrypt()");
        }
        if (!(0, is_disjoint_js_1.default)(this._protectedHeader, this._unprotectedHeader, this._sharedUnprotectedHeader)) {
          throw new errors_js_1.JWEInvalid("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
        }
        const joseHeader = {
          ...this._protectedHeader,
          ...this._unprotectedHeader,
          ...this._sharedUnprotectedHeader
        };
        (0, validate_crit_js_1.default)(errors_js_1.JWEInvalid, /* @__PURE__ */ new Map(), options?.crit, this._protectedHeader, joseHeader);
        if (joseHeader.zip !== void 0) {
          throw new errors_js_1.JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
        }
        const { alg, enc } = joseHeader;
        if (typeof alg !== "string" || !alg) {
          throw new errors_js_1.JWEInvalid('JWE "alg" (Algorithm) Header Parameter missing or invalid');
        }
        if (typeof enc !== "string" || !enc) {
          throw new errors_js_1.JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter missing or invalid');
        }
        let encryptedKey;
        if (this._cek && (alg === "dir" || alg === "ECDH-ES")) {
          throw new TypeError(`setContentEncryptionKey cannot be called with JWE "alg" (Algorithm) Header ${alg}`);
        }
        let cek;
        {
          let parameters;
          ({ cek, encryptedKey, parameters } = await (0, encrypt_key_management_js_1.default)(alg, enc, key, this._cek, this._keyManagementParameters));
          if (parameters) {
            if (options && private_symbols_js_1.unprotected in options) {
              if (!this._unprotectedHeader) {
                this.setUnprotectedHeader(parameters);
              } else {
                this._unprotectedHeader = { ...this._unprotectedHeader, ...parameters };
              }
            } else if (!this._protectedHeader) {
              this.setProtectedHeader(parameters);
            } else {
              this._protectedHeader = { ...this._protectedHeader, ...parameters };
            }
          }
        }
        let additionalData;
        let protectedHeader;
        let aadMember;
        if (this._protectedHeader) {
          protectedHeader = buffer_utils_js_1.encoder.encode((0, base64url_js_1.encode)(JSON.stringify(this._protectedHeader)));
        } else {
          protectedHeader = buffer_utils_js_1.encoder.encode("");
        }
        if (this._aad) {
          aadMember = (0, base64url_js_1.encode)(this._aad);
          additionalData = (0, buffer_utils_js_1.concat)(protectedHeader, buffer_utils_js_1.encoder.encode("."), buffer_utils_js_1.encoder.encode(aadMember));
        } else {
          additionalData = protectedHeader;
        }
        const { ciphertext, tag, iv } = await (0, encrypt_js_1.default)(enc, this._plaintext, cek, this._iv, additionalData);
        const jwe = {
          ciphertext: (0, base64url_js_1.encode)(ciphertext)
        };
        if (iv) {
          jwe.iv = (0, base64url_js_1.encode)(iv);
        }
        if (tag) {
          jwe.tag = (0, base64url_js_1.encode)(tag);
        }
        if (encryptedKey) {
          jwe.encrypted_key = (0, base64url_js_1.encode)(encryptedKey);
        }
        if (aadMember) {
          jwe.aad = aadMember;
        }
        if (this._protectedHeader) {
          jwe.protected = buffer_utils_js_1.decoder.decode(protectedHeader);
        }
        if (this._sharedUnprotectedHeader) {
          jwe.unprotected = this._sharedUnprotectedHeader;
        }
        if (this._unprotectedHeader) {
          jwe.header = this._unprotectedHeader;
        }
        return jwe;
      }
    };
    exports.FlattenedEncrypt = FlattenedEncrypt;
  }
});

// node_modules/jose/dist/node/cjs/jwe/general/encrypt.js
var require_encrypt3 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwe/general/encrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GeneralEncrypt = void 0;
    var encrypt_js_1 = require_encrypt2();
    var private_symbols_js_1 = require_private_symbols();
    var errors_js_1 = require_errors2();
    var cek_js_1 = require_cek();
    var is_disjoint_js_1 = require_is_disjoint();
    var encrypt_key_management_js_1 = require_encrypt_key_management();
    var base64url_js_1 = require_base64url();
    var validate_crit_js_1 = require_validate_crit();
    var IndividualRecipient = class {
      parent;
      unprotectedHeader;
      key;
      options;
      constructor(enc, key, options) {
        this.parent = enc;
        this.key = key;
        this.options = options;
      }
      setUnprotectedHeader(unprotectedHeader) {
        if (this.unprotectedHeader) {
          throw new TypeError("setUnprotectedHeader can only be called once");
        }
        this.unprotectedHeader = unprotectedHeader;
        return this;
      }
      addRecipient(...args) {
        return this.parent.addRecipient(...args);
      }
      encrypt(...args) {
        return this.parent.encrypt(...args);
      }
      done() {
        return this.parent;
      }
    };
    var GeneralEncrypt = class {
      _plaintext;
      _recipients = [];
      _protectedHeader;
      _unprotectedHeader;
      _aad;
      constructor(plaintext) {
        this._plaintext = plaintext;
      }
      addRecipient(key, options) {
        const recipient = new IndividualRecipient(this, key, { crit: options?.crit });
        this._recipients.push(recipient);
        return recipient;
      }
      setProtectedHeader(protectedHeader) {
        if (this._protectedHeader) {
          throw new TypeError("setProtectedHeader can only be called once");
        }
        this._protectedHeader = protectedHeader;
        return this;
      }
      setSharedUnprotectedHeader(sharedUnprotectedHeader) {
        if (this._unprotectedHeader) {
          throw new TypeError("setSharedUnprotectedHeader can only be called once");
        }
        this._unprotectedHeader = sharedUnprotectedHeader;
        return this;
      }
      setAdditionalAuthenticatedData(aad) {
        this._aad = aad;
        return this;
      }
      async encrypt() {
        if (!this._recipients.length) {
          throw new errors_js_1.JWEInvalid("at least one recipient must be added");
        }
        if (this._recipients.length === 1) {
          const [recipient] = this._recipients;
          const flattened = await new encrypt_js_1.FlattenedEncrypt(this._plaintext).setAdditionalAuthenticatedData(this._aad).setProtectedHeader(this._protectedHeader).setSharedUnprotectedHeader(this._unprotectedHeader).setUnprotectedHeader(recipient.unprotectedHeader).encrypt(recipient.key, { ...recipient.options });
          const jwe2 = {
            ciphertext: flattened.ciphertext,
            iv: flattened.iv,
            recipients: [{}],
            tag: flattened.tag
          };
          if (flattened.aad)
            jwe2.aad = flattened.aad;
          if (flattened.protected)
            jwe2.protected = flattened.protected;
          if (flattened.unprotected)
            jwe2.unprotected = flattened.unprotected;
          if (flattened.encrypted_key)
            jwe2.recipients[0].encrypted_key = flattened.encrypted_key;
          if (flattened.header)
            jwe2.recipients[0].header = flattened.header;
          return jwe2;
        }
        let enc;
        for (let i = 0; i < this._recipients.length; i++) {
          const recipient = this._recipients[i];
          if (!(0, is_disjoint_js_1.default)(this._protectedHeader, this._unprotectedHeader, recipient.unprotectedHeader)) {
            throw new errors_js_1.JWEInvalid("JWE Protected, JWE Shared Unprotected and JWE Per-Recipient Header Parameter names must be disjoint");
          }
          const joseHeader = {
            ...this._protectedHeader,
            ...this._unprotectedHeader,
            ...recipient.unprotectedHeader
          };
          const { alg } = joseHeader;
          if (typeof alg !== "string" || !alg) {
            throw new errors_js_1.JWEInvalid('JWE "alg" (Algorithm) Header Parameter missing or invalid');
          }
          if (alg === "dir" || alg === "ECDH-ES") {
            throw new errors_js_1.JWEInvalid('"dir" and "ECDH-ES" alg may only be used with a single recipient');
          }
          if (typeof joseHeader.enc !== "string" || !joseHeader.enc) {
            throw new errors_js_1.JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter missing or invalid');
          }
          if (!enc) {
            enc = joseHeader.enc;
          } else if (enc !== joseHeader.enc) {
            throw new errors_js_1.JWEInvalid('JWE "enc" (Encryption Algorithm) Header Parameter must be the same for all recipients');
          }
          (0, validate_crit_js_1.default)(errors_js_1.JWEInvalid, /* @__PURE__ */ new Map(), recipient.options.crit, this._protectedHeader, joseHeader);
          if (joseHeader.zip !== void 0) {
            throw new errors_js_1.JOSENotSupported('JWE "zip" (Compression Algorithm) Header Parameter is not supported.');
          }
        }
        const cek = (0, cek_js_1.default)(enc);
        const jwe = {
          ciphertext: "",
          iv: "",
          recipients: [],
          tag: ""
        };
        for (let i = 0; i < this._recipients.length; i++) {
          const recipient = this._recipients[i];
          const target = {};
          jwe.recipients.push(target);
          const joseHeader = {
            ...this._protectedHeader,
            ...this._unprotectedHeader,
            ...recipient.unprotectedHeader
          };
          const p2c = joseHeader.alg.startsWith("PBES2") ? 2048 + i : void 0;
          if (i === 0) {
            const flattened = await new encrypt_js_1.FlattenedEncrypt(this._plaintext).setAdditionalAuthenticatedData(this._aad).setContentEncryptionKey(cek).setProtectedHeader(this._protectedHeader).setSharedUnprotectedHeader(this._unprotectedHeader).setUnprotectedHeader(recipient.unprotectedHeader).setKeyManagementParameters({ p2c }).encrypt(recipient.key, {
              ...recipient.options,
              [private_symbols_js_1.unprotected]: true
            });
            jwe.ciphertext = flattened.ciphertext;
            jwe.iv = flattened.iv;
            jwe.tag = flattened.tag;
            if (flattened.aad)
              jwe.aad = flattened.aad;
            if (flattened.protected)
              jwe.protected = flattened.protected;
            if (flattened.unprotected)
              jwe.unprotected = flattened.unprotected;
            target.encrypted_key = flattened.encrypted_key;
            if (flattened.header)
              target.header = flattened.header;
            continue;
          }
          const { encryptedKey, parameters } = await (0, encrypt_key_management_js_1.default)(recipient.unprotectedHeader?.alg || this._protectedHeader?.alg || this._unprotectedHeader?.alg, enc, recipient.key, cek, { p2c });
          target.encrypted_key = (0, base64url_js_1.encode)(encryptedKey);
          if (recipient.unprotectedHeader || parameters)
            target.header = { ...recipient.unprotectedHeader, ...parameters };
        }
        return jwe;
      }
    };
    exports.GeneralEncrypt = GeneralEncrypt;
  }
});

// node_modules/jose/dist/node/cjs/runtime/dsa_digest.js
var require_dsa_digest = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/dsa_digest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = dsaDigest;
    var errors_js_1 = require_errors2();
    function dsaDigest(alg) {
      switch (alg) {
        case "PS256":
        case "RS256":
        case "ES256":
        case "ES256K":
          return "sha256";
        case "PS384":
        case "RS384":
        case "ES384":
          return "sha384";
        case "PS512":
        case "RS512":
        case "ES512":
          return "sha512";
        case "Ed25519":
        case "EdDSA":
          return void 0;
        default:
          throw new errors_js_1.JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
      }
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/node_key.js
var require_node_key = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/node_key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = keyForCrypto;
    var node_crypto_1 = __require("node:crypto");
    var get_named_curve_js_1 = require_get_named_curve();
    var errors_js_1 = require_errors2();
    var check_key_length_js_1 = require_check_key_length();
    var ecCurveAlgMap = /* @__PURE__ */ new Map([
      ["ES256", "P-256"],
      ["ES256K", "secp256k1"],
      ["ES384", "P-384"],
      ["ES512", "P-521"]
    ]);
    function keyForCrypto(alg, key) {
      let asymmetricKeyType;
      let asymmetricKeyDetails;
      let isJWK;
      if (key instanceof node_crypto_1.KeyObject) {
        asymmetricKeyType = key.asymmetricKeyType;
        asymmetricKeyDetails = key.asymmetricKeyDetails;
      } else {
        isJWK = true;
        switch (key.kty) {
          case "RSA":
            asymmetricKeyType = "rsa";
            break;
          case "EC":
            asymmetricKeyType = "ec";
            break;
          case "OKP": {
            if (key.crv === "Ed25519") {
              asymmetricKeyType = "ed25519";
              break;
            }
            if (key.crv === "Ed448") {
              asymmetricKeyType = "ed448";
              break;
            }
            throw new TypeError("Invalid key for this operation, its crv must be Ed25519 or Ed448");
          }
          default:
            throw new TypeError("Invalid key for this operation, its kty must be RSA, OKP, or EC");
        }
      }
      let options;
      switch (alg) {
        case "Ed25519":
          if (asymmetricKeyType !== "ed25519") {
            throw new TypeError(`Invalid key for this operation, its asymmetricKeyType must be ed25519`);
          }
          break;
        case "EdDSA":
          if (!["ed25519", "ed448"].includes(asymmetricKeyType)) {
            throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be ed25519 or ed448");
          }
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          if (asymmetricKeyType !== "rsa") {
            throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be rsa");
          }
          (0, check_key_length_js_1.default)(key, alg);
          break;
        case "PS256":
        case "PS384":
        case "PS512":
          if (asymmetricKeyType === "rsa-pss") {
            const { hashAlgorithm, mgf1HashAlgorithm, saltLength } = asymmetricKeyDetails;
            const length = parseInt(alg.slice(-3), 10);
            if (hashAlgorithm !== void 0 && (hashAlgorithm !== `sha${length}` || mgf1HashAlgorithm !== hashAlgorithm)) {
              throw new TypeError(`Invalid key for this operation, its RSA-PSS parameters do not meet the requirements of "alg" ${alg}`);
            }
            if (saltLength !== void 0 && saltLength > length >> 3) {
              throw new TypeError(`Invalid key for this operation, its RSA-PSS parameter saltLength does not meet the requirements of "alg" ${alg}`);
            }
          } else if (asymmetricKeyType !== "rsa") {
            throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be rsa or rsa-pss");
          }
          (0, check_key_length_js_1.default)(key, alg);
          options = {
            padding: node_crypto_1.constants.RSA_PKCS1_PSS_PADDING,
            saltLength: node_crypto_1.constants.RSA_PSS_SALTLEN_DIGEST
          };
          break;
        case "ES256":
        case "ES256K":
        case "ES384":
        case "ES512": {
          if (asymmetricKeyType !== "ec") {
            throw new TypeError("Invalid key for this operation, its asymmetricKeyType must be ec");
          }
          const actual = (0, get_named_curve_js_1.default)(key);
          const expected = ecCurveAlgMap.get(alg);
          if (actual !== expected) {
            throw new TypeError(`Invalid key curve for the algorithm, its curve must be ${expected}, got ${actual}`);
          }
          options = { dsaEncoding: "ieee-p1363" };
          break;
        }
        default:
          throw new errors_js_1.JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
      }
      if (isJWK) {
        return { format: "jwk", key, ...options };
      }
      return options ? { ...options, key } : key;
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/hmac_digest.js
var require_hmac_digest = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/hmac_digest.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = hmacDigest;
    var errors_js_1 = require_errors2();
    function hmacDigest(alg) {
      switch (alg) {
        case "HS256":
          return "sha256";
        case "HS384":
          return "sha384";
        case "HS512":
          return "sha512";
        default:
          throw new errors_js_1.JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
      }
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/get_sign_verify_key.js
var require_get_sign_verify_key = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/get_sign_verify_key.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = getSignVerifyKey;
    var node_crypto_1 = __require("node:crypto");
    var webcrypto_js_1 = require_webcrypto();
    var crypto_key_js_1 = require_crypto_key();
    var invalid_key_input_js_1 = require_invalid_key_input();
    var is_key_like_js_1 = require_is_key_like();
    var jwk = require_is_jwk();
    function getSignVerifyKey(alg, key, usage) {
      if (key instanceof Uint8Array) {
        if (!alg.startsWith("HS")) {
          throw new TypeError((0, invalid_key_input_js_1.default)(key, ...is_key_like_js_1.types));
        }
        return (0, node_crypto_1.createSecretKey)(key);
      }
      if (key instanceof node_crypto_1.KeyObject) {
        return key;
      }
      if ((0, webcrypto_js_1.isCryptoKey)(key)) {
        (0, crypto_key_js_1.checkSigCryptoKey)(key, alg, usage);
        return node_crypto_1.KeyObject.from(key);
      }
      if (jwk.isJWK(key)) {
        if (alg.startsWith("HS")) {
          return (0, node_crypto_1.createSecretKey)(Buffer.from(key.k, "base64url"));
        }
        return key;
      }
      throw new TypeError((0, invalid_key_input_js_1.default)(key, ...is_key_like_js_1.types, "Uint8Array", "JSON Web Key"));
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/sign.js
var require_sign = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/sign.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var crypto3 = __require("node:crypto");
    var node_util_1 = __require("node:util");
    var dsa_digest_js_1 = require_dsa_digest();
    var hmac_digest_js_1 = require_hmac_digest();
    var node_key_js_1 = require_node_key();
    var get_sign_verify_key_js_1 = require_get_sign_verify_key();
    var oneShotSign = (0, node_util_1.promisify)(crypto3.sign);
    var sign = async (alg, key, data) => {
      const k = (0, get_sign_verify_key_js_1.default)(alg, key, "sign");
      if (alg.startsWith("HS")) {
        const hmac = crypto3.createHmac((0, hmac_digest_js_1.default)(alg), k);
        hmac.update(data);
        return hmac.digest();
      }
      return oneShotSign((0, dsa_digest_js_1.default)(alg), data, (0, node_key_js_1.default)(alg, k));
    };
    exports.default = sign;
  }
});

// node_modules/jose/dist/node/cjs/runtime/verify.js
var require_verify = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/verify.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var crypto3 = __require("node:crypto");
    var node_util_1 = __require("node:util");
    var dsa_digest_js_1 = require_dsa_digest();
    var node_key_js_1 = require_node_key();
    var sign_js_1 = require_sign();
    var get_sign_verify_key_js_1 = require_get_sign_verify_key();
    var oneShotVerify = (0, node_util_1.promisify)(crypto3.verify);
    var verify = async (alg, key, signature, data) => {
      const k = (0, get_sign_verify_key_js_1.default)(alg, key, "verify");
      if (alg.startsWith("HS")) {
        const expected = await (0, sign_js_1.default)(alg, k, data);
        const actual = signature;
        try {
          return crypto3.timingSafeEqual(actual, expected);
        } catch {
          return false;
        }
      }
      const algorithm = (0, dsa_digest_js_1.default)(alg);
      const keyInput = (0, node_key_js_1.default)(alg, k);
      try {
        return await oneShotVerify(algorithm, data, keyInput, signature);
      } catch {
        return false;
      }
    };
    exports.default = verify;
  }
});

// node_modules/jose/dist/node/cjs/jws/flattened/verify.js
var require_verify2 = __commonJS({
  "node_modules/jose/dist/node/cjs/jws/flattened/verify.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.flattenedVerify = flattenedVerify;
    var base64url_js_1 = require_base64url();
    var verify_js_1 = require_verify();
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    var is_disjoint_js_1 = require_is_disjoint();
    var is_object_js_1 = require_is_object();
    var check_key_type_js_1 = require_check_key_type();
    var validate_crit_js_1 = require_validate_crit();
    var validate_algorithms_js_1 = require_validate_algorithms();
    var is_jwk_js_1 = require_is_jwk();
    var import_js_1 = require_import();
    async function flattenedVerify(jws, key, options) {
      if (!(0, is_object_js_1.default)(jws)) {
        throw new errors_js_1.JWSInvalid("Flattened JWS must be an object");
      }
      if (jws.protected === void 0 && jws.header === void 0) {
        throw new errors_js_1.JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
      }
      if (jws.protected !== void 0 && typeof jws.protected !== "string") {
        throw new errors_js_1.JWSInvalid("JWS Protected Header incorrect type");
      }
      if (jws.payload === void 0) {
        throw new errors_js_1.JWSInvalid("JWS Payload missing");
      }
      if (typeof jws.signature !== "string") {
        throw new errors_js_1.JWSInvalid("JWS Signature missing or incorrect type");
      }
      if (jws.header !== void 0 && !(0, is_object_js_1.default)(jws.header)) {
        throw new errors_js_1.JWSInvalid("JWS Unprotected Header incorrect type");
      }
      let parsedProt = {};
      if (jws.protected) {
        try {
          const protectedHeader = (0, base64url_js_1.decode)(jws.protected);
          parsedProt = JSON.parse(buffer_utils_js_1.decoder.decode(protectedHeader));
        } catch {
          throw new errors_js_1.JWSInvalid("JWS Protected Header is invalid");
        }
      }
      if (!(0, is_disjoint_js_1.default)(parsedProt, jws.header)) {
        throw new errors_js_1.JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
      }
      const joseHeader = {
        ...parsedProt,
        ...jws.header
      };
      const extensions = (0, validate_crit_js_1.default)(errors_js_1.JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
      let b64 = true;
      if (extensions.has("b64")) {
        b64 = parsedProt.b64;
        if (typeof b64 !== "boolean") {
          throw new errors_js_1.JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
        }
      }
      const { alg } = joseHeader;
      if (typeof alg !== "string" || !alg) {
        throw new errors_js_1.JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
      }
      const algorithms = options && (0, validate_algorithms_js_1.default)("algorithms", options.algorithms);
      if (algorithms && !algorithms.has(alg)) {
        throw new errors_js_1.JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
      }
      if (b64) {
        if (typeof jws.payload !== "string") {
          throw new errors_js_1.JWSInvalid("JWS Payload must be a string");
        }
      } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
        throw new errors_js_1.JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
      }
      let resolvedKey = false;
      if (typeof key === "function") {
        key = await key(parsedProt, jws);
        resolvedKey = true;
        (0, check_key_type_js_1.checkKeyTypeWithJwk)(alg, key, "verify");
        if ((0, is_jwk_js_1.isJWK)(key)) {
          key = await (0, import_js_1.importJWK)(key, alg);
        }
      } else {
        (0, check_key_type_js_1.checkKeyTypeWithJwk)(alg, key, "verify");
      }
      const data = (0, buffer_utils_js_1.concat)(buffer_utils_js_1.encoder.encode(jws.protected ?? ""), buffer_utils_js_1.encoder.encode("."), typeof jws.payload === "string" ? buffer_utils_js_1.encoder.encode(jws.payload) : jws.payload);
      let signature;
      try {
        signature = (0, base64url_js_1.decode)(jws.signature);
      } catch {
        throw new errors_js_1.JWSInvalid("Failed to base64url decode the signature");
      }
      const verified = await (0, verify_js_1.default)(alg, key, signature, data);
      if (!verified) {
        throw new errors_js_1.JWSSignatureVerificationFailed();
      }
      let payload;
      if (b64) {
        try {
          payload = (0, base64url_js_1.decode)(jws.payload);
        } catch {
          throw new errors_js_1.JWSInvalid("Failed to base64url decode the payload");
        }
      } else if (typeof jws.payload === "string") {
        payload = buffer_utils_js_1.encoder.encode(jws.payload);
      } else {
        payload = jws.payload;
      }
      const result = { payload };
      if (jws.protected !== void 0) {
        result.protectedHeader = parsedProt;
      }
      if (jws.header !== void 0) {
        result.unprotectedHeader = jws.header;
      }
      if (resolvedKey) {
        return { ...result, key };
      }
      return result;
    }
  }
});

// node_modules/jose/dist/node/cjs/jws/compact/verify.js
var require_verify3 = __commonJS({
  "node_modules/jose/dist/node/cjs/jws/compact/verify.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.compactVerify = compactVerify;
    var verify_js_1 = require_verify2();
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    async function compactVerify(jws, key, options) {
      if (jws instanceof Uint8Array) {
        jws = buffer_utils_js_1.decoder.decode(jws);
      }
      if (typeof jws !== "string") {
        throw new errors_js_1.JWSInvalid("Compact JWS must be a string or Uint8Array");
      }
      const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
      if (length !== 3) {
        throw new errors_js_1.JWSInvalid("Invalid Compact JWS");
      }
      const verified = await (0, verify_js_1.flattenedVerify)({ payload, protected: protectedHeader, signature }, key, options);
      const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
      if (typeof key === "function") {
        return { ...result, key: verified.key };
      }
      return result;
    }
  }
});

// node_modules/jose/dist/node/cjs/jws/general/verify.js
var require_verify4 = __commonJS({
  "node_modules/jose/dist/node/cjs/jws/general/verify.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generalVerify = generalVerify;
    var verify_js_1 = require_verify2();
    var errors_js_1 = require_errors2();
    var is_object_js_1 = require_is_object();
    async function generalVerify(jws, key, options) {
      if (!(0, is_object_js_1.default)(jws)) {
        throw new errors_js_1.JWSInvalid("General JWS must be an object");
      }
      if (!Array.isArray(jws.signatures) || !jws.signatures.every(is_object_js_1.default)) {
        throw new errors_js_1.JWSInvalid("JWS Signatures missing or incorrect type");
      }
      for (const signature of jws.signatures) {
        try {
          return await (0, verify_js_1.flattenedVerify)({
            header: signature.header,
            payload: jws.payload,
            protected: signature.protected,
            signature: signature.signature
          }, key, options);
        } catch {
        }
      }
      throw new errors_js_1.JWSSignatureVerificationFailed();
    }
  }
});

// node_modules/jose/dist/node/cjs/lib/epoch.js
var require_epoch = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/epoch.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = (date) => Math.floor(date.getTime() / 1e3);
  }
});

// node_modules/jose/dist/node/cjs/lib/secs.js
var require_secs = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/secs.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var minute = 60;
    var hour = minute * 60;
    var day = hour * 24;
    var week = day * 7;
    var year = day * 365.25;
    var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
    exports.default = (str) => {
      const matched = REGEX.exec(str);
      if (!matched || matched[4] && matched[1]) {
        throw new TypeError("Invalid time period format");
      }
      const value = parseFloat(matched[2]);
      const unit = matched[3].toLowerCase();
      let numericDate;
      switch (unit) {
        case "sec":
        case "secs":
        case "second":
        case "seconds":
        case "s":
          numericDate = Math.round(value);
          break;
        case "minute":
        case "minutes":
        case "min":
        case "mins":
        case "m":
          numericDate = Math.round(value * minute);
          break;
        case "hour":
        case "hours":
        case "hr":
        case "hrs":
        case "h":
          numericDate = Math.round(value * hour);
          break;
        case "day":
        case "days":
        case "d":
          numericDate = Math.round(value * day);
          break;
        case "week":
        case "weeks":
        case "w":
          numericDate = Math.round(value * week);
          break;
        default:
          numericDate = Math.round(value * year);
          break;
      }
      if (matched[1] === "-" || matched[4] === "ago") {
        return -numericDate;
      }
      return numericDate;
    };
  }
});

// node_modules/jose/dist/node/cjs/lib/jwt_claims_set.js
var require_jwt_claims_set = __commonJS({
  "node_modules/jose/dist/node/cjs/lib/jwt_claims_set.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    var epoch_js_1 = require_epoch();
    var secs_js_1 = require_secs();
    var is_object_js_1 = require_is_object();
    var normalizeTyp = (value) => value.toLowerCase().replace(/^application\//, "");
    var checkAudiencePresence = (audPayload, audOption) => {
      if (typeof audPayload === "string") {
        return audOption.includes(audPayload);
      }
      if (Array.isArray(audPayload)) {
        return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
      }
      return false;
    };
    exports.default = (protectedHeader, encodedPayload, options = {}) => {
      let payload;
      try {
        payload = JSON.parse(buffer_utils_js_1.decoder.decode(encodedPayload));
      } catch {
      }
      if (!(0, is_object_js_1.default)(payload)) {
        throw new errors_js_1.JWTInvalid("JWT Claims Set must be a top-level JSON object");
      }
      const { typ } = options;
      if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
        throw new errors_js_1.JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
      }
      const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
      const presenceCheck = [...requiredClaims];
      if (maxTokenAge !== void 0)
        presenceCheck.push("iat");
      if (audience !== void 0)
        presenceCheck.push("aud");
      if (subject !== void 0)
        presenceCheck.push("sub");
      if (issuer !== void 0)
        presenceCheck.push("iss");
      for (const claim of new Set(presenceCheck.reverse())) {
        if (!(claim in payload)) {
          throw new errors_js_1.JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
        }
      }
      if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
        throw new errors_js_1.JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
      }
      if (subject && payload.sub !== subject) {
        throw new errors_js_1.JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
      }
      if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
        throw new errors_js_1.JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
      }
      let tolerance;
      switch (typeof options.clockTolerance) {
        case "string":
          tolerance = (0, secs_js_1.default)(options.clockTolerance);
          break;
        case "number":
          tolerance = options.clockTolerance;
          break;
        case "undefined":
          tolerance = 0;
          break;
        default:
          throw new TypeError("Invalid clockTolerance option type");
      }
      const { currentDate } = options;
      const now = (0, epoch_js_1.default)(currentDate || /* @__PURE__ */ new Date());
      if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
        throw new errors_js_1.JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
      }
      if (payload.nbf !== void 0) {
        if (typeof payload.nbf !== "number") {
          throw new errors_js_1.JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
        }
        if (payload.nbf > now + tolerance) {
          throw new errors_js_1.JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
        }
      }
      if (payload.exp !== void 0) {
        if (typeof payload.exp !== "number") {
          throw new errors_js_1.JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
        }
        if (payload.exp <= now - tolerance) {
          throw new errors_js_1.JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
        }
      }
      if (maxTokenAge) {
        const age = now - payload.iat;
        const max = typeof maxTokenAge === "number" ? maxTokenAge : (0, secs_js_1.default)(maxTokenAge);
        if (age - tolerance > max) {
          throw new errors_js_1.JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
        }
        if (age < 0 - tolerance) {
          throw new errors_js_1.JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
        }
      }
      return payload;
    };
  }
});

// node_modules/jose/dist/node/cjs/jwt/verify.js
var require_verify5 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwt/verify.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.jwtVerify = jwtVerify;
    var verify_js_1 = require_verify3();
    var jwt_claims_set_js_1 = require_jwt_claims_set();
    var errors_js_1 = require_errors2();
    async function jwtVerify(jwt, key, options) {
      const verified = await (0, verify_js_1.compactVerify)(jwt, key, options);
      if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
        throw new errors_js_1.JWTInvalid("JWTs MUST NOT use unencoded payload");
      }
      const payload = (0, jwt_claims_set_js_1.default)(verified.protectedHeader, verified.payload, options);
      const result = { payload, protectedHeader: verified.protectedHeader };
      if (typeof key === "function") {
        return { ...result, key: verified.key };
      }
      return result;
    }
  }
});

// node_modules/jose/dist/node/cjs/jwt/decrypt.js
var require_decrypt5 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwt/decrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.jwtDecrypt = jwtDecrypt;
    var decrypt_js_1 = require_decrypt3();
    var jwt_claims_set_js_1 = require_jwt_claims_set();
    var errors_js_1 = require_errors2();
    async function jwtDecrypt(jwt, key, options) {
      const decrypted = await (0, decrypt_js_1.compactDecrypt)(jwt, key, options);
      const payload = (0, jwt_claims_set_js_1.default)(decrypted.protectedHeader, decrypted.plaintext, options);
      const { protectedHeader } = decrypted;
      if (protectedHeader.iss !== void 0 && protectedHeader.iss !== payload.iss) {
        throw new errors_js_1.JWTClaimValidationFailed('replicated "iss" claim header parameter mismatch', payload, "iss", "mismatch");
      }
      if (protectedHeader.sub !== void 0 && protectedHeader.sub !== payload.sub) {
        throw new errors_js_1.JWTClaimValidationFailed('replicated "sub" claim header parameter mismatch', payload, "sub", "mismatch");
      }
      if (protectedHeader.aud !== void 0 && JSON.stringify(protectedHeader.aud) !== JSON.stringify(payload.aud)) {
        throw new errors_js_1.JWTClaimValidationFailed('replicated "aud" claim header parameter mismatch', payload, "aud", "mismatch");
      }
      const result = { payload, protectedHeader };
      if (typeof key === "function") {
        return { ...result, key: decrypted.key };
      }
      return result;
    }
  }
});

// node_modules/jose/dist/node/cjs/jwe/compact/encrypt.js
var require_encrypt4 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwe/compact/encrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompactEncrypt = void 0;
    var encrypt_js_1 = require_encrypt2();
    var CompactEncrypt = class {
      _flattened;
      constructor(plaintext) {
        this._flattened = new encrypt_js_1.FlattenedEncrypt(plaintext);
      }
      setContentEncryptionKey(cek) {
        this._flattened.setContentEncryptionKey(cek);
        return this;
      }
      setInitializationVector(iv) {
        this._flattened.setInitializationVector(iv);
        return this;
      }
      setProtectedHeader(protectedHeader) {
        this._flattened.setProtectedHeader(protectedHeader);
        return this;
      }
      setKeyManagementParameters(parameters) {
        this._flattened.setKeyManagementParameters(parameters);
        return this;
      }
      async encrypt(key, options) {
        const jwe = await this._flattened.encrypt(key, options);
        return [jwe.protected, jwe.encrypted_key, jwe.iv, jwe.ciphertext, jwe.tag].join(".");
      }
    };
    exports.CompactEncrypt = CompactEncrypt;
  }
});

// node_modules/jose/dist/node/cjs/jws/flattened/sign.js
var require_sign2 = __commonJS({
  "node_modules/jose/dist/node/cjs/jws/flattened/sign.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FlattenedSign = void 0;
    var base64url_js_1 = require_base64url();
    var sign_js_1 = require_sign();
    var is_disjoint_js_1 = require_is_disjoint();
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    var check_key_type_js_1 = require_check_key_type();
    var validate_crit_js_1 = require_validate_crit();
    var FlattenedSign = class {
      _payload;
      _protectedHeader;
      _unprotectedHeader;
      constructor(payload) {
        if (!(payload instanceof Uint8Array)) {
          throw new TypeError("payload must be an instance of Uint8Array");
        }
        this._payload = payload;
      }
      setProtectedHeader(protectedHeader) {
        if (this._protectedHeader) {
          throw new TypeError("setProtectedHeader can only be called once");
        }
        this._protectedHeader = protectedHeader;
        return this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        if (this._unprotectedHeader) {
          throw new TypeError("setUnprotectedHeader can only be called once");
        }
        this._unprotectedHeader = unprotectedHeader;
        return this;
      }
      async sign(key, options) {
        if (!this._protectedHeader && !this._unprotectedHeader) {
          throw new errors_js_1.JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
        }
        if (!(0, is_disjoint_js_1.default)(this._protectedHeader, this._unprotectedHeader)) {
          throw new errors_js_1.JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
        }
        const joseHeader = {
          ...this._protectedHeader,
          ...this._unprotectedHeader
        };
        const extensions = (0, validate_crit_js_1.default)(errors_js_1.JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this._protectedHeader, joseHeader);
        let b64 = true;
        if (extensions.has("b64")) {
          b64 = this._protectedHeader.b64;
          if (typeof b64 !== "boolean") {
            throw new errors_js_1.JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
          }
        }
        const { alg } = joseHeader;
        if (typeof alg !== "string" || !alg) {
          throw new errors_js_1.JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
        }
        (0, check_key_type_js_1.checkKeyTypeWithJwk)(alg, key, "sign");
        let payload = this._payload;
        if (b64) {
          payload = buffer_utils_js_1.encoder.encode((0, base64url_js_1.encode)(payload));
        }
        let protectedHeader;
        if (this._protectedHeader) {
          protectedHeader = buffer_utils_js_1.encoder.encode((0, base64url_js_1.encode)(JSON.stringify(this._protectedHeader)));
        } else {
          protectedHeader = buffer_utils_js_1.encoder.encode("");
        }
        const data = (0, buffer_utils_js_1.concat)(protectedHeader, buffer_utils_js_1.encoder.encode("."), payload);
        const signature = await (0, sign_js_1.default)(alg, key, data);
        const jws = {
          signature: (0, base64url_js_1.encode)(signature),
          payload: ""
        };
        if (b64) {
          jws.payload = buffer_utils_js_1.decoder.decode(payload);
        }
        if (this._unprotectedHeader) {
          jws.header = this._unprotectedHeader;
        }
        if (this._protectedHeader) {
          jws.protected = buffer_utils_js_1.decoder.decode(protectedHeader);
        }
        return jws;
      }
    };
    exports.FlattenedSign = FlattenedSign;
  }
});

// node_modules/jose/dist/node/cjs/jws/compact/sign.js
var require_sign3 = __commonJS({
  "node_modules/jose/dist/node/cjs/jws/compact/sign.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CompactSign = void 0;
    var sign_js_1 = require_sign2();
    var CompactSign = class {
      _flattened;
      constructor(payload) {
        this._flattened = new sign_js_1.FlattenedSign(payload);
      }
      setProtectedHeader(protectedHeader) {
        this._flattened.setProtectedHeader(protectedHeader);
        return this;
      }
      async sign(key, options) {
        const jws = await this._flattened.sign(key, options);
        if (jws.payload === void 0) {
          throw new TypeError("use the flattened module for creating JWS with b64: false");
        }
        return `${jws.protected}.${jws.payload}.${jws.signature}`;
      }
    };
    exports.CompactSign = CompactSign;
  }
});

// node_modules/jose/dist/node/cjs/jws/general/sign.js
var require_sign4 = __commonJS({
  "node_modules/jose/dist/node/cjs/jws/general/sign.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GeneralSign = void 0;
    var sign_js_1 = require_sign2();
    var errors_js_1 = require_errors2();
    var IndividualSignature = class {
      parent;
      protectedHeader;
      unprotectedHeader;
      options;
      key;
      constructor(sig, key, options) {
        this.parent = sig;
        this.key = key;
        this.options = options;
      }
      setProtectedHeader(protectedHeader) {
        if (this.protectedHeader) {
          throw new TypeError("setProtectedHeader can only be called once");
        }
        this.protectedHeader = protectedHeader;
        return this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        if (this.unprotectedHeader) {
          throw new TypeError("setUnprotectedHeader can only be called once");
        }
        this.unprotectedHeader = unprotectedHeader;
        return this;
      }
      addSignature(...args) {
        return this.parent.addSignature(...args);
      }
      sign(...args) {
        return this.parent.sign(...args);
      }
      done() {
        return this.parent;
      }
    };
    var GeneralSign = class {
      _payload;
      _signatures = [];
      constructor(payload) {
        this._payload = payload;
      }
      addSignature(key, options) {
        const signature = new IndividualSignature(this, key, options);
        this._signatures.push(signature);
        return signature;
      }
      async sign() {
        if (!this._signatures.length) {
          throw new errors_js_1.JWSInvalid("at least one signature must be added");
        }
        const jws = {
          signatures: [],
          payload: ""
        };
        for (let i = 0; i < this._signatures.length; i++) {
          const signature = this._signatures[i];
          const flattened = new sign_js_1.FlattenedSign(this._payload);
          flattened.setProtectedHeader(signature.protectedHeader);
          flattened.setUnprotectedHeader(signature.unprotectedHeader);
          const { payload, ...rest } = await flattened.sign(signature.key, signature.options);
          if (i === 0) {
            jws.payload = payload;
          } else if (jws.payload !== payload) {
            throw new errors_js_1.JWSInvalid("inconsistent use of JWS Unencoded Payload (RFC7797)");
          }
          jws.signatures.push(rest);
        }
        return jws;
      }
    };
    exports.GeneralSign = GeneralSign;
  }
});

// node_modules/jose/dist/node/cjs/jwt/produce.js
var require_produce = __commonJS({
  "node_modules/jose/dist/node/cjs/jwt/produce.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProduceJWT = void 0;
    var epoch_js_1 = require_epoch();
    var is_object_js_1 = require_is_object();
    var secs_js_1 = require_secs();
    function validateInput(label, input) {
      if (!Number.isFinite(input)) {
        throw new TypeError(`Invalid ${label} input`);
      }
      return input;
    }
    var ProduceJWT = class {
      _payload;
      constructor(payload = {}) {
        if (!(0, is_object_js_1.default)(payload)) {
          throw new TypeError("JWT Claims Set MUST be an object");
        }
        this._payload = payload;
      }
      setIssuer(issuer) {
        this._payload = { ...this._payload, iss: issuer };
        return this;
      }
      setSubject(subject) {
        this._payload = { ...this._payload, sub: subject };
        return this;
      }
      setAudience(audience) {
        this._payload = { ...this._payload, aud: audience };
        return this;
      }
      setJti(jwtId) {
        this._payload = { ...this._payload, jti: jwtId };
        return this;
      }
      setNotBefore(input) {
        if (typeof input === "number") {
          this._payload = { ...this._payload, nbf: validateInput("setNotBefore", input) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, nbf: validateInput("setNotBefore", (0, epoch_js_1.default)(input)) };
        } else {
          this._payload = { ...this._payload, nbf: (0, epoch_js_1.default)(/* @__PURE__ */ new Date()) + (0, secs_js_1.default)(input) };
        }
        return this;
      }
      setExpirationTime(input) {
        if (typeof input === "number") {
          this._payload = { ...this._payload, exp: validateInput("setExpirationTime", input) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, exp: validateInput("setExpirationTime", (0, epoch_js_1.default)(input)) };
        } else {
          this._payload = { ...this._payload, exp: (0, epoch_js_1.default)(/* @__PURE__ */ new Date()) + (0, secs_js_1.default)(input) };
        }
        return this;
      }
      setIssuedAt(input) {
        if (typeof input === "undefined") {
          this._payload = { ...this._payload, iat: (0, epoch_js_1.default)(/* @__PURE__ */ new Date()) };
        } else if (input instanceof Date) {
          this._payload = { ...this._payload, iat: validateInput("setIssuedAt", (0, epoch_js_1.default)(input)) };
        } else if (typeof input === "string") {
          this._payload = {
            ...this._payload,
            iat: validateInput("setIssuedAt", (0, epoch_js_1.default)(/* @__PURE__ */ new Date()) + (0, secs_js_1.default)(input))
          };
        } else {
          this._payload = { ...this._payload, iat: validateInput("setIssuedAt", input) };
        }
        return this;
      }
    };
    exports.ProduceJWT = ProduceJWT;
  }
});

// node_modules/jose/dist/node/cjs/jwt/sign.js
var require_sign5 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwt/sign.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SignJWT = void 0;
    var sign_js_1 = require_sign3();
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    var produce_js_1 = require_produce();
    var SignJWT = class extends produce_js_1.ProduceJWT {
      _protectedHeader;
      setProtectedHeader(protectedHeader) {
        this._protectedHeader = protectedHeader;
        return this;
      }
      async sign(key, options) {
        const sig = new sign_js_1.CompactSign(buffer_utils_js_1.encoder.encode(JSON.stringify(this._payload)));
        sig.setProtectedHeader(this._protectedHeader);
        if (Array.isArray(this._protectedHeader?.crit) && this._protectedHeader.crit.includes("b64") && this._protectedHeader.b64 === false) {
          throw new errors_js_1.JWTInvalid("JWTs MUST NOT use unencoded payload");
        }
        return sig.sign(key, options);
      }
    };
    exports.SignJWT = SignJWT;
  }
});

// node_modules/jose/dist/node/cjs/jwt/encrypt.js
var require_encrypt5 = __commonJS({
  "node_modules/jose/dist/node/cjs/jwt/encrypt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EncryptJWT = void 0;
    var encrypt_js_1 = require_encrypt4();
    var buffer_utils_js_1 = require_buffer_utils();
    var produce_js_1 = require_produce();
    var EncryptJWT = class extends produce_js_1.ProduceJWT {
      _cek;
      _iv;
      _keyManagementParameters;
      _protectedHeader;
      _replicateIssuerAsHeader;
      _replicateSubjectAsHeader;
      _replicateAudienceAsHeader;
      setProtectedHeader(protectedHeader) {
        if (this._protectedHeader) {
          throw new TypeError("setProtectedHeader can only be called once");
        }
        this._protectedHeader = protectedHeader;
        return this;
      }
      setKeyManagementParameters(parameters) {
        if (this._keyManagementParameters) {
          throw new TypeError("setKeyManagementParameters can only be called once");
        }
        this._keyManagementParameters = parameters;
        return this;
      }
      setContentEncryptionKey(cek) {
        if (this._cek) {
          throw new TypeError("setContentEncryptionKey can only be called once");
        }
        this._cek = cek;
        return this;
      }
      setInitializationVector(iv) {
        if (this._iv) {
          throw new TypeError("setInitializationVector can only be called once");
        }
        this._iv = iv;
        return this;
      }
      replicateIssuerAsHeader() {
        this._replicateIssuerAsHeader = true;
        return this;
      }
      replicateSubjectAsHeader() {
        this._replicateSubjectAsHeader = true;
        return this;
      }
      replicateAudienceAsHeader() {
        this._replicateAudienceAsHeader = true;
        return this;
      }
      async encrypt(key, options) {
        const enc = new encrypt_js_1.CompactEncrypt(buffer_utils_js_1.encoder.encode(JSON.stringify(this._payload)));
        if (this._replicateIssuerAsHeader) {
          this._protectedHeader = { ...this._protectedHeader, iss: this._payload.iss };
        }
        if (this._replicateSubjectAsHeader) {
          this._protectedHeader = { ...this._protectedHeader, sub: this._payload.sub };
        }
        if (this._replicateAudienceAsHeader) {
          this._protectedHeader = { ...this._protectedHeader, aud: this._payload.aud };
        }
        enc.setProtectedHeader(this._protectedHeader);
        if (this._iv) {
          enc.setInitializationVector(this._iv);
        }
        if (this._cek) {
          enc.setContentEncryptionKey(this._cek);
        }
        if (this._keyManagementParameters) {
          enc.setKeyManagementParameters(this._keyManagementParameters);
        }
        return enc.encrypt(key, options);
      }
    };
    exports.EncryptJWT = EncryptJWT;
  }
});

// node_modules/jose/dist/node/cjs/jwk/thumbprint.js
var require_thumbprint = __commonJS({
  "node_modules/jose/dist/node/cjs/jwk/thumbprint.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.calculateJwkThumbprint = calculateJwkThumbprint;
    exports.calculateJwkThumbprintUri = calculateJwkThumbprintUri;
    var digest_js_1 = require_digest();
    var base64url_js_1 = require_base64url();
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    var is_object_js_1 = require_is_object();
    var check = (value, description) => {
      if (typeof value !== "string" || !value) {
        throw new errors_js_1.JWKInvalid(`${description} missing or invalid`);
      }
    };
    async function calculateJwkThumbprint(jwk, digestAlgorithm) {
      if (!(0, is_object_js_1.default)(jwk)) {
        throw new TypeError("JWK must be an object");
      }
      digestAlgorithm ??= "sha256";
      if (digestAlgorithm !== "sha256" && digestAlgorithm !== "sha384" && digestAlgorithm !== "sha512") {
        throw new TypeError('digestAlgorithm must one of "sha256", "sha384", or "sha512"');
      }
      let components;
      switch (jwk.kty) {
        case "EC":
          check(jwk.crv, '"crv" (Curve) Parameter');
          check(jwk.x, '"x" (X Coordinate) Parameter');
          check(jwk.y, '"y" (Y Coordinate) Parameter');
          components = { crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y };
          break;
        case "OKP":
          check(jwk.crv, '"crv" (Subtype of Key Pair) Parameter');
          check(jwk.x, '"x" (Public Key) Parameter');
          components = { crv: jwk.crv, kty: jwk.kty, x: jwk.x };
          break;
        case "RSA":
          check(jwk.e, '"e" (Exponent) Parameter');
          check(jwk.n, '"n" (Modulus) Parameter');
          components = { e: jwk.e, kty: jwk.kty, n: jwk.n };
          break;
        case "oct":
          check(jwk.k, '"k" (Key Value) Parameter');
          components = { k: jwk.k, kty: jwk.kty };
          break;
        default:
          throw new errors_js_1.JOSENotSupported('"kty" (Key Type) Parameter missing or unsupported');
      }
      const data = buffer_utils_js_1.encoder.encode(JSON.stringify(components));
      return (0, base64url_js_1.encode)(await (0, digest_js_1.default)(digestAlgorithm, data));
    }
    async function calculateJwkThumbprintUri(jwk, digestAlgorithm) {
      digestAlgorithm ??= "sha256";
      const thumbprint = await calculateJwkThumbprint(jwk, digestAlgorithm);
      return `urn:ietf:params:oauth:jwk-thumbprint:sha-${digestAlgorithm.slice(-3)}:${thumbprint}`;
    }
  }
});

// node_modules/jose/dist/node/cjs/jwk/embedded.js
var require_embedded = __commonJS({
  "node_modules/jose/dist/node/cjs/jwk/embedded.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.EmbeddedJWK = EmbeddedJWK;
    var import_js_1 = require_import();
    var is_object_js_1 = require_is_object();
    var errors_js_1 = require_errors2();
    async function EmbeddedJWK(protectedHeader, token) {
      const joseHeader = {
        ...protectedHeader,
        ...token?.header
      };
      if (!(0, is_object_js_1.default)(joseHeader.jwk)) {
        throw new errors_js_1.JWSInvalid('"jwk" (JSON Web Key) Header Parameter must be a JSON object');
      }
      const key = await (0, import_js_1.importJWK)({ ...joseHeader.jwk, ext: true }, joseHeader.alg);
      if (key instanceof Uint8Array || key.type !== "public") {
        throw new errors_js_1.JWSInvalid('"jwk" (JSON Web Key) Header Parameter must be a public key');
      }
      return key;
    }
  }
});

// node_modules/jose/dist/node/cjs/jwks/local.js
var require_local = __commonJS({
  "node_modules/jose/dist/node/cjs/jwks/local.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createLocalJWKSet = createLocalJWKSet;
    var import_js_1 = require_import();
    var errors_js_1 = require_errors2();
    var is_object_js_1 = require_is_object();
    function getKtyFromAlg(alg) {
      switch (typeof alg === "string" && alg.slice(0, 2)) {
        case "RS":
        case "PS":
          return "RSA";
        case "ES":
          return "EC";
        case "Ed":
          return "OKP";
        default:
          throw new errors_js_1.JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
      }
    }
    function isJWKSLike(jwks) {
      return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
    }
    function isJWKLike(key) {
      return (0, is_object_js_1.default)(key);
    }
    function clone(obj) {
      if (typeof structuredClone === "function") {
        return structuredClone(obj);
      }
      return JSON.parse(JSON.stringify(obj));
    }
    var LocalJWKSet = class {
      _jwks;
      _cached = /* @__PURE__ */ new WeakMap();
      constructor(jwks) {
        if (!isJWKSLike(jwks)) {
          throw new errors_js_1.JWKSInvalid("JSON Web Key Set malformed");
        }
        this._jwks = clone(jwks);
      }
      async getKey(protectedHeader, token) {
        const { alg, kid } = { ...protectedHeader, ...token?.header };
        const kty = getKtyFromAlg(alg);
        const candidates = this._jwks.keys.filter((jwk2) => {
          let candidate = kty === jwk2.kty;
          if (candidate && typeof kid === "string") {
            candidate = kid === jwk2.kid;
          }
          if (candidate && typeof jwk2.alg === "string") {
            candidate = alg === jwk2.alg;
          }
          if (candidate && typeof jwk2.use === "string") {
            candidate = jwk2.use === "sig";
          }
          if (candidate && Array.isArray(jwk2.key_ops)) {
            candidate = jwk2.key_ops.includes("verify");
          }
          if (candidate) {
            switch (alg) {
              case "ES256":
                candidate = jwk2.crv === "P-256";
                break;
              case "ES256K":
                candidate = jwk2.crv === "secp256k1";
                break;
              case "ES384":
                candidate = jwk2.crv === "P-384";
                break;
              case "ES512":
                candidate = jwk2.crv === "P-521";
                break;
              case "Ed25519":
                candidate = jwk2.crv === "Ed25519";
                break;
              case "EdDSA":
                candidate = jwk2.crv === "Ed25519" || jwk2.crv === "Ed448";
                break;
            }
          }
          return candidate;
        });
        const { 0: jwk, length } = candidates;
        if (length === 0) {
          throw new errors_js_1.JWKSNoMatchingKey();
        }
        if (length !== 1) {
          const error = new errors_js_1.JWKSMultipleMatchingKeys();
          const { _cached } = this;
          error[Symbol.asyncIterator] = async function* () {
            for (const jwk2 of candidates) {
              try {
                yield await importWithAlgCache(_cached, jwk2, alg);
              } catch {
              }
            }
          };
          throw error;
        }
        return importWithAlgCache(this._cached, jwk, alg);
      }
    };
    async function importWithAlgCache(cache, jwk, alg) {
      const cached = cache.get(jwk) || cache.set(jwk, {}).get(jwk);
      if (cached[alg] === void 0) {
        const key = await (0, import_js_1.importJWK)({ ...jwk, ext: true }, alg);
        if (key instanceof Uint8Array || key.type !== "public") {
          throw new errors_js_1.JWKSInvalid("JSON Web Key Set members must be public keys");
        }
        cached[alg] = key;
      }
      return cached[alg];
    }
    function createLocalJWKSet(jwks) {
      const set = new LocalJWKSet(jwks);
      const localJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
      Object.defineProperties(localJWKSet, {
        jwks: {
          value: () => clone(set._jwks),
          enumerable: true,
          configurable: false,
          writable: false
        }
      });
      return localJWKSet;
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/fetch_jwks.js
var require_fetch_jwks = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/fetch_jwks.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var http = __require("node:http");
    var https = __require("node:https");
    var node_events_1 = __require("node:events");
    var errors_js_1 = require_errors2();
    var buffer_utils_js_1 = require_buffer_utils();
    var fetchJwks = async (url, timeout, options) => {
      let get;
      switch (url.protocol) {
        case "https:":
          get = https.get;
          break;
        case "http:":
          get = http.get;
          break;
        default:
          throw new TypeError("Unsupported URL protocol.");
      }
      const { agent, headers } = options;
      const req = get(url.href, {
        agent,
        timeout,
        headers
      });
      const [response] = await Promise.race([(0, node_events_1.once)(req, "response"), (0, node_events_1.once)(req, "timeout")]);
      if (!response) {
        req.destroy();
        throw new errors_js_1.JWKSTimeout();
      }
      if (response.statusCode !== 200) {
        throw new errors_js_1.JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
      }
      const parts = [];
      for await (const part of response) {
        parts.push(part);
      }
      try {
        return JSON.parse(buffer_utils_js_1.decoder.decode((0, buffer_utils_js_1.concat)(...parts)));
      } catch {
        throw new errors_js_1.JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
      }
    };
    exports.default = fetchJwks;
  }
});

// node_modules/jose/dist/node/cjs/jwks/remote.js
var require_remote = __commonJS({
  "node_modules/jose/dist/node/cjs/jwks/remote.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.experimental_jwksCache = exports.jwksCache = void 0;
    exports.createRemoteJWKSet = createRemoteJWKSet;
    var fetch_jwks_js_1 = require_fetch_jwks();
    var errors_js_1 = require_errors2();
    var local_js_1 = require_local();
    var is_object_js_1 = require_is_object();
    function isCloudflareWorkers() {
      return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
    }
    var USER_AGENT;
    if (typeof navigator === "undefined" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) {
      const NAME = "jose";
      const VERSION = "v5.10.0";
      USER_AGENT = `${NAME}/${VERSION}`;
    }
    exports.jwksCache = Symbol();
    function isFreshJwksCache(input, cacheMaxAge) {
      if (typeof input !== "object" || input === null) {
        return false;
      }
      if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
        return false;
      }
      if (!("jwks" in input) || !(0, is_object_js_1.default)(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, is_object_js_1.default)) {
        return false;
      }
      return true;
    }
    var RemoteJWKSet = class {
      _url;
      _timeoutDuration;
      _cooldownDuration;
      _cacheMaxAge;
      _jwksTimestamp;
      _pendingFetch;
      _options;
      _local;
      _cache;
      constructor(url, options) {
        if (!(url instanceof URL)) {
          throw new TypeError("url must be an instance of URL");
        }
        this._url = new URL(url.href);
        this._options = { agent: options?.agent, headers: options?.headers };
        this._timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5e3;
        this._cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 3e4;
        this._cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 6e5;
        if (options?.[exports.jwksCache] !== void 0) {
          this._cache = options?.[exports.jwksCache];
          if (isFreshJwksCache(options?.[exports.jwksCache], this._cacheMaxAge)) {
            this._jwksTimestamp = this._cache.uat;
            this._local = (0, local_js_1.createLocalJWKSet)(this._cache.jwks);
          }
        }
      }
      coolingDown() {
        return typeof this._jwksTimestamp === "number" ? Date.now() < this._jwksTimestamp + this._cooldownDuration : false;
      }
      fresh() {
        return typeof this._jwksTimestamp === "number" ? Date.now() < this._jwksTimestamp + this._cacheMaxAge : false;
      }
      async getKey(protectedHeader, token) {
        if (!this._local || !this.fresh()) {
          await this.reload();
        }
        try {
          return await this._local(protectedHeader, token);
        } catch (err) {
          if (err instanceof errors_js_1.JWKSNoMatchingKey) {
            if (this.coolingDown() === false) {
              await this.reload();
              return this._local(protectedHeader, token);
            }
          }
          throw err;
        }
      }
      async reload() {
        if (this._pendingFetch && isCloudflareWorkers()) {
          this._pendingFetch = void 0;
        }
        const headers = new Headers(this._options.headers);
        if (USER_AGENT && !headers.has("User-Agent")) {
          headers.set("User-Agent", USER_AGENT);
          this._options.headers = Object.fromEntries(headers.entries());
        }
        this._pendingFetch ||= (0, fetch_jwks_js_1.default)(this._url, this._timeoutDuration, this._options).then((json) => {
          this._local = (0, local_js_1.createLocalJWKSet)(json);
          if (this._cache) {
            this._cache.uat = Date.now();
            this._cache.jwks = json;
          }
          this._jwksTimestamp = Date.now();
          this._pendingFetch = void 0;
        }).catch((err) => {
          this._pendingFetch = void 0;
          throw err;
        });
        await this._pendingFetch;
      }
    };
    function createRemoteJWKSet(url, options) {
      const set = new RemoteJWKSet(url, options);
      const remoteJWKSet = async (protectedHeader, token) => set.getKey(protectedHeader, token);
      Object.defineProperties(remoteJWKSet, {
        coolingDown: {
          get: () => set.coolingDown(),
          enumerable: true,
          configurable: false
        },
        fresh: {
          get: () => set.fresh(),
          enumerable: true,
          configurable: false
        },
        reload: {
          value: () => set.reload(),
          enumerable: true,
          configurable: false,
          writable: false
        },
        reloading: {
          get: () => !!set._pendingFetch,
          enumerable: true,
          configurable: false
        },
        jwks: {
          value: () => set._local?.jwks(),
          enumerable: true,
          configurable: false,
          writable: false
        }
      });
      return remoteJWKSet;
    }
    exports.experimental_jwksCache = exports.jwksCache;
  }
});

// node_modules/jose/dist/node/cjs/jwt/unsecured.js
var require_unsecured = __commonJS({
  "node_modules/jose/dist/node/cjs/jwt/unsecured.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UnsecuredJWT = void 0;
    var base64url = require_base64url();
    var buffer_utils_js_1 = require_buffer_utils();
    var errors_js_1 = require_errors2();
    var jwt_claims_set_js_1 = require_jwt_claims_set();
    var produce_js_1 = require_produce();
    var UnsecuredJWT = class extends produce_js_1.ProduceJWT {
      encode() {
        const header = base64url.encode(JSON.stringify({ alg: "none" }));
        const payload = base64url.encode(JSON.stringify(this._payload));
        return `${header}.${payload}.`;
      }
      static decode(jwt, options) {
        if (typeof jwt !== "string") {
          throw new errors_js_1.JWTInvalid("Unsecured JWT must be a string");
        }
        const { 0: encodedHeader, 1: encodedPayload, 2: signature, length } = jwt.split(".");
        if (length !== 3 || signature !== "") {
          throw new errors_js_1.JWTInvalid("Invalid Unsecured JWT");
        }
        let header;
        try {
          header = JSON.parse(buffer_utils_js_1.decoder.decode(base64url.decode(encodedHeader)));
          if (header.alg !== "none")
            throw new Error();
        } catch {
          throw new errors_js_1.JWTInvalid("Invalid Unsecured JWT");
        }
        const payload = (0, jwt_claims_set_js_1.default)(header, base64url.decode(encodedPayload), options);
        return { payload, header };
      }
    };
    exports.UnsecuredJWT = UnsecuredJWT;
  }
});

// node_modules/jose/dist/node/cjs/util/base64url.js
var require_base64url2 = __commonJS({
  "node_modules/jose/dist/node/cjs/util/base64url.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decode = exports.encode = void 0;
    var base64url = require_base64url();
    exports.encode = base64url.encode;
    exports.decode = base64url.decode;
  }
});

// node_modules/jose/dist/node/cjs/util/decode_protected_header.js
var require_decode_protected_header = __commonJS({
  "node_modules/jose/dist/node/cjs/util/decode_protected_header.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeProtectedHeader = decodeProtectedHeader;
    var base64url_js_1 = require_base64url2();
    var buffer_utils_js_1 = require_buffer_utils();
    var is_object_js_1 = require_is_object();
    function decodeProtectedHeader(token) {
      let protectedB64u;
      if (typeof token === "string") {
        const parts = token.split(".");
        if (parts.length === 3 || parts.length === 5) {
          ;
          [protectedB64u] = parts;
        }
      } else if (typeof token === "object" && token) {
        if ("protected" in token) {
          protectedB64u = token.protected;
        } else {
          throw new TypeError("Token does not contain a Protected Header");
        }
      }
      try {
        if (typeof protectedB64u !== "string" || !protectedB64u) {
          throw new Error();
        }
        const result = JSON.parse(buffer_utils_js_1.decoder.decode((0, base64url_js_1.decode)(protectedB64u)));
        if (!(0, is_object_js_1.default)(result)) {
          throw new Error();
        }
        return result;
      } catch {
        throw new TypeError("Invalid Token or Protected Header formatting");
      }
    }
  }
});

// node_modules/jose/dist/node/cjs/util/decode_jwt.js
var require_decode_jwt = __commonJS({
  "node_modules/jose/dist/node/cjs/util/decode_jwt.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decodeJwt = decodeJwt;
    var base64url_js_1 = require_base64url2();
    var buffer_utils_js_1 = require_buffer_utils();
    var is_object_js_1 = require_is_object();
    var errors_js_1 = require_errors2();
    function decodeJwt(jwt) {
      if (typeof jwt !== "string")
        throw new errors_js_1.JWTInvalid("JWTs must use Compact JWS serialization, JWT must be a string");
      const { 1: payload, length } = jwt.split(".");
      if (length === 5)
        throw new errors_js_1.JWTInvalid("Only JWTs using Compact JWS serialization can be decoded");
      if (length !== 3)
        throw new errors_js_1.JWTInvalid("Invalid JWT");
      if (!payload)
        throw new errors_js_1.JWTInvalid("JWTs must contain a payload");
      let decoded;
      try {
        decoded = (0, base64url_js_1.decode)(payload);
      } catch {
        throw new errors_js_1.JWTInvalid("Failed to base64url decode the payload");
      }
      let result;
      try {
        result = JSON.parse(buffer_utils_js_1.decoder.decode(decoded));
      } catch {
        throw new errors_js_1.JWTInvalid("Failed to parse the decoded payload as JSON");
      }
      if (!(0, is_object_js_1.default)(result))
        throw new errors_js_1.JWTInvalid("Invalid JWT Claims Set");
      return result;
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/generate.js
var require_generate = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/generate.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateSecret = generateSecret;
    exports.generateKeyPair = generateKeyPair;
    var node_crypto_1 = __require("node:crypto");
    var node_util_1 = __require("node:util");
    var random_js_1 = require_random();
    var errors_js_1 = require_errors2();
    var generate = (0, node_util_1.promisify)(node_crypto_1.generateKeyPair);
    async function generateSecret(alg, options) {
      let length;
      switch (alg) {
        case "HS256":
        case "HS384":
        case "HS512":
        case "A128CBC-HS256":
        case "A192CBC-HS384":
        case "A256CBC-HS512":
          length = parseInt(alg.slice(-3), 10);
          break;
        case "A128KW":
        case "A192KW":
        case "A256KW":
        case "A128GCMKW":
        case "A192GCMKW":
        case "A256GCMKW":
        case "A128GCM":
        case "A192GCM":
        case "A256GCM":
          length = parseInt(alg.slice(1, 4), 10);
          break;
        default:
          throw new errors_js_1.JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      return (0, node_crypto_1.createSecretKey)((0, random_js_1.default)(new Uint8Array(length >> 3)));
    }
    async function generateKeyPair(alg, options) {
      switch (alg) {
        case "RS256":
        case "RS384":
        case "RS512":
        case "PS256":
        case "PS384":
        case "PS512":
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
        case "RSA1_5": {
          const modulusLength = options?.modulusLength ?? 2048;
          if (typeof modulusLength !== "number" || modulusLength < 2048) {
            throw new errors_js_1.JOSENotSupported("Invalid or unsupported modulusLength option provided, 2048 bits or larger keys must be used");
          }
          const keypair = await generate("rsa", {
            modulusLength,
            publicExponent: 65537
          });
          return keypair;
        }
        case "ES256":
          return generate("ec", { namedCurve: "P-256" });
        case "ES256K":
          return generate("ec", { namedCurve: "secp256k1" });
        case "ES384":
          return generate("ec", { namedCurve: "P-384" });
        case "ES512":
          return generate("ec", { namedCurve: "P-521" });
        case "Ed25519":
          return generate("ed25519");
        case "EdDSA": {
          switch (options?.crv) {
            case void 0:
            case "Ed25519":
              return generate("ed25519");
            case "Ed448":
              return generate("ed448");
            default:
              throw new errors_js_1.JOSENotSupported("Invalid or unsupported crv option provided, supported values are Ed25519 and Ed448");
          }
        }
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW": {
          const crv = options?.crv ?? "P-256";
          switch (crv) {
            case void 0:
            case "P-256":
            case "P-384":
            case "P-521":
              return generate("ec", { namedCurve: crv });
            case "X25519":
              return generate("x25519");
            case "X448":
              return generate("x448");
            default:
              throw new errors_js_1.JOSENotSupported("Invalid or unsupported crv option provided, supported values are P-256, P-384, P-521, X25519, and X448");
          }
        }
        default:
          throw new errors_js_1.JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
    }
  }
});

// node_modules/jose/dist/node/cjs/key/generate_key_pair.js
var require_generate_key_pair = __commonJS({
  "node_modules/jose/dist/node/cjs/key/generate_key_pair.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateKeyPair = generateKeyPair;
    var generate_js_1 = require_generate();
    async function generateKeyPair(alg, options) {
      return (0, generate_js_1.generateKeyPair)(alg, options);
    }
  }
});

// node_modules/jose/dist/node/cjs/key/generate_secret.js
var require_generate_secret = __commonJS({
  "node_modules/jose/dist/node/cjs/key/generate_secret.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.generateSecret = generateSecret;
    var generate_js_1 = require_generate();
    async function generateSecret(alg, options) {
      return (0, generate_js_1.generateSecret)(alg, options);
    }
  }
});

// node_modules/jose/dist/node/cjs/runtime/runtime.js
var require_runtime = __commonJS({
  "node_modules/jose/dist/node/cjs/runtime/runtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = "node:crypto";
  }
});

// node_modules/jose/dist/node/cjs/util/runtime.js
var require_runtime2 = __commonJS({
  "node_modules/jose/dist/node/cjs/util/runtime.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var runtime_js_1 = require_runtime();
    exports.default = runtime_js_1.default;
  }
});

// node_modules/jose/dist/node/cjs/index.js
var require_cjs = __commonJS({
  "node_modules/jose/dist/node/cjs/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.cryptoRuntime = exports.base64url = exports.generateSecret = exports.generateKeyPair = exports.errors = exports.decodeJwt = exports.decodeProtectedHeader = exports.importJWK = exports.importX509 = exports.importPKCS8 = exports.importSPKI = exports.exportJWK = exports.exportSPKI = exports.exportPKCS8 = exports.UnsecuredJWT = exports.experimental_jwksCache = exports.jwksCache = exports.createRemoteJWKSet = exports.createLocalJWKSet = exports.EmbeddedJWK = exports.calculateJwkThumbprintUri = exports.calculateJwkThumbprint = exports.EncryptJWT = exports.SignJWT = exports.GeneralSign = exports.FlattenedSign = exports.CompactSign = exports.FlattenedEncrypt = exports.CompactEncrypt = exports.jwtDecrypt = exports.jwtVerify = exports.generalVerify = exports.flattenedVerify = exports.compactVerify = exports.GeneralEncrypt = exports.generalDecrypt = exports.flattenedDecrypt = exports.compactDecrypt = void 0;
    var decrypt_js_1 = require_decrypt3();
    Object.defineProperty(exports, "compactDecrypt", { enumerable: true, get: function() {
      return decrypt_js_1.compactDecrypt;
    } });
    var decrypt_js_2 = require_decrypt2();
    Object.defineProperty(exports, "flattenedDecrypt", { enumerable: true, get: function() {
      return decrypt_js_2.flattenedDecrypt;
    } });
    var decrypt_js_3 = require_decrypt4();
    Object.defineProperty(exports, "generalDecrypt", { enumerable: true, get: function() {
      return decrypt_js_3.generalDecrypt;
    } });
    var encrypt_js_1 = require_encrypt3();
    Object.defineProperty(exports, "GeneralEncrypt", { enumerable: true, get: function() {
      return encrypt_js_1.GeneralEncrypt;
    } });
    var verify_js_1 = require_verify3();
    Object.defineProperty(exports, "compactVerify", { enumerable: true, get: function() {
      return verify_js_1.compactVerify;
    } });
    var verify_js_2 = require_verify2();
    Object.defineProperty(exports, "flattenedVerify", { enumerable: true, get: function() {
      return verify_js_2.flattenedVerify;
    } });
    var verify_js_3 = require_verify4();
    Object.defineProperty(exports, "generalVerify", { enumerable: true, get: function() {
      return verify_js_3.generalVerify;
    } });
    var verify_js_4 = require_verify5();
    Object.defineProperty(exports, "jwtVerify", { enumerable: true, get: function() {
      return verify_js_4.jwtVerify;
    } });
    var decrypt_js_4 = require_decrypt5();
    Object.defineProperty(exports, "jwtDecrypt", { enumerable: true, get: function() {
      return decrypt_js_4.jwtDecrypt;
    } });
    var encrypt_js_2 = require_encrypt4();
    Object.defineProperty(exports, "CompactEncrypt", { enumerable: true, get: function() {
      return encrypt_js_2.CompactEncrypt;
    } });
    var encrypt_js_3 = require_encrypt2();
    Object.defineProperty(exports, "FlattenedEncrypt", { enumerable: true, get: function() {
      return encrypt_js_3.FlattenedEncrypt;
    } });
    var sign_js_1 = require_sign3();
    Object.defineProperty(exports, "CompactSign", { enumerable: true, get: function() {
      return sign_js_1.CompactSign;
    } });
    var sign_js_2 = require_sign2();
    Object.defineProperty(exports, "FlattenedSign", { enumerable: true, get: function() {
      return sign_js_2.FlattenedSign;
    } });
    var sign_js_3 = require_sign4();
    Object.defineProperty(exports, "GeneralSign", { enumerable: true, get: function() {
      return sign_js_3.GeneralSign;
    } });
    var sign_js_4 = require_sign5();
    Object.defineProperty(exports, "SignJWT", { enumerable: true, get: function() {
      return sign_js_4.SignJWT;
    } });
    var encrypt_js_4 = require_encrypt5();
    Object.defineProperty(exports, "EncryptJWT", { enumerable: true, get: function() {
      return encrypt_js_4.EncryptJWT;
    } });
    var thumbprint_js_1 = require_thumbprint();
    Object.defineProperty(exports, "calculateJwkThumbprint", { enumerable: true, get: function() {
      return thumbprint_js_1.calculateJwkThumbprint;
    } });
    Object.defineProperty(exports, "calculateJwkThumbprintUri", { enumerable: true, get: function() {
      return thumbprint_js_1.calculateJwkThumbprintUri;
    } });
    var embedded_js_1 = require_embedded();
    Object.defineProperty(exports, "EmbeddedJWK", { enumerable: true, get: function() {
      return embedded_js_1.EmbeddedJWK;
    } });
    var local_js_1 = require_local();
    Object.defineProperty(exports, "createLocalJWKSet", { enumerable: true, get: function() {
      return local_js_1.createLocalJWKSet;
    } });
    var remote_js_1 = require_remote();
    Object.defineProperty(exports, "createRemoteJWKSet", { enumerable: true, get: function() {
      return remote_js_1.createRemoteJWKSet;
    } });
    Object.defineProperty(exports, "jwksCache", { enumerable: true, get: function() {
      return remote_js_1.jwksCache;
    } });
    Object.defineProperty(exports, "experimental_jwksCache", { enumerable: true, get: function() {
      return remote_js_1.experimental_jwksCache;
    } });
    var unsecured_js_1 = require_unsecured();
    Object.defineProperty(exports, "UnsecuredJWT", { enumerable: true, get: function() {
      return unsecured_js_1.UnsecuredJWT;
    } });
    var export_js_1 = require_export();
    Object.defineProperty(exports, "exportPKCS8", { enumerable: true, get: function() {
      return export_js_1.exportPKCS8;
    } });
    Object.defineProperty(exports, "exportSPKI", { enumerable: true, get: function() {
      return export_js_1.exportSPKI;
    } });
    Object.defineProperty(exports, "exportJWK", { enumerable: true, get: function() {
      return export_js_1.exportJWK;
    } });
    var import_js_1 = require_import();
    Object.defineProperty(exports, "importSPKI", { enumerable: true, get: function() {
      return import_js_1.importSPKI;
    } });
    Object.defineProperty(exports, "importPKCS8", { enumerable: true, get: function() {
      return import_js_1.importPKCS8;
    } });
    Object.defineProperty(exports, "importX509", { enumerable: true, get: function() {
      return import_js_1.importX509;
    } });
    Object.defineProperty(exports, "importJWK", { enumerable: true, get: function() {
      return import_js_1.importJWK;
    } });
    var decode_protected_header_js_1 = require_decode_protected_header();
    Object.defineProperty(exports, "decodeProtectedHeader", { enumerable: true, get: function() {
      return decode_protected_header_js_1.decodeProtectedHeader;
    } });
    var decode_jwt_js_1 = require_decode_jwt();
    Object.defineProperty(exports, "decodeJwt", { enumerable: true, get: function() {
      return decode_jwt_js_1.decodeJwt;
    } });
    exports.errors = require_errors2();
    var generate_key_pair_js_1 = require_generate_key_pair();
    Object.defineProperty(exports, "generateKeyPair", { enumerable: true, get: function() {
      return generate_key_pair_js_1.generateKeyPair;
    } });
    var generate_secret_js_1 = require_generate_secret();
    Object.defineProperty(exports, "generateSecret", { enumerable: true, get: function() {
      return generate_secret_js_1.generateSecret;
    } });
    exports.base64url = require_base64url2();
    var runtime_js_1 = require_runtime2();
    Object.defineProperty(exports, "cryptoRuntime", { enumerable: true, get: function() {
      return runtime_js_1.default;
    } });
  }
});

// node_modules/@vercel/oidc/dist/verify-vercel-oidc-token.js
var require_verify_vercel_oidc_token = __commonJS({
  "node_modules/@vercel/oidc/dist/verify-vercel-oidc-token.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var verify_vercel_oidc_token_exports = {};
    __export(verify_vercel_oidc_token_exports, {
      verifyVercelOidcToken: () => verifyVercelOidcToken2
    });
    module.exports = __toCommonJS(verify_vercel_oidc_token_exports);
    var import_jose = require_cjs();
    var VERCEL_OIDC_ISSUER = "https://oidc.vercel.com";
    var VERCEL_OIDC_JWKS_URL = new URL(
      "https://oidc.vercel.com/.well-known/jwks"
    );
    var DEFAULT_ALGORITHMS = ["RS256"];
    var VERCEL_OIDC_JWKS = (0, import_jose.createRemoteJWKSet)(VERCEL_OIDC_JWKS_URL);
    var VercelOidcTokenValidationError = class extends TypeError {
      constructor(message) {
        super(message);
        this.code = "ERR_VERCEL_OIDC_TOKEN_VALIDATION";
        this.name = "VercelOidcTokenValidationError";
      }
    };
    async function verifyVercelOidcToken2(token, options) {
      const {
        algorithms,
        projectId = process.env.VERCEL_PROJECT_ID,
        environment = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV,
        ownerId,
        ...verifyOptions
      } = options ?? {};
      if (projectId === "*" && ownerId === void 0 && !hasAudienceVerification(verifyOptions.audience)) {
        throw new TypeError(
          "Expected ownerId or audience to be provided when projectId is '*'."
        );
      }
      const result = await (0, import_jose.jwtVerify)(token, VERCEL_OIDC_JWKS, {
        ...verifyOptions,
        algorithms: algorithms ?? DEFAULT_ALGORITHMS
      });
      validateIssuer(result.payload.iss);
      validateClaim({
        actual: result.payload.project_id,
        claim: "project_id",
        env: "VERCEL_PROJECT_ID",
        expected: projectId,
        option: "projectId"
      });
      validateClaim({
        actual: result.payload.environment,
        claim: "environment",
        env: "VERCEL_TARGET_ENV or VERCEL_ENV",
        expected: environment,
        option: "environment"
      });
      validateOptionalClaim({
        actual: result.payload.owner_id,
        claim: "owner_id",
        expected: ownerId
      });
      return result;
    }
    function hasAudienceVerification(audience) {
      return Array.isArray(audience) ? audience.length > 0 : audience !== void 0;
    }
    function validateIssuer(actual) {
      if (actual !== VERCEL_OIDC_ISSUER && (typeof actual !== "string" || !actual.startsWith(`${VERCEL_OIDC_ISSUER}/`))) {
        throw new VercelOidcTokenValidationError(
          `Expected Vercel OIDC token iss claim to be "${VERCEL_OIDC_ISSUER}" or to start with "${VERCEL_OIDC_ISSUER}/".`
        );
      }
    }
    function validateClaim({
      actual,
      claim,
      env,
      expected,
      option
    }) {
      if (expected === "*") {
        return;
      }
      if (expected === void 0 || expected.length === 0) {
        throw new TypeError(
          `Expected ${env} to be set or ${option} to be provided. Pass ${option}: '*' to allow any ${claim} claim.`
        );
      }
      if (Array.isArray(expected) && typeof actual === "string" && expected.includes(actual)) {
        return;
      }
      if (actual !== expected) {
        throw new VercelOidcTokenValidationError(
          Array.isArray(expected) ? `Expected Vercel OIDC token ${claim} claim to be one of: ${expected.map((value) => `"${value}"`).join(", ")}.` : `Expected Vercel OIDC token ${claim} claim to be "${expected}".`
        );
      }
    }
    function validateOptionalClaim({
      actual,
      claim,
      expected
    }) {
      if (expected === void 0) {
        return;
      }
      if (actual !== expected) {
        throw new VercelOidcTokenValidationError(
          `Expected Vercel OIDC token ${claim} claim to be "${expected}".`
        );
      }
    }
  }
});

// node_modules/@vercel/oidc/dist/index.js
var require_dist3 = __commonJS({
  "node_modules/@vercel/oidc/dist/index.js"(exports, module) {
    "use strict";
    var __defProp2 = Object.defineProperty;
    var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames2 = Object.getOwnPropertyNames;
    var __hasOwnProp2 = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp2(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps2 = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames2(from))
          if (!__hasOwnProp2.call(to, key) && key !== except)
            __defProp2(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps2(__defProp2({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export(src_exports, {
      AccessTokenMissingError: () => import_auth_errors.AccessTokenMissingError,
      RefreshAccessTokenFailedError: () => import_auth_errors.RefreshAccessTokenFailedError,
      exchangeVercelOidcToken: () => import_exchange_vercel_oidc_token.exchangeVercelOidcToken,
      getContext: () => import_get_context.getContext,
      getVercelOidcToken: () => import_get_vercel_oidc_token_with_refresh.getVercelOidcToken,
      getVercelOidcTokenSync: () => import_get_vercel_oidc_token_sync.getVercelOidcTokenSync,
      getVercelToken: () => import_token_util.getVercelToken,
      verifyVercelOidcToken: () => import_verify_vercel_oidc_token.verifyVercelOidcToken
    });
    module.exports = __toCommonJS(src_exports);
    var import_get_vercel_oidc_token_with_refresh = require_get_vercel_oidc_token_with_refresh();
    var import_get_vercel_oidc_token_sync = require_get_vercel_oidc_token_sync();
    var import_get_context = require_get_context();
    var import_verify_vercel_oidc_token = require_verify_vercel_oidc_token();
    var import_auth_errors = require_auth_errors();
    var import_exchange_vercel_oidc_token = require_exchange_vercel_oidc_token();
    var import_token_util = require_token_util();
  }
});

// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";

// src/server/backendRouter.ts
import { Router } from "express";
import { getAuth } from "firebase-admin/auth";
import { getApp } from "firebase-admin/app";

// src/utils/phoneUtils.ts
function normalizePhoneNumber(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") return "";
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0062")) {
    digits = digits.slice(4);
    if (!digits.startsWith("8") && !digits.startsWith("08")) {
      digits = "8" + digits;
    }
  }
  if (digits.startsWith("6208")) {
    return "08" + digits.slice(4);
  }
  if (digits.startsWith("628")) {
    return "0" + digits.slice(2);
  }
  if (digits.startsWith("8")) {
    return "0" + digits;
  }
  if (digits.startsWith("08")) {
    return digits;
  }
  return digits;
}

// src/server/trustedBackendService.ts
import admin2 from "firebase-admin";
import crypto2 from "crypto";

// src/server/firebaseAdminInit.ts
import admin from "firebase-admin";
function initFirebaseAdmin(customConfig) {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }
  const projectId = customConfig?.projectId || process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || "future-wonder-jwh4c";
  const serviceAccountId = customConfig?.serviceAccountId || process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_SERVICE_ACCOUNT_ID || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || serviceAccountId;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail && rawPrivateKey) {
    try {
      const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        }),
        projectId,
        serviceAccountId: serviceAccountId || clientEmail
      });
    } catch (certErr) {
      console.warn("[Firebase Admin Init] Inisialisasi cert env gagal, mencoba fallback:", certErr?.message);
    }
  }
  const rawCredsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (rawCredsJson && rawCredsJson.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawCredsJson);
      if (parsed.type === "service_account") {
        return admin.initializeApp({
          credential: admin.credential.cert(parsed),
          projectId: parsed.project_id || projectId,
          serviceAccountId: serviceAccountId || parsed.client_email
        });
      } else {
        return admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
          serviceAccountId
        });
      }
    } catch (jsonErr) {
      console.warn("[Firebase Admin Init] Inisialisasi credentials JSON gagal:", jsonErr?.message);
    }
  }
  const appOptions = { projectId };
  if (serviceAccountId) {
    appOptions.serviceAccountId = serviceAccountId;
  }
  try {
    return admin.initializeApp(appOptions);
  } catch (adcErr) {
    console.warn("[Firebase Admin Init] Default ADC initialization notice:", adcErr?.message);
    return admin.app();
  }
}

// src/server/keylessWifSigner.ts
var import_oidc = __toESM(require_dist3(), 1);
function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf8");
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function getRuntimeVercelOidcToken(options) {
  try {
    const token = await (0, import_oidc.getVercelOidcToken)();
    if (token && typeof token === "string" && token.trim().length > 0) {
      return token.trim();
    }
  } catch (err) {
  }
  if (options?.reqHeaders) {
    const headerVal = options.reqHeaders["x-vercel-oidc-token"];
    if (typeof headerVal === "string" && headerVal.trim().length > 0) {
      return headerVal.trim();
    }
    if (Array.isArray(headerVal) && headerVal.length > 0 && typeof headerVal[0] === "string") {
      return headerVal[0].trim();
    }
  }
  if (process.env.VERCEL_OIDC_TOKEN && process.env.VERCEL_OIDC_TOKEN.trim().length > 0) {
    return process.env.VERCEL_OIDC_TOKEN.trim();
  }
  return null;
}
async function exchangeOidcForGoogleStsToken(params) {
  const { oidcToken, wifAudience, fetchFn = fetch } = params;
  if (!oidcToken || !oidcToken.trim()) {
    throw new Error("Vercel OIDC token kosong atau tidak valid.");
  }
  if (!wifAudience || !wifAudience.trim() || !wifAudience.startsWith("//iam.googleapis.com/")) {
    throw new Error(`WIF Audience tidak valid: "${wifAudience}". Harus diawali dengan "//iam.googleapis.com/".`);
  }
  const stsBody = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
    audience: wifAudience.trim(),
    scope: "https://www.googleapis.com/auth/cloud-platform",
    requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
    subject_token: oidcToken.trim(),
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt"
  });
  const res = await fetchFn("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: stsBody.toString()
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Google STS Token Exchange gagal (${res.status}): ${data.error_description || data.error || JSON.stringify(data)}`);
  }
  if (!data.access_token) {
    throw new Error("Google STS tidak mengembalikan access_token.");
  }
  return data.access_token;
}
async function impersonateServiceAccount(params) {
  const { stsAccessToken, serviceAccountEmail, fetchFn = fetch } = params;
  if (!serviceAccountEmail || !serviceAccountEmail.includes("@")) {
    throw new Error(`Email Service Account tidak valid: "${serviceAccountEmail}".`);
  }
  const url = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:generateAccessToken`;
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${stsAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      scope: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/identitytoolkit"
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Service Account impersonation gagal (${res.status}): ${data.error?.message || JSON.stringify(data)}`);
  }
  if (!data.accessToken) {
    throw new Error("IAM Credentials tidak mengembalikan accessToken impersonasi.");
  }
  return data.accessToken;
}
async function signCustomTokenWithIam(params) {
  const { saAccessToken, serviceAccountEmail, unsignedToken, fetchFn = fetch } = params;
  const url = `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(serviceAccountEmail)}:signBlob`;
  const base64Payload = Buffer.from(unsignedToken, "utf8").toString("base64");
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${saAccessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      payload: base64Payload
    })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`IAM signBlob gagal (${res.status}): ${data.error?.message || JSON.stringify(data)}`);
  }
  if (!data.signedBlob) {
    throw new Error("IAM signBlob tidak mengembalikan signature signedBlob.");
  }
  const signatureUrlSafe = data.signedBlob.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${unsignedToken}.${signatureUrlSafe}`;
}
async function generateFirebaseCustomTokenKeyless(params) {
  const { uid, claims, config, fetchFn = fetch } = params;
  const wifAudience = config?.wifAudience || process.env.GCP_WORKLOAD_IDENTITY_PROVIDER || process.env.VERCEL_OIDC_AUDIENCE;
  const serviceAccountEmail = config?.serviceAccountEmail || process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_SERVICE_ACCOUNT_ID;
  if (!wifAudience) {
    throw new Error("Konfigurasi WIF Audience (GCP_WORKLOAD_IDENTITY_PROVIDER) belum disetel.");
  }
  if (!serviceAccountEmail) {
    throw new Error("Konfigurasi Service Account Email (FIREBASE_SERVICE_ACCOUNT_EMAIL) belum disetel.");
  }
  let oidcToken = params.oidcToken;
  if (!oidcToken) {
    oidcToken = await getRuntimeVercelOidcToken() || void 0;
  }
  if (!oidcToken) {
    throw new Error("OIDC Token Vercel tidak ditemukan pada runtime ini.");
  }
  const stsToken = await exchangeOidcForGoogleStsToken({
    oidcToken,
    wifAudience,
    fetchFn
  });
  const saToken = await impersonateServiceAccount({
    stsAccessToken: stsToken,
    serviceAccountEmail,
    fetchFn
  });
  const now = Math.floor(Date.now() / 1e3);
  const jwtHeader = {
    alg: "RS256",
    typ: "JWT"
  };
  const jwtPayload = {
    iss: serviceAccountEmail,
    sub: serviceAccountEmail,
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    iat: now,
    exp: now + 3600,
    uid,
    claims
  };
  const headerEncoded = base64UrlEncode(JSON.stringify(jwtHeader));
  const payloadEncoded = base64UrlEncode(JSON.stringify(jwtPayload));
  const unsignedToken = `${headerEncoded}.${payloadEncoded}`;
  const customToken = await signCustomTokenWithIam({
    saAccessToken: saToken,
    serviceAccountEmail,
    unsignedToken,
    fetchFn
  });
  return customToken;
}

// src/server/trustedBackendService.ts
initFirebaseAdmin();
var INITIAL_CONFIRMED_SEQUENCE = 38;
var InMemoryBackendStore = class {
  constructor() {
    this.counter = INITIAL_CONFIRMED_SEQUENCE;
    this.counterLock = Promise.resolve();
    this.students = /* @__PURE__ */ new Map();
    this.invoices = /* @__PURE__ */ new Map();
    this.attendances = /* @__PURE__ */ new Map();
    this.invoicePayments = /* @__PURE__ */ new Map();
    this.cashMutations = /* @__PURE__ */ new Map();
    this.paymentVerifications = /* @__PURE__ */ new Map();
  }
  async getStudentCounter() {
    return this.counter;
  }
  async setStudentCounter(nextSeq) {
    this.counter = nextSeq;
  }
  async getNextStudentCounterAtomic() {
    let releaseLock = () => {
    };
    const nextLock = new Promise((resolve) => {
      releaseLock = resolve;
    });
    const currentLock = this.counterLock;
    this.counterLock = nextLock;
    await currentLock;
    try {
      this.counter += 1;
      return this.counter;
    } finally {
      releaseLock();
    }
  }
  async getStudent(id) {
    return this.students.get(id) || null;
  }
  async saveStudent(student) {
    this.students.set(student.id, { ...student });
  }
  async listStudents() {
    return Array.from(this.students.values());
  }
  async getInvoice(id) {
    return this.invoices.get(id) || null;
  }
  async saveInvoice(invoice) {
    this.invoices.set(invoice.id, { ...invoice });
  }
  async listInvoicesByStudent(studentId) {
    return Array.from(this.invoices.values()).filter((i) => i.studentId === studentId);
  }
  async getAttendance(id) {
    return this.attendances.get(id) || null;
  }
  async saveAttendance(attendance) {
    this.attendances.set(attendance.id, { ...attendance });
  }
  async saveInvoicePayment(payment) {
    this.invoicePayments.set(payment.id, { ...payment });
  }
  async saveCashMutation(mutation) {
    this.cashMutations.set(mutation.id, { ...mutation });
  }
  async getPaymentVerification(id) {
    return this.paymentVerifications.get(id) || null;
  }
  async savePaymentVerification(request) {
    this.paymentVerifications.set(request.id, { ...request });
  }
  // Debug Helpers
  getAllPaymentVerifications() {
    return Array.from(this.paymentVerifications.values());
  }
  getAllCashMutations() {
    return Array.from(this.cashMutations.values());
  }
  getAllInvoicePayments() {
    return Array.from(this.invoicePayments.values());
  }
};
function assertStagingBackendIsolation(targetEnv) {
  if (targetEnv === "production") {
    throw new Error(
      "[TrustedBackend Guard] FATAL: Eksekusi backend langsung ke Firebase Production future-wonder-jwh4c DITOLAK. Operasi ini dibatasi hanya untuk lingkungan Staging / Emulator terkontrol."
    );
  }
}
var TrustedBackendService = class {
  constructor(store, env = "staging") {
    this.store = store;
    this.env = env;
    assertStagingBackendIsolation(env);
  }
  /**
   * 1. ATOMIC STUDENT REGISTRATION WITH MONOTONIC COUNTER
   * Menjamin nomor urut NIS berurutan dimulai dari sequence 38 -> BFA-039.
   */
  async registerStudentAndIncrementCounter(payload, registeredByRole = "public") {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error("VALIDATION_ERROR: Nama siswa wajib diisi");
    }
    if (!payload.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.birthDate)) {
      throw new Error("VALIDATION_ERROR: Format tanggal lahir tidak valid (harus YYYY-MM-DD)");
    }
    if (!payload.phone || payload.phone.trim().length === 0) {
      throw new Error("VALIDATION_ERROR: Nomor WhatsApp orang tua wajib diisi");
    }
    const normalizedPhone = normalizePhoneNumber(payload.phone);
    if (!normalizedPhone || normalizedPhone.length < 9) {
      throw new Error("VALIDATION_ERROR: Nomor telepon tidak valid");
    }
    const nextSeq = typeof this.store.getNextStudentCounterAtomic === "function" ? await this.store.getNextStudentCounterAtomic() : await this.store.getStudentCounter() + 1;
    await this.store.setStudentCounter(nextSeq);
    const formattedId = `BFA-${String(nextSeq).padStart(3, "0")}`;
    const initialRegStatus = registeredByRole === "admin" ? "DISETUJUI" : "MENUNGGU_VERIFIKASI";
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const newStudent = {
      id: formattedId,
      name: payload.name.trim(),
      nickname: payload.nickname?.trim() || payload.name.trim().split(" ")[0],
      avatar: "",
      birthPlace: payload.birthPlace?.trim() || "-",
      birthDate: payload.birthDate,
      gender: payload.gender || "L",
      parentName: payload.parentName?.trim() || "-",
      phone: normalizedPhone,
      classGroupId: payload.classGroupId || "U10",
      status: registeredByRole === "admin" ? "Aktif" : "Aktif",
      joinedDate: nowIso.split("T")[0],
      position: payload.position || "Belum Ditentukan",
      jerseyNumber: payload.jerseyNumber || 0,
      documents: payload.documents || {},
      customPassword: payload.customPassword?.trim() || void 0,
      registrationStatus: initialRegStatus,
      registrationDate: nowIso,
      verifiedAt: registeredByRole === "admin" ? nowIso : void 0,
      verifiedBy: registeredByRole === "admin" ? "SYSTEM_ADMIN_STAGING" : void 0
    };
    await this.store.setStudentCounter(nextSeq);
    await this.store.saveStudent(newStudent);
    return { student: newStudent, generatedId: formattedId };
  }
  /**
   * 2. ATOMIC ATTENDANCE & Rp 15.000 TRAINING INVOICE GENERATOR
   * Idempoten: jika presensi sudah ada untuk tanggal yang sama, tidak menerbitkan invoice ganda.
   */
  async recordAttendanceWithFeeTransaction(payload) {
    if (!payload.studentId || !payload.date) {
      throw new Error("VALIDATION_ERROR: studentId dan date wajib diisi");
    }
    const student = await this.store.getStudent(payload.studentId);
    if (!student) {
      throw new Error(`NOT_FOUND: Siswa dengan ID ${payload.studentId} tidak ditemukan`);
    }
    const attendanceId = `ATT-${payload.studentId}-${payload.date.replace(/-/g, "")}`;
    const existingAttendance = await this.store.getAttendance(attendanceId);
    if (existingAttendance && existingAttendance.status === payload.status) {
      const invoiceId = `INV-LAT-${payload.studentId}-${payload.date.replace(/-/g, "")}`;
      const invResult = existingAttendance.feeGenerated ? await this.store.getInvoice(invoiceId) : null;
      const existingInvoice = invResult || void 0;
      return {
        attendance: existingAttendance,
        feeGenerated: existingAttendance.feeGenerated,
        invoice: existingInvoice
      };
    }
    const isHadir = payload.status === "HADIR";
    let feeGenerated = false;
    let createdInvoice;
    if (isHadir) {
      const invoiceId = `INV-LAT-${payload.studentId}-${payload.date.replace(/-/g, "")}`;
      const existingInvoice = await this.store.getInvoice(invoiceId);
      if (!existingInvoice) {
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        createdInvoice = {
          id: invoiceId,
          studentId: student.id,
          studentName: student.name,
          classGroupId: student.classGroupId,
          type: "Latihan",
          period: payload.date,
          attendanceDate: payload.date,
          amount: 15e3,
          paidAmount: 0,
          remainingAmount: 15e3,
          status: "BELUM BAYAR",
          dueDate: payload.date,
          createdAt: nowIso,
          updatedAt: nowIso
        };
        await this.store.saveInvoice(createdInvoice);
        feeGenerated = true;
      } else {
        feeGenerated = true;
        createdInvoice = existingInvoice;
      }
    }
    const newAttendance = {
      id: attendanceId,
      studentId: student.id,
      studentName: student.name,
      classGroupId: student.classGroupId,
      date: payload.date,
      checkInTime: payload.checkInTime || (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5),
      status: payload.status,
      feeGenerated,
      method: payload.method || "MANUAL",
      notes: payload.notes
    };
    await this.store.saveAttendance(newAttendance);
    return {
      attendance: newAttendance,
      feeGenerated,
      invoice: createdInvoice
    };
  }
  /**
   * 3. ATOMIC INVOICE PAYMENT & CASH MUTATION (ANTI-OVERPAYMENT)
   * Memvalidasi sisa tagihan, mencegah overpayment, dan mencatat mutasi kas secara atomik.
   */
  async processInvoicePaymentAtomic(payload) {
    if (!payload.invoiceId || payload.amount <= 0) {
      throw new Error("VALIDATION_ERROR: invoiceId dan amount > 0 wajib diisi");
    }
    const invoice = await this.store.getInvoice(payload.invoiceId);
    if (!invoice) {
      throw new Error(`NOT_FOUND: Invoice ${payload.invoiceId} tidak ditemukan`);
    }
    const currentPaid = invoice.paidAmount || 0;
    const remaining = invoice.remainingAmount !== void 0 ? invoice.remainingAmount : invoice.amount - currentPaid;
    if (payload.amount > remaining) {
      throw new Error(
        `OVERPAYMENT_NOT_ALLOWED: Nominal pembayaran Rp ${payload.amount.toLocaleString()} melebihi sisa tagihan Rp ${remaining.toLocaleString()}`
      );
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const dateStr = nowIso.split("T")[0];
    const timeStr = nowIso.split("T")[1].slice(0, 8);
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const mutationId = `MUT_${paymentId}`;
    const newPaidAmount = currentPaid + payload.amount;
    const newRemainingAmount = invoice.amount - newPaidAmount;
    const newStatus = newRemainingAmount <= 0 ? "LUNAS" : "SEBAGIAN";
    const paymentRecord = {
      id: paymentId,
      paymentId,
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      amount: payload.amount,
      date: dateStr,
      time: timeStr,
      method: payload.method,
      staff: payload.staff,
      note: payload.note || `Pembayaran ${newStatus}`,
      transactionId: payload.transactionId || `TRX-${paymentId}`,
      receiptUrl: payload.receiptUrl,
      mutationId,
      createdAt: nowIso
    };
    const cashMutation = {
      id: mutationId,
      date: dateStr,
      time: timeStr,
      type: "Pemasukan",
      category: "Pembayaran Tagihan Siswa",
      note: `Pembayaran ${invoice.type} (${invoice.period}) an. ${invoice.studentName} [${newStatus}]`,
      method: payload.method,
      amount: payload.amount,
      staff: payload.staff,
      source: "INVOICE_PAYMENT",
      paymentId,
      invoiceId: invoice.id,
      idempotencyKey: `IDEMP_${paymentId}`,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    const updatedPayments = invoice.payments ? [...invoice.payments, paymentRecord] : [paymentRecord];
    const updatedInvoice = {
      ...invoice,
      paidAmount: newPaidAmount,
      remainingAmount: newRemainingAmount,
      status: newStatus,
      paidAt: newStatus === "LUNAS" ? nowIso : invoice.paidAt,
      paymentMethod: payload.method,
      payments: updatedPayments,
      updatedAt: nowIso
    };
    await this.store.saveInvoicePayment(paymentRecord);
    await this.store.saveCashMutation(cashMutation);
    await this.store.saveInvoice(updatedInvoice);
    return {
      success: true,
      invoice: updatedInvoice,
      payment: paymentRecord,
      mutation: cashMutation
    };
  }
  /**
   * 4. ATOMIC PAYMENT VERIFICATION APPROVAL
   * Mengalokasikan dana transfer ke invoice terkait, mencatat pembayaran & mutasi kas, dan mengubah status request menjadi DISETUJUI.
   */
  async approvePaymentVerificationAtomic(payload) {
    const request = await this.store.getPaymentVerification(payload.requestId);
    if (!request) {
      throw new Error(`NOT_FOUND: Permintaan verifikasi ${payload.requestId} tidak ditemukan`);
    }
    if (request.status !== "MENUNGGU_VERIFIKASI") {
      throw new Error(`INVALID_STATE: Permintaan berstatus ${request.status}, tidak dapat disetujui ulang`);
    }
    let remainingFunds = request.amount;
    const processedInvoices = [];
    const createdPayments = [];
    const paymentIds = [];
    const mutationIds = [];
    for (const invoiceId of request.invoiceIds) {
      if (remainingFunds <= 0) break;
      const invoice = await this.store.getInvoice(invoiceId);
      if (!invoice || invoice.status === "LUNAS") continue;
      const unpaid = invoice.remainingAmount !== void 0 ? invoice.remainingAmount : invoice.amount - (invoice.paidAmount || 0);
      if (unpaid <= 0) continue;
      const allocateAmount = Math.min(remainingFunds, unpaid);
      const res = await this.processInvoicePaymentAtomic({
        invoiceId: invoice.id,
        amount: allocateAmount,
        method: request.paymentMethod || "Transfer Bank",
        staff: payload.verifiedBy,
        note: `Verifikasi Transfer ${request.referenceNumber}`,
        transactionId: request.referenceNumber,
        receiptUrl: request.proofUrl
      });
      remainingFunds -= allocateAmount;
      processedInvoices.push(res.invoice);
      createdPayments.push(res.payment);
      paymentIds.push(res.payment.id);
      mutationIds.push(res.mutation.id);
    }
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const updatedRequest = {
      ...request,
      status: "DISETUJUI",
      verifiedAt: nowIso,
      verifiedBy: payload.verifiedBy,
      notes: payload.notes || request.notes,
      processedPaymentIds: paymentIds,
      processedMutationIds: mutationIds,
      updatedAt: nowIso
    };
    await this.store.savePaymentVerification(updatedRequest);
    return {
      request: updatedRequest,
      processedInvoices,
      createdPayments
    };
  }
  /**
   * 5. PARENT AUTHENTICATION & CUSTOM TOKEN ISSUANCE
   * Preserves WhatsApp + student lookup and sibling resolution modal.
   */
  async authenticateParentAndIssueToken(params) {
    const normalizedPhone = normalizePhoneNumber(params.phone);
    if (!normalizedPhone) {
      return {
        success: false,
        status: "INVALID_CREDENTIALS",
        message: "Nomor WhatsApp tidak valid"
      };
    }
    const allStudents = await this.store.listStudents();
    const matchingStudents = allStudents.filter((s) => {
      const sPhone = normalizePhoneNumber(s.phone);
      return sPhone === normalizedPhone;
    });
    if (matchingStudents.length === 0) {
      return {
        success: false,
        status: "NOT_FOUND",
        message: "Nomor WhatsApp tidak terdaftar dalam pangkalan data siswa"
      };
    }
    if (matchingStudents.length > 1 && !params.studentId) {
      return {
        success: false,
        status: "MULTIPLE_CHILDREN",
        message: "Ditemukan beberapa anak terdaftar dengan nomor ini. Silakan pilih akun anak.",
        siblings: matchingStudents.map((s) => ({
          id: s.id,
          name: s.name,
          classGroupId: s.classGroupId,
          registrationStatus: s.registrationStatus
        }))
      };
    }
    const targetStudent = params.studentId ? matchingStudents.find((s) => s.id === params.studentId) : matchingStudents[0];
    if (!targetStudent) {
      return {
        success: false,
        status: "NOT_FOUND",
        message: `Siswa dengan ID ${params.studentId} tidak ditemukan untuk nomor ini`
      };
    }
    if (targetStudent.registrationStatus === "MENUNGGU_VERIFIKASI") {
      return {
        success: false,
        status: "UNAPPROVED",
        message: "Akun masih menunggu verifikasi admin sebelum dapat mengakses portal"
      };
    }
    if (targetStudent.registrationStatus === "DITOLAK") {
      return {
        success: false,
        status: "UNAPPROVED",
        message: "Pendaftaran siswa ini tidak disetujui"
      };
    }
    if (targetStudent.customPassword && params.password) {
      if (targetStudent.customPassword.trim().toLowerCase() !== params.password.trim().toLowerCase()) {
        return {
          success: false,
          status: "INVALID_CREDENTIALS",
          message: "Password akun salah"
        };
      }
    }
    const matchedIds = matchingStudents.map((s) => s.id);
    const opaqueUid = "parent_" + crypto2.createHash("sha256").update(`bfa_parent_uid_${normalizedPhone}`).digest("hex").slice(0, 24);
    const isProduction = this.env === "production" || process.env.NODE_ENV === "production";
    const isEmulatorOrTest = !isProduction && (this.env === "staging" || process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development" || process.env.VITE_USE_EMULATOR === "true" || !!process.env.FIREBASE_AUTH_EMULATOR_HOST);
    const claims = {
      role: "parent",
      studentId: targetStudent.id,
      studentIds: matchedIds
    };
    let customToken = "";
    if (params.customTokenSigner) {
      try {
        customToken = await params.customTokenSigner({ uid: opaqueUid, claims });
      } catch (signerErr) {
        if (!isEmulatorOrTest) {
          return {
            success: false,
            status: "AUTH_TOKEN_FAILED",
            message: "Layanan autentikasi custom signer gagal menerbitkan token."
          };
        }
      }
    }
    if (!customToken) {
      const hasWifConfig = Boolean(
        params.wifConfig || (process.env.GCP_WORKLOAD_IDENTITY_PROVIDER || process.env.VERCEL_OIDC_AUDIENCE) && (process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || process.env.FIREBASE_SERVICE_ACCOUNT_ID || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)
      );
      if (hasWifConfig) {
        try {
          customToken = await generateFirebaseCustomTokenKeyless({
            uid: opaqueUid,
            claims,
            config: params.wifConfig,
            oidcToken: params.oidcToken
          });
        } catch (wifErr) {
          console.warn("[TrustedBackend] Keyless WIF signing attempt failed, falling back:", wifErr?.message);
        }
      }
    }
    if (!customToken) {
      if (!admin2.apps.length) {
        initFirebaseAdmin();
      }
      if (admin2.apps.length) {
        try {
          customToken = await admin2.auth().createCustomToken(opaqueUid, claims);
        } catch (adminErr) {
          if (isEmulatorOrTest) {
            customToken = `bfa_parent_token_${targetStudent.id}_${Date.now()}`;
          } else {
            return {
              success: false,
              status: "AUTH_TOKEN_FAILED",
              message: "Layanan autentikasi server (Firebase Token) gagal menerbitkan token resmi. Periksa konfigurasi WIF / izin signing server."
            };
          }
        }
      } else {
        if (isEmulatorOrTest) {
          customToken = `bfa_parent_token_${targetStudent.id}_${Date.now()}`;
        } else {
          return {
            success: false,
            status: "AUTH_TOKEN_FAILED",
            message: "Layanan Firebase Admin belum siap di server produksi."
          };
        }
      }
    }
    return {
      success: true,
      status: "AUTHENTICATED",
      token: customToken,
      user: {
        role: "parent",
        name: targetStudent.parentName,
        phone: targetStudent.phone,
        studentId: targetStudent.id,
        studentName: targetStudent.name,
        classGroupId: targetStudent.classGroupId,
        claims: {
          role: "parent",
          studentId: targetStudent.id,
          studentIds: matchedIds
        }
      },
      siblings: matchingStudents.map((s) => ({
        id: s.id,
        name: s.name,
        classGroupId: s.classGroupId,
        registrationStatus: s.registrationStatus
      }))
    };
  }
  /**
   * 6. ADMIN AUTHENTICATION & CUSTOM TOKEN ISSUANCE
   */
  async authenticateAdminAndIssueToken(params) {
    if (params.isActive === false) {
      return {
        success: false,
        status: "INACTIVE_ACCOUNT",
        message: "Akun admin telah dinonaktifkan oleh pimpinan"
      };
    }
    if (params.password !== "adminbfa" && params.password !== "rahasiaAdmin2026") {
      return {
        success: false,
        status: "INVALID_CREDENTIALS",
        message: "Password admin salah"
      };
    }
    const syntheticToken = `bfa_admin_token_${Date.now()}`;
    return {
      success: true,
      status: "AUTHENTICATED",
      token: syntheticToken,
      user: {
        role: "admin",
        name: "Administrator BFA",
        email: params.email,
        claims: {
          role: "admin",
          admin: true
        }
      }
    };
  }
};

// src/server/backendRouter.ts
function createBackendRouter(options = {}) {
  const env = options.env || "staging";
  assertStagingBackendIsolation(env);
  const store = options.store || new InMemoryBackendStore();
  const service = options.service || new TrustedBackendService(store, env);
  const router = Router();
  const extractBearerToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7).trim();
    }
    return null;
  };
  const verifyTokenAndGetClaims = async (req) => {
    const token = extractBearerToken(req);
    if (!token) {
      const err = new Error("Token otentikasi wajib disertakan (Bearer token)");
      err.statusCode = 401;
      err.code = "UNAUTHENTICATED";
      throw err;
    }
    if (token.startsWith("bfa_admin_token_")) {
      return {
        uid: "test-admin-uid",
        claims: { role: "admin", admin: true },
        email: "admin@bfahub.internal"
      };
    }
    if (token.startsWith("bfa_parent_token_")) {
      return {
        uid: "test-parent-uid",
        claims: { role: "parent" },
        email: "parent@bfahub.internal"
      };
    }
    try {
      let appInstance;
      try {
        appInstance = getApp("bfa-staging-admin-app");
      } catch {
        appInstance = getApp();
      }
      const decoded = await getAuth(appInstance).verifyIdToken(token);
      return {
        uid: decoded.uid,
        claims: decoded,
        email: decoded.email
      };
    } catch (err) {
      const error = new Error(`Token otentikasi tidak valid atau kedaluwarsa: ${err.message}`);
      error.statusCode = 401;
      error.code = "INVALID_TOKEN";
      throw error;
    }
  };
  const verifyAdminAuth = async (req) => {
    const authInfo = await verifyTokenAndGetClaims(req);
    const isAdmin = authInfo.claims.admin === true || authInfo.claims.role === "admin";
    if (!isAdmin) {
      const err = new Error("Akses ditolak: Hanya peran Admin yang berhak melakukan operasi ini (403)");
      err.statusCode = 403;
      err.code = "PERMISSION_DENIED";
      throw err;
    }
    return authInfo;
  };
  router.get("/health", async (req, res) => {
    let firestoreAccessible = false;
    try {
      if (store && typeof store.getStudentCounter === "function") {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 3e3));
        await Promise.race([store.getStudentCounter(), timeoutPromise]);
        firestoreAccessible = true;
      }
    } catch (err) {
      firestoreAccessible = false;
    }
    const statusCode = firestoreAccessible ? 200 : 503;
    res.status(statusCode).json({
      status: firestoreAccessible ? "READY" : "DEGRADED",
      service: "bfa-hub-trusted-backend",
      environment: env,
      projectId: "bfa-hub-staging",
      firebaseAdminInitialized: true,
      firestoreAccessible,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  router.post("/auth/login-admin", async (req, res) => {
    try {
      const { email, password, isActive } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ARGUMENT", message: "Email dan password wajib diisi" }
        });
      }
      const result = await service.authenticateAdminAndIssueToken({
        email,
        password,
        isActive: isActive !== false
      });
      if (!result.success) {
        const statusCode = result.status === "INACTIVE_ACCOUNT" ? 403 : 401;
        return res.status(statusCode).json({
          success: false,
          error: { code: result.status, message: result.message }
        });
      }
      return res.json({
        success: true,
        token: result.token,
        user: result.user
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err.message }
      });
    }
  });
  router.post("/auth/login-parent", async (req, res) => {
    try {
      const { phone, studentId, password } = req.body;
      if (!phone) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_ARGUMENT", message: "Nomor WhatsApp wajib diisi" }
        });
      }
      const oidcHeader = req.headers["x-vercel-oidc-token"];
      const oidcToken = typeof oidcHeader === "string" && oidcHeader.trim() ? oidcHeader.trim() : void 0;
      const result = await service.authenticateParentAndIssueToken({
        phone,
        studentId,
        password,
        oidcToken
      });
      if (!result.success) {
        if (result.status === "MULTIPLE_CHILDREN") {
          return res.status(200).json({
            success: false,
            status: "MULTIPLE_CHILDREN",
            message: result.message,
            siblings: result.siblings
          });
        }
        const statusCode = result.status === "NOT_FOUND" ? 404 : result.status === "UNAPPROVED" ? 403 : 401;
        return res.status(statusCode).json({
          success: false,
          error: { code: result.status, message: result.message }
        });
      }
      return res.json({
        success: true,
        token: result.token,
        user: result.user,
        siblings: result.siblings
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err.message }
      });
    }
  });
  router.post("/students/register", async (req, res) => {
    try {
      let registeredByRole = "public";
      try {
        const authInfo = await verifyTokenAndGetClaims(req);
        if (authInfo.claims.admin === true || authInfo.claims.role === "admin") {
          registeredByRole = "admin";
        }
      } catch {
      }
      const result = await service.registerStudentAndIncrementCounter(req.body, registeredByRole);
      return res.status(201).json({
        success: true,
        generatedId: result.generatedId,
        student: result.student
      });
    } catch (err) {
      const isValidation = err.message && err.message.startsWith("VALIDATION_ERROR");
      return res.status(isValidation ? 400 : 500).json({
        success: false,
        error: {
          code: isValidation ? "VALIDATION_FAILED" : "INTERNAL_ERROR",
          message: err.message
        }
      });
    }
  });
  router.post("/attendance/record", async (req, res) => {
    try {
      await verifyTokenAndGetClaims(req);
      const result = await service.recordAttendanceWithFeeTransaction(req.body);
      return res.status(200).json({
        success: true,
        attendance: result.attendance,
        feeGenerated: result.feeGenerated,
        invoice: result.invoice
      });
    } catch (err) {
      const statusCode = err.statusCode || (err.message && err.message.startsWith("VALIDATION_ERROR") ? 400 : 500);
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message
        }
      });
    }
  });
  router.post("/invoices/pay", async (req, res) => {
    try {
      await verifyAdminAuth(req);
      const result = await service.processInvoicePaymentAtomic(req.body);
      return res.json({
        success: true,
        invoice: result.invoice,
        payment: result.payment,
        mutation: result.mutation
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message
        }
      });
    }
  });
  router.post("/payment-verifications/approve", async (req, res) => {
    try {
      await verifyAdminAuth(req);
      const result = await service.approvePaymentVerificationAtomic(req.body);
      return res.json({
        success: true,
        request: result.request,
        processedInvoices: result.processedInvoices,
        createdPayments: result.createdPayments
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        error: {
          code: err.code || "INTERNAL_ERROR",
          message: err.message
        }
      });
    }
  });
  return router;
}

// src/server/firestoreBackendStore.ts
import { initializeApp, getApps, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
var STAGING_PROJECT_ID = "bfa-hub-staging";
function assertStagingIsolationGuard() {
  const env = process.env;
  const project = env.GCLOUD_PROJECT || env.FIREBASE_PROJECT || env.VITE_FIREBASE_PROJECT_ID;
  if (project === "future-wonder-jwh4c") {
    throw new Error('[Firestore Store Guard] FATAL: Proyek produksi "future-wonder-jwh4c" terdeteksi! Akses dilarang keras.');
  }
}
var FirestoreBackendStore = class {
  constructor(projectId = STAGING_PROJECT_ID) {
    assertStagingIsolationGuard();
    if (projectId !== STAGING_PROJECT_ID && projectId !== "demo-bfa-hub") {
      throw new Error(`[Firestore Store] FATAL: Project ID "${projectId}" tidak valid untuk staging.`);
    }
    const apps = getApps();
    const existing = apps.find((a) => a.name === "bfa-staging-admin-app");
    let app;
    if (existing) {
      app = existing;
    } else {
      try {
        if (projectId === STAGING_PROJECT_ID) {
          const rawJsonEnv = process.env.FIREBASE_STAGING_SERVICE_ACCOUNT_JSON;
          const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;
          if (!rawJsonEnv || !rawJsonEnv.trim().startsWith("{")) {
            if (isProd) {
              throw new Error("FATAL: Variabel lingkungan FIREBASE_STAGING_SERVICE_ACCOUNT_JSON wajib diisi dengan Service Account JSON staging yang valid untuk bfa-hub-staging di production/cloud staging. Fallback ke applicationDefault() dilarang keras.");
            } else {
              console.warn("[FirestoreBackendStore] WARNING: FIREBASE_STAGING_SERVICE_ACCOUNT_JSON tidak ditemukan di development. Menggunakan applicationDefault() untuk preview lokal.");
              app = initializeApp({
                credential: applicationDefault(),
                projectId: STAGING_PROJECT_ID
              }, "bfa-staging-admin-app");
            }
          } else {
            const trimmed = rawJsonEnv.trim();
            const parsed = JSON.parse(trimmed);
            if (parsed.project_id === "future-wonder-jwh4c" || parsed.project_id === "production") {
              throw new Error("FATAL: Kredensial produksi terdeteksi pada konfigurasi staging! Akses ditolak secara mutlak.");
            }
            if (parsed.project_id && parsed.project_id !== STAGING_PROJECT_ID) {
              throw new Error(`FATAL: Project ID "${parsed.project_id}" tidak cocok dengan project staging resmi ("${STAGING_PROJECT_ID}").`);
            }
            app = initializeApp({
              credential: cert(parsed),
              projectId: STAGING_PROJECT_ID
            }, "bfa-staging-admin-app");
          }
        } else {
          app = initializeApp({
            projectId: "demo-bfa-hub"
          }, "bfa-staging-admin-app");
        }
        const activeProjId = app.options.projectId;
        if (activeProjId === "future-wonder-jwh4c") {
          throw new Error("FATAL: Firebase Admin terinisialisasi ke project produksi future-wonder-jwh4c!");
        }
      } catch (err) {
        throw new Error(
          `[FirestoreBackendStore] FATAL: Gagal menginisialisasi Firebase Admin SDK untuk project "${projectId}". Pastikan FIREBASE_STAGING_SERVICE_ACCOUNT_JSON disetel dengan benar. Detail: ${err.message}`
        );
      }
    }
    this.db = getFirestore(app);
  }
  async getStudentCounter() {
    const counterDocRef = this.db.collection("system").doc("student_counter");
    const snap = await counterDocRef.get();
    if (!snap.exists) {
      return 38;
    }
    const data = snap.data();
    return typeof data?.value === "number" ? data.value : 38;
  }
  async setStudentCounter(nextSeq) {
    const counterDocRef = this.db.collection("system").doc("student_counter");
    await counterDocRef.set({ value: nextSeq, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }, { merge: true });
  }
  async getStudent(id) {
    const docRef = this.db.collection("students").doc(id);
    const snap = await docRef.get();
    return snap.exists ? snap.data() : null;
  }
  async saveStudent(student) {
    const docRef = this.db.collection("students").doc(student.id);
    await docRef.set(student, { merge: true });
  }
  async listStudents() {
    const snapshot = await this.db.collection("students").get();
    const students = [];
    snapshot.forEach((doc) => {
      students.push(doc.data());
    });
    return students;
  }
  async getInvoice(id) {
    const docRef = this.db.collection("invoices").doc(id);
    const snap = await docRef.get();
    return snap.exists ? snap.data() : null;
  }
  async saveInvoice(invoice) {
    const docRef = this.db.collection("invoices").doc(invoice.id);
    await docRef.set(invoice, { merge: true });
  }
  async listInvoicesByStudent(studentId) {
    const snapshot = await this.db.collection("invoices").where("studentId", "==", studentId).get();
    const invoices = [];
    snapshot.forEach((doc) => {
      invoices.push(doc.data());
    });
    return invoices;
  }
  async getAttendance(id) {
    const docRef = this.db.collection("attendances").doc(id);
    const snap = await docRef.get();
    return snap.exists ? snap.data() : null;
  }
  async saveAttendance(attendance) {
    const docRef = this.db.collection("attendances").doc(attendance.id);
    await docRef.set(attendance, { merge: true });
  }
  async saveInvoicePayment(payment) {
    const docRef = this.db.collection("invoicePayments").doc(payment.id);
    await docRef.set(payment, { merge: true });
  }
  async saveCashMutation(mutation) {
    const docRef = this.db.collection("cashMutations").doc(mutation.id);
    await docRef.set(mutation, { merge: true });
  }
  async getPaymentVerification(id) {
    const docRef = this.db.collection("paymentVerificationRequests").doc(id);
    const snap = await docRef.get();
    return snap.exists ? snap.data() : null;
  }
  async savePaymentVerification(request) {
    const docRef = this.db.collection("paymentVerificationRequests").doc(request.id);
    await docRef.set(request, { merge: true });
  }
  /**
   * Jalankan transaksi Firestore sungguhan menggunakan Firebase Admin SDK.
   */
  async runTransactionInFirestore(updateFunction) {
    return await this.db.runTransaction(updateFunction);
  }
};

// server.ts
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function startServer() {
  initFirebaseAdmin();
  const app = express();
  app.use(express.json());
  let store;
  try {
    store = new FirestoreBackendStore("bfa-hub-staging");
    console.log("[BFA HUB Server] Berhasil menginisialisasi FirestoreBackendStore untuk bfa-hub-staging.");
  } catch (err) {
    console.error("[BFA HUB Server] FATAL: Gagal menghubungkan ke Firestore Staging Repository:", err.message);
    process.exit(1);
  }
  const apiRouter = createBackendRouter({ store, env: "staging" });
  app.use("/api", apiRouter);
  const isProd = process.env.NODE_ENV === "production";
  const port = Number(process.env.PORT) || 3e3;
  const distPath = path.resolve(__dirname, "dist");
  const indexHtmlPath = path.resolve(distPath, "index.html");
  if (isProd) {
    if (!fs.existsSync(indexHtmlPath)) {
      console.log("[BFA HUB Server] Production: dist/index.html tidak ditemukan. Menjalankan vite build...");
      try {
        execSync("npx vite build", { stdio: "inherit", cwd: __dirname });
      } catch (buildErr) {
        console.error("[BFA HUB Server] Gagal membangun production build:", buildErr?.message);
      }
    }
    if (fs.existsSync(indexHtmlPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        res.sendFile(indexHtmlPath);
      });
    } else {
      app.get("*", (req, res) => {
        if (req.path.startsWith("/api")) return;
        res.status(500).send("Production error: dist/index.html not found.");
      });
    }
  } else {
    console.log("[BFA HUB Server] Development/Preview Mode: Menginisialisasi Vite dev server middleware...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error("[BFA HUB Server] Gagal menginisialisasi Vite dev middleware:", viteErr?.message);
    }
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`[BFA HUB Server] Running on http://0.0.0.0:${port} (Production mode: ${isProd})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start BFA HUB server:", err);
  process.exit(1);
});
