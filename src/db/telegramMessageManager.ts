import { promises as fs } from 'fs';
import path from 'path';

type MessageType = "VALIDATOR_REPORT" | "EPOCH_REPORT";

interface MessageData {
  message_id: number;
  type: MessageType;
  timestamp: string;
}

interface ChatData {
  chat_id: number;
  messages: MessageData[];
  totalMessages: number;
  lastUpdated: string;
  createdAt: string;
}

interface MessageDatabase {
  metadata: {
    totalChats: number;
    totalMessages: number;
    lastUpdated: string;
    version: string;
  };
  chats: { [chat_id: number]: ChatData };
}



class TelegramMessageManager {
  private dataDirectory: string;
  private databasePath: string;

  constructor() {
    this.dataDirectory = path.join(process.cwd(), 'json');
    this.databasePath = path.join(this.dataDirectory, 'messages_db.json');
    
    this.init();
  }

  // Initialize data directory and database file
  async init(): Promise<void> {
    try {
      await fs.mkdir(this.dataDirectory, { recursive: true });
      
      // Create empty database if it doesn't exist
      try {
        await fs.access(this.databasePath);
      } catch {
        await this.createEmptyDatabase();
      }
    } catch (error) {
      console.error('Error initializing:', error);
      throw error;
    }
  }

  // Create empty database file
  private async createEmptyDatabase(): Promise<void> {
    const emptyDatabase: MessageDatabase = {
      metadata: {
        totalChats: 0,
        totalMessages: 0,
        lastUpdated: new Date().toISOString(),
        version: '1.0.0'
      },
      chats: {}
    };

    await fs.writeFile(this.databasePath, JSON.stringify(emptyDatabase, null, 2));
    console.log('Empty message database created');
  }

  // Load database from file
  async loadDatabase(): Promise<MessageDatabase> {
    try {
      const data = await fs.readFile(this.databasePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading database:', error);
      // Return empty database if file doesn't exist or is corrupted
      return {
        metadata: {
          totalChats: 0,
          totalMessages: 0,
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        },
        chats: {}
      };
    }
  }

  // Save database to file
  async saveDatabase(database: MessageDatabase): Promise<void> {
    try {
      await fs.writeFile(this.databasePath, JSON.stringify(database, null, 2));
      console.log('Message database saved successfully');
    } catch (error) {
      console.error('Error saving database:', error);
      throw error;
    }
  }

  // Update database metadata
  private updateMetadata(database: MessageDatabase): void {
    const chatIds = Object.keys(database.chats).map(Number);
    let totalMessages = 0;

    chatIds.forEach(chatId => {
      totalMessages += database.chats[chatId].totalMessages;
    });

    database.metadata.totalChats = chatIds.length;
    database.metadata.totalMessages = totalMessages;
    database.metadata.lastUpdated = new Date().toISOString();
  }

  // Add single message to a chat
  async addMessage(
    chat_id: number, 
    message_id: number, 
    type: MessageType
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    console.log(`Adding message ${message_id} to chat ${chat_id}...`);
    
    await this.init();
    const database = await this.loadDatabase();

    try {
      const messageData: MessageData = {
        message_id,
        type,
        timestamp: new Date().toISOString()
      };

      // Initialize chat if it doesn't exist
      if (!database.chats[chat_id]) {
        database.chats[chat_id] = {
          chat_id,
          messages: [],
          totalMessages: 0,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
      }

      // Check if message already exists
      const existingMessage = database.chats[chat_id].messages.find(
        msg => msg.message_id === message_id
      );

      if (existingMessage) {
        // Update existing message
        existingMessage.type = type;
        existingMessage.timestamp = new Date().toISOString();
        console.log(`Updated existing message ${message_id} in chat ${chat_id}`);
      } else {
        // Add new message
        database.chats[chat_id].messages.push(messageData);
        database.chats[chat_id].totalMessages++;
        console.log(`Added new message ${message_id} to chat ${chat_id}`);
      }

      // Update chat metadata
      database.chats[chat_id].lastUpdated = new Date().toISOString();

      // Sort messages by message_id
      database.chats[chat_id].messages.sort((a, b) => a.message_id - b.message_id);

      // Update global metadata
      this.updateMetadata(database);

      // Save database
      await this.saveDatabase(database);

      console.log(`✅ Successfully processed message ${message_id} in chat ${chat_id}`);

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Error adding message ${message_id} to chat ${chat_id}:`, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Add multiple messages
  async addMessages(messages: Array<{
    chat_id: number;
    message_id: number;
    type: MessageType;
  }>): Promise<{
    processed: number;
    total: number;
    errors: number;
  }> {
    console.log(`Adding ${messages.length} messages to database...`);
    
    await this.init();
    const database = await this.loadDatabase();
    
    const errors: { chat_id: number; message_id: number; error: string }[] = [];
    let processed = 0;

    try {
      for (const messageInfo of messages) {
        try {
          const { chat_id, message_id, type } = messageInfo;

          const messageData: MessageData = {
            message_id,
            type,
            timestamp: new Date().toISOString()
          };

          // Initialize chat if it doesn't exist
          if (!database.chats[chat_id]) {
            database.chats[chat_id] = {
              chat_id,
              messages: [],
              totalMessages: 0,
              lastUpdated: new Date().toISOString(),
              createdAt: new Date().toISOString()
            };
          }

          // Check if message already exists
          const existingMessageIndex = database.chats[chat_id].messages.findIndex(
            msg => msg.message_id === message_id
          );

          if (existingMessageIndex !== -1) {
            // Update existing message
            database.chats[chat_id].messages[existingMessageIndex] = messageData;
          } else {
            // Add new message
            database.chats[chat_id].messages.push(messageData);
            database.chats[chat_id].totalMessages++;
          }

          // Update chat metadata
          database.chats[chat_id].lastUpdated = new Date().toISOString();

          processed++;
        } catch (error) {
          errors.push({
            chat_id: messageInfo.chat_id,
            message_id: messageInfo.message_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Sort messages in each chat
      Object.values(database.chats).forEach(chat => {
        chat.messages.sort((a, b) => a.message_id - b.message_id);
      });

      // Update metadata and save database
      this.updateMetadata(database);
      await this.saveDatabase(database);

      const result = {
        processed,
        total: messages.length,
        errors: errors.length
      };

      console.log('\n=== BULK MESSAGE ADD COMPLETED ===');
      console.log(`Successfully processed: ${processed}/${messages.length} messages`);
      console.log(`Errors: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log('Failed messages:', errors.map(e => `${e.chat_id}:${e.message_id}`).join(', '));
      }

      return result;

    } catch (error) {
      console.error('Error in bulk message add:', error);
      throw error;
    }
  }

  // Get all messages from a chat
  async getChatMessages(chat_id: number): Promise<MessageData[] | null> {
    const database = await this.loadDatabase();
    const chat = database.chats[chat_id];
    return chat ? chat.messages : null;
  }

  // Get messages by type from a chat
  async getChatMessagesByType(chat_id: number, type: MessageType): Promise<MessageData[]> {
    const messages = await this.getChatMessages(chat_id);
    if (!messages) return [];
    
    return messages.filter(msg => msg.type === type);
  }

  // Get all chats
  async getAllChats(): Promise<ChatData[]> {
    const database = await this.loadDatabase();
    return Object.values(database.chats).sort((a, b) => a.chat_id - b.chat_id);
  }

  // Get specific message
  async getMessage(chat_id: number, message_id: number): Promise<MessageData | null> {
    const messages = await this.getChatMessages(chat_id);
    if (!messages) return null;
    
    return messages.find(msg => msg.message_id === message_id) || null;
  }

  // Delete message
  async deleteMessage(chat_id: number, message_id: number): Promise<boolean> {
    await this.init();
    const database = await this.loadDatabase();

    const chat = database.chats[chat_id];
    if (!chat) return false;

    const messageIndex = chat.messages.findIndex(msg => msg.message_id === message_id);
    if (messageIndex === -1) return false;

    chat.messages.splice(messageIndex, 1);
    chat.totalMessages--;
    chat.lastUpdated = new Date().toISOString();

    // Update metadata and save
    this.updateMetadata(database);
    await this.saveDatabase(database);

    console.log(`Deleted message ${message_id} from chat ${chat_id}`);
    return true;
  }

  // Delete entire chat
  async deleteChat(chat_id: number): Promise<boolean> {
    await this.init();
    const database = await this.loadDatabase();

    if (!database.chats[chat_id]) return false;

    delete database.chats[chat_id];

    // Update metadata and save
    this.updateMetadata(database);
    await this.saveDatabase(database);

    console.log(`Deleted chat ${chat_id}`);
    return true;
  }

  // Get database statistics
  async getStatistics(): Promise<{
    totalChats: number;
    totalMessages: number;
    messagesByType: { [key in MessageType]: number };
    chatsSizes: { chat_id: number; messageCount: number }[];
    lastUpdated: string;
    databaseSizeMB: number;
  }> {
    const database = await this.loadDatabase();
    const stats = await fs.stat(this.databasePath);
    
    const messagesByType: { [key in MessageType]: number } = {
      "VALIDATOR_REPORT": 0,
      "EPOCH_REPORT": 0
    };

    const chatsSizes: { chat_id: number; messageCount: number }[] = [];

    Object.values(database.chats).forEach(chat => {
      chatsSizes.push({
        chat_id: chat.chat_id,
        messageCount: chat.totalMessages
      });

      chat.messages.forEach(message => {
        messagesByType[message.type]++;
      });
    });

    // Sort chats by message count (descending)
    chatsSizes.sort((a, b) => b.messageCount - a.messageCount);

    return {
      totalChats: database.metadata.totalChats,
      totalMessages: database.metadata.totalMessages,
      messagesByType,
      chatsSizes,
      lastUpdated: database.metadata.lastUpdated,
      databaseSizeMB: Math.round((stats.size / 1024 / 1024) * 100) / 100
    };
  }

  // Search messages by type across all chats
  async searchMessagesByType(type: MessageType): Promise<Array<{
    chat_id: number;
    message: MessageData;
  }>> {
    const database = await this.loadDatabase();
    const results: Array<{
      chat_id: number;
      message: MessageData;
    }> = [];

    Object.values(database.chats).forEach(chat => {
      chat.messages.forEach(message => {
        if (message.type === type) {
          results.push({
            chat_id: chat.chat_id,
            message: message
          });
        }
      });
    });

    return results.sort((a, b) => {
      // Sort by chat_id first, then by message_id
      if (a.chat_id !== b.chat_id) {
        return a.chat_id - b.chat_id;
      }
      return a.message.message_id - b.message.message_id;
    });
  }

  // Clear all data
  async clearDatabase(): Promise<void> {
    await this.createEmptyDatabase();
    console.log('Message database cleared');
  }

  // Backup database
  async backupDatabase(backupPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `messages_db_backup_${timestamp}.json`;
    const finalBackupPath = backupPath || path.join(this.dataDirectory, filename);
    
    const database = await this.loadDatabase();
    await fs.writeFile(finalBackupPath, JSON.stringify(database, null, 2));
    
    console.log(`Database backed up to: ${finalBackupPath}`);
    return finalBackupPath;
  }
}

export default TelegramMessageManager;