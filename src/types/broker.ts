export interface MessageBroker {
    connectConsumer: () => Promise<void>;
    disconnectConsumer: () => Promise<void>;
    connectProducer: () => Promise<void>;
    sendMessage: (topic: string, message: string, key?: string) => Promise<void>;
    disconnectProducer: () => Promise<void>;
    consumeMessage: (topics: string[], fromBeginning: boolean) => Promise<void>;
}