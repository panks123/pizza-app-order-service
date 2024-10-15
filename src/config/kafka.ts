import { Logger } from "winston";
import { MessageBroker } from "../types/broker";
import config from "config";
import { Consumer, EachMessagePayload, Kafka, KafkaConfig, Producer } from "kafkajs";
import { handleProductUpdate } from "../product-cache/product-update-handler";
import { handleToppingUpdate } from "../topping-cache/topping-update-handler";

export class KafkaBroker implements MessageBroker {
    private consumer: Consumer;
    private producer: Producer;

    constructor(clientId: string, brokers: string[], private logger: Logger) {
        let kafkaConfig: KafkaConfig = {
            clientId,
            brokers,
        }

        if(process.env.NODE_ENV === 'production') {
            kafkaConfig = {
                ...kafkaConfig,
                ssl: true,
                connectionTimeout: 45000,
                sasl: {
                    mechanism: 'plain',
                    username: config.get('kafka.sasl.username'),
                    password: config.get('kafka.sasl.password'),
                }
            }
        }
        const kafka = new Kafka(kafkaConfig);

        this.producer = kafka.producer();
        this.consumer = kafka.consumer({ groupId: clientId });
    }

    /**
     * Connect the producer
     */
    async connectProducer() {
        await this.producer.connect();
    }

    /**
     * Disconnect the producer
     */
    async disconnectProducer() {
        if(this.producer)
            await this.producer.disconnect();
    }

    /**
     * Send a message to the topic
     * @param topic 
     * @param message
     * @throws Error when the producer is not connected
     */
    async sendMessage(topic: string, message: string, key: string) {
        const data: { key?: string, value: string } = {
            value: message,
        }
        if(key) {
            data.key = key;
        }
        this.logger.info("Sending message to Kafka", {
            topic,
            message,
        });
        await this.producer.send({ topic, messages: [data] });
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
                this.logger.info("A new kafka message arrived", {
                    value: message.value.toString(),
                    topic,
                    partition,
                });
                switch (topic) {
                    case 'product': 
                        await handleProductUpdate(message.value.toString());
                        return;
                    case 'topping':
                        await handleToppingUpdate(message.value.toString());
                        return;
                    default:
                        console.log(`Do nothing, Unknown topic ${topic}`);
                        return;
                }
            }
        })
    }
}