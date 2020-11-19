'use strict';var _path = require('path');var path = _interopRequireWildcard(_path);
var _ExportMap = require('../ExportMap');var _ExportMap2 = _interopRequireDefault(_ExportMap);
var _docsUrl = require('../docsUrl');var _docsUrl2 = _interopRequireDefault(_docsUrl);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];}}newObj.default = obj;return newObj;}}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('named') },

    schema: [{
      type: 'object',
      properties: {
        commonjs: {
          oneOf: [
          { type: 'boolean' },
          {
            type: 'object',
            properties: {
              require: { type: 'boolean' },
              exports: { type: 'boolean' } } }] } },





      additionalProperties: false }] },



  create: function (context) {
    const options = context.options[0] || {};var _options$commonjs =
    options.commonjs;const commonjs = _options$commonjs === undefined ? {} : _options$commonjs;
    const useCommonjsExports = typeof commonjs === 'boolean' ? commonjs : commonjs.exports;

    function checkSpecifiers(key, type, node) {
      // ignore local exports and type imports/exports
      if (node.source == null || node.importKind === 'type' ||
      node.importKind === 'typeof' || node.exportKind === 'type') {
        return;
      }

      if (!node.specifiers.
      some(function (im) {return im.type === type;})) {
        return; // no named imports/exports
      }

      const exportsOptions = {
        useCommonjsExports,
        noInterop: false // this should only be true when using require() calls
      };

      const imports = _ExportMap2.default.get(node.source.value, context, exportsOptions);
      if (imports == null) return;

      if (imports.errors.length) {
        imports.reportErrors(context, node);
        return;
      }

      node.specifiers.forEach(function (im) {
        if (im.type !== type) return;

        // ignore type imports
        if (im.importKind === 'type' || im.importKind === 'typeof') return;

        const deepLookup = imports.hasDeep(im[key].name);

        if (!deepLookup.found) {
          if (deepLookup.path.length > 1) {
            const deepPath = deepLookup.path.
            map(i => path.relative(path.dirname(context.getFilename()), i.path)).
            join(' -> ');

            context.report(im[key],
            `${im[key].name} not found via ${deepPath}`);
          } else {
            context.report(im[key],
            im[key].name + ' not found in \'' + node.source.value + '\'');
          }
        }
      });
    }

    function checkRequire(node) {
      if (!options.commonjs) return;

      if (node.type !== 'VariableDeclarator') return;

      if (!node.id || node.id.type !== 'ObjectPattern' || node.id.properties.length === 0) {
        // return if it's not an object destructure or it's an empty object destructure
        return;
      }

      if (!node.init || node.init.type !== 'CallExpression') {
        // return if there is no call expression on the right side
        return;
      }

      const call = node.init;
      const source = call.arguments[0];
      const variableImports = node.id.properties;
      const variableExports = _ExportMap2.default.get(source.value, context);

      // return if it's not a commonjs require statement
      if (call.callee.type !== 'Identifier') return;
      if (call.callee.name !== 'require') return;
      if (call.arguments.length !== 1) return;

      // return if it's not a string source
      if (source.type !== 'Literal') return;

      if (variableExports == null) return;

      if (variableExports.errors.length) {
        variableExports.reportErrors(context, node);
        return;
      }

      variableImports.forEach(function (im) {
        if (im.type !== 'Property') return;
        if (!im.key || im.key.type !== 'Identifier') return;

        const deepLookup = variableExports.hasDeep(im.key.name);

        if (!deepLookup.found) {
          if (deepLookup.path.length > 1) {
            const deepPath = deepLookup.path.
            map(i => path.relative(path.dirname(context.getFilename()), i.path)).
            join(' -> ');

            context.report(im.key,
            `${im.key.name} not found via ${deepPath}`);
          } else {
            context.report(im.key,
            im.key.name + ' not found in \'' + source.value + '\'');
          }
        }
      });
    }

    return {
      'ImportDeclaration': checkSpecifiers.bind(null,
      'imported',
      'ImportSpecifier'),


      'ExportNamedDeclaration': checkSpecifiers.bind(null,
      'local',
      'ExportSpecifier'),


      'VariableDeclarator': checkRequire };


  } };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uYW1lZC5qcyJdLCJuYW1lcyI6WyJwYXRoIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsInByb3BlcnRpZXMiLCJjb21tb25qcyIsIm9uZU9mIiwicmVxdWlyZSIsImFkZGl0aW9uYWxQcm9wZXJ0aWVzIiwiY3JlYXRlIiwiY29udGV4dCIsIm9wdGlvbnMiLCJ1c2VDb21tb25qc0V4cG9ydHMiLCJjaGVja1NwZWNpZmllcnMiLCJrZXkiLCJub2RlIiwic291cmNlIiwiaW1wb3J0S2luZCIsImV4cG9ydEtpbmQiLCJzcGVjaWZpZXJzIiwic29tZSIsImltIiwiZXhwb3J0c09wdGlvbnMiLCJub0ludGVyb3AiLCJpbXBvcnRzIiwiRXhwb3J0cyIsImdldCIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwiZm9yRWFjaCIsImRlZXBMb29rdXAiLCJoYXNEZWVwIiwibmFtZSIsImZvdW5kIiwiZGVlcFBhdGgiLCJtYXAiLCJpIiwicmVsYXRpdmUiLCJkaXJuYW1lIiwiZ2V0RmlsZW5hbWUiLCJqb2luIiwicmVwb3J0IiwiY2hlY2tSZXF1aXJlIiwiaWQiLCJpbml0IiwiY2FsbCIsImFyZ3VtZW50cyIsInZhcmlhYmxlSW1wb3J0cyIsInZhcmlhYmxlRXhwb3J0cyIsImNhbGxlZSIsImJpbmQiXSwibWFwcGluZ3MiOiJhQUFBLDRCLElBQVlBLEk7QUFDWix5QztBQUNBLHFDOztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTSxTQURGO0FBRUpDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxPQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUyxDQUFDO0FBQ1JILFlBQU0sUUFERTtBQUVSSSxrQkFBWTtBQUNWQyxrQkFBVTtBQUNSQyxpQkFBTztBQUNMLFlBQUVOLE1BQU0sU0FBUixFQURLO0FBRUw7QUFDRUEsa0JBQU0sUUFEUjtB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QUFqQiIsImZpbGUiOiJuYW1lZC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCdcbmltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCdcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3Byb2JsZW0nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbmFtZWQnKSxcbiAgICB9LFxuICAgIHNjaGVtYSA6IFt7XG4gICAgICB0eXBlOiAnb2JqZWN0JyxcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgY29tbW9uanM6IHtcbiAgICAgICAgICBvbmVPZjogW1xuICAgICAgICAgICAgeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICByZXF1aXJlOiB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgICAgICAgICAgICAgIGV4cG9ydHM6IHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlLFxuICAgIH1dLFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICBjb25zdCBvcHRpb25zID0gY29udGV4dC5vcHRpb25zWzBdIHx8IHt9XG4gICAgY29uc3QgeyBjb21tb25qcyA9IHt9IH0gPSBvcHRpb25zXG4gICAgY29uc3QgdXNlQ29tbW9uanNFeHBvcnRzID0gdHlwZW9mIGNvbW1vbmpzID09PSAnYm9vbGVhbicgPyBjb21tb25qcyA6IGNvbW1vbmpzLmV4cG9ydHNcblxuICAgIGZ1bmN0aW9uIGNoZWNrU3BlY2lmaWVycyhrZXksIHR5cGUsIG5vZGUpIHtcbiAgICAgIC8vIGlnbm9yZSBsb2NhbCBleHBvcnRzIGFuZCB0eXBlIGltcG9ydHMvZXhwb3J0c1xuICAgICAgaWYgKG5vZGUuc291cmNlID09IG51bGwgfHwgbm9kZS5pbXBvcnRLaW5kID09PSAndHlwZScgfHxcbiAgICAgICAgICBub2RlLmltcG9ydEtpbmQgPT09ICd0eXBlb2YnICB8fCBub2RlLmV4cG9ydEtpbmQgPT09ICd0eXBlJykge1xuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKCFub2RlLnNwZWNpZmllcnNcbiAgICAgICAgICAgIC5zb21lKGZ1bmN0aW9uIChpbSkgeyByZXR1cm4gaW0udHlwZSA9PT0gdHlwZSB9KSkge1xuICAgICAgICByZXR1cm4gLy8gbm8gbmFtZWQgaW1wb3J0cy9leHBvcnRzXG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGV4cG9ydHNPcHRpb25zID0ge1xuICAgICAgICB1c2VDb21tb25qc0V4cG9ydHMsXG4gICAgICAgIG5vSW50ZXJvcDogZmFsc2UsIC8vIHRoaXMgc2hvdWxkIG9ubHkgYmUgdHJ1ZSB3aGVuIHVzaW5nIHJlcXVpcmUoKSBjYWxsc1xuICAgICAgfVxuXG4gICAgICBjb25zdCBpbXBvcnRzID0gRXhwb3J0cy5nZXQobm9kZS5zb3VyY2UudmFsdWUsIGNvbnRleHQsIGV4cG9ydHNPcHRpb25zKVxuICAgICAgaWYgKGltcG9ydHMgPT0gbnVsbCkgcmV0dXJuXG5cbiAgICAgIGlmIChpbXBvcnRzLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgaW1wb3J0cy5yZXBvcnRFcnJvcnMoY29udGV4dCwgbm9kZSlcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIG5vZGUuc3BlY2lmaWVycy5mb3JFYWNoKGZ1bmN0aW9uIChpbSkge1xuICAgICAgICBpZiAoaW0udHlwZSAhPT0gdHlwZSkgcmV0dXJuXG5cbiAgICAgICAgLy8gaWdub3JlIHR5cGUgaW1wb3J0c1xuICAgICAgICBpZiAoaW0uaW1wb3J0S2luZCA9PT0gJ3R5cGUnIHx8IGltLmltcG9ydEtpbmQgPT09ICd0eXBlb2YnKSByZXR1cm5cblxuICAgICAgICBjb25zdCBkZWVwTG9va3VwID0gaW1wb3J0cy5oYXNEZWVwKGltW2tleV0ubmFtZSlcblxuICAgICAgICBpZiAoIWRlZXBMb29rdXAuZm91bmQpIHtcbiAgICAgICAgICBpZiAoZGVlcExvb2t1cC5wYXRoLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZXBQYXRoID0gZGVlcExvb2t1cC5wYXRoXG4gICAgICAgICAgICAgIC5tYXAoaSA9PiBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShjb250ZXh0LmdldEZpbGVuYW1lKCkpLCBpLnBhdGgpKVxuICAgICAgICAgICAgICAuam9pbignIC0+ICcpXG5cbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KGltW2tleV0sXG4gICAgICAgICAgICAgIGAke2ltW2tleV0ubmFtZX0gbm90IGZvdW5kIHZpYSAke2RlZXBQYXRofWApXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KGltW2tleV0sXG4gICAgICAgICAgICAgIGltW2tleV0ubmFtZSArICcgbm90IGZvdW5kIGluIFxcJycgKyBub2RlLnNvdXJjZS52YWx1ZSArICdcXCcnKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjaGVja1JlcXVpcmUobm9kZSkge1xuICAgICAgICBpZiAoIW9wdGlvbnMuY29tbW9uanMpIHJldHVyblxuXG4gICAgICAgIGlmIChub2RlLnR5cGUgIT09ICdWYXJpYWJsZURlY2xhcmF0b3InKSByZXR1cm5cblxuICAgICAgICBpZiAoIW5vZGUuaWQgfHwgbm9kZS5pZC50eXBlICE9PSAnT2JqZWN0UGF0dGVybicgfHwgbm9kZS5pZC5wcm9wZXJ0aWVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIC8vIHJldHVybiBpZiBpdCdzIG5vdCBhbiBvYmplY3QgZGVzdHJ1Y3R1cmUgb3IgaXQncyBhbiBlbXB0eSBvYmplY3QgZGVzdHJ1Y3R1cmVcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghbm9kZS5pbml0IHx8IG5vZGUuaW5pdC50eXBlICE9PSAnQ2FsbEV4cHJlc3Npb24nKSB7XG4gICAgICAgICAgLy8gcmV0dXJuIGlmIHRoZXJlIGlzIG5vIGNhbGwgZXhwcmVzc2lvbiBvbiB0aGUgcmlnaHQgc2lkZVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2FsbCA9IG5vZGUuaW5pdFxuICAgICAgICBjb25zdCBzb3VyY2UgPSBjYWxsLmFyZ3VtZW50c1swXVxuICAgICAgICBjb25zdCB2YXJpYWJsZUltcG9ydHMgPSBub2RlLmlkLnByb3BlcnRpZXNcbiAgICAgICAgY29uc3QgdmFyaWFibGVFeHBvcnRzID0gRXhwb3J0cy5nZXQoc291cmNlLnZhbHVlLCBjb250ZXh0KVxuXG4gICAgICAgIC8vIHJldHVybiBpZiBpdCdzIG5vdCBhIGNvbW1vbmpzIHJlcXVpcmUgc3RhdGVtZW50XG4gICAgICAgIGlmIChjYWxsLmNhbGxlZS50eXBlICE9PSAnSWRlbnRpZmllcicpIHJldHVyblxuICAgICAgICBpZiAoY2FsbC5jYWxsZWUubmFtZSAhPT0gJ3JlcXVpcmUnKSByZXR1cm5cbiAgICAgICAgaWYgKGNhbGwuYXJndW1lbnRzLmxlbmd0aCAhPT0gMSkgcmV0dXJuXG5cbiAgICAgICAgLy8gcmV0dXJuIGlmIGl0J3Mgbm90IGEgc3RyaW5nIHNvdXJjZVxuICAgICAgICBpZiAoc291cmNlLnR5cGUgIT09ICdMaXRlcmFsJykgcmV0dXJuXG5cbiAgICAgICAgaWYgKHZhcmlhYmxlRXhwb3J0cyA9PSBudWxsKSByZXR1cm5cblxuICAgICAgICBpZiAodmFyaWFibGVFeHBvcnRzLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICB2YXJpYWJsZUV4cG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICB2YXJpYWJsZUltcG9ydHMuZm9yRWFjaChmdW5jdGlvbiAoaW0pIHtcbiAgICAgICAgICBpZiAoaW0udHlwZSAhPT0gJ1Byb3BlcnR5JykgcmV0dXJuXG4gICAgICAgICAgaWYgKCFpbS5rZXkgfHwgaW0ua2V5LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBkZWVwTG9va3VwID0gdmFyaWFibGVFeHBvcnRzLmhhc0RlZXAoaW0ua2V5Lm5hbWUpXG5cbiAgICAgICAgICBpZiAoIWRlZXBMb29rdXAuZm91bmQpIHtcbiAgICAgICAgICAgIGlmIChkZWVwTG9va3VwLnBhdGgubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICBjb25zdCBkZWVwUGF0aCA9IGRlZXBMb29rdXAucGF0aFxuICAgICAgICAgICAgICAgIC5tYXAoaSA9PiBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShjb250ZXh0LmdldEZpbGVuYW1lKCkpLCBpLnBhdGgpKVxuICAgICAgICAgICAgICAgIC5qb2luKCcgLT4gJylcblxuICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbS5rZXksXG4gICAgICAgICAgICAgICAgYCR7aW0ua2V5Lm5hbWV9IG5vdCBmb3VuZCB2aWEgJHtkZWVwUGF0aH1gKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoaW0ua2V5LFxuICAgICAgICAgICAgICAgIGltLmtleS5uYW1lICsgJyBub3QgZm91bmQgaW4gXFwnJyArIHNvdXJjZS52YWx1ZSArICdcXCcnKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ0ltcG9ydERlY2xhcmF0aW9uJzogY2hlY2tTcGVjaWZpZXJzLmJpbmQoIG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCAnaW1wb3J0ZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgJ0ltcG9ydFNwZWNpZmllcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcblxuICAgICAgJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nOiBjaGVja1NwZWNpZmllcnMuYmluZCggbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgJ2xvY2FsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgJ0V4cG9ydFNwZWNpZmllcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxuXG4gICAgICAnVmFyaWFibGVEZWNsYXJhdG9yJzogY2hlY2tSZXF1aXJlLFxuICAgIH1cblxuICB9LFxufVxuIl19