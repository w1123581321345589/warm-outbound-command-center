import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useProspects, useUpdateProspect } from "@/hooks/use-prospects";
import { ProspectStage, type Prospect } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Linkedin, 
  Plus,
  GripVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const STAGES = [
  { id: ProspectStage.IDENTIFIED, label: "Identified", color: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
  { id: ProspectStage.WARMING, label: "Warming", color: "bg-blue-50 dark:bg-blue-950 border-blue-100 dark:border-blue-900" },
  { id: ProspectStage.FIRST_TOUCH_READY, label: "Ready for Touch", color: "bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-900" },
  { id: ProspectStage.FIRST_TOUCH_SENT, label: "Touch Sent", color: "bg-purple-50 dark:bg-purple-950 border-purple-100 dark:border-purple-900" },
  { id: ProspectStage.VIDEO_READY, label: "Video Ready", color: "bg-amber-50 dark:bg-amber-950 border-amber-100 dark:border-amber-900" },
  { id: ProspectStage.VIDEO_SENT, label: "Video Sent", color: "bg-orange-50 dark:bg-orange-950 border-orange-100 dark:border-orange-900" },
  { id: ProspectStage.CALL_BOOKED, label: "Call Booked", color: "bg-emerald-50 dark:bg-emerald-950 border-emerald-100 dark:border-emerald-900" },
];

interface ProspectCardProps {
  prospect: Prospect;
  isDragging?: boolean;
}

function ProspectCard({ prospect, isDragging }: ProspectCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style}
      className="bg-card border-card-border shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
      data-testid={`card-prospect-${prospect.id}`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div 
            {...attributes} 
            {...listeners}
            className="mt-1 text-muted-foreground hover:text-foreground cursor-grab"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-foreground leading-tight">
              {prospect.firstName} {prospect.lastName}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {prospect.title}
            </p>
            <p className="text-xs text-muted-foreground/70 font-medium">
              {prospect.company}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 -mr-2 text-muted-foreground hover:text-foreground"
                data-testid={`button-prospect-menu-${prospect.id}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Details</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Mark Lost</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          {prospect.linkedinUrl && (
            <a 
              href={prospect.linkedinUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="text-muted-foreground hover:text-[#0077b5] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="w-4 h-4" />
            </a>
          )}
          <Badge variant="secondary" className="text-[10px]">
            {prospect.source}
          </Badge>
          <div className="flex-1" />
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(prospect.updatedAt || new Date()), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DragOverlayCard({ prospect }: { prospect: Prospect }) {
  return (
    <Card className="bg-card border-primary shadow-lg cursor-grabbing rotate-2">
      <CardContent className="p-4">
        <h4 className="font-semibold text-foreground">
          {prospect.firstName} {prospect.lastName}
        </h4>
        <p className="text-xs text-muted-foreground">{prospect.company}</p>
      </CardContent>
    </Card>
  );
}

export default function Pipeline() {
  const { data: prospects, isLoading } = useProspects();
  const updateProspect = useUpdateProspect();
  const [activeProspect, setActiveProspect] = useState<Prospect | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const prospect = prospects?.find(p => p.id === event.active.id);
    if (prospect) {
      setActiveProspect(prospect);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveProspect(null);

    if (!over) return;

    const prospectId = active.id as number;
    const prospect = prospects?.find(p => p.id === prospectId);
    if (!prospect) return;

    // Check if dropped on a stage column
    const targetStage = STAGES.find(s => s.id === over.id);
    if (targetStage && targetStage.id !== prospect.stage) {
      updateProspect.mutate({ 
        id: prospectId, 
        stage: targetStage.id 
      });
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">Pipeline</h2>
            <p className="text-muted-foreground mt-1">Drag prospects between stages to update their status.</p>
          </div>
          <Button data-testid="button-add-prospect">
            <Plus className="w-4 h-4 mr-2" />
            Add Prospect
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 h-full min-w-max">
              {STAGES.map((stage) => {
                const stageProspects = prospects?.filter(p => p.stage === stage.id) || [];
                
                return (
                  <div 
                    key={stage.id} 
                    className="w-72 flex flex-col gap-3"
                    data-testid={`column-stage-${stage.id}`}
                  >
                    <div className="flex items-center justify-between px-1">
                      <h3 className="font-semibold text-sm text-foreground">{stage.label}</h3>
                      <Badge variant="secondary" className="text-xs">{stageProspects.length}</Badge>
                    </div>

                    <SortableContext
                      id={stage.id}
                      items={stageProspects.map(p => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div 
                        className={`flex-1 rounded-xl border-2 border-dashed p-3 space-y-3 min-h-[200px] ${stage.color}`}
                        data-stage={stage.id}
                      >
                        {isLoading ? (
                          <div className="h-24 bg-card rounded-lg animate-pulse" />
                        ) : stageProspects.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                            Drop prospects here
                          </div>
                        ) : stageProspects.map((prospect) => (
                          <ProspectCard 
                            key={prospect.id} 
                            prospect={prospect}
                            isDragging={activeProspect?.id === prospect.id}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>
          </div>

          <DragOverlay>
            {activeProspect && <DragOverlayCard prospect={activeProspect} />}
          </DragOverlay>
        </DndContext>
      </div>
    </Layout>
  );
}
