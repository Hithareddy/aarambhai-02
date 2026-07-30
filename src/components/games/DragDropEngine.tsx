import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

export interface DragItem {
    id: string;
    content: React.ReactNode;
}

interface DragDropEngineProps {
    sourceItems: DragItem[];
    targetItems: DragItem[];
    onSequenceChange: (newSequence: DragItem[]) => void;
    orientation?: 'horizontal' | 'vertical';
    droppableId?: string;
}

export function DragDropEngine({
    sourceItems,
    targetItems: controlledTargetItems,
    onSequenceChange,
    orientation = 'horizontal',
    droppableId = 'dropzone-target'
}: DragDropEngineProps) {

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;

        if (result.source.droppableId === 'source-bank' && result.destination.droppableId === droppableId) {
            // Adding from bank to target
            const draggedItem = sourceItems.find(item => item.id === result.draggableId);
            if (draggedItem) {
                const newTargets = Array.from(controlledTargetItems);
                newTargets.splice(result.destination.index, 0, draggedItem);
                onSequenceChange(newTargets);
            }
        } else if (result.source.droppableId === droppableId && result.destination.droppableId === droppableId) {
            // Reordering target
            const newTargets = Array.from(controlledTargetItems);
            const [reorderedItem] = newTargets.splice(result.source.index, 1);
            newTargets.splice(result.destination.index, 0, reorderedItem);
            onSequenceChange(newTargets);
        }
    };

    const handleRemoveFromTarget = (index: number) => {
        const newTargets = Array.from(controlledTargetItems);
        newTargets.splice(index, 1);
        onSequenceChange(newTargets);
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex flex-col space-y-8 w-full items-center">

                {/* Target Sequence Zone */}
                <Droppable droppableId={droppableId} direction={orientation}>
                    {(provided: any, snapshot: any) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                                "min-h-[100px] min-w-[300px] p-4 rounded-xl border-2 border-dashed flex gap-3 flex-wrap transition-colors",
                                snapshot.isDraggingOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/10",
                                orientation === 'vertical' ? 'flex-col' : 'flex-row items-center justify-center'
                            )}
                        >
                            {controlledTargetItems.length === 0 && (
                                <div className="text-muted-foreground italic absolute m-auto">Drop items here</div>
                            )}
                            {controlledTargetItems.map((item, index) => (
                                <Draggable key={`${item.id}-target-${index}`} draggableId={`${item.id}-target-${index}`} index={index}>
                                    {(provided: any, snapshot: any) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => handleRemoveFromTarget(index)}
                                            className={cn(
                                                "transition-transform",
                                                snapshot.isDragging ? "scale-110 drop-shadow-xl z-50" : ""
                                            )}
                                        >
                                            <Card className="px-4 py-3 cursor-grab active:cursor-grabbing hover:bg-destructive/10 hover:border-destructive transition-colors">
                                                {item.content}
                                            </Card>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

                {/* Source Word Bank */}
                <Droppable droppableId="source-bank" direction="horizontal" isDropDisabled={true}>
                    {(provided: any) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex flex-wrap items-center justify-center gap-3 p-6 bg-muted/30 rounded-2xl w-full"
                        >
                            {sourceItems.filter(s => !controlledTargetItems.some(t => t.id === s.id)).map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided: any, snapshot: any) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={cn(
                                                "transition-transform",
                                                snapshot.isDragging ? "scale-110 drop-shadow-xl z-50" : ""
                                            )}
                                        >
                                            <Card className="px-6 py-4 cursor-grab active:cursor-grabbing border-primary/20 bg-background hover:bg-primary/5">
                                                {item.content}
                                            </Card>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </DragDropContext>
    );
}
