import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LibraryItem } from "@/hooks/useLibrary";

interface DetailViewProps {
  item: LibraryItem;
  onClose: () => void;
}

export const DetailView = ({ item, onClose }: DetailViewProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="container max-w-5xl mx-auto py-8 px-4 h-full">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{item.title}</CardTitle>
                <CardDescription>
                  Created {new Date(item.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <Tabs defaultValue="summary" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
                <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
                <TabsTrigger value="keypoints">Key Points</TabsTrigger>
                <TabsTrigger value="glossary">Glossary</TabsTrigger>
                <TabsTrigger value="exam">Exam</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="summary" className="space-y-4">
                  {item.visual_image_url && (
                    <img
                      src={item.visual_image_url}
                      alt="Visual representation"
                      className="w-full max-w-2xl mx-auto rounded-lg"
                    />
                  )}
                  <p className="text-muted-foreground whitespace-pre-wrap">{item.summary}</p>
                </TabsContent>

                <TabsContent value="transcript">
                  <p className="text-muted-foreground whitespace-pre-wrap">{item.transcript}</p>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  {item.notes?.map((note: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="font-semibold text-lg mb-2">{note.heading}</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="flashcards" className="grid gap-4 md:grid-cols-2">
                  {item.flashcards?.map((card: any, idx: number) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">Q{idx + 1}</CardTitle>
                        <CardDescription>{card.question}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{card.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="quizzes" className="space-y-6">
                  {item.quizzes?.map((quiz: any, idx: number) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                        <CardDescription>{quiz.question}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {quiz.options.map((option: string, optIdx: number) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded ${
                              optIdx === quiz.correctIndex
                                ? "bg-accent border border-primary"
                                : "bg-muted"
                            }`}
                          >
                            {option}
                            {optIdx === quiz.correctIndex && (
                              <span className="ml-2 text-primary text-sm font-medium">
                                ✓ Correct
                              </span>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="keypoints" className="space-y-2">
                  {item.key_points?.map((point: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <span className="font-semibold">{idx + 1}.</span>
                      <p className="text-muted-foreground">{point}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="glossary" className="space-y-4">
                  {item.glossary?.map((entry: any, idx: number) => (
                    <div key={idx}>
                      <h3 className="font-semibold">{entry.term}</h3>
                      <p className="text-muted-foreground">{entry.definition}</p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="exam" className="space-y-6">
                  {item.exam_questions?.map((q: any, idx: number) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                        <CardDescription>{q.question}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Model Answer:</span> {q.modelAnswer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};