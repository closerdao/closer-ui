import { useState } from 'react';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TiDelete } from '@react-icons/all-files/ti/TiDelete';
import { useTranslations } from 'next-intl';

import Heading from './ui/Heading';
import Photo from './Photo';
import UploadPhoto from './UploadPhoto/UploadPhoto';

// Sortable photo item component
const SortablePhotoItem = ({ id, onDelete }) => {
  const t = useTranslations();
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Apply drag listeners only to the photo, not the delete button */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <Photo id={id} />
      </div>

      {/* Delete button outside drag listeners */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Stop propagation to prevent drag events
          if (confirm(t('photos_editor_confirm_delete'))) {
            onDelete(id);
          }
        }}
        className="absolute flex top-0 right-0 z-10 p-1"
      >
        <TiDelete className=" text-red-500 drop-shadow text-3xl shadow-md" />
      </a>
    </div>
  );
};

const PhotosEditor = ({ value, onChange }) => {
  const t = useTranslations();

  const hasMultiplePhotos = Array.isArray(value);
  const [photos, setPhotos] = useState(
    hasMultiplePhotos ? value : [value].filter(Boolean),
  );
  const [activeId, setActiveId] = useState(null);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Add activation constraints to make deletion easier
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );


  const addPhoto = (photo) => {
    const update = (photos || []).concat(photo);
    setPhotos(update);
    onChange && onChange(update);
  };

  const deletePhoto = (photo) => {
    const update = (photos || []).filter((id) => id !== photo);
    setPhotos(update);
    onChange && onChange(update);
  };

  // Handle drag end event
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setPhotos((photos) => {
        const oldIndex = photos.indexOf(active.id);
        const newIndex = photos.indexOf(over.id);

        const updatedPhotos = arrayMove(photos, oldIndex, newIndex);
        onChange && onChange(updatedPhotos);
        return updatedPhotos;
      });
    }

    setActiveId(null);
  };

  // Handle drag start
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  return (
    <div className="photo-group ">
      <Heading level={5} className="mb-4">
        {t('photos_drag_and_drop')}
      </Heading>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-8 gap-4 mb-4">
          {photos && photos.length > 0 ? (
            <SortableContext items={photos} strategy={rectSortingStrategy}>
              {photos.map((photo) => (
                <SortablePhotoItem
                  key={photo}
                  id={photo}
                  onDelete={deletePhoto}
                />
              ))}
            </SortableContext>
          ) : (
            <div className="w-full py-4">
              <p className="italic">{t('photos_editor_no_photos')}</p>
            </div>
          )}
        </div>

        {/* Drag overlay to show the item being dragged */}
        <DragOverlay>
          {activeId ? (
            <div className="relative opacity-80">
              <Photo id={activeId} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="actions">
        <UploadPhoto
          isMinimal
          onSave={(id) => addPhoto(id)}
          label="Add photo"
        />
      </div>
    </div>
  );
};

PhotosEditor.defaultProps = {
  onChange: null,
  value: [],
};

export default PhotosEditor;
