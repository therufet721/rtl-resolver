import { Dialog, DialogPanel, DialogTitle, Menu, MenuItems, Popover, PopoverPanel, Listbox, ListboxOptions } from "@headlessui/react";
import type { ComponentProps, ReactNode } from "react";
import { DirectionProvider, useDirection, type DirectionProviderProps } from "@rtl-resolver/react";
import { headlessUiDirectionProps, shouldReverseDomOrder } from "@rtl-resolver/adapters";

export { headlessUiDirectionProps } from "@rtl-resolver/adapters";

export interface HeadlessUiDirectionProviderProps extends DirectionProviderProps {
  children: ReactNode;
}

function HeadlessDirectionBridge({ children }: { children: ReactNode }) {
  const { direction } = useDirection();
  const { dir } = headlessUiDirectionProps(direction);
  return (
    <div dir={dir} data-rtl-reverse-dom={String(shouldReverseDomOrder().reverse)}>
      {children}
    </div>
  );
}

/** Headless UI subtree whose `dir` follows rtl-resolver. */
export function HeadlessUiDirectionProvider(props: HeadlessUiDirectionProviderProps) {
  const { children, ...provider } = props;
  return (
    <DirectionProvider {...provider}>
      <HeadlessDirectionBridge>{children}</HeadlessDirectionBridge>
    </DirectionProvider>
  );
}

export function HeadlessDialog(props: ComponentProps<typeof Dialog>) {
  return <Dialog {...props} />;
}

export function HeadlessDialogPanel(props: ComponentProps<typeof DialogPanel>) {
  const { dir } = headlessUiDirectionProps(useDirection().direction);
  return (
    <div dir={dir}>
      <DialogPanel {...props} />
    </div>
  );
}

export function HeadlessDialogTitle(props: ComponentProps<typeof DialogTitle>) {
  return <DialogTitle {...props} />;
}

export const HeadlessMenu = Menu;

export function HeadlessMenuItems(props: ComponentProps<typeof MenuItems>) {
  const { dir } = headlessUiDirectionProps(useDirection().direction);
  return (
    <div dir={dir}>
      <MenuItems {...props} />
    </div>
  );
}

export const HeadlessPopover = Popover;

export function HeadlessPopoverPanel(props: ComponentProps<typeof PopoverPanel>) {
  const { dir } = headlessUiDirectionProps(useDirection().direction);
  return (
    <div dir={dir}>
      <PopoverPanel {...props} />
    </div>
  );
}

export const HeadlessListbox = Listbox;

export function HeadlessListboxOptions(props: ComponentProps<typeof ListboxOptions>) {
  const { dir } = headlessUiDirectionProps(useDirection().direction);
  return (
    <div dir={dir}>
      <ListboxOptions {...props} />
    </div>
  );
}
