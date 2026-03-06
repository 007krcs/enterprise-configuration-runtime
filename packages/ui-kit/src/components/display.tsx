import type { CSSProperties, HTMLAttributes, ReactNode, TableHTMLAttributes } from 'react';
import { cn, intentClass, variantClass, type PFBaseProps, type PFIntent } from './utils';

export interface PFCardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function PFCard({ className, elevated = false, ...rest }: PFCardProps) {
  return <article className={cn('pf-card', 'pf-surface-card', elevated && 'pf-card--elevated', className)} {...rest} />;
}

export type PFCardHeaderProps = HTMLAttributes<HTMLDivElement>;

export function PFCardHeader({ className, ...rest }: PFCardHeaderProps) {
  return <header className={cn('pf-card__header', className)} {...rest} />;
}

export type PFCardContentProps = HTMLAttributes<HTMLDivElement>;

export function PFCardContent({ className, ...rest }: PFCardContentProps) {
  return <div className={cn('pf-card__content', className)} {...rest} />;
}

export type PFCardActionsProps = HTMLAttributes<HTMLDivElement>;

export function PFCardActions({ className, ...rest }: PFCardActionsProps) {
  return <footer className={cn('pf-card__actions', className)} {...rest} />;
}

export interface PFChipProps extends PFBaseProps, HTMLAttributes<HTMLSpanElement> {
  variant?: 'filled' | 'outline';
  intent?: PFIntent | 'info';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  dismissLabel?: string;
  onDismiss?: () => void;
  onDelete?: () => void;
}

export function PFChip({
  className,
  variant = 'filled',
  intent = 'neutral',
  size = 'md',
  icon,
  dismissLabel = 'Remove chip',
  onDismiss,
  onDelete,
  children,
  ...rest
}: PFChipProps) {
  const dismissHandler = onDismiss ?? onDelete;
  const resolvedIntent = intent === 'info' ? 'primary' : intent;
  return (
    <span
      className={cn(
        'pf-chip',
        `pf-chip--${size}`,
        variantClass('pf-chip', variant),
        intentClass('pf-chip', resolvedIntent),
        intent === 'info' && 'pf-chip--info',
        className,
      )}
      {...rest}
    >
      {icon ? <span className="pf-chip__icon" aria-hidden="true">{icon}</span> : null}
      <span className="pf-chip__label">{children}</span>
      {dismissHandler ? (
        <button
          type="button"
          className="pf-chip__dismiss"
          onClick={dismissHandler}
          aria-label={dismissLabel}
        >
          x
        </button>
      ) : null}
    </span>
  );
}

export interface PFBadgeProps extends PFBaseProps, HTMLAttributes<HTMLSpanElement> {
  badgeContent?: ReactNode;
  intent?: Exclude<PFIntent, 'secondary'> | 'info';
  dot?: boolean;
  showZero?: boolean;
  max?: number;
}

export function PFBadge({
  className,
  badgeContent,
  dot = false,
  showZero = false,
  intent = 'primary',
  max = 99,
  children,
  ...rest
}: PFBadgeProps) {
  const resolvedIntent = intent === 'info' ? 'primary' : intent;
  const numeric =
    typeof badgeContent === 'number'
      ? badgeContent
      : typeof badgeContent === 'string' && badgeContent.trim().length > 0
        ? Number(badgeContent)
        : null;
  const hiddenForZero = !dot && !showZero && numeric === 0;
  const hiddenForEmpty = !dot && badgeContent === undefined;
  const hidden = hiddenForZero || hiddenForEmpty;
  const normalizedCount =
    dot ? '' : typeof badgeContent === 'number' && badgeContent > max ? `${max}+` : badgeContent;
  return (
    <span className={cn('pf-badge', dot && 'pf-badge--dot', className)} {...rest}>
      {children}
      {!hidden ? (
        <span
          className={cn(
            'pf-badge__content',
            dot && 'pf-badge__content--dot',
            intentClass('pf-badge__content', resolvedIntent),
            intent === 'info' && 'pf-badge__content--info',
          )}
          aria-label={dot ? 'Status indicator' : undefined}
        >
          {normalizedCount}
        </span>
      ) : null}
    </span>
  );
}

export interface PFAvatarProps extends PFBaseProps, HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  sizePx?: number;
}

export function PFAvatar({
  className,
  src,
  alt,
  name,
  size,
  sizePx = 36,
  ...rest
}: PFAvatarProps) {
  const initials = name
    ?.split(/\s+/)
    .slice(0, 2)
    .map((token) => token.charAt(0).toUpperCase())
    .join('');
  const resolvedSize =
    size ?? (sizePx <= 32 ? 'sm' : sizePx >= 44 ? 'lg' : 'md');
  const sizeClass = `pf-avatar--${resolvedSize}`;
  return (
    <div className={cn('pf-avatar', sizeClass, className)} {...rest}>
      {src ? <img src={src} alt={alt ?? name ?? 'Avatar'} /> : <span>{initials ?? '?'}</span>}
    </div>
  );
}

export interface PFTableColumn<RowType> {
  id: keyof RowType | string;
  header: ReactNode;
  align?: 'left' | 'right' | 'center';
  cell?: (row: RowType, index: number) => ReactNode;
}

export interface PFTableProps<RowType extends Record<string, unknown>>
  extends Omit<TableHTMLAttributes<HTMLTableElement>, 'children'> {
  columns: PFTableColumn<RowType>[];
  rows: RowType[];
  rowKey?: (row: RowType, index: number) => string;
  emptyState?: ReactNode;
}

export function PFTable<RowType extends Record<string, unknown>>({
  columns,
  rows,
  rowKey,
  emptyState = 'No rows available.',
  className,
  ...rest
}: PFTableProps<RowType>) {
  return (
    <div className={cn('pf-table-wrap', 'pf-surface-table')}>
      <table className={cn('pf-table', className)} {...rest}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.id)}
                className={cn(
                  column.align === 'center'
                    ? 'pf-table__cell--center'
                    : column.align === 'right'
                      ? 'pf-table__cell--right'
                      : 'pf-table__cell--left',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="pf-table__empty">
                {emptyState}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const key = rowKey ? rowKey(row, index) : String(index);
              return (
                <tr key={key}>
                  {columns.map((column) => {
                    const value =
                      column.cell?.(row, index) ??
                      (row[column.id as keyof RowType] as ReactNode);
                    return (
                      <td
                        key={String(column.id)}
                        className={cn(
                          column.align === 'center'
                            ? 'pf-table__cell--center'
                            : column.align === 'right'
                              ? 'pf-table__cell--right'
                              : 'pf-table__cell--left',
                        )}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface PFDividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical';
  inset?: boolean;
}

export function PFDivider({
  className,
  orientation = 'horizontal',
  inset = false,
  ...rest
}: PFDividerProps) {
  return (
    <hr
      className={cn('pf-divider', `pf-divider--${orientation}`, inset && 'pf-divider--inset', className)}
      {...rest}
    />
  );
}

/* ──── PFList ──── */

export interface PFListProps extends HTMLAttributes<HTMLUListElement> {
  dense?: boolean;
}

export function PFList({ className, dense = false, ...rest }: PFListProps) {
  return <ul className={cn('pf-list', dense && 'pf-list--dense', className)} {...rest} />;
}

export interface PFListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'onClick'> {
  icon?: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  action?: ReactNode;
  selected?: boolean;
  button?: boolean;
  href?: string;
  onClick?: () => void;
}

export function PFListItem({
  className,
  icon,
  primary,
  secondary,
  action,
  selected = false,
  button = false,
  href,
  children,
  onClick,
  ...rest
}: PFListItemProps) {
  const content = (
    <>
      {icon ? <span className="pf-list-item__icon" aria-hidden="true">{icon}</span> : null}
      {primary || secondary ? (
        <span className="pf-list-item__text">
          {primary ? <span className="pf-list-item__primary">{primary}</span> : null}
          {secondary ? <span className="pf-list-item__secondary">{secondary}</span> : null}
        </span>
      ) : (
        <span className="pf-list-item__text">{children}</span>
      )}
      {action ? <span className="pf-list-item__action">{action}</span> : null}
    </>
  );

  if (href) {
    return (
      <li {...rest}>
        <a className={cn('pf-list-item', selected && 'is-selected', className)} href={href} onClick={() => onClick?.()}>
          {content}
        </a>
      </li>
    );
  }

  if (button || onClick) {
    return (
      <li {...rest}>
        <button
          type="button"
          className={cn('pf-list-item', selected && 'is-selected', className)}
          onClick={() => onClick?.()}
        >
          {content}
        </button>
      </li>
    );
  }

  return (
    <li className={cn('pf-list-item', selected && 'is-selected', className)} {...rest}>
      {content}
    </li>
  );
}

export function PFListDivider({ className, ...rest }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('pf-list-divider', className)} {...rest} />;
}

export function PFListSubheader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('pf-list-subheader', className)} {...rest} />;
}

/* ──── PFPaper ──── */

export interface PFPaperProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: 0 | 1 | 2 | 3 | 4;
  variant?: 'elevation' | 'outlined';
  square?: boolean;
  padded?: boolean;
}

export function PFPaper({
  className,
  elevation = 1,
  variant = 'elevation',
  square = false,
  padded = false,
  ...rest
}: PFPaperProps) {
  return (
    <div
      className={cn(
        'pf-paper',
        variant === 'outlined' ? 'pf-paper--outlined' : `pf-paper--elevation-${elevation}`,
        square && 'pf-paper--square',
        padded && 'pf-paper--padded',
        className,
      )}
      {...rest}
    />
  );
}

/* ──── PFImageList ──── */

export interface PFImageListProps extends HTMLAttributes<HTMLUListElement> {
  variant?: 'standard' | 'masonry';
  cols?: number;
  colWidth?: string;
}

export function PFImageList({
  className,
  variant = 'standard',
  cols = 3,
  colWidth = '200px',
  style,
  ...rest
}: PFImageListProps) {
  const mergedStyle = {
    ...style,
    '--pf-image-list-col-width': colWidth,
    '--pf-image-list-cols': String(cols),
  } as CSSProperties;
  return (
    <ul
      className={cn('pf-image-list', variant === 'masonry' && 'pf-image-list--masonry', className)}
      style={mergedStyle}
      {...rest}
    />
  );
}

export interface PFImageListItemProps extends HTMLAttributes<HTMLLIElement> {
  src?: string;
  alt?: string;
  overlayTitle?: string;
}

export function PFImageListItem({
  className,
  src,
  alt = '',
  overlayTitle,
  children,
  ...rest
}: PFImageListItemProps) {
  return (
    <li className={cn('pf-image-list__item', className)} {...rest}>
      {src ? <img src={src} alt={alt} /> : children}
      {overlayTitle ? <div className="pf-image-list__overlay">{overlayTitle}</div> : null}
    </li>
  );
}

/* ──── PFLink ──── */

export interface PFLinkProps extends HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  target?: string;
  rel?: string;
  muted?: boolean;
}

export function PFLink({
  className,
  muted = false,
  ...rest
}: PFLinkProps) {
  return (
    <a className={cn('pf-link', muted && 'pf-link--muted', className)} {...rest} />
  );
}

export type PFTypographyVariant =
  | 'body1'
  | 'body2'
  | 'body-sm'
  | 'body-md'
  | 'body-lg'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'caption'
  | 'code'
  | 'label';

export interface PFTypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: PFTypographyVariant;
  as?: keyof HTMLElementTagNameMap;
  muted?: boolean;
}

const variantTagMap: Record<PFTypographyVariant, keyof HTMLElementTagNameMap> = {
  body1: 'p',
  body2: 'p',
  'body-sm': 'p',
  'body-md': 'p',
  'body-lg': 'p',
  label: 'span',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  caption: 'span',
  code: 'code',
};

export function PFTypography({
  className,
  variant = 'body1',
  as,
  muted = false,
  ...rest
}: PFTypographyProps) {
  const Tag = (as ?? variantTagMap[variant]) as keyof HTMLElementTagNameMap;
  return <Tag className={cn('pf-typography', `pf-typography--${variant}`, muted && 'is-muted', className)} {...rest} />;
}
