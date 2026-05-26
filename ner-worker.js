/*
  ner-worker.js — Web Worker for Named Entity Recognition
  Runs Transformers.js BERT NER pipeline off the main thread so the
  extension popup stays fully responsive during model loading/inference.
*/

import { pipeline, env } from './vendor/transformers.min.js';

// Single WASM thread is fine for extension context
env.backends.onnx.wasm.numThreads = 1;

let cacheAvailable = typeof caches !== 'undefined';
env.useBrowserCache = cacheAvailable;

let nerPipeline = null;

async function loadPipeline() {
  return await pipeline('token-classification', 'Xenova/bert-base-NER', {
    aggregation_strategy: 'simple',
    progress_callback: (p) => {
      if (p.status === 'progress' && p.total) {
        const pct = Math.round((p.loaded / p.total) * 100);
        self.postMessage({ type: 'progress', pct, file: p.file });
      }
    },
  });
}

self.addEventListener('message', async (e) => {
  const { type, text } = e.data;
  if (type !== 'run') return;

  try {
    if (!nerPipeline) {
      self.postMessage({ type: 'status', message: 'Loading NER model… (first run only)' });
      try {
        nerPipeline = await loadPipeline();
      } catch (err) {
        if (err.message?.includes('Browser cache is not available') || String(err).includes('Browser cache is not available')) {
          env.useBrowserCache = false;
          nerPipeline = await loadPipeline();
        } else {
          throw err;
        }
      }
    }

    self.postMessage({ type: 'status', message: 'Analysing text…' });
    const results = await nerPipeline(text.slice(0, 1200));
    self.postMessage({ type: 'done', entities: results });

  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
});
