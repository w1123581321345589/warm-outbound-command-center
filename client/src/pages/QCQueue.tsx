import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useQCQueue, useReviewQCItem } from "@/hooks/use-qc";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, MessageSquare, RefreshCw } from "lucide-react";
import { QCStatus } from "@shared/schema";

export default function QCQueue() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const { data: items, isLoading } = useQCQueue(statusFilter);
  const reviewItem = useReviewQCItem();
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  const handleReview = (id: number, status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED') => {
    if (!user) return;
    reviewItem.mutate({
      id,
      status,
      reviewedById: user.id,
      feedback: feedback[id]
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">QC Queue</h2>
          <p className="text-muted-foreground mt-1">Review outbound drafts before they are sent.</p>
        </div>

        <Tabs defaultValue="PENDING" onValueChange={setStatusFilter} className="w-full">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="PENDING">Pending Review</TabsTrigger>
            <TabsTrigger value="REVISION_REQUESTED">Revisions</TabsTrigger>
            <TabsTrigger value="APPROVED">Approved History</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-6">
          {isLoading ? (
            <div className="text-center p-8">Loading queue...</div>
          ) : items?.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
              <p className="text-muted-foreground">No items in this queue.</p>
            </div>
          ) : (
            items?.map((item) => (
              <Card key={item.id} className="bg-white border-slate-200 shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {/* Context Side */}
                  <div className="p-6 md:w-1/3 bg-slate-50 border-r border-slate-100 space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900">Prospect</h4>
                      <div className="mt-1 p-3 bg-white rounded-lg border border-slate-200">
                        <p className="font-medium text-sm">John Doe</p>
                        <p className="text-xs text-slate-500">CEO at Example Corp</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-2">Type</h4>
                      <Badge variant="secondary" className="bg-white border border-slate-200">
                        {item.type}
                      </Badge>
                    </div>
                  </div>

                  {/* Content Side */}
                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex-1 space-y-4">
                      <h4 className="font-semibold text-slate-900">Draft Content</h4>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm whitespace-pre-wrap font-mono text-slate-700">
                        {item.draftContent}
                      </div>

                      {statusFilter === 'PENDING' && (
                        <div className="pt-4">
                          <label className="text-sm font-medium text-slate-700 mb-2 block">
                            Feedback (Optional)
                          </label>
                          <Textarea 
                            placeholder="Add notes for the VA..." 
                            className="bg-white"
                            value={feedback[item.id] || ''}
                            onChange={(e) => setFeedback(prev => ({...prev, [item.id]: e.target.value}))}
                          />
                        </div>
                      )}
                    </div>

                    {statusFilter === 'PENDING' && (
                      <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                        <Button 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleReview(item.id, 'REJECTED')}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button 
                          variant="outline"
                          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                          onClick={() => handleReview(item.id, 'REVISION_REQUESTED')}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Revision
                        </Button>
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleReview(item.id, 'APPROVED')}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve & Send
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
