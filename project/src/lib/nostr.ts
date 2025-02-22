import { getPublicKey, getEventHash, signEvent, SimplePool, Event, UnsignedEvent } from 'nostr-tools';

export class NostrService {
  private pool: SimplePool;
  private currentUser: { npub: string; pubkey: string } | null = null;
  private relays = [
    'wss://relay.damus.io',
    'wss://relay.nostr.band',
    'wss://nos.lol',
    'wss://nostr.fmt.wiz.biz',
    'wss://relay.nostr.bg',
    'wss://nostr.zebedee.cloud'
  ];

  constructor() {
    this.pool = new SimplePool();
  }

  async init() {
    try {
      // Try to connect to at least one relay
      const connectedRelays = await Promise.allSettled(
        this.relays.map(relay =>
          this.pool.ensureRelay(relay, {
            timeout: 2000
          })
        )
      );

      const successfulConnections = connectedRelays.filter(
        result => result.status === 'fulfilled'
      );

      if (successfulConnections.length === 0) {
        throw new Error('Could not connect to any relays');
      }

      // Test basic subscription
      await Promise.race([
        this.pool.get(
          this.relays,
          { kinds: [1], limit: 1 },
          { skipVerification: true }
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Subscription timeout')), 3000)
        ),
      ]);

    } catch (error) {
      console.warn('Relay connection warning:', error);
      // Don't throw error to allow app to continue functioning
      // Some features might be limited but the app should still work
    }
  }

  async loginWithExtension(): Promise<{ npub: string; pubkey: string } | null> {
    try {
      if (typeof window === 'undefined' || !window.nostr) {
        throw new Error('No Nostr provider found. Please install Alby extension.');
      }

      const pubkey = await window.nostr.getPublicKey();
      if (!pubkey) {
        throw new Error('Failed to get public key from Nostr extension');
      }

      this.currentUser = {
        npub: pubkey,
        pubkey: pubkey,
      };

      return this.currentUser;
    } catch (error) {
      console.error('Error logging in with Nostr:', error);
      throw error;
    }
  }

  async publishSurveyData(data: any): Promise<Event | null> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const eventTemplate: UnsignedEvent = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [['t', 'survey']],
        content: JSON.stringify(data),
        pubkey: this.currentUser.pubkey,
      };

      // Get the event hash
      const eventHash = getEventHash(eventTemplate);
      
      // Sign the event using the extension
      const signedEvent = await window.nostr.signEvent({
        ...eventTemplate,
        id: eventHash,
      });

      if (!signedEvent) {
        throw new Error('Failed to sign event');
      }

      // Try to publish to multiple relays with timeout
      const publishPromises = this.relays.map(relay =>
        new Promise(async (resolve) => {
          try {
            await this.pool.ensureRelay(relay);
            await this.pool.publish([relay], signedEvent);
            resolve(true);
          } catch (e) {
            resolve(false);
          }
        })
      );

      const results = await Promise.all(publishPromises);
      const successfulPublishes = results.filter(Boolean).length;

      if (successfulPublishes === 0) {
        throw new Error('Failed to publish to any relays');
      }

      return signedEvent;
    } catch (error) {
      console.error('Error publishing survey data:', error);
      return null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }
}

// Add global type declaration for window.nostr
declare global {
  interface Window {
    nostr?: {
      getPublicKey: () => Promise<string>;
      signEvent: (event: any) => Promise<any>;
    };
  }
}