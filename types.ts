
export enum EnglishLevel {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced',
}

export enum LearningGoal {
  CAREER = 'Career Development',
  TRAVEL = 'Travel Communication',
  CONVERSATION = 'Daily Conversation',
  EXAMS = 'Exam Preparation',
}

export type Language = 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese' | 'Japanese' | 'Korean' | 'Chinese' | 'Russian' | 'Arabic';

export interface UserProfile {
  name: string;
  level: EnglishLevel;
  goals: LearningGoal[];
  interests: string;
  nativeLanguage: Language;
}
