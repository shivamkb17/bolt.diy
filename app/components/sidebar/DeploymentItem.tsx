import * as Dialog from '@radix-ui/react-dialog';
import { Link } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';
import { type Deployment } from '~/lib/stores/deployments';

interface DeploymentItemProps {
  description: string;
  item: Deployment;
  onDelete?: (event: React.UIEvent) => void;
}

export function DeploymentItem({ description, item, onDelete }: DeploymentItemProps) {
  const [hovering, setHovering] = useState(false);
  const hoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    function mouseEnter() {
      setHovering(true);

      if (timeout) {
        clearTimeout(timeout);
      }
    }

    function mouseLeave() {
      setHovering(false);
    }

    hoverRef.current?.addEventListener('mouseenter', mouseEnter);
    hoverRef.current?.addEventListener('mouseleave', mouseLeave);

    return () => {
      hoverRef.current?.removeEventListener('mouseenter', mouseEnter);
      hoverRef.current?.removeEventListener('mouseleave', mouseLeave);
    };
  }, []);

  return (
    <div
      ref={hoverRef}
      className="group cursor-pointer	flex flex-col rounded-md text-bolt-elements-textSecondary font-semibold hover:text-bolt-elements-textPrimary bg-bolt-elements-background-depth-4 hover:bg-bolt-elements-background-depth-3 overflow-hidden flex justify-between items-center px-2 py-2"
    >
      <Link to={item.service_url} target="_blank" className="flex flex-col gap-2 w-full relative truncate block">
        {description}

        <div className="flex items-center gap-12 w-full">
          <div className="text-[var(--bolt-elements-icon-success)] text-xs">{item.status}</div>
          <span className="text-[var(--bolt-elements-textSecondary)] text-xs">click to visit</span>
          <div className="z-1  flex justify-end group-hover:w-15 group-hover:from-45%">
            {hovering && (
              <div className="absolute right-0 bottom-0 pl-1 pt-1 pr-1 text-bolt-elements-textSecondary hover:text-bolt-elements-item-contentDanger">
                <Dialog.Trigger asChild>
                  <button
                    className="i-ph:trash scale-110"
                    onClick={(event) => {
                      // we prevent the default so we don't trigger the anchor above
                      event.preventDefault();
                      onDelete?.(event);
                    }}
                  />
                </Dialog.Trigger>
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
