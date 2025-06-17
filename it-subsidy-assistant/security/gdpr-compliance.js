/**
 * GDPR準拠・個人情報保護モジュール
 * EU一般データ保護規則（GDPR）およびPC PI法に準拠
 */

class GDPRCompliance {
  constructor() {
    this.consentTypes = {
      NECESSARY: 'necessary',
      ANALYTICS: 'analytics', 
      MARKETING: 'marketing',
      PERSONALIZATION: 'personalization'
    };
    
    this.dataRetentionPeriods = {
      SESSION_DATA: 24 * 60 * 60 * 1000, // 24時間
      USER_DATA: 730 * 24 * 60 * 60 * 1000, // 2年
      AUDIT_LOGS: 2555 * 24 * 60 * 60 * 1000 // 7年
    };
  }

  /**
   * 同意管理
   */
  async recordConsent(userId, consentData) {
    const consent = {
      userId,
      timestamp: new Date().toISOString(),
      consentGiven: consentData,
      ipAddress: this.hashIP(consentData.ipAddress),
      userAgent: consentData.userAgent,
      consentVersion: '1.0'
    };
    
    await this.storeConsent(consent);
    await this.auditLog('CONSENT_RECORDED', { userId, consentTypes: Object.keys(consentData) });
    
    return consent;
  }

  /**
   * 同意撤回
   */
  async withdrawConsent(userId, consentType) {
    const withdrawal = {
      userId,
      consentType,
      timestamp: new Date().toISOString(),
      action: 'WITHDRAWN'
    };
    
    await this.updateConsent(userId, consentType, false);
    await this.auditLog('CONSENT_WITHDRAWN', withdrawal);
    
    // 該当データの削除処理
    await this.deleteConsentRelatedData(userId, consentType);
    
    return withdrawal;
  }

  /**
   * データ主体の権利対応
   */
  async handleDataSubjectRequest(userId, requestType) {
    await this.auditLog('DATA_SUBJECT_REQUEST', { userId, requestType });
    
    switch (requestType) {
      case 'ACCESS':
        return await this.exportUserData(userId);
      case 'RECTIFICATION':
        return await this.rectifyUserData(userId);
      case 'ERASURE':
        return await this.eraseUserData(userId);
      case 'PORTABILITY':
        return await this.portUserData(userId);
      case 'OBJECTION':
        return await this.processObjection(userId);
      default:
        throw new Error('Invalid request type');
    }
  }

  /**
   * 個人データ輸出（忘れられる権利）
   */
  async exportUserData(userId) {
    const userData = {
      personalInfo: await this.getPersonalInfo(userId),
      applicationHistory: await this.getApplicationHistory(userId),
      searchHistory: await this.getSearchHistory(userId),
      consentHistory: await this.getConsentHistory(userId),
      exportTimestamp: new Date().toISOString()
    };
    
    // 個人データの暗号化
    const encryptedData = await this.encryptData(userData);
    
    await this.auditLog('DATA_EXPORTED', { userId, dataTypes: Object.keys(userData) });
    
    return {
      data: encryptedData,
      format: 'JSON',
      encryption: 'AES-256-GCM'
    };
  }

  /**
   * 個人データ削除（忘れられる権利）
   */
  async eraseUserData(userId) {
    const deletionResult = {
      deletedTables: [],
      anonymizedData: [],
      retainedData: [], // 法的義務により保持が必要なデータ
      timestamp: new Date().toISOString()
    };
    
    try {
      // 個人識別情報の削除
      await this.deletePersonalInfo(userId);
      deletionResult.deletedTables.push('user_profiles');
      
      // 申請履歴の匿名化（統計目的で保持）
      await this.anonymizeApplicationHistory(userId);
      deletionResult.anonymizedData.push('application_history');
      
      // 検索履歴の削除
      await this.deleteSearchHistory(userId);
      deletionResult.deletedTables.push('search_history');
      
      // 監査ログは法的義務により保持
      deletionResult.retainedData.push('audit_logs');
      
      await this.auditLog('DATA_ERASED', { userId, result: deletionResult });
      
      return deletionResult;
    } catch (error) {
      await this.auditLog('DATA_ERASURE_FAILED', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * データ保持期間管理
   */
  async cleanupExpiredData() {
    const now = Date.now();
    const cleanupResults = {
      sessionData: 0,
      userData: 0,
      auditLogs: 0
    };
    
    // セッションデータの削除
    const expiredSessions = await this.findExpiredSessions(now - this.dataRetentionPeriods.SESSION_DATA);
    cleanupResults.sessionData = await this.deleteSessions(expiredSessions);
    
    // ユーザーデータの削除
    const expiredUsers = await this.findExpiredUsers(now - this.dataRetentionPeriods.USER_DATA);
    cleanupResults.userData = await this.deleteUsers(expiredUsers);
    
    // 古い監査ログの削除
    const expiredLogs = await this.findExpiredLogs(now - this.dataRetentionPeriods.AUDIT_LOGS);
    cleanupResults.auditLogs = await this.deleteLogs(expiredLogs);
    
    await this.auditLog('DATA_CLEANUP_COMPLETED', cleanupResults);
    
    return cleanupResults;
  }

  /**
   * プライバシー影響評価（PIA）
   */
  async conductPrivacyImpactAssessment(feature) {
    const assessment = {
      feature,
      timestamp: new Date().toISOString(),
      risks: [],
      mitigations: [],
      approval: null
    };
    
    // データ処理のリスク評価
    const dataProcessingRisks = await this.assessDataProcessingRisks(feature);
    assessment.risks.push(...dataProcessingRisks);
    
    // 技術的保護措置の評価
    const technicalSafeguards = await this.assessTechnicalSafeguards(feature);
    assessment.mitigations.push(...technicalSafeguards);
    
    // 組織的保護措置の評価
    const organizationalSafeguards = await this.assessOrganizationalSafeguards(feature);
    assessment.mitigations.push(...organizationalSafeguards);
    
    // 残余リスクの評価
    const residualRisk = this.calculateResidualRisk(assessment.risks, assessment.mitigations);
    assessment.residualRisk = residualRisk;
    
    // 承認判定
    assessment.approval = residualRisk <= 0.3 ? 'APPROVED' : 'REQUIRES_REVIEW';
    
    await this.auditLog('PIA_CONDUCTED', assessment);
    
    return assessment;
  }

  /**
   * データ処理記録（Article 30 GDPR）
   */
  async recordProcessingActivity(activity) {
    const record = {
      id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      controllerName: 'IT補助金アシストツール',
      controllerContact: 'privacy@example.com',
      activity: activity.name,
      purposes: activity.purposes,
      dataSubjects: activity.dataSubjects,
      personalDataCategories: activity.personalDataCategories,
      recipients: activity.recipients || [],
      thirdCountryTransfers: activity.thirdCountryTransfers || [],
      retentionPeriod: activity.retentionPeriod,
      technicalSafeguards: activity.technicalSafeguards,
      organizationalSafeguards: activity.organizationalSafeguards
    };
    
    await this.storeProcessingRecord(record);
    await this.auditLog('PROCESSING_ACTIVITY_RECORDED', { activityId: record.id });
    
    return record;
  }

  /**
   * データ侵害通知
   */
  async handleDataBreach(breach) {
    const notification = {
      id: this.generateUUID(),
      timestamp: new Date().toISOString(),
      severity: breach.severity,
      affectedDataTypes: breach.affectedDataTypes,
      affectedSubjects: breach.affectedSubjects,
      consequences: breach.consequences,
      mitigationMeasures: breach.mitigationMeasures,
      notificationsSent: []
    };
    
    // 72時間以内の当局通知が必要かチェック
    if (notification.severity === 'HIGH') {
      notification.authorityNotificationRequired = true;
      notification.authorityNotificationDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    }
    
    // データ主体への通知が必要かチェック
    if (notification.consequences.includes('HIGH_RISK_TO_RIGHTS')) {
      notification.subjectNotificationRequired = true;
      await this.notifyAffectedDataSubjects(notification);
    }
    
    await this.auditLog('DATA_BREACH_HANDLED', notification);
    
    return notification;
  }

  /**
   * IPアドレスのハッシュ化（匿名化）
   */
  hashIP(ipAddress) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(ipAddress + process.env.IP_SALT).digest('hex');
  }

  /**
   * データ暗号化
   */
  async encryptData(data) {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('IT補助金アシストツール', 'utf8'));
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      data: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * UUID生成
   */
  generateUUID() {
    const crypto = require('crypto');
    return crypto.randomUUID();
  }

  /**
   * 監査ログ記録
   */
  async auditLog(action, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      source: 'GDPR_COMPLIANCE_MODULE'
    };
    
    // 監査ログの保存（実装依存）
    console.log('AUDIT:', JSON.stringify(logEntry));
  }
}

module.exports = GDPRCompliance;