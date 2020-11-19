'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.
























































































































































































































































































































































































































































































































































































































































































































































































recursivePatternCapture = recursivePatternCapture;var _fs = require('fs');var _fs2 = _interopRequireDefault(_fs);var _doctrine = require('doctrine');var _doctrine2 = _interopRequireDefault(_doctrine);var _debug = require('debug');var _debug2 = _interopRequireDefault(_debug);var _eslint = require('eslint');var _parse = require('eslint-module-utils/parse');var _parse2 = _interopRequireDefault(_parse);var _resolve = require('eslint-module-utils/resolve');var _resolve2 = _interopRequireDefault(_resolve);var _ignore = require('eslint-module-utils/ignore');var _ignore2 = _interopRequireDefault(_ignore);var _hash = require('eslint-module-utils/hash');var _unambiguous = require('eslint-module-utils/unambiguous');var unambiguous = _interopRequireWildcard(_unambiguous);var _tsconfigLoader = require('tsconfig-paths/lib/tsconfig-loader');var _arrayIncludes = require('array-includes');var _arrayIncludes2 = _interopRequireDefault(_arrayIncludes);function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}let parseConfigFileTextToJson;const log = (0, _debug2.default)('eslint-plugin-import:ExportMap');const exportCache = new Map();class ExportMap {constructor(path) {this.path = path;this.namespace = new Map(); // todo: restructure to key on path, value is resolver + map of names
    this.reexports = new Map(); /**
                                 * star-exports
                                 * @type {Set} of () => ExportMap
                                 */this.dependencies = new Set(); /**
                                                                   * dependencies of this module that are not explicitly re-exported
                                                                   * @type {Map} from path = () => ExportMap
                                                                   */this.imports = new Map();this.errors = [];}get hasDefault() {return this.get('default') != null;} // stronger than this.has
  get size() {let size = this.namespace.size + this.reexports.size;this.dependencies.forEach(dep => {const d = dep(); // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;size += d.size;});return size;} /**
                                                             * Note that this does not check explicitly re-exported names for existence
                                                             * in the base namespace, but it will expand all `export * from '...'` exports
                                                             * if not found in the explicit namespace.
                                                             * @param  {string}  name
                                                             * @return {Boolean} true if `name` is exported by this module.
                                                             */has(name) {if (this.namespace.has(name)) return true;if (this.reexports.has(name)) return true; // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (let dep of this.dependencies) {let innerMap = dep(); // todo: report as unresolved?
        if (!innerMap) continue;if (innerMap.has(name)) return true;}}return false;} /**
                                                                                      * ensure that imported name fully resolves.
                                                                                      * @param  {[type]}  name [description]
                                                                                      * @return {Boolean}      [description]
                                                                                      */hasDeep(name) {if (this.namespace.has(name)) return { found: true, path: [this] };if (this.reexports.has(name)) {const reexports = this.reexports.get(name),imported = reexports.getImport(); // if import is ignored, return explicit 'null'
      if (imported == null) return { found: true, path: [this] // safeguard against cycles, only if name matches
      };if (imported.path === this.path && reexports.local === name) {return { found: false, path: [this] };}const deep = imported.hasDeep(reexports.local);deep.path.unshift(this);return deep;} // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (let dep of this.dependencies) {let innerMap = dep();if (innerMap == null) return { found: true, path: [this] // todo: report as unresolved?
        };if (!innerMap) continue; // safeguard against cycles
        if (innerMap.path === this.path) continue;let innerValue = innerMap.hasDeep(name);if (innerValue.found) {innerValue.path.unshift(this);return innerValue;}}}return { found: false, path: [this] };}get(name) {if (this.namespace.has(name)) return this.namespace.get(name);if (this.reexports.has(name)) {const reexports = this.reexports.get(name),imported = reexports.getImport(); // if import is ignored, return explicit 'null'
      if (imported == null) return null; // safeguard against cycles, only if name matches
      if (imported.path === this.path && reexports.local === name) return undefined;return imported.get(reexports.local);} // default exports must be explicitly re-exported (#328)
    if (name !== 'default') {for (let dep of this.dependencies) {let innerMap = dep(); // todo: report as unresolved?
        if (!innerMap) continue; // safeguard against cycles
        if (innerMap.path === this.path) continue;let innerValue = innerMap.get(name);if (innerValue !== undefined) return innerValue;}}return undefined;}forEach(callback, thisArg) {this.namespace.forEach((v, n) => callback.call(thisArg, v, n, this));this.reexports.forEach((reexports, name) => {const reexported = reexports.getImport(); // can't look up meta for ignored re-exports (#348)
      callback.call(thisArg, reexported && reexported.get(reexports.local), name, this);});this.dependencies.forEach(dep => {const d = dep(); // CJS / ignored dependencies won't exist (#717)
      if (d == null) return;d.forEach((v, n) => n !== 'default' && callback.call(thisArg, v, n, this));});} // todo: keys, values, entries?
  reportErrors(context, declaration) {context.report({ node: declaration.source, message: `Parse errors in imported module '${declaration.source.value}': ` + `${this.errors.map(e => `${e.message} (${e.lineNumber}:${e.column})`).join(', ')}` });}}exports.default = ExportMap; /**
                                                                                                                                                                                                                                                                                    * parse docs from the first node that has leading comments
                                                                                                                                                                                                                                                                                    */function captureDoc(source, docStyleParsers) {const metadata = {}; // 'some' short-circuits on first 'true'
  for (var _len = arguments.length, nodes = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {nodes[_key - 2] = arguments[_key];}nodes.some(n => {try {let leadingComments; // n.leadingComments is legacy `attachComments` behavior
      if ('leadingComments' in n) {leadingComments = n.leadingComments;} else if (n.range) {leadingComments = source.getCommentsBefore(n);}if (!leadingComments || leadingComments.length === 0) return false;for (let name in docStyleParsers) {const doc = docStyleParsers[name](leadingComments);if (doc) {metadata.doc = doc;}}return true;} catch (err) {return false;}});return metadata;}const availableDocStyleParsers = { jsdoc: captureJsDoc, tomdoc: captureTomDoc /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                               * parse JSDoc from leading comments
                                                                                                                                                                                                                                                                                                                                                                                                                                                                               * @param  {...[type]} comments [description]
                                                                                                                                                                                                                                                                                                                                                                                                                                                                               * @return {{doc: object}}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */ };function captureJsDoc(comments) {let doc; // capture XSDoc
  comments.forEach(comment => {// skip non-block comments
    if (comment.type !== 'Block') return;try {doc = _doctrine2.default.parse(comment.value, { unwrap: true });} catch (err) {/* don't care, for now? maybe add to `errors?` */}});return doc;} /**
                                                                                                                                                                                                 * parse TomDoc section from comments
                                                                                                                                                                                                 */function captureTomDoc(comments) {// collect lines up to first paragraph break
  const lines = [];for (let i = 0; i < comments.length; i++) {const comment = comments[i];if (comment.value.match(/^\s*$/)) break;lines.push(comment.value.trim());} // return doctrine-like object
  const statusMatch = lines.join(' ').match(/^(Public|Internal|Deprecated):\s*(.+)/);if (statusMatch) {return { description: statusMatch[2], tags: [{ title: statusMatch[1].toLowerCase(), description: statusMatch[2] }] };}}ExportMap.get = function (source, context, options) {const path = (0, _resolve2.default)(source, context);if (path == null) return null;return ExportMap.for(childContext(path, context), options);};ExportMap.for = function (context) {let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};const path = context.path;const cacheKey = (0, _hash.hashObject)(context).digest('hex');let exportMap = exportCache.get(cacheKey); // return cached ignore
  if (exportMap === null) return null;const stats = _fs2.default.statSync(path);if (exportMap != null) {// date equality check
    if (exportMap.mtime - stats.mtime === 0) {return exportMap;} // future: check content equality?
  } // check valid extensions first
  if (!(0, _ignore.hasValidExtension)(path, context)) {exportCache.set(cacheKey, null);return null;} // check for and cache ignore
  if ((0, _ignore2.default)(path, context)) {log('ignored path due to ignore settings:', path);exportCache.set(cacheKey, null);return null;}const content = _fs2.default.readFileSync(path, { encoding: 'utf8' }); // check for and cache unambiguous modules
  if (!options.useCommonjsExports && !unambiguous.test(content)) {log('ignored path due to unambiguous regex:', path);exportCache.set(cacheKey, null);return null;}log('cache miss', cacheKey, 'for path', path);exportMap = ExportMap.parse(path, content, context, options); // ambiguous modules return null
  if (exportMap == null) return null;exportMap.mtime = stats.mtime;exportCache.set(cacheKey, exportMap);return exportMap;};ExportMap.parse = function (path, content, context) {let options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};log('using commonjs exports:', options.useCommonjsExports);var m = new ExportMap(path);try {var ast = (0, _parse2.default)(path, content, context);} catch (err) {log('parse error:', path, err);m.errors.push(err);return m; // can't continue
  }if (!options.useCommonjsExports && !unambiguous.isModule(ast)) return null;const docstyle = context.settings && context.settings['import/docstyle'] || ['jsdoc'];const docStyleParsers = {};docstyle.forEach(style => {docStyleParsers[style] = availableDocStyleParsers[style];}); // attempt to collect module doc
  if (ast.comments) {ast.comments.some(c => {if (c.type !== 'Block') return false;try {const doc = _doctrine2.default.parse(c.value, { unwrap: true });if (doc.tags.some(t => t.title === 'module')) {m.doc = doc;return true;}} catch (err) {/* ignore */}return false;});}const namespaces = new Map();function remotePath(value) {return _resolve2.default.relative(value, path, context.settings);}function resolveImport(value) {const rp = remotePath(value);if (rp == null) return null;return ExportMap.for(childContext(rp, context), options);}function getNamespace(identifier) {if (!namespaces.has(identifier.name)) return;return function () {return resolveImport(namespaces.get(identifier.name));};}function addNamespace(object, identifier) {const nsfn = getNamespace(identifier);if (nsfn) {Object.defineProperty(object, 'namespace', { get: nsfn });}return object;}function captureDependency(declaration) {if (declaration.source == null) return null;if (declaration.importKind === 'type') return null; // skip Flow type imports
    const importedSpecifiers = new Set();const supportedTypes = new Set(['ImportDefaultSpecifier', 'ImportNamespaceSpecifier']);let hasImportedType = false;if (declaration.specifiers) {declaration.specifiers.forEach(specifier => {const isType = specifier.importKind === 'type';hasImportedType = hasImportedType || isType;if (supportedTypes.has(specifier.type) && !isType) {importedSpecifiers.add(specifier.type);}if (specifier.type === 'ImportSpecifier' && !isType) {importedSpecifiers.add(specifier.imported.name);}});} // only Flow types were imported
    if (hasImportedType && importedSpecifiers.size === 0) return null;const p = remotePath(declaration.source.value);if (p == null) return null;const existing = m.imports.get(p);if (existing != null) return existing.getter;const getter = thunkFor(p, context, options);m.imports.set(p, { getter, source: { // capturing actual node reference holds full AST in memory!
        value: declaration.source.value, loc: declaration.source.loc }, importedSpecifiers });return getter;}const source = makeSourceCode(content, ast);function isEsModuleInterop() {const tsConfigInfo = (0, _tsconfigLoader.tsConfigLoader)({ cwd: context.parserOptions && context.parserOptions.tsconfigRootDir || process.cwd(), getEnv: key => process.env[key] });try {if (tsConfigInfo.tsConfigPath !== undefined) {const jsonText = _fs2.default.readFileSync(tsConfigInfo.tsConfigPath).toString();if (!parseConfigFileTextToJson) {var _require = require('typescript'); // this is because projects not using TypeScript won't have typescript installed
          parseConfigFileTextToJson = _require.parseConfigFileTextToJson;}const tsConfig = parseConfigFileTextToJson(tsConfigInfo.tsConfigPath, jsonText).config;return tsConfig.compilerOptions.esModuleInterop;}} catch (e) {return false;}} // for saving all commonjs exports
  let moduleExports = {}; // for if module exports has been declared directly (exports/module.exports = ...)
  let moduleExportsMain = null;function parseModuleExportsObjectExpression(node) {moduleExportsMain = true;moduleExports = {};node.properties.forEach(function (property) {const keyType = property.key.type;if (keyType === 'Identifier') {const keyName = property.key.name;moduleExports[keyName] = property.value;} else if (keyType === 'Literal') {const keyName = property.key.value;moduleExports[keyName] = property.value;}});}function handleModuleExports() {let isEsModule = false;const esModule = moduleExports.__esModule;if (esModule && esModule.type === 'Literal' && esModule.value) {// for interopRequireDefault calls
    }Object.getOwnPropertyNames(moduleExports).forEach(function (propertyName) {m.namespace.set(propertyName);});if (!isEsModule && moduleExportsMain && !options.noInterop) {// recognizes default for import statements
      m.namespace.set('default');}}ast.body.forEach(function (n) {if (options.useCommonjsExports) {if (n.type === 'ExpressionStatement') {if (n.expression.type === 'AssignmentExpression') {const left = n.expression.left;const right = n.expression.right; // exports/module.exports = ...
          if (isCommonjsExportsObject(left)) {moduleExportsMain = true; // exports/module.exports = {...}
            if (right.type === 'ObjectExpression') {parseModuleExportsObjectExpression(right);}} else if (left.type === 'MemberExpression' && isCommonjsExportsObject(left.object)) {// (exports/module.exports).<name> = ...
            if (left.property.type === 'Identifier') {const keyName = left.property.name;moduleExports[keyName] = right;} // (exports/module.exports).["<name>"] = ...
            else if (left.property.type === 'Literal') {const keyName = left.property.value;moduleExports[keyName] = right;}} else return;} // Object.defineProperty((exports/module.exports), <name>, {value: <value>})
        else if (n.expression.type === 'CallExpression') {const call = n.expression;const callee = call.callee;if (callee.type !== 'MemberExpression') return;if (callee.object.type !== 'Identifier' || callee.object.name !== 'Object') return;if (callee.property.type !== 'Identifier' || callee.property.name !== 'defineProperty') return;if (call.arguments.length !== 3) return;if (!isCommonjsExportsObject(call.arguments[0])) return;if (call.arguments[1].type !== 'Literal') return;if (call.arguments[2].type !== 'ObjectExpression') return;call.arguments[2].properties.forEach(function (defineProperty) {if (defineProperty.type !== 'Property') return;if (defineProperty.key.type === 'Literal' && defineProperty.key.value === 'value') {// {'value': <value>}
                Object.defineProperty(moduleExports, call.arguments[1].value, defineProperty.value);} else if (defineProperty.key.type === 'Identifier' && defineProperty.key.name === 'value') {// {value: <value>}
                Object.defineProperty(moduleExports, call.arguments[1].value, defineProperty.value);}});}}}if (n.type === 'ExportDefaultDeclaration') {const exportMeta = captureDoc(source, docStyleParsers, n);if (n.declaration.type === 'Identifier') {addNamespace(exportMeta, n.declaration);}m.namespace.set('default', exportMeta);return;}if (n.type === 'ExportAllDeclaration') {const getter = captureDependency(n);if (getter) m.dependencies.add(getter);return;} // capture namespaces in case of later export
    if (n.type === 'ImportDeclaration') {captureDependency(n);let ns;if (n.specifiers.some(s => s.type === 'ImportNamespaceSpecifier' && (ns = s))) {namespaces.set(ns.local.name, n.source.value);}return;}if (n.type === 'ExportNamedDeclaration') {// capture declaration
      if (n.declaration != null) {switch (n.declaration.type) {case 'FunctionDeclaration':case 'ClassDeclaration':case 'TypeAlias': // flowtype with babel-eslint parser
          case 'InterfaceDeclaration':case 'DeclareFunction':case 'TSDeclareFunction':case 'TSEnumDeclaration':case 'TSTypeAliasDeclaration':case 'TSInterfaceDeclaration':case 'TSAbstractClassDeclaration':case 'TSModuleDeclaration':m.namespace.set(n.declaration.id.name, captureDoc(source, docStyleParsers, n));break;case 'VariableDeclaration':n.declaration.declarations.forEach(d => recursivePatternCapture(d.id, id => m.namespace.set(id.name, captureDoc(source, docStyleParsers, d, n))));break;}}const nsource = n.source && n.source.value;n.specifiers.forEach(s => {const exportMeta = {};let local;switch (s.type) {case 'ExportDefaultSpecifier':if (!n.source) return;local = 'default';break;case 'ExportNamespaceSpecifier':m.namespace.set(s.exported.name, Object.defineProperty(exportMeta, 'namespace', { get() {return resolveImport(nsource);} }));return;case 'ExportSpecifier':if (!n.source) {m.namespace.set(s.exported.name, addNamespace(exportMeta, s.local));return;} // else falls through
          default:local = s.local.name;break;} // todo: JSDoc
        m.reexports.set(s.exported.name, { local, getImport: () => resolveImport(nsource) });});}const isEsModuleInteropTrue = isEsModuleInterop();const exports = ['TSExportAssignment'];if (isEsModuleInteropTrue) {exports.push('TSNamespaceExportDeclaration');} // This doesn't declare anything, but changes what's being exported.
    if ((0, _arrayIncludes2.default)(exports, n.type)) {const exportedName = n.type === 'TSNamespaceExportDeclaration' ? n.id.name : n.expression && n.expression.name || n.expression.id && n.expression.id.name || null;const declTypes = ['VariableDeclaration', 'ClassDeclaration', 'TSDeclareFunction', 'TSEnumDeclaration', 'TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'TSAbstractClassDeclaration', 'TSModuleDeclaration'];const exportedDecls = ast.body.filter((_ref) => {let type = _ref.type,id = _ref.id,declarations = _ref.declarations;return (0, _arrayIncludes2.default)(declTypes, type) && (id && id.name === exportedName || declarations && declarations.find(d => d.id.name === exportedName));});if (exportedDecls.length === 0) {// Export is not referencing any local declaration, must be re-exporting
        m.namespace.set('default', captureDoc(source, docStyleParsers, n));return;}if (isEsModuleInteropTrue) {m.namespace.set('default', {});}exportedDecls.forEach(decl => {if (decl.type === 'TSModuleDeclaration') {if (decl.body && decl.body.type === 'TSModuleDeclaration') {m.namespace.set(decl.body.id.name, captureDoc(source, docStyleParsers, decl.body));} else if (decl.body && decl.body.body) {decl.body.body.forEach(moduleBlockNode => {// Export-assignment exports all members in the namespace,
              // explicitly exported or not.
              const namespaceDecl = moduleBlockNode.type === 'ExportNamedDeclaration' ? moduleBlockNode.declaration : moduleBlockNode;if (!namespaceDecl) {// TypeScript can check this for us; we needn't
              } else if (namespaceDecl.type === 'VariableDeclaration') {namespaceDecl.declarations.forEach(d => recursivePatternCapture(d.id, id => m.namespace.set(id.name, captureDoc(source, docStyleParsers, decl, namespaceDecl, moduleBlockNode))));} else {m.namespace.set(namespaceDecl.id.name, captureDoc(source, docStyleParsers, moduleBlockNode));}});}} else {// Export as default
          m.namespace.set('default', captureDoc(source, docStyleParsers, decl));}});}});if (options.useCommonjsExports) handleModuleExports();return m;}; /**
                                                                                                                                                           * The creation of this closure is isolated from other scopes
                                                                                                                                                           * to avoid over-retention of unrelated variables, which has
                                                                                                                                                           * caused memory leaks. See #1266.
                                                                                                                                                           */function thunkFor(p, context, options) {return () => ExportMap.for(childContext(p, context), options);} /**
                                                                                                                                                                                                                                                                      * Traverse a pattern/identifier node, calling 'callback'
                                                                                                                                                                                                                                                                      * for each leaf identifier.
                                                                                                                                                                                                                                                                      * @param  {node}   pattern
                                                                                                                                                                                                                                                                      * @param  {Function} callback
                                                                                                                                                                                                                                                                      * @return {void}
                                                                                                                                                                                                                                                                      */function recursivePatternCapture(pattern, callback) {switch (pattern.type) {case 'Identifier': // base case
      callback(pattern);break;case 'ObjectPattern':pattern.properties.forEach(p => {if (p.type === 'ExperimentalRestProperty' || p.type === 'RestElement') {callback(p.argument);return;}recursivePatternCapture(p.value, callback);});break;case 'ArrayPattern':pattern.elements.forEach(element => {if (element == null) return;if (element.type === 'ExperimentalRestProperty' || element.type === 'RestElement') {callback(element.argument);return;}recursivePatternCapture(element, callback);});break;case 'AssignmentPattern':callback(pattern.left);break;}} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       * don't hold full context object in memory, just grab what we need.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       */function childContext(path, context) {const settings = context.settings,parserOptions = context.parserOptions,parserPath = context.parserPath;return { settings, parserOptions, parserPath, path };} /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               * sometimes legacy support isn't _that_ hard... right?
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               */function makeSourceCode(text, ast) {if (_eslint.SourceCode.length > 1) {// ESLint 3
    return new _eslint.SourceCode(text, ast);} else {// ESLint 4, 5
    return new _eslint.SourceCode({ text, ast });}} /**
                                                     * Check if a given node is exports, module.exports, or module['exports']
                                                     * @param {node} node
                                                     * @return {boolean}
                                                     */function isCommonjsExportsObject(node) {// exports
  if (node.type === 'Identifier' && node.name === 'exports') return true;if (node.type !== 'MemberExpression') return false;if (node.object.type === 'Identifier' && node.object.name === 'module') {// module.exports
    if (node.property.type === 'Identifier' && node.property.name === 'exports') return true; // module['exports']
    if (node.property.type === 'Literal' && node.property.value === 'exports') return true;}return false;}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9FeHBvcnRNYXAuanMiXSwibmFtZXMiOlsicmVjdXJzaXZlUGF0dGVybkNhcHR1cmUiLCJ1bmFtYmlndW91cyIsInBhcnNlQ29uZmlnRmlsZVRleHRUb0pzb24iLCJsb2ciLCJleHBvcnRDYWNoZSIsIk1hcCIsIkV4cG9ydE1hcCIsImNvbnN0cnVjdG9yIiwicGF0aCIsIm5hbWVzcGFjZSIsInJlZXhwb3J0cyIsImRlcGVuZGVuY2llcyIsIlNldCIsImltcG9ydHMiLCJlcnJvcnMiLCJoYXNEZWZhdWx0IiwiZ2V0Iiwic2l6ZSIsImZvckVhY2giLCJkZXAiLCJkIiwiaGFzIiwibmFtZSIsImlubmVyTWFwIiwiaGFzRGVlcCIsImZvdW5kIiwiaW1wb3J0ZWQiLCJnZXRJbXBvcnQiLCJsb2NhbCIsImRlZXAiLCJ1bnNoaWZ0IiwiaW5uZXJWYWx1ZSIsInVuZGVmaW5lZCIsImNhbGxiYWNrIiwidGhpc0FyZyIsInYiLCJuIiwiY2FsbCIsInJlZXhwb3J0ZWQiLCJyZXBvcnRFcnJvcnMiLCJjb250ZXh0IiwiZGVjbGFyYXRpb24iLCJyZXBvcnQiLCJub2RlIiwic291cmNlIiwibWVzc2FnZSIsInZhbHVlIiwibWFwIiwiZSIsImxpbmVOdW1iZXIiLCJjb2x1bW4iLCJqb2luIiwiY2FwdHVyZURvYyIsImRvY1N0eWxlUGFyc2VycyIsIm1ldGFkYXRhIiwibm9kZXMiLCJzb21lIiwibGVhZGluZ0NvbW1lbnRzIiwicmFuZ2UiLCJnZXRDb21tZW50c0JlZm9yZSIsImxlbmd0aCIsImRvYyIsImVyciIsImF2YWlsYWJsZURvY1N0eWxlUGFyc2VycyIsImpzZG9jIiwiY2FwdHVyZUpzRG9jIiwidG9tZG9jIiwiY2FwdHVyZVRvbURvYyIsImNvbW1lbnRzIiwiY29tbWVudCIsInR5cGUiLCJkb2N0cmluZSIsInBhcnNlIiwidW53cmFwIiwibGluZXMiLCJpIiwibWF0Y2giLCJwdXNoIiwidHJpbSIsInN0YXR1c01hdGNoIiwiZGVzY3JpcHRpb24iLCJ0YWdzIiwidGl0bGUiLCJ0b0xvd2VyQ2FzZSIsIm9wdGlvbnMiLCJmb3IiLCJjaGlsZENvbnRleHQiLCJjYWNoZUtleSIsImRpZ2VzdCIsImV4cG9ydE1hcCIsInN0YXRzIiwiZnMiLCJzdGF0U3luYyIsIm10aW1lIiwic2V0IiwiY29udGVudCIsInJlYWRGaWxlU3luYyIsImVuY29kaW5nIiwidXNlQ29tbW9uanNFeHBvcnRzIiwidGVzdCIsIm0iLCJhc3QiLCJpc01vZHVsZSIsImRvY3N0eWxlIiwic2V0dGluZ3MiLCJzdHlsZSIsImMiLCJ0IiwibmFtZXNwYWNlcyIsInJlbW90ZVBhdGgiLCJyZXNvbHZlIiwicmVsYXRpdmUiLCJyZXNvbHZlSW1wb3J0IiwicnAiLCJnZXROYW1lc3BhY2UiLCJpZGVudGlmaWVyIiwiYWRkTmFtZXNwYWNlIiwib2JqZWN0IiwibnNmbiIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiY2FwdHVyZURlcGVuZGVuY3kiLCJpbXBvcnRLaW5kIiwiaW1wb3J0ZWRTcGVjaWZpZXJzIiwic3VwcG9ydGVkVHlwZXMiLCJoYXNJbXBvcnRlZFR5cGUiLCJzcGVjaWZpZXJzIiwic3BlY2lmaWVyIiwiaXNUeXBlIiwiYWRkIiwicCIsImV4aXN0aW5nIiwiZ2V0dGVyIiwidGh1bmtGb3IiLCJsb2MiLCJtYWtlU291cmNlQ29kZSIsImlzRXNNb2R1bGVJbnRlcm9wIiwidHNDb25maWdJbmZvIiwiY3dkIiwicGFyc2VyT3B0aW9ucyIsInRzY29uZmlnUm9vdERpciIsInByb2Nlc3MiLCJnZXRFbnYiLCJrZXkiLCJlbnYiLCJ0c0NvbmZpZ1BhdGgiLCJqc29uVGV4dCIsInRvU3RyaW5nIiwicmVxdWlyZSIsInRzQ29uZmlnIiwiY29uZmlnIiwiY29tcGlsZXJPcHRpb25zIiwiZXNNb2R1bGVJbnRlcm9wIiwibW9kdWxlRXhwb3J0cyIsIm1vZHVsZUV4cG9ydHNNYWluIiwicGFyc2VNb2R1bGVFeHBvcnRzT2JqZWN0RXhwcmVzc2lvbiIsInByb3BlcnRpZXMiLCJwcm9wZXJ0eSIsImtleVR5cGUiLCJrZXlOYW1lIiwiaGFuZGxlTW9kdWxlRXhwb3J0cyIsImlzRXNNb2R1bGUiLCJlc01vZHVsZSIsIl9fZXNNb2R1bGUiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwicHJvcGVydHlOYW1lIiwibm9JbnRlcm9wIiwiYm9keSIsImV4cHJlc3Npb24iLCJsZWZ0IiwicmlnaHQiLCJpc0NvbW1vbmpzRXhwb3J0c09iamVjdCIsImNhbGxlZSIsImFyZ3VtZW50cyIsImV4cG9ydE1ldGEiLCJucyIsInMiLCJpZCIsImRlY2xhcmF0aW9ucyIsIm5zb3VyY2UiLCJleHBvcnRlZCIsImlzRXNNb2R1bGVJbnRlcm9wVHJ1ZSIsImV4cG9ydHMiLCJleHBvcnRlZE5hbWUiLCJkZWNsVHlwZXMiLCJleHBvcnRlZERlY2xzIiwiZmlsdGVyIiwiZmluZCIsImRlY2wiLCJtb2R1bGVCbG9ja05vZGUiLCJuYW1lc3BhY2VEZWNsIiwicGF0dGVybiIsImFyZ3VtZW50IiwiZWxlbWVudHMiLCJlbGVtZW50IiwicGFyc2VyUGF0aCIsInRleHQiLCJTb3VyY2VDb2RlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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WyJpbXBvcnQgZnMgZnJvbSAnZnMnXG5cbmltcG9ydCBkb2N0cmluZSBmcm9tICdkb2N0cmluZSdcblxuaW1wb3J0IGRlYnVnIGZyb20gJ2RlYnVnJ1xuXG5pbXBvcnQgeyBTb3VyY2VDb2RlIH0gZnJvbSAnZXNsaW50J1xuXG5pbXBvcnQgcGFyc2UgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9wYXJzZSdcbmltcG9ydCByZXNvbHZlIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvcmVzb2x2ZSdcbmltcG9ydCBpc0lnbm9yZWQsIHsgaGFzVmFsaWRFeHRlbnNpb24gfSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL2lnbm9yZSdcblxuaW1wb3J0IHsgaGFzaE9iamVjdCB9IGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvaGFzaCdcbmltcG9ydCAqIGFzIHVuYW1iaWd1b3VzIGZyb20gJ2VzbGludC1tb2R1bGUtdXRpbHMvdW5hbWJpZ3VvdXMnXG5cbmltcG9ydCB7IHRzQ29uZmlnTG9hZGVyIH0gZnJvbSAndHNjb25maWctcGF0aHMvbGliL3RzY29uZmlnLWxvYWRlcidcblxuaW1wb3J0IGluY2x1ZGVzIGZyb20gJ2FycmF5LWluY2x1ZGVzJ1xuXG5sZXQgcGFyc2VDb25maWdGaWxlVGV4dFRvSnNvblxuXG5jb25zdCBsb2cgPSBkZWJ1ZygnZXNsaW50LXBsdWdpbi1pbXBvcnQ6RXhwb3J0TWFwJylcblxuY29uc3QgZXhwb3J0Q2FjaGUgPSBuZXcgTWFwKClcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRXhwb3J0TWFwIHtcbiAgY29uc3RydWN0b3IocGF0aCkge1xuICAgIHRoaXMucGF0aCA9IHBhdGhcbiAgICB0aGlzLm5hbWVzcGFjZSA9IG5ldyBNYXAoKVxuICAgIC8vIHRvZG86IHJlc3RydWN0dXJlIHRvIGtleSBvbiBwYXRoLCB2YWx1ZSBpcyByZXNvbHZlciArIG1hcCBvZiBuYW1lc1xuICAgIHRoaXMucmVleHBvcnRzID0gbmV3IE1hcCgpXG4gICAgLyoqXG4gICAgICogc3Rhci1leHBvcnRzXG4gICAgICogQHR5cGUge1NldH0gb2YgKCkgPT4gRXhwb3J0TWFwXG4gICAgICovXG4gICAgdGhpcy5kZXBlbmRlbmNpZXMgPSBuZXcgU2V0KClcbiAgICAvKipcbiAgICAgKiBkZXBlbmRlbmNpZXMgb2YgdGhpcyBtb2R1bGUgdGhhdCBhcmUgbm90IGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWRcbiAgICAgKiBAdHlwZSB7TWFwfSBmcm9tIHBhdGggPSAoKSA9PiBFeHBvcnRNYXBcbiAgICAgKi9cbiAgICB0aGlzLmltcG9ydHMgPSBuZXcgTWFwKClcbiAgICB0aGlzLmVycm9ycyA9IFtdXG4gIH1cblxuICBnZXQgaGFzRGVmYXVsdCgpIHsgcmV0dXJuIHRoaXMuZ2V0KCdkZWZhdWx0JykgIT0gbnVsbCB9IC8vIHN0cm9uZ2VyIHRoYW4gdGhpcy5oYXNcblxuICBnZXQgc2l6ZSgpIHtcbiAgICBsZXQgc2l6ZSA9IHRoaXMubmFtZXNwYWNlLnNpemUgKyB0aGlzLnJlZXhwb3J0cy5zaXplXG4gICAgdGhpcy5kZXBlbmRlbmNpZXMuZm9yRWFjaChkZXAgPT4ge1xuICAgICAgY29uc3QgZCA9IGRlcCgpXG4gICAgICAvLyBDSlMgLyBpZ25vcmVkIGRlcGVuZGVuY2llcyB3b24ndCBleGlzdCAoIzcxNylcbiAgICAgIGlmIChkID09IG51bGwpIHJldHVyblxuICAgICAgc2l6ZSArPSBkLnNpemVcbiAgICB9KVxuICAgIHJldHVybiBzaXplXG4gIH1cblxuICAvKipcbiAgICogTm90ZSB0aGF0IHRoaXMgZG9lcyBub3QgY2hlY2sgZXhwbGljaXRseSByZS1leHBvcnRlZCBuYW1lcyBmb3IgZXhpc3RlbmNlXG4gICAqIGluIHRoZSBiYXNlIG5hbWVzcGFjZSwgYnV0IGl0IHdpbGwgZXhwYW5kIGFsbCBgZXhwb3J0ICogZnJvbSAnLi4uJ2AgZXhwb3J0c1xuICAgKiBpZiBub3QgZm91bmQgaW4gdGhlIGV4cGxpY2l0IG5hbWVzcGFjZS5cbiAgICogQHBhcmFtICB7c3RyaW5nfSAgbmFtZVxuICAgKiBAcmV0dXJuIHtCb29sZWFufSB0cnVlIGlmIGBuYW1lYCBpcyBleHBvcnRlZCBieSB0aGlzIG1vZHVsZS5cbiAgICovXG4gIGhhcyhuYW1lKSB7XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmhhcyhuYW1lKSkgcmV0dXJuIHRydWVcbiAgICBpZiAodGhpcy5yZWV4cG9ydHMuaGFzKG5hbWUpKSByZXR1cm4gdHJ1ZVxuXG4gICAgLy8gZGVmYXVsdCBleHBvcnRzIG11c3QgYmUgZXhwbGljaXRseSByZS1leHBvcnRlZCAoIzMyOClcbiAgICBpZiAobmFtZSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICBmb3IgKGxldCBkZXAgb2YgdGhpcy5kZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgbGV0IGlubmVyTWFwID0gZGVwKClcblxuICAgICAgICAvLyB0b2RvOiByZXBvcnQgYXMgdW5yZXNvbHZlZD9cbiAgICAgICAgaWYgKCFpbm5lck1hcCkgY29udGludWVcblxuICAgICAgICBpZiAoaW5uZXJNYXAuaGFzKG5hbWUpKSByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmYWxzZVxuICB9XG5cbiAgLyoqXG4gICAqIGVuc3VyZSB0aGF0IGltcG9ydGVkIG5hbWUgZnVsbHkgcmVzb2x2ZXMuXG4gICAqIEBwYXJhbSAge1t0eXBlXX0gIG5hbWUgW2Rlc2NyaXB0aW9uXVxuICAgKiBAcmV0dXJuIHtCb29sZWFufSAgICAgIFtkZXNjcmlwdGlvbl1cbiAgICovXG4gIGhhc0RlZXAobmFtZSkge1xuICAgIGlmICh0aGlzLm5hbWVzcGFjZS5oYXMobmFtZSkpIHJldHVybiB7IGZvdW5kOiB0cnVlLCBwYXRoOiBbdGhpc10gfVxuXG4gICAgaWYgKHRoaXMucmVleHBvcnRzLmhhcyhuYW1lKSkge1xuICAgICAgY29uc3QgcmVleHBvcnRzID0gdGhpcy5yZWV4cG9ydHMuZ2V0KG5hbWUpXG4gICAgICAgICAgLCBpbXBvcnRlZCA9IHJlZXhwb3J0cy5nZXRJbXBvcnQoKVxuXG4gICAgICAvLyBpZiBpbXBvcnQgaXMgaWdub3JlZCwgcmV0dXJuIGV4cGxpY2l0ICdudWxsJ1xuICAgICAgaWYgKGltcG9ydGVkID09IG51bGwpIHJldHVybiB7IGZvdW5kOiB0cnVlLCBwYXRoOiBbdGhpc10gfVxuXG4gICAgICAvLyBzYWZlZ3VhcmQgYWdhaW5zdCBjeWNsZXMsIG9ubHkgaWYgbmFtZSBtYXRjaGVzXG4gICAgICBpZiAoaW1wb3J0ZWQucGF0aCA9PT0gdGhpcy5wYXRoICYmIHJlZXhwb3J0cy5sb2NhbCA9PT0gbmFtZSkge1xuICAgICAgICByZXR1cm4geyBmb3VuZDogZmFsc2UsIHBhdGg6IFt0aGlzXSB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRlZXAgPSBpbXBvcnRlZC5oYXNEZWVwKHJlZXhwb3J0cy5sb2NhbClcbiAgICAgIGRlZXAucGF0aC51bnNoaWZ0KHRoaXMpXG5cbiAgICAgIHJldHVybiBkZWVwXG4gICAgfVxuXG5cbiAgICAvLyBkZWZhdWx0IGV4cG9ydHMgbXVzdCBiZSBleHBsaWNpdGx5IHJlLWV4cG9ydGVkICgjMzI4KVxuICAgIGlmIChuYW1lICE9PSAnZGVmYXVsdCcpIHtcbiAgICAgIGZvciAobGV0IGRlcCBvZiB0aGlzLmRlcGVuZGVuY2llcykge1xuICAgICAgICBsZXQgaW5uZXJNYXAgPSBkZXAoKVxuICAgICAgICBpZiAoaW5uZXJNYXAgPT0gbnVsbCkgcmV0dXJuIHsgZm91bmQ6IHRydWUsIHBhdGg6IFt0aGlzXSB9XG4gICAgICAgIC8vIHRvZG86IHJlcG9ydCBhcyB1bnJlc29sdmVkP1xuICAgICAgICBpZiAoIWlubmVyTWFwKSBjb250aW51ZVxuXG4gICAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlc1xuICAgICAgICBpZiAoaW5uZXJNYXAucGF0aCA9PT0gdGhpcy5wYXRoKSBjb250aW51ZVxuXG4gICAgICAgIGxldCBpbm5lclZhbHVlID0gaW5uZXJNYXAuaGFzRGVlcChuYW1lKVxuICAgICAgICBpZiAoaW5uZXJWYWx1ZS5mb3VuZCkge1xuICAgICAgICAgIGlubmVyVmFsdWUucGF0aC51bnNoaWZ0KHRoaXMpXG4gICAgICAgICAgcmV0dXJuIGlubmVyVmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB7IGZvdW5kOiBmYWxzZSwgcGF0aDogW3RoaXNdIH1cbiAgfVxuXG4gIGdldChuYW1lKSB7XG4gICAgaWYgKHRoaXMubmFtZXNwYWNlLmhhcyhuYW1lKSkgcmV0dXJuIHRoaXMubmFtZXNwYWNlLmdldChuYW1lKVxuXG4gICAgaWYgKHRoaXMucmVleHBvcnRzLmhhcyhuYW1lKSkge1xuICAgICAgY29uc3QgcmVleHBvcnRzID0gdGhpcy5yZWV4cG9ydHMuZ2V0KG5hbWUpXG4gICAgICAgICAgLCBpbXBvcnRlZCA9IHJlZXhwb3J0cy5nZXRJbXBvcnQoKVxuXG4gICAgICAvLyBpZiBpbXBvcnQgaXMgaWdub3JlZCwgcmV0dXJuIGV4cGxpY2l0ICdudWxsJ1xuICAgICAgaWYgKGltcG9ydGVkID09IG51bGwpIHJldHVybiBudWxsXG5cbiAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlcywgb25seSBpZiBuYW1lIG1hdGNoZXNcbiAgICAgIGlmIChpbXBvcnRlZC5wYXRoID09PSB0aGlzLnBhdGggJiYgcmVleHBvcnRzLmxvY2FsID09PSBuYW1lKSByZXR1cm4gdW5kZWZpbmVkXG5cbiAgICAgIHJldHVybiBpbXBvcnRlZC5nZXQocmVleHBvcnRzLmxvY2FsKVxuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgZXhwb3J0cyBtdXN0IGJlIGV4cGxpY2l0bHkgcmUtZXhwb3J0ZWQgKCMzMjgpXG4gICAgaWYgKG5hbWUgIT09ICdkZWZhdWx0Jykge1xuICAgICAgZm9yIChsZXQgZGVwIG9mIHRoaXMuZGVwZW5kZW5jaWVzKSB7XG4gICAgICAgIGxldCBpbm5lck1hcCA9IGRlcCgpXG4gICAgICAgIC8vIHRvZG86IHJlcG9ydCBhcyB1bnJlc29sdmVkP1xuICAgICAgICBpZiAoIWlubmVyTWFwKSBjb250aW51ZVxuXG4gICAgICAgIC8vIHNhZmVndWFyZCBhZ2FpbnN0IGN5Y2xlc1xuICAgICAgICBpZiAoaW5uZXJNYXAucGF0aCA9PT0gdGhpcy5wYXRoKSBjb250aW51ZVxuXG4gICAgICAgIGxldCBpbm5lclZhbHVlID0gaW5uZXJNYXAuZ2V0KG5hbWUpXG4gICAgICAgIGlmIChpbm5lclZhbHVlICE9PSB1bmRlZmluZWQpIHJldHVybiBpbm5lclZhbHVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVuZGVmaW5lZFxuICB9XG5cbiAgZm9yRWFjaChjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIHRoaXMubmFtZXNwYWNlLmZvckVhY2goKHYsIG4pID0+XG4gICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHYsIG4sIHRoaXMpKVxuXG4gICAgdGhpcy5yZWV4cG9ydHMuZm9yRWFjaCgocmVleHBvcnRzLCBuYW1lKSA9PiB7XG4gICAgICBjb25zdCByZWV4cG9ydGVkID0gcmVleHBvcnRzLmdldEltcG9ydCgpXG4gICAgICAvLyBjYW4ndCBsb29rIHVwIG1ldGEgZm9yIGlnbm9yZWQgcmUtZXhwb3J0cyAoIzM0OClcbiAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgcmVleHBvcnRlZCAmJiByZWV4cG9ydGVkLmdldChyZWV4cG9ydHMubG9jYWwpLCBuYW1lLCB0aGlzKVxuICAgIH0pXG5cbiAgICB0aGlzLmRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcCA9PiB7XG4gICAgICBjb25zdCBkID0gZGVwKClcbiAgICAgIC8vIENKUyAvIGlnbm9yZWQgZGVwZW5kZW5jaWVzIHdvbid0IGV4aXN0ICgjNzE3KVxuICAgICAgaWYgKGQgPT0gbnVsbCkgcmV0dXJuXG5cbiAgICAgIGQuZm9yRWFjaCgodiwgbikgPT5cbiAgICAgICAgbiAhPT0gJ2RlZmF1bHQnICYmIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdiwgbiwgdGhpcykpXG4gICAgfSlcbiAgfVxuXG4gIC8vIHRvZG86IGtleXMsIHZhbHVlcywgZW50cmllcz9cblxuICByZXBvcnRFcnJvcnMoY29udGV4dCwgZGVjbGFyYXRpb24pIHtcbiAgICBjb250ZXh0LnJlcG9ydCh7XG4gICAgICBub2RlOiBkZWNsYXJhdGlvbi5zb3VyY2UsXG4gICAgICBtZXNzYWdlOiBgUGFyc2UgZXJyb3JzIGluIGltcG9ydGVkIG1vZHVsZSAnJHtkZWNsYXJhdGlvbi5zb3VyY2UudmFsdWV9JzogYCArXG4gICAgICAgICAgICAgICAgICBgJHt0aGlzLmVycm9yc1xuICAgICAgICAgICAgICAgICAgICAgICAgLm1hcChlID0+IGAke2UubWVzc2FnZX0gKCR7ZS5saW5lTnVtYmVyfToke2UuY29sdW1ufSlgKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmpvaW4oJywgJyl9YCxcbiAgICB9KVxuICB9XG59XG5cbi8qKlxuICogcGFyc2UgZG9jcyBmcm9tIHRoZSBmaXJzdCBub2RlIHRoYXQgaGFzIGxlYWRpbmcgY29tbWVudHNcbiAqL1xuZnVuY3Rpb24gY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgLi4ubm9kZXMpIHtcbiAgY29uc3QgbWV0YWRhdGEgPSB7fVxuXG4gIC8vICdzb21lJyBzaG9ydC1jaXJjdWl0cyBvbiBmaXJzdCAndHJ1ZSdcbiAgbm9kZXMuc29tZShuID0+IHtcbiAgICB0cnkge1xuXG4gICAgICBsZXQgbGVhZGluZ0NvbW1lbnRzXG5cbiAgICAgIC8vIG4ubGVhZGluZ0NvbW1lbnRzIGlzIGxlZ2FjeSBgYXR0YWNoQ29tbWVudHNgIGJlaGF2aW9yXG4gICAgICBpZiAoJ2xlYWRpbmdDb21tZW50cycgaW4gbikge1xuICAgICAgICBsZWFkaW5nQ29tbWVudHMgPSBuLmxlYWRpbmdDb21tZW50c1xuICAgICAgfSBlbHNlIGlmIChuLnJhbmdlKSB7XG4gICAgICAgIGxlYWRpbmdDb21tZW50cyA9IHNvdXJjZS5nZXRDb21tZW50c0JlZm9yZShuKVxuICAgICAgfVxuXG4gICAgICBpZiAoIWxlYWRpbmdDb21tZW50cyB8fCBsZWFkaW5nQ29tbWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2VcblxuICAgICAgZm9yIChsZXQgbmFtZSBpbiBkb2NTdHlsZVBhcnNlcnMpIHtcbiAgICAgICAgY29uc3QgZG9jID0gZG9jU3R5bGVQYXJzZXJzW25hbWVdKGxlYWRpbmdDb21tZW50cylcbiAgICAgICAgaWYgKGRvYykge1xuICAgICAgICAgIG1ldGFkYXRhLmRvYyA9IGRvY1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2VcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIG1ldGFkYXRhXG59XG5cbmNvbnN0IGF2YWlsYWJsZURvY1N0eWxlUGFyc2VycyA9IHtcbiAganNkb2M6IGNhcHR1cmVKc0RvYyxcbiAgdG9tZG9jOiBjYXB0dXJlVG9tRG9jLFxufVxuXG4vKipcbiAqIHBhcnNlIEpTRG9jIGZyb20gbGVhZGluZyBjb21tZW50c1xuICogQHBhcmFtICB7Li4uW3R5cGVdfSBjb21tZW50cyBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHt7ZG9jOiBvYmplY3R9fVxuICovXG5mdW5jdGlvbiBjYXB0dXJlSnNEb2MoY29tbWVudHMpIHtcbiAgbGV0IGRvY1xuXG4gIC8vIGNhcHR1cmUgWFNEb2NcbiAgY29tbWVudHMuZm9yRWFjaChjb21tZW50ID0+IHtcbiAgICAvLyBza2lwIG5vbi1ibG9jayBjb21tZW50c1xuICAgIGlmIChjb21tZW50LnR5cGUgIT09ICdCbG9jaycpIHJldHVyblxuICAgIHRyeSB7XG4gICAgICBkb2MgPSBkb2N0cmluZS5wYXJzZShjb21tZW50LnZhbHVlLCB7IHVud3JhcDogdHJ1ZSB9KVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLyogZG9uJ3QgY2FyZSwgZm9yIG5vdz8gbWF5YmUgYWRkIHRvIGBlcnJvcnM/YCAqL1xuICAgIH1cbiAgfSlcblxuICByZXR1cm4gZG9jXG59XG5cbi8qKlxuICAqIHBhcnNlIFRvbURvYyBzZWN0aW9uIGZyb20gY29tbWVudHNcbiAgKi9cbmZ1bmN0aW9uIGNhcHR1cmVUb21Eb2MoY29tbWVudHMpIHtcbiAgLy8gY29sbGVjdCBsaW5lcyB1cCB0byBmaXJzdCBwYXJhZ3JhcGggYnJlYWtcbiAgY29uc3QgbGluZXMgPSBbXVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY29tbWVudCA9IGNvbW1lbnRzW2ldXG4gICAgaWYgKGNvbW1lbnQudmFsdWUubWF0Y2goL15cXHMqJC8pKSBicmVha1xuICAgIGxpbmVzLnB1c2goY29tbWVudC52YWx1ZS50cmltKCkpXG4gIH1cblxuICAvLyByZXR1cm4gZG9jdHJpbmUtbGlrZSBvYmplY3RcbiAgY29uc3Qgc3RhdHVzTWF0Y2ggPSBsaW5lcy5qb2luKCcgJykubWF0Y2goL14oUHVibGljfEludGVybmFsfERlcHJlY2F0ZWQpOlxccyooLispLylcbiAgaWYgKHN0YXR1c01hdGNoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRlc2NyaXB0aW9uOiBzdGF0dXNNYXRjaFsyXSxcbiAgICAgIHRhZ3M6IFt7XG4gICAgICAgIHRpdGxlOiBzdGF0dXNNYXRjaFsxXS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICBkZXNjcmlwdGlvbjogc3RhdHVzTWF0Y2hbMl0sXG4gICAgICB9XSxcbiAgICB9XG4gIH1cbn1cblxuRXhwb3J0TWFwLmdldCA9IGZ1bmN0aW9uIChzb3VyY2UsIGNvbnRleHQsIG9wdGlvbnMpIHtcbiAgY29uc3QgcGF0aCA9IHJlc29sdmUoc291cmNlLCBjb250ZXh0KVxuICBpZiAocGF0aCA9PSBudWxsKSByZXR1cm4gbnVsbFxuXG4gIHJldHVybiBFeHBvcnRNYXAuZm9yKGNoaWxkQ29udGV4dChwYXRoLCBjb250ZXh0KSwgb3B0aW9ucylcbn1cblxuRXhwb3J0TWFwLmZvciA9IGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zID0ge30pIHtcbiAgY29uc3QgeyBwYXRoIH0gPSBjb250ZXh0XG5cbiAgY29uc3QgY2FjaGVLZXkgPSBoYXNoT2JqZWN0KGNvbnRleHQpLmRpZ2VzdCgnaGV4JylcbiAgbGV0IGV4cG9ydE1hcCA9IGV4cG9ydENhY2hlLmdldChjYWNoZUtleSlcblxuICAvLyByZXR1cm4gY2FjaGVkIGlnbm9yZVxuICBpZiAoZXhwb3J0TWFwID09PSBudWxsKSByZXR1cm4gbnVsbFxuXG4gIGNvbnN0IHN0YXRzID0gZnMuc3RhdFN5bmMocGF0aClcbiAgaWYgKGV4cG9ydE1hcCAhPSBudWxsKSB7XG4gICAgLy8gZGF0ZSBlcXVhbGl0eSBjaGVja1xuICAgIGlmIChleHBvcnRNYXAubXRpbWUgLSBzdGF0cy5tdGltZSA9PT0gMCkge1xuICAgICAgcmV0dXJuIGV4cG9ydE1hcFxuICAgIH1cbiAgICAvLyBmdXR1cmU6IGNoZWNrIGNvbnRlbnQgZXF1YWxpdHk/XG4gIH1cblxuICAvLyBjaGVjayB2YWxpZCBleHRlbnNpb25zIGZpcnN0XG4gIGlmICghaGFzVmFsaWRFeHRlbnNpb24ocGF0aCwgY29udGV4dCkpIHtcbiAgICBleHBvcnRDYWNoZS5zZXQoY2FjaGVLZXksIG51bGwpXG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIC8vIGNoZWNrIGZvciBhbmQgY2FjaGUgaWdub3JlXG4gIGlmIChpc0lnbm9yZWQocGF0aCwgY29udGV4dCkpIHtcbiAgICBsb2coJ2lnbm9yZWQgcGF0aCBkdWUgdG8gaWdub3JlIHNldHRpbmdzOicsIHBhdGgpXG4gICAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKHBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KVxuXG4gIC8vIGNoZWNrIGZvciBhbmQgY2FjaGUgdW5hbWJpZ3VvdXMgbW9kdWxlc1xuICBpZiAoIW9wdGlvbnMudXNlQ29tbW9uanNFeHBvcnRzICYmICF1bmFtYmlndW91cy50ZXN0KGNvbnRlbnQpKSB7XG4gICAgbG9nKCdpZ25vcmVkIHBhdGggZHVlIHRvIHVuYW1iaWd1b3VzIHJlZ2V4OicsIHBhdGgpXG4gICAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBudWxsKVxuICAgIHJldHVybiBudWxsXG4gIH1cblxuICBsb2coJ2NhY2hlIG1pc3MnLCBjYWNoZUtleSwgJ2ZvciBwYXRoJywgcGF0aClcbiAgZXhwb3J0TWFwID0gRXhwb3J0TWFwLnBhcnNlKHBhdGgsIGNvbnRlbnQsIGNvbnRleHQsIG9wdGlvbnMpXG5cbiAgLy8gYW1iaWd1b3VzIG1vZHVsZXMgcmV0dXJuIG51bGxcbiAgaWYgKGV4cG9ydE1hcCA9PSBudWxsKSByZXR1cm4gbnVsbFxuXG4gIGV4cG9ydE1hcC5tdGltZSA9IHN0YXRzLm10aW1lXG5cbiAgZXhwb3J0Q2FjaGUuc2V0KGNhY2hlS2V5LCBleHBvcnRNYXApXG4gIHJldHVybiBleHBvcnRNYXBcbn1cblxuXG5FeHBvcnRNYXAucGFyc2UgPSBmdW5jdGlvbiAocGF0aCwgY29udGVudCwgY29udGV4dCwgb3B0aW9ucyA9IHt9KSB7XG4gIGxvZygndXNpbmcgY29tbW9uanMgZXhwb3J0czonLCBvcHRpb25zLnVzZUNvbW1vbmpzRXhwb3J0cylcblxuICB2YXIgbSA9IG5ldyBFeHBvcnRNYXAocGF0aClcblxuICB0cnkge1xuICAgIHZhciBhc3QgPSBwYXJzZShwYXRoLCBjb250ZW50LCBjb250ZXh0KVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBsb2coJ3BhcnNlIGVycm9yOicsIHBhdGgsIGVycilcbiAgICBtLmVycm9ycy5wdXNoKGVycilcbiAgICByZXR1cm4gbSAvLyBjYW4ndCBjb250aW51ZVxuICB9XG5cbiAgaWYgKCFvcHRpb25zLnVzZUNvbW1vbmpzRXhwb3J0cyAmJiAhdW5hbWJpZ3VvdXMuaXNNb2R1bGUoYXN0KSkgcmV0dXJuIG51bGxcblxuICBjb25zdCBkb2NzdHlsZSA9IChjb250ZXh0LnNldHRpbmdzICYmIGNvbnRleHQuc2V0dGluZ3NbJ2ltcG9ydC9kb2NzdHlsZSddKSB8fCBbJ2pzZG9jJ11cbiAgY29uc3QgZG9jU3R5bGVQYXJzZXJzID0ge31cbiAgZG9jc3R5bGUuZm9yRWFjaChzdHlsZSA9PiB7XG4gICAgZG9jU3R5bGVQYXJzZXJzW3N0eWxlXSA9IGF2YWlsYWJsZURvY1N0eWxlUGFyc2Vyc1tzdHlsZV1cbiAgfSlcblxuICAvLyBhdHRlbXB0IHRvIGNvbGxlY3QgbW9kdWxlIGRvY1xuICBpZiAoYXN0LmNvbW1lbnRzKSB7XG4gICAgYXN0LmNvbW1lbnRzLnNvbWUoYyA9PiB7XG4gICAgICBpZiAoYy50eXBlICE9PSAnQmxvY2snKSByZXR1cm4gZmFsc2VcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRvYyA9IGRvY3RyaW5lLnBhcnNlKGMudmFsdWUsIHsgdW53cmFwOiB0cnVlIH0pXG4gICAgICAgIGlmIChkb2MudGFncy5zb21lKHQgPT4gdC50aXRsZSA9PT0gJ21vZHVsZScpKSB7XG4gICAgICAgICAgbS5kb2MgPSBkb2NcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHsgLyogaWdub3JlICovIH1cbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH0pXG4gIH1cblxuICBjb25zdCBuYW1lc3BhY2VzID0gbmV3IE1hcCgpXG5cbiAgZnVuY3Rpb24gcmVtb3RlUGF0aCh2YWx1ZSkge1xuICAgIHJldHVybiByZXNvbHZlLnJlbGF0aXZlKHZhbHVlLCBwYXRoLCBjb250ZXh0LnNldHRpbmdzKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZUltcG9ydCh2YWx1ZSkge1xuICAgIGNvbnN0IHJwID0gcmVtb3RlUGF0aCh2YWx1ZSlcbiAgICBpZiAocnAgPT0gbnVsbCkgcmV0dXJuIG51bGxcbiAgICByZXR1cm4gRXhwb3J0TWFwLmZvcihjaGlsZENvbnRleHQocnAsIGNvbnRleHQpLCBvcHRpb25zKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0TmFtZXNwYWNlKGlkZW50aWZpZXIpIHtcbiAgICBpZiAoIW5hbWVzcGFjZXMuaGFzKGlkZW50aWZpZXIubmFtZSkpIHJldHVyblxuXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiByZXNvbHZlSW1wb3J0KG5hbWVzcGFjZXMuZ2V0KGlkZW50aWZpZXIubmFtZSkpXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gYWRkTmFtZXNwYWNlKG9iamVjdCwgaWRlbnRpZmllcikge1xuICAgIGNvbnN0IG5zZm4gPSBnZXROYW1lc3BhY2UoaWRlbnRpZmllcilcbiAgICBpZiAobnNmbikge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iamVjdCwgJ25hbWVzcGFjZScsIHsgZ2V0OiBuc2ZuIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIG9iamVjdFxuICB9XG5cbiAgZnVuY3Rpb24gY2FwdHVyZURlcGVuZGVuY3koZGVjbGFyYXRpb24pIHtcbiAgICBpZiAoZGVjbGFyYXRpb24uc291cmNlID09IG51bGwpIHJldHVybiBudWxsXG4gICAgaWYgKGRlY2xhcmF0aW9uLmltcG9ydEtpbmQgPT09ICd0eXBlJykgcmV0dXJuIG51bGwgLy8gc2tpcCBGbG93IHR5cGUgaW1wb3J0c1xuICAgIGNvbnN0IGltcG9ydGVkU3BlY2lmaWVycyA9IG5ldyBTZXQoKVxuICAgIGNvbnN0IHN1cHBvcnRlZFR5cGVzID0gbmV3IFNldChbJ0ltcG9ydERlZmF1bHRTcGVjaWZpZXInLCAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJ10pXG4gICAgbGV0IGhhc0ltcG9ydGVkVHlwZSA9IGZhbHNlXG4gICAgaWYgKGRlY2xhcmF0aW9uLnNwZWNpZmllcnMpIHtcbiAgICAgIGRlY2xhcmF0aW9uLnNwZWNpZmllcnMuZm9yRWFjaChzcGVjaWZpZXIgPT4ge1xuICAgICAgICBjb25zdCBpc1R5cGUgPSBzcGVjaWZpZXIuaW1wb3J0S2luZCA9PT0gJ3R5cGUnXG4gICAgICAgIGhhc0ltcG9ydGVkVHlwZSA9IGhhc0ltcG9ydGVkVHlwZSB8fCBpc1R5cGVcblxuICAgICAgICBpZiAoc3VwcG9ydGVkVHlwZXMuaGFzKHNwZWNpZmllci50eXBlKSAmJiAhaXNUeXBlKSB7XG4gICAgICAgICAgaW1wb3J0ZWRTcGVjaWZpZXJzLmFkZChzcGVjaWZpZXIudHlwZSlcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3BlY2lmaWVyLnR5cGUgPT09ICdJbXBvcnRTcGVjaWZpZXInICYmICFpc1R5cGUpIHtcbiAgICAgICAgICBpbXBvcnRlZFNwZWNpZmllcnMuYWRkKHNwZWNpZmllci5pbXBvcnRlZC5uYW1lKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIG9ubHkgRmxvdyB0eXBlcyB3ZXJlIGltcG9ydGVkXG4gICAgaWYgKGhhc0ltcG9ydGVkVHlwZSAmJiBpbXBvcnRlZFNwZWNpZmllcnMuc2l6ZSA9PT0gMCkgcmV0dXJuIG51bGxcblxuICAgIGNvbnN0IHAgPSByZW1vdGVQYXRoKGRlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZSlcbiAgICBpZiAocCA9PSBudWxsKSByZXR1cm4gbnVsbFxuICAgIGNvbnN0IGV4aXN0aW5nID0gbS5pbXBvcnRzLmdldChwKVxuICAgIGlmIChleGlzdGluZyAhPSBudWxsKSByZXR1cm4gZXhpc3RpbmcuZ2V0dGVyXG5cbiAgICBjb25zdCBnZXR0ZXIgPSB0aHVua0ZvcihwLCBjb250ZXh0LCBvcHRpb25zKVxuICAgIG0uaW1wb3J0cy5zZXQocCwge1xuICAgICAgZ2V0dGVyLFxuICAgICAgc291cmNlOiB7ICAvLyBjYXB0dXJpbmcgYWN0dWFsIG5vZGUgcmVmZXJlbmNlIGhvbGRzIGZ1bGwgQVNUIGluIG1lbW9yeSFcbiAgICAgICAgdmFsdWU6IGRlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZSxcbiAgICAgICAgbG9jOiBkZWNsYXJhdGlvbi5zb3VyY2UubG9jLFxuICAgICAgfSxcbiAgICAgIGltcG9ydGVkU3BlY2lmaWVycyxcbiAgICB9KVxuICAgIHJldHVybiBnZXR0ZXJcbiAgfVxuXG4gIGNvbnN0IHNvdXJjZSA9IG1ha2VTb3VyY2VDb2RlKGNvbnRlbnQsIGFzdClcblxuICBmdW5jdGlvbiBpc0VzTW9kdWxlSW50ZXJvcCgpIHtcbiAgICBjb25zdCB0c0NvbmZpZ0luZm8gPSB0c0NvbmZpZ0xvYWRlcih7XG4gICAgICBjd2Q6IGNvbnRleHQucGFyc2VyT3B0aW9ucyAmJiBjb250ZXh0LnBhcnNlck9wdGlvbnMudHNjb25maWdSb290RGlyIHx8IHByb2Nlc3MuY3dkKCksXG4gICAgICBnZXRFbnY6IChrZXkpID0+IHByb2Nlc3MuZW52W2tleV0sXG4gICAgfSlcbiAgICB0cnkge1xuICAgICAgaWYgKHRzQ29uZmlnSW5mby50c0NvbmZpZ1BhdGggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25zdCBqc29uVGV4dCA9IGZzLnJlYWRGaWxlU3luYyh0c0NvbmZpZ0luZm8udHNDb25maWdQYXRoKS50b1N0cmluZygpXG4gICAgICAgIGlmICghcGFyc2VDb25maWdGaWxlVGV4dFRvSnNvbikge1xuICAgICAgICAgIC8vIHRoaXMgaXMgYmVjYXVzZSBwcm9qZWN0cyBub3QgdXNpbmcgVHlwZVNjcmlwdCB3b24ndCBoYXZlIHR5cGVzY3JpcHQgaW5zdGFsbGVkXG4gICAgICAgICAgKHtwYXJzZUNvbmZpZ0ZpbGVUZXh0VG9Kc29ufSA9IHJlcXVpcmUoJ3R5cGVzY3JpcHQnKSlcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0c0NvbmZpZyA9IHBhcnNlQ29uZmlnRmlsZVRleHRUb0pzb24odHNDb25maWdJbmZvLnRzQ29uZmlnUGF0aCwganNvblRleHQpLmNvbmZpZ1xuICAgICAgICByZXR1cm4gdHNDb25maWcuY29tcGlsZXJPcHRpb25zLmVzTW9kdWxlSW50ZXJvcFxuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZVxuICAgIH1cbiAgfVxuXG4gIC8vIGZvciBzYXZpbmcgYWxsIGNvbW1vbmpzIGV4cG9ydHNcbiAgbGV0IG1vZHVsZUV4cG9ydHMgPSB7fVxuXG4gIC8vIGZvciBpZiBtb2R1bGUgZXhwb3J0cyBoYXMgYmVlbiBkZWNsYXJlZCBkaXJlY3RseSAoZXhwb3J0cy9tb2R1bGUuZXhwb3J0cyA9IC4uLilcbiAgbGV0IG1vZHVsZUV4cG9ydHNNYWluID0gbnVsbFxuXG4gIGZ1bmN0aW9uIHBhcnNlTW9kdWxlRXhwb3J0c09iamVjdEV4cHJlc3Npb24obm9kZSkge1xuICAgIG1vZHVsZUV4cG9ydHNNYWluID0gdHJ1ZVxuICAgIG1vZHVsZUV4cG9ydHMgPSB7fVxuICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKFxuICAgICAgZnVuY3Rpb24ocHJvcGVydHkpIHtcbiAgICAgICAgY29uc3Qga2V5VHlwZSA9IHByb3BlcnR5LmtleS50eXBlXG5cbiAgICAgICAgaWYgKGtleVR5cGUgPT09ICdJZGVudGlmaWVyJykge1xuICAgICAgICAgIGNvbnN0IGtleU5hbWUgPSBwcm9wZXJ0eS5rZXkubmFtZVxuICAgICAgICAgIG1vZHVsZUV4cG9ydHNba2V5TmFtZV0gPSBwcm9wZXJ0eS52YWx1ZVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGtleVR5cGUgPT09ICdMaXRlcmFsJykge1xuICAgICAgICAgIGNvbnN0IGtleU5hbWUgPSBwcm9wZXJ0eS5rZXkudmFsdWVcbiAgICAgICAgICBtb2R1bGVFeHBvcnRzW2tleU5hbWVdID0gcHJvcGVydHkudmFsdWVcbiAgICAgICAgfVxuICAgICAgfVxuICAgIClcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZU1vZHVsZUV4cG9ydHMoKSB7XG4gICAgbGV0IGlzRXNNb2R1bGUgPSBmYWxzZVxuICAgIGNvbnN0IGVzTW9kdWxlID0gbW9kdWxlRXhwb3J0cy5fX2VzTW9kdWxlXG4gICAgaWYgKGVzTW9kdWxlICYmIGVzTW9kdWxlLnR5cGUgPT09ICdMaXRlcmFsJyAmJiBlc01vZHVsZS52YWx1ZSkge1xuICAgICAgLy8gZm9yIGludGVyb3BSZXF1aXJlRGVmYXVsdCBjYWxsc1xuICAgIH1cblxuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1vZHVsZUV4cG9ydHMpLmZvckVhY2goZnVuY3Rpb24gKHByb3BlcnR5TmFtZSkge1xuICAgICAgbS5uYW1lc3BhY2Uuc2V0KHByb3BlcnR5TmFtZSlcbiAgICB9KVxuXG4gICAgaWYgKCFpc0VzTW9kdWxlICYmIG1vZHVsZUV4cG9ydHNNYWluICYmICFvcHRpb25zLm5vSW50ZXJvcCkge1xuICAgICAgLy8gcmVjb2duaXplcyBkZWZhdWx0IGZvciBpbXBvcnQgc3RhdGVtZW50c1xuICAgICAgbS5uYW1lc3BhY2Uuc2V0KCdkZWZhdWx0JylcbiAgICB9XG4gIH1cblxuXG4gIGFzdC5ib2R5LmZvckVhY2goZnVuY3Rpb24gKG4pIHtcbiAgICBpZiAob3B0aW9ucy51c2VDb21tb25qc0V4cG9ydHMpIHtcbiAgICAgIGlmIChuLnR5cGUgPT09ICdFeHByZXNzaW9uU3RhdGVtZW50Jykge1xuICAgICAgICBpZiAobi5leHByZXNzaW9uLnR5cGUgPT09ICdBc3NpZ25tZW50RXhwcmVzc2lvbicpIHtcbiAgICAgICAgICBjb25zdCBsZWZ0ID0gbi5leHByZXNzaW9uLmxlZnRcbiAgICAgICAgICBjb25zdCByaWdodCA9IG4uZXhwcmVzc2lvbi5yaWdodFxuXG4gICAgICAgICAgLy8gZXhwb3J0cy9tb2R1bGUuZXhwb3J0cyA9IC4uLlxuICAgICAgICAgIGlmIChpc0NvbW1vbmpzRXhwb3J0c09iamVjdChsZWZ0KSkge1xuICAgICAgICAgICAgbW9kdWxlRXhwb3J0c01haW4gPSB0cnVlXG5cbiAgICAgICAgICAgIC8vIGV4cG9ydHMvbW9kdWxlLmV4cG9ydHMgPSB7Li4ufVxuICAgICAgICAgICAgaWYgKHJpZ2h0LnR5cGUgPT09ICdPYmplY3RFeHByZXNzaW9uJykge1xuICAgICAgICAgICAgICBwYXJzZU1vZHVsZUV4cG9ydHNPYmplY3RFeHByZXNzaW9uKHJpZ2h0KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIGlmIChsZWZ0LnR5cGUgPT09ICdNZW1iZXJFeHByZXNzaW9uJ1xuICAgICAgICAgICAgJiYgaXNDb21tb25qc0V4cG9ydHNPYmplY3QobGVmdC5vYmplY3QpKSB7XG4gICAgICAgICAgICAvLyAoZXhwb3J0cy9tb2R1bGUuZXhwb3J0cykuPG5hbWU+ID0gLi4uXG4gICAgICAgICAgICBpZiAobGVmdC5wcm9wZXJ0eS50eXBlID09PSAnSWRlbnRpZmllcicpIHtcbiAgICAgICAgICAgICAgY29uc3Qga2V5TmFtZSA9IGxlZnQucHJvcGVydHkubmFtZVxuICAgICAgICAgICAgICBtb2R1bGVFeHBvcnRzW2tleU5hbWVdID0gcmlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIChleHBvcnRzL21vZHVsZS5leHBvcnRzKS5bXCI8bmFtZT5cIl0gPSAuLi5cbiAgICAgICAgICAgIGVsc2UgaWYgKGxlZnQucHJvcGVydHkudHlwZSA9PT0gJ0xpdGVyYWwnKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGtleU5hbWUgPSBsZWZ0LnByb3BlcnR5LnZhbHVlXG4gICAgICAgICAgICAgIG1vZHVsZUV4cG9ydHNba2V5TmFtZV0gPSByaWdodFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIC8vIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSgoZXhwb3J0cy9tb2R1bGUuZXhwb3J0cyksIDxuYW1lPiwge3ZhbHVlOiA8dmFsdWU+fSlcbiAgICAgICAgZWxzZSBpZiAobi5leHByZXNzaW9uLnR5cGUgPT09ICdDYWxsRXhwcmVzc2lvbicpIHtcbiAgICAgICAgICBjb25zdCBjYWxsID0gbi5leHByZXNzaW9uXG5cbiAgICAgICAgICBjb25zdCBjYWxsZWUgPSBjYWxsLmNhbGxlZVxuICAgICAgICAgIGlmIChjYWxsZWUudHlwZSAhPT0gJ01lbWJlckV4cHJlc3Npb24nKSByZXR1cm5cbiAgICAgICAgICBpZiAoY2FsbGVlLm9iamVjdC50eXBlICE9PSAnSWRlbnRpZmllcicgfHwgY2FsbGVlLm9iamVjdC5uYW1lICE9PSAnT2JqZWN0JykgcmV0dXJuXG4gICAgICAgICAgaWYgKGNhbGxlZS5wcm9wZXJ0eS50eXBlICE9PSAnSWRlbnRpZmllcicgfHwgY2FsbGVlLnByb3BlcnR5Lm5hbWUgIT09ICdkZWZpbmVQcm9wZXJ0eScpIHJldHVyblxuXG4gICAgICAgICAgaWYgKGNhbGwuYXJndW1lbnRzLmxlbmd0aCAhPT0gMykgcmV0dXJuXG4gICAgICAgICAgaWYgKCFpc0NvbW1vbmpzRXhwb3J0c09iamVjdChjYWxsLmFyZ3VtZW50c1swXSkpIHJldHVyblxuICAgICAgICAgIGlmIChjYWxsLmFyZ3VtZW50c1sxXS50eXBlICE9PSAnTGl0ZXJhbCcpIHJldHVyblxuICAgICAgICAgIGlmIChjYWxsLmFyZ3VtZW50c1syXS50eXBlICE9PSAnT2JqZWN0RXhwcmVzc2lvbicpIHJldHVyblxuXG4gICAgICAgICAgY2FsbC5hcmd1bWVudHNbMl0ucHJvcGVydGllcy5mb3JFYWNoKGZ1bmN0aW9uIChkZWZpbmVQcm9wZXJ0eSkge1xuICAgICAgICAgICAgaWYgKGRlZmluZVByb3BlcnR5LnR5cGUgIT09ICdQcm9wZXJ0eScpIHJldHVyblxuXG4gICAgICAgICAgICBpZiAoZGVmaW5lUHJvcGVydHkua2V5LnR5cGUgPT09ICdMaXRlcmFsJ1xuICAgICAgICAgICAgICAgICYmIGRlZmluZVByb3BlcnR5LmtleS52YWx1ZSA9PT0gJ3ZhbHVlJykge1xuICAgICAgICAgICAgICAvLyB7J3ZhbHVlJzogPHZhbHVlPn1cbiAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgICAgICAgICAgIG1vZHVsZUV4cG9ydHMsXG4gICAgICAgICAgICAgICAgY2FsbC5hcmd1bWVudHNbMV0udmFsdWUsXG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudmFsdWVcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoZGVmaW5lUHJvcGVydHkua2V5LnR5cGUgPT09ICdJZGVudGlmaWVyJ1xuICAgICAgICAgICAgICAgICYmIGRlZmluZVByb3BlcnR5LmtleS5uYW1lID09PSAndmFsdWUnKSB7XG4gICAgICAgICAgICAgIC8vIHt2YWx1ZTogPHZhbHVlPn1cbiAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgICAgICAgICAgIG1vZHVsZUV4cG9ydHMsXG4gICAgICAgICAgICAgICAgY2FsbC5hcmd1bWVudHNbMV0udmFsdWUsXG4gICAgICAgICAgICAgICAgZGVmaW5lUHJvcGVydHkudmFsdWVcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobi50eXBlID09PSAnRXhwb3J0RGVmYXVsdERlY2xhcmF0aW9uJykge1xuICAgICAgY29uc3QgZXhwb3J0TWV0YSA9IGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIG4pXG4gICAgICBpZiAobi5kZWNsYXJhdGlvbi50eXBlID09PSAnSWRlbnRpZmllcicpIHtcbiAgICAgICAgYWRkTmFtZXNwYWNlKGV4cG9ydE1ldGEsIG4uZGVjbGFyYXRpb24pXG4gICAgICB9XG4gICAgICBtLm5hbWVzcGFjZS5zZXQoJ2RlZmF1bHQnLCBleHBvcnRNZXRhKVxuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgaWYgKG4udHlwZSA9PT0gJ0V4cG9ydEFsbERlY2xhcmF0aW9uJykge1xuICAgICAgY29uc3QgZ2V0dGVyID0gY2FwdHVyZURlcGVuZGVuY3kobilcbiAgICAgIGlmIChnZXR0ZXIpIG0uZGVwZW5kZW5jaWVzLmFkZChnZXR0ZXIpXG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICAvLyBjYXB0dXJlIG5hbWVzcGFjZXMgaW4gY2FzZSBvZiBsYXRlciBleHBvcnRcbiAgICBpZiAobi50eXBlID09PSAnSW1wb3J0RGVjbGFyYXRpb24nKSB7XG4gICAgICBjYXB0dXJlRGVwZW5kZW5jeShuKVxuICAgICAgbGV0IG5zXG4gICAgICBpZiAobi5zcGVjaWZpZXJzLnNvbWUocyA9PiBzLnR5cGUgPT09ICdJbXBvcnROYW1lc3BhY2VTcGVjaWZpZXInICYmIChucyA9IHMpKSkge1xuICAgICAgICBuYW1lc3BhY2VzLnNldChucy5sb2NhbC5uYW1lLCBuLnNvdXJjZS52YWx1ZSlcbiAgICAgIH1cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChuLnR5cGUgPT09ICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJykge1xuICAgICAgLy8gY2FwdHVyZSBkZWNsYXJhdGlvblxuICAgICAgaWYgKG4uZGVjbGFyYXRpb24gIT0gbnVsbCkge1xuICAgICAgICBzd2l0Y2ggKG4uZGVjbGFyYXRpb24udHlwZSkge1xuICAgICAgICAgIGNhc2UgJ0Z1bmN0aW9uRGVjbGFyYXRpb24nOlxuICAgICAgICAgIGNhc2UgJ0NsYXNzRGVjbGFyYXRpb24nOlxuICAgICAgICAgIGNhc2UgJ1R5cGVBbGlhcyc6IC8vIGZsb3d0eXBlIHdpdGggYmFiZWwtZXNsaW50IHBhcnNlclxuICAgICAgICAgIGNhc2UgJ0ludGVyZmFjZURlY2xhcmF0aW9uJzpcbiAgICAgICAgICBjYXNlICdEZWNsYXJlRnVuY3Rpb24nOlxuICAgICAgICAgIGNhc2UgJ1RTRGVjbGFyZUZ1bmN0aW9uJzpcbiAgICAgICAgICBjYXNlICdUU0VudW1EZWNsYXJhdGlvbic6XG4gICAgICAgICAgY2FzZSAnVFNUeXBlQWxpYXNEZWNsYXJhdGlvbic6XG4gICAgICAgICAgY2FzZSAnVFNJbnRlcmZhY2VEZWNsYXJhdGlvbic6XG4gICAgICAgICAgY2FzZSAnVFNBYnN0cmFjdENsYXNzRGVjbGFyYXRpb24nOlxuICAgICAgICAgIGNhc2UgJ1RTTW9kdWxlRGVjbGFyYXRpb24nOlxuICAgICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KG4uZGVjbGFyYXRpb24uaWQubmFtZSwgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgbikpXG4gICAgICAgICAgICBicmVha1xuICAgICAgICAgIGNhc2UgJ1ZhcmlhYmxlRGVjbGFyYXRpb24nOlxuICAgICAgICAgICAgbi5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMuZm9yRWFjaCgoZCkgPT5cbiAgICAgICAgICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoZC5pZCxcbiAgICAgICAgICAgICAgICBpZCA9PiBtLm5hbWVzcGFjZS5zZXQoaWQubmFtZSwgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgZCwgbikpKSlcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgbnNvdXJjZSA9IG4uc291cmNlICYmIG4uc291cmNlLnZhbHVlXG4gICAgICBuLnNwZWNpZmllcnMuZm9yRWFjaCgocykgPT4ge1xuICAgICAgICBjb25zdCBleHBvcnRNZXRhID0ge31cbiAgICAgICAgbGV0IGxvY2FsXG5cbiAgICAgICAgc3dpdGNoIChzLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICdFeHBvcnREZWZhdWx0U3BlY2lmaWVyJzpcbiAgICAgICAgICAgIGlmICghbi5zb3VyY2UpIHJldHVyblxuICAgICAgICAgICAgbG9jYWwgPSAnZGVmYXVsdCdcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgICAgY2FzZSAnRXhwb3J0TmFtZXNwYWNlU3BlY2lmaWVyJzpcbiAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChzLmV4cG9ydGVkLm5hbWUsIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRNZXRhLCAnbmFtZXNwYWNlJywge1xuICAgICAgICAgICAgICBnZXQoKSB7IHJldHVybiByZXNvbHZlSW1wb3J0KG5zb3VyY2UpIH0sXG4gICAgICAgICAgICB9KSlcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIGNhc2UgJ0V4cG9ydFNwZWNpZmllcic6XG4gICAgICAgICAgICBpZiAoIW4uc291cmNlKSB7XG4gICAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChzLmV4cG9ydGVkLm5hbWUsIGFkZE5hbWVzcGFjZShleHBvcnRNZXRhLCBzLmxvY2FsKSlcbiAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBlbHNlIGZhbGxzIHRocm91Z2hcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgbG9jYWwgPSBzLmxvY2FsLm5hbWVcbiAgICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cblxuICAgICAgICAvLyB0b2RvOiBKU0RvY1xuICAgICAgICBtLnJlZXhwb3J0cy5zZXQocy5leHBvcnRlZC5uYW1lLCB7IGxvY2FsLCBnZXRJbXBvcnQ6ICgpID0+IHJlc29sdmVJbXBvcnQobnNvdXJjZSkgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gICAgY29uc3QgaXNFc01vZHVsZUludGVyb3BUcnVlID0gaXNFc01vZHVsZUludGVyb3AoKVxuXG4gICAgY29uc3QgZXhwb3J0cyA9IFsnVFNFeHBvcnRBc3NpZ25tZW50J11cbiAgICBpZiAoaXNFc01vZHVsZUludGVyb3BUcnVlKSB7XG4gICAgICBleHBvcnRzLnB1c2goJ1RTTmFtZXNwYWNlRXhwb3J0RGVjbGFyYXRpb24nKVxuICAgIH1cblxuICAgIC8vIFRoaXMgZG9lc24ndCBkZWNsYXJlIGFueXRoaW5nLCBidXQgY2hhbmdlcyB3aGF0J3MgYmVpbmcgZXhwb3J0ZWQuXG4gICAgaWYgKGluY2x1ZGVzKGV4cG9ydHMsIG4udHlwZSkpIHtcbiAgICAgIGNvbnN0IGV4cG9ydGVkTmFtZSA9IG4udHlwZSA9PT0gJ1RTTmFtZXNwYWNlRXhwb3J0RGVjbGFyYXRpb24nXG4gICAgICAgID8gbi5pZC5uYW1lXG4gICAgICAgIDogKG4uZXhwcmVzc2lvbiAmJiBuLmV4cHJlc3Npb24ubmFtZSB8fCAobi5leHByZXNzaW9uLmlkICYmIG4uZXhwcmVzc2lvbi5pZC5uYW1lKSB8fCBudWxsKVxuICAgICAgY29uc3QgZGVjbFR5cGVzID0gW1xuICAgICAgICAnVmFyaWFibGVEZWNsYXJhdGlvbicsXG4gICAgICAgICdDbGFzc0RlY2xhcmF0aW9uJyxcbiAgICAgICAgJ1RTRGVjbGFyZUZ1bmN0aW9uJyxcbiAgICAgICAgJ1RTRW51bURlY2xhcmF0aW9uJyxcbiAgICAgICAgJ1RTVHlwZUFsaWFzRGVjbGFyYXRpb24nLFxuICAgICAgICAnVFNJbnRlcmZhY2VEZWNsYXJhdGlvbicsXG4gICAgICAgICdUU0Fic3RyYWN0Q2xhc3NEZWNsYXJhdGlvbicsXG4gICAgICAgICdUU01vZHVsZURlY2xhcmF0aW9uJyxcbiAgICAgIF1cbiAgICAgIGNvbnN0IGV4cG9ydGVkRGVjbHMgPSBhc3QuYm9keS5maWx0ZXIoKHsgdHlwZSwgaWQsIGRlY2xhcmF0aW9ucyB9KSA9PiBpbmNsdWRlcyhkZWNsVHlwZXMsIHR5cGUpICYmIChcbiAgICAgICAgKGlkICYmIGlkLm5hbWUgPT09IGV4cG9ydGVkTmFtZSkgfHwgKGRlY2xhcmF0aW9ucyAmJiBkZWNsYXJhdGlvbnMuZmluZCgoZCkgPT4gZC5pZC5uYW1lID09PSBleHBvcnRlZE5hbWUpKVxuICAgICAgKSlcbiAgICAgIGlmIChleHBvcnRlZERlY2xzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyBFeHBvcnQgaXMgbm90IHJlZmVyZW5jaW5nIGFueSBsb2NhbCBkZWNsYXJhdGlvbiwgbXVzdCBiZSByZS1leHBvcnRpbmdcbiAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KCdkZWZhdWx0JywgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgbikpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgaWYgKGlzRXNNb2R1bGVJbnRlcm9wVHJ1ZSkge1xuICAgICAgICBtLm5hbWVzcGFjZS5zZXQoJ2RlZmF1bHQnLCB7fSlcbiAgICAgIH1cbiAgICAgIGV4cG9ydGVkRGVjbHMuZm9yRWFjaCgoZGVjbCkgPT4ge1xuICAgICAgICBpZiAoZGVjbC50eXBlID09PSAnVFNNb2R1bGVEZWNsYXJhdGlvbicpIHtcbiAgICAgICAgICBpZiAoZGVjbC5ib2R5ICYmIGRlY2wuYm9keS50eXBlID09PSAnVFNNb2R1bGVEZWNsYXJhdGlvbicpIHtcbiAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChkZWNsLmJvZHkuaWQubmFtZSwgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgZGVjbC5ib2R5KSlcbiAgICAgICAgICB9IGVsc2UgaWYgKGRlY2wuYm9keSAmJiBkZWNsLmJvZHkuYm9keSkge1xuICAgICAgICAgICAgZGVjbC5ib2R5LmJvZHkuZm9yRWFjaCgobW9kdWxlQmxvY2tOb2RlKSA9PiB7XG4gICAgICAgICAgICAgIC8vIEV4cG9ydC1hc3NpZ25tZW50IGV4cG9ydHMgYWxsIG1lbWJlcnMgaW4gdGhlIG5hbWVzcGFjZSxcbiAgICAgICAgICAgICAgLy8gZXhwbGljaXRseSBleHBvcnRlZCBvciBub3QuXG4gICAgICAgICAgICAgIGNvbnN0IG5hbWVzcGFjZURlY2wgPSBtb2R1bGVCbG9ja05vZGUudHlwZSA9PT0gJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nID9cbiAgICAgICAgICAgICAgICBtb2R1bGVCbG9ja05vZGUuZGVjbGFyYXRpb24gOlxuICAgICAgICAgICAgICAgIG1vZHVsZUJsb2NrTm9kZVxuXG4gICAgICAgICAgICAgIGlmICghbmFtZXNwYWNlRGVjbCkge1xuICAgICAgICAgICAgICAgIC8vIFR5cGVTY3JpcHQgY2FuIGNoZWNrIHRoaXMgZm9yIHVzOyB3ZSBuZWVkbid0XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobmFtZXNwYWNlRGVjbC50eXBlID09PSAnVmFyaWFibGVEZWNsYXJhdGlvbicpIHtcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2VEZWNsLmRlY2xhcmF0aW9ucy5mb3JFYWNoKChkKSA9PlxuICAgICAgICAgICAgICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoZC5pZCwgKGlkKSA9PiBtLm5hbWVzcGFjZS5zZXQoXG4gICAgICAgICAgICAgICAgICAgIGlkLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIGRlY2wsIG5hbWVzcGFjZURlY2wsIG1vZHVsZUJsb2NrTm9kZSlcbiAgICAgICAgICAgICAgICAgICkpXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG0ubmFtZXNwYWNlLnNldChcbiAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZURlY2wuaWQubmFtZSxcbiAgICAgICAgICAgICAgICAgIGNhcHR1cmVEb2Moc291cmNlLCBkb2NTdHlsZVBhcnNlcnMsIG1vZHVsZUJsb2NrTm9kZSkpXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEV4cG9ydCBhcyBkZWZhdWx0XG4gICAgICAgICAgbS5uYW1lc3BhY2Uuc2V0KCdkZWZhdWx0JywgY2FwdHVyZURvYyhzb3VyY2UsIGRvY1N0eWxlUGFyc2VycywgZGVjbCkpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICB9KVxuXG4gIGlmIChvcHRpb25zLnVzZUNvbW1vbmpzRXhwb3J0cykgaGFuZGxlTW9kdWxlRXhwb3J0cygpXG5cbiAgcmV0dXJuIG1cbn1cblxuLyoqXG4gKiBUaGUgY3JlYXRpb24gb2YgdGhpcyBjbG9zdXJlIGlzIGlzb2xhdGVkIGZyb20gb3RoZXIgc2NvcGVzXG4gKiB0byBhdm9pZCBvdmVyLXJldGVudGlvbiBvZiB1bnJlbGF0ZWQgdmFyaWFibGVzLCB3aGljaCBoYXNcbiAqIGNhdXNlZCBtZW1vcnkgbGVha3MuIFNlZSAjMTI2Ni5cbiAqL1xuZnVuY3Rpb24gdGh1bmtGb3IocCwgY29udGV4dCwgb3B0aW9ucykge1xuICByZXR1cm4gKCkgPT4gRXhwb3J0TWFwLmZvcihjaGlsZENvbnRleHQocCwgY29udGV4dCksIG9wdGlvbnMpXG59XG5cblxuLyoqXG4gKiBUcmF2ZXJzZSBhIHBhdHRlcm4vaWRlbnRpZmllciBub2RlLCBjYWxsaW5nICdjYWxsYmFjaydcbiAqIGZvciBlYWNoIGxlYWYgaWRlbnRpZmllci5cbiAqIEBwYXJhbSAge25vZGV9ICAgcGF0dGVyblxuICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUocGF0dGVybiwgY2FsbGJhY2spIHtcbiAgc3dpdGNoIChwYXR0ZXJuLnR5cGUpIHtcbiAgICBjYXNlICdJZGVudGlmaWVyJzogLy8gYmFzZSBjYXNlXG4gICAgICBjYWxsYmFjayhwYXR0ZXJuKVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ09iamVjdFBhdHRlcm4nOlxuICAgICAgcGF0dGVybi5wcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XG4gICAgICAgIGlmIChwLnR5cGUgPT09ICdFeHBlcmltZW50YWxSZXN0UHJvcGVydHknIHx8IHAudHlwZSA9PT0gJ1Jlc3RFbGVtZW50Jykge1xuICAgICAgICAgIGNhbGxiYWNrKHAuYXJndW1lbnQpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUocC52YWx1ZSwgY2FsbGJhY2spXG4gICAgICB9KVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ0FycmF5UGF0dGVybic6XG4gICAgICBwYXR0ZXJuLmVsZW1lbnRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgaWYgKGVsZW1lbnQgPT0gbnVsbCkgcmV0dXJuXG4gICAgICAgIGlmIChlbGVtZW50LnR5cGUgPT09ICdFeHBlcmltZW50YWxSZXN0UHJvcGVydHknIHx8IGVsZW1lbnQudHlwZSA9PT0gJ1Jlc3RFbGVtZW50Jykge1xuICAgICAgICAgIGNhbGxiYWNrKGVsZW1lbnQuYXJndW1lbnQpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUoZWxlbWVudCwgY2FsbGJhY2spXG4gICAgICB9KVxuICAgICAgYnJlYWtcblxuICAgIGNhc2UgJ0Fzc2lnbm1lbnRQYXR0ZXJuJzpcbiAgICAgIGNhbGxiYWNrKHBhdHRlcm4ubGVmdClcbiAgICAgIGJyZWFrXG4gIH1cbn1cblxuLyoqXG4gKiBkb24ndCBob2xkIGZ1bGwgY29udGV4dCBvYmplY3QgaW4gbWVtb3J5LCBqdXN0IGdyYWIgd2hhdCB3ZSBuZWVkLlxuICovXG5mdW5jdGlvbiBjaGlsZENvbnRleHQocGF0aCwgY29udGV4dCkge1xuICBjb25zdCB7IHNldHRpbmdzLCBwYXJzZXJPcHRpb25zLCBwYXJzZXJQYXRoIH0gPSBjb250ZXh0XG4gIHJldHVybiB7XG4gICAgc2V0dGluZ3MsXG4gICAgcGFyc2VyT3B0aW9ucyxcbiAgICBwYXJzZXJQYXRoLFxuICAgIHBhdGgsXG4gIH1cbn1cblxuXG4vKipcbiAqIHNvbWV0aW1lcyBsZWdhY3kgc3VwcG9ydCBpc24ndCBfdGhhdF8gaGFyZC4uLiByaWdodD9cbiAqL1xuZnVuY3Rpb24gbWFrZVNvdXJjZUNvZGUodGV4dCwgYXN0KSB7XG4gIGlmIChTb3VyY2VDb2RlLmxlbmd0aCA+IDEpIHtcbiAgICAvLyBFU0xpbnQgM1xuICAgIHJldHVybiBuZXcgU291cmNlQ29kZSh0ZXh0LCBhc3QpXG4gIH0gZWxzZSB7XG4gICAgLy8gRVNMaW50IDQsIDVcbiAgICByZXR1cm4gbmV3IFNvdXJjZUNvZGUoeyB0ZXh0LCBhc3QgfSlcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGEgZ2l2ZW4gbm9kZSBpcyBleHBvcnRzLCBtb2R1bGUuZXhwb3J0cywgb3IgbW9kdWxlWydleHBvcnRzJ11cbiAqIEBwYXJhbSB7bm9kZX0gbm9kZVxuICogQHJldHVybiB7Ym9vbGVhbn1cbiAqL1xuZnVuY3Rpb24gaXNDb21tb25qc0V4cG9ydHNPYmplY3Qobm9kZSkge1xuICAvLyBleHBvcnRzXG4gIGlmIChub2RlLnR5cGUgPT09ICdJZGVudGlmaWVyJyAmJiBub2RlLm5hbWUgPT09ICdleHBvcnRzJykgcmV0dXJuIHRydWVcblxuICBpZiAobm9kZS50eXBlICE9PSAnTWVtYmVyRXhwcmVzc2lvbicpIHJldHVybiBmYWxzZVxuXG4gIGlmIChub2RlLm9iamVjdC50eXBlID09PSAnSWRlbnRpZmllcicgJiYgbm9kZS5vYmplY3QubmFtZSA9PT0gJ21vZHVsZScpIHtcbiAgICAvLyBtb2R1bGUuZXhwb3J0c1xuICAgIGlmIChub2RlLnByb3BlcnR5LnR5cGUgPT09ICdJZGVudGlmaWVyJyAmJiBub2RlLnByb3BlcnR5Lm5hbWUgPT09ICdleHBvcnRzJykgcmV0dXJuIHRydWVcblxuICAgIC8vIG1vZHVsZVsnZXhwb3J0cyddXG4gICAgaWYgKG5vZGUucHJvcGVydHkudHlwZSA9PT0gJ0xpdGVyYWwnICYmIG5vZGUucHJvcGVydHkudmFsdWUgPT09ICdleHBvcnRzJykgcmV0dXJuIHRydWVcbiAgfVxuXG4gIHJldHVybiBmYWxzZVxufVxuIl19