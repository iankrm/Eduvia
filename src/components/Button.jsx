export function Button({
  as: Tag = 'button',
  variant = 'primary',
  size,
  fullWidth,
  symmetrical,
  className = '',
  children,
  ...rest
}) {
  const cls = [
    'c-button',
    `c-button--${variant}`,
    size ? `c-button--${size}` : '',
    fullWidth ? 'c-button--full-width' : '',
    symmetrical ? 'c-button--symmetrical' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
