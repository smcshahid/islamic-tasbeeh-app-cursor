import { 
  shouldCheckAchievements, 
  USER_LEVELS,
  achievementManager,
  ACHIEVEMENTS
} from '../achievements';

// Mock data types (simplified for testing)
interface TestCounter {
  id: string;
  name: string;
  count: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface TestSession {
  id: string;
  counterId: string;
  counterName: string;
  startTime: string;
  endTime?: string;
  startCount: number;
  endCount: number;
  duration: number;
  totalCounts: number;
}

describe('Achievement System - Pure Logic Tests', () => {
  
  describe('shouldCheckAchievements', () => {
    it('should return true for milestone counts', () => {
      expect(shouldCheckAchievements(100, 99)).toBe(true); // 100 milestone  
      expect(shouldCheckAchievements(33, 32)).toBe(true);  // 33 tasbih
      expect(shouldCheckAchievements(99, 98)).toBe(true);  // 99 asma ul husna
      expect(shouldCheckAchievements(500, 499)).toBe(true); // 500 milestone
      expect(shouldCheckAchievements(1000, 999)).toBe(true); // 1000 milestone
    });

    it('should return false for non-milestone counts', () => {
      expect(shouldCheckAchievements(50, 49)).toBe(false);
      expect(shouldCheckAchievements(75, 74)).toBe(false);
      expect(shouldCheckAchievements(150, 149)).toBe(false);
    });

    it('should return true when crossing hundred boundaries', () => {
      expect(shouldCheckAchievements(200, 199)).toBe(true); // Crossing 200
      expect(shouldCheckAchievements(300, 299)).toBe(true); // Crossing 300
    });

    it('should handle edge cases', () => {
      expect(shouldCheckAchievements(0)).toBe(true); // 0 is considered a milestone (major milestone check)
      expect(shouldCheckAchievements(1, 0)).toBe(false); // 1 is not a special milestone
    });
  });

  describe('USER_LEVELS constant', () => {
    it('should be properly defined array', () => {
      expect(Array.isArray(USER_LEVELS)).toBe(true);
      expect(USER_LEVELS.length).toBeGreaterThan(0);
    });

    it('should have proper structure for each level', () => {
      USER_LEVELS.forEach(level => {
        expect(level).toHaveProperty('name');
        expect(level).toHaveProperty('minCounts');
        expect(level).toHaveProperty('color');
        expect(level).toHaveProperty('icon');
        expect(level).toHaveProperty('benefits');
        expect(typeof level.name).toBe('string');
        expect(typeof level.minCounts).toBe('number');
        expect(Array.isArray(level.benefits)).toBe(true);
      });
    });

    it('should be sorted by minCounts ascending', () => {
      for (let i = 1; i < USER_LEVELS.length; i++) {
        expect(USER_LEVELS[i].minCounts).toBeGreaterThanOrEqual(USER_LEVELS[i - 1].minCounts);
      }
    });

    it('should have reasonable level names', () => {
      const levelNames = USER_LEVELS.map(l => l.name);
      expect(levelNames).toContain('Newcomer');
      expect(levelNames).toContain('Beginner');
      expect(levelNames).toContain('Master');
    });
  });

  describe('ACHIEVEMENTS constant', () => {
    it('should be properly defined array', () => {
      expect(Array.isArray(ACHIEVEMENTS)).toBe(true);
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it('should have proper structure for each achievement', () => {
      ACHIEVEMENTS.forEach(achievement => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('name'); 
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('icon');
        expect(achievement).toHaveProperty('threshold');
        expect(achievement).toHaveProperty('type');
        expect(typeof achievement.name).toBe('string');
        expect(typeof achievement.threshold).toBe('number');
      });
    });

    it('should have different achievement types', () => {
      const types = ACHIEVEMENTS.map(a => a.type);
      const uniqueTypes = [...new Set(types)];
      
      expect(uniqueTypes.length).toBeGreaterThan(1);
      expect(uniqueTypes).toContain('level');
      expect(uniqueTypes).toContain('milestone');
    });
  });

  describe('AchievementManager.calculateUserLevel', () => {
    it('should return correct level for different total counts', () => {
      // Test Newcomer level (0-99)
      const newcomerLevel = achievementManager.calculateUserLevel(50);
      expect(newcomerLevel.name).toBe('Newcomer');
      expect(newcomerLevel.minCounts).toBe(0);

      // Test Beginner level (100-499)
      const beginnerLevel = achievementManager.calculateUserLevel(150);
      expect(beginnerLevel.name).toBe('Beginner');
      expect(beginnerLevel.minCounts).toBe(100);

      // Test higher level
      const higherLevel = achievementManager.calculateUserLevel(2000);
      expect(higherLevel.minCounts).toBeGreaterThan(100);
    });

    it('should handle boundary conditions', () => {
      const zeroLevel = achievementManager.calculateUserLevel(0);
      expect(zeroLevel.name).toBe('Newcomer');

      const exactBoundary = achievementManager.calculateUserLevel(100);
      expect(exactBoundary.name).toBe('Beginner');
    });

    it('should handle very large numbers', () => {
      const level = achievementManager.calculateUserLevel(1000000);
      expect(level.name).toBe('Sage'); // Highest level
    });

    it('should handle negative numbers gracefully', () => {
      const negativeLevel = achievementManager.calculateUserLevel(-100);
      expect(negativeLevel.name).toBe('Newcomer'); // Should default to first level
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid function calls efficiently', () => {
      const start = performance.now();
      
      // Simulate rapid calls
      for (let i = 0; i < 1000; i++) {
        shouldCheckAchievements(i, i - 1);
        achievementManager.calculateUserLevel(i * 10);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 1000 operations quickly (< 200ms)
      expect(duration).toBeLessThan(200);
    });

    it('should maintain consistent results', () => {
      const testCases = [
        { newCount: 100, oldCount: 99 },
        { newCount: 33, oldCount: 32 },
        { newCount: 1000, oldCount: 999 }
      ];

      testCases.forEach(({ newCount, oldCount }) => {
        const result1 = shouldCheckAchievements(newCount, oldCount);
        const result2 = shouldCheckAchievements(newCount, oldCount);
        const result3 = shouldCheckAchievements(newCount, oldCount);
        
        expect(result1).toBe(result2);
        expect(result2).toBe(result3);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle extreme values', () => {
      expect(() => achievementManager.calculateUserLevel(Number.MAX_SAFE_INTEGER)).not.toThrow();
      expect(() => achievementManager.calculateUserLevel(Number.MIN_SAFE_INTEGER)).not.toThrow();
      expect(() => shouldCheckAchievements(Number.MAX_SAFE_INTEGER, 0)).not.toThrow();
    });

    it('should handle NaN and Infinity', () => {
      expect(() => achievementManager.calculateUserLevel(NaN)).not.toThrow();
      expect(() => achievementManager.calculateUserLevel(Infinity)).not.toThrow();
      expect(() => shouldCheckAchievements(NaN, 0)).not.toThrow();
    });

    it('should handle null and undefined gracefully', () => {
      expect(() => achievementManager.calculateUserLevel(null as any)).not.toThrow();
      expect(() => achievementManager.calculateUserLevel(undefined as any)).not.toThrow();
      expect(() => shouldCheckAchievements(null as any, 0)).not.toThrow();
    });
  });

  describe('Islamic Context Validation', () => {
    it('should recognize traditional Islamic counting numbers', () => {
      const islamicNumbers = [33, 99, 100, 1000];
      
      islamicNumbers.forEach(num => {
        expect(shouldCheckAchievements(num, num - 1)).toBe(true);
      });
    });

    it('should handle typical dhikr patterns', () => {
      // Simulate common dhikr counting patterns
      const patterns = [
        { target: 33, steps: [10, 20, 30, 33] },
        { target: 99, steps: [33, 66, 99] },
        { target: 100, steps: [25, 50, 75, 100] }
      ];

      patterns.forEach(pattern => {
        pattern.steps.forEach((step, index) => {
          const previousCount = index > 0 ? pattern.steps[index - 1] : 0;
          const shouldCheck = shouldCheckAchievements(step, previousCount);
          
          // Check if this step would trigger an achievement check
          if (step === 33 || step === 99 || step === 100 || step % 100 === 0) {
            expect(shouldCheck).toBe(true);
          }
        });
      });
    });

    it('should validate Islamic counting milestones', () => {
      // Tasbih count (33) and Asma ul Husna (99) should always trigger checks
      expect(shouldCheckAchievements(33)).toBe(true);
      expect(shouldCheckAchievements(66)).toBe(true);  // 2 * 33
      expect(shouldCheckAchievements(99)).toBe(true);  
      expect(shouldCheckAchievements(132)).toBe(true); // 4 * 33
      expect(shouldCheckAchievements(198)).toBe(true); // 2 * 99
    });
  });

  describe('Level System Validation', () => {
    it('should have progressive thresholds', () => {
      const thresholds = USER_LEVELS.map(level => level.minCounts);
      
      // Should start from 0
      expect(thresholds[0]).toBe(0);
      
      // Each threshold should be higher than the previous
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
      }
    });

    it('should have meaningful progression', () => {
      // Test that progression makes sense
      expect(achievementManager.calculateUserLevel(0).name).toBe('Newcomer');
      expect(achievementManager.calculateUserLevel(100).name).toBe('Beginner');
      expect(achievementManager.calculateUserLevel(100000).name).toBe('Sage');
    });

    it('should handle level calculation edge cases', () => {
      // Test exact boundaries
      const level100 = achievementManager.calculateUserLevel(100);
      const level99 = achievementManager.calculateUserLevel(99);
      
      // 100 should be a higher level than 99
      expect(level100.minCounts).toBeGreaterThan(level99.minCounts);
    });
  });

  describe('Binary Search Optimization', () => {
    it('should efficiently find levels for various counts', () => {
      const testCounts = [0, 1, 50, 100, 250, 500, 1000, 5000, 25000, 100000];
      
      testCounts.forEach(count => {
        const level = achievementManager.calculateUserLevel(count);
        expect(level.minCounts).toBeLessThanOrEqual(count);
        expect(typeof level.name).toBe('string');
        expect(level.name.length).toBeGreaterThan(0);
      });
    });
  });
}); 