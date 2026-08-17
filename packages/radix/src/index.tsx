import { DirectionProvider as RadixDirection } from "@radix-ui/react-direction";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import * as Select from "@radix-ui/react-select";
import type { ComponentProps, ReactNode } from "react";
import { DirectionProvider, useDirection, type DirectionProviderProps } from "@rtl-resolver/react";
import { radixDirectionProps, shouldReverseDomOrder } from "@rtl-resolver/adapters";

export { radixDirectionProps } from "@rtl-resolver/adapters";

export interface RadixDirectionProviderProps extends DirectionProviderProps {
  children: ReactNode;
}

function RadixDirectionBridge({ children }: { children: ReactNode }) {
  const { direction } = useDirection();
  return (
    <RadixDirection dir={direction}>
      <div dir={direction} data-rtl-reverse-dom={String(shouldReverseDomOrder().reverse)}>
        {children}
      </div>
    </RadixDirection>
  );
}

/** Radix DirectionProvider synchronized with rtl-resolver. */
export function RadixDirectionProvider(props: RadixDirectionProviderProps) {
  const { children, ...provider } = props;
  return (
    <DirectionProvider {...provider}>
      <RadixDirectionBridge>{children}</RadixDirectionBridge>
    </DirectionProvider>
  );
}

export function RadixDialog(props: ComponentProps<typeof Dialog.Root>) {
  return <Dialog.Root {...props} />;
}

export function RadixDialogContent({ children, ...props }: ComponentProps<typeof Dialog.Content>) {
  const { dir } = radixDirectionProps(useDirection().direction);
  return (
    <Dialog.Content {...props} dir={dir}>
      {children}
    </Dialog.Content>
  );
}

export const RadixDialogPortal = Dialog.Portal;
export const RadixDialogOverlay = Dialog.Overlay;
export const RadixDialogTitle = Dialog.Title;
export const RadixDialogClose = Dialog.Close;

export const RadixDropdownMenu = DropdownMenu.Root;
export function RadixDropdownMenuContent({ children, ...props }: ComponentProps<typeof DropdownMenu.Content>) {
  const { dir } = radixDirectionProps(useDirection().direction);
  return (
    <DropdownMenu.Content {...props}>
      <div dir={dir}>{children}</div>
    </DropdownMenu.Content>
  );
}

export const RadixPopover = Popover.Root;
export function RadixPopoverContent({ children, ...props }: ComponentProps<typeof Popover.Content>) {
  const { dir } = radixDirectionProps(useDirection().direction);
  return (
    <Popover.Content {...props}>
      <div dir={dir}>{children}</div>
    </Popover.Content>
  );
}

export const RadixSelect = Select.Root;
export function RadixSelectContent({ children, ...props }: ComponentProps<typeof Select.Content>) {
  const { dir } = radixDirectionProps(useDirection().direction);
  return (
    <Select.Content {...props}>
      <div dir={dir}>{children}</div>
    </Select.Content>
  );
}
