import { useState } from "react";
import { useLibrary } from "@/hooks/useLibrary";
import { UploadSection } from "@/components/UploadSection";
import { LibraryGrid } from "@/components/LibraryGrid";
import { DetailView } from "@/components/DetailView";
import { LibraryItem } from "@/hooks/useLibrary";

const Index = () => {
  const { items, isLoading, upload, isUploading, deleteItem, isDeleting } = useLibrary();
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Zora</h1>
          <p className="text-muted-foreground">
            Transform audio and video into comprehensive study materials
          </p>
        </header>

        <div className="space-y-8">
          <UploadSection onUpload={upload} isUploading={isUploading} />

          <div>
            <h2 className="text-2xl font-semibold mb-4">Your Library</h2>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <LibraryGrid
                items={items}
                onItemClick={setSelectedItem}
                onDelete={deleteItem}
                isDeleting={isDeleting}
              />
            )}
          </div>
        </div>
      </div>

      {selectedItem && (
        <DetailView item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
};

export default Index;