import { Logger } from "winston";
import { MessageBroker } from "../types/broker";
import { Consumer, EachMessagePayload, Kafka } from "kafkajs";

export class KafkaBroker implements MessageBroker {
    private consumer: Consumer;
    constructor(clientId: string, brokers: string[], private logger: Logger) {
        const kafka = new Kafka({
            clientId,
            brokers,
        });
        this.consumer = kafka.consumer({ groupId: clientId });
    }

    /**
     * Connect the consumer
     */
    async connectConsumer() {
        await this.consumer.connect();
        this.logger.info("Connected to Kafka");
    }

    /**
     * Disconnect the consumer
     */
    async disconnectConsumer() {
        await this.consumer.disconnect();
        this.logger.info("Disconnected from Kafka");
    }

    /**
     * Consume a message from the topic
     */
    async consumeMessage(topics: string[], fromBeginning: boolean = false) {
        await this.consumer.subscribe({ topics, fromBeginning });
        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                console.log({
                    value: message.value.toString(),
                    topic,
                    partition,
                });
            }
        })
    }
}