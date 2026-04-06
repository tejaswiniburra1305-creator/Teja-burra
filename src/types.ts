export interface Student {
  id: string;
  name: string;
  avatar?: string;
  attendance: 'present' | 'absent' | 'late';
  attentionScore: number;
  attendancePercentage: number;
  status: 'focused' | 'distracted' | 'idle';
  lastActive: string;
  feedback?: string;
  details: {
    age: number;
    grade: string;
    parentContact: string;
    interests: string[];
  };
}

export interface ClassroomMetrics {
  averageAttention: number;
  activeStudents: number;
  distractedCount: number;
  attendanceRate: number;
  engagementTrend: { time: string; score: number }[];
  insights: string[];
}

export interface AIAnalysisResult {
  overallScore: number;
  studentCount: number;
  distractedCount: number;
  summary: string;
  recommendations: string[];
  studentIdentifications?: {
    name: string;
    status: 'focused' | 'distracted' | 'idle';
    score: number;
    feedback?: string;
  }[];
}
