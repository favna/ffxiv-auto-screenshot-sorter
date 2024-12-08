import common from 'eslint-config-neon/common';
import mod from 'eslint-config-neon/module';
import noDeprecated from 'eslint-config-neon/no-deprecated';
import node from 'eslint-config-neon/node';
import prettier from 'eslint-config-neon/prettier';
import typescript from 'eslint-config-neon/typescript';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import merge from 'lodash.merge';

/**
 * @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigArray}
 */
const config = [
	{
		ignores: ['dist/']
	},
	...[...common, ...typescript, ...prettier, ...mod, ...noDeprecated, ...node].map((config) =>
		merge(config, {
			files: ['src/**/*.mts'],
			languageOptions: {
				parserOptions: {
					project: 'tsconfig.eslint.json'
				}
			},
			rules: {
				'@typescript-eslint/switch-exhaustiveness-check': 'off',
				'import-x/order': 'off'
			}
		})
	),
	// Enable prettier through ESLint
	eslintPluginPrettierRecommended
];

export default config;
