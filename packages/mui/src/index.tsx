import { createTheme, ThemeProvider } from "@mui/material/styles";
import Dialog, { type DialogProps } from "@mui/material/Dialog";
import Menu, { type MenuProps } from "@mui/material/Menu";
import Popover, { type PopoverProps } from "@mui/material/Popover";
import Select, { type SelectProps } from "@mui/material/Select";
import { useMemo, type ReactNode } from "react";
import { DirectionProvider, useDirection, type DirectionProviderProps } from "@rtl-resolver/react";
import { muiDialogProps, shouldReverseDomOrder } from "@rtl-resolver/adapters";

export { muiDialogProps, muiEmotionCacheOptions, muiThemeOptions } from "@rtl-resolver/adapters";

export interface MuiDirectionProviderProps extends DirectionProviderProps {
  children: ReactNode;
}

function MuiThemeBridge({ children }: { children: ReactNode }) {
  const { direction } = useDirection();
  const theme = useMemo(() => createTheme({ direction }), [direction]);
  return (
    <ThemeProvider theme={theme}>
      <div dir={direction} data-rtl-reverse-dom={String(shouldReverseDomOrder().reverse)}>
        {children}
      </div>
    </ThemeProvider>
  );
}

/** MUI ThemeProvider whose `theme.direction` follows rtl-resolver. Children stay in DOM order. */
export function MuiDirectionProvider(props: MuiDirectionProviderProps) {
  const { children, ...provider } = props;
  return (
    <DirectionProvider {...provider}>
      <MuiThemeBridge>{children}</MuiThemeBridge>
    </DirectionProvider>
  );
}

/** MUI Dialog with `dir` on the root and paper. Does not reverse children. */
export function MuiDirectionDialog({ children, ...props }: DialogProps) {
  const { direction } = useDirection();
  const directional = muiDialogProps(direction);
  return (
    <Dialog {...props} dir={directional.dir} PaperProps={{ ...props.PaperProps, ...directional.PaperProps }}>
      {children}
    </Dialog>
  );
}

/** MUI Menu with `dir` on the list. Does not reverse children. */
export function MuiDirectionMenu({ children, ...props }: MenuProps) {
  const { direction } = useDirection();
  return (
    <Menu {...props} dir={direction} MenuListProps={{ ...props.MenuListProps, dir: direction }}>
      {children}
    </Menu>
  );
}

/** MUI Popover paper follows toolkit direction. */
export function MuiDirectionPopover({ children, ...props }: PopoverProps) {
  const { direction } = useDirection();
  return (
    <Popover {...props} dir={direction} PaperProps={{ ...props.PaperProps, dir: direction }}>
      {children}
    </Popover>
  );
}

/** MUI Select menu follows toolkit direction. */
export function MuiDirectionSelect({ children, ...props }: SelectProps) {
  const { direction } = useDirection();
  return (
    <Select {...props} dir={direction} MenuProps={{ ...props.MenuProps, MenuListProps: { ...props.MenuProps?.MenuListProps, dir: direction } }}>
      {children}
    </Select>
  );
}
