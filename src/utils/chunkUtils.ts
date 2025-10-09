export interface DateChunk {
  startDate: string;
  endDate: string;
  chunkNumber: number;
}

export interface ChunkingResult {
  chunks: DateChunk[];
  totalChunks: number;
}

export function chunkDateRange(
  startDate: string,
  endDate: string,
  chunkSizeDays: number = 3
): ChunkingResult {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    throw new Error('Start date cannot be after end date');
  }

  const chunks: DateChunk[] = [];
  let currentStart = new Date(start);
  let chunkNumber = 1;

  while (currentStart <= end) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + chunkSizeDays - 1);

    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }

    chunks.push({
      startDate: currentStart.toISOString().split('T')[0],
      endDate: currentEnd.toISOString().split('T')[0],
      chunkNumber
    });

    currentStart.setDate(currentEnd.getDate() + 1);
    chunkNumber++;
  }

  return {
    chunks,
    totalChunks: chunks.length
  };
}

export function getNextChunk(
  chunks: DateChunk[],
  currentChunkNumber: number
): DateChunk | null {
  if (currentChunkNumber >= chunks.length) {
    return null;
  }
  return chunks[currentChunkNumber];
}

export function calculateProgress(
  completedChunks: number,
  totalChunks: number
): number {
  if (totalChunks === 0) return 0;
  return Math.round((completedChunks / totalChunks) * 100);
}
