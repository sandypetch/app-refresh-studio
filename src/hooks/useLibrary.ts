import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LibraryItem {
  id: string;
  user_id: string;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  duration_seconds: number | null;
  transcript: string | null;
  summary: string | null;
  notes: any;
  flashcards: any;
  quizzes: any;
  key_points: any;
  glossary: any;
  exam_questions: any;
  visual_image_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useLibrary = () => {
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as LibraryItem[];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create library entry
      const { data: libraryItem, error: insertError } = await supabase
        .from("library")
        .insert({
          user_id: user.id,
          title: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          status: "processing",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger transcription and generation
      const { error: functionError } = await supabase.functions.invoke(
        "transcribe-and-generate",
        {
          body: { libraryId: libraryItem.id },
        }
      );

      if (functionError) throw functionError;

      return libraryItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast({
        title: "Upload successful",
        description: "Your file is being processed. Check back soon!",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: item } = await supabase
        .from("library")
        .select("file_path")
        .eq("id", id)
        .single();

      if (item?.file_path) {
        await supabase.storage.from("uploads").remove([item.file_path]);
      }

      const { error } = await supabase.from("library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
      toast({
        title: "Deleted",
        description: "Library item deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });

  return {
    items,
    isLoading,
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteItem: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};