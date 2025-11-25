import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {React.Children.map(children, (child) => {
        // ArrowUpDown 버튼에만 drag handle 제공
        if (
          React.isValidElement(child) &&
          child.props["data-drag-handle"] === true
        ) {
          return React.cloneElement(child, {
            ...child.props,
            ...attributes,
            ...listeners,
          });
        }
        return child;
      })}
    </tr>
  );
}
