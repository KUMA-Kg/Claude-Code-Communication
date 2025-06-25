/**
 * Hybrid Encryption System
 * Combines classical and quantum-resistant cryptography for defense in depth
 */

import crypto from 'crypto';
import { promisify } from 'util';
import { 
  PQCAlgorithm, 
  SecurityLevel, 
  Kyber, 
  Dilithium,
  PQCFactory 
} from './algorithms';

const randomBytes = promisify(crypto.randomBytes);

/**
 * Hybrid encryption modes
 */
export enum HybridMode {
  // Concatenate classical and PQC shared secrets
  CONCATENATION = 'CONCATENATION',
  
  // XOR classical and PQC shared secrets
  XOR = 'XOR',
  
  // Nested encryption (encrypt with classical, then PQC)
  NESTED = 'NESTED',
  
  // KDF-based combination
  KDF_COMBINED = 'KDF_COMBINED'
}

/**
 * Configuration for hybrid encryption
 */
export interface HybridConfig {
  classicalAlgorithm: string;
  pqcAlgorithm: PQCAlgorithm;
  hybridMode: HybridMode;
  securityLevel: SecurityLevel;
  kdfIterations?: number;
}

/**
 * Hybrid key exchange result
 */
export interface HybridKeyExchangeResult {
  sharedSecret: Buffer;
  classicalPublicKey: Buffer;
  pqcPublicKey: Buffer;
  encapsulatedData: {
    classicalCiphertext?: Buffer;
    pqcCiphertext: Buffer;
  };
}

/**
 * Main hybrid encryption class
 */
export class HybridEncryption {
  private config: HybridConfig;
  private classicalKeyPair?: crypto.KeyPairKeyObjectResult;
  private pqcKEM: Kyber;
  private pqcSignature: Dilithium;

  constructor(config: HybridConfig) {
    this.config = {
      kdfIterations: 100000,
      ...config
    };
    
    // Initialize PQC algorithms
    this.pqcKEM = new Kyber(config.securityLevel);
    this.pqcSignature = new Dilithium(config.securityLevel);
  }

  /**
   * Generate hybrid keypair (classical + PQC)
   */
  async generateHybridKeyPair() {
    // Generate classical keypair (ECDH for example)
    const classicalKeyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: this.getClassicalCurve()
    });
    
    // Generate PQC keypair
    const pqcKeyPair = this.pqcKEM.generateKeyPair();
    
    // Generate signature keypair for authentication
    const signatureKeyPair = this.pqcSignature.generateKeyPair();
    
    return {
      classical: {
        publicKey: classicalKeyPair.publicKey.export({ 
          type: 'spki', 
          format: 'der' 
        }) as Buffer,
        privateKey: classicalKeyPair.privateKey.export({ 
          type: 'pkcs8', 
          format: 'der' 
        }) as Buffer
      },
      pqc: {
        kem: pqcKeyPair,
        signature: signatureKeyPair
      }
    };
  }

  /**
   * Perform hybrid key exchange (sender side)
   */
  async hybridKeyExchange(
    recipientClassicalPublicKey: Buffer,
    recipientPQCPublicKey: Buffer
  ): Promise<HybridKeyExchangeResult> {
    // Classical ECDH
    const ephemeralKeyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: this.getClassicalCurve()
    });
    
    const recipientClassicalKey = crypto.createPublicKey({
      key: recipientClassicalPublicKey,
      format: 'der',
      type: 'spki'
    });
    
    const classicalSharedSecret = crypto.diffieHellman({
      privateKey: ephemeralKeyPair.privateKey,
      publicKey: recipientClassicalKey
    });
    
    // PQC KEM encapsulation
    const { sharedSecret: pqcSharedSecret, ciphertext: pqcCiphertext } = 
      this.pqcKEM.encapsulate(recipientPQCPublicKey);
    
    // Combine shared secrets based on mode
    const combinedSharedSecret = await this.combineSharedSecrets(
      classicalSharedSecret,
      pqcSharedSecret
    );
    
    return {
      sharedSecret: combinedSharedSecret,
      classicalPublicKey: ephemeralKeyPair.publicKey.export({ 
        type: 'spki', 
        format: 'der' 
      }) as Buffer,
      pqcPublicKey: Buffer.alloc(0), // Not needed for sender
      encapsulatedData: {
        pqcCiphertext
      }
    };
  }

  /**
   * Recover shared secret (receiver side)
   */
  async recoverSharedSecret(
    senderClassicalPublicKey: Buffer,
    pqcCiphertext: Buffer,
    recipientClassicalPrivateKey: Buffer,
    recipientPQCPrivateKey: Buffer
  ): Promise<Buffer> {
    // Classical ECDH
    const senderPublicKey = crypto.createPublicKey({
      key: senderClassicalPublicKey,
      format: 'der',
      type: 'spki'
    });
    
    const recipientPrivateKey = crypto.createPrivateKey({
      key: recipientClassicalPrivateKey,
      format: 'der',
      type: 'pkcs8'
    });
    
    const classicalSharedSecret = crypto.diffieHellman({
      privateKey: recipientPrivateKey,
      publicKey: senderPublicKey
    });
    
    // PQC KEM decapsulation
    const pqcSharedSecret = this.pqcKEM.decapsulate(
      pqcCiphertext,
      recipientPQCPrivateKey
    );
    
    // Combine shared secrets
    return this.combineSharedSecrets(classicalSharedSecret, pqcSharedSecret);
  }

  /**
   * Encrypt data using hybrid encryption
   */
  async encryptHybrid(
    data: Buffer,
    recipientClassicalPublicKey: Buffer,
    recipientPQCPublicKey: Buffer
  ): Promise<{
    encryptedData: Buffer;
    keyExchangeData: HybridKeyExchangeResult;
    iv: Buffer;
    authTag: Buffer;
  }> {
    // Perform hybrid key exchange
    const keyExchangeResult = await this.hybridKeyExchange(
      recipientClassicalPublicKey,
      recipientPQCPublicKey
    );
    
    // Derive encryption key from shared secret
    const { encryptionKey, macKey } = await this.deriveKeys(
      keyExchangeResult.sharedSecret
    );
    
    // Encrypt data with AES-GCM
    const iv = await randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
    
    const encryptedData = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData,
      keyExchangeData: keyExchangeResult,
      iv,
      authTag
    };
  }

  /**
   * Decrypt data using hybrid decryption
   */
  async decryptHybrid(
    encryptedData: Buffer,
    keyExchangeData: {
      classicalPublicKey: Buffer;
      pqcCiphertext: Buffer;
    },
    iv: Buffer,
    authTag: Buffer,
    recipientClassicalPrivateKey: Buffer,
    recipientPQCPrivateKey: Buffer
  ): Promise<Buffer> {
    // Recover shared secret
    const sharedSecret = await this.recoverSharedSecret(
      keyExchangeData.classicalPublicKey,
      keyExchangeData.pqcCiphertext,
      recipientClassicalPrivateKey,
      recipientPQCPrivateKey
    );
    
    // Derive decryption key
    const { encryptionKey } = await this.deriveKeys(sharedSecret);
    
    // Decrypt with AES-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
    
    return decryptedData;
  }

  /**
   * Sign data with hybrid signature (classical + PQC)
   */
  async hybridSign(
    data: Buffer,
    classicalPrivateKey: Buffer,
    pqcPrivateKey: Buffer
  ): Promise<{
    classicalSignature: Buffer;
    pqcSignature: Buffer;
    combinedSignature: Buffer;
  }> {
    // Classical signature (ECDSA)
    const privateKey = crypto.createPrivateKey({
      key: classicalPrivateKey,
      format: 'der',
      type: 'pkcs8'
    });
    
    const classicalSignature = crypto.sign('sha256', data, privateKey);
    
    // PQC signature (Dilithium)
    const pqcSignature = this.pqcSignature.sign(data, pqcPrivateKey);
    
    // Combine signatures
    const combinedSignature = Buffer.concat([
      Buffer.from([classicalSignature.length >> 8, classicalSignature.length & 0xff]),
      classicalSignature,
      pqcSignature
    ]);
    
    return {
      classicalSignature,
      pqcSignature,
      combinedSignature
    };
  }

  /**
   * Verify hybrid signature
   */
  async hybridVerify(
    data: Buffer,
    combinedSignature: Buffer,
    classicalPublicKey: Buffer,
    pqcPublicKey: Buffer
  ): Promise<boolean> {
    // Extract individual signatures
    const classicalSigLength = (combinedSignature[0] << 8) | combinedSignature[1];
    const classicalSignature = combinedSignature.slice(2, 2 + classicalSigLength);
    const pqcSignature = combinedSignature.slice(2 + classicalSigLength);
    
    // Verify classical signature
    const publicKey = crypto.createPublicKey({
      key: classicalPublicKey,
      format: 'der',
      type: 'spki'
    });
    
    const classicalValid = crypto.verify(
      'sha256',
      data,
      publicKey,
      classicalSignature
    );
    
    // Verify PQC signature
    const pqcValid = this.pqcSignature.verify(data, pqcSignature, pqcPublicKey);
    
    // Both must be valid
    return classicalValid && pqcValid;
  }

  /**
   * Combine shared secrets based on hybrid mode
   */
  private async combineSharedSecrets(
    classicalSecret: Buffer,
    pqcSecret: Buffer
  ): Promise<Buffer> {
    switch (this.config.hybridMode) {
      case HybridMode.CONCATENATION:
        return Buffer.concat([classicalSecret, pqcSecret]);
        
      case HybridMode.XOR:
        // XOR the secrets (pad shorter one if needed)
        const maxLength = Math.max(classicalSecret.length, pqcSecret.length);
        const combined = Buffer.alloc(maxLength);
        
        for (let i = 0; i < maxLength; i++) {
          const classicalByte = classicalSecret[i % classicalSecret.length];
          const pqcByte = pqcSecret[i % pqcSecret.length];
          combined[i] = classicalByte ^ pqcByte;
        }
        return combined;
        
      case HybridMode.KDF_COMBINED:
        // Use KDF to combine secrets
        const salt = Buffer.concat([
          Buffer.from('HYBRID_PQC_'),
          Buffer.from([this.config.securityLevel])
        ]);
        
        return crypto.pbkdf2Sync(
          Buffer.concat([classicalSecret, pqcSecret]),
          salt,
          this.config.kdfIterations!,
          32,
          'sha256'
        );
        
      case HybridMode.NESTED:
        // Hash concatenation for nested mode
        return crypto.createHash('sha256')
          .update(classicalSecret)
          .update(pqcSecret)
          .digest();
          
      default:
        throw new Error(`Unknown hybrid mode: ${this.config.hybridMode}`);
    }
  }

  /**
   * Derive encryption and MAC keys from shared secret
   */
  private async deriveKeys(sharedSecret: Buffer): Promise<{
    encryptionKey: Buffer;
    macKey: Buffer;
  }> {
    const kdf = crypto.createHash('sha512').update(sharedSecret).digest();
    
    return {
      encryptionKey: kdf.slice(0, 32),  // 256 bits for AES-256
      macKey: kdf.slice(32, 64)         // 256 bits for HMAC
    };
  }

  /**
   * Get classical elliptic curve based on security level
   */
  private getClassicalCurve(): string {
    switch (this.config.securityLevel) {
      case SecurityLevel.LEVEL1:
        return 'prime256v1';  // P-256
      case SecurityLevel.LEVEL3:
        return 'secp384r1';   // P-384
      case SecurityLevel.LEVEL5:
        return 'secp521r1';   // P-521
      default:
        return 'secp384r1';
    }
  }
}

/**
 * Simplified API for hybrid encryption
 */
export class HybridCrypto {
  private encryption: HybridEncryption;
  
  constructor(
    securityLevel: SecurityLevel = SecurityLevel.LEVEL3,
    mode: HybridMode = HybridMode.KDF_COMBINED
  ) {
    this.encryption = new HybridEncryption({
      classicalAlgorithm: 'ECDH',
      pqcAlgorithm: PQCAlgorithm.KYBER,
      hybridMode: mode,
      securityLevel
    });
  }

  /**
   * Generate a new hybrid identity
   */
  async generateIdentity() {
    return this.encryption.generateHybridKeyPair();
  }

  /**
   * Encrypt data for a recipient
   */
  async encrypt(
    data: Buffer | string,
    recipientPublicKeys: {
      classical: Buffer;
      pqc: Buffer;
    }
  ) {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    const result = await this.encryption.encryptHybrid(
      dataBuffer,
      recipientPublicKeys.classical,
      recipientPublicKeys.pqc
    );
    
    // Package for transmission
    return {
      encrypted: result.encryptedData,
      ephemeralClassicalKey: result.keyExchangeData.classicalPublicKey,
      pqcCiphertext: result.keyExchangeData.encapsulatedData.pqcCiphertext,
      iv: result.iv,
      authTag: result.authTag
    };
  }

  /**
   * Decrypt received data
   */
  async decrypt(
    encryptedPackage: {
      encrypted: Buffer;
      ephemeralClassicalKey: Buffer;
      pqcCiphertext: Buffer;
      iv: Buffer;
      authTag: Buffer;
    },
    privateKeys: {
      classical: Buffer;
      pqc: Buffer;
    }
  ): Promise<Buffer> {
    return this.encryption.decryptHybrid(
      encryptedPackage.encrypted,
      {
        classicalPublicKey: encryptedPackage.ephemeralClassicalKey,
        pqcCiphertext: encryptedPackage.pqcCiphertext
      },
      encryptedPackage.iv,
      encryptedPackage.authTag,
      privateKeys.classical,
      privateKeys.pqc
    );
  }

  /**
   * Sign data with hybrid signature
   */
  async sign(
    data: Buffer | string,
    privateKeys: {
      classical: Buffer;
      pqc: Buffer;
    }
  ) {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    return this.encryption.hybridSign(
      dataBuffer,
      privateKeys.classical,
      privateKeys.pqc
    );
  }

  /**
   * Verify hybrid signature
   */
  async verify(
    data: Buffer | string,
    signature: Buffer,
    publicKeys: {
      classical: Buffer;
      pqc: Buffer;
    }
  ): Promise<boolean> {
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    return this.encryption.hybridVerify(
      dataBuffer,
      signature,
      publicKeys.classical,
      publicKeys.pqc
    );
  }
}