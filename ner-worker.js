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
let sumPipeline = null;
let senPipeline = null;

async function loadPipelines() {
  const pCb = p => {
    if (p.status === 'progress' && p.total) {
      const pct = Math.round((p.loaded / p.total) * 100);
      self.postMessage({ type: 'progress', pct, file: p.file });
    }
  };
  if (!nerPipeline) nerPipeline = await pipeline('token-classification', 'Xenova/bert-base-NER', { aggregation_strategy: 'simple', progress_callback: pCb });
  if (!senPipeline) senPipeline = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english', { progress_callback: pCb });
  if (!sumPipeline) sumPipeline = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6', { progress_callback: pCb });
}

self.addEventListener('message', async (e) => {
  const { type, text } = e.data;
  if (type !== 'run') return;

  try {
    if (!nerPipeline || !senPipeline || !sumPipeline) {
      self.postMessage({ type: 'status', message: 'Loading AI models… (~250MB, first run only)' });
      try {
        await loadPipelines();
      } catch (err) {
        if (String(err).includes('Browser cache is not available')) {
          env.useBrowserCache = false;
          await loadPipelines();
        } else throw err;
      }
    }

    self.postMessage({ type: 'status', message: 'Analyzing sentiment…' });
    const sentiment = await senPipeline(text.slice(0, 512));

    self.postMessage({ type: 'status', message: 'Extracting entities…' });
    const entities = await nerPipeline(text.slice(0, 1200));

    self.postMessage({ type: 'status', message: 'Generating summary…' });
    const sumInput = text.length > 200 ? text : text.repeat(4);
    const summary = await sumPipeline(sumInput.slice(0, 1000), { max_new_tokens: 40, min_new_tokens: 10 });

    self.postMessage({ 
      type: 'done', 
      entities, 
      sentiment: sentiment[0], 
      summary: summary[0].summary_text 
    });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
});
