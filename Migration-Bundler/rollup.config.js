import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'index.ts',
  output: [
    {
      file: 'dist/bundle.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: './tsconfig.json',
      sourceMap: true,
      declaration: false
    })
  ],
  external: [
    '@coral-xyz/anchor',
    '@pump-fun/pump-sdk',
    '@solana/spl-token',
    '@solana/web3.js',
    '@fleekxyz/sdk',
    '@raydium-io/raydium-sdk',
    'axios',
    'dotenv',
    'js-sha256',
    'pino',
    'pino-pretty',
    'pino-std-serializers',
    'bs58',
    'fs',
    'readline',
    'undici'
  ]
}; 
