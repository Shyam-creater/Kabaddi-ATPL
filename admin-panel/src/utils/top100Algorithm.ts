export type Top100AlgorithmResult = {
  ranking: number; // 1-100
  overallScore: number; // 0-100
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  summary: {
    battingImpact: number;
    bowlingImpact: number;
    fieldingImpact: number;
  };
  wicketsRunImpact: {
    wicketCount: number;
    wicketImpactScore: number;
    runRateAtStart: number;
    runRateAtEnd: number;
    fasterSide: 'A' | 'B' | 'TIE';
  };
};

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function gradeFromScore(score: number): Top100AlgorithmResult['grade'] {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 55) return 'C';
  return 'D';
}

/**
 * “Top 100 Most Accurate Algorithm” (deterministic scoring model)
 *
 * Input is intentionally minimal so it can be computed from live “score entered”
 * fields (realTimeEnter) without needing full ball-object schema.
 */
export function computeTop100Score(input: {
  battingScore?: number; // 0-100
  bowlingScore?: number; // 0-100
  fieldingScore?: number; // 0-100
  wicketCount?: number;
  wicketImpactScore?: number; // 0-100
  runRateAtStart?: number; // runs per over
  runRateAtEnd?: number; // runs per over
  fasterSide?: 'A' | 'B' | 'TIE';
}): Top100AlgorithmResult {
  const battingImpact = clamp(input.battingScore ?? 50, 0, 100);
  const bowlingImpact = clamp(input.bowlingScore ?? 50, 0, 100);
  const fieldingImpact = clamp(input.fieldingScore ?? 50, 0, 100);

  const wicketImpactScore = clamp(input.wicketImpactScore ?? 50, 0, 100);
  const wicketCount = input.wicketCount ?? 0;

  const runRateAtStart = clamp(input.runRateAtStart ?? 0, 0, 50);
  const runRateAtEnd = clamp(input.runRateAtEnd ?? 0, 0, 50);
  const fasterSide = input.fasterSide ?? 'TIE';

  // Weighted composite score
  // - batting: 40%
  // - bowling: 40%
  // - fielding: 10%
  // - wickets impact: 10%
  const overallScore = clamp(
    battingImpact * 0.4 + bowlingImpact * 0.4 + fieldingImpact * 0.1 + wicketImpactScore * 0.1,
    0,
    100
  );

  const ranking = Math.ceil(overallScore);

  return {
    ranking,
    overallScore: Math.round(overallScore * 10) / 10,
    grade: gradeFromScore(overallScore),
    summary: {
      battingImpact,
      bowlingImpact,
      fieldingImpact
    },
    wicketsRunImpact: {
      wicketCount,
      wicketImpactScore,
      runRateAtStart: Math.round(runRateAtStart * 10) / 10,
      runRateAtEnd: Math.round(runRateAtEnd * 10) / 10,
      fasterSide
    }
  };
}

