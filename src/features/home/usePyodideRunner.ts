import { useEffect, useState } from 'react';
import { VI_MESSAGES } from '../../content/messages';

export type RuntimeStatus = 'loading' | 'ready' | 'running' | 'error';

type PyodideInterface = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (message: string) => void }) => void;
  setStderr: (options: { batched: (message: string) => void }) => void;
};

type RunResult = {
  kind: 'success' | 'error';
  output: string;
};

declare global {
  interface Window {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

const PYODIDE_VERSION = 'v0.29.4';
const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<PyodideInterface> | null = null;
const STANDALONE_OPERATOR_HINTS: Record<string, string> = {
  '!=': 'Toán tử `!=` không thể đứng một mình. Hãy dùng ví dụ như `print(3 != 4)` hoặc `if a != b:`.',
  '==': 'Toán tử `==` không thể đứng một mình. Hãy dùng ví dụ như `print(3 == 4)` hoặc `if a == b:`.',
  '>': 'Toán tử `>` không thể đứng một mình. Hãy dùng ví dụ như `print(5 > 3)` hoặc `if a > b:`.',
  '<': 'Toán tử `<` không thể đứng một mình. Hãy dùng ví dụ như `print(2 < 7)` hoặc `if a < b:`.',
  '>=': 'Toán tử `>=` không thể đứng một mình. Hãy dùng ví dụ như `print(5 >= 3)` hoặc `if a >= b:`.',
  '<=': 'Toán tử `<=` không thể đứng một mình. Hãy dùng ví dụ như `print(2 <= 7)` hoặc `if a <= b:`.',
};

function getStandaloneOperatorHint(code: string) {
  return STANDALONE_OPERATOR_HINTS[code.trim()] ?? null;
}

function isMobileLikeDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || navigator.vendor || '';
  const isTouchMobileUa =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const hasSmallViewport = window.matchMedia?.('(max-width: 768px)').matches ?? false;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const lowMemoryDevice = typeof deviceMemory === 'number' ? deviceMemory <= 4 : false;

  return isTouchMobileUa || (hasSmallViewport && lowMemoryDevice);
}

function loadPyodideScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error(VI_MESSAGES.pyodide.browserOnly));
  }

  if (window.loadPyodide) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-pyodide-runtime="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error(VI_MESSAGES.pyodide.loadRuntimeFailed)),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = `${PYODIDE_BASE_URL}pyodide.js`;
    script.async = true;
    script.dataset.pyodideRuntime = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(VI_MESSAGES.pyodide.loadRuntimeFailed));
    document.head.append(script);
  });
}

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadPyodideScript();

      if (!window.loadPyodide) {
        throw new Error(VI_MESSAGES.pyodide.notReady);
      }

      return window.loadPyodide({
        indexURL: PYODIDE_BASE_URL,
      });
    })();
  }

  return pyodidePromise;
}

function formatRuntimeError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return VI_MESSAGES.pyodide.runtimeRunFailed;
}

export function usePyodideRunner() {
  const [status, setStatus] = useState<RuntimeStatus>('ready');
  const [startupMessage, setStartupMessage] = useState<string>(VI_MESSAGES.pyodide.lazyReady);
  const [isRuntimeSupported, setIsRuntimeSupported] = useState(true);

  useEffect(() => {
    if (isMobileLikeDevice()) {
      setIsRuntimeSupported(false);
      setStatus('error');
      setStartupMessage(VI_MESSAGES.pyodide.mobileFallback);
      return;
    }

    setIsRuntimeSupported(true);
    setStatus('ready');
    setStartupMessage(VI_MESSAGES.pyodide.lazyReady);
  }, []);

  async function runCode(code: string): Promise<RunResult> {
    if (!isRuntimeSupported) {
      setStatus('error');
      return {
        kind: 'error',
        output: VI_MESSAGES.pyodide.mobileFallback,
      };
    }

    const standaloneOperatorHint = getStandaloneOperatorHint(code);
    if (standaloneOperatorHint) {
      setStatus('ready');
      return {
        kind: 'error',
        output: standaloneOperatorHint,
      };
    }

    setStatus('running');

    try {
      const pyodide = await getPyodide();
      setStartupMessage(VI_MESSAGES.pyodide.runtimeReady);
      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];

      pyodide.setStdout({
        batched: (message) => {
          stdoutChunks.push(message);
        },
      });

      pyodide.setStderr({
        batched: (message) => {
          stderrChunks.push(message);
        },
      });

      const result = await pyodide.runPythonAsync(code);
      const printedOutput = stdoutChunks.filter(Boolean).join('\n').trim();
      const errorOutput = stderrChunks.filter(Boolean).join('\n').trim();
      const resultOutput =
        result === undefined || result === null || String(result).trim() === ''
          ? ''
          : String(result);

      setStatus('ready');

      if (errorOutput) {
        return {
          kind: 'error',
          output: errorOutput,
        };
      }

      if (printedOutput && resultOutput) {
        return {
          kind: 'success',
          output: `${printedOutput}\n${resultOutput}`,
        };
      }

      if (printedOutput || resultOutput) {
        return {
          kind: 'success',
          output: printedOutput || resultOutput,
        };
      }

      return {
        kind: 'success',
        output: VI_MESSAGES.pyodide.noOutput,
      };
    } catch (error: unknown) {
      setStatus('error');
      setStartupMessage(formatRuntimeError(error));

      return {
        kind: 'error',
        output: formatRuntimeError(error),
      };
    }
  }

  return {
    startupMessage,
    status,
    runCode,
  };
}
