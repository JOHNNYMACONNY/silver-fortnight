import * as dotenv from 'dotenv';
import webpack from 'webpack';
import fs from 'fs';
import path from 'path';
import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs",
    "@storybook/addon-a11y"
  ],
  "framework": {
    "name": "@storybook/react-webpack5",
    "options": {}
  },
  webpackFinal: async (config) => {
    // Ensure module and rules exist
    if (!config.module) config.module = { rules: [] };
    if (!config.module.rules) config.module.rules = [];
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            transpileOnly: true
          }
        }
      ],
      exclude: /node_modules/
    });
    // Ensure resolve and extensions exist
    if (!config.resolve) config.resolve = { extensions: ['.js', '.jsx'] };
    if (!config.resolve.extensions) config.resolve.extensions = ['.js', '.jsx'];
    config.resolve.extensions.push('.ts', '.tsx');

    // Load the appropriate .env file (default to .env.production for Chromatic/CI)
    const envPath = process.env.NODE_ENV === 'development' ? '../.env.development' : '../.env.production';
    const fullEnvPath = path.resolve(__dirname, envPath);
    if (fs.existsSync(fullEnvPath)) {
      dotenv.config({ path: fullEnvPath });
    } else {
      dotenv.config({ path: path.resolve(__dirname, '../.env') });
    }

    function getViteEnvVariables() {
      return Object.keys(process.env)
        .filter((key) => key.startsWith('VITE_'))
        .reduce((env, key) => {
          env[`process.env.${key}`] = JSON.stringify(process.env[key]);
          return env;
        }, {});
    }

    // Inject VITE_ variables into Webpack using DefinePlugin
    config.plugins = config.plugins || [];
    config.plugins.push(new webpack.DefinePlugin(getViteEnvVariables()));

    return config;
  }
};
export default config;