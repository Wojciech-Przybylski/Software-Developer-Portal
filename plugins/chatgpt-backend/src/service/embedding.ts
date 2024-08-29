
import { Config } from "@backstage/config";
import { OpenAIApi } from "openai";
import { RouterOptions } from "./router";

export interface Entity {
    id: string
    content: string
}

export interface Embedding {
    id: string
    vector: number[]
}

export enum EmbeddingMode {
    Bulk,
    OneAtATime,
    DoNotRecompute,
}

export enum EmbeddingStatus {
    Waiting,
    Done,
    Skipped,
}

export function computeEmbedding(openAi: OpenAIApi, entity: Entity): Promise<Embedding> {
    return new Promise((resolve, reject) => {
        openAi
            .createEmbedding({
                model: "text-embedding-ada-002",
                input: entity.content
            })
            .then((res) => {
                const value = res.data.data[0].embedding;
                resolve({
                    id: entity.id,
                    vector: value,
                });
            })
            .catch(e => {reject(e)});
    })
}

export function postgresClient(config: Config) {
    return require('knex')({
        client: 'pg',
        connection: {
          host: config.getString("backend.database.connection.host"),
          port: config.getNumber("backend.database.connection.port"),
          user: config.getString("backend.database.connection.user"),
          password: config.getString("backend.database.connection.password"),
          database: "backstage_plugin_catalog",
          ssl: false,
        }
      });
}

export async function getUncomputedEntities(pg: any): Promise<Entity[]> {
    return pg('final_entities')
        .select("entity_id", "final_entity")
        .whereNull("embedding")
        .whereNotNull("final_entity")
        .then((entities: any) => {
            return entities.map((entity: any) => {
                return { id: entity.entity_id, content: entity.final_entity }
            });
        });
}

export async function writeBulkToDatabase(pg: any, data: Embedding[]) {

    await pg.transaction(async (trx: any) => {

        const queries: any[] = [];
        data.forEach(entity => {
            const query = pg('final_entities')
                .where('entity_id', entity.id)
                .update({embedding: entity.vector})
                .transacting(trx);
            queries.push(query);
        });

        await Promise.all(queries)
            .then(trx.commit)
            .catch(trx.rollback);
    
    });

}

export async function writeToDatabase(pg: any, embedding: Embedding) {
    await pg('final_entities')
        .where('entity_id', embedding.id)
        .update({embedding: embedding.vector});
}

export async function findSimilar(openAi: OpenAIApi, pg: any, query: string, charLimit: number): Promise<string[]> {

    const queryEmbedding = await computeEmbedding(openAi, {id: "QUERY_PLACEHOLDER_ID", content: query});

    // this loads the embeddings of every entity into memory - it won't scale well to large volumes of data
    const embeddings: { embedding: number[], content: string }[] = await pg('final_entities')
        .select(pg.raw("embedding::DOUBLE PRECISION[], final_entity"))
        .whereNotNull("embedding")
        .then((entities: any) => { // object comes from database; `any` type so as not to make changes to the schema cumbersome
            return entities.map((entity: any) => {
                return { embedding: entity.embedding, content: entity.final_entity }
            });
        });

    // cosine similarity between the vector in the argument and the query vector
    const computeSimilarity = (entity: {embedding: number[], content: string}): {similarity: number, content: string} => {
        const dotProduct = (x: number[], y: number[]) => {
            return x.map((_, i) => x[i] * y[i]).reduce((a, b) => a + b, 0);
        }
        const left = entity.embedding;
        const right = queryEmbedding.vector;
        const similarity = dotProduct(left, right) / (Math.sqrt(dotProduct(left, left)) * Math.sqrt(dotProduct(right, right)));
        const content = entity.content;

        return {similarity, content}
    }

    // sort by similarity to the query, descending order
    const sortedEmbeddings = embeddings.map(computeSimilarity)
        .sort((a, b) => b.similarity - a.similarity);

    // find the index of the first item whose content (cumulatively) exceeds the set char limit
    const limitIndex = sortedEmbeddings.map((cumulativeLength => embedding => cumulativeLength += embedding.content.length)(0))
        .findIndex(cumulativeLength => cumulativeLength > charLimit);

    return sortedEmbeddings.slice(0, limitIndex)
        .map((result) => result.content);
}

export async function computeEmbeddings(options: RouterOptions, pgClient: any, openAi: OpenAIApi, mode: EmbeddingMode) {
    const { config, logger } = options;
    const entities = await getUncomputedEntities(pgClient);

    switch (+mode) {
        case EmbeddingMode.Bulk : {
            const embeddings = entities.map(entity => computeEmbedding(openAi, entity))
            Promise.all(embeddings).then(async results => {
                await writeBulkToDatabase(pgClient, results);
            });
            break;
        }
        case EmbeddingMode.OneAtATime : { // commits each embedding as it arrives - i.e. not computing everything as a single atomic transaction
            for (const entity of entities) {
                logger.info(`Creating embedding for entity ${entity.id}...`);
                let embedding: Embedding | undefined;
                let status: EmbeddingStatus = EmbeddingStatus.Waiting;
                while (status == EmbeddingStatus.Waiting) {
                    try {
                        embedding = await computeEmbedding(openAi, entity);
                        status = EmbeddingStatus.Done;
                    } catch (e) {
                        if (entity.content.length > 4000) {
                            logger.info(`Failed to compute embedding for ${entity.id}. The content length is ${entity.content.length} characters (>4000), so it's probably too long to do in one chunk. Skipping for now...`);
                            status = EmbeddingStatus.Skipped;
                        } else {
                            logger.info(`Failed to compute embedding for ${entity.id} because ${e}, trying again in 2 minutes...`);
                            await new Promise(_r => setTimeout(_r, 120000));
                        }
                    }
                }

                if (status == EmbeddingStatus.Done) {
                    if (!embedding) { throw new Error("Embedding is undefined - should be impossible."); }
                    logger.info(`Successfully computed embedding for entity ${entity.id}. Committing to database...`);
                    await writeToDatabase(pgClient, embedding);
                }
            }

            break;
        }
        case EmbeddingMode.DoNotRecompute : {
            break;
        }
    }
}