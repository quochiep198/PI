import { useEffect, useState } from 'react';

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

function loadPyodideScript() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Pyodide chỉ chạy được trong trình duyệt.'));
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
        () => reject(new Error('Không tải được Pyodide runtime.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = `${PYODIDE_BASE_URL}pyodide.js`;
    script.async = true;
    script.dataset.pyodideRuntime = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không tải được Pyodide runtime.'));
    document.head.append(script);
  });
}

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadPyodideScript();

      if (!window.loadPyodide) {
        throw new Error('Pyodide chưa sẵn sàng.');
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

  return 'Đã xảy ra lỗi khi chạy mã Python.';
}

export function usePyodideRunner() {
  const [status, setStatus] = useState<RuntimeStatus>('loading');
  const [startupMessage, setStartupMessage] = useState('Đang khởi tạo Python runtime...');

  useEffect(() => {
    let mounted = true;

    void getPyodide()
      .then(() => {
        if (!mounted) {
          return;
        }

        setStatus('ready');
        setStartupMessage('Python runtime đã sẵn sàng. Hãy nhập mã và nhấn "Chạy mã".');
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }

        setStatus('error');
        setStartupMessage(formatRuntimeError(error));
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function runCode(code: string): Promise<RunResult> {
    setStatus('running');

    try {
      const pyodide = await getPyodide();
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
        output: 'Chương trình chạy thành công nhưng không có dữ liệu được in ra.',
      };
    } catch (error: unknown) {
      setStatus('ready');

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
