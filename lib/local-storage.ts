/**
 * Local JSON storage for testing phase
 * This will be replaced with a real database later (Supabase, MongoDB, etc.)
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { SubmissionData, AnalysisReport } from './report-types';

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

export interface StoredSubmission {
  id: string;
  submissionData: SubmissionData;
  analysisReport: AnalysisReport;
  createdAt: string;
}

/**
 * Save a submission and its analysis report to local JSON file
 */
export async function saveSubmission(
  submissionData: SubmissionData,
  analysisReport: AnalysisReport
): Promise<StoredSubmission> {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Read existing submissions
    let submissions: StoredSubmission[] = [];
    try {
      const data = await fs.readFile(SUBMISSIONS_FILE, 'utf-8');
      submissions = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty array
      console.log('Creating new submissions file');
    }

    // Create new submission record
    const newSubmission: StoredSubmission = {
      id: submissionData.submissionId,
      submissionData,
      analysisReport,
      createdAt: new Date().toISOString(),
    };

    // Add to submissions array
    submissions.push(newSubmission);

    // Write back to file
    await fs.writeFile(
      SUBMISSIONS_FILE,
      JSON.stringify(submissions, null, 2),
      'utf-8'
    );

    console.log(`✅ Saved submission ${newSubmission.id} to local storage`);
    return newSubmission;
  } catch (error) {
    console.error('❌ Failed to save submission:', error);
    throw new Error('Failed to save submission to local storage');
  }
}

/**
 * Get a submission by ID
 */
export async function getSubmission(id: string): Promise<StoredSubmission | null> {
  try {
    const data = await fs.readFile(SUBMISSIONS_FILE, 'utf-8');
    const submissions: StoredSubmission[] = JSON.parse(data);
    return submissions.find(s => s.id === id) || null;
  } catch (error) {
    console.error('Failed to read submission:', error);
    return null;
  }
}

/**
 * Get all submissions (for admin dashboard)
 */
export async function getAllSubmissions(): Promise<StoredSubmission[]> {
  try {
    const data = await fs.readFile(SUBMISSIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read submissions:', error);
    return [];
  }
}

/**
 * Get submission statistics
 */
export async function getSubmissionStats(): Promise<{
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}> {
  const submissions = await getAllSubmissions();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    total: submissions.length,
    today: submissions.filter(s => new Date(s.createdAt) >= todayStart).length,
    thisWeek: submissions.filter(s => new Date(s.createdAt) >= weekStart).length,
    thisMonth: submissions.filter(s => new Date(s.createdAt) >= monthStart).length,
  };
}
