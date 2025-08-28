import React, { useCallback, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap } from '@codemirror/view';
import { linter, lintGutter, Diagnostic } from '@codemirror/lint';
import { indentMore } from '@codemirror/commands';
import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  snippetCompletion,
  completionKeymap,
  acceptCompletion,
  completionStatus,
  currentCompletions,
} from '@codemirror/autocomplete';
import { Box, Typography, LinearProgress, Alert } from '@mui/material';
import { useTheme } from '#contexts/ThemeContext';
import { filterCompletions, getContextualCompletions } from './xrm-completions';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLines?: number;
  readOnly?: boolean;
  height?: string | number;
  showLineCount?: boolean;
  onValidation?: (errors: string[], warnings: string[]) => void;
}

const CodeMirrorEditorComponent: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  placeholder = '// Write your JavaScript code here...\n// Type "Xrm" to see available API methods\n// Press Ctrl+Space for autocomplete',
  maxLines = 500,
  readOnly = false,
  height = '400px',
  showLineCount = true,
  onValidation,
}) => {
  const { isDarkMode } = useTheme();
  const [lineCount, setLineCount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const xrmCompletions = useCallback((context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[\w.]*$/);
    const wordText = word ? word.text : '';
    const wordFrom = word ? word.from : context.pos;
    if (!word && !context.explicit) return null;

    // Get the line up to the cursor to understand context
    const line = context.state.doc.lineAt(context.pos);
    const lineText = line.text.slice(0, context.pos - line.from);

    // Determine if we're in a specific context (e.g., after "Xrm.")
    const dotMatch = lineText.match(/([\w.]+)\.$/);
    let completions;

    if (dotMatch) {
      // We're completing after a dot, get contextual completions
      const contextPath = dotMatch[1];
      completions = getContextualCompletions(contextPath + '.');
    } else {
      // General completions
      completions = filterCompletions(wordText, 30);
    }

    if (completions.length === 0) return null;

    // Convert our completion items to CodeMirror format
    const options = completions.map(completion => {
      const option: any = {
        label: completion.label,
        type: completion.type,
        info: completion.info,
        detail: completion.detail,
      };

      // Add snippet support for methods with parameters
      if (completion.insertText && completion.insertText.includes('${')) {
        return snippetCompletion(completion.insertText, {
          label: completion.label,
          type: completion.type,
          info: completion.info,
          detail: completion.detail,
        });
      }

      // For methods without parameters, add parentheses
      if (completion.type === 'method' && completion.label.endsWith('()')) {
        option.apply = completion.label;
      }

      return option;
    });

    return {
      from: wordFrom,
      options,
      validFor: /^[\w.]*$/,
    };
  }, []);

  // Create a custom linter for JavaScript validation without eval
  const createJavaScriptLinter = useCallback(() => {
    return linter(view => {
      const code = view.state.doc.toString();
      const diagnostics: Diagnostic[] = [];

      // Basic syntax checks without eval
      const lines = code.split('\n');

      // Check for mismatched braces, parentheses, brackets
      let braceCount = 0;
      let parenCount = 0;
      let bracketCount = 0;
      let inString = false;
      let stringChar = '';

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];

        for (let charIndex = 0; charIndex < line.length; charIndex++) {
          const char = line[charIndex];
          const prevChar = charIndex > 0 ? line[charIndex - 1] : '';

          // Handle string states
          if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
              stringChar = '';
            }
          }

          // Count brackets/braces/parens only outside strings
          if (!inString) {
            if (char === '{') braceCount++;
            else if (char === '}') braceCount--;
            else if (char === '(') parenCount++;
            else if (char === ')') parenCount--;
            else if (char === '[') bracketCount++;
            else if (char === ']') bracketCount--;
          }
        }
      }

      // Report mismatched brackets
      if (braceCount !== 0) {
        diagnostics.push({
          from: 0,
          to: code.length,
          severity: 'error',
          message: braceCount > 0 ? 'Missing closing brace(s)' : 'Extra closing brace(s)',
        });
      }

      if (parenCount !== 0) {
        diagnostics.push({
          from: 0,
          to: code.length,
          severity: 'error',
          message: parenCount > 0 ? 'Missing closing parenthesis' : 'Extra closing parenthesis',
        });
      }

      if (bracketCount !== 0) {
        diagnostics.push({
          from: 0,
          to: code.length,
          severity: 'error',
          message: bracketCount > 0 ? 'Missing closing bracket(s)' : 'Extra closing bracket(s)',
        });
      }

      // Check for dangerous patterns
      const dangerousPatterns = [
        { pattern: /eval\s*\(/g, message: 'eval() function usage detected' },
        { pattern: /Function\s*\(/g, message: 'Function constructor usage detected' },
        { pattern: /setTimeout\s*\(/g, message: 'setTimeout() usage detected' },
        { pattern: /setInterval\s*\(/g, message: 'setInterval() usage detected' },
        { pattern: /document\.write/g, message: 'document.write() usage detected' },
        { pattern: /innerHTML\s*=/g, message: 'innerHTML assignment detected' },
        { pattern: /outerHTML\s*=/g, message: 'outerHTML assignment detected' },
      ];

      dangerousPatterns.forEach(({ pattern, message }) => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          diagnostics.push({
            from: match.index,
            to: match.index + match[0].length,
            severity: 'warning',
            message: `Potentially unsafe pattern: ${message}`,
          });
        }
      });

      return diagnostics;
    });
  }, []);

  // CodeMirror extensions
  const extensions = [
    javascript(),
    createJavaScriptLinter(),
    lintGutter(),
    autocompletion({
      override: [xrmCompletions],
      activateOnTyping: true,
      maxRenderedOptions: 30,
      defaultKeymap: true, // Enable default keymap which includes Enter
      closeOnBlur: false,
      icons: true,
    }),
    keymap.of([
      {
        key: 'Tab',
        run: indentMore, // Tab always indents, never accepts completion
      },
    ]),
    EditorView.theme({
      '&': {
        fontSize: '14px',
        fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
        height: '100%',
      },
      '.cm-content': {
        padding: '12px',
        minHeight: '200px',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor': {
        borderRadius: '4px',
        height: '100%',
        maxHeight: typeof height === 'string' ? height : `${height}px`,
      },
      '.cm-scroller': {
        fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
        overflow: 'auto',
        maxHeight: typeof height === 'string' ? height : `${height}px`,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(128, 128, 128, 0.5) rgba(128, 128, 128, 0.1)',
      },
      '.cm-scroller::-webkit-scrollbar': {
        width: '12px',
        height: '12px',
      },
      '.cm-scroller::-webkit-scrollbar-track': {
        background: 'rgba(128, 128, 128, 0.1)',
        borderRadius: '6px',
      },
      '.cm-scroller::-webkit-scrollbar-thumb': {
        background: 'rgba(128, 128, 128, 0.5)',
        borderRadius: '6px',
        border: '2px solid transparent',
        backgroundClip: 'content-box',
      },
      '.cm-scroller::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(128, 128, 128, 0.7)',
        backgroundClip: 'content-box',
      },
      '.cm-scroller::-webkit-scrollbar-corner': {
        background: 'transparent',
      },
      '.cm-lintRange-error': {
        textDecoration: 'underline wavy red',
      },
      '.cm-lintRange-warning': {
        textDecoration: 'underline wavy orange',
      },
      '.cm-tooltip-autocomplete': {
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        maxHeight: '300px',
        minWidth: '350px',
      },
      '.cm-completionIcon': {
        fontSize: '14px',
        marginRight: '8px',
        width: '16px',
        textAlign: 'center',
      },
      '.cm-completionIcon-namespace': {
        '&:before': { content: '"📦"' },
      },
      '.cm-completionIcon-object': {
        '&:before': { content: '"🏷️"' },
      },
      '.cm-completionIcon-method': {
        '&:before': { content: '"⚡"' },
      },
      '.cm-completionIcon-property': {
        '&:before': { content: '"🔧"' },
      },
      '.cm-completionIcon-function': {
        '&:before': { content: '"🔨"' },
      },
      '.cm-completionIcon-interface': {
        '&:before': { content: '"📋"' },
      },
      '.cm-completionIcon-enum': {
        '&:before': { content: '"🔢"' },
      },
      '.cm-completionLabel': {
        fontFamily: '"Consolas", "Monaco", "Courier New", monospace',
        fontSize: '13px',
      },
      '.cm-completionDetail': {
        fontSize: '11px',
        opacity: '0.8',
        marginLeft: 'auto',
        fontStyle: 'italic',
      },
      '.cm-completionInfo': {
        padding: '8px',
        fontSize: '12px',
        maxWidth: '300px',
        lineHeight: '1.4',
      },
    }),
    EditorView.lineWrapping,
    // Force specific height and scrolling
    EditorView.theme({
      '.cm-editor.cm-focused': {
        outline: 'none',
      },
    }),
  ];

  // Simple validation for line count and dangerous patterns only
  useEffect(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const lines = value.split('\n');

    // Update line count
    setLineCount(lines.length);

    // Check line count
    if (lines.length > maxLines) {
      errors.push(`Code exceeds maximum of ${maxLines} lines (current: ${lines.length})`);
    }

    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\s*\(/, message: 'eval() function usage detected' },
      { pattern: /Function\s*\(/, message: 'Function constructor usage detected' },
      { pattern: /setTimeout\s*\(/, message: 'setTimeout() usage detected' },
      { pattern: /setInterval\s*\(/, message: 'setInterval() usage detected' },
      { pattern: /document\.write/, message: 'document.write() usage detected' },
      { pattern: /innerHTML\s*=/, message: 'innerHTML assignment detected' },
      { pattern: /outerHTML\s*=/, message: 'outerHTML assignment detected' },
    ];

    dangerousPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(value)) {
        warnings.push(`Potentially unsafe pattern: ${message}`);
      }
    });

    setValidationErrors(errors);
    setValidationWarnings(warnings);

    if (onValidation) {
      onValidation(errors, warnings);
    }
  }, [value, maxLines]);

  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  const getLineCountColor = () => {
    if (lineCount > maxLines) return 'error.main';
    if (lineCount > maxLines * 0.8) return 'warning.main';
    return 'text.secondary';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with line count and validation status */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
          JavaScript Code Editor
        </Typography>
        {showLineCount && (
          <Typography
            variant='caption'
            sx={{
              color: getLineCountColor(),
              fontFamily: 'monospace',
              fontWeight: lineCount > maxLines ? 'bold' : 'normal',
            }}
          >
            {lineCount} / {maxLines} lines
          </Typography>
        )}
      </Box>

      {/* Progress bar for line count */}
      {showLineCount && (
        <LinearProgress
          variant='determinate'
          value={Math.min((lineCount / maxLines) * 100, 100)}
          sx={{
            mb: 1,
            height: 4,
            borderRadius: 2,
            '& .MuiLinearProgress-bar': {
              backgroundColor:
                lineCount > maxLines
                  ? 'error.main'
                  : lineCount > maxLines * 0.8
                    ? 'warning.main'
                    : 'primary.main',
            },
          }}
        />
      )}

      {/* Validation messages */}
      {validationErrors.length > 0 && (
        <Alert severity='error' sx={{ mb: 1, fontSize: '0.75rem' }}>
          <Typography variant='caption' component='div'>
            {validationErrors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </Typography>
        </Alert>
      )}

      {validationWarnings.length > 0 && (
        <Alert severity='warning' sx={{ mb: 1, fontSize: '0.75rem' }}>
          <Typography variant='caption' component='div'>
            {validationWarnings.map((warning, index) => (
              <div key={index}>• {warning}</div>
            ))}
          </Typography>
        </Alert>
      )}

      {/* CodeMirror Editor */}
      <Box
        sx={{
          flex: 1,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
          ...(height === '100%'
            ? {
                height: '100%',
                minHeight: '300px',
                maxHeight: '100%',
              }
            : {
                height: typeof height === 'string' ? height : `${height}px`,
                maxHeight: typeof height === 'string' ? height : `${height}px`,
              }),
          '& .cm-editor': {
            height: '100% !important',
            maxHeight: '100% !important',
          },
          '& .cm-focused': {
            outline: 'none',
          },
          '& .cm-scroller': {
            height: '100% !important',
            maxHeight: '100% !important',
            overflow: 'auto !important',
            scrollbarWidth: 'thin !important',
            scrollbarColor: 'rgba(128, 128, 128, 0.5) rgba(128, 128, 128, 0.1) !important',
          },
          '& .cm-scroller::-webkit-scrollbar': {
            width: '14px !important',
            height: '14px !important',
            display: 'block !important',
          },
          '& .cm-scroller::-webkit-scrollbar-track': {
            background: 'rgba(128, 128, 128, 0.1) !important',
            borderRadius: '7px !important',
          },
          '& .cm-scroller::-webkit-scrollbar-thumb': {
            background: 'rgba(128, 128, 128, 0.5) !important',
            borderRadius: '7px !important',
            border: '2px solid transparent !important',
            backgroundClip: 'content-box !important',
          },
          '& .cm-scroller::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(128, 128, 128, 0.8) !important',
          },
          '& .cm-scroller::-webkit-scrollbar-corner': {
            background: 'transparent !important',
          },
        }}
      >
        <CodeMirror
          value={value}
          height={typeof height === 'string' ? height : `${height}px`}
          theme={isDarkMode ? oneDark : 'light'}
          extensions={extensions}
          onChange={handleChange}
          placeholder={placeholder}
          readOnly={readOnly}
          basicSetup={{
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            syntaxHighlighting: true,
            lineNumbers: true,
            foldGutter: true,
            dropCursor: false,
            allowMultipleSelections: false,
            indentOnInput: false, // Disable auto-indent to prevent Tab conflicts
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: false, // Disable basic autocompletion since we're using custom extensions
            highlightSelectionMatches: false,
            searchKeymap: true,
            tabSize: 2, // Set explicit tab size
          }}
          style={{
            height: typeof height === 'string' ? height : `${height}px`,
            maxHeight: typeof height === 'string' ? height : `${height}px`,
            overflow: 'auto',
          }}
        />
      </Box>

      {/* Footer with helpful tips */}
      {!readOnly && (
        <Box sx={{ mt: 1 }}>
          <Typography variant='caption' sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            💡 Press Ctrl+Space for autocomplete • Use Enter or click to accept suggestions • Type
            "Xrm." for full API • Supports snippets and parameter hints • Available: Xrm,
            formContext, console, document
          </Typography>
        </Box>
      )}
    </Box>
  );
};

const CodeMirrorEditor = React.memo(CodeMirrorEditorComponent);

export default CodeMirrorEditor;
