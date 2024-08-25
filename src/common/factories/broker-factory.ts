import config from "config";
import { KafkaBroker } from "../../config/kafka";
import { MessageBroker } from "../../types/broker";
import logger from "../../config/logger";

let broker:MessageBroker | null = null;

export const createMessageBroker = (): MessageBroker => {
    // singleton
    if(!broker) {
        broker = new KafkaBroker(
            "order-service", 
            [config.get("kafka.broker")],
            logger
        );
    }
    return broker;
}