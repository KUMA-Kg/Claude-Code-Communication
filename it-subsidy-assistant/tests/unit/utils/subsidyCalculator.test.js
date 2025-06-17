/**
 * 補助金計算ユーティリティのテスト
 * 高精度な計算ロジックの検証
 */

// 仮想的な補助金計算モジュール（実装に合わせて調整）
const SubsidyCalculator = {
  calculateEligibleAmount: (company, subsidy, investment) => {
    // 基本的な適格性チェック
    if (!company || !subsidy || !investment) {
      throw new Error('必要なパラメータが不足しています');
    }
    
    if (investment.amount <= 0) {
      throw new Error('投資額は0より大きい値である必要があります');
    }
    
    // 企業規模による係数
    const sizeMultiplier = {
      '小規模': 1.0,
      '中小企業': 0.8,
      '大企業': 0.6
    }[company.size] || 0.8;
    
    // 業種による係数
    const industryMultiplier = {
      'IT・情報通信業': 1.2,
      '製造業': 1.1,
      'サービス業': 1.0,
      'その他': 0.9
    }[company.industry] || 1.0;
    
    // 基本計算
    const baseAmount = investment.amount * subsidy.rate;
    const adjustedAmount = baseAmount * sizeMultiplier * industryMultiplier;
    
    // 上限チェック
    const finalAmount = Math.min(adjustedAmount, subsidy.maxAmount);
    
    return {
      eligibleAmount: Math.floor(finalAmount),
      rate: finalAmount / investment.amount,
      breakdown: {
        baseAmount: Math.floor(baseAmount),
        sizeMultiplier,
        industryMultiplier,
        finalAmount: Math.floor(finalAmount)
      }
    };
  },
  
  validateEligibility: (company, subsidy) => {
    const errors = [];
    
    // 企業規模チェック
    if (!subsidy.eligibleSizes.includes(company.size)) {
      errors.push('企業規模が対象外です');
    }
    
    // 業種チェック
    if (subsidy.restrictedIndustries.includes(company.industry)) {
      errors.push('対象外業種です');
    }
    
    // 従業員数チェック
    if (company.employeeCount > subsidy.maxEmployees) {
      errors.push('従業員数が上限を超えています');
    }
    
    // 資本金チェック
    if (company.capital > subsidy.maxCapital) {
      errors.push('資本金が上限を超えています');
    }
    
    return {
      isEligible: errors.length === 0,
      errors
    };
  }
};

describe('SubsidyCalculator', () => {
  // テストデータ
  const mockCompany = {
    id: '1',
    name: '株式会社テスト',
    size: '中小企業',
    industry: 'IT・情報通信業',
    employeeCount: 50,
    capital: 10000000
  };
  
  const mockSubsidy = {
    id: '1',
    title: 'IT導入補助金',
    rate: 0.5,
    maxAmount: 450000,
    eligibleSizes: ['小規模', '中小企業'],
    restrictedIndustries: [],
    maxEmployees: 300,
    maxCapital: 50000000
  };
  
  const mockInvestment = {
    amount: 1000000,
    purpose: 'DX推進',
    category: 'ITツール'
  };

  describe('calculateEligibleAmount', () => {
    test('正常な計算が行われること', () => {
      const result = SubsidyCalculator.calculateEligibleAmount(
        mockCompany,
        mockSubsidy,
        mockInvestment
      );
      
      expect(result).toHaveProperty('eligibleAmount');
      expect(result).toHaveProperty('rate');
      expect(result).toHaveProperty('breakdown');
      expect(result.eligibleAmount).toBeGreaterThan(0);
      expect(result.rate).toBeWithinRange(0, 1);
    });
    
    test('企業規模による係数が正しく適用されること', () => {
      const smallCompany = { ...mockCompany, size: '小規模' };
      const mediumCompany = { ...mockCompany, size: '中小企業' };
      const largeCompany = { ...mockCompany, size: '大企業' };
      
      const smallResult = SubsidyCalculator.calculateEligibleAmount(
        smallCompany, mockSubsidy, mockInvestment
      );
      const mediumResult = SubsidyCalculator.calculateEligibleAmount(
        mediumCompany, mockSubsidy, mockInvestment
      );
      const largeResult = SubsidyCalculator.calculateEligibleAmount(
        largeCompany, mockSubsidy, mockInvestment
      );
      
      expect(smallResult.eligibleAmount).toBeGreaterThan(mediumResult.eligibleAmount);
      expect(mediumResult.eligibleAmount).toBeGreaterThan(largeResult.eligibleAmount);
    });
    
    test('業種による係数が正しく適用されること', () => {
      const itCompany = { ...mockCompany, industry: 'IT・情報通信業' };
      const manufacturingCompany = { ...mockCompany, industry: '製造業' };
      const serviceCompany = { ...mockCompany, industry: 'サービス業' };
      
      const itResult = SubsidyCalculator.calculateEligibleAmount(
        itCompany, mockSubsidy, mockInvestment
      );
      const manufacturingResult = SubsidyCalculator.calculateEligibleAmount(
        manufacturingCompany, mockSubsidy, mockInvestment
      );
      const serviceResult = SubsidyCalculator.calculateEligibleAmount(
        serviceCompany, mockSubsidy, mockInvestment
      );
      
      expect(itResult.eligibleAmount).toBeGreaterThan(manufacturingResult.eligibleAmount);
      expect(manufacturingResult.eligibleAmount).toBeGreaterThan(serviceResult.eligibleAmount);
    });
    
    test('上限額が正しく適用されること', () => {
      const highInvestment = { ...mockInvestment, amount: 2000000 };
      const result = SubsidyCalculator.calculateEligibleAmount(
        mockCompany,
        mockSubsidy,
        highInvestment
      );
      
      expect(result.eligibleAmount).toBeLessThanOrEqual(mockSubsidy.maxAmount);
    });
    
    test('ゼロ以下の投資額でエラーが発生すること', () => {
      const invalidInvestment = { ...mockInvestment, amount: 0 };
      
      expect(() => {
        SubsidyCalculator.calculateEligibleAmount(
          mockCompany,
          mockSubsidy,
          invalidInvestment
        );
      }).toThrow('投資額は0より大きい値である必要があります');
    });
    
    test('必要なパラメータが不足している場合エラーが発生すること', () => {
      expect(() => {
        SubsidyCalculator.calculateEligibleAmount(null, mockSubsidy, mockInvestment);
      }).toThrow('必要なパラメータが不足しています');
      
      expect(() => {
        SubsidyCalculator.calculateEligibleAmount(mockCompany, null, mockInvestment);
      }).toThrow('必要なパラメータが不足しています');
      
      expect(() => {
        SubsidyCalculator.calculateEligibleAmount(mockCompany, mockSubsidy, null);
      }).toThrow('必要なパラメータが不足しています');
    });
    
    test('計算結果の詳細が正しく含まれること', () => {
      const result = SubsidyCalculator.calculateEligibleAmount(
        mockCompany,
        mockSubsidy,
        mockInvestment
      );
      
      expect(result.breakdown).toHaveProperty('baseAmount');
      expect(result.breakdown).toHaveProperty('sizeMultiplier');
      expect(result.breakdown).toHaveProperty('industryMultiplier');
      expect(result.breakdown).toHaveProperty('finalAmount');
      
      expect(result.breakdown.sizeMultiplier).toBe(0.8); // 中小企業
      expect(result.breakdown.industryMultiplier).toBe(1.2); // IT業界
    });
  });

  describe('validateEligibility', () => {
    test('適格な企業の場合trueを返すこと', () => {
      const result = SubsidyCalculator.validateEligibility(mockCompany, mockSubsidy);
      
      expect(result.isEligible).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('企業規模が対象外の場合適格でないこと', () => {
      const ineligibleCompany = { ...mockCompany, size: '大企業' };
      const restrictedSubsidy = { 
        ...mockSubsidy, 
        eligibleSizes: ['小規模', '中小企業'] 
      };
      
      const result = SubsidyCalculator.validateEligibility(
        ineligibleCompany, 
        restrictedSubsidy
      );
      
      expect(result.isEligible).toBe(false);
      expect(result.errors).toContain('企業規模が対象外です');
    });
    
    test('業種が制限対象の場合適格でないこと', () => {
      const restrictedSubsidy = { 
        ...mockSubsidy, 
        restrictedIndustries: ['IT・情報通信業'] 
      };
      
      const result = SubsidyCalculator.validateEligibility(
        mockCompany, 
        restrictedSubsidy
      );
      
      expect(result.isEligible).toBe(false);
      expect(result.errors).toContain('対象外業種です');
    });
    
    test('従業員数が上限を超える場合適格でないこと', () => {
      const largeCompany = { ...mockCompany, employeeCount: 400 };
      
      const result = SubsidyCalculator.validateEligibility(
        largeCompany, 
        mockSubsidy
      );
      
      expect(result.isEligible).toBe(false);
      expect(result.errors).toContain('従業員数が上限を超えています');
    });
    
    test('資本金が上限を超える場合適格でないこと', () => {
      const richCompany = { ...mockCompany, capital: 100000000 };
      
      const result = SubsidyCalculator.validateEligibility(
        richCompany, 
        mockSubsidy
      );
      
      expect(result.isEligible).toBe(false);
      expect(result.errors).toContain('資本金が上限を超えています');
    });
    
    test('複数の条件に抵触する場合全てのエラーが返されること', () => {
      const ineligibleCompany = {
        ...mockCompany,
        size: '大企業',
        employeeCount: 400,
        capital: 100000000
      };
      const restrictedSubsidy = {
        ...mockSubsidy,
        eligibleSizes: ['小規模', '中小企業'],
        restrictedIndustries: ['IT・情報通信業']
      };
      
      const result = SubsidyCalculator.validateEligibility(
        ineligibleCompany, 
        restrictedSubsidy
      );
      
      expect(result.isEligible).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors).toContain('企業規模が対象外です');
      expect(result.errors).toContain('対象外業種です');
      expect(result.errors).toContain('従業員数が上限を超えています');
      expect(result.errors).toContain('資本金が上限を超えています');
    });
  });

  describe('エッジケーステスト', () => {
    test('最小投資額での計算', () => {
      const minInvestment = { ...mockInvestment, amount: 1 };
      const result = SubsidyCalculator.calculateEligibleAmount(
        mockCompany,
        mockSubsidy,
        minInvestment
      );
      
      expect(result.eligibleAmount).toBeGreaterThanOrEqual(0);
    });
    
    test('補助率0%での計算', () => {
      const zeroRateSubsidy = { ...mockSubsidy, rate: 0 };
      const result = SubsidyCalculator.calculateEligibleAmount(
        mockCompany,
        zeroRateSubsidy,
        mockInvestment
      );
      
      expect(result.eligibleAmount).toBe(0);
    });
    
    test('補助率100%での計算', () => {
      const fullRateSubsidy = { ...mockSubsidy, rate: 1.0, maxAmount: 1000000 };
      const result = SubsidyCalculator.calculateEligibleAmount(
        mockCompany,
        fullRateSubsidy,
        mockInvestment
      );
      
      expect(result.rate).toBeLessThanOrEqual(1.0);
    });
    
    test('極端に大きな投資額での計算', () => {
      const hugeInvestment = { ...mockInvestment, amount: Number.MAX_SAFE_INTEGER };
      const result = SubsidyCalculator.calculateEligibleAmount(
        mockCompany,
        mockSubsidy,
        hugeInvestment
      );
      
      expect(result.eligibleAmount).toBe(mockSubsidy.maxAmount);
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量計算の処理時間が許容範囲内であること', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        SubsidyCalculator.calculateEligibleAmount(
          mockCompany,
          mockSubsidy,
          { ...mockInvestment, amount: 100000 + i }
        );
      }
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // 1000回の計算が100ms以内に完了することを期待
      expect(executionTime).toBeLessThan(100);
    });
    
    test('メモリリークが発生しないこと', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      for (let i = 0; i < 10000; i++) {
        SubsidyCalculator.calculateEligibleAmount(
          mockCompany,
          mockSubsidy,
          mockInvestment
        );
      }
      
      // ガベージコレクションを促進
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // メモリ増加が10MB未満であることを期待
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('セキュリティテスト', () => {
    test('悪意のある入力値に対する耐性', () => {
      const maliciousCompany = {
        ...mockCompany,
        name: '<script>alert("XSS")</script>',
        size: '"; DROP TABLE companies; --'
      };
      
      expect(() => {
        SubsidyCalculator.calculateEligibleAmount(
          maliciousCompany,
          mockSubsidy,
          mockInvestment
        );
      }).not.toThrow();
    });
    
    test('不正な数値に対するバリデーション', () => {
      const invalidInvestment = {
        ...mockInvestment,
        amount: 'invalid_number'
      };
      
      expect(() => {
        SubsidyCalculator.calculateEligibleAmount(
          mockCompany,
          mockSubsidy,
          invalidInvestment
        );
      }).toThrow();
    });
    
    test('負の数値に対するバリデーション', () => {
      const negativeInvestment = {
        ...mockInvestment,
        amount: -1000000
      };
      
      expect(() => {
        SubsidyCalculator.calculateEligibleAmount(
          mockCompany,
          mockSubsidy,
          negativeInvestment
        );
      }).toThrow('投資額は0より大きい値である必要があります');
    });
  });
});