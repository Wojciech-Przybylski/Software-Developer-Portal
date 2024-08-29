import {
   Configuration,
   CreateChatCompletionRequest,
   OpenAIApi}  from "openai";
import BadRequest from 'http-errors'

import { computeEmbeddings, EmbeddingMode, findSimilar, postgresClient } from "./embedding";
import { RouterOptions } from "./router";

const errors = require('@backstage/errors');

interface ChatGPTUserInput {
  model? : string
  messages? : string[]
  temperature? : number
  maxTokens? : number
}

export const openAPIResponse =  async (options: RouterOptions, input: ChatGPTUserInput) => {
    const { config, logger } = options;
    const configuration = new Configuration({
        apiKey: config.getString('openai.apiKey'),
    });
    const openAi = new OpenAIApi(configuration);
    if (!input.messages) {
        throw new errors.InputError("No message was provided.");
    }
    const pgClient = postgresClient(config);

    // Note that this won't recompute embeddings which already have values; it only considers database entries
    // for which `final_entity is not null`
    computeEmbeddings(options, pgClient, openAi, EmbeddingMode.OneAtATime);

    const parsedMessages = input.messages.map(message => JSON.parse(message));
    const userQuery = parsedMessages.find((x) => x.role == "user");

    const context = await findSimilar(openAi, pgClient, userQuery.content, 4000);
    const systemPrompt = [
        "Respond professionally and concisely. Only answer in the context of the following information, provided in YAML format. Note that this information only represents the most relevant data to the question, and does not include the entire database.",
        context,
    ].join("\n---\n");
    logger.info(`Able to inject ${context.length} items as context. Sending chat completion request...`);

    let response;
    if(input.model == 'gpt-3.5-turbo') {
        const chatCompletionRequest: CreateChatCompletionRequest = {
            model: input.model,
            messages: [{role: "system", content: systemPrompt}, userQuery],
            temperature: input.temperature,
            max_tokens: input.maxTokens,
        };
        response = await openAi.createChatCompletion(chatCompletionRequest);
    }
    else {
        throw BadRequest(`Unsupported or invalid model "${input.model}".`);
    }

    return response.data.choices;
}
