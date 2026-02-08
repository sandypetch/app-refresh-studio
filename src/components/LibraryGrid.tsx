import { FileAudio, FileVideo, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LibraryItem } from "@/hooks/useLibrary";

interface LibraryGridProps {
  items: LibraryItem[];
  onItemClick: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export const LibraryGrid = ({ items, onItemClick, onDelete, isDeleting }: LibraryGridProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No items in your library yet. Upload a file to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const isAudio = item.file_type.startsWith("audio/");
        const isProcessing = item.status === "processing";

        return (
          <Card
            key={item.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => !isProcessing && onItemClick(item)}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="truncate text-lg">{item.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    {isAudio ? (
                      <FileAudio className="w-4 h-4" />
                    ) : (
                      <FileVideo className="w-4 h-4" />
                    )}
                    <span className="text-xs">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </div>
                <Badge variant={isProcessing ? "secondary" : "default"}>
                  {isProcessing ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Processing
                    </span>
                  ) : (
                    "Ready"
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {item.visual_image_url && !isProcessing && (
                <img
                  src={item.visual_image_url}
                  alt="Visual representation"
                  className="w-full h-32 object-cover rounded-md"
                />
              )}
              {item.summary && !isProcessing && (
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                  {item.summary}
                </p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};