import { getRootLogger } from '@backstage/backend-common';
import yn from 'yn';
import { startStandaloneServer } from './service/standaloneServer';
import { Config } from '@backstage/config';

const port = process.env.PLUGIN_PORT ? Number(process.env.PLUGIN_PORT) : 7007;
const enableCors = yn(process.env.PLUGIN_CORS, { default: false });
const logger = getRootLogger();

startStandaloneServer({ port, enableCors, logger, config: {
  has: () => true,
  keys: () => [],
  get: <T>(key?: string): T => {
    return undefined as T;
  },
  getOptional: () => undefined,
  getConfig: function (key: string): Config {
    throw new Error('Function not implemented.');
  },
  getOptionalConfig: function (key: string): Config | undefined {
    throw new Error('Function not implemented.');
  },
  getConfigArray: function (key: string): Config[] {
    throw new Error('Function not implemented.');
  },
  getOptionalConfigArray: function (key: string): Config[] | undefined {
    throw new Error('Function not implemented.');
  },
  getNumber: function (key: string): number {
    throw new Error('Function not implemented.');
  },
  getOptionalNumber: function (key: string): number | undefined {
    throw new Error('Function not implemented.');
  },
  getBoolean: function (key: string): boolean {
    throw new Error('Function not implemented.');
  },
  getOptionalBoolean: function (key: string): boolean | undefined {
    throw new Error('Function not implemented.');
  },
  getString: function (key: string): string {
    throw new Error('Function not implemented.');
  },
  getOptionalString: function (key: string): string | undefined {
    throw new Error('Function not implemented.');
  },
  getStringArray: function (key: string): string[] {
    throw new Error('Function not implemented.');
  },
  getOptionalStringArray: function (key: string): string[] | undefined {
    throw new Error('Function not implemented.');
  }
} }).catch(err => {
  logger.error(err);
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('CTRL+C pressed; exiting.');
  process.exit(0);
});
