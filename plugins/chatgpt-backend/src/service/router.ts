
import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { Config } from '@backstage/config';

import { openAPIResponse } from './openai';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    response.send({ status: 'ok' });
  });

  router.get('/completions', async (request, response) => {
    const model = request.query.model as string;
    const messages = request.query.messages as [];
    const temperature = Number(request.query.temperature);
    const maxTokens = Number(request.query.maxTokens);
    const completion = await openAPIResponse(options, {model, messages, temperature, maxTokens});

    response.send({completion: completion})
  })

  router.use(errorHandler());
  return router;
}
