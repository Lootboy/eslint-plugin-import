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

      // return if it's not a commonjs require statement
      if (call.callee.type !== 'Identifier') return;
      if (call.callee.name !== 'require') return;
      if (call.arguments.length !== 1) return;

      const source = call.arguments[0];
      const variableImports = node.id.properties;
      const variableExports = _ExportMap2.default.get(source.value, context, { useCommonjsExports });

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uYW1lZC5qcyJdLCJuYW1lcyI6WyJwYXRoIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsInNjaGVtYSIsInByb3BlcnRpZXMiLCJjb21tb25qcyIsIm9uZU9mIiwicmVxdWlyZSIsImFkZGl0aW9uYWxQcm9wZXJ0aWVzIiwiY3JlYXRlIiwiY29udGV4dCIsIm9wdGlvbnMiLCJ1c2VDb21tb25qc0V4cG9ydHMiLCJjaGVja1NwZWNpZmllcnMiLCJrZXkiLCJub2RlIiwic291cmNlIiwiaW1wb3J0S2luZCIsImV4cG9ydEtpbmQiLCJzcGVjaWZpZXJzIiwic29tZSIsImltIiwiZXhwb3J0c09wdGlvbnMiLCJub0ludGVyb3AiLCJpbXBvcnRzIiwiRXhwb3J0cyIsImdldCIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwiZm9yRWFjaCIsImRlZXBMb29rdXAiLCJoYXNEZWVwIiwibmFtZSIsImZvdW5kIiwiZGVlcFBhdGgiLCJtYXAiLCJpIiwicmVsYXRpdmUiLCJkaXJuYW1lIiwiZ2V0RmlsZW5hbWUiLCJqb2luIiwicmVwb3J0IiwiY2hlY2tSZXF1aXJlIiwiaWQiLCJpbml0IiwiY2FsbCIsImNhbGxlZSIsImFyZ3VtZW50cyIsInZhcmlhYmxlSW1wb3J0cyIsInZhcmlhYmxlRXhwb3J0cyIsImJpbmQiXSwibWFwcGluZ3MiOiJhQUFBLDRCLElBQVlBLEk7QUFDWix5QztBQUNBLHFDOztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTSxTQURGO0FBRUpDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxPQUFSLENBREQsRUFGRjs7QUFLSkMsWUFBUyxDQUFDO0FBQ1JILFlBQU0sUUFERTtBQUVSSSxrQkFBWTtBQUNWQyxrQkFBVTtBQUNSQyxpQkFBTztBQUNMLFlBQUVOLE1BQU0sU0FBUixFQURLO0FBRUw7QUFDRUEsa0JBQU0sUUFEUjtB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akIsRUFBUDs7O0FBY0QsR0F4SmMsRUFBakIiLCJmaWxlIjoibmFtZWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnXG5pbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9FeHBvcnRNYXAnXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgbWV0YToge1xuICAgIHR5cGU6ICdwcm9ibGVtJyxcbiAgICBkb2NzOiB7XG4gICAgICB1cmw6IGRvY3NVcmwoJ25hbWVkJyksXG4gICAgfSxcbiAgICBzY2hlbWEgOiBbe1xuICAgICAgdHlwZTogJ29iamVjdCcsXG4gICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGNvbW1vbmpzOiB7XG4gICAgICAgICAgb25lT2Y6IFtcbiAgICAgICAgICAgIHsgdHlwZTogJ2Jvb2xlYW4nIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHR5cGU6ICdvYmplY3QnLFxuICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgcmVxdWlyZTogeyB0eXBlOiAnYm9vbGVhbicgfSxcbiAgICAgICAgICAgICAgICBleHBvcnRzOiB7IHR5cGU6ICdib29sZWFuJyB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGFkZGl0aW9uYWxQcm9wZXJ0aWVzOiBmYWxzZSxcbiAgICB9XSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgY29uc3Qgb3B0aW9ucyA9IGNvbnRleHQub3B0aW9uc1swXSB8fCB7fVxuICAgIGNvbnN0IHsgY29tbW9uanMgPSB7fSB9ID0gb3B0aW9uc1xuICAgIGNvbnN0IHVzZUNvbW1vbmpzRXhwb3J0cyA9IHR5cGVvZiBjb21tb25qcyA9PT0gJ2Jvb2xlYW4nID8gY29tbW9uanMgOiBjb21tb25qcy5leHBvcnRzXG5cbiAgICBmdW5jdGlvbiBjaGVja1NwZWNpZmllcnMoa2V5LCB0eXBlLCBub2RlKSB7XG4gICAgICAvLyBpZ25vcmUgbG9jYWwgZXhwb3J0cyBhbmQgdHlwZSBpbXBvcnRzL2V4cG9ydHNcbiAgICAgIGlmIChub2RlLnNvdXJjZSA9PSBudWxsIHx8IG5vZGUuaW1wb3J0S2luZCA9PT0gJ3R5cGUnIHx8XG4gICAgICAgICAgbm9kZS5pbXBvcnRLaW5kID09PSAndHlwZW9mJyAgfHwgbm9kZS5leHBvcnRLaW5kID09PSAndHlwZScpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmICghbm9kZS5zcGVjaWZpZXJzXG4gICAgICAgICAgICAuc29tZShmdW5jdGlvbiAoaW0pIHsgcmV0dXJuIGltLnR5cGUgPT09IHR5cGUgfSkpIHtcbiAgICAgICAgcmV0dXJuIC8vIG5vIG5hbWVkIGltcG9ydHMvZXhwb3J0c1xuICAgICAgfVxuXG4gICAgICBjb25zdCBleHBvcnRzT3B0aW9ucyA9IHtcbiAgICAgICAgdXNlQ29tbW9uanNFeHBvcnRzLFxuICAgICAgICBub0ludGVyb3A6IGZhbHNlLCAvLyB0aGlzIHNob3VsZCBvbmx5IGJlIHRydWUgd2hlbiB1c2luZyByZXF1aXJlKCkgY2FsbHNcbiAgICAgIH1cblxuICAgICAgY29uc3QgaW1wb3J0cyA9IEV4cG9ydHMuZ2V0KG5vZGUuc291cmNlLnZhbHVlLCBjb250ZXh0LCBleHBvcnRzT3B0aW9ucylcbiAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVyblxuXG4gICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBub2RlLnNwZWNpZmllcnMuZm9yRWFjaChmdW5jdGlvbiAoaW0pIHtcbiAgICAgICAgaWYgKGltLnR5cGUgIT09IHR5cGUpIHJldHVyblxuXG4gICAgICAgIC8vIGlnbm9yZSB0eXBlIGltcG9ydHNcbiAgICAgICAgaWYgKGltLmltcG9ydEtpbmQgPT09ICd0eXBlJyB8fCBpbS5pbXBvcnRLaW5kID09PSAndHlwZW9mJykgcmV0dXJuXG5cbiAgICAgICAgY29uc3QgZGVlcExvb2t1cCA9IGltcG9ydHMuaGFzRGVlcChpbVtrZXldLm5hbWUpXG5cbiAgICAgICAgaWYgKCFkZWVwTG9va3VwLmZvdW5kKSB7XG4gICAgICAgICAgaWYgKGRlZXBMb29rdXAucGF0aC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBjb25zdCBkZWVwUGF0aCA9IGRlZXBMb29rdXAucGF0aFxuICAgICAgICAgICAgICAubWFwKGkgPT4gcGF0aC5yZWxhdGl2ZShwYXRoLmRpcm5hbWUoY29udGV4dC5nZXRGaWxlbmFtZSgpKSwgaS5wYXRoKSlcbiAgICAgICAgICAgICAgLmpvaW4oJyAtPiAnKVxuXG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbVtrZXldLFxuICAgICAgICAgICAgICBgJHtpbVtrZXldLm5hbWV9IG5vdCBmb3VuZCB2aWEgJHtkZWVwUGF0aH1gKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbVtrZXldLFxuICAgICAgICAgICAgICBpbVtrZXldLm5hbWUgKyAnIG5vdCBmb3VuZCBpbiBcXCcnICsgbm9kZS5zb3VyY2UudmFsdWUgKyAnXFwnJylcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2hlY2tSZXF1aXJlKG5vZGUpIHtcbiAgICAgICAgaWYgKCFvcHRpb25zLmNvbW1vbmpzKSByZXR1cm5cblxuICAgICAgICBpZiAobm9kZS50eXBlICE9PSAnVmFyaWFibGVEZWNsYXJhdG9yJykgcmV0dXJuXG5cbiAgICAgICAgaWYgKCFub2RlLmlkIHx8IG5vZGUuaWQudHlwZSAhPT0gJ09iamVjdFBhdHRlcm4nIHx8IG5vZGUuaWQucHJvcGVydGllcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAvLyByZXR1cm4gaWYgaXQncyBub3QgYW4gb2JqZWN0IGRlc3RydWN0dXJlIG9yIGl0J3MgYW4gZW1wdHkgb2JqZWN0IGRlc3RydWN0dXJlXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIW5vZGUuaW5pdCB8fCBub2RlLmluaXQudHlwZSAhPT0gJ0NhbGxFeHByZXNzaW9uJykge1xuICAgICAgICAgIC8vIHJldHVybiBpZiB0aGVyZSBpcyBubyBjYWxsIGV4cHJlc3Npb24gb24gdGhlIHJpZ2h0IHNpZGVcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNhbGwgPSBub2RlLmluaXRcblxuICAgICAgICAvLyByZXR1cm4gaWYgaXQncyBub3QgYSBjb21tb25qcyByZXF1aXJlIHN0YXRlbWVudFxuICAgICAgICBpZiAoY2FsbC5jYWxsZWUudHlwZSAhPT0gJ0lkZW50aWZpZXInKSByZXR1cm5cbiAgICAgICAgaWYgKGNhbGwuY2FsbGVlLm5hbWUgIT09ICdyZXF1aXJlJykgcmV0dXJuXG4gICAgICAgIGlmIChjYWxsLmFyZ3VtZW50cy5sZW5ndGggIT09IDEpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHNvdXJjZSA9IGNhbGwuYXJndW1lbnRzWzBdXG4gICAgICAgIGNvbnN0IHZhcmlhYmxlSW1wb3J0cyA9IG5vZGUuaWQucHJvcGVydGllc1xuICAgICAgICBjb25zdCB2YXJpYWJsZUV4cG9ydHMgPSBFeHBvcnRzLmdldChzb3VyY2UudmFsdWUsIGNvbnRleHQsIHsgdXNlQ29tbW9uanNFeHBvcnRzIH0pXG5cbiAgICAgICAgLy8gcmV0dXJuIGlmIGl0J3Mgbm90IGEgc3RyaW5nIHNvdXJjZVxuICAgICAgICBpZiAoc291cmNlLnR5cGUgIT09ICdMaXRlcmFsJykgcmV0dXJuXG5cbiAgICAgICAgaWYgKHZhcmlhYmxlRXhwb3J0cyA9PSBudWxsKSByZXR1cm5cblxuICAgICAgICBpZiAodmFyaWFibGVFeHBvcnRzLmVycm9ycy5sZW5ndGgpIHtcbiAgICAgICAgICB2YXJpYWJsZUV4cG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cblxuICAgICAgICB2YXJpYWJsZUltcG9ydHMuZm9yRWFjaChmdW5jdGlvbiAoaW0pIHtcbiAgICAgICAgICBpZiAoaW0udHlwZSAhPT0gJ1Byb3BlcnR5JykgcmV0dXJuXG4gICAgICAgICAgaWYgKCFpbS5rZXkgfHwgaW0ua2V5LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG5cbiAgICAgICAgICBjb25zdCBkZWVwTG9va3VwID0gdmFyaWFibGVFeHBvcnRzLmhhc0RlZXAoaW0ua2V5Lm5hbWUpXG5cbiAgICAgICAgICBpZiAoIWRlZXBMb29rdXAuZm91bmQpIHtcbiAgICAgICAgICAgIGlmIChkZWVwTG9va3VwLnBhdGgubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICBjb25zdCBkZWVwUGF0aCA9IGRlZXBMb29rdXAucGF0aFxuICAgICAgICAgICAgICAgIC5tYXAoaSA9PiBwYXRoLnJlbGF0aXZlKHBhdGguZGlybmFtZShjb250ZXh0LmdldEZpbGVuYW1lKCkpLCBpLnBhdGgpKVxuICAgICAgICAgICAgICAgIC5qb2luKCcgLT4gJylcblxuICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydChpbS5rZXksXG4gICAgICAgICAgICAgICAgYCR7aW0ua2V5Lm5hbWV9IG5vdCBmb3VuZCB2aWEgJHtkZWVwUGF0aH1gKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY29udGV4dC5yZXBvcnQoaW0ua2V5LFxuICAgICAgICAgICAgICAgIGltLmtleS5uYW1lICsgJyBub3QgZm91bmQgaW4gXFwnJyArIHNvdXJjZS52YWx1ZSArICdcXCcnKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ0ltcG9ydERlY2xhcmF0aW9uJzogY2hlY2tTcGVjaWZpZXJzLmJpbmQoIG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLCAnaW1wb3J0ZWQnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgJ0ltcG9ydFNwZWNpZmllcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSxcblxuICAgICAgJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nOiBjaGVja1NwZWNpZmllcnMuYmluZCggbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgJ2xvY2FsJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICwgJ0V4cG9ydFNwZWNpZmllcidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApLFxuXG4gICAgICAnVmFyaWFibGVEZWNsYXJhdG9yJzogY2hlY2tSZXF1aXJlLFxuICAgIH1cblxuICB9LFxufVxuIl19