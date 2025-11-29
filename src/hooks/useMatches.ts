import { useState, useEffect, useCallback } from "react";
import { matchService, MatchWithJob } from "@/services/matchService";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook for managing user's job matches.
 * Provides CRUD operations and state management for saved matches.
 * 
 * @param userId - The user's ID to fetch matches for
 * @returns Matches state and operations (matches, loading, error, refetch, deleteMatch, markAsApplied, updateNotes)
 */
export const useMatches = (userId: string | undefined) => {
  const [matches, setMatches] = useState<MatchWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const loadMatches = useCallback(async () => {
    // Guard inside async function to prevent race conditions
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await matchService.getUserMatches(userId);
      setMatches(data);
    } catch (err) {
      setError(err as Error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const deleteMatch = async (matchId: string) => {
    try {
      await matchService.deleteMatch(matchId);
      setMatches(matches.filter((m) => m.id !== matchId));
      toast({
        title: "Match removed",
        description: "The job has been removed from your matches",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to remove match",
        variant: "destructive",
      });
    }
  };

  const markAsApplied = async (matchId: string) => {
    try {
      await matchService.markAsApplied(matchId);
      setMatches(
        matches.map((m) =>
          m.id === matchId
            ? { ...m, is_applied: true, applied_at: new Date().toISOString() }
            : m
        )
      );
      toast({
        title: "Marked as applied! 🎉",
        description: "Good luck with your application!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to mark as applied",
        variant: "destructive",
      });
    }
  };

  const updateNotes = async (matchId: string, notes: string) => {
    try {
      await matchService.updateMatchNotes(matchId, notes);
      setMatches(
        matches.map((m) => (m.id === matchId ? { ...m, notes } : m))
      );
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      });
    }
  };

  return {
    matches,
    loading,
    error,
    refetch: loadMatches,
    deleteMatch,
    markAsApplied,
    updateNotes,
  };
};
