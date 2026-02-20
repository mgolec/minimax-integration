import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  // Bundle @minimax-api/core into the output so the published package is self-contained
  noExternal: ['@minimax-api/core'],
});
